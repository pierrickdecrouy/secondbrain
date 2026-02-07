import { useMemo, useRef, useCallback, useState, useEffect } from 'react';
import ForceGraph2D, { type ForceGraphMethods } from 'react-force-graph-2d';
import type { Card } from '../types';
import { CARD_COLORS } from '../theme';

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
    // Initialize with undefined to match ForceGraphMethods generic requirement often seeing issues with null
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
            worker.terminate(); // Terminate after one-off calculation
        };

        worker.postMessage(cards);

        return () => {
            worker.terminate();
        };
    }, [cards]); // Re-run when cards change

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

        // Small delay to ensure container is ready
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

        // Center on node
        fgRef.current?.centerAt(node.x!, node.y!, 1000);
        fgRef.current?.zoom(4, 1000);
    }, [onNodeClick]);

    const nodeCanvasObject = useCallback((node: Node, ctx: CanvasRenderingContext2D, globalScale: number) => {
        const isHighlighted = highlightedNodeIds.size === 0 || highlightedNodeIds.has(node.id);
        const label = node.name;

        // Dynamic size based on zoom (optional, simply keep it readable)
        const fontSize = 14;

        ctx.font = `${fontSize}px Inter, Sans - Serif`;

        // Circle styling
        const r = 8;
        ctx.beginPath();
        ctx.arc(node.x!, node.y!, r, 0, 2 * Math.PI, false);

        // Fill
        // Color based on type
        // @ts-ignore - access safe via key
        ctx.fillStyle = isHighlighted ? (CARD_COLORS[node.type as keyof typeof CARD_COLORS] || '#94a3b8') : '#e2e8f0';
        if (isHighlighted) {
            ctx.globalAlpha = 1;
        } else {
            ctx.fillStyle = '#cbd5e1'; // muted slate
            ctx.globalAlpha = 0.4;
        }

        ctx.fill();

        // Stroke
        ctx.lineWidth = isHighlighted ? 1.5 : 1;
        ctx.strokeStyle = '#fff';
        ctx.stroke();

        // Label - Always visible if highlighted OR if zoomed in enough
        // improved readability with stroke (halo) instead of box
        if (isHighlighted || globalScale > 1.5) {
            const labelY = node.y! + r + 6;

            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';

            // Halo (stroke) for readability
            ctx.lineWidth = 3;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
            if (isHighlighted) ctx.strokeStyle = 'rgba(255, 255, 255, 1)';

            ctx.strokeText(label, node.x!, labelY);

            // Text
            ctx.fillStyle = '#1e293b'; // slate-800
            ctx.font = `${fontSize}px Inter, Sans-Serif`; // Standard font

            if (isHighlighted) {
                ctx.fillStyle = '#0f172a'; // darker slate/black
                ctx.font = `600 ${fontSize}px Inter, Sans-Serif`; // Bold
            }

            ctx.fillText(label, node.x!, labelY);
        }
    }, [highlightedNodeIds]);

    // Apply custom forces for better spacing
    useEffect(() => {
        if (fgRef.current) {
            // Increase repulsion (default is often -30) - more negative = more spread
            fgRef.current.d3Force('charge')?.strength(-200);
            // Increase link distance (default is often 30)
            fgRef.current.d3Force('link')?.distance(80);
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
                graphData={graphData}
                nodeLabel="name"
                nodeCanvasObject={nodeCanvasObject as any}
                nodePointerAreaPaint={(node: any, color, ctx) => {
                    ctx.fillStyle = color;
                    ctx.beginPath();
                    ctx.arc(node.x, node.y, 8, 0, 2 * Math.PI, false); // Match visual radius
                    ctx.fill();
                }}
                linkWidth={link => {
                    // Check if link connects two highlighted nodes
                    if (highlightedNodeIds.size > 0) {
                        const sourceId = typeof link.source === 'object' ? (link.source as Node).id : link.source;
                        const targetId = typeof link.target === 'object' ? (link.target as Node).id : link.target;
                        if (highlightedNodeIds.has(sourceId as string) && highlightedNodeIds.has(targetId as string)) {
                            return 2;
                        }
                        return 0.5;
                    }
                    return 1;
                }}
                linkColor={() => '#94a3b8'} // slate-400
                backgroundColor="#f8fafc" // slate-50
                onNodeClick={handleNodeClick as any}
                cooldownTicks={100}
                d3AlphaDecay={0.02} // Slower decay = more stable final layout
                d3VelocityDecay={0.3} // Medium friction
            />
            {isCalculating && (
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    background: 'rgba(255, 255, 255, 0.8)',
                    padding: '1rem',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    pointerEvents: 'none'
                }}>
                    Calcul du réseau...
                </div>
            )}
            <div className="network-controls" style={{
                position: 'absolute',
                bottom: 20,
                right: 20,
                background: 'white',
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid #e2e8f0',
                fontSize: 12,
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                color: '#64748b'
            }}>
                Molette pour zoomer • Glisser pour déplacer • Clic pour détails
            </div>
        </div>
    );
};
