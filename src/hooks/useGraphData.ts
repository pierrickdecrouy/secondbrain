import { useState, useEffect, useRef } from 'react';
import type { Card, Node, Link } from '../types';
// We need to import the worker constructor. 
// Vite handles 'new Worker(new URL(...))' automatically.

export interface GraphData {
    nodes: Node[];
    links: Link[];
}

export interface UseGraphDataProps {
    cards: Card[];
    vetoPairs?: string[];
    semanticReady?: boolean; // Signal if we should wait for semantic search or not (optional)
}

export function useGraphData({ cards, vetoPairs = [] }: UseGraphDataProps) {
    const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
    const [isLoading, setIsLoading] = useState(false);

    // Worker ref to keep the instance
    const workerRef = useRef<Worker | null>(null);

    useEffect(() => {
        // Initialize worker if not exists
        if (!workerRef.current) {
            workerRef.current = new Worker(new URL('../workers/graph.worker.ts', import.meta.url), {
                type: 'module'
            });

            workerRef.current.onmessage = (e: MessageEvent<GraphData>) => {
                const { nodes, links } = e.data;
                // We might want to filter links based on vetoPairs here as well, 
                // although the worker already does it if we pass them.
                // Doing it here covers "live" veto additions if we don't re-run worker immediately.
                setGraphData({ nodes, links });
                setIsLoading(false);
            };

            workerRef.current.onerror = (err) => {
                console.error('Graph worker error:', err);
                setIsLoading(false);
            };
        }

        // Cleanup
        return () => {
            if (workerRef.current) {
                workerRef.current.terminate();
                workerRef.current = null;
            }
        };
    }, []);

    // Send data to worker when cards or vetoPairs change
    useEffect(() => {
        if (!workerRef.current || cards.length === 0) return;

        setIsLoading(true);

        // Prepare payload matching WorkerInput interface
        const payload = {
            cards,
            feedback: {
                vetoPairs,
                // These could be passed via props if we have them in state
                typePairScores: {},
                negativePatterns: [],
                positivePatterns: [],
                toxicKeywords: {}
            }
        };

        workerRef.current.postMessage(payload);

    }, [cards, vetoPairs]);

    return { graphData, isLoading };
}
