import { useMemo, useRef, useCallback, useState, useEffect } from 'react';
import ForceGraph2D, { type ForceGraphMethods } from 'react-force-graph-2d';
import { forceCollide, forceRadial } from 'd3-force';
import type { Card } from '../types';
import { getTypeColor } from '../theme';

interface NetworkViewProps {
    cards: Card[];
    onNodeClick: (cardId: string) => void;
    searchQuery?: string;
    activeFilters?: string[];
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
}

export const NetworkView: React.FC<NetworkViewProps> = ({ cards, onNodeClick, searchQuery, activeFilters = [] }) => {
    const fgRef = useRef<ForceGraphMethods | undefined>(undefined);
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
    const [graphData, setGraphData] = useState<{ nodes: Node[], links: Link[] }>({ nodes: [], links: [] });
    const [isCalculating, setIsCalculating] = useState(false);

    // Depth filter state: 0 = show all, 1-3 = show neighbors at depth N
    const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);
    const [depthFilter, setDepthFilter] = useState<number>(0); // 0 = all, 1/2/3 = depth

    // Position cache to prevent graph "jumping" on updates
    const positionCache = useRef<Map<string, { x: number, y: number }>>(new Map());

    // Web Worker for graph computation
    useEffect(() => {
        if (cards.length === 0) {
            setGraphData({ nodes: [], links: [] });
            setIsCalculating(false);
            return;
        }

        setIsCalculating(true);
        const worker = new Worker(new URL('../workers/graph.worker.ts', import.meta.url), { type: 'module' });

        // Timeout failsafe - hide loading after 5 seconds max
        const timeout = setTimeout(() => {
            setIsCalculating(false);
            console.warn('Graph worker timeout - forcing UI update');
        }, 5000);

        worker.onmessage = (e) => {
            clearTimeout(timeout);

            // Apply cached positions to nodes for stable layout
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

    // Save positions to cache periodically
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

        // Save positions every 2 seconds after simulation has likely stabilized
        const interval = setInterval(savePositions, 2000);
        return () => clearInterval(interval);
    }, [graphData]);

    // Handle resize
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

    // Determine highlighted nodes based on search
    const highlightedNodeIds = useMemo(() => {
        if (!searchQuery) return new Set<string>();

        const query = searchQuery.toLowerCase();
        const matches = cards.filter(c =>
            c.title.toLowerCase().includes(query) ||
            c.content.toLowerCase().includes(query) ||
            c.tags.some(t => t.toLowerCase().includes(query))
        );

        return new Set(matches.map(m => m.id));
    }, [cards, searchQuery]);

    // BFS to find neighbors within depth N
    const getNeighborsAtDepth = useCallback((startId: string, maxDepth: number, links: Link[]) => {
        const visited = new Set<string>([startId]);
        const queue: [string, number][] = [[startId, 0]];

        // Build adjacency list
        const adjacency = new Map<string, Set<string>>();
        links.forEach(link => {
            const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
            const targetId = typeof link.target === 'string' ? link.target : link.target.id;

            if (!adjacency.has(sourceId)) adjacency.set(sourceId, new Set());
            if (!adjacency.has(targetId)) adjacency.set(targetId, new Set());
            adjacency.get(sourceId)!.add(targetId);
            adjacency.get(targetId)!.add(sourceId);
        });

        // BFS traversal
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

    // Filter graph data based on depth filter
    const filteredGraphData = useMemo(() => {
        if (depthFilter === 0 || !focusedNodeId) {
            return graphData; // Show all nodes
        }

        const visibleNodeIds = getNeighborsAtDepth(focusedNodeId, depthFilter, graphData.links);

        return {
            nodes: graphData.nodes.filter(n => visibleNodeIds.has(n.id)),
            links: graphData.links.filter(link => {
                const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
                const targetId = typeof link.target === 'string' ? link.target : link.target.id;
                return visibleNodeIds.has(sourceId) && visibleNodeIds.has(targetId);
            })
        };
    }, [graphData, focusedNodeId, depthFilter, getNeighborsAtDepth]);

    const handleNodeClick = useCallback((node: Node) => {
        // If clicking same node, toggle focus off
        if (focusedNodeId === node.id) {
            setFocusedNodeId(null);
        } else if (depthFilter > 0) {
            // Focus on clicked node when depth filter is active
            setFocusedNodeId(node.id);
        }
        onNodeClick(node.id);
        fgRef.current?.centerAt(node.x!, node.y!, 1000);
        fgRef.current?.zoom(3, 1000);
    }, [onNodeClick, focusedNodeId, depthFilter]);

    const nodeCanvasObject = useCallback((node: Node, ctx: CanvasRenderingContext2D, globalScale: number) => {
        // 1. Filter Logic (Dim unconnected/unfiltered nodes)
        const isTypeSelected = activeFilters.length === 0 || activeFilters.includes(node.type);
        const isSearchMatch = highlightedNodeIds.size === 0 || highlightedNodeIds.has(node.id);

        // A node is "dimmed" if it fails EITHER filter check (if active) OR search check (if active)
        // Actually, logic: Match = (Type Match) AND (Search Match)
        // If search is empty, Search Match is true for all.
        // If filter is empty, Type Match is true for all.
        const isMatched = isTypeSelected && isSearchMatch;

        // Label handling
        const label = node.name;

        // Circle styling
        const baseR = 6;
        const r = isMatched && highlightedNodeIds.size > 0 ? 8 : baseR; // Larger if strictly search matched

        ctx.beginPath();
        ctx.arc(node.x!, node.y!, r, 0, 2 * Math.PI, false);

        // Fill color based on type
        ctx.fillStyle = isMatched ? getTypeColor(node.type) : '#cbd5e1';

        // Opacity: High if matched, Low if not
        // Exception: If NO search and NO filter, all are 1
        const hasActiveFilterOrSearch = activeFilters.length > 0 || highlightedNodeIds.size > 0;
        ctx.globalAlpha = hasActiveFilterOrSearch && !isMatched ? 0.1 : 1;

        ctx.fill();

        // White border - thicker for search matches
        ctx.lineWidth = (isMatched && highlightedNodeIds.size > 0) ? 2.5 : 1.5;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();

        // Reset alpha
        ctx.globalAlpha = 1;

        // Label - always show if highlighted/matched, otherwise rely on zoom
        // If dimmed, don't show label unless zoomed in extremely close
        const shouldShowLabel = isMatched && (highlightedNodeIds.size > 0 || globalScale > 0.8);

        if (shouldShowLabel) {
            const labelY = node.y! + r + 4;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.font = `${(isMatched && highlightedNodeIds.size > 0) ? 'bold ' : ''}${Math.max(10, 12 / globalScale)}px Inter, system-ui, sans-serif`;

            // Text shadow for readability
            ctx.fillStyle = '#ffffff';
            ctx.lineWidth = 3;
            ctx.strokeText(label, node.x!, labelY);

            // Main text
            ctx.fillStyle = isMatched ? '#1e293b' : 'rgba(100, 116, 139, 0.2)';
            ctx.fillText(label, node.x!, labelY);
        }
    }, [highlightedNodeIds, activeFilters]);

    // Apply custom forces for Obsidian-like layout
    useEffect(() => {
        if (fgRef.current) {
            // Charge: moderate repulsion to spread nodes
            fgRef.current.d3Force('charge')?.strength(-250);

            // Link distance: moderate to show relationships clearly
            fgRef.current.d3Force('link')?.distance(70);

            // COLLISION FORCE: Prevent overlapping nodes AND labels
            fgRef.current.d3Force('collide', forceCollide(45));

            // Center force: pull isolated nodes toward center
            fgRef.current.d3Force('center')?.strength(1.5);

            // RADIAL FORCE: Keep all nodes within a bounded radius
            // This prevents isolated nodes from drifting too far
            // Pulls nodes toward radius 150 with strength 0.3
            fgRef.current.d3Force('radial', forceRadial(150, 0, 0).strength(0.3));
        }
    }, [graphData]); // Re-apply when graph changes

    // Auto-zoom to fit all nodes
    useEffect(() => {
        if (fgRef.current && graphData.nodes.length > 0) {
            setTimeout(() => {
                fgRef.current?.zoomToFit(400, 80); // 400ms animation, 80px padding
            }, 1500); // Wait for simulation to stabilize
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
                linkWidth={1.5}
                // Link color: dim if either end is dimmed (simple approximation)
                linkColor={() => 'rgba(148, 163, 184, 0.6)'}
                backgroundColor="#f8fafc"
                onNodeClick={handleNodeClick as any}
                cooldownTicks={200} // More ticks for better layout
                d3AlphaDecay={0.01} // Slower decay for more stable layout
                d3VelocityDecay={0.2} // Less friction for smoother movement
                warmupTicks={100} // Pre-warm the simulation
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

            {/* Depth filter controls */}
            <div style={{
                position: 'absolute',
                top: 16,
                left: 16,
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
                {focusedNodeId && (
                    <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 8 }}>
                        Focus: {graphData.nodes.find(n => n.id === focusedNodeId)?.name?.slice(0, 15)}...
                    </span>
                )}
            </div>
        </div>
    );
};
