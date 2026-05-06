/**
 * Link Feedback Service — Self-Learning Link Quality System v2
 * 
 * Features:
 * 1. Hard constraints: suppressed link pairs are NEVER re-suggested (veto set)
 * 2. Temporal decay: recent patterns weigh more than old ones
 * 3. Toxic keywords: learns which words cause false positive links
 * 4. Positive/negative pattern recording from user actions
 * 5. Dashboard stats API for quality monitoring
 * 
 * Persisted via localStorage.
 */

import type { Card } from './types';

// A learned pattern from user feedback
interface FeedbackPattern {
    typePair: string;            // e.g. "drug|patho" (sorted)
    sharedTags: string[];        // tags that both cards share
    keywords: string[];          // significant words in the link
    count: number;               // how many times this pattern was seen
    lastSeen: number;            // timestamp
}

// The full feedback store
export interface LinkFeedbackData {
    positivePatterns: FeedbackPattern[];
    negativePatterns: FeedbackPattern[];
    typePairScores: Record<string, number>;
    // v2: Hard constraints — specific card pairs that are permanently vetoed
    vetoPairs: string[];         // sorted "cardIdA-cardIdB" keys
    // v2: Toxic keywords — words that caused false positives
    toxicKeywords: Record<string, number>; // keyword → penalty count
    // v2: Stats tracking
    stats: {
        totalLinksGenerated: number;
        totalSuppressed: number;
        totalManual: number;
        suppressionHistory: Array<{ date: number; count: number }>;  // daily suppression counts
    };
}

const STORAGE_KEY = 'pharma-brain-link-feedback';

// Temporal decay constants
const DECAY_HALF_LIFE_MS = 90 * 24 * 60 * 60 * 1000; // 90 days half-life
const MAX_VETO_PAIRS = 5000;
const MAX_TOXIC_KEYWORDS = 500;

let feedbackData: LinkFeedbackData = {
    positivePatterns: [],
    negativePatterns: [],
    typePairScores: {},
    vetoPairs: [],
    toxicKeywords: {},
    stats: {
        totalLinksGenerated: 0,
        totalSuppressed: 0,
        totalManual: 0,
        suppressionHistory: []
    }
};

// ============================================
// Persistence
// ============================================

export function loadFeedback(): void {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            // Migrate from v1 if needed
            feedbackData = {
                positivePatterns: parsed.positivePatterns || [],
                negativePatterns: parsed.negativePatterns || [],
                typePairScores: parsed.typePairScores || {},
                vetoPairs: parsed.vetoPairs || [],
                toxicKeywords: parsed.toxicKeywords || {},
                stats: parsed.stats || {
                    totalLinksGenerated: 0,
                    totalSuppressed: 0,
                    totalManual: 0,
                    suppressionHistory: []
                }
            };
            console.log(`🧠 Link feedback loaded: ${feedbackData.positivePatterns.length} positive, ${feedbackData.negativePatterns.length} negative, ${feedbackData.vetoPairs.length} vetoes, ${Object.keys(feedbackData.toxicKeywords).length} toxic keywords`);
        }
    } catch (e) {
        console.warn('Failed to load link feedback:', e);
    }
}

function saveFeedback(): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(feedbackData));
    } catch (e) {
        console.warn('Failed to save link feedback:', e);
    }
}

// ============================================
// Temporal Decay
// ============================================

/**
 * Compute a decay factor based on age of a pattern.
 * Returns 1.0 for recent, ~0.5 after 90 days, ~0.25 after 180 days.
 */
function decayFactor(timestamp: number): number {
    const ageMs = Date.now() - timestamp;
    if (ageMs <= 0) return 1.0;
    return Math.pow(0.5, ageMs / DECAY_HALF_LIFE_MS);
}

// ============================================
// Pattern Extraction
// ============================================

function makeTypePair(typeA: string, typeB: string): string {
    return [typeA, typeB].sort().join('|');
}

function makeVetoKey(idA: string, idB: string): string {
    return [idA, idB].sort().join('|');
}

function extractSharedTags(cardA: Card, cardB: Card): string[] {
    const tagsA = new Set(cardA.tags.map(t => t.toLowerCase().trim()));
    const shared: string[] = [];
    cardB.tags.forEach(tag => {
        const t = tag.toLowerCase().trim();
        if (tagsA.has(t)) shared.push(t);
    });
    return shared;
}

