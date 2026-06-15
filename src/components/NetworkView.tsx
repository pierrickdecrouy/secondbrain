// @ts-nocheck
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
    Square,
    MagnifyingGlassPlus,
    MagnifyingGlassMinus,
    CornersOut,
    CornersIn,
    Crosshair
} from '@phosphor-icons/react';
import { NetworkTooltip } from './NetworkTooltip';
import { findStrongestPath } from '../algorithms/graphAlgorithms';
import { useTheme } from '../context/ThemeContext';
import { detectClusters, type ClusterInfo } from '../utils/clustering';

// Lazy-load the 3D graph (heavy Three.js bundle)
const ForceGraph3D = lazy(() => import('react-force-graph-3d'));


type GraphNode = Node & {
    x?: number;
    y?: number;
    z?: number;
    vx?: number;
    vy?: number;
    vz?: number;
    index?: number;
    val?: number;
    manualConnections?: string[];
    [key: string]: any;
};

type GraphLink = Link & {
    source: string | GraphNode;
    target: string | GraphNode;
    isSemantic?: boolean;
    semanticScore?: number;
    color?: string;
    [key: string]: any;
};

const linkEndpointId = (endpoint: GraphLink['source']): string =>
    typeof endpoint === 'string' ? endpoint : (endpoint as GraphNode).id;

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

    // Refs for graph control
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        return () => resizeObserver.disconnect();
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
            const currentZoom = fgRef.current.zoom();
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

    // ===============================================
    // CLUSTER IDENTIFICATION
    // ===============================================
    const clusters = useMemo(() => {
        if (!pendingClusterReview) return [];
        return detectClusters(structuralData.nodes, structuralData.links, 3);
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
    const nodePaint = useCallback((node: GraphNode, ctx: CanvasRenderingContext2D, globalScale: number) => {
        if (!Number.isFinite(node.x) || !Number.isFinite(node.y)) return;

        // Visual States
        const isHover = node === hoverNode;
        const isSelected = selectedNodes.has(node.id) || node.id === activeNodeId;

        let isDimmed = false;

        if (hoverNode) {
            const isNeighbor = graphData.links.some(link => {
                const src = linkEndpointId(link.source as GraphLink['source']);
                const tgt = linkEndpointId(link.target as GraphLink['target']);
                return (src === hoverNode.id && tgt === node.id) || (tgt === hoverNode.id && src === node.id);
            });
            if (!isHover && !isNeighbor) isDimmed = true;
        } else if (activeNodeId) {
            const isNeighbor = graphData.links.some(link => {
                const src = linkEndpointId(link.source as GraphLink['source']);
                const tgt = linkEndpointId(link.target as GraphLink['target']);
                return (src === activeNodeId && tgt === node.id) || (tgt === activeNodeId && src === node.id);
            });
            if (node.id !== activeNodeId && !isNeighbor) isDimmed = true;
        } else if (searchHighlightIds) {
            if (!searchHighlightIds.has(node.id)) isDimmed = true;
        }

        ctx.save();

        if (isDimmed) {
            ctx.globalAlpha = 0.06; // Very faint for non-relevant nodes
        }

        const label = node.name;

        // Use cluster for color if available, fallback to type
        let color = getTypeColor(node.type);
        if (pendingClusterReview) {
            const clusterId = nodeClusterMap.get(node.id);
            if (clusterId) {
                color = getClusterColor(clusterId);
            } else {
                color = isDark ? '#334155' : '#e2e8f0'; // Gray out nodes not in any cluster
            }
        } else if (node.cluster !== undefined && node.cluster >= 0) {
            // Generate a vibrant color based on cluster ID (legacy graph clustering)
            const hue = (node.cluster * 137.508) % 360;
            color = `hsl(${hue}, 70%, ${isDark ? '60%' : '45%'})`;
        }
        
        const radius = Math.max(2, Math.min(node.val || 2, 8));

        // Selection Halo
        if (isHover || isSelected) {
            ctx.beginPath();
            ctx.arc(node.x, node.y, radius + 4, 0, 2 * Math.PI, false);
            ctx.fillStyle = isSelected ? 'rgba(59, 130, 246, 0.25)' : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0, 0, 0, 0.08)');
            ctx.fill();
            ctx.strokeStyle = isSelected ? 'var(--color-physio)' : color;
            ctx.lineWidth = 2 / globalScale;
            ctx.stroke();
        }

        // Node Body
        ctx.beginPath();
        ctx.arc(node.x as number, node.y as number, radius, 0, 2 * Math.PI, false);
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

            ctx.fillStyle = isDark ? '#f8fafc' : '#0f172a';
            ctx.fillText(label, node.x, node.y + radius + 6);
        }

        ctx.restore();
    }, [hoverNode, selectedNodes, graphData.links, searchHighlightIds, isDark, pendingClusterReview, nodeClusterMap, activeNodeId]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const linkPaint = useCallback((link: GraphLink, ctx: CanvasRenderingContext2D, globalScale: number) => {
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
        } else if (activeNodeId) {
            if (source.id !== activeNodeId && target.id !== activeNodeId) isDimmed = true;
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

    }, [hoverNode, hoverLink, pathLinks, searchHighlightIds, isDark, activeNodeId]);


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
    const handleGraphNodeClick = (node: GraphNode) => {
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

    const graphBg = isDark ? '#0f172a' : '#f4f7fa';

    // 3D node color: apply highlight/dim logic via color
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        <div className="flex w-full h-full" style={{ background: graphBg }}>
            <div ref={containerRef} className="relative flex-1 h-full overflow-hidden" style={{ background: isFullscreen ? graphBg : 'transparent' }}>
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
                            {...({} as any)}
                        ref={fgRef}
                        width={finalWidth}
                        height={finalHeight}
                        graphData={structuralData as any}
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        nodeLabel={((node: any) => node.name) as any}
                        nodeColor={get3DNodeColor}
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        nodeVal={((node: any) => {
                            const base = Math.max(1, Math.min(node.val || 1, 4));
                            return hoverNode?.id === node.id ? base * 2 : base;
                        }) as any}
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
                            {...({} as any)}
                    ref={fgRef}
                    width={finalWidth}
                    height={finalHeight}
                    graphData={structuralData as any}
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
                <div style={{
                    position: 'absolute',
                    bottom: '24px',
                    right: '24px',
                    backgroundColor: 'var(--color-surface)',
                    padding: '16px',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                    border: '1px solid var(--color-border)',
                    zIndex: 20,
                    maxWidth: '350px',
                    maxHeight: '60vh',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    color: 'var(--color-text)'
                }}>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>
                        Clusters détectés
                    </h3>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                        {clusters.length} groupes thématiques trouvés.
                    </p>
                    
                    <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '4px' }}>
                        {clusters.map((cluster) => (
                            <button 
                                key={cluster.id}
                                onClick={() => {
                                    if (onStartClusterReview) {
                                        onStartClusterReview(cluster.nodeIds);
                                    }
                                }}
                                style={{
                                    textAlign: 'left',
                                    padding: '12px',
                                    backgroundColor: 'var(--color-bg)',
                                    border: `1px solid ${getClusterColor(cluster.id)}`,
                                    borderLeft: `4px solid ${getClusterColor(cluster.id)}`,
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    transition: 'transform 0.1s, box-shadow 0.1s',
                                    color: 'var(--color-text)'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'none';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            >
                                <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '4px' }}>
                                    {cluster.mainSubject} ({cluster.nodeIds.length} fiches)
                                </div>
                                {cluster.mainTags.length > 0 && (
                                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                        {cluster.mainTags.map(tag => (
                                            <span key={tag} style={{ backgroundColor: 'var(--color-surface)', padding: '2px 6px', borderRadius: '4px' }}>#{tag}</span>
                                        ))}
                                    </div>
                                )}
                            </button>
                        ))}
                        {clusters.length === 0 && (
                            <div style={{ padding: '12px', color: 'var(--color-text-muted)', fontSize: '0.9rem', textAlign: 'center' }}>
                                Aucun cluster dense détecté. (Attendez le chargement ou baissez le seuil)
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Bottom Right: Zoom and Fullscreen Controls */}
            <div className={`absolute ${pendingClusterReview ? 'bottom-24 right-[390px]' : (selectedNodes.size > 0 ? 'bottom-6 right-[374px]' : 'bottom-6 right-6')} z-40 flex flex-col gap-2 transition-all duration-300`}>
                <button
                    onClick={handleZoomIn}
                    className={`p-2.5 rounded-xl border backdrop-blur-md transition-all shadow-md
                        ${isDark 
                            ? 'bg-slate-800/80 border-slate-700/60 text-slate-300 hover:bg-slate-700 hover:text-white' 
                            : 'bg-white/80 border-slate-200/60 text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                    title="Zoom avant"
                >
                    <MagnifyingGlassPlus size={20} />
                </button>
                <button
                    onClick={handleZoomOut}
                    className={`p-2.5 rounded-xl border backdrop-blur-md transition-all shadow-md
                        ${isDark 
                            ? 'bg-slate-800/80 border-slate-700/60 text-slate-300 hover:bg-slate-700 hover:text-white' 
                            : 'bg-white/80 border-slate-200/60 text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                    title="Zoom arrière"
                >
                    <MagnifyingGlassMinus size={20} />
                </button>
                <button
                    onClick={handleFitView}
                    className={`p-2.5 rounded-xl border backdrop-blur-md transition-all shadow-md
                        ${isDark 
                            ? 'bg-slate-800/80 border-slate-700/60 text-slate-300 hover:bg-slate-700 hover:text-white' 
                            : 'bg-white/80 border-slate-200/60 text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                    title="Recentrer la vue"
                >
                    <Crosshair size={20} />
                </button>
                <button
                    onClick={toggleFullscreen}
                    className={`p-2.5 rounded-xl border backdrop-blur-md transition-all shadow-md
                        ${isDark 
                            ? 'bg-slate-800/80 border-slate-700/60 text-slate-300 hover:bg-slate-700 hover:text-white' 
                            : 'bg-white/80 border-slate-200/60 text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                    title={isFullscreen ? "Quitter le plein écran" : "Plein écran"}
                >
                    {isFullscreen ? <CornersIn size={20} /> : <CornersOut size={20} />}
                </button>
            </div>

            </div>
            
        </div>
    );
};
