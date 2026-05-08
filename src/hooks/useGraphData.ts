import { useState, useEffect, useRef } from 'react';
import type { Card, Node, Link } from '../types';
import { computePrecisionGraph } from '../semanticSearch';

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

export function useGraphData({ cards, vetoPairs = [], semanticReady = false }: UseGraphDataProps) {
    const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Worker ref to keep the instance
    const workerRef = useRef<Worker | null>(null);

    // State to hold latest results from both sources
    const [lexicalResult, setLexicalResult] = useState<GraphData | null>(null);
    const [semanticLinks, setSemanticLinks] = useState<Link[]>([]);

    useEffect(() => {
        // Initialize worker if not exists
        if (!workerRef.current) {
            workerRef.current = new Worker(new URL('../workers/graph.worker.ts', import.meta.url), {
                type: 'module'
            });

            workerRef.current.onmessage = (e: MessageEvent<GraphData>) => {
                const { nodes, links } = e.data;
                setLexicalResult({ nodes, links });
                setError(null);
            };

            workerRef.current.onerror = (err) => {
                console.error('Graph worker error:', err);
                setError('Erreur de génération du graphe. Réessayez dans quelques secondes.');
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
        setError(null);

        // Prepare payload matching WorkerInput interface
        const payload = {
            cards,
            feedback: {
                vetoPairs,
                typePairScores: {},
                negativePatterns: [],
                positivePatterns: [],
                toxicKeywords: {}
            }
        };

        workerRef.current.postMessage(payload);
    }, [cards, vetoPairs]);

    // Compute Semantic Links when ready
    useEffect(() => {
        if (cards.length === 0 || !semanticReady) {
            if (!semanticReady) setSemanticLinks([]); // Clear if not ready
            return;
        }

        console.log('[Graph] Computing semantic links...');

        computePrecisionGraph(cards, vetoPairs)
            .then(links => {
                // Map to Link type
                const formattedLinks: Link[] = links.map(l => ({
                    source: l.source,
                    target: l.target,
                    value: l.value,
                    type: l.type,
                    reason: l.reason,
                    quality: 'match' // Default quality for semantic
                }));
                setSemanticLinks(formattedLinks);
            })
            .catch(err => {
                console.error('[Graph] Semantic compute error:', err);
                setError('Erreur de calcul sémantique du graphe.');
            });

    }, [cards, vetoPairs, semanticReady]);

    // Merge Results
    useEffect(() => {
        if (!lexicalResult) return;

        const { nodes, links: lexicalLinks } = lexicalResult;

        // Merge links (lexical + semantic)
        // Deduplicate: If link exists in both, prefer Semantic? Or Lexical?
        // Semantic links are usually higher quality ("High Precision").
        // Lexical are "Broad Recall".

        const mergedLinks = [...lexicalLinks];
        const existingKeys = new Set(lexicalLinks.map(l => {
            const s = typeof l.source === 'object' ? l.source.id : l.source;
            const t = typeof l.target === 'object' ? l.target.id : l.target;
            return [s, t].sort().join('-');
        }));

        let addedCount = 0;
        semanticLinks.forEach(l => {
            const key = [l.source, l.target].sort().join('-');
            if (!existingKeys.has(key)) {
                mergedLinks.push(l);
                existingKeys.add(key);
                addedCount++;
            }
        });

        console.log(`[Graph] Merged: ${lexicalLinks.length} lexical + ${addedCount} semantic = ${mergedLinks.length} total.`);

        setGraphData({ nodes, links: mergedLinks });
        setIsLoading(false);

    }, [lexicalResult, semanticLinks]);

    // We only expose loading state for the *initial* lexical build mostly
    // Semantic can stream in late.

    return { graphData, isLoading, error };
}
