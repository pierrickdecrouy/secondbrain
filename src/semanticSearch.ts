/**
 * Semantic Search Service
 * Manages the embedding worker and provides semantic search functionality
 */

import type { Card } from './types';
import { vectorStore } from './embeddings/VoyVectorStore';

// Worker instance
let embeddingWorker: Worker | null = null;
let isModelReady = false;
let modelLoadProgress = 0;

// Pending promise resolvers for async operations
const pendingQueries = new Map<string, {
    resolve: (embedding: number[]) => void;
    reject: (error: Error) => void;
}>();

let batchResolve: ((embeddings: { cardId: string; embedding: number[] }[]) => void) | null = null;
let batchReject: ((error: Error) => void) | null = null;

// Progress callback
let onProgressCallback: ((progress: number) => void) | null = null;
let onReadyCallback: (() => void) | null = null;

/**
 * Initialize the embedding worker
 */
export function initSemanticSearch(
    onProgress?: (progress: number) => void,
    onReady?: () => void
): void {
    if (embeddingWorker) return;

    onProgressCallback = onProgress || null;
    onReadyCallback = onReady || null;

    embeddingWorker = new Worker(
        new URL('./workers/embedding.worker.ts', import.meta.url),
        { type: 'module' }
    );

    // Try to load existing index
    vectorStore.load().then(loaded => {
        if (loaded) {
            console.log('Semantic index loaded, ready for search even if model is lazy loading');
            // Optionally trigger ready if we trust the index matches the model
            // But we still need the model for new queries.
        }
    });

    embeddingWorker.onmessage = (e) => {
        const { type, id, embedding, embeddings, progress, error } = e.data;

        switch (type) {
            case 'ready':
                isModelReady = true;
                onReadyCallback?.();
                break;

            case 'progress':
                modelLoadProgress = progress;
                onProgressCallback?.(progress);
                break;

            case 'embedding':
                if (id && pendingQueries.has(id)) {
                    const { resolve } = pendingQueries.get(id)!;
                    pendingQueries.delete(id);
                    resolve(embedding);
                }
                break;

            case 'embeddings':
                if (batchResolve) {
                    batchResolve(embeddings);
                    batchResolve = null;
                    batchReject = null;
                }
                break;

            case 'error':
                console.error('Embedding worker error:', error);
                if (id && pendingQueries.has(id)) {
                    const { reject } = pendingQueries.get(id)!;
                    pendingQueries.delete(id);
                    reject(new Error(error));
                }
                if (batchReject) {
                    batchReject(new Error(error));
                    batchResolve = null;
                    batchReject = null;
                }
                break;
        }
    };

    // Handle worker-level errors (e.g., network issues, module load failures)
    embeddingWorker.onerror = (err) => {
        console.error('Embedding worker failed:', err.message);
        // Mark as -1 to indicate failure (UI can show "IA offline")
        modelLoadProgress = -1;
        onProgressCallback?.(-1);
    };

    // Start loading the model
    embeddingWorker.postMessage({ type: 'init' });
}

/**
 * Check if semantic search is ready
 */
export function isSemanticSearchReady(): boolean {
    return isModelReady;
}

/**
 * Get model loading progress (0-100)
 */
export function getModelLoadProgress(): number {
    return modelLoadProgress;
}

/**
 * Generate embedding for a single text
 */
export async function generateEmbedding(text: string): Promise<number[]> {
    if (!embeddingWorker) {
        throw new Error('Semantic search not initialized');
    }

    const id = `query-${Date.now()}-${Math.random()}`;

    return new Promise((resolve, reject) => {
        pendingQueries.set(id, { resolve, reject });
        embeddingWorker!.postMessage({ type: 'embed', id, text });

        // Timeout after 30 seconds
        setTimeout(() => {
            if (pendingQueries.has(id)) {
                pendingQueries.delete(id);
                reject(new Error('Embedding timeout'));
            }
        }, 30000);
    });
}

/**
 * Build embeddings for all cards
 */
export async function buildCardEmbeddings(cards: Card[]): Promise<void> {
    if (!embeddingWorker) {
        throw new Error('Semantic search not initialized');
    }

    // Only process cards - for now we re-process to ensure sync, or we can track IDs separately
    // Ideally we'd check against an in-memory Set of IDs
    const cardsToProcess = cards;

    if (cardsToProcess.length === 0) return;

    // Prepare text for each card: title + content + tags
    // Prefix with "passage:" for E5 model compatibility and better clustering
    const texts = cardsToProcess.map(card =>
        `passage: Title: ${card.title}. Content: ${card.subtitle || ''} ${card.content} Tags: ${card.tags.join(', ')}`
    );
    const cardIds = cardsToProcess.map(c => c.id);

    return new Promise((resolve, reject) => {
        batchResolve = (embeddings) => {
            const entries = embeddings.map(({ cardId, embedding }) => {
                const card = cards.find(c => c.id === cardId);
                return {
                    id: cardId,
                    title: card ? card.title : 'Unknown',
                    embeddings: embedding
                };
            });

            try {
                vectorStore.add(entries);
                vectorStore.save(); // Persist changes
            } catch (err) {
                console.error("Failed to add/save embeddings:", err);
            }
            resolve();
        };
        batchReject = reject;

        embeddingWorker!.postMessage({ type: 'embedBatch', texts, cardIds });
    });
}

