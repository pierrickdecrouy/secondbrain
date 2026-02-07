/**
 * Semantic Search Service
 * Manages the embedding worker and provides semantic search functionality
 */

import type { Card } from './types';
import { vectorStore } from './embeddings/vectorStore';

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

    // Only process cards without embeddings
    const cardsToProcess = cards.filter(c => !vectorStore.has(c.id));

    if (cardsToProcess.length === 0) return;

    // Prepare text for each card: title + content + tags
    const texts = cardsToProcess.map(card =>
        `${card.title}. ${card.subtitle || ''} ${card.content} ${card.tags.join(' ')}`
    );
    const cardIds = cardsToProcess.map(c => c.id);

    return new Promise((resolve, reject) => {
        batchResolve = (embeddings) => {
            embeddings.forEach(({ cardId, embedding }) => {
                vectorStore.set(cardId, embedding);
            });
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
        const results = vectorStore.findSimilar(queryEmbedding, topK, 0.5);

        return results.map(r => r.cardId);
    } catch (error) {
        console.error('Semantic search error:', error);
        return [];
    }
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
