import { useCallback } from 'react';
import { useTheme } from '../context/ThemeContext';
import type { GraphNode, GraphLink } from '../components/NetworkGraphTypes';
import { linkEndpointId } from '../components/NetworkGraphTypes';

interface UseGraphPaintProps {
    hoverNode: GraphNode | null;
    hoverLink: GraphLink | null;
    selectedNodes: Set<string>;
    graphDataLinks: GraphLink[];
    searchHighlightIds: Set<string> | null;
    isDark: boolean;
    pendingClusterReview: boolean | undefined;
    nodeClusterMap: Map<string, string>;
    activeNodeId: string | null | undefined;
    pathLinks: Set<string>;
    getClusterColor: (clusterId: string) => string;
}

export function useGraphPaint({
    hoverNode,
    hoverLink,
    selectedNodes,
    graphDataLinks,
    searchHighlightIds,
    isDark,
    pendingClusterReview,
    nodeClusterMap,
    activeNodeId,
    pathLinks,
    getClusterColor
}: UseGraphPaintProps) {

    const { getCategoryColor } = useTheme();

    const nodePaint = useCallback((node: GraphNode, ctx: CanvasRenderingContext2D, globalScale: number) => {
        if (!Number.isFinite(node.x) || !Number.isFinite(node.y)) return;

        // Visual States
        const isHover = node === hoverNode;
        const isSelected = selectedNodes.has(node.id) || node.id === activeNodeId;

        let isDimmed = false;

        if (hoverNode) {
            const isNeighbor = graphDataLinks.some(link => {
                const src = linkEndpointId(link.source as GraphLink['source']);
                const tgt = linkEndpointId(link.target as GraphLink['target']);
                return (src === hoverNode.id && tgt === node.id) || (tgt === hoverNode.id && src === node.id);
            });
            if (!isHover && !isNeighbor) isDimmed = true;
        } else if (activeNodeId) {
            const isNeighbor = graphDataLinks.some(link => {
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
        let color = getCategoryColor(node.type);
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
            ctx.arc(node.x as number, node.y as number, radius + 4, 0, 2 * Math.PI, false);
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
            if (globalScale > 2.0 && !isDimmed) {
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
            ctx.strokeText(label, node.x as number, (node.y as number) + radius + 6);

            ctx.fillStyle = isDark ? '#f8fafc' : '#0f172a';
            ctx.fillText(label, node.x as number, (node.y as number) + radius + 6);
        }

        ctx.restore();
    }, [hoverNode, selectedNodes, graphDataLinks, searchHighlightIds, isDark, pendingClusterReview, nodeClusterMap, activeNodeId, getClusterColor, getCategoryColor]);

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
        ctx.moveTo(source.x as number, source.y as number);
        ctx.lineTo(target.x as number, target.y as number);

        const useGradient = globalScale > 0.8 || isHover; // isPath is handled above

        if (useGradient) {
            const gradient = ctx.createLinearGradient(source.x as number, source.y as number, target.x as number, target.y as number);
            gradient.addColorStop(0, getCategoryColor(source.type));
            gradient.addColorStop(1, getCategoryColor(target.type));
            ctx.strokeStyle = gradient;
            ctx.lineWidth = (isHover ? 2.5 : 1) / globalScale;
            ctx.shadowBlur = 0;
            ctx.setLineDash([]);
        } else {
            ctx.strokeStyle = getCategoryColor(source.type);
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

        // Reset Context
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
        ctx.setLineDash([]);

    }, [hoverNode, hoverLink, pathLinks, searchHighlightIds, isDark, activeNodeId, getCategoryColor]);

    return { nodePaint, linkPaint };
}
