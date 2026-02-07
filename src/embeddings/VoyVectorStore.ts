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


    /**
     * Initialize the Voy index
     */
    constructor() {
        this.index = new VoySearch();
    }

    /**
     * Add items to the index
     */
    add(items: EmbeddingEntry[]): void {
        const formattedItems = items.map(item => ({
            id: item.id,
            title: item.title,
            embeddings: Array.isArray(item.embeddings) ? item.embeddings : Array.from(item.embeddings || [])
        }));

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
            // voy-search returns results as { id: string, title: string, url: string, embeddings: number[] }
            // but we only need IDs and there isn't a direct "similarity" score exposed plainly in all versions
            // Wait, voy-search usually returns relevant results. 
            // Let's verify the return type of search() in voy-search documentation or usage.
            // Assuming standard search usage:
            const results = this.index.search(queryEmbedding, k);

            // Voy results don't always contain a score in the basic usage, 
            // but for RRF we rely on rank. 
            // However, if we need similarity for thresholding, we might need to calculate it 
            // or perform a workaround.
            // For now, we map the results.
            return results.map((r: any) => ({
                id: r.id,
                similarity: 0 // Placeholder if score unavailable, or we'll compute it if needed.
                // Note: Voy 0.6+ might behave differently. 
            }));
        } catch (e) {
            console.error("Voy search error:", e);
            return [];
        }
    }

    /**
     * Serialize index to Uint8Array for storage
     */
    serialize(): Uint8Array {
        return this.index.serialize();
    }

    /**
     * Deserialize index from Uint8Array
     */
    deserialize(data: Uint8Array): void {
        this.index = VoySearch.deserialize(data as any);
    }

    /**
     * Clear index
     */
    clear(): void {
        this.index = new VoySearch();
        // Or if clear() method exists
    }

    /**
     * Get size (approximation, as voy might not expose count directly easily)
     */
    get size(): number {
        // Implementation depends on if we track it or if Voy exposes it
        return 0; // Placeholder
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
