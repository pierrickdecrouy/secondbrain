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
): { title: string; points: string[]; sources: string[]; keywords: string[] } | null {
    if (matchedCards.length === 0) return null;

    const normalizedQuery = query.toLowerCase().trim();
    // Expand query: "DT1" -> ["dt1", "diabete type 1", "did"]
    const expandedQueries = expandMedicalQuery(normalizedQuery);

    // Filter cards: keep only those containing at least one of the query terms
    // This removes irrelevant semantic matches (e.g. Krebs cycle for "DT1")
    //@ts-ignore
    const relevantCards = matchedCards.filter(card => {
        const text = (card.title + ' ' + (card.content || '')).toLowerCase();
        return expandedQueries.some(q => text.includes(q));
    });

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
    let points: string[] = [];
    const sources: string[] = [];
    const seenContent = new Set<string>();

    topCards.forEach((card) => {
        // Add card title as source
        sources.push(card.title);

        // Extract content
        const content = card.content || '';
        if (!content) return;

        // Split into sentences (handle ., !, ?, and newlines)
        const sentences = content.split(/([.!?\n]+)/)
            .reduce((acc: string[], part: string, i: number, arr: string[]) => {
                if (i % 2 === 0) acc.push(part + (arr[i + 1] || '')); // Reattach matching delimiter
                return acc;
            }, [])
            .map((s: string) => s.trim())
            .filter((s: string) => s.length > 20); // Filter out very short fragments

        let bestSentence = '';

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
            // Priority 3: First sentence, ONLY if title contains query
            // Otherwise we risk keeping irrelevant content
            else if (sentences.length > 0) {
                const titleLower = card.title.toLowerCase();
                if (expandedQueries.some(q => titleLower.includes(q))) {
                    bestSentence = sentences[0];
                }
            }
        }

        if (bestSentence) {
            // Cleanup sentence
            let cleanPoint = bestSentence.replace(/^[-*•]+/, '').trim(); // Remove leading bullets
            if (cleanPoint.length > 150) cleanPoint = cleanPoint.slice(0, 150) + '...';

            const signature = cleanPoint.toLowerCase().replace(/[^a-z]/g, '');

            // Deduplication
            if (!seenContent.has(signature)) {
                points.push(`**${card.title}** : ${cleanPoint}`);
                seenContent.add(signature);
            }
        }
    });

    // Final limit to avoidance information overload
    return {
        title: 'Synthèse : ' + query,
        points: points.slice(0, 5),
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
