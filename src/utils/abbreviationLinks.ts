/**
 * Automatic Semantic Link Suggestions via Abbreviation Matching
 * 
 * Suggests links between a card and existing cards by:
 * 1. Extracting abbreviations from the new card's content
 * 2. Matching against medicalAbbreviations and learnedAbbreviations
 * 3. Searching for existing cards whose titles match the expansions
 */

import type { Card } from '../types';
import { MEDICAL_ABBREVIATIONS } from '../medicalAbbreviations';
import { getLearnedAbbreviations } from '../learnedAbbreviations';

export interface LinkSuggestion {
    cardId: string;
    cardTitle: string;
    matchedAbbrev: string;
    expansion: string;
}

/**
 * Extract all tokens (potential abbreviations) from a card's text.
 * Returns short uppercase tokens that could be abbreviations.
 */
function extractTokens(card: Card): string[] {
    const allText = [
        card.title,
        card.subtitle ?? '',
        card.content,
        card.details ?? '',
    ].join(' ');

    // Match 2-6 char uppercase tokens, or any word to look up in learned dict
    const tokens = new Set<string>();
    const upperPattern = /\b([A-Z]{2,6})\b/g;
    let m: RegExpExecArray | null;
    while ((m = upperPattern.exec(allText)) !== null) {
        tokens.add(m[1].toLowerCase());
    }
    // Also check all words (lowercase) against learned abbreviations
    const wordPattern = /\b([a-zA-ZÀ-ÿ]{2,8})\b/g;
    while ((m = wordPattern.exec(allText)) !== null) {
        tokens.add(m[1].toLowerCase());
    }
    return Array.from(tokens);
}

/**
 * Suggest links between `card` and `allCards` based on abbreviation expansions.
 * Returns up to `limit` suggestions, excluding self and existing connections.
 */
export function suggestAbbreviationLinks(
    card: Card,
    allCards: Card[],
    limit = 8
): LinkSuggestion[] {
    const tokens = extractTokens(card);
    const existingIds = new Set([
        card.id,
        ...(card.manualConnections ?? []),
        ...(card.suppressedConnections ?? []),
    ]);

    // Build combined abbreviation dictionary
    const medicalEntries = Object.entries(MEDICAL_ABBREVIATIONS);
    const learnedEntries = Object.entries(getLearnedAbbreviations());
    const allEntries: Array<[string, string[]]> = [
        ...medicalEntries.map(([k, v]) => [k, Array.isArray(v) ? v : [v]] as [string, string[]]),
        ...learnedEntries.map(([k, v]) => [k, Array.isArray(v) ? v : [v]] as [string, string[]]),
    ];

    // Build expansion lookup: abbrev → expansions[]
    const expansionMap = new Map<string, string[]>();
    allEntries.forEach(([abbrev, expansions]) => {
        const key = abbrev.toLowerCase();
        const current = expansionMap.get(key) ?? [];
        expansions.forEach(e => {
            if (!current.includes(e.toLowerCase())) current.push(e.toLowerCase());
        });
        expansionMap.set(key, current);
    });

    const suggestions: LinkSuggestion[] = [];
    const seenCardIds = new Set<string>();

    // For each token found in the card, find matching expansions in other cards
    for (const token of tokens) {
        const expansions = expansionMap.get(token);
        if (!expansions || expansions.length === 0) continue;

        for (const expansion of expansions) {
            for (const other of allCards) {
                if (existingIds.has(other.id)) continue;
                if (seenCardIds.has(other.id)) continue;

                const otherTitle = other.title.toLowerCase();
                const otherContent = (other.content + ' ' + (other.subtitle ?? '')).toLowerCase();

                if (otherTitle.includes(expansion) || otherContent.includes(expansion)) {
                    suggestions.push({
                        cardId: other.id,
                        cardTitle: other.title,
                        matchedAbbrev: token.toUpperCase(),
                        expansion,
                    });
                    seenCardIds.add(other.id);

                    if (suggestions.length >= limit) return suggestions;
                }
            }
        }
    }

    return suggestions;
}
