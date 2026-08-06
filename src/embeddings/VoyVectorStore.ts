/**
 * Voy Vector Store - WASM-based high-performance vector search
 * Now supports sharding (multiple Voy instances per subject/course)
 */
import { Voy } from 'voy-search';
import { getDB, isElectron } from '../storage';

export interface EmbeddingEntry {
    id: string;
    title: string;
    embeddings: number[];
    shardId?: string; // Optional shard identifier (e.g., courseId or subject)
}

export class VoyVectorStore {
    // Map of shardId -> Voy instance
    private indices = new Map<string, any>();
    // Global embedding cache for O(1) lookups: Map<cardId, embedding>
    private embeddingCache = new Map<string, number[]>();
    // Track which shard each card belongs to: Map<cardId, shardId>
    private cardShardMap = new Map<string, string>();

    constructor() {
        // We always initialize a 'global' shard as default
        this.getOrCreateIndex('global');
    }

    /**
     * Helper to get or create an index for a given shardId
     */
    private getOrCreateIndex(shardId: string): any {
        let index = this.indices.get(shardId);
        if (!index) {
            index = new Voy();
            this.indices.set(shardId, index);
        }
        return index;
    }

    /**
     * Get embedding by ID
     */
    getEmbedding(id: string): number[] | undefined {
        return this.embeddingCache.get(id);
    }

    /**
     * Add items to the index, routing them to the correct shards
     */
    add(items: EmbeddingEntry[]): void {
        // Group items by shardId
        const chunksByShard = new Map<string, any[]>();

        items.forEach(item => {
            const shardId = item.shardId || 'global';
            
            // Cache the embedding globally
            if (item.embeddings) {
                this.embeddingCache.set(item.id, Array.isArray(item.embeddings) ? item.embeddings : Array.from(item.embeddings));
                this.cardShardMap.set(item.id, shardId);
            }

            if (!chunksByShard.has(shardId)) {
                chunksByShard.set(shardId, []);
            }

            chunksByShard.get(shardId)!.push({
                id: item.id,
                title: item.title,
                url: '', // Explicitly add empty URL as required by Voy Resource type
                embeddings: Array.isArray(item.embeddings) ? item.embeddings : Array.from(item.embeddings || [])
            });
        });

        // Add to each shard's index
        for (const [shardId, shardItems] of chunksByShard.entries()) {
            const index = this.getOrCreateIndex(shardId);
            try {
                // Sanitize in chunks
                const CHUNK_SIZE = 100;
                for (let i = 0; i < shardItems.length; i += CHUNK_SIZE) {
                    const chunk = shardItems.slice(i, i + CHUNK_SIZE);
                    const cleanChunk = JSON.parse(JSON.stringify(chunk));

                    if (cleanChunk.length > 0) {
                        index.add({ embeddings: cleanChunk });
                    }
                }
            } catch (e) {
                if (e instanceof Error && (e.message.includes('recursive') || e.message.includes('unreachable'))) {
                    this.indices.set(shardId, new Voy());
                }
            }
        }
    }

    /**
     * Search for similar items across specified shards (or 'global' + specific shards)
     */
    search(queryEmbedding: number[], k: number = 10, targetShardIds?: string[]): { id: string; similarity: number }[] {
        // If no target shards specified, search across all currently loaded shards
        const shardsToSearch = targetShardIds && targetShardIds.length > 0 
            ? targetShardIds.map(id => this.indices.get(id)).filter(idx => !!idx)
            : Array.from(this.indices.values());

        if (shardsToSearch.length === 0) return [];

        try {
            const allResults: { id: string; similarity: number }[] = [];

            for (const index of shardsToSearch) {
                const results = index.search(queryEmbedding, k);
                if (results && Array.isArray(results)) {
                    results.forEach((r: { id: string; score: number }) => {
                        allResults.push({ id: r.id, similarity: r.score || 0 });
                    });
                }
            }

            // Sort merged results by similarity (descending) and take top K
            return allResults
                .sort((a, b) => b.similarity - a.similarity)
                .slice(0, k);

        } catch (e) {
            return [];
        }
    }

