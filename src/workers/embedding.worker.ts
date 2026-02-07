/**
 * Embedding Worker - Computes text embeddings using Transformers.js
 * Runs in a Web Worker to avoid blocking the main thread
 */

import { pipeline, FeatureExtractionPipeline } from '@huggingface/transformers';

let extractor: FeatureExtractionPipeline | null = null;
let isLoading = false;

// Model: multilingual-e5-small supports French and is ~100MB
const MODEL_ID = 'Xenova/multilingual-e5-small';

interface WorkerMessage {
    type: 'init' | 'embed' | 'embedBatch';
    id?: string;
    text?: string;
    texts?: string[];
    cardIds?: string[];
}

interface WorkerResponse {
    type: 'ready' | 'embedding' | 'embeddings' | 'progress' | 'error';
    id?: string;
    embedding?: number[];
    embeddings?: { cardId: string; embedding: number[] }[];
    progress?: number;
    error?: string;
}

// Initialize the model
async function initModel() {
    if (extractor || isLoading) return;

    isLoading = true;
    try {
        self.postMessage({ type: 'progress', progress: 0 } as WorkerResponse);

        // @ts-ignore - Transformers.js has complex union types that exceed TS limits
        extractor = await pipeline('feature-extraction', MODEL_ID, {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            progress_callback: (progress: any) => {
                if (typeof progress?.progress === 'number') {
                    self.postMessage({ type: 'progress', progress: progress.progress } as WorkerResponse);
                }
            }
        }) as FeatureExtractionPipeline;

        self.postMessage({ type: 'ready' } as WorkerResponse);
    } catch (error) {
        self.postMessage({ type: 'error', error: String(error) } as WorkerResponse);
    } finally {
        isLoading = false;
    }
}

// Generate embedding for a single text
async function generateEmbedding(text: string, id?: string) {
    if (!extractor) {
        await initModel();
    }

    if (!extractor) {
        self.postMessage({ type: 'error', error: 'Model not loaded' } as WorkerResponse);
        return;
    }

    try {
        // E5 models require "query: " or "passage: " prefix
        const prefixedText = `passage: ${text}`;
        const output = await extractor(prefixedText, { pooling: 'mean', normalize: true });

        // Convert to regular array
        const embedding = Array.from(output.data as Float32Array);

        self.postMessage({ type: 'embedding', id, embedding } as WorkerResponse);
    } catch (error) {
        self.postMessage({ type: 'error', error: String(error), id } as WorkerResponse);
    }
}

// Generate embeddings for batch of texts (more efficient)
async function generateBatchEmbeddings(texts: string[], cardIds: string[]) {
    if (!extractor) {
        await initModel();
    }

    if (!extractor) {
        self.postMessage({ type: 'error', error: 'Model not loaded' } as WorkerResponse);
        return;
    }

    const embeddings: { cardId: string; embedding: number[] }[] = [];

    try {
        for (let i = 0; i < texts.length; i++) {
            const prefixedText = `passage: ${texts[i]}`;
            const output = await extractor(prefixedText, { pooling: 'mean', normalize: true });

            embeddings.push({
                cardId: cardIds[i],
                embedding: Array.from(output.data as Float32Array)
            });

            // Report progress
            if (i % 10 === 0 || i === texts.length - 1) {
                self.postMessage({
                    type: 'progress',
                    progress: ((i + 1) / texts.length) * 100
                } as WorkerResponse);
            }
        }

        self.postMessage({ type: 'embeddings', embeddings } as WorkerResponse);
    } catch (error) {
        self.postMessage({ type: 'error', error: String(error) } as WorkerResponse);
    }
}

// Handle messages from main thread
self.onmessage = async (e: MessageEvent<WorkerMessage>) => {
    const { type, id, text, texts, cardIds } = e.data;

    switch (type) {
        case 'init':
            await initModel();
            break;
        case 'embed':
            if (text) await generateEmbedding(text, id);
            break;
        case 'embedBatch':
            if (texts && cardIds) await generateBatchEmbeddings(texts, cardIds);
            break;
    }
};
