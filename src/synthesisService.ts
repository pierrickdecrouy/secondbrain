/**
 * Search Synthesis Service
 * Generates synthesis from search results
 * Phase 1: Extraction-based (no LLM required)
 * Phase 2: LLM-powered (wllama - TBD)
 */

import type { Card } from './types';
import { expandMedicalQuery } from './medicalAbbreviations';

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
): { title: string; points: { text: string; source: { id: string; title: string; type: string } }[]; sources: string[]; keywords: string[] } | null {
    if (matchedCards.length === 0) return null;

    const normalizedQuery = query.toLowerCase().trim();
    // Expand query: "DT1" -> ["dt1", "diabete type 1", "did"]
    const expandedQueries = expandMedicalQuery(normalizedQuery);

    // Use all matched cards (trusted from search engine, including tag matches)
    const relevantCards = matchedCards;

    if (relevantCards.length === 0) return null;

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

    // Graph-RAG Lite
    if (sortedCards.length > 0 && allCards.length > 0) {
        const topCard = sortedCards[0];
        if (topCard.manualConnections && topCard.manualConnections.length > 0) {
            const connectedIds = new Set(topCard.manualConnections);
            const existingIds = new Set(sortedCards.map(c => c.id));

            const neighbors = allCards.filter(c => connectedIds.has(c.id) && !existingIds.has(c.id));

            if (neighbors.length > 0) {
                sortedCards.splice(1, 0, ...neighbors);
            }
        }
    }

    // Graph-RAG Advanced: Detect DIRECT links between top results (Intersection)
    let directLinkReason: string | null = null;
    let directLinkSource: { id: string; title: string; type: string } | null = null;

    if (sortedCards.length >= 2) {
        const c1 = sortedCards[0];
        const c2 = sortedCards[1];

        if (c1.manualConnections?.includes(c2.id)) {
            directLinkReason = `Lien direct identifié : **${c1.title}** est fortement lié à **${c2.title}**.`;
            directLinkSource = { id: c1.id, title: "Graph-RAG Relation", type: "relation" };
        }
        else if (c2.manualConnections?.includes(c1.id)) {
            directLinkReason = `Lien direct identifié : **${c2.title}** est fortement lié à **${c1.title}**.`;
            directLinkSource = { id: c2.id, title: "Graph-RAG Relation", type: "relation" };
        }
    }

    const topCards = sortedCards.slice(0, 6);

    let points: { text: string; source: { id: string; title: string; type: string } }[] = [];

    // Inject Graph-RAG Direct Link Point FIRST if found
    if (directLinkReason && directLinkSource) {
        points.push({
            text: directLinkReason,
            source: directLinkSource
        });
    }

    const sources: string[] = [];
    const seenContent = new Set<string>();

    topCards.forEach((card) => {
        sources.push(card.title);

        const content = card.content || '';
        let bestSentence = '';

        if (content) {
            // TypeScript compilation workaround for Intl.Segmenter
            const Segmenter = (Intl as any).Segmenter;
            let sentences: string[] = [];
            
            if (Segmenter) {
                const segmenter = new Segmenter('fr', { granularity: 'sentence' });
                const segments = segmenter.segment(content);
                sentences = Array.from(segments as Iterable<{segment: string}>)
                    .map(s => s.segment.trim().replace(/^[-*#\s]+/, ''))
                    .filter(s => s.length > 20);
            } else {
                // Fallback if Segmenter is not available
                sentences = content.split(/[.!?]+/)
                    .map(s => s.trim().replace(/^[-*#\s]+/, ''))
                    .filter(s => s.length > 20);
            }

            let bestScore = -1;

            sentences.forEach(s => {
                const lower = s.toLowerCase();
                let score = 0;

                const hasTerm = expandedQueries.some(q => lower.includes(q));
                if (hasTerm) score += 10;

                if (lower.includes('est un') || lower.includes('est une') || lower.includes('se définit')) {
                    score += 5;
                }
                
                // Smart scoring based on card type
                if (card.type === 'drug' && (lower.includes('indiqué') || lower.includes('traitement') || lower.includes('classe') || lower.includes('posologie'))) {
                    score += 6;
                } else if (card.type === 'pathology' && (lower.includes('maladie') || lower.includes('syndrome') || lower.includes('caractérisé') || lower.includes('symptôme'))) {
                    score += 6;
                } else if (card.type === 'physio' && (lower.includes('mécanisme') || lower.includes('processus') || lower.includes('rôle'))) {
                    score += 6;
                }

                score -= (content.indexOf(s) / content.length) * 2;

                if (score > bestScore) {
                    bestScore = score;
                    bestSentence = s;
                }
            });

            if (bestScore <= 0 && sentences.length > 0) {
                bestSentence = sentences[0];
            }
        }

        if ((!bestSentence || bestSentence.length < 10) && card.subtitle) {
            bestSentence = card.subtitle;
        }

        if (bestSentence) {
            let cleanPoint = bestSentence;

            if (cleanPoint.length > 160) cleanPoint = cleanPoint.slice(0, 160) + '...';

            // Intelligent formatting based on type
            if (card.type === 'drug') {
               cleanPoint = `**${card.title}** : ` + cleanPoint;
            } else if (card.type === 'pathology') {
               cleanPoint = `**${card.title}** : ` + cleanPoint;
            } else if (card.type === 'data') {
               cleanPoint = `📌 **${card.title}** : ` + cleanPoint;
            }

            const signature = cleanPoint.toLowerCase().replace(/[^a-z]/g, '');

            if (!seenContent.has(signature)) {
                points.push({
                    text: cleanPoint,
                    source: { id: card.id, title: card.title, type: card.type }
                });
                seenContent.add(signature);
            }
        }
    });

    return {
        title: 'Synthèse : ' + query,
        points: points.slice(0, 6),
        sources: sources,
        keywords: expandedQueries
    };
}
