import React, { useMemo, useRef, useCallback, useState, useEffect } from 'react';
import ForceGraph2D, { type ForceGraphMethods } from 'react-force-graph-2d';
import { Link as LinkIcon, GitMerge, Brain, Hand, BarChart2, Zap, Check, MapPin, Trash2 } from 'lucide-react';
import { forceCollide, forceRadial } from 'd3-force';
import type { Card } from '../types';
import { useTheme } from '../context/ThemeContext';
import { computePrecisionGraph } from '../semanticSearch';
import { searchCards } from '../searchIndex';
import { detectCommunities } from '../algorithms/communityDetection';
import { findStrongestPath } from '../algorithms/graphAlgorithms';
import { getLearnedAbbreviations } from '../learnedAbbreviations';
import { getLinkFeedback } from '../linkFeedback';

interface NetworkViewProps {
    cards: Card[];
    onNodeClick: (cardId: string) => void;
    searchQuery?: string;
    activeFilters?: string[];
    highlightedIds?: Set<string>;
    onSuppressConnections?: (pairs: { sourceId: string, targetId: string }[]) => void;
    semanticReady?: boolean;
    vetoPairs?: string[]; // Hard constraints from user feedback
    typeCompat?: Record<string, number>; // Type compatibility matrix
}

interface Node {
    id: string;
    name: string;
    type: string;
    // ForceGraph adds these
    x?: number;
    y?: number;
    vx?: number;
    vy?: number;
    index?: number;
    // Added for dynamic sizing
    val?: number;
}

interface Link {
    source: string | Node;
    target: string | Node;
    type?: string; // 'semantic', 'explicit', 'hybrid', 'rrf' or undefined (structural)
    value?: number;
    reason?: string; // Human-readable explanation for hover tooltip
    quality?: 'boost' | 'match' | 'weak';
}

