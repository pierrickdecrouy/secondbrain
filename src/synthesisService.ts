/**
 * Search Synthesis Service
 * Generates synthesis from search results
 * Phase 1: Extraction-based (no LLM required)
 * Phase 2: LLM-powered (wllama - TBD)
 */

import type { Card } from './types';

/**
 * Generate a synthesis from matched cards
 * Extract key information and present structured summary
 */
export function generateSearchSynthesis(
    query: string,
    matchedCards: Card[]
): { title: string; points: string[]; sources: string[] } | null {
    if (matchedCards.length === 0) return null;

    // Take top 3 most relevant cards
    const topCards = matchedCards.slice(0, 3);

    // Extract key points from each card
    const points: string[] = [];
    const sources: string[] = [];

    topCards.forEach(card => {
        // Add card title as source
        sources.push(card.title);

        // Extract first meaningful sentence or paragraph
        const content = card.content || '';
        const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);

        if (sentences.length > 0) {
            // Take first 2 sentences max
            const excerpt = sentences.slice(0, 2).map(s => s.trim()).join('. ');
            if (excerpt.length > 10) {
                points.push(excerpt);
            }
        }

        // Also extract subtitle if meaningful
        if (card.subtitle && card.subtitle.length > 10) {
            points.push(card.subtitle);
        }
    });

    // Remove duplicates and limit
    const uniquePoints = [...new Set(points)].slice(0, 5);

    return {
        title: 'Synthese: ' + query,
        points: uniquePoints,
        sources: sources
    };
}

/**
 * Check if synthesis is available for query
 */
export function canGenerateSynthesis(matchedCards: Card[]): boolean {
    return matchedCards.length >= 1;
}
