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
let onIndexingProgressCallback: ((progress: number | null) => void) | null = null;

export function setIndexingProgressCallback(callback: (progress: number | null) => void) {
    onIndexingProgressCallback = callback;
}

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


// Queue to serialize indexing requests
let indexingQueue = Promise.resolve();

export function buildCardEmbeddings(cards: Card[], forceUpdate: boolean = false): Promise<void> {
    // Chain execution to prevent concurrency issues with the single worker
    indexingQueue = indexingQueue.then(async () => {
        await processCardEmbeddings(cards, forceUpdate);
    }).catch(err => {
        console.error("Error in indexing queue:", err);
    });

    return indexingQueue;
}

async function processCardEmbeddings(cards: Card[], forceUpdate: boolean): Promise<void> {
    if (!embeddingWorker) {
        // Init if needed or throw
        console.warn('Semantic search not initialized, skipping embedding build');
        return;
    }

    // Smart Filtering: Only process cards that don't have embeddings, unless forced
    // Use the vectorStore sync check
    const cardsToProcess = forceUpdate
        ? cards
        : cards.filter(c => !vectorStore.getEmbedding(c.id));

    if (cardsToProcess.length === 0) {
        // console.log('[Semantic] Nothing new to index.');
        return;
    }

    console.log(`[Semantic] Indexing ${cardsToProcess.length} cards (Force=${forceUpdate})...`);

    // Chunking to prevent OOM and allow progress updates
    const CHUNK_SIZE = 50;
    const chunks = [];
    for (let i = 0; i < cardsToProcess.length; i += CHUNK_SIZE) {
        chunks.push(cardsToProcess.slice(i, i + CHUNK_SIZE));
    }

    for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];

        // MiniLM-L12-v2 is symmetric, no prefix needed
        const texts = chunk.map(card =>
            `Title: ${card.title}. Content: ${card.subtitle || ''} ${card.content} Tags: ${card.tags.join(', ')}`
        );
        const cardIds = chunk.map(c => c.id);

        // Report progress
        if (onIndexingProgressCallback) {
            const progress = Math.round(((i) / chunks.length) * 100);
            onIndexingProgressCallback(progress);
        }

        await new Promise<void>((resolve, reject) => {
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
                    // Save incrementally to avoid data loss if crash happens later
                    vectorStore.save();
                } catch (err) {
                    console.error("Failed to add/save embeddings:", err);
                }
                resolve();
            };
            batchReject = reject;

            embeddingWorker!.postMessage({ type: 'embedBatch', texts, cardIds });
        });

        // Update progress callback if available
        // We can expose an onProgressCallback in the future or use a store
        const progress = Math.round(((i + 1) / chunks.length) * 100);
        console.log(`[Semantic] Chunk ${i + 1}/${chunks.length} processed (${progress}%)`);

        // Yield to event loop
        await new Promise(r => setTimeout(r, 50));
    }

    // Clear progress
    if (onIndexingProgressCallback) onIndexingProgressCallback(null);
    console.log('[Semantic] Batch indexing complete.');
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
        // Generate query embedding (No prefix for MiniLM)
        const queryEmbedding = await generateEmbedding(query);

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
 * 1. Explicit Reference (Title in Content) -> 1.0 (Always valid)
 * 2. High Semantic (Cosine > Threshold) -> Value
 *    - Strict threshold for cross-type (0.88+)
 *    - Relaxed threshold for same-type/compatible (0.80+)
 *    - Hybrid boost if shared tags
 */
