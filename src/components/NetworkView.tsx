import { useMemo, useRef, useCallback, useState, useEffect } from 'react';
import ForceGraph2D, { type ForceGraphMethods } from 'react-force-graph-2d';
import { forceCollide, forceRadial } from 'd3-force';
import type { Card } from '../types';
import { getTypeColor } from '../theme';

interface NetworkViewProps {
    cards: Card[];
    onNodeClick: (cardId: string) => void;
    searchQuery?: string;
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

export const NetworkView: React.FC<NetworkViewProps> = ({ cards, onNodeClick, searchQuery }) => {
    const fgRef = useRef<ForceGraphMethods | undefined>(undefined);
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
    const [graphData, setGraphData] = useState<{ nodes: Node[], links: Link[] }>({ nodes: [], links: [] });
    const [isCalculating, setIsCalculating] = useState(false);

    // Web Worker for graph computation
    useEffect(() => {
        setIsCalculating(true);
        const worker = new Worker(new URL('../workers/graph.worker.ts', import.meta.url), { type: 'module' });

        worker.onmessage = (e) => {
            setGraphData(e.data);
            setIsCalculating(false);
            worker.terminate();
        };

        worker.postMessage(cards);

        return () => {
            worker.terminate();
        };
    }, [cards]);

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

    const handleNodeClick = useCallback((node: Node) => {
        onNodeClick(node.id);
        fgRef.current?.centerAt(node.x!, node.y!, 1000);
        fgRef.current?.zoom(3, 1000);
    }, [onNodeClick]);

    const nodeCanvasObject = useCallback((node: Node, ctx: CanvasRenderingContext2D, globalScale: number) => {
        const isHighlighted = highlightedNodeIds.size === 0 || highlightedNodeIds.has(node.id);
        const label = node.name;

        // Circle styling - Obsidian uses smaller, consistent circles
        const r = 6;
        ctx.beginPath();
        ctx.arc(node.x!, node.y!, r, 0, 2 * Math.PI, false);

        // Fill color based on type
        ctx.fillStyle = isHighlighted ? getTypeColor(node.type) : '#cbd5e1';
        ctx.globalAlpha = isHighlighted ? 1 : 0.5;
        ctx.fill();

        // White border
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();

        // Reset alpha
        ctx.globalAlpha = 1;

        // Label - only show when zoomed in enough (like Obsidian)
        // globalScale < 0.8 means user has zoomed out
        if (globalScale > 0.8) {
            const labelY = node.y! + r + 4;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.font = `${Math.max(10, 12 / globalScale)}px Inter, system-ui, sans-serif`;

            // Text shadow for readability
            ctx.fillStyle = '#ffffff';
            ctx.fillText(label, node.x! + 0.5, labelY + 0.5);
            ctx.fillText(label, node.x! - 0.5, labelY - 0.5);

            // Main text
            ctx.fillStyle = isHighlighted ? '#1e293b' : '#64748b';
            ctx.fillText(label, node.x!, labelY);
        }
    }, [highlightedNodeIds]);

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
                graphData={graphData}
                nodeLabel="name"
                nodeCanvasObject={nodeCanvasObject as any}
                nodePointerAreaPaint={(node: any, color, ctx) => {
                    ctx.fillStyle = color;
                    ctx.beginPath();
                    ctx.arc(node.x, node.y, 10, 0, 2 * Math.PI, false);
                    ctx.fill();
                }}
                linkWidth={1.5}
                linkColor={() => 'rgba(148, 163, 184, 0.6)'} // Semi-transparent slate
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
        </div>
    );
};
