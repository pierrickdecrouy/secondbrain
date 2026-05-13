import React, { useState, useMemo, useRef, useCallback, useEffect, lazy, Suspense } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { forceX, forceY } from 'd3-force';
import { useGraphData } from '../hooks/useGraphData';
import { getTypeColor } from '../theme';
import type { Card, Node, Link } from '../types';
import {
    CircleNotch,
    Lightning,
    Cube,
    Square
} from '@phosphor-icons/react';
import { NetworkTooltip } from './NetworkTooltip';
import { findStrongestPath } from '../algorithms/graphAlgorithms';
import { detectCommunities } from '../algorithms/communityDetection';
import { useTheme } from '../context/ThemeContext';

// Lazy-load the 3D graph (heavy Three.js bundle)
const ForceGraph3D = lazy(() => import('react-force-graph-3d'));

const OVERDUE_PENALTY_FACTOR = 0.35;

type GraphNode = Node & {
    x?: number;
    y?: number;
    val?: number;
    manualConnections?: string[];
};

type GraphLink = Link & {
    source: string | GraphNode;
    target: string | GraphNode;
};

const linkEndpointId = (endpoint: GraphLink['source']): string =>
    typeof endpoint === 'string' ? endpoint : endpoint.id;

interface NetworkViewProps {
    cards: Card[];
    onNodeClick?: (id: string) => void;
    onClusterReview?: (cardIds: string[]) => void;
    searchQuery?: string;
    highlightedIds?: Set<string>;
    activeFilters?: string[];
    onSuppressConnections?: (pairs: { sourceId: string, targetId: string }[]) => void;
    semanticReady?: boolean;
    vetoPairs?: string[];
    width?: number; // Optional, defaults to auto-fill
    height?: number;
    typeCompat?: Record<string, number>;
}