/**
 * Perform semantic search
 * @param query The search query
 * @param topK Number of results to return
 * @returns Array of card IDs ranked by semantic similarity
 */
export async function semanticSearch(query: string, topK: number = 20): Promise<string[]> {
    if (!isModelReady) {
        return []; // Fall back to keyword search if not ready
    }

    try {
        // Generate query embedding with "query: " prefix (required by E5 model)
        const queryEmbedding = await generateEmbedding(`query: ${query}`);

        // Find similar cards with higher threshold for precision
        const results = vectorStore.search(queryEmbedding, topK);

        return results.map(r => r.id);
    } catch (error) {
        console.error('Semantic search error:', error);
        return [];
    }
}

/**
 * Compute cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
        dot += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Compute semantic links between all cards
 */
/**
 * Compute precision links between cards using hybrid scoring
 * 1. Explicit Reference (Title in Content) -> 1.0
 * 2. High Semantic (Cosine > 0.85) -> Value
 * 3. Hybrid (Cosine > 0.75 + Shared Tags) -> Value * 1.1
 */
export async function computePrecisionGraph(cards: Card[]): Promise<{ source: string; target: string; value: number; type: 'explicit' | 'semantic' | 'hybrid' }[]> {
    const links: { source: string; target: string; value: number; type: 'explicit' | 'semantic' | 'hybrid' }[] = [];
    const processedPairs = new Set<string>();

    const normalize = (str: string) => str.toLowerCase().trim();

    // Helper: Jaccard Index for tags
    const getTagOverlap = (tagsA: string[], tagsB: string[]) => {
        if (!tagsA.length || !tagsB.length) return 0;
        const setA = new Set(tagsA.map(normalize));
        const setB = new Set(tagsB.map(normalize));
        const intersection = new Set([...setA].filter(x => setB.has(x)));
        const union = new Set([...setA, ...setB]);
        return intersection.size / union.size;
    };

    // Helper: Check for title reference
    const hasReference = (content: string, title: string) => {
        if (title.length < 4) return false; // Ignore short titles to avoid noise
        const regex = new RegExp(`\\b${escapeRegExp(title)}\\b`, 'i');
        return regex.test(content);
    };

    const escapeRegExp = (string: string) => {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    };

    // Process each card
    for (let i = 0; i < cards.length; i++) {
        const cardA = cards[i];
        const embeddingA = vectorStore.getEmbedding(cardA.id);

        // We can optimize this by only looking at candidates from vector search first,
        // BUT for "Explicit Reference" we might need to check even if vector score is low?
        // Actually, if vector score is low, usually text is different.
        // Let's stick to vector search candidates for performance, but maybe increase K.
        // OR, for small datasets (<500 cards), we can do N*N for explicit references?
        // Let's do N*N for Explicit References if N < 200, otherwise rely on vector search?
        // The user wants "Precision". Let's stick to the high-quality candidates found by Voy.

        if (!embeddingA) continue;

        // Search candidates (Top 20 to cast a wide net, then filter severely)
        const results = vectorStore.search(embeddingA, 20);

        for (const result of results) {
            if (result.id === cardA.id) continue;

            const cardB = cards.find(c => c.id === result.id);
            if (!cardB) continue;

            const pairId = [cardA.id, cardB.id].sort().join('-');
            if (processedPairs.has(pairId)) continue;

            let score = 0;
            let type: 'explicit' | 'semantic' | 'hybrid' | null = null;

            // 1. Explicit Reference
            const refAtoB = hasReference(cardA.content, cardB.title);
            const refBtoA = hasReference(cardB.content, cardA.title);

            if (refAtoB || refBtoA) {
                score = 1.0;
                type = 'explicit';
            }
            else {
                // Calculate precise similarity
                const embeddingB = vectorStore.getEmbedding(cardB.id);
                let cosSim = result.similarity;
                if ((!cosSim || cosSim === 0) && embeddingB) {
                    cosSim = cosineSimilarity(embeddingA, embeddingB);
                }

                // 2. High Confidence Semantic
                if (cosSim > 0.85) {
                    score = cosSim;
                    type = 'semantic';
                }
                // 3. Hybrid Boost (Medium match + Shared Context)
                else if (cosSim > 0.75) {
                    const tagScore = getTagOverlap(cardA.tags, cardB.tags);
                    if (tagScore > 0) {
                        score = Math.min(cosSim * 1.1, 0.95);
                        type = 'hybrid';
                    }
                    // Maybe check for shared substring in title?
                }
            }

            if (score > 0 && type) {
                processedPairs.add(pairId);
                links.push({ source: cardA.id, target: cardB.id, value: score, type });
            }
        }
    }

    return links;
}

/**
 * Cleanup worker
 */
export function terminateSemanticSearch(): void {
    embeddingWorker?.terminate();
    embeddingWorker = null;
    isModelReady = false;
    modelLoadProgress = 0;
}

/**
 * Find similar cards for a specific card ID
 * @param cardId The source card ID
 * @param limit Number of results
 * @returns Array of { id, similarity }
 */
export function findSimilarCards(cardId: string, limit: number = 5): { id: string; similarity: number }[] {
    const embedding = vectorStore.getEmbedding(cardId);
    if (!embedding) return [];

    // Search
    const results = vectorStore.search(embedding, limit + 1); // +1 because it will find itself

    // Filter out self
    return results.filter(r => r.id !== cardId).slice(0, limit);
}
