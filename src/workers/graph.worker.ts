import type { Card } from '../types';

interface Node {
    id: string;
    name: string;
    type: string;
}

interface Link {
    source: string;
    target: string;
}

// Stopwords: common terms that don't add meaning for linking
// Includes French articles (2-3 chars) and generic medical terms
const STOPWORDS = new Set([
    // French articles and common words (2-3 chars)
    'le', 'la', 'les', 'un', 'une', 'des', 'du', 'de', 'et', 'ou', 'en', 'au', 'aux',
    'ce', 'ces', 'son', 'ses', 'sur', 'par', 'qui', 'que', 'est', 'pas', 'plus',
    // Generic medical/structural terms
    'syndrome', 'maladie', 'type', 'forme', 'stade', 'phase', 'niveau',
    'avec', 'sans', 'dans', 'pour', 'chez', 'depuis', 'sous', 'vers',
    'traitement', 'patient', 'diagnostic', 'symptomes', 'signes',
    'aigu', 'aigue', 'chronique', 'primaire', 'secondaire'
]);

// Extract keywords (>=3 chars) from a string - captures medical acronyms like AVC, ORL, IVG
function extractKeywords(text: string): string[] {
    return text.toLowerCase()
        .replace(/[^a-zàâäéèêëïîôùûüç0-9\s]/gi, '') // Keep accented chars
        .split(/\s+/)
        .filter(w => w.length >= 3 && !STOPWORDS.has(w)); // >=3 chars, exclude stopwords
}

// Extract significant keywords (excluding stopwords) for threshold calculation
function extractSignificantKeywords(text: string): string[] {
    return extractKeywords(text).filter(w => !STOPWORDS.has(w));
}

self.onmessage = (e: MessageEvent<Card[]>) => {
    const cards = e.data;
    const linkSet = new Set<string>(); // Fast duplicate check
    const links: Link[] = [];

    // ===========================================
    // O(N) INVERTED INDEX APPROACH
    // ===========================================

    // STEP 1: Build inverted index from TITLE keywords
    // keyword -> [cardIds that have this keyword in their title]
    const titleIndex = new Map<string, string[]>();

    // Helper Map: ID -> Number of keywords in title
    const titleTokenCounts = new Map<string, number>();

    cards.forEach(card => {
        const titleKeywords = extractKeywords(card.title);
        const significantKeywords = extractSignificantKeywords(card.title);
        // Store count of SIGNIFICANT keywords (excluding stopwords)
        titleTokenCounts.set(card.id, significantKeywords.length || 1);

        titleKeywords.forEach(kw => {
            if (!titleIndex.has(kw)) {
                titleIndex.set(kw, []);
            }
            titleIndex.get(kw)!.push(card.id);
        });
    });

    // STEP 2: Build inverted index from TAGS
    // tag -> [cardIds that have this tag]
    const tagIndex = new Map<string, string[]>();

    cards.forEach(card => {
        card.tags.forEach(tag => {
            const tagLower = tag.toLowerCase();
            if (tagLower.length >= 4) {
                if (!tagIndex.has(tagLower)) {
                    tagIndex.set(tagLower, []);
                }
                tagIndex.get(tagLower)!.push(card.id);
            }
        });
    });

    // Helper to add a link (avoiding duplicates)
    const addLink = (sourceId: string, targetId: string) => {
        if (sourceId === targetId) return;
        const linkKey = [sourceId, targetId].sort().join('-');
        if (!linkSet.has(linkKey)) {
            linkSet.add(linkKey);
            links.push({ source: sourceId, target: targetId });
        }
    };

    // STEP 3: Single pass - for each card, find links via inverted index
    // Complexity: O(N * K) where K = avg keywords per card content (~50)
    cards.forEach(card => {
        const contentKeywords = extractKeywords(card.content + ' ' + card.details);

        // Track match counts for potential target candidates
        // targetId -> number of matching keywords found
        const potentialMatches = new Map<string, number>();

        // Check each content keyword against the title index
        contentKeywords.forEach(kw => {
            const matchingCardIds = titleIndex.get(kw);
            if (matchingCardIds) {
                matchingCardIds.forEach(targetId => {
                    if (targetId === card.id) return; // Ignore self-reference
                    const currentCount = potentialMatches.get(targetId) || 0;
                    potentialMatches.set(targetId, currentCount + 1);
                });
            }
        });

        // Verify matches: Link if we matched at least 67% of significant keywords
        // This allows "insuffisance rénale sévère" to link to "insuffisance rénale chronique"
        potentialMatches.forEach((matchCount, targetId) => {
            const significantCount = titleTokenCounts.get(targetId) || 1;

            // Calculate threshold: at least 67% of significant keywords, minimum 1
            const threshold = Math.max(1, Math.ceil(significantCount * 0.67));

            if (matchCount >= threshold) {
                addLink(card.id, targetId);
            }
        });

        // Tag-to-Title matching: check card's tags against title index
        card.tags.forEach(tag => {
            const tagLower = tag.toLowerCase();
            if (tagLower.length >= 4) {
                // Check for partial matches in title index
                titleIndex.forEach((cardIds, titleKw) => {
                    // Stricter tag logic could be added here, but keeping basic inclusion for now
                    if (titleKw.includes(tagLower) || tagLower.includes(titleKw)) {
                        cardIds.forEach(targetId => {
                            addLink(card.id, targetId);
                        });
                    }
                });
            }
        });

        // Title-to-Tag matching: check card's title keywords against tag index
        const titleKeywords = extractKeywords(card.title);
        titleKeywords.forEach(kw => {
            tagIndex.forEach((cardIds, tagTerm) => {
                if (tagTerm.includes(kw) || kw.includes(tagTerm)) {
                    cardIds.forEach(targetId => {
                        addLink(card.id, targetId);
                    });
                }
            });
        });
    });

    // Build nodes
    const nodes: Node[] = cards.map(c => ({
        id: c.id,
        name: c.title,
        type: c.type
    }));

    self.postMessage({ nodes, links });
};
