import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { forceX, forceY } from 'd3-force';
import { useGraphData } from '../hooks/useGraphData';
import { getTypeColor } from '../theme';
import type { Card, Node, Link } from '../types';
import {
    Loader2,
    X,
    Zap
} from 'lucide-react';
import { NetworkTooltip } from './NetworkTooltip';

interface NetworkViewProps {
    cards: Card[];
    onNodeClick?: (id: string) => void;
    searchQuery?: string;
    highlightedIds?: Set<string>;
    activeFilters?: string[];
    onSuppressConnections?: (pairs: { sourceId: string, targetId: string }[]) => void;
    semanticReady?: boolean;
    vetoPairs?: string[];
    width?: number; // Optional, defaults to auto-fill
    height?: number;
    typeCompat?: any;
}


export const NetworkView: React.FC<NetworkViewProps> = ({
    cards,
    onNodeClick,
    searchQuery,
    highlightedIds,
    activeFilters,
    onSuppressConnections,
    vetoPairs,
    width,
    height
}) => {
    const { graphData, isLoading } = useGraphData({ cards, vetoPairs });

    // Interaction state
    const [hoverNode, setHoverNode] = useState<Node | null>(null);
    const [selectedNodes, setSelectedNodes] = useState<Set<string>>(new Set());
    const [pathLinks, setPathLinks] = useState<Set<string>>(new Set());

    // Search Depth State (1 = direct match, 2 = neighbors, 3 = extended, 0/Infinity = All)
    const [searchDepth, setSearchDepth] = useState<number>(1);

    // Link Hover State
    const [hoverLink, setHoverLink] = useState<Link | null>(null);

    // Refs for graph control
    const fgRef = useRef<any>(null);

    // Interaction Logic: Click Timer for Double Click (Moved here to avoid "Rendered fewer hooks" error)
    const lastClickTimeRef = useRef<number>(0);
    const lastClickNodeIdRef = useRef<string | null>(null);
    const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);


    // ===============================================
    // PATHFINDING (Dataset Dijkstra)
    // ===============================================
    const findWeightedPath = useCallback((startNodeId: string, endNodeId: string, links: Link[]) => {
        // Build adjacency map with costs
        // Cost = 1 / (Value^2) -> Stronger links (high value) have much lower cost
        const adjacency = new Map<string, { target: string, cost: number, linkId: string }[]>();

        links.forEach(link => {
            const src = typeof link.source === 'object' ? (link.source as any).id : link.source;
            const tgt = typeof link.target === 'object' ? (link.target as any).id : link.target;
            const val = link.value || 0.1;
            const cost = 1 / (val * val);

            const linkKey = [src, tgt].sort().join('-');

            if (!adjacency.has(src)) adjacency.set(src, []);
            if (!adjacency.has(tgt)) adjacency.set(tgt, []);

            adjacency.get(src)!.push({ target: tgt, cost, linkId: linkKey });
            adjacency.get(tgt)!.push({ target: src, cost, linkId: linkKey });
        });

        // Dijkstra Priority Queue
        const distances = new Map<string, number>();
        const previous = new Map<string, string>();
        const pq: { id: string, dist: number }[] = [];

        distances.set(startNodeId, 0);
        pq.push({ id: startNodeId, dist: 0 });

        const visited = new Set<string>();

        while (pq.length > 0) {
            pq.sort((a, b) => a.dist - b.dist);
            const { id: current, dist } = pq.shift()!;

            if (visited.has(current)) continue;
            visited.add(current);

            if (current === endNodeId) break;

            const neighbors = adjacency.get(current) || [];
            for (const neighbor of neighbors) {
                if (visited.has(neighbor.target)) continue;

                const newDist = dist + neighbor.cost;
                const existingDist = distances.get(neighbor.target);

                if (existingDist === undefined || newDist < existingDist) {
                    distances.set(neighbor.target, newDist);
                    previous.set(neighbor.target, current);
                    pq.push({ id: neighbor.target, dist: newDist });
                }
            }
        }

        if (!previous.has(endNodeId) && startNodeId !== endNodeId) return null;

        const path: string[] = [];
        let curr: string | undefined = endNodeId;
        while (curr) {
            path.unshift(curr);
            curr = previous.get(curr);
        }
        return path;
    }, []);

    const handleNodeClick = useCallback((node: Node, event?: MouseEvent) => {
        // Shift+Click or Alt+Click -> Add to Path Selection
        // Normal Click -> Open Card Details (unless in path mode?)

        // Actually, let's keep it simple: 
        // If Shift is held, we manipulate the path selection.
        // If not held, we open the card (and maybe clear path selection?).

        const isModifier = event?.shiftKey || event?.ctrlKey || event?.metaKey || event?.altKey;

        if (isModifier) {
            setSelectedNodes(prev => {
                const next = new Set(prev);
                if (next.has(node.id)) {
                    next.delete(node.id);
                    setPathLinks(new Set());
                } else {
                    next.add(node.id);
                    // Calculate path if exactly 2 nodes
                    if (next.size === 2) {
                        const [start, end] = Array.from(next);
                        const path = findWeightedPath(start, end, graphData.links);
                        if (path) {
                            const newPathLinks = new Set<string>();
                            for (let i = 0; i < path.length - 1; i++) {
                                const a = path[i];
                                const b = path[i + 1];
                                const linkKey = [a, b].sort().join('-');
                                newPathLinks.add(linkKey);
                            }
                            setPathLinks(newPathLinks);
                        }
                    } else if (next.size > 2) {
                        // Reset if more than 2
                        next.clear();
                        next.add(node.id);
                        setPathLinks(new Set());
                    }
                }
                return next;
            });
            // Don't open/close card when modifying selection
            return;
        }

        // Normal Click: Only open details
        onNodeClick?.(node.id);

        // Optional: Clear path selection on normal click? 
        // User might want to keep the path visible while exploring. 
        // Let's keep it.

    }, [findWeightedPath, graphData.links, onNodeClick]);

    // ===============================================
    // DATA FILTERING vs HIGHLIGHTING
    // ===============================================

    // 1. Structural Filter: Removes nodes entirely (e.g. by Category)
    const structuralData = useMemo(() => {
        let nodes = graphData.nodes;
        let links = graphData.links;

        // Apply Category Filters (Strict)
        if (activeFilters && activeFilters.length > 0) {
            const allowedTypes = new Set(activeFilters);
            const keepIds = new Set<string>();
            nodes = nodes.filter(n => {
                if (allowedTypes.has(n.type)) {
                    keepIds.add(n.id);
                    return true;
                }
                return false;
            });
            links = links.filter(l => {
                const src = typeof l.source === 'object' ? (l.source as any).id : l.source;
                const tgt = typeof l.target === 'object' ? (l.target as any).id : l.target;
                return keepIds.has(src) && keepIds.has(tgt);
            });
        }

        // Also apply local suppression filter if not caught by worker yet
        // This makes the UI feel instant
        links = links.filter(() => {
            // We can check if `reason` explicitly says "Manual" or similar, 
            // but `suppressedConnections` check requires Node object access which might not have it attached.
            // Since we added it to worker, let's rely on worker + ensuring worker is triggered.
            return true;
        });

        return { nodes, links };
    }, [graphData, activeFilters]);

    // 2. Visual Highlight: Determines what is "Dimmed" based on Search
    const searchHighlightIds = useMemo(() => {
        if (!searchQuery && (!highlightedIds || highlightedIds.size === 0)) return null; // No active search highlight

        // Find matches
        const matches = new Set<string>();
        structuralData.nodes.forEach(n => {
            if (searchQuery && n.name.toLowerCase().includes(searchQuery.toLowerCase())) matches.add(n.id);
            if (highlightedIds && highlightedIds.has(n.id)) matches.add(n.id);
        });

        if (matches.size === 0) return new Set<string>();

        // Expand by Depth
        let currentLayer = new Set(matches);
        const accumulated = new Set(matches);

        for (let d = 0; d < searchDepth; d++) {
            const nextLayer = new Set<string>();
            structuralData.links.forEach(l => {
                const src = typeof l.source === 'object' ? (l.source as any).id : l.source;
                const tgt = typeof l.target === 'object' ? (l.target as any).id : l.target;

                if (currentLayer.has(src) && !accumulated.has(tgt)) {
                    nextLayer.add(tgt);
                    accumulated.add(tgt);
                }
                if (currentLayer.has(tgt) && !accumulated.has(src)) {
                    nextLayer.add(src);
                    accumulated.add(src);
                }
            });
            currentLayer = nextLayer;
            if (currentLayer.size === 0) break;
        }

        return accumulated;
    }, [structuralData, searchQuery, highlightedIds, searchDepth]);

    // ===============================================
    // RENDER HELPERS
    // ===============================================

    // Link Hover Delay Logic
    const handleLinkHover = useCallback((link: Link | null) => {
        if (link) {
            if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
            setHoverLink(link);
        } else {
            // Delay clearing to allow moving to tooltip
            hoverTimeoutRef.current = setTimeout(() => {
                setHoverLink(null);
            }, 300);
        }
    }, []);

    const nodePaint = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
        if (!Number.isFinite(node.x) || !Number.isFinite(node.y)) return;

        // Visual States
        const isHover = node === hoverNode;
        const isSelected = selectedNodes.has(node.id);

        let isDimmed = false;

        if (hoverNode) {
            const isNeighbor = graphData.links.some(link => {
                const src = typeof link.source === 'object' ? (link.source as any).id : link.source;
                const tgt = typeof link.target === 'object' ? (link.target as any).id : link.target;
                return (src === hoverNode.id && tgt === node.id) || (tgt === hoverNode.id && src === node.id);
            });
            if (!isHover && !isNeighbor) isDimmed = true;
        } else if (searchHighlightIds) {
            if (!searchHighlightIds.has(node.id)) isDimmed = true;
        }

        ctx.save();

        if (isDimmed) {
            ctx.globalAlpha = 0.05; // Very faint for non-relevant nodes
        }

        const label = node.name;
        const color = getTypeColor(node.type);
        const radius = Math.max(2, Math.min(node.val || 2, 8));

        // Selection Halo
        if (isHover || isSelected) {
            ctx.beginPath();
            ctx.arc(node.x, node.y, radius + 4, 0, 2 * Math.PI, false);
            ctx.fillStyle = isSelected ? 'rgba(59, 130, 246, 0.2)' : 'rgba(0, 0, 0, 0.1)';
            ctx.fill();
            ctx.strokeStyle = isSelected ? '#3b82f6' : color;
            ctx.lineWidth = 2 / globalScale;
            ctx.stroke();
        }

        // Node Body
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
        ctx.fillStyle = color;
        ctx.fill();

        // Text Visibility Logic
        // 1. Hover/Selected: ALWAYS show.
        // 2. Search Active: Only show if Highlighted AND zoomed in closer than global view.
        // 3. Normal: Show if zoomed in.
        let showText = false;

        if (isHover || isSelected) {
            showText = true;
        } else if (searchHighlightIds) {
            // Search Mode: Only show matches, and only if not too far zoomed out
            if (searchHighlightIds.has(node.id) && globalScale > 0.8) {
                showText = true;
            }
        } else {
            // Normal Mode
            if (globalScale > 1.5 && !isDimmed) {
                showText = true;
            }
        }

        if (showText) {
            const fontSize = 12 / globalScale;
            ctx.font = `600 ${fontSize}px Inter, Sans-Serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // Stroke for readability
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 3 / globalScale;
            ctx.strokeText(label, node.x, node.y + radius + 6);

            ctx.fillStyle = '#1e293b';
            ctx.fillText(label, node.x, node.y + radius + 6);
        }

        ctx.restore();
    }, [hoverNode, selectedNodes, graphData.links, searchHighlightIds]);

    const linkPaint = useCallback((link: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
        const source = link.source;
        const target = link.target;

        if (!Number.isFinite(source.x) || !Number.isFinite(source.y) ||
            !Number.isFinite(target.x) || !Number.isFinite(target.y)) return;

        const isHover = (hoverNode && (source.id === hoverNode.id || target.id === hoverNode.id)) || (hoverLink === link);
        const linkKey = [source.id, target.id].sort().join('-');
        const isPath = pathLinks.has(linkKey);

        let isDimmed = false;
        if (hoverNode) {
            if (!isHover) isDimmed = true;
        } else if (searchHighlightIds) {
            if (!searchHighlightIds.has(source.id) || !searchHighlightIds.has(target.id)) isDimmed = true;
        }
        if (isPath) isDimmed = false;

        if (isDimmed) {
            ctx.globalAlpha = 0.05;
        } else if (isPath || isHover) {
            ctx.globalAlpha = 1;
        } else {
            ctx.globalAlpha = 0.4;
        }

        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        ctx.lineTo(target.x, target.y);

        const useGradient = globalScale > 0.8 || isHover; // isPath is handled above

        if (useGradient) {
            const gradient = ctx.createLinearGradient(source.x, source.y, target.x, target.y);
            gradient.addColorStop(0, getTypeColor(source.type));
            gradient.addColorStop(1, getTypeColor(target.type));
            ctx.strokeStyle = gradient;
            ctx.lineWidth = (isHover ? 2.5 : 1) / globalScale;
            ctx.shadowBlur = 0;
            ctx.setLineDash([]);
        } else {
            ctx.strokeStyle = getTypeColor(source.type);
            ctx.lineWidth = 1 / globalScale;
            ctx.shadowBlur = 0;
            ctx.setLineDash([]);
        }

        const isManual = source.manualConnections?.includes(target.id) || target.manualConnections?.includes(source.id);

        if (!isManual) { // isPath is handled above
            ctx.setLineDash([3 / globalScale, 3 / globalScale]);
        } else {
            ctx.setLineDash([]);
        }

        ctx.stroke();

        // Fix: Reset context        // Reset Context
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
        ctx.setLineDash([]);

    }, [hoverNode, pathLinks, searchHighlightIds, hoverLink]); // Removed globalScale


    // Physics Engine Tuning
    useEffect(() => {
        if (fgRef.current) {
            // Physics: Add gravity to pull isolated nodes/clusters to center
            fgRef.current.d3Force('x', forceX(0).strength(0.08));
            fgRef.current.d3Force('y', forceY(0).strength(0.08));

            fgRef.current.d3Force('charge').strength(-80); // Less repulsion
            fgRef.current.d3Force('center').strength(0.6); // Strong centering
            fgRef.current.d3Force('link').distance(40); // Shorter links
            fgRef.current.d3ReheatSimulation();
        }
    }, [fgRef, graphData]);

    if (isLoading && graphData.nodes.length === 0) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-4 text-slate-400">
                    <Loader2 className="animate-spin" size={32} />
                    <p className="text-sm font-medium">Chargement du graphe...</p>
                </div>
            </div>
        );
    }



    const handleGraphNodeClick = (node: any) => {
        const now = Date.now();
        const isDoubleClick = lastClickNodeIdRef.current === node.id && (now - lastClickTimeRef.current) < 300;

        if (isDoubleClick) {
            // Double Click -> Open Details
            onNodeClick?.(node.id);
            lastClickNodeIdRef.current = null; // Reset
        } else {
            // Single Click -> Toggle Selection
            handleNodeClick(node);
            lastClickTimeRef.current = now;
            lastClickNodeIdRef.current = node.id;
        }
    };

    return (
        <div className="relative w-full h-full bg-slate-50 overflow-hidden">
            <ForceGraph2D
                ref={fgRef}
                width={width}
                height={height}
                graphData={structuralData}
                nodeLabel="name"
                nodeCanvasObject={nodePaint}
                linkCanvasObject={linkPaint}

                cooldownTicks={100}
                d3AlphaDecay={0.02}
                d3VelocityDecay={0.3}
                warmupTicks={50}

                onNodeHover={(node: any) => {
                    setHoverNode(node || null);
                    document.body.style.cursor = node ? 'pointer' : 'default';
                }}
                onLinkHover={handleLinkHover}

                // Interaction Logic
                onNodeClick={handleGraphNodeClick}

                onBackgroundClick={() => {
                    setSelectedNodes(new Set());
                    setPathLinks(new Set());
                }}
                minZoom={0.1}
                maxZoom={6}
            />

            {/* Top-Centered Minimalist Link Tooltip (Sober Redesign) */}
            {hoverLink && (
                <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-50 pointer-events-auto">
                    <NetworkTooltip
                        link={hoverLink}
                        onReportIncorrect={
                            (hoverLink.type === 'semantic' || hoverLink.type === 'hybrid' || hoverLink.type === 'rrf' || !hoverLink.type) && onSuppressConnections
                                ? () => {
                                    const sId = typeof hoverLink.source === 'string' ? hoverLink.source : (hoverLink.source as any).id;
                                    const tId = typeof hoverLink.target === 'string' ? hoverLink.target : (hoverLink.target as any).id;
                                    onSuppressConnections([{ sourceId: sId, targetId: tId }]);
                                    setHoverLink(null);
                                }
                                : undefined
                        }
                    />
                </div>
            )}

            {/* Selection Card with actions */}
            {selectedNodes.size > 0 && (
                <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-40 pointer-events-auto">
                    <div className="
                        bg-white/95 backdrop-blur-md 
                        border border-slate-200 shadow-xl
                        rounded-xl p-3 flex items-center gap-4
                        animate-in slide-in-from-bottom-4 zoom-in-95 duration-200
                     ">
                        <div className="flex -space-x-2">
                            {Array.from(selectedNodes).slice(0, 3).map(id => {
                                const node = graphData.nodes.find(n => n.id === id);
                                return (
                                    <div key={id}
                                        className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold text-white shadow-sm"
                                        style={{ backgroundColor: node ? getTypeColor(node.type) : '#ccc' }}
                                        title={node?.name}
                                    >
                                        {node?.name.substring(0, 1)}
                                    </div>
                                );
                            })}
                            {selectedNodes.size > 3 && (
                                <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-medium text-slate-500 shadow-sm">
                                    +{selectedNodes.size - 3}
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col">
                            <div className="text-xs font-semibold text-slate-700">
                                {selectedNodes.size} sélectionné(s)
                            </div>
                            {pathLinks.size > 0 && (
                                <div className="text-[10px] text-indigo-500 font-medium flex items-center gap-1">
                                    <Zap size={10} fill="currentColor" /> Chemin trouvé ({pathLinks.size} liens)
                                </div>
                            )}
                        </div>

                        <div className="h-8 w-px bg-slate-200 mx-1" />

                        <div className="flex items-center gap-2">
                            {selectedNodes.size === 1 && (
                                <button
                                    onClick={() => onNodeClick?.(Array.from(selectedNodes)[0])}
                                    className="px-3 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg hover:bg-slate-800 transition-colors"
                                >
                                    Voir Détails
                                </button>
                            )}
                            <button
                                onClick={() => {
                                    setSelectedNodes(new Set());
                                    setPathLinks(new Set());
                                }}
                                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            )}


            {/* Top Right: Search Depth / Legend (unchanged mostly, just positioning check) */}
            <div className="absolute top-4 right-4 flex flex-col gap-2 items-end pointer-events-none">
                {searchQuery && (
                    <div className="pointer-events-auto flex items-center gap-2 bg-white/90 p-1.5 rounded-lg border border-slate-200 shadow-sm backdrop-blur-sm">
                        <span className="text-xs font-semibold text-slate-500 px-2">Profondeur:</span>
                        <div className="flex bg-slate-100 rounded p-0.5">
                            {[0, 1, 2, 3].map(d => (
                                <button
                                    key={d}
                                    onClick={() => setSearchDepth(d)}
                                    className={`
                                        px-2 py-0.5 text-xs rounded transition-all
                                        ${searchDepth === d
                                            ? 'bg-white text-emerald-600 shadow-sm font-medium'
                                            : 'text-slate-400 hover:text-slate-600'}
                                    `}
                                >
                                    {d === 0 ? 'Match' : `+${d}`}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Left: Selection Info (Polished) */}
            {selectedNodes.size > 0 && (
                <div className="absolute bottom-6 left-6 z-40 pointer-events-auto">
                    <div className="
                        bg-white/95 backdrop-blur-md 
                        border border-slate-200/60 
                        shadow-[0_8px_30px_rgba(0,0,0,0.12)]
                        rounded-xl p-4
                        flex flex-col gap-3
                        min-w-[240px]
                        animate-in zoom-in-95 duration-200
                    ">
                        <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-800 flex items-center gap-2">
                                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold">
                                    {selectedNodes.size}
                                </span>
                                éléments
                            </span>
                            <button
                                className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
                                onClick={() => {
                                    setSelectedNodes(new Set());
                                    setPathLinks(new Set());
                                }}
                            >
                                Tout effacer
                            </button>
                        </div>

                        {selectedNodes.size === 2 && (
                            <div className={`
                                text-xs px-3 py-2 rounded-lg border 
                                ${pathLinks.size > 0
                                    ? 'bg-indigo-50 border-indigo-100 text-indigo-700'
                                    : 'bg-slate-50 border-slate-100 text-slate-500'}
                                flex items-center gap-2
                            `}>
                                {pathLinks.size > 0 ? (
                                    <>
                                        <Zap size={12} className="text-indigo-500" />
                                        <span>Chemin optimal (Dijkstra)</span>
                                    </>
                                ) : (
                                    <span>Aucune connexion directe</span>
                                )}
                            </div>
                        )}

                        <div className="flex gap-2 mt-1">
                            {/* Future actions here */}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
