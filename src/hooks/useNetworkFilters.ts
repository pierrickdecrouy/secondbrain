import { useMemo } from 'react';
import type { GraphLink } from '../components/NetworkGraphTypes';
import { linkEndpointId } from '../components/NetworkGraphTypes';

interface UseNetworkFiltersProps {
    graphData: { nodes: any[], links: any[] };
    activeFilters: string[] | undefined;
    searchQuery: string | undefined;
    highlightedIds: Set<string> | undefined;
    searchDepth: number;
}

export function useNetworkFilters({
    graphData,
    activeFilters,
    searchQuery,
    highlightedIds,
    searchDepth
}: UseNetworkFiltersProps) {
    
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
        links = links.filter(() => {
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

    return { structuralData, searchHighlightIds };
}