export async function computePrecisionGraph(
    cards: Card[],
    vetoPairs: string[] = [], // List of "idA|idB" strings (sorted)
    typeCompat: Record<string, number> = {} // Type compatibility matrix
): Promise<{ source: string; target: string; value: number; type: 'explicit' | 'semantic' | 'hybrid' }[]> {
    const links: { source: string; target: string; value: number; type: 'explicit' | 'semantic' | 'hybrid' }[] = [];
    const processedPairs = new Set<string>();

    // Fast lookup for vetoed pairs
    const vetoSet = new Set(vetoPairs);

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

    const escapeRegExp = (string: string) => {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    };

    // Helper: Get type compatibility multiplier (Base 1.0 + Feedback Delta)
    const getTypeMultiplier = (typeA: string, typeB: string): number => {
        if (!typeA || !typeB) return 1.0;
        const key = [typeA, typeB].sort().join('|');
        const delta = typeCompat[key] ?? 0;
        return 1.0 + delta;
    };

    // Process each card
    for (let i = 0; i < cards.length; i++) {
        const cardA = cards[i];
        const embeddingA = vectorStore.getEmbedding(cardA.id);

        if (!embeddingA) continue;

        // Search candidates (Top 20 to cast a wide net, then filter severely)
        const results = vectorStore.search(embeddingA, 20);

        for (const result of results) {
            if (result.id === cardA.id) continue;

            const cardB = cards.find(c => c.id === result.id);
            if (!cardB) continue;

            const pairId = [cardA.id, cardB.id].sort().join('-');
            if (processedPairs.has(pairId)) continue; // avoid duplicates

            // 0. CHECK VETO (Hard Constraint)
            // Format in linkFeedback is sorted idA|idB
            const vetoKey = [cardA.id, cardB.id].sort().join('|');
            if (vetoSet.has(vetoKey)) {
                // console.log(`🚫 Vetoed semantic link blocked: ${cardA.title} ↔ ${cardB.title}`);
                continue;
            }

            let score = 0;
            let type: 'explicit' | 'semantic' | 'hybrid' | null = null;

            // 1. Explicit Reference (The Gold Standard)
            // Reduced min length to 2 to support acronyms (AVC, EP, HTA) but filter common words
            const STOPWORDS = new Set([
                'le', 'la', 'les', 'un', 'une', 'des', 'du', 'de', 'd\'',
                'et', 'ou', 'ni', 'car', 'mais', 'donc', 'or',
                'en', 'à', 'au', 'aux', 'par', 'pour', 'sur', 'vers', 'avec', 'sans', 'sous',
                'ce', 'cet', 'ces', 'ça', 'qui', 'que', 'quoi', 'dont', 'où',
                'mon', 'ton', 'son', 'ma', 'ta', 'sa', 'mes', 'tes', 'ses',
                'nous', 'vous', 'ils', 'elles', 'je', 'tu', 'il', 'elle', 'on'
            ]);

            const hasReference = (content: string, title: string) => {
                const cleanTitle = title.trim();
                // Min length 2 for acronyms
                if (cleanTitle.length < 2) return false;

                // Filter stopwords (case insensitive)
                if (STOPWORDS.has(cleanTitle.toLowerCase())) return false;

                const regex = new RegExp(`\\b${escapeRegExp(cleanTitle)}\\b`, 'i');
                return regex.test(content);
            };

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

                // DEBUG LOGGING (Temporary)
                if (i === 0 && cosSim > 0.6) {
                    // console.log(`[Semantic Debug] ${cardA.title} <-> ${cardB.title}: Cosine=${cosSim.toFixed(3)}`);
                }

                // === STRICT SEMANTIC LOGIC ===
                // Check type compatibility
                const typeMult = getTypeMultiplier(cardA.type, cardB.type);
                const tagOverlap = getTagOverlap(cardA.tags, cardB.tags);

                // Determining thresholds based on compatibility
                // LOWERED DEFAULT to 0.80 to capture more links in sparse graphs
                let semanticThreshold = 0.80;

                if (typeMult < 0.8) {
                    // Incompatible types -> require high similarity
                    semanticThreshold = tagOverlap > 0 ? 0.85 : 0.88;
                } else if (typeMult >= 1.2) {
                    // Highly compatible -> Relax if context exists
                    semanticThreshold = tagOverlap > 0 ? 0.75 : 0.80;
                }

                // 2. High Confidence Semantic
                if (cosSim > semanticThreshold) {
                    score = cosSim;
                    type = 'semantic';
                }
                // 3. Hybrid Boost (Medium match + Shared Context)
                else {
                    // Strong Context -> Moderate vector threshold
                    if (tagOverlap >= 0.3 && cosSim > (semanticThreshold - 0.1)) {
                        score = Math.min(cosSim * 1.2, 0.95);
                        type = 'hybrid';
                    }
                    // Weak Context -> High vector threshold needed
                    else if (tagOverlap > 0 && cosSim > (semanticThreshold - 0.05)) {
                        score = Math.min(cosSim * 1.1, 0.95);
                        type = 'hybrid';
                    }
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
