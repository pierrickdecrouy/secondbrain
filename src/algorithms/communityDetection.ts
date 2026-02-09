
interface Node {
    id: string;
}

interface Link {
    source: string | any;
    target: string | any;
    value?: number; // Weight
}

/**
 * Detects communities using a synchronous Label Propagation Algorithm (LPA).
 * Fast enough for < 5000 nodes in the main thread.
 * 
 * @param nodes List of nodes
 * @param links List of links (structural + semantic)
 * @returns Map of Node ID -> Community ID (string)
 */
export function detectCommunities(nodes: Node[], links: Link[]): Map<string, string> {
    if (nodes.length === 0) return new Map();

    const interactions = 5; // Enough for small/medium graphs to stabilize
    const labels = new Map<string, string>();
    const adjacency = new Map<string, { id: string; weight: number }[]>();

    // 1. Initialize: Each node is its own community
    nodes.forEach(node => {
        labels.set(node.id, node.id);
        adjacency.set(node.id, []);
    });

    // 2. Build Weighted Adjacency List
    links.forEach(link => {
        const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
        const targetId = typeof link.target === 'object' ? link.target.id : link.target;

        // Use link value as weight
        // Structural links (value undefined) = 1.0
        // Semantic links (value ~0.7-0.9) -> Boost to ~1.75-2.25 to prioritize meaning clusters
        const weight = link.value !== undefined ? (link.value * 2.5) : 1.0;

        if (adjacency.has(sourceId)) adjacency.get(sourceId)!.push({ id: targetId, weight });
        if (adjacency.has(targetId)) adjacency.get(targetId)!.push({ id: sourceId, weight });
    });

    // 3. Propagation Loop
    const nodesList = [...nodes]; // Clone for shuffling

    for (let i = 0; i < interactions; i++) {
        // Fisher-Yates shuffle
        for (let j = nodesList.length - 1; j > 0; j--) {
            const k = Math.floor(Math.random() * (j + 1));
            [nodesList[j], nodesList[k]] = [nodesList[k], nodesList[j]];
        }

        let changes = 0;

        for (const node of nodesList) {
            const neighbors = adjacency.get(node.id);
            if (!neighbors || neighbors.length === 0) continue;

            // Count label weights
            const labelWeights = new Map<string, number>();
            neighbors.forEach(neighbor => {
                const neighborLabel = labels.get(neighbor.id)!;
                const currentWeight = labelWeights.get(neighborLabel) || 0;
                labelWeights.set(neighborLabel, currentWeight + neighbor.weight);
            });

            // Find max weight label
            let maxWeight = -1;
            let bestLabels: string[] = [];

            labelWeights.forEach((weight, label) => {
                if (weight > maxWeight) {
                    maxWeight = weight;
                    bestLabels = [label];
                } else if (Math.abs(weight - maxWeight) < 0.001) {
                    bestLabels.push(label);
                }
            });

            if (bestLabels.length > 0) {
                // If current label is not among best, pick one at random
                const currentLabel = labels.get(node.id);
                if (!bestLabels.includes(currentLabel!)) {
                    const newLabel = bestLabels[Math.floor(Math.random() * bestLabels.length)];
                    labels.set(node.id, newLabel);
                    changes++;
                }
            }
        }

        // Optimized exit: if generic stability reached
        if (changes < nodes.length * 0.02) break; // < 2% nodes changed
    }

    // 4. Renumber communities to be cleaner? (Optional, skipping for raw ID)
    return labels;
}
