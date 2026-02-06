import { useMemo, useRef, useCallback, useState, useEffect } from 'react';
import ForceGraph2D, { type ForceGraphMethods } from 'react-force-graph-2d';
import type { Card } from '../types';

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

const typeColors: Record<string, string> = {
    drug: '#0d9488',
    patho: '#dc2626',
    physio: '#7c3aed',
    data: '#d97706',
};

// Compute links based on content matching title
const computeGraphData = (cards: Card[]) => {
    const cardTitles = cards.map(c => ({ id: c.id, title: c.title.toLowerCase() }));
    const links: Link[] = [];

    cards.forEach(card => {
        const searchText = (card.content + ' ' + card.details).toLowerCase();
        cardTitles.forEach(target => {
            if (target.id !== card.id && searchText.includes(target.title)) {
                // Avoid duplicates in undirected graph visualization
                const exists = links.some(
                    l => (l.source === card.id && l.target === target.id) ||
                        (l.source === target.id && l.target === card.id)
                );
                if (!exists) {
                    links.push({ source: card.id, target: target.id });
                }
            }
        });
    });

    const nodes = cards.map(c => ({
        id: c.id,
        name: c.title,
        type: c.type
    }));

    return { nodes, links };
};

export const NetworkView: React.FC<NetworkViewProps> = ({ cards, onNodeClick, searchQuery }) => {
    // Initialize with undefined to match ForceGraphMethods generic requirement often seeing issues with null
    const fgRef = useRef<ForceGraphMethods | undefined>(undefined);
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

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

    const graphData = useMemo(() => computeGraphData(cards), [cards]);

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

        ctx.font = `${fontSize}px Inter, Sans-Serif`;

        // Circle styling
        const r = 8;
        ctx.beginPath();
        ctx.arc(node.x!, node.y!, r, 0, 2 * Math.PI, false);

        // Fill
        if (isHighlighted) {
            ctx.fillStyle = typeColors[node.type] || '#888';
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

        // Label
        if (isHighlighted && globalScale > 1.2) { // Show labels only when drilled in slightly
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#1e293b'; // slate-800
            ctx.globalAlpha = 1;

            // Background for text visibility (optional halo)
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.lineWidth = 3;
            ctx.strokeText(label, node.x!, node.y! + r + 10);

            ctx.fillText(label, node.x!, node.y! + r + 10);
        }
    }, [highlightedNodeIds]);

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
