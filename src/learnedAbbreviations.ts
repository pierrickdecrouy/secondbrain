/**
 * Self-Learning Abbreviation System
 * Extracts abbreviation patterns from card content and learns over time
 */

import type { Card } from './types';

// Learned abbreviations storage (merged with static dictionary)
const learnedAbbreviations: Map<string, Set<string>> = new Map();

// Static dictionary of common medical abbreviations (French)
const STATIC_ABBREVIATIONS: Record<string, string[]> = {
    "dt1": ["diabète de type 1", "diabète insulinodépendant", "did"],
    "dt2": ["diabète de type 2", "diabète non insulinodépendant", "dnid"],
    "hta": ["hypertension artérielle"],
    "avc": ["accident vasculaire cérébral"],
    "idm": ["infarctus du myocarde"],
    "bpco": ["bronchopneumopathie chronique obstructive"],
    "iv": ["intraveineuse"],
    "im": ["intramusculaire"],
    "sc": ["sous-cutanée"],
    "per os": ["voie orale"],
    "ecg": ["électrocardiogramme"],
    "eeg": ["électroencéphalogramme"],
    "crp": ["protéine c-réactive"],
    "nf": ["numération formule", "nfs"],
    "iono": ["ionogramme"],
    "bu": ["bandelette urinaire"],
    "ecbu": ["examen cytobactériologique des urines"],
    "aains": ["anti-inflammatoire non stéroïdien"],
    "ais": ["anti-inflammatoire stéroïdien"],
    "atb": ["antibiotique"],
    "ttt": ["traitement"],
    "diag": ["diagnostic"],
    "diff": ["différentiel"],
    "sd": ["syndrome"],
    "mal": ["maladie"],
    "ir": ["insuffisance rénale"],
    "ih": ["insuffisance hépatique"],
    "ic": ["insuffisance cardiaque"],
    "oap": ["oedème aigu du poumon"],
    "ep": ["embolie pulmonaire"],
    "tvp": ["thrombose veineuse profonde"],
    "mvted": ["maladie veineuse thrombo-embolique"],
};

// Initialize with static abbreviations
Object.entries(STATIC_ABBREVIATIONS).forEach(([abbr, defs]) => {
    learnedAbbreviations.set(abbr, new Set(defs));
});

// Pattern regexes to detect abbreviation definitions in text
// Matches: "DT1 (Diabete type 1)", "HTA = Hypertension", "AVC : Accident", "DT1/Diabete"
const PATTERNS = [
    // Pattern: ABBREV (full form) - most common
    /\b([A-Z]{2,6})\s*\(\s*([^)]{3,50})\s*\)/gi,
    // Pattern: ABBREV = full form
    /\b([A-Z]{2,6})\s*=\s*([^,.\n]{3,50})/gi,
    // Pattern: ABBREV : full form
    /\b([A-Z]{2,6})\s*:\s*([^,.\n]{3,50})/gi,
    // Pattern: full form (ABBREV)
    /([A-Za-zÀ-ÿ\s]{5,40})\s*\(\s*([A-Z]{2,6})\s*\)/gi,
];

/**
 * Extract abbreviation-definition pairs from text
 */
function extractFromText(text: string): Map<string, string> {
    const found = new Map<string, string>();

    for (const pattern of PATTERNS) {
        // Reset lastIndex for global regex
        pattern.lastIndex = 0;

        let match;
        while ((match = pattern.exec(text)) !== null) {
            let abbrev: string;
            let definition: string;

            // Check if it's the reverse pattern (definition first, then abbrev)
            if (match[1].length > match[2].length && /^[A-Z]+$/.test(match[2])) {
                abbrev = match[2].toLowerCase();
                definition = match[1].toLowerCase().trim();
            } else {
                abbrev = match[1].toLowerCase();
                definition = match[2].toLowerCase().trim();
            }

            // Validate: abbrev should be short, definition should be longer
            if (abbrev.length >= 2 && abbrev.length <= 6 &&
                definition.length >= 3 && definition.length <= 50 &&
                !/^\d+$/.test(abbrev)) { // Not just numbers
                found.set(abbrev, definition);
            }
        }
    }

    return found;
}

