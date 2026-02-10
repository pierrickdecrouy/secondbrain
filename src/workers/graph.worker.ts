import type { Card } from '../types';

interface Node {
    id: string;
    name: string;
    type: string;
    manualConnections?: string[];
    suppressedConnections?: string[];
}

interface Link {
    source: string;
    target: string;
}

// Static Stopwords: common terms that don't add meaning for linking
// Includes French articles, generic medical terms, and pharmaceutical forms
const STATIC_STOPWORDS = new Set([
    // French articles and common words (2-3 chars)
    'le', 'la', 'les', 'un', 'une', 'des', 'du', 'de', 'et', 'ou', 'en', 'au', 'aux',
    'ce', 'ces', 'son', 'ses', 'sur', 'par', 'qui', 'que', 'est', 'pas', 'plus',
    // Generic medical/structural terms
    'syndrome', 'maladie', 'type', 'forme', 'stade', 'phase', 'niveau',
    'avec', 'sans', 'dans', 'pour', 'chez', 'depuis', 'sous', 'vers',
    'traitement', 'patient', 'diagnostic', 'symptomes', 'signes',
    'aigu', 'aigue', 'chronique', 'primaire', 'secondaire',
    // Pharmaceutical dosages and units
    'mg', 'ml', 'g', 'kg', 'mcg', 'ui', 'mmol', 'mol',
    'jour', 'fois', 'heure', 'heures', 'semaine', 'mois',
    // Drug forms
    'gelule', 'gelules', 'comprime', 'comprimes', 'sachet', 'sachets',
    'solution', 'suspension', 'injectable', 'oral', 'orale',
    'sirop', 'pommade', 'creme', 'gel', 'patch', 'spray',
    'ampoule', 'ampoules', 'flacon', 'flacons', 'boite', 'boites'
]);

// Extract all potential keywords (tokens) from text
function tokenize(text: string): string[] {
    return text.toLowerCase()
        .replace(/[^a-zàâäéèêëïîôùûüç0-9\s]/gi, '') // Keep accented chars
        .split(/\s+/)
        .filter(w => w.length >= 3 && !STATIC_STOPWORDS.has(w)); // >=3 chars, exclude static stopwords
}

