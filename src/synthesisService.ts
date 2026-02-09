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
export function generateSearchSynthesis(
    query: string,
    matchedCards: Card[]
): { title: string; points: { text: string; source: { id: string; title: string } }[]; sources: string[]; keywords: string[] } | null {
    if (matchedCards.length === 0) return null;

    const normalizedQuery = query.toLowerCase().trim();
    // Expand query: "DT1" -> ["dt1", "diabete type 1", "did"]
    const expandedQueries = expandMedicalQuery(normalizedQuery);

    // Use all matched cards (trusted from search engine, including tag matches)
    const relevantCards = matchedCards;

    if (relevantCards.length === 0) return null;

    // Prioritize cards with exact title match or very close match
    const sortedCards = [...relevantCards].sort((a, b) => {
        const aTitle = a.title.toLowerCase();
        const bTitle = b.title.toLowerCase();

        // Exact match gets highest priority
        if (aTitle === normalizedQuery) return -1;
        if (bTitle === normalizedQuery) return 1;

        // Starts with match
        if (aTitle.startsWith(normalizedQuery) && !bTitle.startsWith(normalizedQuery)) return -1;
        if (bTitle.startsWith(normalizedQuery) && !aTitle.startsWith(normalizedQuery)) return 1;

        // Contains match
        if (aTitle.includes(normalizedQuery) && !bTitle.includes(normalizedQuery)) return -1;
        if (bTitle.includes(normalizedQuery) && !aTitle.includes(normalizedQuery)) return 1;

        return 0;
    });

    // Take top 6 most relevant cards
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

            // Priority 1: Definition sentences containing ANY expanded query term
            const defSentence = sentences.find((s: string) => {
                const lower = s.toLowerCase();
                const hasTerm = expandedQueries.some(q => lower.includes(q));
                return hasTerm &&
                    (lower.includes('est un') || lower.includes('est une') || lower.includes(':') || lower.includes('se définit'));
            });

            if (defSentence) {
                bestSentence = defSentence;
            }
            // Priority 2: Sentences containing ANY expanded query term
            else {
                const querySentence = sentences.find((s: string) =>
                    expandedQueries.some(q => s.toLowerCase().includes(q))
                );
                if (querySentence) {
                    bestSentence = querySentence;
                }
                // Priority 3: First sentence if no specific query match found (context/tag match)
                else if (sentences.length > 0) {
                    bestSentence = sentences[0];
                }
            }
        }

        // Fallback: Use subtitle if no content or no good sentence found
        if (!bestSentence && card.subtitle) {
            bestSentence = card.subtitle;
        }

        if (bestSentence) {
            // Cleanup sentence
            let cleanPoint = bestSentence.replace(/^[-*•]+/, '').trim(); // Remove leading bullets
            if (cleanPoint.length > 120) cleanPoint = cleanPoint.slice(0, 120) + '...';

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

/**
 * Check if synthesis is available for query
 */
export function canGenerateSynthesis(matchedCards: Card[]): boolean {
    return matchedCards.length >= 1;
}
