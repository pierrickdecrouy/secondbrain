
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
import { useGraphPaint } from '../hooks/useGraphPaint';
import { useNetworkFilters } from '../hooks/useNetworkFilters';
import type { GraphNode, GraphLink } from './NetworkGraphTypes';
import { linkEndpointId } from './NetworkGraphTypes';
import { useTheme } from '../context/ThemeContext';
import type { ClusterInfo } from '../utils/clustering';
import ClusteringWorker from '../workers/clustering.worker?worker';
import { NetworkControls } from './NetworkControls';

// Lazy-load the 3D graph (heavy Three.js bundle)
const ForceGraph3D = lazy(() => import('react-force-graph-3d'));




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
    typeCompat?: Record<string, number>;
    activeNodeId?: string | null;
    pendingClusterReview?: boolean;
    onStartClusterReview?: (clusterNodeIds: string[]) => void;
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
    height,
    semanticReady,
    typeCompat,
    activeNodeId,
    pendingClusterReview,
    onStartClusterReview
}) => {
    const { graphData, isLoading, error } = useGraphData({ cards, vetoPairs, semanticReady, typeCompat });
    const { darkMode: isDark } = useTheme();

    // 2D / 3D mode toggle
    const [use3D, setUse3D] = useState(false);

    // Interaction state
    const [hoverNode, setHoverNode] = useState<Node | null>(null);
    const [selectedNodes, setSelectedNodes] = useState<Set<string>>(new Set());
    const [pathLinks, setPathLinks] = useState<Set<string>>(new Set());

    // Search Depth State (1 = direct match, 2 = neighbors, 3 = extended, 0/Infinity = All)
    const [searchDepth, setSearchDepth] = useState<number>(1);

    // Link Hover State
    const [hoverLink, setHoverLink] = useState<Link | null>(null);

    // Zoom/Pan constants    
    const fgRef = useRef<any>(null);

    // Interaction Logic: Click Timer for Double Click (Moved here to avoid "Rendered fewer hooks" error)
    const lastClickTimeRef = useRef<number>(0);
    const lastClickNodeIdRef = useRef<string | null>(null);
    const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const hasCenteredRef = useRef(false);
    
    // Auto-resize for when NetworkView is in a split pane (Mixte mode)
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });

    useEffect(() => {
        if (!containerRef.current) return;
        
        // Auto-resize
        const resizeObserver = new ResizeObserver(entries => {
            for (const entry of entries) {
                if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
                    setDimensions({
                        width: entry.contentRect.width,
                        height: entry.contentRect.height
                    });
                }
            }
        });
        resizeObserver.observe(containerRef.current);

        // Visibility / intersection for performance (P-4)
        const intersectionObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (fgRef.current) {
                    if (entry.isIntersecting && document.visibilityState === 'visible') {
                        fgRef.current.resumeAnimation?.();
                    } else {
                        fgRef.current.pauseAnimation?.();
                    }
                }
            });
        }, { threshold: 0.1 });
        intersectionObserver.observe(containerRef.current);

        const handleVisibilityChange = () => {
            if (fgRef.current) {
                if (document.visibilityState === 'visible') {
                    fgRef.current.resumeAnimation?.();
                } else {
                    fgRef.current.pauseAnimation?.();
                }
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            resizeObserver.disconnect();
            intersectionObserver.disconnect();
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);

    const [isFullscreen, setIsFullscreen] = useState(false);
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    const handleZoomIn = () => {
        if (!fgRef.current) return;
        if (!use3D && fgRef.current.zoom) {
            const currentZoom = fgRef.current.zoom();
            fgRef.current.zoom(currentZoom * 1.5, 400);
        } else if (use3D && fgRef.current.cameraPosition) {
            const pos = fgRef.current.cameraPosition();
            fgRef.current.cameraPosition({ x: pos.x * 0.7, y: pos.y * 0.7, z: pos.z * 0.7 }, { x: 0, y: 0, z: 0 }, 400);
        }
    };

    const handleZoomOut = () => {
        if (!fgRef.current) return;
        if (!use3D && fgRef.current.zoom) {
            const currentZoom = fgRef.current.zoom() as unknown as number;
            fgRef.current.zoom(currentZoom / 1.5, 400);
        } else if (use3D && fgRef.current.cameraPosition) {
            const pos = fgRef.current.cameraPosition();
            fgRef.current.cameraPosition({ x: pos.x * 1.4, y: pos.y * 1.4, z: pos.z * 1.4 }, { x: 0, y: 0, z: 0 }, 400);
        }
    };

    const handleFitView = () => {
        if (!fgRef.current) return;
        if (!use3D && fgRef.current.zoomToFit) {
            fgRef.current.zoomToFit(400, 50);
        } else if (use3D && fgRef.current.cameraPosition) {
            // For 3D, move camera to a default reasonable distance
            fgRef.current.cameraPosition({ x: 0, y: 0, z: 800 }, { x: 0, y: 0, z: 0 }, 1000);
        }
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            if (containerRef.current) {
                containerRef.current.requestFullscreen().catch(console.error);
            }
        } else {
            document.exitFullscreen();
        }
    };

    const finalWidth = width || dimensions.width;
    const finalHeight = height || dimensions.height;

    useEffect(() => {
        hasCenteredRef.current = false;
    }, [graphData, use3D]);




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
    const { structuralData, searchHighlightIds } = useNetworkFilters({
        graphData,
        activeFilters,
        searchQuery,
        highlightedIds,
        searchDepth
    });

    // ===============================================
    // CLUSTER IDENTIFICATION
    // ===============================================
    const [clusters, setClusters] = useState<ClusterInfo[]>([]);

    useEffect(() => {
        if (!pendingClusterReview) {
            setClusters([]);
            return;
        }

        const worker = new ClusteringWorker();
        const runId = Math.random().toString();
        
        worker.onmessage = (e) => {
            if (e.data.id !== runId) return;
            if (e.data.type === 'SUCCESS') {
                setClusters(e.data.clusters);
            }
        };

        // D3 might mutate links/nodes into complex objects, so we extract only what the worker needs
        const safeNodes = structuralData.nodes.map(n => ({ id: n.id, subtitle: n.subtitle, tags: n.tags }));
        const safeLinks = structuralData.links.map(l => ({
            source: linkEndpointId(l.source as any),
            target: linkEndpointId(l.target as any),
            value: l.value
        }));

        worker.postMessage({
            nodes: safeNodes,
            links: safeLinks,
            minSize: 3,
            id: runId
        });

        return () => worker.terminate();
    }, [pendingClusterReview, structuralData]);

    const nodeClusterMap = useMemo(() => {
        const map = new Map<string, string>();
        clusters.forEach((c) => {
            c.nodeIds.forEach(id => map.set(id, c.id));
        });
        return map;
    }, [clusters]);

    const clusterColors = [
        '#FF6B6B', '#4ECDC4', '#FFE66D', '#1A535C', '#F7FFF7', 
        '#FF9F1C', '#2EC4B6', '#E71D36', '#011627', '#FDFFFC'
    ];

    const getClusterColor = (clusterId: string) => {
        const index = parseInt(clusterId.split('-')[1]) - 1;
        return clusterColors[index % clusterColors.length];
    };

    // ===============================================
    // RECENTER ON ACTIVE NODE
    // ===============================================
    useEffect(() => {
        if (activeNodeId && fgRef.current) {
            // Find node by id in structural data
            const targetNode = structuralData.nodes.find(n => n.id === activeNodeId) as GraphNode;
            if (targetNode && typeof targetNode.x === 'number' && typeof targetNode.y === 'number') {
                if (use3D) {
                    // 3D camera positioning
                    const distance = 80;
                    const distRatio = 1 + distance / Math.hypot(targetNode.x || 1, targetNode.y || 1, (targetNode as any).z || 1);
                    fgRef.current.cameraPosition(
                        { 
                            x: targetNode.x * distRatio, 
                            y: targetNode.y * distRatio, 
                            z: ((targetNode as any).z || 0) * distRatio 
                        },
                        targetNode, // lookAt
                        1000  // duration ms
                    );
                } else {
                    // 2D centerAt
                    fgRef.current.centerAt(targetNode.x, targetNode.y, 800);
                    // Optional: zoom in slightly
                    fgRef.current.zoom(2, 800);
                }
            }
        }
    }, [activeNodeId, structuralData.nodes, use3D]);





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

    const { nodePaint, linkPaint } = useGraphPaint({
        hoverNode: hoverNode as GraphNode | null,
        hoverLink: hoverLink as GraphLink | null,
        selectedNodes,
        graphDataLinks: graphData.links as GraphLink[],
        searchHighlightIds,
        isDark,
        pendingClusterReview,
        nodeClusterMap,
        activeNodeId,
        pathLinks,
        getClusterColor
    });


    // Physics Engine Tuning
    useEffect(() => {
        if (!use3D && fgRef.current) {
            // Physics: Add gravity to pull isolated nodes/clusters to center
            fgRef.current.d3Force('x', forceX(0).strength(0.08));
            fgRef.current.d3Force('y', forceY(0).strength(0.08));

            (fgRef.current.d3Force('charge') as any).strength(-80); // Less repulsion
            (fgRef.current.d3Force('center') as any).strength(0.6); // Strong centering
            (fgRef.current.d3Force('link') as any).distance(40); // Shorter links
            fgRef.current.d3ReheatSimulation();
        } else if (use3D && fgRef.current) {
            // 3D physics tuning
            try {
                (fgRef.current.d3Force('charge') as any)?.strength(-60);
                (fgRef.current.d3Force('link') as any)?.distance(50);
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



    const handleGraphNodeClick = (node: GraphNode | null, event?: MouseEvent) => {
        if (!node) return;
        const now = Date.now();
        const isDoubleClick = lastClickNodeIdRef.current === node.id && (now - lastClickTimeRef.current) < 300;

        if (isDoubleClick) {
            // Double Click -> Open Details
            onNodeClick?.(node.id);
            lastClickNodeIdRef.current = null; // Reset
        } else {
            // Single Click -> Toggle Selection
            handleNodeClick(node as GraphNode, event);
            lastClickTimeRef.current = now;
            lastClickNodeIdRef.current = node.id;
        }
    };

    const graphBg = isDark ? '#0f172a' : '#f4f7fa';

    // 3D node color: apply highlight/dim logic via color
    const get3DNodeColor = (node: GraphNode) => {
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
        } else if (activeNodeId) {
            const isNeighbor = structuralData.links.some(link => {
                const src = linkEndpointId(link.source as GraphLink['source']);
                const tgt = linkEndpointId(link.target as GraphLink['target']);
                return (src === activeNodeId && tgt === node.id) || (tgt === activeNodeId && src === node.id);
            });
            if (node.id !== activeNodeId && !isNeighbor) isDimmed3D = true;
        } else if (searchHighlightIds && !searchHighlightIds.has(node.id)) {
            isDimmed3D = true;
        }

        if (isDimmed3D) return isDark ? '#1e2d3d' : '#e2e8f0';
        if (selectedNodes.has(node.id) || node.id === activeNodeId) return 'var(--color-physio)';
        return baseColor;
    };

    // 3D link color: dim non-highlighted links
    const get3DLinkColor = (link: GraphLink) => {
        const src = typeof link.source === 'object' ? link.source : ({ type: 'drug', id: link.source } as GraphNode);
        const tgt = typeof link.target === 'object' ? link.target : ({ type: 'drug', id: link.target } as GraphNode);
        const srcId = src.id;
        const tgtId = tgt.id;

        if (hoverNode) {
            const isConnected = srcId === hoverNode.id || tgtId === hoverNode.id;
            if (!isConnected) return isDark ? '#334155' : '#e2e8f0';
        } else if (activeNodeId) {
            const isConnected = srcId === activeNodeId || tgtId === activeNodeId;
            if (!isConnected) return isDark ? '#334155' : '#e2e8f0';
        } else if (searchHighlightIds) {
            if (!searchHighlightIds.has(srcId) || !searchHighlightIds.has(tgtId)) {
                return isDark ? '#334155' : '#e2e8f0';
            }
        }

        const linkKey = [srcId, tgtId].sort().join('-');
        if (pathLinks.has(linkKey)) return 'var(--color-physio)';
        return getTypeColor(src.type);
    };

    return (
        <div className="flex w-full h-full" style={{ background: isFullscreen ? graphBg : 'transparent' }}>
            <div ref={containerRef} className="relative flex-1 h-full overflow-hidden" style={{ background: 'transparent' }}>
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
                        ref={fgRef as any}
                        width={finalWidth}
                        height={finalHeight}
                        graphData={structuralData as { nodes: GraphNode[], links: GraphLink[] }}
                        nodeLabel={(node: any) => node.name}
                        nodeColor={(node: any) => get3DNodeColor(node)}
                        nodeVal={(node: any) => {
                            const base = Math.max(1, Math.min(node.val || 1, 4));
                            return hoverNode?.id === node.id ? base * 2 : base;
                        }}
                        nodeOpacity={0.9}
                        linkColor={(link: any) => get3DLinkColor(link)}
                        linkOpacity={0.6}
                        linkWidth={(link: any) => {
                            const src = linkEndpointId(link.source);
                            const tgt = linkEndpointId(link.target);
                            const linkKey = [src, tgt].sort().join('-');
                            if (pathLinks.has(linkKey)) return 3;
                            if (hoverNode && (src === hoverNode.id || tgt === hoverNode.id)) return 2;
                            return 1;
                        }}
                        onNodeHover={(node: any) => {
                            setHoverNode(node || null);
                            document.body.style.cursor = node ? 'pointer' : 'default';
                        }}
                        onNodeClick={handleGraphNodeClick as any}
                        onBackgroundClick={() => {
                            setSelectedNodes(new Set());
                            setPathLinks(new Set());
                        }}
                        backgroundColor={isFullscreen ? graphBg : 'rgba(0,0,0,0)'}
                        d3AlphaDecay={0.02}
                        d3VelocityDecay={0.3}
                        warmupTicks={50}
                        cooldownTicks={100}
                        cooldownTime={3000}
                    />
                </Suspense>
            ) : (
                <ForceGraph2D
                    ref={fgRef as any}
                    width={finalWidth}
                    height={finalHeight}
                    graphData={structuralData as { nodes: GraphNode[], links: GraphLink[] }}
                    nodeLabel="name"
                    nodeCanvasObject={nodePaint}
                    linkCanvasObject={linkPaint}

                    cooldownTicks={100}
                    cooldownTime={3000}
                    d3AlphaDecay={0.02}
                    d3VelocityDecay={0.3}
                    warmupTicks={50}

                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    onNodeHover={(node: any) => {
                        setHoverNode(node || null);
                        document.body.style.cursor = node ? 'pointer' : 'default';
                    }}
                    onLinkHover={handleLinkHover as any}

                    onNodeClick={handleGraphNodeClick as any}

                    onBackgroundClick={() => {
                        setSelectedNodes(new Set());
                        setPathLinks(new Set());
                    }}
                    minZoom={0.1}
                    maxZoom={6}
                    onEngineStop={() => {
                        if (!hasCenteredRef.current && fgRef.current && !activeNodeId && !use3D && fgRef.current.zoomToFit) {
                            fgRef.current.zoomToFit(400, 50);
                            hasCenteredRef.current = true;
                        } else if (!hasCenteredRef.current && fgRef.current && !activeNodeId && use3D && fgRef.current.cameraPosition) {
                            fgRef.current.cameraPosition({ x: 0, y: 0, z: 800 }, { x: 0, y: 0, z: 0 }, 1000);
                            hasCenteredRef.current = true;
                        }
                    }}
                />
            )}

            {/* Top-Centered Minimalist Link Tooltip (Sober Redesign) */}
            {hoverLink && (
                <div className="absolute bottom-6 left-6 z-50 pointer-events-auto">
                    <NetworkTooltip
                        link={hoverLink as any}
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
                        
                        {selectedNodes.size === 1 && pendingClusterReview && (
                            <button
                                onClick={() => {
                                    const nodeId = Array.from(selectedNodes)[0];
                                    const neighborIds = new Set<string>();
                                    neighborIds.add(nodeId);
                                    structuralData.links.forEach((l: GraphLink) => {
                                        if (linkEndpointId(l.source) === nodeId) neighborIds.add(linkEndpointId(l.target));
                                        if (linkEndpointId(l.target) === nodeId) neighborIds.add(linkEndpointId(l.source));
                                    });
                                    if (onStartClusterReview) {
                                        onStartClusterReview(Array.from(neighborIds));
                                    }
                                }}
                                className={`
                                    w-full py-2 px-3 mt-2 rounded-lg font-bold text-sm transition-all shadow-sm
                                    ${isDark 
                                        ? 'bg-indigo-600 hover:bg-indigo-500 text-white' 
                                        : 'bg-indigo-500 hover:bg-indigo-600 text-white'
                                    }
                                `}
                            >
                                Réviser ce cluster (manuel)
                            </button>
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
            {/* Clusters Overlay Panel */}
            {pendingClusterReview && (
                <div className={`absolute z-20 flex flex-col gap-3 p-4 rounded-xl border backdrop-blur-md shadow-lg transition-all animate-in slide-in-from-right-8 duration-300
                    bottom-4 right-4 md:bottom-6 md:right-6 w-[calc(100%-2rem)] md:w-[350px] max-h-[60vh]
                    ${isDark ? 'bg-slate-800/95 border-slate-700/60 shadow-[0_8px_30px_rgba(0,0,0,0.4)] text-slate-200' : 'bg-white/95 border-slate-200/60 shadow-[0_8px_30px_rgba(0,0,0,0.12)] text-slate-800'}
                `}>
                    <div>
                        <h3 className={`m-0 text-base font-semibold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                            Clusters détectés
                        </h3>
                        <p className={`m-0 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            {clusters.length} groupes thématiques trouvés.
                        </p>
                    </div>
                    
                    <div className="overflow-y-auto flex flex-col gap-2 pr-1 custom-scrollbar">
                        {clusters.map((cluster) => (
                            <button 
                                key={cluster.id}
                                onClick={() => {
                                    if (onStartClusterReview) {
                                        onStartClusterReview(cluster.nodeIds);
                                    }
                                }}
                                className={`text-left p-3 rounded-lg border-l-4 cursor-pointer transition-all hover:-translate-y-[2px] hover:shadow-md
                                    ${isDark ? 'bg-slate-900/50 hover:bg-slate-800 border-slate-700' : 'bg-slate-50 hover:bg-white border-slate-200'}
                                `}
                                style={{
                                    borderLeftColor: getClusterColor(cluster.id),
                                    borderTopColor: 'transparent',
                                    borderRightColor: 'transparent',
                                    borderBottomColor: 'transparent',
                                }}
                            >
                                <div className={`font-semibold text-sm mb-1 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                                    {cluster.mainSubject} ({cluster.nodeIds.length} fiches)
                                </div>
                                {cluster.mainTags.length > 0 && (
                                    <div className={`text-xs flex gap-1 flex-wrap ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                        {cluster.mainTags.map(tag => (
                                            <span key={tag} className={`px-1.5 py-0.5 rounded ${isDark ? 'bg-slate-800' : 'bg-slate-200/50'}`}>#{tag}</span>
                                        ))}
                                    </div>
                                )}
                            </button>
                        ))}
                        {clusters.length === 0 && (
                            <div className={`p-3 text-sm text-center ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                Aucun cluster dense détecté. (Attendez le chargement ou baissez le seuil)
                            </div>
                        )}
                    </div>
                </div>
            )}

            <NetworkControls
                handleZoomIn={handleZoomIn}
                handleZoomOut={handleZoomOut}
                handleFitView={handleFitView}
                toggleFullscreen={toggleFullscreen}
                isFullscreen={isFullscreen}
                isDark={!!isDark}
                pendingClusterReview={pendingClusterReview || false}
                hasSelectedNodes={selectedNodes.size > 0}
            />

            </div>
            
        </div>
    );
};
