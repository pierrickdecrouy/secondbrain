import type { Card } from './types';
import { semanticSearch, isSemanticSearchReady } from './semanticSearch';
import { expandMedicalQuery } from './medicalAbbreviations';

// Legacy functions for compatibility (no-op since FTS5 handles indexing via SQLite triggers)
export function rebuildIndex(_cards: Card[]): void {
    // No-op
}

export function addToIndex(_card: Card): void {
    // No-op
}

export function updateIndex(_card: Card): void {
    // No-op
}

export function removeFromIndex(_cardId: string): void {
    // No-op
}

export interface FTSResult {
    id: string;
    highlight: string;
}

/**
 * Fast Lexical Search using SQLite FTS5.
 * Returns both the ID and a highlighted snippet of the match.
 */
export async function fastLexicalSearch(query: string, limit = 50): Promise<FTSResult[]> {
    if (!query.trim()) return [];
    
    if (window.electronAPI?.searchCardsFTS) {
        try {
            return await window.electronAPI.searchCardsFTS(query, limit);
        } catch (e) {
            console.error("FTS5 search error:", e);
            return [];
        }
    }
    return [];
}

/**
 * Hybrid search: combines FTS5 (Lexical) and semantic search (Voy-search).
 * Also expands medical abbreviations (DT1 -> Diabete type 1, HTA -> Hypertension, etc.)
 */
export async function hybridSearch(query: string, limit = 50): Promise<string[]> {
    if (!query.trim()) return [];

    // Expand medical abbreviations to get all search variants
    const queryVariants = expandMedicalQuery(query);

    // Get keyword results for all variants via FTS5
    const keywordResults: string[] = [];
    const seenKeyword = new Set<string>();
    
    for (const variant of queryVariants) {
        const results = await fastLexicalSearch(variant, limit);
        for (const res of results) {
            if (!seenKeyword.has(res.id)) {
                keywordResults.push(res.id);
                seenKeyword.add(res.id);
            }
        }
    }

    // If semantic search is not ready or query is too short, return keyword only
    if (!isSemanticSearchReady() || query.length < 2) {
        return keywordResults.slice(0, limit);
    }

    try {
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