export const NetworkView: React.FC<NetworkViewProps> = ({
    cards,
    onNodeClick,
    searchQuery,
    activeFilters = [],
    highlightedIds,
    onSuppressConnections,
    semanticReady,
    vetoPairs,
    typeCompat
}) => {
    const { getCategoryColor } = useTheme();
    const fgRef = useRef<ForceGraphMethods | undefined>(undefined);
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
    const [graphData, setGraphData] = useState<{ nodes: Node[], links: Link[] }>({ nodes: [], links: [] });
    const [isCalculating, setIsCalculating] = useState(false);
    // Key to force-remount the graph component on updates (User Request: "Like switching tabs")
    const [remountKey, setRemountKey] = useState(0);

    // Pathfinding Mode State
    const [pathMode, setPathMode] = useState(false);
    const [pathStart, setPathStart] = useState<string | null>(null);
    const [pathEnd, setPathEnd] = useState<string | null>(null);
    const [pathResult, setPathResult] = useState<string[] | null>(null);



    // Depth filter state: 0 = show all, 1-3 = show neighbors at depth N
    const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);
    const [depthFilter, setDepthFilter] = useState<number>(0); // 0 = all, 1/2/3 = depth

    // Precision Links State
    const [smartLinks, setSmartLinks] = useState<Link[]>([]);
    // Spotlight State
    const [hoverNode, setHoverNode] = useState<Node | null>(null);
    const [activeNodeIds, setActiveNodeIds] = useState<Set<string>>(new Set());

    // Position cache to prevent graph "jumping" on updates
    const positionCache = useRef<Map<string, { x: number, y: number }>>(new Map());

    // Incremental computation: track previous state
    const previousCardsRef = useRef<Card[]>([]);
    const cachedLinksRef = useRef<Link[]>([]);

    // Link hover tooltip state
    const [hoverLink, setHoverLink] = useState<Link | null>(null);

    // Web Worker for graph computation (with incremental support)
    useEffect(() => {
        if (cards.length === 0) {
            setGraphData({ nodes: [], links: [] });
            setIsCalculating(false);
            previousCardsRef.current = [];
            cachedLinksRef.current = [];
            return;
        }

        setIsCalculating(true);
        const worker = new Worker(new URL('../workers/graph.worker.ts', import.meta.url), { type: 'module' });

        const timeout = setTimeout(() => {
            setIsCalculating(false);
            console.warn('Graph worker timeout - forcing UI update');
        }, 5000);

        // Incremental diff: detect which cards changed
        const prevMap = new Map(previousCardsRef.current.map(c => [c.id, c]));
        const changedIds: string[] = [];

        for (const card of cards) {
            const prev = prevMap.get(card.id);
            if (!prev ||
                prev.title !== card.title ||
                prev.content !== card.content ||
                prev.details !== card.details ||
                JSON.stringify(prev.tags) !== JSON.stringify(card.tags)) {
                changedIds.push(card.id);
            }
        }
        // Also detect deleted cards (their links must be removed)
        for (const prev of previousCardsRef.current) {
            if (!cards.find(c => c.id === prev.id)) {
                changedIds.push(prev.id);
            }
        }

        // Get abbreviations for the worker
        const abbreviations = getLearnedAbbreviations();

        // Build existing links (from cache, as simple source/target strings)
        const existingLinks = cachedLinksRef.current.map(l => ({
            source: typeof l.source === 'string' ? l.source : (l.source as any).id,
            target: typeof l.target === 'string' ? l.target : (l.target as any).id,
            value: l.value || 0,
            reason: l.reason || ''
        }));

        worker.onmessage = (e) => {
            clearTimeout(timeout);
            const newData = e.data;

            // Only use cache if it's an incremental update and we have valid positions
            const useCache = isFullRecompute === false && positionCache.current.size > 0;

            newData.nodes = newData.nodes.map((node: Node) => {
                if (useCache) {
                    const cached = positionCache.current.get(node.id);
                    if (cached && Number.isFinite(cached.x) && Number.isFinite(cached.y)) {
                        return { ...node, x: cached.x, y: cached.y, fx: undefined, fy: undefined };
                    }
                }
                return node;
            });

            // Reheat simulation if we have new nodes or full recompute
            if (fgRef.current) {
                fgRef.current.d3ReheatSimulation();
                if (isFullRecompute) {
                    fgRef.current.zoomToFit(400, 50);
                }
            }

            // Cache the structural links for incremental next time
            cachedLinksRef.current = newData.links;
            previousCardsRef.current = [...cards];

            // Track stats for the intelligence dashboard
            if (newData.links.length > 0) {
                import('../linkFeedback').then(m => m.recordLinksGenerated(newData.links.length));
            }

            setGraphData(newData);
            // Force remount only on full recomputes or significant updates
            if (isFullRecompute || newData.nodes.length !== graphData.nodes.length) {
                setRemountKey(prev => prev + 1);
            }
            setIsCalculating(false);
            worker.terminate();
        };

        worker.onerror = (err) => {
            clearTimeout(timeout);
            console.error('Graph worker error:', err);
            setIsCalculating(false);
            worker.terminate();
        };

        // Send enhanced message format
        const isFullRecompute = changedIds.length === cards.length || previousCardsRef.current.length === 0;
        const feedbackData = getLinkFeedback();
        worker.postMessage({
            cards,
            abbreviations,
            feedback: feedbackData,
            changedIds: isFullRecompute ? undefined : changedIds,
            existingLinks: isFullRecompute ? undefined : existingLinks
        });

        return () => {
            clearTimeout(timeout);
            worker.terminate();
        };
    }, [cards]);

    // Precision Graph Effect - must wait for semantic search to build embeddings
    useEffect(() => {

        if (cards.length > 0 && semanticReady) {
            console.log('Computing precision graph (semantic ready, cards:', cards.length, ')');
            // Pass user feedback (veto list) and type logic to semantic engine
            // Also pass searchCards for RRF (Keyword Search)
            computePrecisionGraph(cards, vetoPairs, typeCompat, searchCards).then(links => {
                console.log('Precision graph computed:', links.length, 'links found');
                setSmartLinks(links.map(l => ({
                    source: l.source,
                    target: l.target,
                    type: l.type, // 'explicit', 'semantic', 'hybrid', 'rrf'
                    value: l.value
                })));
            });
        }
    }, [cards, semanticReady]);

    // ... (savePositions and resize effects unchanged)

    // ...

    // Link force: distance depends on link value


    // Collision to prevent overlap


    // ... (savePositions and resize effects unchanged)
    useEffect(() => {
        const savePositions = () => {
            if (fgRef.current && graphData.nodes.length > 0) {
                graphData.nodes.forEach((node: any) => {
                    if (node.x !== undefined && node.y !== undefined) {
                        positionCache.current.set(node.id, { x: node.x, y: node.y });
                    }
                });
            }
        };

        const interval = setInterval(savePositions, 2000);
        return () => clearInterval(interval);
    }, [graphData]);

    useEffect(() => {
        const updateDimensions = () => {
            if (containerRef.current) {
                setDimensions({
                    width: containerRef.current.clientWidth,
                    height: containerRef.current.clientHeight
                });
            }
        };

        window.addEventListener('resize', updateDimensions);
        updateDimensions();
        setTimeout(updateDimensions, 100);

        return () => window.removeEventListener('resize', updateDimensions);
    }, []);

    // Combine links (Structural + Semantic + Manual)
    const allLinks = useMemo(() => {
        const manualLinks: Link[] = [];
        const nodeMap = new Map(graphData.nodes.map(n => [n.id, n as any]));

        graphData.nodes.forEach(node => {
            const cardNode = node as any;
            if (cardNode.manualConnections) {
                cardNode.manualConnections.forEach((targetId: string) => {
                    // Safety: Ensure target exists
                    if (nodeMap.has(targetId)) {
                        manualLinks.push({
                            source: node.id,
                            target: targetId,
                            type: 'manual',
                            value: 1.0
                        });
                    }
                });
            }
        });

        // Combine Structural + Precision Links & Filter invalid nodes
        const combinedLinks = [...graphData.links, ...smartLinks].filter(link => {
            const sourceId = typeof link.source === 'string' ? link.source : (link.source as any).id;
            const targetId = typeof link.target === 'string' ? link.target : (link.target as any).id;

            // User Request (Context): Re-enabled semantic links for precision
            // if (link.type === 'semantic') return false; // Kept active

            return nodeMap.has(sourceId) && nodeMap.has(targetId);
        });

        // Filter based on suppression
        const aiLinks = combinedLinks.filter(link => {
            const sourceId = typeof link.source === 'string' ? link.source : (link.source as any).id;
            const targetId = typeof link.target === 'string' ? link.target : (link.target as any).id;

            const sourceNode = nodeMap.get(sourceId);
            const targetNode = nodeMap.get(targetId);

            // Check if Source suppresses Target
            if (sourceNode?.suppressedConnections?.includes(targetId)) return false;

            // Check if Target suppresses Source
            if (targetNode?.suppressedConnections?.includes(sourceId)) return false;

            return true;
        });

        // Deduplication: Manual > AI (Prioritized)
        const uniqueLinks = new Map<string, Link>();

        // 1. Manual (Highest Priority)
        manualLinks.forEach(link => {
            const sourceId = typeof link.source === 'string' ? link.source : (link.source as any).id;
            const targetId = typeof link.target === 'string' ? link.target : (link.target as any).id;
            const key = [sourceId, targetId].sort().join('-');
            uniqueLinks.set(key, link);
        });

        // 2. AI (Prioritize Explict > Hybrid > Structural > Semantic)
        const sortedAiLinks = aiLinks.sort((a, b) => {
            const getScore = (l: Link) => {
                if (l.type === 'explicit') return 5;
                if (l.type === 'hybrid') return 4;
                if (!l.type) return 3; // Structural
                if (l.type === 'semantic') return 1;
                return 0;
            };
            return getScore(b) - getScore(a);
        });

        sortedAiLinks.forEach(link => {
            const sourceId = typeof link.source === 'string' ? link.source : (link.source as any).id;
            const targetId = typeof link.target === 'string' ? link.target : (link.target as any).id;
            const key = [sourceId, targetId].sort().join('-');
            if (!uniqueLinks.has(key)) uniqueLinks.set(key, link);
        });

        const finalLinks = Array.from(uniqueLinks.values()).map(link => {
            // CRITICAL FIX: D3 mutates link objects (source/target become objects).
            // When graphData updates, we MUST break the reference and pass string IDs again
            // to force D3 to re-bind to the NEW node objects.
            return {
                ...link,
                source: typeof link.source === 'string' ? link.source : (link.source as any).id,
                target: typeof link.target === 'string' ? link.target : (link.target as any).id
            };
        });

        console.log(`[NetworkView] Links update: ${finalLinks.length} total (Manual: ${manualLinks.length}, AI: ${aiLinks.length}, Smart: ${smartLinks.length}, Structural: ${graphData.links.length})`);
        return finalLinks;
    }, [graphData.nodes, graphData.links, smartLinks]);

    // AI Community Detection
    const communityMap = useMemo(() => {
        if (graphData.nodes.length === 0) return new Map<string, string>();
        return detectCommunities(graphData.nodes, allLinks);
    }, [graphData.nodes, allLinks]);

    const communityColorMap = useMemo(() => {
        const colors = new Map<string, string>();
        const communities = new Set(communityMap.values());
        // Extended Palette
        const palette = [
            '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e', // Red, Orange, Amber, Lime, Green
            '#06b6d4', '#3b82f6', '#6366f1', '#a855f7', '#d946ef', // Cyan, Blue, Indigo, Purple, Fuchsia
            '#f43f5e', '#be123c', '#be185d', '#a21caf', '#7c3aed', // Rose, others
            '#4338ca', '#1d4ed8', '#0e7490', '#0f766e', '#15803d'  // Darker shades
        ];
        let i = 0;
        communities.forEach(c => {
            colors.set(c, palette[i % palette.length]);
            i++;
        });
        return colors;
    }, [communityMap]);

    // Determine highlighted nodes based on search
    const highlightedNodeIds = useMemo(() => {
        if (highlightedIds) return highlightedIds;

        if (!searchQuery) return new Set<string>();

        // Fallback for standalone usage
        const query = searchQuery.toLowerCase();
        const matches = cards.filter(c =>
            c.title.toLowerCase().includes(query) ||
            c.content.toLowerCase().includes(query) ||
            c.tags.some(t => t.toLowerCase().includes(query))
        );
        return new Set(matches.map(m => m.id));
    }, [cards, searchQuery, highlightedIds]);

    const getNeighborsAtDepth = useCallback((startId: string, maxDepth: number, links: Link[]) => {
        const visited = new Set<string>([startId]);
        const queue: [string, number][] = [[startId, 0]];
        const adjacency = new Map<string, Set<string>>();
        links.forEach(link => {
            const sourceId = typeof link.source === 'string' ? link.source : (link.source as Node).id;
            const targetId = typeof link.target === 'string' ? link.target : (link.target as Node).id;
            if (!adjacency.has(sourceId)) adjacency.set(sourceId, new Set());
            if (!adjacency.has(targetId)) adjacency.set(targetId, new Set());
            adjacency.get(sourceId)!.add(targetId);
            adjacency.get(targetId)!.add(sourceId);
        });

        while (queue.length > 0) {
            const [currentId, depth] = queue.shift()!;
            if (depth >= maxDepth) continue;
            const neighbors = adjacency.get(currentId) || new Set();
            neighbors.forEach(neighborId => {
                if (!visited.has(neighborId)) {
                    visited.add(neighborId);
                    queue.push([neighborId, depth + 1]);
                }
            });
        }
        return visited;
    }, []);

    // Filter graph data
    const filteredGraphData = useMemo(() => {
        if (depthFilter === 0 || !focusedNodeId) {
            return { nodes: graphData.nodes, links: allLinks };
        }
        const visibleNodeIds = getNeighborsAtDepth(focusedNodeId, depthFilter, allLinks);
        return {
            nodes: graphData.nodes.filter(n => visibleNodeIds.has(n.id)),
            links: allLinks.filter(link => {
                const sourceId = typeof link.source === 'string' ? link.source : (link.source as Node).id;
                const targetId = typeof link.target === 'string' ? link.target : (link.target as Node).id;
                return visibleNodeIds.has(sourceId) && visibleNodeIds.has(targetId);
            })
        };
    }, [graphData.nodes, allLinks, focusedNodeId, depthFilter, getNeighborsAtDepth]);

    // ... (handleNodeClick and nodeCanvasObject unchanged)
    const handleNodeClick = useCallback((node: Node) => {
        if (pathMode) {
            // Pathfinding Logic
            if (!pathStart) {
                setPathStart(node.id);
                setPathResult(null);
            } else if (!pathEnd) {
                setPathEnd(node.id);
                // Compute path
                const path = findStrongestPath(
                    filteredGraphData.nodes,
                    filteredGraphData.links as any[], // Casting for simple graph struct
                    pathStart,
                    node.id
                );
                setPathResult(path);
            } else {
                // Reset if both set
                setPathStart(node.id);
                setPathEnd(null);
                setPathResult(null);
            }
            return;
        }

        if (focusedNodeId === node.id) {
            setFocusedNodeId(null);
        } else if (depthFilter > 0) {
            setFocusedNodeId(node.id);
        }
        onNodeClick(node.id);
        fgRef.current?.centerAt(node.x!, node.y!, 1000);
        fgRef.current?.zoom(3, 1000);
    }, [onNodeClick, focusedNodeId, depthFilter, pathMode, pathStart, pathEnd, filteredGraphData]);

    // Canvas Object: Nodes (Spotlight + Community + Path)
    const nodeCanvasObject = useCallback((node: Node, ctx: CanvasRenderingContext2D, globalScale: number) => {
        const isHovered = hoverNode !== null;
        const isActive = activeNodeIds.has(node.id);
        const isSearchMatch = highlightedNodeIds.size === 0 || highlightedNodeIds.has(node.id);
        const isTypeSelected = activeFilters.length === 0 || activeFilters.includes(node.type);

        // Path highlighting
        const isPathStart = pathStart === node.id;
        const isPathEnd = pathEnd === node.id;
        const isPathNode = pathResult?.includes(node.id);
        const isPathRelated = isPathStart || isPathEnd || isPathNode;

        // Spotlight Dimming Logic
        let opacity = 1;

        if (pathMode) {
            // In path mode, dim everything except path
            if (pathStart || pathResult) {
                opacity = isPathRelated ? 1 : 0.1;
            }
        } else if (isHovered) {
            opacity = isActive ? 1 : 0.1;
        } else if (highlightedNodeIds.size > 0) {
            opacity = (isSearchMatch && isTypeSelected) ? 1 : 0.1;
        } else if (!isTypeSelected) {
            opacity = 0.1;
        }

        ctx.globalAlpha = opacity;

        const label = node.name;
        // Modified: use node.val for sizing
        const importance = node.val || 1;
        const baseR = 4 + (importance * 1.5);

        const isMatched = (isSearchMatch && isTypeSelected);
        let r = baseR;
        if (isMatched && highlightedNodeIds.size > 0) r = baseR * 1.2;
        if (isPathStart || isPathEnd) r = baseR * 1.5;

        // Visual Coherence: Use community color for fill
        const community = communityMap.get(node.id);
        let communityColor = community ? communityColorMap.get(community) : undefined;
        let finalColor = communityColor || getCategoryColor(node.type);

        // Path Colors
        if (isPathStart) finalColor = '#22c55e'; // Green
        else if (isPathEnd) finalColor = '#ef4444'; // Red
        else if (isPathNode) finalColor = '#eab308'; // Yellow

        // Glow for active/hovered nodes
        if (isActive && isHovered) {
            ctx.beginPath();
            ctx.arc(node.x!, node.y!, r + 6, 0, 2 * Math.PI, false);
            ctx.fillStyle = finalColor;
            ctx.globalAlpha = 0.2;
            ctx.fill();
            ctx.globalAlpha = opacity; // Restore
        }

        ctx.beginPath();
        ctx.arc(node.x!, node.y!, r, 0, 2 * Math.PI, false);
        ctx.fillStyle = finalColor;
        ctx.fill();

        // Stroke
        ctx.lineWidth = (isMatched && highlightedNodeIds.size > 0) || isPathRelated ? 2.5 : 1.5;
        ctx.strokeStyle = '#ffffff';

        // Dashed stroke for intermediate path nodes
        if (isPathNode && !isPathStart && !isPathEnd) {
            ctx.setLineDash([2, 2]);
            ctx.strokeStyle = '#713f12';
        }

        ctx.stroke();
        ctx.setLineDash([]); // Reset
        ctx.globalAlpha = 1;

        // Text
        const fontSize = Math.max(4, 12 / globalScale);
        // Show if: Matched, Active (Hover), or No Hover and proper zoom OR Path Node
        const shouldShowLabel = isActive || (isMatched && highlightedNodeIds.size > 0) || (!isHovered && globalScale > 0.6) || isPathRelated;

        if (shouldShowLabel && opacity > 0.2) {
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.font = `${(isMatched || isActive || isPathRelated) ? '600' : '500'} ${fontSize}px Inter, system-ui, sans-serif`;

            // Halo
            ctx.lineJoin = 'round';
            ctx.lineWidth = 3;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.strokeText(label, node.x!, node.y! + r + 3);

            ctx.fillStyle = '#1e293b';
            ctx.fillText(label, node.x!, node.y! + r + 3);
        }
        ctx.globalAlpha = 1;
    }, [highlightedNodeIds, activeFilters, communityMap, communityColorMap, hoverNode, activeNodeIds, getCategoryColor, pathMode, pathStart, pathEnd, pathResult]);

    // Canvas Object: Links (Gradient + Spotlight + Value-based thickness)
    const linkCanvasObject = useCallback((link: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
        const isSemantic = link.type === 'semantic';
        const isManual = link.type === 'manual';
        const isExplicit = link.type === 'explicit';
        const isHybrid = link.type === 'hybrid';
        const linkValue = link.value || 0.5;

        // Path highlighting logic
        let isPathLink = false;
        if (pathResult && pathResult.length > 1) {
            const sid = link.source.id;
            const tid = link.target.id;
            // Check if this link connects two consecutive nodes in the path
            for (let i = 0; i < pathResult.length - 1; i++) {
                if ((pathResult[i] === sid && pathResult[i + 1] === tid) ||
                    (pathResult[i] === tid && pathResult[i + 1] === sid)) {
                    isPathLink = true;
                    break;
                }
            }
        }

        let opacity = 0.3 + linkValue * 0.5; // Base opacity scales with confidence

        if (pathMode) {
            if (pathResult) {
                opacity = isPathLink ? 1 : 0.05;
            }
        } else if (hoverNode) {
            const isConnected = link.source.id === hoverNode.id || link.target.id === hoverNode.id;
            opacity = isConnected ? 1 : 0.03;
        } else if (highlightedNodeIds.size > 0) {
            opacity = 0.1;
        }

        if (opacity < 0.05) return;

        const src = link.source;
        const tgt = link.target;

        // Safety check for initial render where positions might be NaN
        if (!Number.isFinite(src.x) || !Number.isFinite(src.y) || !Number.isFinite(tgt.x) || !Number.isFinite(tgt.y)) return;

        const gradient = ctx.createLinearGradient(src.x, src.y, tgt.x, tgt.y);

        let srcColor = communityColorMap.get(src.id) || getCategoryColor(src.type);
        let tgtColor = communityColorMap.get(tgt.id) || getCategoryColor(tgt.type);

        if (isPathLink) {
            srcColor = '#eab308';
            tgtColor = '#eab308';
        } else if (isManual) {
            srcColor = '#F59E0B'; // Amber-500
            tgtColor = '#F59E0B';
        } else if (isExplicit) {
            srcColor = '#6366f1'; // Indigo-500
            tgtColor = '#6366f1';
        } else if (isHybrid) {
            srcColor = '#06b6d4'; // Cyan-500
            tgtColor = '#06b6d4';
        } else if (isSemantic) {
            srcColor = '#a855f7'; // Purple-500 (Distinct for AI Semantic)
            tgtColor = '#a855f7';
        }

        gradient.addColorStop(0, srcColor);
        gradient.addColorStop(1, tgtColor);

        ctx.strokeStyle = gradient;

        // Value-based width: higher confidence = thicker line
        let lineWidth = 1 + linkValue * 2; // 1px to 3px based on value

        if (isPathLink) lineWidth = 4.0;
        else if (isManual) lineWidth = 4.0;
        else if (isExplicit) lineWidth = 2.5 + linkValue;
        else if (isHybrid) lineWidth = 1.5 + linkValue;
        else if (isSemantic) lineWidth = 1.0 + linkValue * 0.5;

        ctx.lineWidth = Math.max(lineWidth, 1 / globalScale);
        ctx.globalAlpha = opacity;

        ctx.beginPath();

        // DASHED lines for Semantic/Hybrid
        if (isPathLink) ctx.setLineDash([]); // Path is solid
        else if (isSemantic) ctx.setLineDash([2, 4]);
        else if (isHybrid) ctx.setLineDash([4, 2]);
        else ctx.setLineDash([]); // Solid for Manual, Explicit, Structural

        ctx.moveTo(src.x, src.y);
        ctx.lineTo(tgt.x, tgt.y);
        ctx.stroke();

        // Reset dash
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;
    }, [hoverNode, communityColorMap, highlightedNodeIds, getCategoryColor, pathMode, pathResult]);

    // Apply custom forces for Obsidian-like layout
    useEffect(() => {
        // Use useEffect to configure simulation after mount
        setTimeout(() => {
            if (!fgRef.current) return;

            // Custom forces for better layout
            // Adjusted: Reduced repulsion (-600) and collision (40) to avoid "dilated" graph
            fgRef.current.d3Force('charge')?.strength(-800); // Increased repulsion for aeration (-600 -> -800)

            // Link force: distance depends on link value
            fgRef.current.d3Force('link')
                ?.distance((link: any) => {
                    const val = typeof link.value === 'number' ? link.value : 0.5;
                    // SAFEGUARD: Linear scaling instead of inverse square to prevent massive distances
                    // Weak links (0.1) -> 200px, Strong links (1.0) -> 60px
                    return 60 + (1 - val) * 140;
                })
                ?.strength(0.5); // Restore strength to 0.5 (was 0.4) for better cohesion

            // Collision to prevent overlap
            fgRef.current.d3Force('collide', forceCollide(50).iterations(3)); // Increased collision radius (40 -> 50)

            // Center force to keep graph in view
            fgRef.current.d3Force('center')?.strength(0.6);

            // Radial Force: Very weak, just to keep it from flying away
            fgRef.current.d3Force('radial', forceRadial(1000, dimensions.width / 2, dimensions.height / 2).strength(0.05)); // Slight increase (from 0.02)
        }, 0); // Run immediately after render
    }, [graphData]); // Re-apply when graph changes

    // ... (auto-zoom effect unchanged)
    // Aggressive Auto-Zoom on Data Load
    useEffect(() => {
        if (fgRef.current && graphData.nodes.length > 0) {
            // Initial quick zoom
            setTimeout(() => {
                fgRef.current?.zoomToFit(400, 50);
            }, 500);
        }
    }, [graphData]);



    // ...

    const handleNodeHover = useCallback((node: Node | null) => {
        setHoverNode(node);
        setHoverLink(null); // Clear link tooltip when hovering a node
        if (node) {
            const ids = new Set<string>();
            ids.add(node.id);
            const links = fgRef.current?.d3Force('link')?.links() || [];
            links.forEach((link: any) => {
                if (link.source.id === node.id) ids.add(link.target.id);
                if (link.target.id === node.id) ids.add(link.source.id);
            });
            setActiveNodeIds(ids);
        } else {
            setActiveNodeIds(new Set());
        }
    }, []);

    // Link hover handler for tooltip
    const handleLinkHover = useCallback((link: any) => {
        if (link && link.reason) {
            setHoverLink(link);
        } else {
            setHoverLink(null);
        }
    }, []);

    return (
        <div
            ref={containerRef}
            className="network-container"
            style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}
        >
            <ForceGraph2D
                key={remountKey}
                ref={fgRef}
                width={dimensions.width}
                height={dimensions.height}
                graphData={filteredGraphData}
                nodeLabel="name"
                nodeCanvasObject={nodeCanvasObject as any}
                nodePointerAreaPaint={(node: any, color, ctx) => {
                    ctx.fillStyle = color;
                    ctx.beginPath();
                    ctx.arc(node.x, node.y, 10, 0, 2 * Math.PI, false);
                    ctx.fill();
                }}
                // Custom Links
                linkCanvasObject={linkCanvasObject as any}
                linkCanvasObjectMode={() => 'replace'}

                // Interaction
                onNodeHover={handleNodeHover as any}
                onLinkHover={handleLinkHover as any}
                backgroundColor="#f8fafc"
                onNodeClick={(node, event) => {
                    // Shift+Click for Rapid Pathfinding
                    if (event.shiftKey) {
                        if (!pathStart) {
                            setPathStart(node.id);
                            setPathMode(true); // Auto-enable path mode (Corrected name)
                            setPathEnd(null); // Reset end
                        } else if (!pathEnd) {
                            setPathEnd(node.id); // Set end and calc path automatically via effect
                        } else {
                            // If both set, restart with this as new start
                            setPathStart(node.id);
                            setPathEnd(null);
                        }
                        return;
                    }

                    // Normal Click
                    handleNodeClick(node);
                }}
                cooldownTicks={100}
                d3AlphaDecay={0.05} // Faster settling (less "explosion")
                d3VelocityDecay={0.2} // More friction
                warmupTicks={50}
                onEngineStop={() => {
                    fgRef.current?.zoomToFit(400, 50);
                }}
            />
            {isCalculating && (
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    background: 'rgba(255, 255, 255, 0.9)',
                    padding: '1rem 1.5rem',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    pointerEvents: 'none'
                }}>
                    Calcul du réseau...
                </div>
            )}
            <div style={{
                position: 'absolute',
                bottom: 16,
                right: 16,
                background: 'white',
                padding: '8px 12px',
                borderRadius: 6,
                border: '1px solid #e2e8f0',
                fontSize: 11,
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                color: '#64748b'
            }}>
                Molette: zoom • Glisser: déplacer • Clic: détails
            </div>

            {/* Link tooltip */}
            {hoverLink && hoverLink.reason && (
                <div style={{
                    position: 'absolute',
                    left: '50%',
                    top: 16,
                    transform: 'translateX(-50%)',
                    background: 'rgba(15, 23, 42, 0.92)',
                    color: 'white',
                    padding: '8px 14px',
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 500,
                    maxWidth: 400,
                    textAlign: 'center',
                    pointerEvents: 'auto', // Enable interaction for button
                    zIndex: 10,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    lineHeight: 1.4,
                    backdropFilter: 'blur(8px)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8
                }}>
                    <div style={{ color: '#94a3b8', fontSize: 10, marginBottom: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                        {hoverLink.type === 'explicit' ? <><LinkIcon size={12} className="text-indigo-400" /> <span>Référence explicite</span></> :
                            hoverLink.type === 'hybrid' ? <><GitMerge size={12} className="text-cyan-400" /> <span>Lien hybride</span></> :
                                hoverLink.type === 'semantic' ? <><Brain size={12} className="text-purple-400" /> <span>Similarité sémantique</span></> :
                                    hoverLink.type === 'manual' ? <><Hand size={12} className="text-amber-400" /> <span>Lien manuel</span></> :
                                        <><BarChart2 size={12} className="text-slate-400" /> <span>Lien structurel</span></>}

                        {hoverLink.value ? <span style={{ opacity: 0.7 }}>• {Math.round((hoverLink.value || 0) * 100)}%</span> : ''}

                        {/* Quality Indicator */}
                        {hoverLink.quality === 'boost' && <Zap size={10} className="text-yellow-400" style={{ marginLeft: 'auto' }} />}
                        {hoverLink.quality === 'match' && <Check size={10} className="text-green-400" style={{ marginLeft: 'auto' }} />}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {hoverLink.reason}
                    </div>

                    {/* Delete Action (Feedback) */}
                    {(hoverLink.type === 'semantic' || hoverLink.type === 'hybrid' || hoverLink.type === 'rrf') && onSuppressConnections && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                const sId = typeof hoverLink.source === 'string' ? hoverLink.source : (hoverLink.source as any).id;
                                const tId = typeof hoverLink.target === 'string' ? hoverLink.target : (hoverLink.target as any).id;
                                onSuppressConnections([{ sourceId: sId, targetId: tId }]);
                                setHoverLink(null); // Close tooltip
                            }}
                            className="hover:bg-red-500/20 hover:text-red-300"
                            style={{
                                marginTop: 4,
                                paddingTop: 6,
                                borderTop: '1px solid rgba(255,255,255,0.1)',
                                background: 'transparent',
                                color: '#f87171',
                                fontSize: 11,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 6,
                                width: '100%',
                                borderRadius: 4,
                                paddingBottom: 2,
                                transition: 'background 0.2s'
                            }}
                        >
                            <Trash2 size={12} /> Supprimer ce lien incorrect (apprendre)
                        </button>
                    )}
                </div>
            )}

            {/* Controls (Depth + Semantic) */}
            <div style={{
                position: 'absolute',
                top: 16,
                left: 16,
                display: 'flex',
                flexDirection: 'column',
                gap: 8
            }}>
                {/* Controls (Depth + Semantic + Path) */}
                <div style={{
                    position: 'absolute',
                    top: 16,
                    left: 16,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8
                }}>
                    {/* Depth Controls */}
                    <div style={{
                        background: 'white',
                        padding: '8px 12px',
                        borderRadius: 8,
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                        display: 'flex',
                        gap: 8,
                        alignItems: 'center'
                    }}>
                        <span style={{ fontSize: 12, color: '#64748b', marginRight: 4 }}>Profondeur:</span>
                        {[0, 1, 2, 3].map(d => (
                            <button
                                key={d}
                                onClick={() => {
                                    setDepthFilter(d);
                                    if (d === 0) setFocusedNodeId(null);
                                }}
                                style={{
                                    padding: '4px 10px',
                                    borderRadius: 4,
                                    border: depthFilter === d ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                                    background: depthFilter === d ? '#eff6ff' : 'white',
                                    color: depthFilter === d ? '#3b82f6' : '#64748b',
                                    fontSize: 12,
                                    cursor: 'pointer',
                                    fontWeight: depthFilter === d ? 600 : 400
                                }}
                            >
                                {d === 0 ? 'Tout' : `N+${d}`}
                            </button>
                        ))}
                    </div>

                    {/* Path Mode Toggle */}
                    <div style={{
                        background: 'white',
                        padding: '8px 12px',
                        borderRadius: 8,
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8
                    }}>
                        <button
                            onClick={() => {
                                setPathMode(!pathMode);
                                // Reset state when toggling off
                                if (pathMode) {
                                    setPathStart(null);
                                    setPathEnd(null);
                                    setPathResult(null);
                                }
                            }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: '6px 12px',
                                background: pathMode ? '#fef3c7' : '#f1f5f9',
                                color: pathMode ? '#d97706' : '#64748b',
                                border: 'none',
                                borderRadius: 6,
                                fontSize: 12,
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            <MapPin size={14} />
                            {pathMode ? 'Mode Chemin Actif' : 'Chercher un chemin'}
                        </button>

                        {pathMode && (
                            <div style={{ fontSize: 11, color: '#64748b', display: 'flex', flexDirection: 'column', gap: 2 }}>
                                {!pathStart && <span>1. Cliquez sur le point de départ</span>}
                                {pathStart && !pathEnd && <span>2. Cliquez sur l'arrivée</span>}
                                {pathStart && pathEnd && (
                                    <button
                                        onClick={() => {
                                            setPathStart(null);
                                            setPathEnd(null);
                                            setPathResult(null);
                                        }}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            color: '#ef4444',
                                            fontSize: 11,
                                            cursor: 'pointer',
                                            textDecoration: 'underline',
                                            padding: 0
                                        }}
                                    >
                                        Réinitialiser
                                    </button>
                                )}
                            </div>
                        )}
                    </div>


                    {focusedNodeId && (
                        <div style={{
                            background: 'white',
                            padding: '8px 12px',
                            borderRadius: 8,
                            border: '1px solid #e2e8f0',
                            fontSize: 11, color: '#94a3b8'
                        }}>
                            Focus: {graphData.nodes.find(n => n.id === focusedNodeId)?.name?.slice(0, 15)}...
                        </div>
                    )}
                </div>


            </div>
        </div>
    );
};
