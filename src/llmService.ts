/**
 * LLM Service - Local language model for search synthesis
 * Uses wllama (llama.cpp WebAssembly) for browser-based inference
 */

import { Wllama } from '@wllama/wllama';

// Model - TinyLlama 1.1B Chat
const MODEL_URL = 'https://huggingface.co/ngxson/tinyllama-1.1b-chat-v1.0-gguf/resolve/main/tinyllama-1.1b-chat-v1.0.q4_k_m.gguf';

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

        console.log('[LLM] Loading model:', MODEL_URL);

        await wllama.loadModelFromUrl(MODEL_URL, {
            progressCallback: ({ loaded, total }: { loaded: number, total: number }) => {
                if (total > 0) {
                    loadProgress = Math.round((loaded / total) * 100);
                    if (onProgressCb) onProgressCb(loadProgress);
                }
            },
        });

        isModelLoaded = true;
        console.log('[LLM] Model loaded');
        if (onReadyCb) onReadyCb();

    } catch (error) {
        console.error('[LLM] Failed to load:', error);
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

    // Build context
    const contextParts: string[] = [];
    cardContents.slice(0, 3).forEach((card, i) => {
        // Truncate content to fit context window
        contextParts.push(`${i + 1}. ${card.title}: ${card.content.slice(0, 400)}`);
    });
    const context = contextParts.join('\n\n');

    // TinyLlama Chat Prompt Template
    // Using string concatenation to avoid template literal issues
    const systemPart = '<|system|>\nTu es un expert medical. Synthetise les informations suivantes pour repondre a la recherche "' + query + '". Reponds en francais.\n' + context + '</s>\n';
    const userPart = '<|user|>\nFais une synthese concise.</s>\n';
    const modelStart = '<|assistant|>\n';

    const prompt = systemPart + userPart + modelStart;

    try {
        // @ts-ignore - wllama types mismatch with actual implementation
        const result = await wllama.createCompletion(prompt, {
            nPredict: 300,
            temperature: 0.3, // Lower temperature for more factual responses
            topP: 0.9,
            stopTokens: ['</s>', '<|user|>'],
        });

        // Ensure result is string
        return typeof result === 'string' ? result : '';
    } catch (e) {
        console.error('LLM Generation failed:', e);
        return '';
    }
}
