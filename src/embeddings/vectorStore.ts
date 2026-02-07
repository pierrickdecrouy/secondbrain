/**
 * Vector Store - In-memory storage and similarity search for embeddings
 */

export interface EmbeddingEntry {
    cardId: string;
    embedding: Float32Array;
}

class VectorStore {
    private embeddings: Map<string, Float32Array> = new Map();

    /**
     * Add or update an embedding
     */
    set(cardId: string, embedding: number[] | Float32Array): void {
        const arr = embedding instanceof Float32Array
            ? embedding
            : new Float32Array(embedding);
        this.embeddings.set(cardId, arr);
    }

    /**
     * Get embedding for a card
     */
    get(cardId: string): Float32Array | undefined {
        return this.embeddings.get(cardId);
    }

    /**
     * Check if card has embedding
     */
    has(cardId: string): boolean {
        return this.embeddings.has(cardId);
    }

    /**
     * Remove embedding
     */
    delete(cardId: string): void {
        this.embeddings.delete(cardId);
    }

    /**
     * Clear all embeddings
     */
    clear(): void {
        this.embeddings.clear();
    }

    /**
     * Get all card IDs with embeddings
     */
    getCardIds(): string[] {
        return Array.from(this.embeddings.keys());
    }

    /**
     * Get count of stored embeddings
     */
    get size(): number {
        return this.embeddings.size;
    }

    /**
     * Compute cosine similarity between two vectors
     */
    static cosineSimilarity(a: Float32Array, b: Float32Array): number {
        if (a.length !== b.length) return 0;

        let dotProduct = 0;
        let normA = 0;
        let normB = 0;

        for (let i = 0; i < a.length; i++) {
            dotProduct += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }

        const denominator = Math.sqrt(normA) * Math.sqrt(normB);
        return denominator === 0 ? 0 : dotProduct / denominator;
    }

    /**
     * Find most similar cards to a query embedding
     * @param queryEmbedding The query vector
     * @param topK Number of results to return
     * @param minSimilarity Minimum similarity threshold (0-1)
     * @returns Ranked list of { cardId, similarity }
     */
    findSimilar(
        queryEmbedding: number[] | Float32Array,
        topK: number = 10,
        minSimilarity: number = 0.3
    ): { cardId: string; similarity: number }[] {
        const query = queryEmbedding instanceof Float32Array
            ? queryEmbedding
            : new Float32Array(queryEmbedding);

        const results: { cardId: string; similarity: number }[] = [];

        this.embeddings.forEach((embedding, cardId) => {
            const similarity = VectorStore.cosineSimilarity(query, embedding);
            if (similarity >= minSimilarity) {
                results.push({ cardId, similarity });
            }
        });

        // Sort by similarity descending and take top K
        return results
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, topK);
    }

    /**
     * Export all embeddings for persistence
     */
    export(): { cardId: string; embedding: number[] }[] {
        return Array.from(this.embeddings.entries()).map(([cardId, embedding]) => ({
            cardId,
            embedding: Array.from(embedding)
        }));
    }

    /**
     * Import embeddings from persistence
     */
    import(data: { cardId: string; embedding: number[] }[]): void {
        data.forEach(({ cardId, embedding }) => {
            this.set(cardId, embedding);
        });
    }
}

// Singleton instance
export const vectorStore = new VectorStore();
