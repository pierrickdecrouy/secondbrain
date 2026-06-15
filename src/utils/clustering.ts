// @ts-nocheck
import type { Node, Link } from '../types';

export interface ClusterInfo {
    id: string;
    nodeIds: string[];
    mainTags: string[];
    mainSubject: string;
}

// Helper to handle D3 link objects which can mutate source/target into objects
const linkEndpointId = (endpoint: Record<string, unknown> | string): string => {
    return typeof endpoint === 'object' ? endpoint.id : endpoint;
};

export function detectClusters(nodes: Node[], links: Link[], minClusterSize = 2): ClusterInfo[] {
    // 1. Build adjacency list using strong links
    // We only consider links with high value to form coherent clusters.
    // For lexical/semantic, let's pick a threshold. If value > 1.5, it's strong enough.
    // If we end up with no clusters, we can lower the threshold, but 1.5 is a good start.
    const threshold = 1.0; 
    
    const adjacency = new Map<string, Set<string>>();
    
    // Initialize adjacency for all nodes
    nodes.forEach(n => adjacency.set(n.id, new Set()));

    links.forEach(l => {
        if ((l.value || 0) >= threshold) {
            const source = linkEndpointId(l.source);
            const target = linkEndpointId(l.target);
            
            if (adjacency.has(source) && adjacency.has(target)) {
                adjacency.get(source)!.add(target);
                adjacency.get(target)!.add(source);
            }
        }
    });

    // 2. Find Connected Components (DFS)
    const visited = new Set<string>();
    const clusters: string[][] = [];

    for (const node of nodes) {
        if (!visited.has(node.id)) {
            const component: string[] = [];
            const stack = [node.id];
            
            while (stack.length > 0) {
                const curr = stack.pop()!;
                if (!visited.has(curr)) {
                    visited.add(curr);
                    component.push(curr);
                    const neighbors = adjacency.get(curr);
                    if (neighbors) {
                        for (const neighbor of neighbors) {
                            if (!visited.has(neighbor)) {
                                stack.push(neighbor);
                            }
                        }
                    }
                }
            }
            
            if (component.length >= minClusterSize) {
                clusters.push(component);
            }
        }
    }

    // 3. Extract metadata for each cluster (main tags, main subject)
    const nodeMap = new Map<string, Node>();
    nodes.forEach(n => nodeMap.set(n.id, n));

    const result: ClusterInfo[] = clusters.map((component, index) => {
        const tagCounts = new Map<string, number>();
        const subjectCounts = new Map<string, number>();

        component.forEach(nodeId => {
            const node = nodeMap.get(nodeId) as any;
            if (node) {
                // Count subjects
                if (node.subtitle) {
                    subjectCounts.set(node.subtitle, (subjectCounts.get(node.subtitle) || 0) + 1);
                }
                // Count tags
                if (node.tags) {
                    node.tags.forEach((t: string) => {
                        tagCounts.set(t, (tagCounts.get(t) || 0) + 1);
                    });
                }
            }
        });

        // Top subject
        let mainSubject = 'Général';
        let maxSubjCount = 0;
        subjectCounts.forEach((count, subj) => {
            if (count > maxSubjCount) {
                maxSubjCount = count;
                mainSubject = subj;
            }
        });

        // Top tags (max 3)
        const sortedTags = Array.from(tagCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .map(e => e[0])
            .slice(0, 3);

        return {
            id: `cluster-${index + 1}`,
            nodeIds: component,
            mainSubject,
            mainTags: sortedTags
        };
    });

    // Sort clusters by size descending
    return result.sort((a, b) => b.nodeIds.length - a.nodeIds.length);
}
