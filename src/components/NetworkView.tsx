

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
import { NetworkClustersOverlay } from './network/NetworkClustersOverlay';
import { NetworkSelectionOverlay } from './network/NetworkSelectionOverlay';
import { NetworkTopRightOverlay } from './network/NetworkTopRightOverlay';
import { useNetworkDimensions } from '../hooks/network/useNetworkDimensions';
import { useNetworkCamera } from '../hooks/network/useNetworkCamera';
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
    const { fgRef, hasCenteredRef, handleZoomIn, handleZoomOut, handleFitView, handleEngineStop } = useNetworkCamera(use3D);

    // Interaction Logic: Click Timer for Double Click (Moved here to avoid "Rendered fewer hooks" error)
    const lastClickTimeRef = useRef<number>(0);
    const lastClickNodeIdRef = useRef<string | null>(null);
    const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    
    // Auto-resize for when NetworkView is in a split pane (Mixte mode)
    const containerRef = useRef<HTMLDivElement>(null!);
    const { dimensions, isFullscreen, toggleFullscreen } = useNetworkDimensions(containerRef, fgRef);

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
            source: linkEndpointId(l.source as unknown as string),
            target: linkEndpointId(l.target as unknown as string),
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
                    const distRatio = 1 + distance / Math.hypot(targetNode.x || 1, targetNode.y || 1, (targetNode as GraphNode & { z?: number }).z || 1);
                    fgRef.current.cameraPosition(
                        { 
                            x: targetNode.x * distRatio, 
                            y: targetNode.y * distRatio, 
                            z: ((targetNode as GraphNode & { z?: number }).z || 0) * distRatio 
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
        const timer = setTimeout(() => {
            try {
                if (!use3D && fgRef.current && (fgRef.current as any).d3Force) {
                    const fg = fgRef.current as any;
                    // Physics: Add gravity to pull isolated nodes/clusters to center
                    fg.d3Force('x', forceX(0).strength(0.08));
                    fg.d3Force('y', forceY(0).strength(0.08));

                    fg.d3Force('charge')?.strength(-80); // Less repulsion
                    fg.d3Force('center')?.strength(0.6); // Strong centering
                    fg.d3Force('link')?.distance(40); // Shorter links
                    fg.d3ReheatSimulation?.();
                } else if (use3D && fgRef.current && (fgRef.current as any).d3Force) {
                    const fg = fgRef.current as any;
                    // 3D physics tuning
                    fg.d3Force('charge')?.strength(-60);
                    fg.d3Force('link')?.distance(50);
                    fg.d3ReheatSimulation?.();
                }
            } catch (err) {
                console.warn("D3 Physics tuning skipped due to unmount or graph not ready:", err);
            }
        }, 50);

        return () => clearTimeout(timer);
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
        <div className={`flex w-full h-full ${isFullscreen ? 'bg-[#f4f7fa] dark:bg-[#0f172a]' : 'bg-transparent'}`}>
            <div ref={containerRef} className="relative flex-1 h-full overflow-hidden bg-transparent">
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
                        nodeLabel={(node: unknown) => (node as GraphNode).name}
                        nodeColor={(node: unknown) => get3DNodeColor(node as GraphNode)}
                        nodeVal={(node: unknown) => {
                            const graphNode = node as GraphNode & { val?: number };
                            const base = Math.max(1, Math.min(graphNode.val || 1, 4));
                            return hoverNode?.id === graphNode.id ? base * 2 : base;
                        }}
                        nodeOpacity={0.9}
                        linkColor={(link: unknown) => get3DLinkColor(link as GraphLink)}
                        linkOpacity={0.6}
                        linkWidth={(link: unknown) => {
                            const graphLink = link as GraphLink;
                            const src = linkEndpointId(graphLink.source);
                            const tgt = linkEndpointId(graphLink.target);
                            const linkKey = [src, tgt].sort().join('-');
                            if (pathLinks.has(linkKey)) return 3;
                            if (hoverNode && (src === hoverNode.id || tgt === hoverNode.id)) return 2;
                            return 1;
                        }}
                        onNodeHover={(node: unknown) => {
                            setHoverNode((node as Node) || null);
                            document.body.style.cursor = node ? 'pointer' : 'default';
                        }}
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
                    nodeCanvasObject={nodePaint as any}
                    linkCanvasObject={linkPaint as any}

                    cooldownTicks={100}
                    cooldownTime={3000}
                    d3AlphaDecay={0.02}
                    d3VelocityDecay={0.3}
                    warmupTicks={50}

                    onNodeHover={(node: unknown) => {
                        setHoverNode((node as Node) || null);
                        document.body.style.cursor = node ? 'pointer' : 'default';
                    }}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    onLinkHover={handleLinkHover as any}

                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    onNodeClick={handleGraphNodeClick as any}

                    onBackgroundClick={() => {
                        setSelectedNodes(new Set());
                        setPathLinks(new Set());
                    }}
                    minZoom={0.1}
                    maxZoom={6}
                    onEngineStop={() => handleEngineStop(activeNodeId)}
                />
            )}

            {/* Top-Centered Minimalist Link Tooltip (Sober Redesign) */}
            {hoverLink && (
                <div className="absolute bottom-[calc(80px+env(safe-area-inset-bottom))] md:bottom-6 left-4 md:left-6 z-50 pointer-events-auto">
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
            <NetworkTopRightOverlay
                searchQuery={searchQuery}
                searchDepth={searchDepth}
                setSearchDepth={setSearchDepth}
                isDark={!!isDark}
            />

            {/* Bottom Left: Selection Info */}
            <NetworkSelectionOverlay
                selectedNodes={selectedNodes}
                pathLinks={pathLinks}
                isDark={!!isDark}
                pendingClusterReview={pendingClusterReview}
                structuralDataLinks={structuralData.links as GraphLink[]}
                onClearSelection={() => {
                    setSelectedNodes(new Set());
                    setPathLinks(new Set());
                }}
                onNodeClick={onNodeClick}
                onStartClusterReview={onStartClusterReview}
            />

            {/* Clusters Overlay Panel */}
            {pendingClusterReview && (
                <NetworkClustersOverlay
                    clusters={clusters}
                    isDark={!!isDark}
                    onStartClusterReview={onStartClusterReview}
                    getClusterColor={getClusterColor}
                />
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
