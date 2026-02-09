import { useMemo, useRef, useCallback, useState, useEffect } from 'react';
import ForceGraph2D, { type ForceGraphMethods } from 'react-force-graph-2d';
import { forceCollide, forceRadial } from 'd3-force';
import type { Card } from '../types';
import { getTypeColor } from '../theme';
import { computeSemanticGraph } from '../semanticSearch';
import { detectCommunities } from '../algorithms/communityDetection';

interface NetworkViewProps {
    cards: Card[];
    onNodeClick: (cardId: string) => void;
    searchQuery?: string;
    activeFilters?: string[];
    highlightedIds?: Set<string>;
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
    type?: string; // 'semantic' or undefined (structural)
    value?: number;
}

export const NetworkView: React.FC<NetworkViewProps> = ({ cards, onNodeClick, searchQuery, activeFilters = [], highlightedIds }) => {
    const fgRef = useRef<ForceGraphMethods | undefined>(undefined);
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
    const [graphData, setGraphData] = useState<{ nodes: Node[], links: Link[] }>({ nodes: [], links: [] });
    const [isCalculating, setIsCalculating] = useState(false);

    // Depth filter state: 0 = show all, 1-3 = show neighbors at depth N
    const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);
    const [depthFilter, setDepthFilter] = useState<number>(0); // 0 = all, 1/2/3 = depth

    // Semantic Links State
    const [semanticLinks, setSemanticLinks] = useState<Link[]>([]);
    const [showSemantic] = useState(true); // Enabled by default
    const [semanticThreshold] = useState(0.70);
    const [isComputingSemantic, setIsComputingSemantic] = useState(false);

    // Position cache to prevent graph "jumping" on updates
    const positionCache = useRef<Map<string, { x: number, y: number }>>(new Map());

    // Web Worker for graph computation
    useEffect(() => {
        // ... (unchanged)
        if (cards.length === 0) {
            setGraphData({ nodes: [], links: [] });
            setIsCalculating(false);
            return;
        }

        setIsCalculating(true);
        const worker = new Worker(new URL('../workers/graph.worker.ts', import.meta.url), { type: 'module' });

        // ... (worker setup logic unchanged)
        const timeout = setTimeout(() => {
            setIsCalculating(false);
            console.warn('Graph worker timeout - forcing UI update');
        }, 5000);

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

        worker.postMessage(cards);

        return () => {
            clearTimeout(timeout);
            worker.terminate();
        };
    }, [cards]);

    // Semantic Graph Effect
    useEffect(() => {
        if (showSemantic && cards.length > 0) {
            setIsComputingSemantic(true);
            computeSemanticGraph(cards, semanticThreshold).then(links => {
                setSemanticLinks(links.map(l => ({
                    source: l.source,
                    target: l.target,
                    type: 'semantic',
                    value: l.value
                })));
                setIsComputingSemantic(false);
            });
        } else {
            setSemanticLinks([]);
        }
    }, [cards, showSemantic, semanticThreshold]);

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

    // Combine links
    const allLinks = useMemo(() => {
        return [...graphData.links, ...semanticLinks];
    }, [graphData.links, semanticLinks]);

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

    // Canvas Object with Community Colors
    const nodeCanvasObject = useCallback((node: Node, ctx: CanvasRenderingContext2D, globalScale: number) => {
        const isTypeSelected = activeFilters.length === 0 || activeFilters.includes(node.type);
        const isSearchMatch = highlightedNodeIds.size === 0 || highlightedNodeIds.has(node.id);
        const isMatched = isTypeSelected && isSearchMatch;
        const label = node.name;
        const baseR = 6;
        const r = isMatched && highlightedNodeIds.size > 0 ? 8 : baseR;

        // Visual Coherence: Use community color for fill
        const community = communityMap.get(node.id);
        const communityColor = community ? communityColorMap.get(community) : undefined;
        // Fallback to type color if no community or for matching logic
        const finalColor = communityColor || getTypeColor(node.type);

        ctx.beginPath();
        ctx.arc(node.x!, node.y!, r, 0, 2 * Math.PI, false);

        ctx.fillStyle = isMatched ? finalColor : '#cbd5e1'; // Grey if filtered out

        const hasActiveFilterOrSearch = activeFilters.length > 0 || highlightedNodeIds.size > 0;
        ctx.globalAlpha = hasActiveFilterOrSearch && !isMatched ? 0.1 : 1;
        ctx.fill();

        // Stroke (maybe use type color for stroke to keep type info visible?)
        ctx.lineWidth = (isMatched && highlightedNodeIds.size > 0) ? 2.5 : 1.5;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();
        ctx.globalAlpha = 1;

        const shouldShowLabel = isMatched && (highlightedNodeIds.size > 0 || globalScale > 0.8);
        if (shouldShowLabel) {
            const labelY = node.y! + r + 4;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.font = `${(isMatched && highlightedNodeIds.size > 0) ? 'bold ' : ''}${Math.max(10, 12 / globalScale)}px Inter, system-ui, sans-serif`;
            // Label color - maybe match node color for harmony?
            ctx.fillStyle = '#ffffff';
            ctx.lineWidth = 3;
            ctx.strokeText(label, node.x!, labelY);
            ctx.fillStyle = isMatched ? '#1e293b' : 'rgba(100, 116, 139, 0.2)';
            ctx.fillText(label, node.x!, labelY);
        }
    }, [highlightedNodeIds, activeFilters, communityMap, communityColorMap]);

    // Apply custom forces for Obsidian-like layout
    useEffect(() => {
        if (fgRef.current) {
            // Charge: moderate repulsion to spread nodes
            fgRef.current.d3Force('charge')?.strength(-250);

            // Link force: variable based on type
            fgRef.current.d3Force('link')
                ?.distance((link: any) => link.type === 'semantic' ? 120 : 60) // Semantic links are "looser"
                ?.strength((link: any) => link.type === 'semantic' ? (link.value || 0.5) * 0.2 : 1); // Semantic links are "softer"

            // COLLISION FORCE: Prevent overlapping nodes AND labels
            fgRef.current.d3Force('collide', forceCollide(45));

            // Center force: pull isolated nodes toward center
            fgRef.current.d3Force('center')?.strength(1.5);

            // RADIAL FORCE: Keep all nodes within a bounded radius
            fgRef.current.d3Force('radial', forceRadial(150, 0, 0).strength(0.3));
        }
    }, [graphData]); // Re-apply when graph changes

    // ... (auto-zoom effect unchanged)
    useEffect(() => {
        if (fgRef.current && graphData.nodes.length > 0) {
            setTimeout(() => {
                fgRef.current?.zoomToFit(400, 80);
            }, 1500);
        }
    }, [graphData]);

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
                linkWidth={link => (link as Link).type === 'semantic' ? 1 : 1.5}
                linkLineDash={link => (link as Link).type === 'semantic' ? [4, 3] : null}
                linkColor={link => {
                    const l = link as Link;
                    const isSemantic = l.type === 'semantic';

                    // Structural links: Default grey
                    if (!isSemantic) return 'rgba(148, 163, 184, 0.6)';

                    // Semantic links: Check coherence
                    const sourceId = typeof l.source === 'object' ? (l.source as Node).id : l.source as string;
                    const targetId = typeof l.target === 'object' ? (l.target as Node).id : l.target as string;
                    const c1 = communityMap.get(sourceId);
                    const c2 = communityMap.get(targetId);
                    const val = l.value || 0;

                    // Cross-community semantic links are "incoherent" unless very strong
                    if (c1 && c2 && c1 !== c2) {
                        // STRONG BRIDGE: Keep visible if very similar (> 0.85)
                        if (val > 0.85) return 'rgba(124, 58, 237, 0.4)';
                        return 'rgba(124, 58, 237, 0.05)'; // Faint noise
                    }
                    // Intra-community semantic links -> Strong coherence
                    return 'rgba(124, 58, 237, 0.5)';
                }}
                backgroundColor="#f8fafc"
                onNodeClick={handleNodeClick as any}
                cooldownTicks={200}
                d3AlphaDecay={0.01}
                d3VelocityDecay={0.2}
                warmupTicks={100}
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

                {/* AI Indicator (Subtle) - Removed Slider */}
                {isComputingSemantic && (
                    <div style={{
                        background: 'white',
                        padding: '6px 12px',
                        borderRadius: 8,
                        border: '1px solid #e2e8f0',
                        fontSize: 11,
                        color: '#7c3aed',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6
                    }}>
                        <div className="animate-pulse w-2 h-2 rounded-full bg-violet-500"></div>
                        Fusion IA en cours...
                    </div>
                )}

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
