import { useMemo, useRef, useEffect, useCallback, useState } from 'react';
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
    x: number;
    y: number;
    vx: number;
    vy: number;
}

interface Link {
    source: string;
    target: string;
}

const typeColors: Record<string, string> = {
    drug: '#0d9488',
    patho: '#dc2626',
    physio: '#7c3aed',
    data: '#d97706',
};

export const NetworkView: React.FC<NetworkViewProps> = ({ cards, onNodeClick, searchQuery }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const nodesRef = useRef<Node[]>([]);
    const linksRef = useRef<Link[]>([]);
    const animationRef = useRef<number>(0);
    const hoveredNodeRef = useRef<string | null>(null);

    // Zoom and Pan state
    const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 });
    const isDraggingRef = useRef(false);
    const lastPosRef = useRef({ x: 0, y: 0 });

    // Build nodes and links from cards
    const { nodes, links } = useMemo(() => {
        const cardTitles = cards.map(c => ({ id: c.id, title: c.title.toLowerCase() }));
        const newLinks: Link[] = [];

        cards.forEach(card => {
            const searchText = (card.content + ' ' + card.details).toLowerCase();
            cardTitles.forEach(target => {
                if (target.id !== card.id && searchText.includes(target.title)) {
                    const exists = newLinks.some(
                        l => (l.source === card.id && l.target === target.id) ||
                            (l.source === target.id && l.target === card.id)
                    );
                    if (!exists) {
                        newLinks.push({ source: card.id, target: target.id });
                    }
                }
            });
        });

        // Initialize node positions randomly but clustered
        const newNodes: Node[] = cards.map((card, i) => ({
            id: card.id,
            name: card.title,
            type: card.type,
            x: Math.cos(i * 2 * Math.PI / cards.length) * 300,
            y: Math.sin(i * 2 * Math.PI / cards.length) * 300,
            vx: 0,
            vy: 0,
        }));

        return { nodes: newNodes, links: newLinks };
    }, [cards]);

    // Determine highlighted nodes based on search
    const highlightedNodeIds = useMemo(() => {
        if (!searchQuery) return new Set(cards.map(c => c.id));

        const query = searchQuery.toLowerCase();
        const matches = cards.filter(c =>
            c.title.toLowerCase().includes(query) ||
            c.content.toLowerCase().includes(query) ||
            c.tags.some(t => t.toLowerCase().includes(query))
        );

        const ids = new Set(matches.map(m => m.id));
        // Also include neighbors of matches ?? Maybe too much noise.
        // Let's stick to direct matches for now, visual filtering.
        return ids;
    }, [cards, searchQuery]);

    // Simple force simulation
    const simulate = useCallback(() => {
        const nodesList = nodesRef.current;
        const linksList = linksRef.current;

        if (!nodesList.length) return;

        // Repulsion
        for (let i = 0; i < nodesList.length; i++) {
            for (let j = i + 1; j < nodesList.length; j++) {
                const dx = nodesList[j].x - nodesList[i].x;
                const dy = nodesList[j].y - nodesList[i].y;
                const distSq = dx * dx + dy * dy || 1;
                const dist = Math.sqrt(distSq);
                const force = 10000 / distSq; // Stronger repulsion for spacing

                const fx = (dx / dist) * force;
                const fy = (dy / dist) * force;

                nodesList[i].vx -= fx;
                nodesList[i].vy -= fy;
                nodesList[j].vx += fx;
                nodesList[j].vy += fy;
            }
        }

        // Link attraction
        linksList.forEach(link => {
            const source = nodesList.find(n => n.id === link.source);
            const target = nodesList.find(n => n.id === link.target);
            if (source && target) {
                const dx = target.x - source.x;
                const dy = target.y - source.y;
                const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                const force = (dist - 100) * 0.05; // Spring length 100

                const fx = (dx / dist) * force;
                const fy = (dy / dist) * force;

                source.vx += fx;
                source.vy += fy;
                target.vx -= fx;
                target.vy -= fy;
            }
        });

        // Center gravity (weak)
        nodesList.forEach(node => {
            node.vx -= node.x * 0.005;
            node.vy -= node.y * 0.005;
        });

        // Apply velocity
        nodesList.forEach(node => {
            node.vx *= 0.85; // Damping
            node.vy *= 0.85;
            node.x += node.vx;
            node.y += node.vy;
        });
    }, []);

    // Draw the graph
    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        const width = containerRef.current?.clientWidth || 800;
        const height = containerRef.current?.clientHeight || 600;

        if (canvas.width !== width || canvas.height !== height) {
            canvas.width = width;
            canvas.height = height;
        }

        // Clear
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);

        ctx.save();
        // Apply zoom/pan transform
        // Center of canvas is (width/2, height/2)
        ctx.translate(width / 2 + transform.x, height / 2 + transform.y);
        ctx.scale(transform.k, transform.k);

        const nodesList = nodesRef.current;
        const linksList = linksRef.current;

        // Draw links
        linksList.forEach(link => {
            const source = nodesList.find(n => n.id === link.source);
            const target = nodesList.find(n => n.id === link.target);

            if (source && target) {
                // Opacity checks
                const sourceDim = !highlightedNodeIds.has(source.id);
                const targetDim = !highlightedNodeIds.has(target.id);

                ctx.strokeStyle = (sourceDim || targetDim) ? '#e2e8f0' : '#cbd5e1';
                ctx.lineWidth = (sourceDim || targetDim) ? 1 : 1.5;
                ctx.globalAlpha = (sourceDim || targetDim) ? 0.3 : 1;

                ctx.beginPath();
                ctx.moveTo(source.x, source.y);
                ctx.lineTo(target.x, target.y);
                ctx.stroke();
            }
        });

        // Draw nodes
        nodesList.forEach(node => {
            const isHovered = hoveredNodeRef.current === node.id;
            const isDimmed = !highlightedNodeIds.has(node.id);

            const radius = isHovered ? 12 : 8;

            ctx.globalAlpha = isDimmed ? 0.2 : 1;

            // Node circle
            ctx.beginPath();
            ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
            ctx.fillStyle = typeColors[node.type] || '#888';
            ctx.fill();

            if (isHovered) {
                ctx.strokeStyle = '#1e293b';
                ctx.lineWidth = 2;
                ctx.stroke();
            }

            // Label (only if hovered, highlighted, or not dimmed)
            if (isHovered || !isDimmed) {
                ctx.font = `${isHovered ? 'bold ' : ''}12px Inter, sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'top';
                ctx.fillStyle = isDimmed ? '#94a3b8' : '#334155';
                // Draw background for readability?
                // ctx.fillText(node.name, node.x, node.y + radius + 4);

                // Let's draw text with outline for better contrast
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 3;
                ctx.strokeText(node.name, node.x, node.y + radius + 4);
                ctx.fillText(node.name, node.x, node.y + radius + 4);
            }
        });

        ctx.restore();

    }, [transform, highlightedNodeIds]);

    // Animation loop
    useEffect(() => {
        nodesRef.current = nodes;
        linksRef.current = links;

        // Re-heat simulation when data changes
        let frame = 0;
        const animate = () => {
            if (frame < 300) {
                simulate();
            }
            draw();
            frame++;
            animationRef.current = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [nodes, links, simulate, draw]);

    // Mouse handlers for Pan/Zoom
    const handleWheel = (e: React.WheelEvent) => {
        // Zoom
        const scaleFactor = 1.1;
        const newScale = e.deltaY < 0 ? transform.k * scaleFactor : transform.k / scaleFactor;
        // Limit zoom
        if (newScale < 0.1 || newScale > 5) return;

        setTransform(prev => ({ ...prev, k: newScale }));
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        isDraggingRef.current = true;
        lastPosRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDraggingRef.current) {
            const dx = e.clientX - lastPosRef.current.x;
            const dy = e.clientY - lastPosRef.current.y;
            setTransform(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
            lastPosRef.current = { x: e.clientX, y: e.clientY };
            return; // Skip node hover check while dragging
        }

        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        // Convert screen coordinates to world coordinates
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;

        const width = rect.width;
        const height = rect.height;

        // Inverse transform
        const worldX = (screenX - width / 2 - transform.x) / transform.k;
        const worldY = (screenY - height / 2 - transform.y) / transform.k;

        // Find node
        const node = nodesRef.current.find(n => {
            const dx = worldX - n.x;
            const dy = worldY - n.y;
            return dx * dx + dy * dy < 20 * 20; // Hit radius
        });

        hoveredNodeRef.current = node?.id || null;
        if (canvasRef.current) {
            canvasRef.current.style.cursor = node ? 'pointer' : (isDraggingRef.current ? 'grabbing' : 'grab');
        }
    };

    const handleMouseUp = () => {
        isDraggingRef.current = false;
    };

    const handleClick = (e: React.MouseEvent) => {
        if (Math.abs(e.clientX - lastPosRef.current.x) > 5 ||
            Math.abs(e.clientY - lastPosRef.current.y) > 5) {
            // It was a drag, not a click
            return;
        }

        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        const width = rect.width;
        const height = rect.height;

        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;

        const worldX = (screenX - width / 2 - transform.x) / transform.k;
        const worldY = (screenY - height / 2 - transform.y) / transform.k;

        const node = nodesRef.current.find(n => {
            const dx = worldX - n.x;
            const dy = worldY - n.y;
            return dx * dx + dy * dy < 20 * 20;
        });

        if (node) {
            onNodeClick(node.id);
        }
    };

    return (
        <div ref={containerRef} className="network-container">
            <canvas
                ref={canvasRef}
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onClick={handleClick}
                style={{ cursor: 'grab' }}
            />
            <div className="network-controls" style={{ position: 'absolute', bottom: 20, right: 20, background: 'white', padding: '5px 10px', borderRadius: 8, border: '1px solid #ccc', fontSize: 12 }}>
                Zoom: {Math.round(transform.k * 100)}% | Scroll pour Zoomer | Glisser pour déplacer
            </div>
        </div>
    );
};
