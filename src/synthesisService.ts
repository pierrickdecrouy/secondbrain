/**
 * Search Synthesis Service
 * Generates synthesis from search results
 * Phase 1: Extraction-based (no LLM required)
 * Phase 2: LLM-powered (wllama - TBD)
 */

import type { Card, CardSegment } from './types';
import { expandMedicalQuery } from './medicalAbbreviations';

/**
 * Slugify a heading for use as a segment ID suffix.
 */
function slugify(text: string): string {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 80);
}

/**
 * Split a card's markdown `details` into named segments based on H1/H2/H3 headings.
 * Each segment contains the heading title and the text below it until the next heading.
 * If no headings are found, returns a single segment with all content.
 */
export function segmentCard(card: Card): CardSegment[] {
    const text = (card.details || card.content || '').trim();
    if (!text) return [];

    // Match headings: # Title, ## Title, ### Title
    const headingPattern = /^(#{1,3})\s+(.+)$/m;
    const lines = text.split('\n');

    const segments: CardSegment[] = [];
    let currentTitle: string | null = null;
    let currentLines: string[] = [];

    const flushSegment = (title: string | null, contentLines: string[]) => {
        const content = contentLines.join('\n').trim();
        if (!content && !title) return;
        const segTitle = title ?? card.title;
        const segContent = content || card.subtitle || '';
        if (!segContent) return;
        const slug = slugify(segTitle);
        segments.push({
            id: `${card.id}__${slug}`,
            cardId: card.id,
            title: segTitle,
            content: segContent,
        });
    };

    for (const line of lines) {
        const match = line.match(headingPattern);
        if (match) {
            // Flush the previous segment
            flushSegment(currentTitle, currentLines);
            currentTitle = match[2].trim();
            currentLines = [];
        } else {
            currentLines.push(line);
        }
    }
    // Flush last segment
    flushSegment(currentTitle, currentLines);

    // If no headings were found, return a single segment
    if (segments.length === 0) {
        segments.push({
            id: `${card.id}__main`,
            cardId: card.id,
            title: card.title,
            content: text,
        });
    }

    return segments;
}

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

    // Graph-RAG Advanced: Detect DIRECT links between top results (Intersection)
    // If top 2 cards are directly connected, it's a critical relationship.
    // We will extract this specifically later.
    let directLinkReason: string | null = null;
    let directLinkSource: { id: string, title: string } | null = null;

    if (sortedCards.length >= 2) {
        const c1 = sortedCards[0];
        const c2 = sortedCards[1];

        // Check if C1 points to C2 manually
        if (c1.manualConnections?.includes(c2.id)) {
            directLinkReason = `Lien direct identifié : ${c1.title} → ${c2.title}`;
            directLinkSource = { id: c1.id, title: "Graph-RAG Relation" };
        }
        // Check if C2 points to C1 manually
        else if (c2.manualConnections?.includes(c1.id)) {
            directLinkReason = `Lien direct identifié : ${c2.title} → ${c1.title}`;
            directLinkSource = { id: c2.id, title: "Graph-RAG Relation" };
        }
    }

    // Take top 6 most relevant cards (now respecting RRF for non-pinned items)
    const topCards = sortedCards.slice(0, 6);

    // Extract key points from each card
    let points: { text: string; source: { id: string; title: string } }[] = [];

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
        // Add card title as source
        sources.push(card.title);

        // Extract content
        const content = card.content || '';
        let bestSentence = '';

        if (content) {
            // NLP: Use Intl.Segmenter for smart sentence splitting
            const segmenter = new Intl.Segmenter('fr', { granularity: 'sentence' });
            const segments = segmenter.segment(content);

            const sentences = Array.from(segments)
                .map(s => s.segment.trim())
                .filter(s => s.length > 20); // Filter noise

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