function extractKeywords(cardA: Card, cardB: Card): string[] {
    const words = new Set<string>();
    const allText = `${cardA.title} ${cardB.title}`.toLowerCase();
    allText.split(/\s+/).forEach(w => {
        if (w.length >= 5) words.add(w);
    });
    return Array.from(words).slice(0, 6);
}

function findOrCreatePattern(
    patterns: FeedbackPattern[],
    typePair: string,
    sharedTags: string[],
    keywords: string[]
): FeedbackPattern {
    const existing = patterns.find(p =>
        p.typePair === typePair &&
        p.sharedTags.length === sharedTags.length &&
        p.sharedTags.every(t => sharedTags.includes(t))
    );

    if (existing) {
        existing.count += 1;
        existing.lastSeen = Date.now();
        keywords.forEach(k => {
            if (!existing.keywords.includes(k)) existing.keywords.push(k);
        });
        return existing;
    }

    const newPattern: FeedbackPattern = {
        typePair,
        sharedTags,
        keywords,
        count: 1,
        lastSeen: Date.now()
    };
    patterns.push(newPattern);
    return newPattern;
}

// ============================================
// Recording Feedback
// ============================================

/**
 * Record a suppressed link — negative signal + hard veto + toxic keyword learning
 */
export function recordNegativeFeedback(cardA: Card, cardB: Card): void {
    const typePair = makeTypePair(cardA.type, cardB.type);
    const sharedTags = extractSharedTags(cardA, cardB);
    const keywords = extractKeywords(cardA, cardB);

    // 1. Pattern recording
    findOrCreatePattern(feedbackData.negativePatterns, typePair, sharedTags, keywords);

    // 2. Hard veto: NEVER suggest this specific pair again
    const vetoKey = makeVetoKey(cardA.id, cardB.id);
    if (!feedbackData.vetoPairs.includes(vetoKey)) {
        feedbackData.vetoPairs.push(vetoKey);
        // Prune if too many
        if (feedbackData.vetoPairs.length > MAX_VETO_PAIRS) {
            feedbackData.vetoPairs = feedbackData.vetoPairs.slice(-MAX_VETO_PAIRS);
        }
    }

    // 3. Toxic keyword learning
    // Keywords that appear in suppressed links become "suspected toxic"
    keywords.forEach(kw => {
        const current = feedbackData.toxicKeywords[kw] || 0;
        feedbackData.toxicKeywords[kw] = current + 1;
    });
    // Prune rare toxic keywords (keep only the most offending ones)
    const toxicEntries = Object.entries(feedbackData.toxicKeywords);
    if (toxicEntries.length > MAX_TOXIC_KEYWORDS) {
        toxicEntries.sort((a, b) => b[1] - a[1]);
        feedbackData.toxicKeywords = Object.fromEntries(toxicEntries.slice(0, MAX_TOXIC_KEYWORDS));
    }

    // 4. Update type pair scores
    const currentScore = feedbackData.typePairScores[typePair] || 0;
    feedbackData.typePairScores[typePair] = Math.max(-0.5, currentScore - 0.05);

    // 5. Stats
    feedbackData.stats.totalSuppressed += 1;
    updateSuppressionHistory();

    // Prune old negative patterns (keep max 200)
    if (feedbackData.negativePatterns.length > 200) {
        feedbackData.negativePatterns.sort((a, b) => b.lastSeen - a.lastSeen);
        feedbackData.negativePatterns = feedbackData.negativePatterns.slice(0, 200);
    }

    saveFeedback();
    console.log(`📉 Negative feedback: ${cardA.title} ↔ ${cardB.title} | veto + ${keywords.length} toxic kw`);
}

/**
 * Record a manual link creation — positive signal
 */
