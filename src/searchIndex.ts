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
    tokenize: 'forward', // Partial matching (e.g., "para" finds "paracetamol")
    charset: 'latin:extra', // French accents support
    optimize: true,
    cache: 100,
});

// Rebuild the entire index with new cards
export function rebuildIndex(cards: Card[]): void {
    // Clear and rebuild - FlexSearch Document doesn't have a clear() method
    // so we re-create by re-adding all cards (add replaces existing)
    cards.forEach(card => {
        index.add({
            id: card.id,
            title: card.title,
            subtitle: card.subtitle,
            content: card.content,
            details: card.details,
        });
    });
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
}

// Remove a card from the index
export function removeFromIndex(cardId: string): void {
    try {
        index.remove(cardId);
    } catch {
        // Ignore if not exists
    }
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
        const semanticResultsAll: string[] = [];
        const seenSemantic = new Set<string>();

        for (const variant of queryVariants) {
            const results = await semanticSearch(variant, limit);
            for (const id of results) {
                if (!seenSemantic.has(id)) {
                    semanticResultsAll.push(id);
                    seenSemantic.add(id);
                }
            }
        }

        // Merge: keyword results first, then semantic (avoiding duplicates)
        const merged = [...keywordResults];
        const seen = new Set(keywordResults);

        for (const id of semanticResultsAll) {
            if (!seen.has(id)) {
                merged.push(id);
                seen.add(id);
            }
        }

        return merged.slice(0, limit);
    } catch (error) {
        console.error('Hybrid search error:', error);
        return keywordResults.slice(0, limit);
    }
}

export { index };