export const NetworkView: React.FC<NetworkViewProps> = ({
    cards,
    onNodeClick,
    onClusterReview,
    searchQuery,
    highlightedIds,
    activeFilters,
    onSuppressConnections,
    vetoPairs,
    width,
    height
}) => {
    const { graphData, isLoading, error } = useGraphData({ cards, vetoPairs });
    const { darkMode: isDark } = useTheme();

    // 2D / 3D mode toggle
    const [use3D, setUse3D] = useState(false);

    // Interaction state
    const [hoverNode, setHoverNode] = useState<Node | null>(null);
    const [selectedNodes, setSelectedNodes] = useState<Set<string>>(new Set());
    const [pathLinks, setPathLinks] = useState<Set<string>>(new Set());

    // Search Depth State (1 = direct match, 2 = neighbors, 3 = extended, 0/Infinity = All)
    const [searchDepth, setSearchDepth] = useState<number>(1);
    const [reviewTimeMarker] = useState<number>(() => Date.now());

    // Link Hover State
    const [hoverLink, setHoverLink] = useState<Link | null>(null);

    // Refs for graph control
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fgRef = useRef<any>(null);

    // Interaction Logic: Click Timer for Double Click (Moved here to avoid "Rendered fewer hooks" error)
    const lastClickTimeRef = useRef<number>(0);
    const lastClickNodeIdRef = useRef<string | null>(null);
    const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);


    // ===============================================
    // PATHFINDING (Uses shared algorithm)
    // ===============================================

    const handleNodeClick = useCallback((node: Node, event?: MouseEvent) => {
        // Shift+Click or Alt+Click -> Add to Path Selection
        // Normal Click -> Open Card Details

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
                        // Use the imported strong path algo
                        // Note: graphData.links has source/target as Objects here (from D3) but our util handles it
                        const path = findStrongestPath(graphData.nodes, graphData.links, start, end);

                        if (path && path.length > 0) {
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

    }, [graphData, onNodeClick]);

    // ===============================================
    // DATA FILTERING vs HIGHLIGHTING
    // ===============================================

    // 1. Structural Filter: Removes nodes entirely (e.g. by Category)
    const structuralData = useMemo(() => {
        let nodes = graphData.nodes;
        let links = graphData.links;

        // Apply Category Filters (Strict)
        if (activeFilters && activeFilters.length > 0) {
            // Filter out special UI-only filters like 'needs-review' or 'all'
            const realTypeFilters = activeFilters.filter(f => f !== 'needs-review' && f !== 'all');

            if (realTypeFilters.length > 0) {
                const allowedTypes = new Set(realTypeFilters);
                const keepIds = new Set<string>();
                nodes = nodes.filter(n => {
                    if (allowedTypes.has(n.type)) {
                        keepIds.add(n.id);
                        return true;
                    }
                    return false;
                });
                links = links.filter(l => {
                    const src = linkEndpointId(l.source as GraphLink['source']);
                    const tgt = linkEndpointId(l.target as GraphLink['target']);
                    return keepIds.has(src) && keepIds.has(tgt);
                });
            }
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
                const src = linkEndpointId(l.source as GraphLink['source']);
                const tgt = linkEndpointId(l.target as GraphLink['target']);

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

    const weakClusters = useMemo(() => {
        if (!onClusterReview || structuralData.nodes.length < 3) return [];
        const communities = detectCommunities(structuralData.nodes, structuralData.links);
        const groups = new Map<string, string[]>();
        communities.forEach((clusterId, nodeId) => {
            if (!groups.has(clusterId)) groups.set(clusterId, []);
            groups.get(clusterId)!.push(nodeId);
        });

        const withScores = Array.from(groups.values())
            .filter(group => group.length >= 3)
            .map(group => {
                const clusterCards = group
                    .map(id => cards.find(c => c.id === id))
                    .filter((c): c is Card => Boolean(c));
                if (clusterCards.length === 0) return null;

                const masteryScores = clusterCards.map(card => {
                    const p = card.progress;
                    if (!p) return 0.25;
                    const intervalScore = Math.min(1, Math.max(0, (p.interval || 0) / 21));
                    const overduePenalty = p.dueDate && new Date(p.dueDate).getTime() < reviewTimeMarker ? OVERDUE_PENALTY_FACTOR : 0;
                    return Math.max(0, intervalScore - overduePenalty);
                });
                const mastery = masteryScores.reduce((sum, n) => sum + n, 0) / masteryScores.length;
                const overdueCount = clusterCards.filter(card => card.progress?.dueDate && new Date(card.progress.dueDate).getTime() <= reviewTimeMarker).length;
                const weakness = (1 - mastery) + (overdueCount / clusterCards.length) * 0.7;
                return { cardIds: clusterCards.map(c => c.id), weakness, mastery, overdueCount };
            })
            .filter((entry): entry is { cardIds: string[]; weakness: number; mastery: number; overdueCount: number } => Boolean(entry))
            .sort((a, b) => b.weakness - a.weakness)
            .slice(0, 4);

        return withScores;
    }, [structuralData, cards, onClusterReview, reviewTimeMarker]);

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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nodePaint = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
        if (!Number.isFinite(node.x) || !Number.isFinite(node.y)) return;

        // Visual States
        const isHover = node === hoverNode;
        const isSelected = selectedNodes.has(node.id);

        let isDimmed = false;

        if (hoverNode) {
            const isNeighbor = graphData.links.some(link => {
                const src = linkEndpointId(link.source as GraphLink['source']);
                const tgt = linkEndpointId(link.target as GraphLink['target']);
                return (src === hoverNode.id && tgt === node.id) || (tgt === hoverNode.id && src === node.id);
            });
            if (!isHover && !isNeighbor) isDimmed = true;
        } else if (searchHighlightIds) {
            if (!searchHighlightIds.has(node.id)) isDimmed = true;
        }

        ctx.save();

        if (isDimmed) {
            ctx.globalAlpha = 0.06; // Very faint for non-relevant nodes
        }

        const label = node.name;
        const color = getTypeColor(node.type);
        const radius = Math.max(2, Math.min(node.val || 2, 8));

        // Selection Halo
        if (isHover || isSelected) {
            ctx.beginPath();
            ctx.arc(node.x, node.y, radius + 4, 0, 2 * Math.PI, false);
            ctx.fillStyle = isSelected ? 'rgba(59, 130, 246, 0.25)' : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0, 0, 0, 0.08)');
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
            if (searchHighlightIds.has(node.id) && globalScale > 0.8) {
                showText = true;
            }
        } else {
            if (globalScale > 1.5 && !isDimmed) {
                showText = true;
            }
        }

        if (showText) {
            const fontSize = 12 / globalScale;
            ctx.font = `600 ${fontSize}px Inter, Sans-Serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // Stroke for readability (use bg color as outline)
            ctx.strokeStyle = isDark ? '#0f172a' : '#ffffff';
            ctx.lineWidth = 3 / globalScale;
            ctx.strokeText(label, node.x, node.y + radius + 6);

            ctx.fillStyle = isDark ? '#f1f5f9' : '#1e293b';
            ctx.fillText(label, node.x, node.y + radius + 6);
        }

        ctx.restore();
    }, [hoverNode, selectedNodes, graphData.links, searchHighlightIds, isDark]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const linkPaint = useCallback((link: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
        const source = link.source;
        const target = link.target;

        if (typeof source === 'string' || typeof target === 'string') return;
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
        if (!use3D && fgRef.current) {
            // Physics: Add gravity to pull isolated nodes/clusters to center
            fgRef.current.d3Force('x', forceX(0).strength(0.08));
            fgRef.current.d3Force('y', forceY(0).strength(0.08));

            fgRef.current.d3Force('charge').strength(-80); // Less repulsion
            fgRef.current.d3Force('center').strength(0.6); // Strong centering
            fgRef.current.d3Force('link').distance(40); // Shorter links
            fgRef.current.d3ReheatSimulation();
        } else if (use3D && fgRef.current) {
            // 3D physics tuning
            try {
                fgRef.current.d3Force('charge')?.strength(-60);
                fgRef.current.d3Force('link')?.distance(50);
                fgRef.current.d3ReheatSimulation?.();
            } catch {
                // ForceGraph3D may not be mounted yet, ignore
            }
        }
    }, [fgRef, graphData, use3D]);

    if (isLoading && graphData.nodes.length === 0) {
        const isDark = document.documentElement.classList.contains('dark');
        return (
            <div className={`w-full h-full flex items-center justify-center ${isDark ? 'bg-slate-900' : 'bg-slate-50'}`}>
                <div className={`flex flex-col items-center gap-4 ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>
                    <CircleNotch className="animate-spin" size={32} />
                    <p className="text-sm font-medium">Chargement du graphe...</p>
                </div>
            </div>
        );
    }



    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

    const graphBg = isDark ? '#0f172a' : '#f8fafc';

    // 3D node color: apply highlight/dim logic via color
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const get3DNodeColor = (node: any) => {
        const baseColor = getTypeColor(node.type);
        const isHovered = hoverNode?.id === node.id;

        let isDimmed3D = false;
        if (hoverNode) {
            const isNeighbor = structuralData.links.some(link => {
                const src = linkEndpointId(link.source as GraphLink['source']);
                const tgt = linkEndpointId(link.target as GraphLink['target']);
                return (src === hoverNode.id && tgt === node.id) || (tgt === hoverNode.id && src === node.id);
            });
            if (!isHovered && !isNeighbor) isDimmed3D = true;
        } else if (searchHighlightIds && !searchHighlightIds.has(node.id)) {
            isDimmed3D = true;
        }

        if (isDimmed3D) return isDark ? '#1e2d3d' : '#cbd5e1';
        if (selectedNodes.has(node.id)) return '#3b82f6';
        return baseColor;
    };

    // 3D link color: dim non-highlighted links
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const get3DLinkColor = (link: any) => {
        const src = typeof link.source === 'object' ? link.source : ({ type: 'drug', id: link.source } as GraphNode);
        const tgt = typeof link.target === 'object' ? link.target : ({ type: 'drug', id: link.target } as GraphNode);
        const srcId = src.id;
        const tgtId = tgt.id;

        if (hoverNode) {
            const isConnected = srcId === hoverNode.id || tgtId === hoverNode.id;
            if (!isConnected) return isDark ? '#1e293b' : '#e2e8f0';
        } else if (searchHighlightIds) {
            if (!searchHighlightIds.has(srcId) || !searchHighlightIds.has(tgtId)) {
                return isDark ? '#1e293b' : '#e2e8f0';
            }
        }

        const linkKey = [srcId, tgtId].sort().join('-');
        if (pathLinks.has(linkKey)) return '#6366f1';
        return getTypeColor(src.type);
    };

    return (
        <div
            className="relative w-full h-full overflow-hidden"
            style={{ background: graphBg }}
        >
            {error && (
                <div className="absolute top-4 left-4 right-4 z-50 pointer-events-none">
                    <div className={`mx-auto max-w-2xl rounded-lg border px-4 py-2 text-sm shadow-sm ${isDark ? 'bg-red-900/70 border-red-700 text-red-100' : 'bg-red-50 border-red-200 text-red-700'}`}>
                        {error}
                    </div>
                </div>
            )}

            {/* 2D / 3D toggle button */}
            <div className={`absolute top-4 left-1/2 -translate-x-1/2 z-40 pointer-events-auto flex p-1 rounded-xl shadow-sm backdrop-blur-md transition-colors
                ${isDark ? 'bg-slate-800/80 border border-slate-700/50' : 'bg-slate-100/80 border border-slate-200/50'}`}>
                <button
                    onClick={() => setUse3D(false)}
                    className={`flex items-center justify-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-lg transition-all duration-200 min-w-[70px]
                        ${!use3D
                            ? (isDark ? 'bg-slate-700 text-white shadow-sm' : 'bg-white text-slate-900 shadow-sm')
                            : (isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/30' : 'text-slate-500 hover:text-slate-700 hover:bg-white/50')
                        }`}
                    title="Vue 2D"
                >
                    <Square size={14} weight={!use3D ? 'fill' : 'bold'} />
                    2D
                </button>
                <button
                    onClick={() => setUse3D(true)}
                    className={`flex items-center justify-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-lg transition-all duration-200 min-w-[70px]
                        ${use3D
                            ? (isDark ? 'bg-slate-700 text-white shadow-sm' : 'bg-white text-slate-900 shadow-sm')
                            : (isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/30' : 'text-slate-500 hover:text-slate-700 hover:bg-white/50')
                        }`}
                    title="Vue 3D"
                >
                    <Cube size={14} weight={use3D ? 'fill' : 'bold'} />
                    3D
                </button>
            </div>

            {/* Graph */}
            {use3D ? (
                <Suspense fallback={
                    <div className="w-full h-full flex items-center justify-center">
                        <CircleNotch className={`animate-spin ${isDark ? 'text-slate-500' : 'text-slate-400'}`} size={32} />
                    </div>
                }>
                    <ForceGraph3D
                        ref={fgRef}
                        width={width}
                        height={height}
                        graphData={structuralData}
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        nodeLabel={(node: any) => node.name}
                        nodeColor={get3DNodeColor}
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        nodeVal={(node: any) => {
                            const base = Math.max(1, Math.min(node.val || 1, 4));
                            return hoverNode?.id === node.id ? base * 2 : base;
                        }}
                        nodeOpacity={0.9}
                        linkColor={get3DLinkColor}
                        linkOpacity={0.6}
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        linkWidth={(link: any) => {
                            const src = linkEndpointId(link.source);
                            const tgt = linkEndpointId(link.target);
                            const linkKey = [src, tgt].sort().join('-');
                            if (pathLinks.has(linkKey)) return 3;
                            if (hoverNode && (src === hoverNode.id || tgt === hoverNode.id)) return 2;
                            return 1;
                        }}
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        onNodeHover={(node: any) => {
                            setHoverNode(node || null);
                            document.body.style.cursor = node ? 'pointer' : 'default';
                        }}
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        onNodeClick={(node: any) => {
                            handleGraphNodeClick(node);
                        }}
                        onBackgroundClick={() => {
                            setSelectedNodes(new Set());
                            setPathLinks(new Set());
                        }}
                        backgroundColor={graphBg}
                        d3AlphaDecay={0.02}
                        d3VelocityDecay={0.3}
                        warmupTicks={50}
                        cooldownTicks={100}
                    />
                </Suspense>
            ) : (
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

                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    onNodeHover={(node: any) => {
                        setHoverNode(node || null);
                        document.body.style.cursor = node ? 'pointer' : 'default';
                    }}
                    onLinkHover={handleLinkHover}

                    onNodeClick={handleGraphNodeClick}

                    onBackgroundClick={() => {
                        setSelectedNodes(new Set());
                        setPathLinks(new Set());
                    }}
                    minZoom={0.1}
                    maxZoom={6}
                />
            )}

            {/* Top-Centered Minimalist Link Tooltip (Sober Redesign) */}
            {hoverLink && (
                <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-50 pointer-events-auto">
                    <NetworkTooltip
                        link={hoverLink}
                        onReportIncorrect={
                            (hoverLink.type === 'semantic' || hoverLink.type === 'hybrid' || hoverLink.type === 'rrf' || !hoverLink.type) && onSuppressConnections
                                ? () => {
                                    const sId = linkEndpointId(hoverLink.source as GraphLink['source']);
                                    const tId = linkEndpointId(hoverLink.target as GraphLink['target']);
                                    onSuppressConnections([{ sourceId: sId, targetId: tId }]);
                                    setHoverLink(null);
                                }
                                : undefined
                        }
                    />
                </div>
            )}

            {/* Top Right: Search Depth control */}
            <div className="absolute top-4 right-4 flex flex-col gap-2 items-end pointer-events-none">
                {searchQuery && (
                    <div className={`pointer-events-auto flex items-center gap-2 p-1.5 rounded-lg border shadow-sm backdrop-blur-sm
                        ${isDark ? 'bg-slate-800/90 border-slate-700' : 'bg-white/90 border-slate-200'}`}>
                        <span className={`text-xs font-semibold px-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Profondeur:</span>
                        <div className={`flex rounded p-0.5 ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`}>
                            {[0, 1, 2, 3].map(d => (
                                <button
                                    key={d}
                                    onClick={() => setSearchDepth(d)}
                                    className={`
                                        px-2 py-0.5 text-xs rounded transition-all
                                        ${searchDepth === d
                                            ? isDark ? 'bg-slate-900 text-emerald-400 shadow-sm font-medium' : 'bg-white text-emerald-600 shadow-sm font-medium'
                                            : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-400 hover:text-slate-600'}
                                    `}
                                >
                                    {d === 0 ? 'Match' : `+${d}`}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Top Left: Cluster Review panel */}
            {weakClusters.length > 0 && onClusterReview && (
                <div className="absolute top-4 left-4 z-40 pointer-events-auto">
                    <div className={`border rounded-xl shadow-lg p-3 min-w-[260px]
                        ${isDark ? 'bg-slate-800/95 border-slate-700' : 'bg-white/95 border-slate-200'}`}>
                        <div className={`text-xs font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                            Cluster Review (priorité)
                        </div>
                        <div className="flex flex-col gap-2">
                            {weakClusters.map((cluster, idx) => (
                                <button
                                    key={`${cluster.cardIds[0]}-${idx}`}
                                    className={`text-left px-3 py-2 rounded-lg border transition-colors
                                        ${isDark
                                            ? 'border-slate-700 hover:border-indigo-500 hover:bg-indigo-900/30'
                                            : 'border-slate-200 hover:border-indigo-300 hover:bg-indigo-50'}`}
                                    onClick={() => onClusterReview(cluster.cardIds)}
                                >
                                    <div className={`text-xs font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                                        Cluster #{idx + 1} · {cluster.cardIds.length} fiches
                                    </div>
                                    <div className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                        Maîtrise: {(cluster.mastery * 100).toFixed(0)}% · En retard: {cluster.overdueCount}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Bottom Left: Selection Info */}
            {selectedNodes.size > 0 && (
                <div className="absolute bottom-6 left-6 z-40 pointer-events-auto">
                    <div className={`backdrop-blur-md border rounded-xl p-4 flex flex-col gap-3 min-w-[240px] animate-in zoom-in-95 duration-200
                        ${isDark
                            ? 'bg-slate-800/95 border-slate-700/60 shadow-[0_8px_30px_rgba(0,0,0,0.4)]'
                            : 'bg-white/95 border-slate-200/60 shadow-[0_8px_30px_rgba(0,0,0,0.12)]'}`}>
                        <div className="flex items-center justify-between">
                            <span className={`font-semibold flex items-center gap-2 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                                <span className={`flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold
                                    ${isDark ? 'bg-indigo-900/60 text-indigo-300' : 'bg-indigo-100 text-indigo-600'}`}>
                                    {selectedNodes.size}
                                </span>
                                éléments
                            </span>
                            <button
                                className={`text-xs transition-colors ${isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'}`}
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
                                text-xs px-3 py-2 rounded-lg border flex items-center gap-2
                                ${pathLinks.size > 0
                                    ? isDark ? 'bg-indigo-900/30 border-indigo-700/50 text-indigo-300' : 'bg-indigo-50 border-indigo-100 text-indigo-700'
                                    : isDark ? 'bg-slate-700/50 border-slate-600 text-slate-400' : 'bg-slate-50 border-slate-100 text-slate-500'}
                            `}>
                                {pathLinks.size > 0 ? (
                                    <>
                                        <Lightning size={12} className={isDark ? 'text-indigo-400' : 'text-indigo-500'} />
                                        <span>Chemin optimal (Dijkstra)</span>
                                    </>
                                ) : (
                                    <span>Aucune connexion directe</span>
                                )}
                            </div>
                        )}

                        {selectedNodes.size === 1 && (
                            <button
                                onClick={() => onNodeClick?.(Array.from(selectedNodes)[0])}
                                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors
                                    ${isDark ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
                            >
                                Voir Détails
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
