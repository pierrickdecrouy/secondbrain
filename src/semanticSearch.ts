/**
 * Semantic Search Service
 * Manages the embedding worker and provides semantic search functionality
 */

import type { Card } from "./types";
import { vectorStore } from "./embeddings/VoyVectorStore";

// Worker instance
let embeddingWorker: Worker | null = null;
let isModelReady = false;
let modelLoadProgress = 0;

// Promise to track worker model readiness
let initPromise: Promise<void> | null = null;
let resolveInit: (() => void) | null = null;

// Initialize promise immediately
initPromise = new Promise((resolve) => {
  resolveInit = resolve;
});

// Pending promise resolvers for async operations
const pendingQueries = new Map<
  string,
  {
    resolve: (embedding: number[]) => void;
    reject: (error: Error) => void;
  }
>();

const pendingBatches = new Map<
  string,
  {
    resolve: (embeddings: { cardId: string; embedding: number[] }[]) => void;
    reject: (error: Error) => void;
  }
>();

// Progress callback
let onProgressCallback: ((progress: number) => void) | null = null;
let onReadyCallback: (() => void) | null = null;
let onIndexingProgressCallback: ((progress: number | null) => void) | null =
  null;

export function setIndexingProgressCallback(
  callback: (progress: number | null) => void,
) {
  onIndexingProgressCallback = callback;
}

/**
 * Initialize the embedding worker
 */
export function initSemanticSearch(
  onProgress?: (progress: number) => void,
  onReady?: () => void,
): void {
  if (embeddingWorker) return;

  onProgressCallback = onProgress || null;

  // Wrap onReady to resolve our internal promise
  onReadyCallback = () => {
    isModelReady = true;
    resolveInit?.();
    if (onReady) onReady();
  };

  embeddingWorker = new Worker(
    new URL("./workers/embedding.worker.ts", import.meta.url),
    { type: "module" },
  );

  // Try to load existing index (result is not used; the load is fire-and-forget).
  vectorStore.load();

  embeddingWorker.onmessage = (e) => {
    const { type, id, embedding, embeddings, progress, error } = e.data;

    switch (type) {
      case "ready":
        onReadyCallback?.();
        break;

      case "progress":
        modelLoadProgress = progress;
        onProgressCallback?.(progress);
        break;

      case "embedding":
        if (id && pendingQueries.has(id)) {
          const { resolve } = pendingQueries.get(id)!;
          pendingQueries.delete(id);
          resolve(embedding);
        }
        break;

      case "embeddings":
        if (id && pendingBatches.has(id)) {
          const { resolve } = pendingBatches.get(id)!;
          pendingBatches.delete(id);
          resolve(embeddings);
        }
        break;

      case "error":
        console.error("Embedding worker error:", error);
        if (id && pendingQueries.has(id)) {
          const { reject } = pendingQueries.get(id)!;
          pendingQueries.delete(id);
          reject(new Error(error));
        }
        if (id && pendingBatches.has(id)) {
          const { reject } = pendingBatches.get(id)!;
          pendingBatches.delete(id);
          reject(new Error(error));
        }
        break;
    }
  };

  // Handle worker-level errors (e.g., network issues, module load failures)
  embeddingWorker.onerror = (err) => {
    console.error("Embedding worker failed:", err.message);
    // Mark as -1 to indicate failure (UI can show "IA offline")
    modelLoadProgress = -1;
    onProgressCallback?.(-1);
  };

  // Start loading the model
  embeddingWorker.postMessage({ type: "init" });
}

/**
 * Check if semantic search is ready
 */
export function isSemanticSearchReady(): boolean {
  return isModelReady;
}

/**
 * Get model loading progress (0-100)
 */
export function getModelLoadProgress(): number {
  return modelLoadProgress;
}

/**
 * Generate embedding for a single text
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  if (!embeddingWorker) {
    throw new Error("Semantic search not initialized");
  }

  const id = `query-${Date.now()}-${Math.random()}`;

  return new Promise((resolve, reject) => {
    pendingQueries.set(id, { resolve, reject });
    embeddingWorker!.postMessage({ type: "embed", id, text });

    // Timeout after 30 seconds
    setTimeout(() => {
      if (pendingQueries.has(id)) {
        pendingQueries.delete(id);
        reject(new Error("Embedding timeout"));
      }
    }, 30000);
  });
}

/**
 * Build embeddings for all cards
 */

// Queue to serialize indexing requests
let indexingQueue = Promise.resolve();

// Debounce helper for persistence
let saveTimeout: NodeJS.Timeout | null = null;
const DEBOUNCE_DELAY_MS = 2000;

