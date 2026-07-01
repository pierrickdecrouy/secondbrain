import FlexSearch from 'flexsearch';
import type { Card } from './types';
import { semanticSearch, isSemanticSearchReady } from './semanticSearch';
import { expandMedicalQuery } from './medicalAbbreviations';

// FlexSearch Document Index for cards
// Using 'any' to avoid TypeScript issues with FlexSearch's complex generics
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const index = new (FlexSearch as any).Document({
    document: {
        id: 'id',
        index: ['title', 'subtitle', 'content', 'details'],
        store: ['id']
    },
    tokenize: 'full', // Index all substrings for robust matching
    charset: 'latin:extra',
    minlength: 2, // Ensure short terms like "IV" or "dt1" are indexed
    optimize: true,
    cache: 100,
    context: {
        depth: 1,
        resolution: 3,
        bidirectional: true
    }
});

let indexedCardIds = new Set<string>();

// Rebuild the entire index with new cards
export function rebuildIndex(cards: Card[]): void {
    const nextIds = new Set(cards.map(card => card.id));

    // Remove cards that no longer exist
    indexedCardIds.forEach((existingId) => {
        if (!nextIds.has(existingId)) {
            try {
                index.remove(existingId);
            } catch {
                // Ignore if not exists
            }
        }
    });

    // Upsert current cards
    cards.forEach(card => {
        index.add({
            id: card.id,
            title: card.title,
            subtitle: card.subtitle,
            content: card.content,
            details: card.details,
        });
    });

    indexedCardIds = nextIds;
}

// Add a single card to the index
export function addToIndex(card: Card): void {
    index.add({
        id: card.id,
        title: card.title,
        subtitle: card.subtitle,
        content: card.content,
        details: card.details,
    });
    indexedCardIds.add(card.id);
}

export function updateIndex(card: Card): void {
    try {
        index.remove(card.id);
    } catch {
        // Ignore if not exists
    }
    index.add({
        id: card.id,
        title: card.title,
        subtitle: card.subtitle,
        content: card.content,
        details: card.details,
    });
    indexedCardIds.add(card.id);
}

// Remove a card from the index
export function removeFromIndex(cardId: string): void {
    try {
        index.remove(cardId);
    } catch {
        // Ignore if not exists
    }
    indexedCardIds.delete(cardId);
}

// Search and return matching card IDs (keyword-based)
export function searchCards(query: string, limit = 50): string[] {
    if (!query.trim()) return [];

    // FlexSearch Document.search() returns synchronously in this setup
    const results = index.search(query, {
        limit,
        enrich: true,
    });

    // Collect unique IDs from all field results
    const idSet = new Set<string>();
    if (Array.isArray(results)) {
        results.forEach((fieldResult: { field: string; result: { id: string }[] }) => {
            if (fieldResult.result && Array.isArray(fieldResult.result)) {
                fieldResult.result.forEach((item) => {
                    if (typeof item === 'string') {
                        idSet.add(item);
                    } else if (item && typeof item === 'object' && 'id' in item) {
                        idSet.add(item.id);
                    }
                });
            }
        });
    }

    return Array.from(idSet);
}

/**
 * Hybrid search: combines keyword (FlexSearch) and semantic search
 * Also expands medical abbreviations (DT1 -> Diabete type 1, HTA -> Hypertension, etc.)
 */
export async function hybridSearch(query: string, limit = 50): Promise<string[]> {
    // Expand medical abbreviations to get all search variants
    const queryVariants = expandMedicalQuery(query);

    // Get keyword results for all variants (instant)
    const keywordResults: string[] = [];
    const seenKeyword = new Set<string>();
    for (const variant of queryVariants) {
        const results = searchCards(variant, limit);
        for (const id of results) {
            if (!seenKeyword.has(id)) {
                keywordResults.push(id);
                seenKeyword.add(id);
            }
        }
    }

    // If semantic search is not ready or query is too short, return keyword only
    if (!isSemanticSearchReady() || query.length < 2) {
        return keywordResults.slice(0, limit);
    }

    try {
        // Get semantic results for all query variants (async)
        // Get semantic results for all query variants (async parallel)
        const semanticPromises = queryVariants.map(variant => semanticSearch(variant, limit));
        const resultsArrays = await Promise.all(semanticPromises);

        const semanticResultsAll: string[] = [];
        const seenSemantic = new Set<string>();

        // Flatten results while maintaining unique set
        resultsArrays.flat().forEach(id => {
            if (!seenSemantic.has(id)) {
                semanticResultsAll.push(id);
                seenSemantic.add(id);
            }
        });

        // Compute RRF scores
        const scores = new Map<string, number>();
        const k = 60; // RRF constant

        // Score keyword results
        keywordResults.forEach((id, rank) => {
            const score = 1 / (k + rank + 1);
            scores.set(id, (scores.get(id) || 0) + score);
        });

        // Score semantic results
        semanticResultsAll.forEach((id, rank) => {
            const score = 1 / (k + rank + 1);
            scores.set(id, (scores.get(id) || 0) + score);
        });

        // Sort by score DESC
        const sortedIds = Array.from(scores.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([id]) => id);

        return sortedIds.slice(0, limit);
    } catch (error) {
        console.error('Hybrid search error:', error);
        return keywordResults.slice(0, limit);
    }
}

export { index };
