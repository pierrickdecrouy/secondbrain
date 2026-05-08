/**
 * Embedding Worker - Computes text embeddings using Transformers.js
 * Runs in a Web Worker to avoid blocking the main thread
 */

import { pipeline, FeatureExtractionPipeline, env } from '@huggingface/transformers';

// Skip local model checks (fixes Electron worker fs issues)
env.allowLocalModels = false;
env.useBrowserCache = true;

let extractor: FeatureExtractionPipeline | null = null;
let isLoading = false;

// Model: paraphrase-multilingual-MiniLM-L12-v2 (Better for symmetric similarity & French)
const MODEL_ID = 'Xenova/paraphrase-multilingual-MiniLM-L12-v2';

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
    self.postMessage({ type: 'progress', progress: 0 } as WorkerResponse);

    try {
        // Try WebGPU first (fastest)
        // @ts-ignore
        extractor = await pipeline('feature-extraction', MODEL_ID, {
            device: 'webgpu',
            // @ts-ignore
            progress_callback: (progress: any) => {
                if (typeof progress?.progress === 'number') {
                    self.postMessage({ type: 'progress', progress: progress.progress } as WorkerResponse);
                }
            },
            dtype: 'fp32' // WebGPU usually requires fp32 or fp16, not q8
        }) as FeatureExtractionPipeline;

        console.log('[Embedding Worker] WebGPU initialized successfully');
        self.postMessage({ type: 'ready' } as WorkerResponse);
    } catch (webGpuError) {
        console.warn('[Embedding Worker] WebGPU failed, falling back to WASM (CPU):', webGpuError);

        try {
            // Fallback to WASM (q8 quantization for efficiency)
            // @ts-ignore
            extractor = await pipeline('feature-extraction', MODEL_ID, {
                device: 'wasm',
                // quantized: true, // Removed as it's not a valid property, dtype handles it
                // @ts-ignore
                progress_callback: (progress: any) => {
                    if (typeof progress?.progress === 'number') {
                        self.postMessage({ type: 'progress', progress: progress.progress } as WorkerResponse);
                    }
                },
                dtype: 'q8'
            }) as FeatureExtractionPipeline;

            console.log('[Embedding Worker] WASM (CPU) initialized successfully');
            self.postMessage({ type: 'ready' } as WorkerResponse);
        } catch (cpuError) {
            console.error('[Embedding Worker] All backends failed:', cpuError);
            self.postMessage({ type: 'error', error: String(cpuError) } as WorkerResponse);
        }
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
        // MiniLM-L12-v2 is symmetric, no prefix needed
        const prefixedText = text;
        const output = await extractor(prefixedText, { pooling: 'mean', normalize: true });

        // Convert to regular array
        const embedding = Array.from(output.data as Float32Array);

        self.postMessage({ type: 'embedding', id, embedding } as WorkerResponse);
    } catch (error) {
        self.postMessage({ type: 'error', error: String(error), id } as WorkerResponse);
    }
}

// Generate embeddings for batch of texts (more efficient)
async function generateBatchEmbeddings(texts: string[], cardIds: string[], id?: string) {
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
            const prefixedText = texts[i];
            const output = await extractor(prefixedText, { pooling: 'mean', normalize: true });

            embeddings.push({
                cardId: cardIds[i],
                embedding: Array.from(output.data as Float32Array)
            });

            // Report progress
            if (i % 10 === 0 || i === texts.length - 1) {
                self.postMessage({
                    type: 'progress',
                    id,
                    progress: ((i + 1) / texts.length) * 100
                } as WorkerResponse);
            }
        }

        self.postMessage({ type: 'embeddings', id, embeddings } as WorkerResponse);
    } catch (error) {
        self.postMessage({ type: 'error', id, error: String(error) } as WorkerResponse);
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
            if (texts && cardIds) await generateBatchEmbeddings(texts, cardIds, id);
            break;
    }
};
