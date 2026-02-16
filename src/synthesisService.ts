/**
 * Search Synthesis Service
 * Generates synthesis from search results
 * Phase 1: Extraction-based (no LLM required)
 * Phase 2: LLM-powered (wllama - TBD)
 */

import type { Card } from './types';
import { expandMedicalQuery } from './medicalAbbreviations';

/**
 * Generate a synthesis from matched cards
 * Extract key information and present structured summary
 */
/**
 * Check if synthesis is available for query
 */
export function canGenerateSynthesis(matchedCards: Card[]): boolean {
    return matchedCards.length >= 1;
}

/**
 * Generate a synthesis from matched cards
 * Extract key information and present structured summary
 * IMPROVED: Respects RRF semantic ranking and reduces aggressive re-sorting
 */
export function generateSearchSynthesis(
    query: string,
    matchedCards: Card[],
    allCards: Card[] = [] // Optional for backward compatibility, but needed for Graph-RAG
): { title: string; points: { text: string; source: { id: string; title: string } }[]; sources: string[]; keywords: string[] } | null {
    if (matchedCards.length === 0) return null;

    const normalizedQuery = query.toLowerCase().trim();
    // Expand query: "DT1" -> ["dt1", "diabete type 1", "did"]
    const expandedQueries = expandMedicalQuery(normalizedQuery);

    // Use all matched cards (trusted from search engine, including tag matches)
    const relevantCards = matchedCards;

    if (relevantCards.length === 0) return null;

    // STRATEGY: 
    // 1. Identify the "Principal Subject" (Exact or strong title match) -> Pin to top
    // 2. Keep the rest in their original RRF rank (Semantic/Hybrid score)
    // This avoids burying highly relevant semantic results that don't match the title string

    let sortedCards = [...relevantCards];
    const exactMatchIndex = sortedCards.findIndex(c => c.title.toLowerCase() === normalizedQuery);

    if (exactMatchIndex !== -1) {
        // Move exact match to front
        const exact = sortedCards.splice(exactMatchIndex, 1)[0];
        sortedCards.unshift(exact);
    } else {
        // Try precise startsWith match if no exact match
        const startsWithIndex = sortedCards.findIndex(c => c.title.toLowerCase().startsWith(normalizedQuery));
        if (startsWithIndex !== -1) {
            const start = sortedCards.splice(startsWithIndex, 1)[0];
            sortedCards.unshift(start);
        }
    }

    // Graph-RAG Lite: 
    // If the top card has manual connections, pull them in if they aren't already in the top results.
    // This allows "Context Expansion" based on user-defined knowledge graph.
    if (sortedCards.length > 0 && allCards.length > 0) {
        const topCard = sortedCards[0];
        if (topCard.manualConnections && topCard.manualConnections.length > 0) {
            const connectedIds = new Set(topCard.manualConnections);
            // Filter out cards already in sortedCards (to avoid dups, but allow re-ranking if we want)
            // Actually, we want to inject them if they are missing.
            const existingIds = new Set(sortedCards.map(c => c.id));

            const neighbors = allCards.filter(c => connectedIds.has(c.id) && !existingIds.has(c.id));

            if (neighbors.length > 0) {
                // Insert neighbors after the top card (high priority context)
                sortedCards.splice(1, 0, ...neighbors);
            }
        }
    }

    // Take top 6 most relevant cards (now respecting RRF for non-pinned items)
    const topCards = sortedCards.slice(0, 6);

    // Extract key points from each card
    let points: { text: string; source: { id: string; title: string } }[] = [];
    const sources: string[] = [];
    const seenContent = new Set<string>();

    topCards.forEach((card) => {
        // Add card title as source
        sources.push(card.title);

        // Extract content
        const content = card.content || '';
        let bestSentence = '';

        if (content) {
            // Split into sentences (handle ., !, ?, and newlines)
            const sentences = content.split(/([.!?\n]+)/)
                .reduce((acc: string[], part: string, i: number, arr: string[]) => {
                    if (i % 2 === 0) acc.push(part + (arr[i + 1] || '')); // Reattach matching delimiter
                    return acc;
                }, [])
                .map((s: string) => s.trim())
                .filter((s: string) => s.length > 20); // Filter out very short fragments

            // Scoring sentences based on query relevance and structure
            // Rank 1: Definition style with query term
            // Rank 2: Contains query term
            // Rank 3: First sentence (Introduction) - Fallback

            let bestScore = -1;

            sentences.forEach(s => {
                const lower = s.toLowerCase();
                let score = 0;

                // Keyword match boost
                const hasTerm = expandedQueries.some(q => lower.includes(q));
                if (hasTerm) score += 10;

                // Definition structure boost
                if (lower.includes('est un') || lower.includes('est une') || lower.includes('se définit')) {
                    score += 5;
                }

                // Position penalty (prefer earlier sentences)
                // But only slight penalty
                score -= (content.indexOf(s) / content.length) * 2;

                if (score > bestScore) {
                    bestScore = score;
                    bestSentence = s;
                }
            });

            // Fallback to first sentence if nothing scored well
            if (bestScore <= 0 && sentences.length > 0) {
                bestSentence = sentences[0];
            }
        }

        // Fallback: Use subtitle if no content or no good sentence found
        if ((!bestSentence || bestSentence.length < 10) && card.subtitle) {
            bestSentence = card.subtitle;
        }

        if (bestSentence) {
            // Cleanup sentence
            let cleanPoint = bestSentence.replace(/^[-*•]+/, '').trim(); // Remove leading bullets

            // Limit length
            if (cleanPoint.length > 150) cleanPoint = cleanPoint.slice(0, 150) + '...';

            const signature = cleanPoint.toLowerCase().replace(/[^a-z]/g, '');

            // Deduplication
            if (!seenContent.has(signature)) {
                points.push({
                    text: cleanPoint,
                    source: { id: card.id, title: card.title }
                });
                seenContent.add(signature);
            }
        }
    });

    // Final limit to avoidance information overload
    return {
        title: 'Synthèse : ' + query,
        points: points.slice(0, 6),
        sources: sources,
        keywords: expandedQueries
    };

}


