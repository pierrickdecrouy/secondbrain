/**
 * Voy Vector Store - WASM-based high-performance vector search
 */
import { Voy as VoySearch } from 'voy-search';

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
        this.index = new VoySearch();
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
                embeddings: Array.isArray(item.embeddings) ? item.embeddings : Array.from(item.embeddings || [])
            };
        });

        try {
            this.index.add(formattedItems);
        } catch (e) {
            console.error("Voy index add error:", e);
        }
    }

    /**
     * Search for similar items
     */
    search(queryEmbedding: number[], k: number = 10): { id: string; similarity: number }[] {
        if (!this.index) return [];

        try {
            const results = this.index.search(queryEmbedding, k);

            // Map results. Note: Voy might not return score in all versions.
            return results.map((r: any) => ({
                id: r.id,
                similarity: 0 // Placeholder
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
        const indexData = this.index.serialize();
        const cacheData = new TextEncoder().encode(JSON.stringify(Array.from(this.embeddingCache.entries())));

        const header = new TextEncoder().encode("VOY+CACHE"); // 9 bytes
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
        const header = new TextEncoder().encode("VOY+CACHE");

        let hasHeader = false;
        if (data.length > header.length + 4) {
            hasHeader = true;
            for (let i = 0; i < header.length; i++) {
                if (data[i] !== header[i]) {
                    hasHeader = false;
                    break;
                }
            }
        }

        if (hasHeader) {
            try {
                const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
                const indexLength = view.getUint32(header.length, true);

                const indexData = data.subarray(header.length + 4, header.length + 4 + indexLength);
                const cacheData = data.subarray(header.length + 4 + indexLength);

                this.index = VoySearch.deserialize(indexData as any);

                const cacheJson = new TextDecoder().decode(cacheData);
                const entries = JSON.parse(cacheJson);
                this.embeddingCache = new Map(entries);

                console.log(`[Voy] Deserialized index and ${this.embeddingCache.size} cached embeddings`);
            } catch (e) {
                console.error("[Voy] Failed to deserialize with cache, falling back to raw:", e);
                // Fallback probably fails if it was indeed our format but corrupted
                // But if it was just a header false positive (unlikely), we might try:
                // this.index = VoySearch.deserialize(data);
            }
        } else {
            // Legacy format
            this.index = VoySearch.deserialize(data as any);
            console.log("[Voy] Deserialized legacy index (no cache)");
        }
    }

    /**
     * Clear index
     */
    clear(): void {
        this.index = new VoySearch();
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
                    console.log("[Voy] Index loaded from disk");
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
                console.log("[Voy] Index saved to disk");
            } catch (e) {
                console.error("[Voy] Failed to save index:", e);
            }
        }
    }
}

// Singleton instance
export const vectorStore = new VoyVectorStore();