self.onmessage = (e: MessageEvent<Card[]>) => {
    const cards = e.data;
    const linkSet = new Set<string>();
    const links: Link[] = [];

    // ===========================================
    // PHASE 1: TF-IDF ANALYSIS & DYNAMIC STOPWORDS
    // ===========================================

    // Map: Word -> Document Frequency (count of cards containing this word)
    const docFrequencies = new Map<string, number>();
    const totalDocs = cards.length;

    // 1. Count Frequencies
    cards.forEach(card => {
        // Use a Set to count each word only once per card (Document Frequency)
        const uniqueWords = new Set([
            ...tokenize(card.title),
            ...tokenize(card.content),
            ...tokenize(card.tags.join(' '))
        ]);

        uniqueWords.forEach(word => {
            docFrequencies.set(word, (docFrequencies.get(word) || 0) + 1);
        });
    });

    // 2. Identify Dynamic Stopwords (Words appearing in > 10% of cards)
    // and Calculate IDFs
    const wordIDF = new Map<string, number>();
    const DYNAMIC_STOPWORDS = new Set<string>();

    docFrequencies.forEach((count, word) => {
        const frequency = count / totalDocs;

        // Relaxed Stopword cutoff: > 15% (was 10%)
        if (frequency > 0.15) {
            // Appearing in > 15% of docs -> Treat as stopword (IDF = 0)
            DYNAMIC_STOPWORDS.add(word);
            wordIDF.set(word, 0);
        } else {
            // IDF = log(Total / DF)
            // Rare words get high score, common words get low score
            wordIDF.set(word, Math.log(totalDocs / (count || 1)));
        }
    });

    // Helper: Get keyword weight (IDF)
    const getWeight = (word: string) => wordIDF.get(word) || 0;

    // ===========================================
    // PHASE 2: INVERTED INDEX WITH WEIGHTS
    // ===========================================

    // Index: Keyword -> List of Card IDs
    const titleIndex = new Map<string, string[]>();
    const tagIndex = new Map<string, string[]>();

    // Helper: Map ID -> Total Information Content (Sum of IDFs) of Title
    // Used to normalize scores (e.g. match must replace X% of title's info)
    const titleInfoContent = new Map<string, number>();

    cards.forEach(card => {
        // Index Title
        const titleTokens = tokenize(card.title).filter(w => !DYNAMIC_STOPWORDS.has(w));
        let infoSum = 0;

        titleTokens.forEach(token => {
            if (!titleIndex.has(token)) titleIndex.set(token, []);
            titleIndex.get(token)!.push(card.id);
            infoSum += getWeight(token);
        });

        // Min info content = 1.0 to avoid division by zero/low thresholds
        titleInfoContent.set(card.id, Math.max(1.0, infoSum));

        // Index Tags
        card.tags.forEach(tag => {
            const tagLower = tag.toLowerCase();
            if (tagLower.length >= 4) {
                if (!tagIndex.has(tagLower)) tagIndex.set(tagLower, []);
                tagIndex.get(tagLower)!.push(card.id);
            }
        });
    });

    // Helper to add a link
    const addLink = (sourceId: string, targetId: string) => {
        if (sourceId === targetId) return;
        const linkKey = [sourceId, targetId].sort().join('-');
        if (!linkSet.has(linkKey)) {
            linkSet.add(linkKey);
            links.push({ source: sourceId, target: targetId });
        }
    };

    // ===========================================
    // PHASE 3: LINKING LOGIC
    // ===========================================

    cards.forEach(card => {
        const contentTokens = tokenize(card.content + ' ' + card.details)
            .filter(w => !DYNAMIC_STOPWORDS.has(w));

        // Track "Information Score" match for potential targets
        // targetId -> Sum of IDFs of matching keywords
        const potentialMatches = new Map<string, number>();

        // Check content keywords against title index
        contentTokens.forEach(token => {
            const matchingCardIds = titleIndex.get(token);
            if (matchingCardIds) {
                const weight = getWeight(token);
                matchingCardIds.forEach(targetId => {
                    if (targetId === card.id) return;
                    const currentScore = potentialMatches.get(targetId) || 0;
                    potentialMatches.set(targetId, currentScore + weight);
                });
            }
        });

        // Validation: Link if Match Score > Threshold
        potentialMatches.forEach((score, targetId) => {
            // Hybrid Guarantee: If score is high enough (>= 1.5) because of rare words, ALWAYS link
            // This ensures "ostéocalcine" links even if target description is long
            if (score >= 1.5) {
                addLink(card.id, targetId);
                return;
            }

            const targetInfo = titleInfoContent.get(targetId) || 1.0;

            // Relaxed threshold: match 30% of target's info, absolute min 1.2
            // Threshold = 1.2 (approx 1 good medical term) OR 30% of the target title's total info content
            const threshold = Math.max(1.2, targetInfo * 0.3);

            if (score >= threshold) {
                addLink(card.id, targetId);
            }
        });

        // Tag matching (Keep explicit tag logic, it's usually high quality)
        // Tag -> Title
        card.tags.forEach(tag => {
            const tagLower = tag.toLowerCase();
            // Exact match check on title index using first token if single word tag?
            // Or reuse existing logic. Sticking to simple fuzzy:
            if (tagLower.length >= 4) {
                titleIndex.forEach((cardIds, titleKw) => {
                    if (titleKw === tagLower) {
                        cardIds.forEach(targetId => addLink(card.id, targetId));
                    }
                });
            }
        });

        // Title -> Tag
        const titleTokens = tokenize(card.title);
        titleTokens.forEach(kw => {
            tagIndex.forEach((cardIds, tagTerm) => {
                if (tagTerm === kw) {
                    cardIds.forEach(targetId => addLink(card.id, targetId));
                }
            });
        });
    });

    // Build nodes
    const nodes: Node[] = cards.map(c => ({
        id: c.id,
        name: c.title,
        type: c.type,
        manualConnections: c.manualConnections,
        suppressedConnections: c.suppressedConnections
    }));

    self.postMessage({ nodes, links });
};
