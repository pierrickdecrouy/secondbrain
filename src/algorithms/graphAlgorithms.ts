
interface GraphNode {
    id: string;
}

// GraphLink interface removed as it was unused

/**
 * Dijkstra's Algorithm for "Strongest Path"
 * Cost = 1 / value (Higher confidence = Lower cost = Preferred)
 */
export function findStrongestPath(
    nodes: GraphNode[],
    links: Array<{ source: string | any, target: string | any, value?: number, type?: string }>,
    startId: string,
    endId: string
): string[] { // Returns array of Node IDs in order
    // Build adjacency list
    const adjacency = new Map<string, { target: string, cost: number }[]>();

    // Helper to get string ID safe for ForceGraph2D
    const getId = (n: string | any) => (typeof n === 'object' && n.id) ? n.id : n;

    links.forEach(link => {
        const s = getId(link.source);
        const t = getId(link.target);
        const val = link.value || 0.1; // Default low confidence if missing

        // Cost Function: Inverse Square
        // Value 1.0 (Manual/Explicit) -> Cost 1
        // Value 0.5 (Weak Semantic)   -> Cost 4
        // Value 0.1                   -> Cost 100

        let cost = 1 / (Math.max(0.01, val) ** 2);

        // TRUST PENALTY (Secure Pathfinding)
        // Semantic/RRF links are "fuzzy" and liable to drift. 
        // We penalize them (x2 cost) so the algorithm prefers 
        // a longer path of explicit/manual links over a shortcut of weak semantic guesses.
        const isSemantic = link.type === 'semantic' || link.type === 'rrf' || link.type === 'hybrid';
        if (isSemantic) {
            cost *= 2.0;
        }

        if (!adjacency.has(s)) adjacency.set(s, []);
        if (!adjacency.has(t)) adjacency.set(t, []);

        adjacency.get(s)!.push({ target: t, cost });
        adjacency.get(t)!.push({ target: s, cost }); // Undirected graph
    });

    // Dijkstra state
    const distances = new Map<string, number>();
    const previous = new Map<string, string | null>();
    const unvisited = new Set<string>();

    // Init
    nodes.forEach(node => {
        distances.set(node.id, Infinity);
        previous.set(node.id, null);
        unvisited.add(node.id);
    });

    distances.set(startId, 0);

    while (unvisited.size > 0) {
        // Find unvisited node with min distance
        let currentId: string | null = null;
        let minDist = Infinity;

        for (const id of unvisited) {
            const d = distances.get(id) ?? Infinity;
            if (d < minDist) {
                minDist = d;
                currentId = id;
            }
        }

        // If explicitly finished or unreachable
        if (currentId === null || currentId === endId) break;
        if (minDist === Infinity) break;

        unvisited.delete(currentId);

        // Relax neighbors
        const neighbors = adjacency.get(currentId) || [];
        for (const neighbor of neighbors) {
            if (!unvisited.has(neighbor.target)) continue;

            const alt = minDist + neighbor.cost;
            if (alt < (distances.get(neighbor.target) ?? Infinity)) {
                distances.set(neighbor.target, alt);
                previous.set(neighbor.target, currentId);
            }
        }
    }

    // Reconstruct path
    const path: string[] = [];
    let curr: string | null = endId;

    // Check if reachable
    if (previous.get(endId) === null && startId !== endId) {
        return []; // No path found
    }

    while (curr !== null) {
        path.unshift(curr);
        curr = previous.get(curr) || null;
    }

    return path;
}