    /**
     * Serialize a specific shard and its subset of the cache
     */
    serializeShard(shardId: string): Uint8Array {
        const index = this.indices.get(shardId);
        if (!index) return new Uint8Array(0);

        let indexData: Uint8Array;
        try {
            const serialized = index.serialize();
            indexData = new TextEncoder().encode(serialized);
        } catch (e) {
            return new Uint8Array(0);
        }

        // Serialize only cache entries for this shard
        const shardCacheEntries = Array.from(this.cardShardMap.entries())
            .filter(([_, mappedShardId]) => mappedShardId === shardId)
            .map(([cardId, _]) => {
                const emb = this.embeddingCache.get(cardId);
                return [cardId, emb] as [string, number[]];
            })
            .filter(([_, emb]) => !!emb);

        const cacheData = new TextEncoder().encode(JSON.stringify(shardCacheEntries));
        const header = new TextEncoder().encode("VOY+CACHE_V2"); // 12 bytes
        const lengthBuffer = new ArrayBuffer(4);
        new DataView(lengthBuffer).setUint32(0, indexData.length, true);

        const combined = new Uint8Array(header.length + 4 + indexData.length + cacheData.length);
        combined.set(header, 0);
        combined.set(new Uint8Array(lengthBuffer), header.length);
        combined.set(indexData, header.length + 4);
        combined.set(cacheData, header.length + 4 + indexData.length);

        return combined;
    }

    /**
     * Deserialize a shard and inject its subset of the cache
     */
    deserializeShard(data: Uint8Array, shardId: string): void {
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
                this.indices.set(shardId, Voy.deserialize(indexString));

                const cacheJson = new TextDecoder().decode(cacheData);
                const entries: [string, number[]][] = JSON.parse(cacheJson);
                
                for (const [cardId, emb] of entries) {
                    this.embeddingCache.set(cardId, emb);
                    this.cardShardMap.set(cardId, shardId);
                }
            } catch (e) {
                this.indices.set(shardId, new Voy());
            }
        } else if (hasHeader(headerV1)) {
            this.indices.set(shardId, new Voy());
        } else {
            // Legacy monolithic format (assume it's the global shard)
            try {
                const indexString = new TextDecoder().decode(data);
                if (indexString && indexString.trim().length > 0 && indexString.trim().startsWith('{')) {
                    this.indices.set(shardId, Voy.deserialize(indexString));
                } else {
                    this.indices.set(shardId, new Voy());
                }
            } catch (e) {
                this.indices.set(shardId, new Voy());
            }
        }
    }

    /**
     * Clear all indices and cache
     */
    clear(): void {
        this.indices.clear();
        this.embeddingCache.clear();
        this.cardShardMap.clear();
        this.getOrCreateIndex('global');
    }

    /**
     * Get size 
     */
    get size(): number {
        return this.embeddingCache.size;
    }

    /**
     * Check if a shard is currently loaded in memory
     */
    isShardLoaded(shardId: string): boolean {
        return this.indices.has(shardId);
    }

    /**
     * Load a specific shard from disk/IndexedDB
     */
    async load(shardId: string = 'global'): Promise<boolean> {
        if (this.isShardLoaded(shardId) && shardId !== 'global') {
            return true; // Already loaded
        }

        if (isElectron() && window.electronAPI?.loadVectorIndex) {
            try {
                const data = await window.electronAPI.loadVectorIndex(shardId);
                if (data) {
                    this.deserializeShard(data, shardId);
                    return true;
                }
            } catch (e) {
            }
        } else {
            // IndexedDB Fallback for Web
            try {
                const db = getDB();
                const record = await db.vectorIndices.get(shardId);
                if (record && record.data) {
                    this.deserializeShard(record.data, shardId);
                    return true;
                }
            } catch (e) {
            }
        }
        
        // If it wasn't found, ensure an empty index exists
        this.getOrCreateIndex(shardId);
        return false;
    }

    /**
     * Save a specific shard to disk/IndexedDB
     */
    async save(shardId: string = 'global'): Promise<void> {
        const data = this.serializeShard(shardId);
        if (data.length === 0) return;

        if (isElectron() && window.electronAPI?.saveVectorIndex) {
            try {
                await window.electronAPI.saveVectorIndex(data, shardId);
            } catch (e) {
            }
        } else {
            // IndexedDB Fallback for Web
            try {
                const db = getDB();
                await db.vectorIndices.put({ shardId, data });
            } catch (e) {
            }
        }
    }
    
    /**
     * Helper to save all currently loaded shards
     */
    async saveAllLoadedShards(): Promise<void> {
        const promises = Array.from(this.indices.keys()).map(shardId => this.save(shardId));
        await Promise.allSettled(promises);
    }
}

// Singleton instance
export const vectorStore = new VoyVectorStore();
