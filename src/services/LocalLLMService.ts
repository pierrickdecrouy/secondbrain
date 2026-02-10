import { CreateMLCEngine, MLCEngine, type InitProgressCallback } from "@mlc-ai/web-llm";
import type { Card } from "../types";

// Official model ID for Phi-3.5-mini
const MODEL_ID = "Phi-3.5-mini-instruct-q4f16_1-MLC";

export interface LLMAnalysisResult {
    related: boolean;
    reasoning: string;
    confidence: number;
}

class LocalLLMService {
    private engine: MLCEngine | null = null;
    private isInitializing = false;
    private progressCallback: InitProgressCallback | null = null;

    constructor() { }

    /**
     * Initialize the engine and download/cache the model.
     */
    async initialize(onProgress?: InitProgressCallback): Promise<void> {
        if (this.engine) return;
        if (this.isInitializing) {
            // If already initializing, just update the callback but be careful
            // Ideally we'd return the existing promise, but for now simple guard.
            console.warn("LocalLLMService is already initializing.");
            return;
        }

        this.isInitializing = true;
        this.progressCallback = onProgress || null;

        try {
            console.log("Initializing Local LLM...");
            this.engine = await CreateMLCEngine(MODEL_ID, {
                initProgressCallback: (report) => {
                    console.log("LLM Progress:", report.text);
                    if (this.progressCallback) this.progressCallback(report);
                },
                appConfig: {
                    model_list: [
                        {
                            model: "https://huggingface.co/mlc-ai/Phi-3.5-mini-instruct-q4f16_1-MLC",
                            model_id: "Phi-3.5-mini-instruct-q4f16_1-MLC",
                            model_lib: "https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/web-llm-models/v0.2.48/Phi-3.5-mini-instruct-q4f16_1-MLC-webgpu.wasm",
                        }
                    ]
                }
            });
            console.log("Local LLM Ready!");
        } catch (error) {
            console.error("Failed to initialize Local LLM:", error);
            throw error;
        } finally {
            this.isInitializing = false;
        }
    }

    isReady(): boolean {
        return !!this.engine;
    }

    /**
     * Ask the LLM if two cards are medically related.
     */
    async checkConnection(source: Card, target: Card): Promise<LLMAnalysisResult> {
        if (!this.engine) throw new Error("LLM not initialized");

        const prompt = `
You are a medical expert assistant. Analyze the relationship between these two concepts:

Concept 1: "${source.title}"
Context 1: ${source.content.slice(0, 300)}...

Concept 2: "${target.title}"
Context 2: ${target.content.slice(0, 300)}...

Task: Are these two concepts medically or scientifically related in a significant way? 
If YES, explain specifically why (mechanism, drug class, interaction, causal link).
If NO or weak link, say NO.

Format:
Strict JSON: { "related": boolean, "reasoning": "short explanation", "confidence": number (0-1) }
`;

        try {
            const response = await this.engine.chat.completions.create({
                messages: [{ role: "user", content: prompt }],
                response_format: { type: "json_object" },
                temperature: 0.1, // Deterministic
            });

            const content = response.choices[0].message.content;
            if (!content) throw new Error("Empty response from LLM");

            return JSON.parse(content) as LLMAnalysisResult;
        } catch (error) {
            console.error("LLM Analysis Failed:", error);
            return { related: false, reasoning: "Error during analysis", confidence: 0 };
        }
    }
}

export const localLLM = new LocalLLMService();