function scheduleSave() {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    vectorStore
      .save()
      .catch((err) => console.error("Failed to save vector store:", err));
    saveTimeout = null;
  }, DEBOUNCE_DELAY_MS);
}

export function buildCardEmbeddings(
  cards: Card[],
  forceUpdate: boolean = false,
): Promise<void> {
  // Chain execution to prevent concurrency issues with the single worker
  indexingQueue = indexingQueue
    .then(async () => {
      await processCardEmbeddings(cards, forceUpdate);
    })
    .catch((err) => {
      console.error("Error in indexing queue:", err);
    });

  return indexingQueue;
}

async function processCardEmbeddings(
  cards: Card[],
  forceUpdate: boolean,
): Promise<void> {
  // Wait for validation of model readiness
  if (!isModelReady) {
    await initPromise;
  }

  if (!embeddingWorker) {
    console.warn("[Semantic] Worker failed to initialize.");
    return;
  }

  // Smart Filtering: Only process cards that don't have embeddings, unless forced
  // Use the vectorStore sync check
  const cardsToProcess = forceUpdate
    ? cards
    : cards.filter((c) => !vectorStore.getEmbedding(c.id));

  if (cardsToProcess.length === 0) {
    // console.log('[Semantic] Nothing new to index.');
    return;
  }

  // Chunking to prevent OOM and allow progress updates
  const CHUNK_SIZE = 50;
  const chunks = [];
  for (let i = 0; i < cardsToProcess.length; i += CHUNK_SIZE) {
    chunks.push(cardsToProcess.slice(i, i + CHUNK_SIZE));
  }

  // Create a Map for O(1) card lookups during batch resolution
  const cardMap = new Map(cards.map((c) => [c.id, c]));

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];

    // MiniLM-L12-v2 is symmetric, no prefix needed
    const texts = chunk.map(
      (card) =>
        `Title: ${card.title}. Content: ${card.subtitle || ""} ${card.content} Tags: ${card.tags ? card.tags.join(", ") : ""}`,
    );
    const cardIds = chunk.map((c) => c.id);

    // Report progress
    if (onIndexingProgressCallback) {
      const progress = Math.round((i / chunks.length) * 100);
      onIndexingProgressCallback(progress);
    }

    await new Promise<void>((resolve, reject) => {
      const batchId = `batch-${Date.now()}-${i}-${Math.random()}`;

      pendingBatches.set(batchId, {
        resolve: (embeddings) => {
          const entries = embeddings.map(({ cardId, embedding }) => {
            const card = cardMap.get(cardId);
            const shardId = card?.subject || card?.parentId || 'global';
            return {
              id: cardId,
              title: card ? card.title : "Unknown",
              embeddings: embedding,
              shardId
            };
          });

          try {
            // Orchestration: Dispatch event when a heavy indexing chunk completes
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('heavy-indexing-status', { detail: { isIndexing: true } }));
            }

            vectorStore.add(entries);
            // Trigger debounced save instead of immediate save
            scheduleSave();
          } catch (err) {
            console.error("Failed to add embeddings:", err);
          }
          resolve();
        },
        reject,
      });

      embeddingWorker!.postMessage({
        type: "embedBatch",
        id: batchId,
        texts,
        cardIds,
      });

      // Timeout after 60 seconds for a batch
      setTimeout(() => {
        if (pendingBatches.has(batchId)) {
          pendingBatches.delete(batchId);
          reject(new Error("Embedding batch timeout"));
        }
      }, 60000);
    });

    // Update progress callback if available
    // We can expose an onProgressCallback in the future or use a store
    // const progress = Math.round(((i + 1) / chunks.length) * 100);        // Yield to event loop
    await new Promise((r) => setTimeout(r, 50));
  }

  // Force a final save at the end of the batch
  if (saveTimeout) {
    clearTimeout(saveTimeout);
    vectorStore.saveAllLoadedShards().catch((err) => console.error("Final save failed:", err));
    saveTimeout = null;
  }

  // Orchestration: Indexing finished, resume physics
  if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('heavy-indexing-status', { detail: { isIndexing: false } }));
  }

  // Clear progress
  if (onIndexingProgressCallback) onIndexingProgressCallback(null);
}

/**
 * Perform semantic search
 * @param query The search query
 * @param topK Number of results to return
 * @returns Array of card IDs ranked by semantic similarity
 */
export async function semanticSearch(
  query: string,
  topK: number = 20,
): Promise<string[]> {
  if (!isModelReady) {
    return []; // Fall back to keyword search if not ready
  }

  try {
    // Generate query embedding (No prefix for MiniLM)
    const queryEmbedding = await generateEmbedding(query);

    // Get active subjects/shards to search in (if none provided, defaults to all loaded)
    // NOTE: This could be dynamically requested by passing targetShardIds in semanticSearch
    const results = vectorStore.search(queryEmbedding, topK);

    return results.map((r) => r.id);
  } catch (error) {
    console.error("Semantic search error:", error);
    return [];
  }
}