export function recordPositiveFeedback(cardA: Card, cardB: Card): void {
    const typePair = makeTypePair(cardA.type, cardB.type);
    const sharedTags = extractSharedTags(cardA, cardB);
    const keywords = extractKeywords(cardA, cardB);

    findOrCreatePattern(feedbackData.positivePatterns, typePair, sharedTags, keywords);

    // Boost type pair score
    const currentScore = feedbackData.typePairScores[typePair] || 0;
    feedbackData.typePairScores[typePair] = Math.min(0.5, currentScore + 0.05);

    // Reduce toxic score for these keywords (they were manually validated)
    keywords.forEach(kw => {
        if (feedbackData.toxicKeywords[kw]) {
            feedbackData.toxicKeywords[kw] = Math.max(0, feedbackData.toxicKeywords[kw] - 1);
            if (feedbackData.toxicKeywords[kw] === 0) {
                delete feedbackData.toxicKeywords[kw];
            }
        }
    });

    // Stats
    feedbackData.stats.totalManual += 1;

    // Prune old positive patterns
    if (feedbackData.positivePatterns.length > 200) {
        feedbackData.positivePatterns.sort((a, b) => b.lastSeen - a.lastSeen);
        feedbackData.positivePatterns = feedbackData.positivePatterns.slice(0, 200);
    }

    saveFeedback();
    console.log(`📈 Positive feedback: ${cardA.title} ↔ ${cardB.title}`);
}

/**
 * Track link generation count (called by NetworkView after worker returns)
 */
export function recordLinksGenerated(count: number): void {
    feedbackData.stats.totalLinksGenerated += count;
    saveFeedback();
}

function updateSuppressionHistory(): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayMs = today.getTime();

    const existing = feedbackData.stats.suppressionHistory.find(h => h.date === todayMs);
    if (existing) {
        existing.count += 1;
    } else {
        feedbackData.stats.suppressionHistory.push({ date: todayMs, count: 1 });
    }

    // Keep only last 90 days
    const cutoff = Date.now() - 90 * 24 * 60 * 60 * 1000;
    feedbackData.stats.suppressionHistory = feedbackData.stats.suppressionHistory.filter(h => h.date >= cutoff);
}

// ============================================
// Scoring (used by the worker)
// ============================================

/**
 * Get the full feedback data for the worker (serializable)
 */
export function getLinkFeedback(): LinkFeedbackData {
    return {
        positivePatterns: feedbackData.positivePatterns,
        negativePatterns: feedbackData.negativePatterns,
        typePairScores: { ...feedbackData.typePairScores },
        vetoPairs: feedbackData.vetoPairs,
        toxicKeywords: { ...feedbackData.toxicKeywords },
        stats: { ...feedbackData.stats }
    };
}

/**
 * Check if a specific card pair is vetoed (hard constraint)
 */
export function isVetoed(idA: string, idB: string): boolean {
    const key = makeVetoKey(idA, idB);
    return feedbackData.vetoPairs.includes(key);
}

/**
 * Get toxic penalty for a set of keywords
 * Returns a penalty (0 to -0.4) based on how "toxic" the linking keywords are
 */
export function getToxicPenalty(keywords: string[]): number {
    let penalty = 0;
    for (const kw of keywords) {
        const toxicCount = feedbackData.toxicKeywords[kw] || 0;
        if (toxicCount >= 3) {
            // This keyword has caused 3+ bad links → significant penalty
            penalty -= 0.1 * Math.min(toxicCount, 5);
        } else if (toxicCount >= 1) {
            // Mild suspicion
            penalty -= 0.03 * toxicCount;
        }
    }
    return Math.max(-0.4, penalty);
}

// ============================================
// Dashboard Stats API
// ============================================

export interface DashboardStats {
    totalLinksGenerated: number;
    totalSuppressed: number;
    totalManual: number;
    acceptanceRate: number;           // % of links not suppressed
    positivePatternCount: number;
    negativePatternCount: number;
    vetoCount: number;
    toxicKeywordCount: number;
    topToxicKeywords: Array<{ word: string; count: number }>;
    typePairScores: Record<string, number>;
    recentSuppressionTrend: Array<{ date: string; count: number }>;
    learningScore: number;            // 0-100 overall quality score
}

