/**
 * Voy Vector Store - WASM-based high-performance vector search
 */
import { Voy } from 'voy-search';

export interface EmbeddingEntry {
    id: string;
    title: string;
    embeddings: number[];
}

export class VoyVectorStore {
    private index: any = null; // Voy instance
    private embeddingCache = new Map<string, number[]>();

    /**
     * Initialize the Voy index
     */
    constructor() {
        this.index = new Voy();
    }

    /**
     * Get embedding by ID
     */
    getEmbedding(id: string): number[] | undefined {
        return this.embeddingCache.get(id);
    }

    /**
     * Add items to the index
     */
    add(items: EmbeddingEntry[]): void {
        const formattedItems = items.map(item => {
            // Cache the embedding
            if (item.embeddings) {
                this.embeddingCache.set(item.id, Array.isArray(item.embeddings) ? item.embeddings : Array.from(item.embeddings));
            }

            return {
                id: item.id,
                title: item.title,
                url: '', // Explicitly add empty URL as it might be required by Voy Resource type
                embeddings: Array.isArray(item.embeddings) ? item.embeddings : Array.from(item.embeddings || [])
            };
        });

        try {
            // Sanitize in chunks to avoid overwhelming WASM memory or stack
            const CHUNK_SIZE = 100;
            for (let i = 0; i < formattedItems.length; i += CHUNK_SIZE) {
                const chunk = formattedItems.slice(i, i + CHUNK_SIZE);
                // Ensure plain objects
                const cleanChunk = JSON.parse(JSON.stringify(chunk));

                if (cleanChunk.length > 0) {
                    // Voy expects a Resource object { embeddings: [...] }
                    this.index.add({ embeddings: cleanChunk });
                }
            }
        } catch (e) {
            console.error("Voy index add error:", e);
            // If critical error (like recursive use), we might need to recreate the index to recover
            if (e instanceof Error && (e.message.includes('recursive') || e.message.includes('unreachable'))) {
                console.warn("Voy index corrupted, resetting...");
                // Keep cache, reset index
                this.index = new Voy();
                // Re-add everything from cache? That might trigger it again if data is bad.
                // For now, just reset to avoid app-wide freeze.
            }
        }
    }

    /**
     * Search for similar items
     */
    search(queryEmbedding: number[], k: number = 10): { id: string; similarity: number }[] {
        if (!this.index) return [];

        try {
            const results = this.index.search(queryEmbedding, k);

            if (!results || !Array.isArray(results)) {
                return [];
            }

            // Map results. Note: Voy might not return score in all versions.
            return results.map((r: { id: string; score: number }) => ({
                id: r.id,
                similarity: r.score || 0
            }));
        } catch (e) {
            console.error("Voy search error:", e);
            return [];
        }
    }

    /**
     * Serialize index and cache to Uint8Array for storage
     */
    serialize(): Uint8Array {
        // Serialize index
        let indexData: Uint8Array;
        try {
            const serialized = this.index.serialize();
            indexData = new TextEncoder().encode(serialized);
        } catch (e) {
            console.error("Voy serialize error:", e);
            // Return empty if failed to avoid crashing
            return new Uint8Array(0);
        }

        // Serialize cache
        const cacheEntries = Array.from(this.embeddingCache.entries());
        const cacheData = new TextEncoder().encode(JSON.stringify(cacheEntries));

        const header = new TextEncoder().encode("VOY+CACHE_V2"); // 12 bytes
        const lengthBuffer = new ArrayBuffer(4);
        new DataView(lengthBuffer).setUint32(0, indexData.length, true); // Little endian

        const combined = new Uint8Array(header.length + 4 + indexData.length + cacheData.length);
        combined.set(header, 0);
        combined.set(new Uint8Array(lengthBuffer), header.length);
        combined.set(indexData, header.length + 4);
        combined.set(cacheData, header.length + 4 + indexData.length);

        return combined;
    }

    /**
     * Deserialize index and recover cache from Uint8Array
     */
    deserialize(data: Uint8Array): void {
        const headerV2 = new TextEncoder().encode("VOY+CACHE_V2");
        const headerV1 = new TextEncoder().encode("VOY+CACHE");

        const hasHeader = (header: Uint8Array) => {
            if (data.length < header.length + 4) return false;
            for (let i = 0; i < header.length; i++) {
                if (data[i] !== header[i]) return false;
            }
            return true;
        };

        if (hasHeader(headerV2)) {
            try {
                const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
                const indexLength = view.getUint32(headerV2.length, true);

                const indexData = data.subarray(headerV2.length + 4, headerV2.length + 4 + indexLength);
                const cacheData = data.subarray(headerV2.length + 4 + indexLength);

                const indexString = new TextDecoder().decode(indexData);
                this.index = Voy.deserialize(indexString);

                const cacheJson = new TextDecoder().decode(cacheData);
                const entries = JSON.parse(cacheJson);
                this.embeddingCache = new Map(entries);

            } catch (e) {
                console.error("[Voy] Failed to deserialize with cache, falling back to clean slate:", e);
                this.clear();
            }
        } else if (hasHeader(headerV1)) {
            console.warn("[Voy] Found V1 index incompatible with new model. Resetting index.");
            this.clear();
        } else {
            // Legacy format or corrupted
            try {
                const indexString = new TextDecoder().decode(data);
                if (indexString && indexString.trim().length > 0 && indexString.trim().startsWith('{')) {
                    this.index = Voy.deserialize(indexString);
                } else {
                    console.warn("[Voy] Legacy index empty or invalid, resetting");
                    this.clear();
                }
            } catch (e) {
                console.error("[Voy] Failed to deserialize legacy index:", e);
                this.clear();
            }
        }
    }

    /**
     * Clear index
     */
    clear(): void {
        this.index = new Voy();
        this.embeddingCache.clear();
    }

    /**
     * Get size 
     */
    get size(): number {
        return this.embeddingCache.size;
    }

    /**
     * Load index from disk
     */
    async load(): Promise<boolean> {
        if (typeof window !== 'undefined' && window.electronAPI?.loadVectorIndex) {
            try {
                const data = await window.electronAPI.loadVectorIndex();
                if (data) {
                    this.deserialize(data);
                    return true;
                }
            } catch (e) {
                console.error("[Voy] Failed to load index:", e);
            }
        }
        return false;
    }

    /**
     * Save index to disk
     */
    async save(): Promise<void> {
        if (typeof window !== 'undefined' && window.electronAPI?.saveVectorIndex) {
            try {
                const data = this.serialize();
                await window.electronAPI.saveVectorIndex(data);
            } catch (e) {
                console.error("[Voy] Failed to save index:", e);
            }
        }
    }
}

// Singleton instance
export const vectorStore = new VoyVectorStore();
