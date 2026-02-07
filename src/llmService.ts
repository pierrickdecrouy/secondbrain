/**
 * LLM Service - Local language model for search synthesis
 * Uses wllama (llama.cpp WebAssembly) for browser-based inference
 */

import { Wllama } from '@wllama/wllama';

// Model - Qwen2-1.5B-Instruct (better quality, ~1.1GB)
const MODEL_URL = 'https://huggingface.co/Qwen/Qwen2-1.5B-Instruct-GGUF/resolve/main/qwen2-1_5b-instruct-q4_k_m.gguf';
const MODEL_FILENAME = 'qwen2-1_5b-instruct-q4_k_m.gguf';

let wllama: Wllama | null = null;
let isModelLoaded = false;
let loadingPromise: Promise<void> | null = null;
let loadProgress = 0;

export type ProgressCallback = (progress: number) => void;
export type ReadyCallback = () => void;

let onProgressCb: ProgressCallback | undefined;
let onReadyCb: ReadyCallback | undefined;

export async function initLLM(onProgress?: ProgressCallback, onReady?: ReadyCallback): Promise<void> {
    onProgressCb = onProgress;
    onReadyCb = onReady;

    if (loadingPromise) return loadingPromise;

    loadingPromise = loadModelAsync();
    return loadingPromise;
}

async function loadModelAsync(): Promise<void> {
    try {
        console.log('[LLM] Initializing wllama...');
        wllama = new Wllama({
            'single-thread/wllama.wasm': 'https://cdn.jsdelivr.net/npm/@wllama/wllama@latest/esm/single-thread/wllama.wasm',
            'multi-thread/wllama.wasm': 'https://cdn.jsdelivr.net/npm/@wllama/wllama@latest/esm/multi-thread/wllama.wasm',
        });

        let modelSource = MODEL_URL;
        let localBlob: Blob | null = null;

        if (window.electronAPI?.isElectron) {
            console.log('[LLM] Running in Electron, checking local model...');
            const filename = MODEL_FILENAME;

            try {
                const exists = await window.electronAPI.checkModelExists(filename);
                console.log('[LLM] Model exists:', exists);

                if (!exists) {
                    console.log('[LLM] Downloading model...');

                    window.electronAPI.onDownloadProgress(({ loaded, total }) => {
                        if (total > 0) {
                            loadProgress = Math.round((loaded / total) * 100);
                            console.log('[LLM] Download:', loadProgress + '%');
                            if (onProgressCb) onProgressCb(loadProgress);
                        }
                    });

                    const result = await window.electronAPI.downloadModel(MODEL_URL, filename);
                    console.log('[LLM] Download result:', result);
                }

                // Read local model as buffer and convert to Blob
                console.log('[LLM] Reading local model as buffer...');
                const buffer = await window.electronAPI.readModelAsBuffer(filename);
                localBlob = new Blob([buffer], { type: 'application/octet-stream' });
                console.log('[LLM] Created Blob:', localBlob.size, 'bytes');
            } catch (err) {
                console.error('[LLM] Local model error:', err);
            }
        }

        // Load from Blob if available, otherwise from URL
        if (localBlob) {
            console.log('[LLM] Loading from local Blob...');
            await wllama.loadModel([localBlob], {
                n_ctx: 2048,
            });
        } else {
            console.log('[LLM] Loading from URL:', modelSource);
            await wllama.loadModelFromUrl(modelSource, {
                n_ctx: 2048,
                progressCallback: ({ loaded, total }: { loaded: number, total: number }) => {
                    if (total > 0) {
                        loadProgress = Math.round((loaded / total) * 100);
                        if (onProgressCb) onProgressCb(loadProgress);
                    }
                },
            });
        }

        isModelLoaded = true;
        console.log('[LLM] Model loaded');
        if (onReadyCb) onReadyCb();

    } catch (error) {
        console.error('[LLM] Failed:', error);
        loadingPromise = null;
        loadProgress = 0;
        if (onProgressCb) onProgressCb(0);
    }
}

export function isLLMReady(): boolean {
    return isModelLoaded;
}

export function getLLMProgress(): number {
    return loadProgress;
}

export async function generateSynthesis(
    query: string,
    cardContents: { title: string; content: string }[]
): Promise<string> {
    if (!wllama || !isModelLoaded || cardContents.length === 0) return '';

    const sortedCards = [...cardContents].sort((a, b) => {
        const aTitle = a.title.toLowerCase();
        const bTitle = b.title.toLowerCase();
        const q = query.toLowerCase();
        if (aTitle === q) return -1;
        if (bTitle === q) return 1;
        if (aTitle.startsWith(q) && !bTitle.startsWith(q)) return -1;
        if (bTitle.startsWith(q) && !aTitle.startsWith(q)) return 1;
        return 0;
    });

    // Build context from local cards - use more content for accuracy
    const contextParts: string[] = [];
    sortedCards.slice(0, 3).forEach((card) => {
        contextParts.push(card.title + ': ' + card.content.slice(0, 250));
    });
    const context = contextParts.join('\n');

    // Prompt: card data priority, can enrich, strict French, stay on topic
    const prompt = `Fiches medicales:
${context}

En francais, decris "${query}" en 1-2 phrases courtes. Base-toi sur les fiches, complete si necessaire.

${query}:`

    try {
        // @ts-ignore
        const result = await wllama.createCompletion(prompt, {
            nPredict: 150, // More tokens to ensure complete sentences
            sampling: {
                temp: 0.2,
                top_p: 0.85,
                penalty_repeat: 1.4, // Higher to prevent loops
            },
        });

        let output = typeof result === 'string' ? result.trim() : '';

        // Quality check: output should be meaningful
        if (output.length < 10) return '';

        // Trim to last complete sentence (ends with . ! or ?)
        const lastPeriod = Math.max(output.lastIndexOf('.'), output.lastIndexOf('!'), output.lastIndexOf('?'));
        if (lastPeriod > 20) {
            output = output.slice(0, lastPeriod + 1);
        }

        // Check for repetitive patterns (sign of model failure)
        const words = output.split(/\s+/);
        const uniqueWords = new Set(words);
        if (words.length > 10 && uniqueWords.size < words.length / 3) {
            console.warn('[LLM] Output too repetitive, discarding');
            return '';
        }

        return output;
    } catch (e) {
        console.error('LLM Generation failed:', e);
        return '';
    }
}