export function getDashboardStats(): DashboardStats {
    const total = feedbackData.stats.totalLinksGenerated;
    const suppressed = feedbackData.stats.totalSuppressed;
    const acceptanceRate = total > 0
        ? Math.round(((total - suppressed) / total) * 100)
        : 100;

    // Top toxic keywords
    const toxicEntries = Object.entries(feedbackData.toxicKeywords)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([word, count]) => ({ word, count }));

    // Recent suppression trend (last 30 days)
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const recentTrend = feedbackData.stats.suppressionHistory
        .filter(h => h.date >= thirtyDaysAgo)
        .map(h => ({
            date: new Date(h.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
            count: h.count
        }));

    // Learning score: starts at 50, improves with feedback
    // +1 per positive pattern, +0.5 per negative (learning from mistakes),
    // -1 per recent suppression (recent = last 7 days)
    const recentSevenDays = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recentSuppressions = feedbackData.stats.suppressionHistory
        .filter(h => h.date >= recentSevenDays)
        .reduce((sum, h) => sum + h.count, 0);

    let learningScore = 50
        + feedbackData.positivePatterns.length * 1
        + feedbackData.negativePatterns.length * 0.5
        + Object.keys(feedbackData.toxicKeywords).length * 0.3
        - recentSuppressions * 2;
    learningScore = Math.max(0, Math.min(100, Math.round(learningScore)));

    return {
        totalLinksGenerated: total,
        totalSuppressed: suppressed,
        totalManual: feedbackData.stats.totalManual,
        acceptanceRate,
        positivePatternCount: feedbackData.positivePatterns.length,
        negativePatternCount: feedbackData.negativePatterns.length,
        vetoCount: feedbackData.vetoPairs.length,
        toxicKeywordCount: Object.keys(feedbackData.toxicKeywords).length,
        topToxicKeywords: toxicEntries,
        typePairScores: { ...feedbackData.typePairScores },
        recentSuppressionTrend: recentTrend,
        learningScore
    };
}

/**
 * Reset all feedback data (danger zone)
 */
export function resetFeedback(): void {
    feedbackData = {
        positivePatterns: [],
        negativePatterns: [],
        typePairScores: {},
        vetoPairs: [],
        toxicKeywords: {},
        stats: {
            totalLinksGenerated: 0,
            totalSuppressed: 0,
            totalManual: 0,
            suppressionHistory: []
        }
    };
    saveFeedback();
    console.log('🗑️ Link feedback reset complete');
}

// Re-export for worker: compute feedback adjustment WITH temporal decay
export { decayFactor };

// ============================================
// Abbreviation-Based Link Suggestions
// ============================================

export interface AbbreviationLinkSuggestion {
    /** The abbreviation found in the new card's text */
    abbreviation: string;
    /** The full form resolved from the abbreviation dictionaries */
    fullForm: string;
    /** IDs of cards whose title or content match the resolved full form */
    matchingCardIds: string[];
    /** Confidence score in [0, 1] */
    confidence: number;
}

/**
 * Scans a card's text for known medical abbreviations and returns
 * suggested links to other cards whose content matches the resolved terms.
 *
 * @param card       The new/updated card to analyse
 * @param allCards   The full card library to search for matches
 * @param abbreviations Static + custom abbreviation dictionary (abbr → synonyms[])
 */
export function suggestAbbreviationLinks(
    card: Card,
    allCards: Card[],
    abbreviations: Record<string, string[]>
): AbbreviationLinkSuggestion[] {
    const cardText = [card.title, card.subtitle || '', card.content, card.details || '']
        .join(' ')
        .toLowerCase();

    const suggestions: AbbreviationLinkSuggestion[] = [];

    for (const [abbr, synonyms] of Object.entries(abbreviations)) {
        // Check whether the abbreviation (case-insensitive, whole word) appears in the card text
        const abbrRe = new RegExp(`\\b${abbr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        if (!abbrRe.test(cardText)) continue;

        // Skip if this card is already linked to itself
        const matchingCardIds = allCards
            .filter(c => c.id !== card.id)
            .filter(c => {
                // Skip already vetoed pairs
                if (isVetoed(card.id, c.id)) return false;

                const targetText = [c.title, c.subtitle || '', c.content, c.details || '']
                    .join(' ')
                    .toLowerCase();

                // Check if any synonym of the abbreviation appears in the target card
                return synonyms.some(syn =>
                    targetText.includes(syn.toLowerCase())
                );
            })
            .map(c => c.id);

        if (matchingCardIds.length === 0) continue;

        // Confidence: higher when more synonyms match and the abbreviation is well-known
        const confidence = Math.min(1, 0.4 + matchingCardIds.length * 0.1);

        suggestions.push({
            abbreviation: abbr,
            fullForm: synonyms[0] ?? abbr,
            matchingCardIds,
            confidence,
        });
    }

    // Sort by descending confidence
    return suggestions.sort((a, b) => b.confidence - a.confidence);
}

