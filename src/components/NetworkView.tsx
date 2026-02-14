import { useMemo, useRef, useCallback, useState, useEffect } from 'react';
import ForceGraph2D, { type ForceGraphMethods } from 'react-force-graph-2d';
import { forceCollide, forceRadial } from 'd3-force';
import type { Card } from '../types';
import { useTheme } from '../context/ThemeContext';
import { computePrecisionGraph } from '../semanticSearch';
import { detectCommunities } from '../algorithms/communityDetection';
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
}

interface Link {
    source: string | Node;
    target: string | Node;
    type?: string; // 'semantic', 'explicit', 'hybrid' or undefined (structural)
    value?: number;
    reason?: string; // Human-readable explanation for hover tooltip
}

export const NetworkView: React.FC<NetworkViewProps> = ({
    cards,
    onNodeClick,
    searchQuery,
    activeFilters = [],
    highlightedIds,
    onSuppressConnections: _onSuppressConnections,
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
            newData.nodes = newData.nodes.map((node: Node) => {
                const cached = positionCache.current.get(node.id);
                if (cached) {
                    return { ...node, x: cached.x, y: cached.y, fx: undefined, fy: undefined };
                }
                return node;
            });

            // Cache the structural links for incremental next time
            cachedLinksRef.current = newData.links;
            previousCardsRef.current = [...cards];

            // Track stats for the intelligence dashboard
            if (newData.links.length > 0) {
                import('../linkFeedback').then(m => m.recordLinksGenerated(newData.links.length));
            }

            setGraphData(newData);
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
            computePrecisionGraph(cards, vetoPairs, typeCompat).then(links => {
                console.log('Precision graph computed:', links.length, 'links found');
                setSmartLinks(links.map(l => ({
                    source: l.source,
                    target: l.target,
                    type: l.type, // 'explicit', 'semantic', 'hybrid'
                    value: l.value
                })));
            });
        } else {
            if (!semanticReady) console.log('Waiting for semantic search to be ready before computing precision graph...');
            setSmartLinks([]);
        }
    }, [cards, semanticReady]);

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

        const finalLinks = Array.from(uniqueLinks.values());
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
        if (focusedNodeId === node.id) {
            setFocusedNodeId(null);
        } else if (depthFilter > 0) {
            setFocusedNodeId(node.id);
        }
        onNodeClick(node.id);
        fgRef.current?.centerAt(node.x!, node.y!, 1000);
        fgRef.current?.zoom(3, 1000);
    }, [onNodeClick, focusedNodeId, depthFilter]);

    // Canvas Object: Nodes (Spotlight + Community)
    const nodeCanvasObject = useCallback((node: Node, ctx: CanvasRenderingContext2D, globalScale: number) => {
        const isHovered = hoverNode !== null;
        const isActive = activeNodeIds.has(node.id);
        const isSearchMatch = highlightedNodeIds.size === 0 || highlightedNodeIds.has(node.id);
        const isTypeSelected = activeFilters.length === 0 || activeFilters.includes(node.type);

        // Spotlight Dimming Logic
        let opacity = 1;
        if (isHovered) {
            opacity = isActive ? 1 : 0.1;
        } else if (highlightedNodeIds.size > 0) {
            opacity = (isSearchMatch && isTypeSelected) ? 1 : 0.1;
        } else if (!isTypeSelected) {
            opacity = 0.1;
        }

        ctx.globalAlpha = opacity;

        const label = node.name;
        const baseR = 8;
        const isMatched = (isSearchMatch && isTypeSelected);
        const r = isMatched && highlightedNodeIds.size > 0 ? 12 : baseR;

        // Visual Coherence: Use community color for fill
        const community = communityMap.get(node.id);
        const communityColor = community ? communityColorMap.get(community) : undefined;
        const finalColor = communityColor || getCategoryColor(node.type);

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
        ctx.lineWidth = (isMatched && highlightedNodeIds.size > 0) ? 2.5 : 1.5;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();
        ctx.globalAlpha = 1;

        // Text
        const fontSize = Math.max(4, 12 / globalScale);
        // Show if: Matched, Active (Hover), or No Hover and proper zoom
        const shouldShowLabel = isActive || (isMatched && highlightedNodeIds.size > 0) || (!isHovered && globalScale > 0.6);

        if (shouldShowLabel && opacity > 0.2) {
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.font = `${(isMatched || isActive) ? '600' : '500'} ${fontSize}px Inter, system-ui, sans-serif`;

            // Halo
            ctx.lineJoin = 'round';
            ctx.lineWidth = 3;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.strokeText(label, node.x!, node.y! + r + 3);

            ctx.fillStyle = '#1e293b';
            ctx.fillText(label, node.x!, node.y! + r + 3);
        }
        ctx.globalAlpha = 1;
    }, [highlightedNodeIds, activeFilters, communityMap, communityColorMap, hoverNode, activeNodeIds, getCategoryColor]);

    // Canvas Object: Links (Gradient + Spotlight + Value-based thickness)
    const linkCanvasObject = useCallback((link: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
        const isSemantic = link.type === 'semantic';
        const isManual = link.type === 'manual';
        const isExplicit = link.type === 'explicit';
        const isHybrid = link.type === 'hybrid';
        const linkValue = link.value || 0.5;

        let opacity = 0.3 + linkValue * 0.5; // Base opacity scales with confidence

        if (hoverNode) {
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

        if (isManual) {
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

        if (isManual) lineWidth = 4.0;
        else if (isExplicit) lineWidth = 2.5 + linkValue;
        else if (isHybrid) lineWidth = 1.5 + linkValue;
        else if (isSemantic) lineWidth = 1.0 + linkValue * 0.5;

        ctx.lineWidth = Math.max(lineWidth, 1 / globalScale);
        ctx.globalAlpha = opacity;

        ctx.beginPath();

        // DASHED lines for Semantic/Hybrid
        if (isSemantic) ctx.setLineDash([2, 4]);
        else if (isHybrid) ctx.setLineDash([4, 2]);
        else ctx.setLineDash([]); // Solid for Manual, Explicit, Structural

        ctx.moveTo(src.x, src.y);
        ctx.lineTo(tgt.x, tgt.y);
        ctx.stroke();

        // Reset dash
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;
    }, [hoverNode, communityColorMap, highlightedNodeIds, getCategoryColor]);

    // Apply custom forces for Obsidian-like layout
    useEffect(() => {
        if (fgRef.current) {
            // Charge: Strong repulsion for clean separation
            fgRef.current.d3Force('charge')?.strength(-2000); // Increased repulsion (from -1000)

            // Link force: Manual (Tight) > Structure (Medium)
            fgRef.current.d3Force('link')
                ?.distance((link: any) => link.type === 'manual' ? 50 : 100) // Increased distances (from 30/60)
                ?.strength((link: any) => link.type === 'manual' ? 1.0 : 0.5); // Slightly reduced strength for flexibility

            // COLLISION FORCE: Prevent overlap (Large radius for labels)
            // Increased radius (from 60) and iterations for stability
            fgRef.current.d3Force('collide', forceCollide(80).iterations(3));

            // Center force: Moderate gravity to keep it centered but not crushed
            fgRef.current.d3Force('center')?.strength(0.6); // Reduced (from 0.8) to allow more spread

            // Radial Force: Very weak, just to keep it from flying away
            fgRef.current.d3Force('radial', forceRadial(1000, dimensions.width / 2, dimensions.height / 2).strength(0.05)); // Slight increase (from 0.02)
        }
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
                onNodeClick={handleNodeClick as any}
                cooldownTicks={200}
                d3AlphaDecay={0.01}
                d3VelocityDecay={0.1}
                warmupTicks={100}
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
                    pointerEvents: 'none',
                    zIndex: 10,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    lineHeight: 1.4,
                    backdropFilter: 'blur(8px)'
                }}>
                    <div style={{ color: '#94a3b8', fontSize: 10, marginBottom: 3 }}>
                        {hoverLink.type === 'explicit' ? '🔗 Référence explicite' :
                            hoverLink.type === 'hybrid' ? '🧬 Lien hybride' :
                                hoverLink.type === 'semantic' ? '🧠 Similarité sémantique' :
                                    hoverLink.type === 'manual' ? '✋ Lien manuel' :
                                        '📊 Lien structurel'}
                        {hoverLink.value ? ` • ${Math.round((hoverLink.value || 0) * 100)}%` : ''}
                    </div>
                    {hoverLink.reason}
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
    );
};