/**
 * Compute precision links using RRF (Reciprocal Rank Fusion)
 * Combines:
 * 1. Semantic Search (Vector)
 * 2. Explicit Keyword Search (FlexSearch)
 *
 * RRF Score = 1 / (k + rank_semantic) + 1 / (k + rank_keyword)
 */
export async function computePrecisionGraph(
  cards: Card[],
  vetoPairs: string[] = [],
  typeCompat: Record<string, number> = {}, // Re-enabled for clinical bias
  keywordSearchFn?: (query: string, limit: number) => string[],
): Promise<
  {
    source: string;
    target: string;
    value: number;
    type: "explicit" | "semantic" | "hybrid" | "rrf";
    reason?: string;
  }[]
> {
  const links: {
    source: string;
    target: string;
    value: number;
    type: "explicit" | "semantic" | "hybrid" | "rrf";
    reason?: string;
  }[] = [];
  const processedPairs = new Set<string>();
  const cardById = new Map(cards.map((card) => [card.id, card]));

  // Fast lookup for vetoed pairs
  const vetoSet = new Set(vetoPairs);

  const normalize = (str: string) => str.toLowerCase().trim();

  // Helper: Jaccard Index for tags
  const getTagOverlap = (tagsA: string[], tagsB: string[]) => {
    if (!tagsA.length || !tagsB.length) return 0;
    const setA = new Set(tagsA.map(normalize));
    const setB = new Set(tagsB.map(normalize));
    const intersection = new Set([...setA].filter((x) => setB.has(x)));
    const union = new Set([...setA, ...setB]);
    return intersection.size / union.size;
  };

  // Helper: Get type compatibility multiplier (Base 1.0 + Feedback Delta)
  const getTypeMultiplier = (typeA: string, typeB: string): number => {
    if (!typeA || !typeB) return 1.0;
    if (typeA === typeB) return 1.05; // Slight boost for same-type

    const key = [typeA, typeB].sort().join("|");
    // Default penalty for cross-type unless explicitly boosted
    return typeCompat ? 0.85 + (typeCompat[key] || 0) : 0.85;
  };

  // Process each card
  for (let i = 0; i < cards.length; i++) {
    if (i > 0 && i % 10 === 0) {
      await new Promise((resolve) => setTimeout(resolve, 0)); // Yield to event loop to avoid UI freeze
    }

    const cardA = cards[i];
    if (!cardA.title) continue;

    // Collect candidates via Semantic Search
    const semanticCandidates = new Map<
      string,
      { rank: number; score: number }
    >();
    const embeddingA = vectorStore.getEmbedding(cardA.id);
    if (!embeddingA) continue;

    try {
      // Find semantic neighbors across all loaded shards (we want global context for graph)
      const results = vectorStore.search(embeddingA, 25);
      results.forEach((r, rank) => {
        if (r.id !== cardA.id) {
          semanticCandidates.set(r.id, {
            rank: rank + 1,
            score: r.similarity || 0,
          });
        }
      });
    } catch (e) {
      console.error(e);
    }

    // Collect candidates via Keyword Search (if function provided)
    const keywordCandidates = new Map<string, number>();
    if (keywordSearchFn) {
      // Search for cardA's title in other cards
      const results = keywordSearchFn(cardA.title, 25);
      results.forEach((id, rank) => {
        if (id !== cardA.id) {
          keywordCandidates.set(id, rank + 1);
        }
      });
    }

    // Union of all candidates
    const allCandidates = new Set([
      ...semanticCandidates.keys(),
      ...keywordCandidates.keys(),
    ]);

    for (const candidateId of allCandidates) {
      const cardB = cardById.get(candidateId);
      if (!cardB) continue;

      const pairId = [cardA.id, cardB.id].sort().join("-");
      if (processedPairs.has(pairId)) continue;

      // 0. CHECK VETO
      const vetoKey = [cardA.id, cardB.id].sort().join("|");
      if (vetoSet.has(vetoKey)) continue;

      let score = 0;
      let type: "explicit" | "semantic" | "hybrid" | "rrf" | null = null;

      // RRF CALCULATION
      const semanticRank = semanticCandidates.get(candidateId)?.rank ?? 100; // Penalty if missing
      const keywordRank = keywordCandidates.get(candidateId) ?? 100; // Penalty if missing

      const rawVectorScore = semanticCandidates.get(candidateId)?.score ?? 0;
      // Apply Type Compatibility to Vector Score
      const typeMult = getTypeMultiplier(cardA.type, cardB.type);
      const vectorScore = Math.min(rawVectorScore * typeMult, 0.99);
      const explicitMatch = keywordCandidates.has(candidateId); // True if keyword found

      // 1. Explicit Reference Logic (Strongest)
      // If explicit match found via FlexSearch (contextual search)
      if (explicitMatch && keywordRank <= 3) {
        score = 1.0;
        type = "explicit";
        // No reason needed for explicit, usually self-explanatory or "Reference"
      }
      // 2. RRF Boosted Semantic
      else {
        // Base similarity
        let finalSim = vectorScore;
        let reasonText = "";

        // Boost by RRF if present in both or high in one
        if (explicitMatch && vectorScore > 0.7) {
          finalSim = Math.min(vectorScore * 1.25, 0.98); // Massive boost
        }

        // Apply simple thresholds (Lowered slightly to allow boosted links)
        if (finalSim > 0.82) {
          score = finalSim;
          type = "semantic";
          reasonText = `Concepts similaires (${(finalSim * 100).toFixed(0)}%)`;
        } else if (
          finalSim > 0.75 &&
          getTagOverlap(cardA.tags, cardB.tags) > 0.2
        ) {
          score = finalSim;
          type = "hybrid";
          reasonText = `Mention explicite + Similarité forte (${(finalSim * 100).toFixed(0)}%)`;
        }

        // Pure RRF rescue: if rank is high in both but vector score is somehow low (rare)
        if (semanticRank <= 5 && keywordRank <= 5 && score < 0.7) {
          score = 0.85;
          type = "rrf";
          reasonText = "Convergence Sémantique + Mots-clés";
        }

        if (score > 0 && type) {
          processedPairs.add(pairId);
          links.push({
            source: cardA.id,
            target: cardB.id,
            value: score,
            type,
            reason: reasonText,
          });
        }
      }

      // Handle explicit separation to avoid double push (refactored logic above pushed only for non-explicit)
      if (score > 0 && type === "explicit") {
        processedPairs.add(pairId);
        links.push({
          source: cardA.id,
          target: cardB.id,
          value: score,
          type,
          reason: "Référence explicite",
        });
      }
    }
    // ... (End of RRF loop)
  }

  // --- NEW: Structural Group Linking ---
  // Cards with the same `_group:NAME` tag are strongly linked (Clique)
  const groupMap = new Map<string, string[]>();

  for (const card of cards) {
    if (!card.tags) continue;
    for (const tag of card.tags) {
      if (tag.startsWith("_group:")) {
        const groupName = tag.substring(7).trim(); // Remove '_group:'
        if (!groupName) continue;

        if (!groupMap.has(groupName)) {
          groupMap.set(groupName, []);
        }
        groupMap.get(groupName)!.push(card.id);
      }
    }
  }

  // Generate Clique Links for each group
  for (const [_, memberIds] of groupMap.entries()) {
    if (memberIds.length < 2) continue;

    // Create links between all pairs in the group
    for (let i = 0; i < memberIds.length; i++) {
      for (let j = i + 1; j < memberIds.length; j++) {
        const idA = memberIds[i];
        const idB = memberIds[j];
        const pairId = [idA, idB].sort().join("-");

        if (processedPairs.has(pairId)) continue;

        // Check Veto
        const vetoKey = [idA, idB].sort().join("|");
        if (vetoSet.has(vetoKey)) continue;

        // Create Strong Structural Link
        links.push({
          source: idA,
          target: idB,
          value: 1.0, // Maximum strength
          type: "explicit", // Show as explicit/reference link (Indigo)
        });
        processedPairs.add(pairId);
      }
    }
  }

  return links;
}

/**
 * Cleanup worker
 */
export function terminateSemanticSearch(): void {
  embeddingWorker?.terminate();
  embeddingWorker = null;
  isModelReady = false;
  modelLoadProgress = 0;

  // Recreate the init promise so subsequent re-initializations will properly wait
  initPromise = new Promise((resolve) => {
    resolveInit = resolve;
  });
}

/**
 * Find similar cards for a specific card ID
 * @param cardId The source card ID
 * @param limit Number of results
 * @returns Array of { id, similarity }
 */
export function findSimilarCards(
  cardId: string,
  limit: number = 5,
): { id: string; similarity: number }[] {
  const embedding = vectorStore.getEmbedding(cardId);
  if (!embedding) return [];

  // Search
  const results = vectorStore.search(embedding, limit + 1); // +1 because it will find itself

  // Filter out self
  return results.filter((r) => r.id !== cardId).slice(0, limit);
}