/**
 * Extract abbreviations from a single card
 */
export function extractFromCard(card: Card): Map<string, string> {
    const allText = [
        card.title,
        card.subtitle || '',
        card.content,
        card.details || '',
    ].join(' ');

    return extractFromText(allText);
}

/**
 * Learn abbreviations from all cards
 */
export function learnFromCards(cards: Card[]): void {
    const newLearned = new Map<string, Set<string>>();

    for (const card of cards) {
        const extracted = extractFromCard(card);

        for (const [abbrev, definition] of extracted) {
            if (!newLearned.has(abbrev)) {
                newLearned.set(abbrev, new Set());
            }
            newLearned.get(abbrev)!.add(definition);
        }
    }

    // Merge with existing learned (keep old + add new)
    for (const [abbrev, definitions] of newLearned) {
        if (!learnedAbbreviations.has(abbrev)) {
            learnedAbbreviations.set(abbrev, new Set());
        }
        for (const def of definitions) {
            learnedAbbreviations.get(abbrev)!.add(def);
        }
    }

}

/**
 * Get all learned abbreviations as a plain object
 */
export function getLearnedAbbreviations(): Record<string, string[]> {
    const result: Record<string, string[]> = {};

    for (const [abbrev, definitions] of learnedAbbreviations) {
        result[abbrev] = Array.from(definitions);
    }

    return result;
}

/**
 * Load learned abbreviations from storage
 */
export function loadLearnedAbbreviations(data: Record<string, string[]>): void {
    learnedAbbreviations.clear();

    for (const [abbrev, definitions] of Object.entries(data)) {
        learnedAbbreviations.set(abbrev, new Set(definitions));
    }

}

/**
 * Expand query using learned abbreviations
 */
export function expandWithLearned(query: string): string[] {
    const lowerQuery = query.toLowerCase().trim();
    const words = lowerQuery.split(/\s+/);
    const expansions = new Set<string>();

    // Check each word
    for (const word of words) {
        const learned = learnedAbbreviations.get(word);
        if (learned) {
            for (const expansion of learned) {
                expansions.add(expansion);
            }
        }
    }

    // Check full query
    const fullLearned = learnedAbbreviations.get(lowerQuery);
    if (fullLearned) {
        for (const expansion of fullLearned) {
            expansions.add(expansion);
        }
    }

    return Array.from(expansions);
}

/**
 * Add a custom abbreviation
 */
export function addAbbreviation(abbrev: string, definition: string): void {
    const lowerAbbrev = abbrev.toLowerCase().trim();
    const lowerDef = definition.toLowerCase().trim();

    if (!lowerAbbrev || !lowerDef) return;

    if (!learnedAbbreviations.has(lowerAbbrev)) {
        learnedAbbreviations.set(lowerAbbrev, new Set());
    }
    learnedAbbreviations.get(lowerAbbrev)!.add(lowerDef);
}

/**
 * Remove a specific definition for an abbreviation
 */
export function removeAbbreviation(abbrev: string, definition: string): void {
    const lowerAbbrev = abbrev.toLowerCase().trim();
    const lowerDef = definition.toLowerCase().trim();

    if (learnedAbbreviations.has(lowerAbbrev)) {
        learnedAbbreviations.get(lowerAbbrev)!.delete(lowerDef);
        if (learnedAbbreviations.get(lowerAbbrev)!.size === 0) {
            learnedAbbreviations.delete(lowerAbbrev);
        }
    }
}

/**
 * Delete an abbreviation entirely
 */
export function deleteAbbreviation(abbrev: string): void {
    const lowerAbbrev = abbrev.toLowerCase().trim();
    learnedAbbreviations.delete(lowerAbbrev);
}

/**
 * Get count of learned abbreviations
 */
export function getLearnedCount(): number {
    return learnedAbbreviations.size;
}

