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
    value: number;       // Confidence score (0-1)
    reason: string;      // Human-readable explanation of WHY this link exists
    quality?: 'boost' | 'match' | 'weak';
}

// Feedback data from user actions (suppressed/manual links)
interface FeedbackData {
    typePairScores: Record<string, number>;
    negativePatterns: Array<{
        typePair: string;
        sharedTags: string[];
        keywords: string[];
        count: number;
        lastSeen: number;
    }>;
    positivePatterns: Array<{
        typePair: string;
        sharedTags: string[];
        keywords: string[];
        count: number;
        lastSeen: number;
    }>;
    vetoPairs: string[];                    // Hard constraints: never re-suggest
    toxicKeywords: Record<string, number>;  // Keywords that cause false positives
}

// Input message format
interface WorkerInput {
    cards: Card[];
    abbreviations?: Record<string, string[]>;
    changedIds?: string[];
    existingLinks?: Link[];
    feedback?: FeedbackData;
}

// ===========================================
// TYPE COMPATIBILITY MATRIX
// ===========================================
// Score multipliers for link creation based on card type pairs
// drug↔patho = very relevant, same-type = weaker
const TYPE_COMPAT: Record<string, number> = {
    'drug|patho': 1.5,
    'drug|physio': 1.2,
    'drug|data': 0.8,
    'drug|drug': 0.7,
    'patho|physio': 1.4,
    'patho|data': 1.1,
    'patho|patho': 0.7,
    'physio|data': 1.1,
    'physio|physio': 0.7,
    'data|data': 0.6,
};

function getTypeCompat(typeA: string, typeB: string): number {
    const key = [typeA, typeB].sort().join('|');
    return TYPE_COMPAT[key] ?? 1.0;
}

// Static Stopwords: common terms that don't add meaning for linking
const STATIC_STOPWORDS = new Set([
    'le', 'la', 'les', 'un', 'une', 'des', 'du', 'de', 'et', 'ou', 'en', 'au', 'aux',
    'ce', 'ces', 'son', 'ses', 'sur', 'par', 'qui', 'que', 'est', 'pas', 'plus',
    'syndrome', 'maladie', 'type', 'forme', 'stade', 'phase', 'niveau',
    'avec', 'sans', 'dans', 'pour', 'chez', 'depuis', 'sous', 'vers',
    'traitement', 'patient', 'diagnostic', 'symptomes', 'signes',
    'aigu', 'aigue', 'chronique', 'primaire', 'secondaire',
    'mg', 'ml', 'g', 'kg', 'mcg', 'ui', 'mmol', 'mol',
    'jour', 'fois', 'heure', 'heures', 'semaine', 'mois',
    'gelule', 'gelules', 'comprime', 'comprimes', 'sachet', 'sachets',
    'solution', 'suspension', 'injectable', 'oral', 'orale',
    'sirop', 'pommade', 'creme', 'gel', 'patch', 'spray',
    'ampoule', 'ampoules', 'flacon', 'flacons', 'boite', 'boites',
    // Pharma-specific stopwords (overly generic terms that link everything)
    'effets', 'indesirables', 'contre', 'indication', 'indications',
    'posologie', 'mecanisme', 'action', 'clinique', 'biologique',
    'medicament', 'medicaments', 'therapeutique', 'therapeutiques',
    'voie', 'administration', 'dose', 'doses', 'risque', 'risques',
    'surveillance', 'prevention', 'prise', 'charge', 'evolution',
    'examen', 'examens', 'bilan', 'resultats', 'normal', 'normaux',
    'augmentation', 'diminution', 'reduction', 'elevation'
]);

// Extract single-word tokens
function tokenize(text: string): string[] {
    return text.toLowerCase()
        .replace(/[^a-zàâäéèêëïîôùûüç0-9\s]/gi, '')
        .split(/\s+/)
        .filter(w => w.length >= 3 && !STATIC_STOPWORDS.has(w));
}

// ===========================================
// N-GRAM EXTRACTION (2-3 word phrases)
// ===========================================
function extractNgrams(text: string, minN = 2, maxN = 3): string[] {
    const words = text.toLowerCase()
        .replace(/[^a-zàâäéèêëïîôùûüç0-9\s]/gi, '')
        .split(/\s+/)
        .filter(w => w.length >= 3);

    const ngrams: string[] = [];
    for (let n = minN; n <= maxN; n++) {
        for (let i = 0; i <= words.length - n; i++) {
            const gram = words.slice(i, i + n).join(' ');
            // Skip n-grams made entirely of stopwords
            const nonStop = words.slice(i, i + n).filter(w => !STATIC_STOPWORDS.has(w));
            if (nonStop.length >= Math.ceil(n / 2)) {
                ngrams.push(gram);
            }
        }
    }
    return ngrams;
}

// ===========================================
// UNION-FIND for tag domain clustering
// ===========================================
class UnionFind {
    private parent = new Map<string, string>();
    private rank = new Map<string, number>();

    find(x: string): string {
        if (!this.parent.has(x)) {
            this.parent.set(x, x);
            this.rank.set(x, 0);
        }
        if (this.parent.get(x) !== x) {
            this.parent.set(x, this.find(this.parent.get(x)!));
        }
        return this.parent.get(x)!;
    }

    union(a: string, b: string): void {
        const ra = this.find(a);
        const rb = this.find(b);
        if (ra === rb) return;
        const rankA = this.rank.get(ra) || 0;
        const rankB = this.rank.get(rb) || 0;
        if (rankA < rankB) { this.parent.set(ra, rb); }
        else if (rankA > rankB) { this.parent.set(rb, ra); }
        else { this.parent.set(rb, ra); this.rank.set(ra, rankA + 1); }
    }

    connected(a: string, b: string): boolean {
        return this.find(a) === this.find(b);
    }
}

// ===========================================
// FEEDBACK HELPERS (with temporal decay + toxic keywords)
// ===========================================
const DECAY_HALF_LIFE_MS = 90 * 24 * 60 * 60 * 1000; // 90 days

function decayFactor(timestamp: number): number {
    const ageMs = Date.now() - (timestamp || Date.now());
    if (ageMs <= 0) return 1.0;
    return Math.pow(0.5, ageMs / DECAY_HALF_LIFE_MS);
}

function computeFeedbackAdjustment(
    feedback: FeedbackData | undefined,
    typeA: string,
    typeB: string,
    sharedTags: string[],
    keywords: string[]
): number {
    if (!feedback) return 0;

    const typePair = [typeA, typeB].sort().join('|');
    let adjustment = feedback.typePairScores[typePair] || 0;

    // Check negative patterns (with temporal decay)
    for (const pattern of feedback.negativePatterns) {
        if (pattern.typePair !== typePair) continue;
        const tagOverlap = pattern.sharedTags.filter(t => sharedTags.includes(t)).length;
        const kwOverlap = pattern.keywords.filter(k => keywords.includes(k)).length;
        const similarity = (tagOverlap * 2 + kwOverlap) / Math.max(1, pattern.sharedTags.length * 2 + pattern.keywords.length);
        if (similarity > 0.5) {
            const decay = decayFactor(pattern.lastSeen);
            adjustment -= 0.1 * Math.min(pattern.count, 5) * decay;
        }
    }

    // Check positive patterns (with temporal decay)
    for (const pattern of feedback.positivePatterns) {
        if (pattern.typePair !== typePair) continue;
        const tagOverlap = pattern.sharedTags.filter(t => sharedTags.includes(t)).length;
        const kwOverlap = pattern.keywords.filter(k => keywords.includes(k)).length;
        const similarity = (tagOverlap * 2 + kwOverlap) / Math.max(1, pattern.sharedTags.length * 2 + pattern.keywords.length);
        if (similarity > 0.4) {
            const decay = decayFactor(pattern.lastSeen);
            adjustment += 0.06 * Math.min(pattern.count, 5) * decay;
        }
    }

    // Toxic keyword penalty
    if (feedback.toxicKeywords) {
        for (const kw of keywords) {
            const toxicCount = feedback.toxicKeywords[kw] || 0;
            if (toxicCount >= 3) {
                adjustment -= 0.1 * Math.min(toxicCount, 5);
            } else if (toxicCount >= 1) {
                adjustment -= 0.03 * toxicCount;
            }
        }
    }

    return Math.max(-0.5, Math.min(0.3, adjustment));
}


self.onmessage = (e: MessageEvent<WorkerInput | Card[]>) => {
    let cards: Card[];
    let abbreviations: Record<string, string[]> = {};
    let changedIds: string[] | undefined;
    let existingLinks: Link[] | undefined;
    let feedback: FeedbackData | undefined;

    if (Array.isArray(e.data)) {
        cards = e.data;
    } else {
        cards = e.data.cards;
        abbreviations = e.data.abbreviations || {};
        changedIds = e.data.changedIds;
        existingLinks = e.data.existingLinks;
        feedback = e.data.feedback;
    }

    const linkSet = new Set<string>();
    const links: Link[] = [];
    const cardMap = new Map(cards.map(c => [c.id, c]));
    const totalDocs = cards.length;

    // ===========================================
    // PHASE 0: INCREMENTAL - Reuse unchanged links
    // ===========================================
    if (changedIds && changedIds.length > 0 && existingLinks && existingLinks.length > 0) {
        const changedSet = new Set(changedIds);
        for (const link of existingLinks) {
            if (!changedSet.has(link.source) && !changedSet.has(link.target)) {
                if (cardMap.has(link.source) && cardMap.has(link.target)) {
                    const linkKey = [link.source, link.target].sort().join('-');
                    if (!linkSet.has(linkKey)) {
                        linkSet.add(linkKey);
                        links.push(link);
                    }
                }
            }
        }
    }

    // ===========================================
    // PHASE 0b: TAG DOMAIN CLUSTERING
    // ===========================================
    const tagCardCount = new Map<string, number>();

    cards.forEach(card => {
        const seen = new Set<string>();
        card.tags.forEach(tag => {
            const t = tag.toLowerCase().trim();
            if (t.length >= 3 && !seen.has(t)) {
                seen.add(t);
                tagCardCount.set(t, (tagCardCount.get(t) || 0) + 1);
            }
        });
    });

    const megaTags = new Set<string>();
    tagCardCount.forEach((count, tag) => {
        if (count / totalDocs > 0.12) megaTags.add(tag);
    });

    const uf = new UnionFind();
    cards.forEach(card => {
        const validTags = card.tags
            .map(t => t.toLowerCase().trim())
            .filter(t => t.length >= 3 && !megaTags.has(t));
        for (let i = 1; i < validTags.length; i++) {
            uf.union(validTags[0], validTags[i]);
        }
    });

    const sharesDomain = (cardA: Card, cardB: Card): boolean => {
        const tagsA = cardA.tags.map(t => t.toLowerCase().trim()).filter(t => t.length >= 3 && !megaTags.has(t));
        const tagsB = cardB.tags.map(t => t.toLowerCase().trim()).filter(t => t.length >= 3 && !megaTags.has(t));
        if (tagsA.length === 0 || tagsB.length === 0) return true;
        for (const a of tagsA) {
            for (const b of tagsB) {
                if (a === b || uf.connected(a, b)) return true;
            }
        }
        return false;
    };

    // Helper: get shared tags between two cards (for feedback)
    const getSharedTags = (cardA: Card, cardB: Card): string[] => {
        const tagsA = new Set(cardA.tags.map(t => t.toLowerCase().trim()));
        return cardB.tags.map(t => t.toLowerCase().trim()).filter(t => tagsA.has(t));
    };

    // ===========================================
    // PHASE 0c: ABBREVIATION EXPANSION INDEX
    // ===========================================
    const abbrToExpansions = new Map<string, Set<string>>();
    const expansionToAbbr = new Map<string, Set<string>>();

    if (abbreviations && Object.keys(abbreviations).length > 0) {
        for (const [abbr, expansions] of Object.entries(abbreviations)) {
            const abbrLower = abbr.toLowerCase().trim();
            if (abbrLower.length < 2) continue;
            const expansionTokens = new Set<string>();
            for (const exp of expansions) {
                for (const token of tokenize(exp)) {
                    expansionTokens.add(token);
                    if (!expansionToAbbr.has(token)) expansionToAbbr.set(token, new Set());
                    expansionToAbbr.get(token)!.add(abbrLower);
                }
            }
            abbrToExpansions.set(abbrLower, expansionTokens);
        }
    }

    // ===========================================
    // PHASE 1: TF-IDF ANALYSIS & DYNAMIC STOPWORDS
    // ===========================================
    const docFrequencies = new Map<string, number>();

    cards.forEach(card => {
        const uniqueWords = new Set([
            ...tokenize(card.title),
            ...tokenize(card.content),
            ...tokenize(card.tags.join(' '))
        ]);
        uniqueWords.forEach(word => {
            docFrequencies.set(word, (docFrequencies.get(word) || 0) + 1);
        });
    });

    const wordIDF = new Map<string, number>();
    const DYNAMIC_STOPWORDS = new Set<string>();

    // Adaptive threshold: at least 15% of docs OR 3 docs (whichever is larger)
    // This prevents instability with small corpora
    const stopwordThreshold = Math.max(0.15, 3 / totalDocs);

    docFrequencies.forEach((count, word) => {
        const frequency = count / totalDocs;
        if (frequency > stopwordThreshold) {
            DYNAMIC_STOPWORDS.add(word);
            wordIDF.set(word, 0);
        } else {
            wordIDF.set(word, Math.log(totalDocs / (count || 1)));
        }
    });

    const getWeight = (word: string) => wordIDF.get(word) || 0;

    // ===========================================
    // PHASE 2: INVERTED INDEX (unigrams + n-grams)
    // ===========================================
    const titleIndex = new Map<string, string[]>();
    const tagIndex = new Map<string, string[]>();
    const titleInfoContent = new Map<string, number>();

    // N-gram index for multi-word matching
    const ngramIndex = new Map<string, string[]>();
    // N-gram IDF: computed from document frequency of each n-gram
    const ngramDocFreq = new Map<string, number>();

    // First pass: count n-gram document frequencies
    cards.forEach(card => {
        const titleNgrams = new Set(extractNgrams(card.title));
        titleNgrams.forEach(ng => {
            ngramDocFreq.set(ng, (ngramDocFreq.get(ng) || 0) + 1);
        });
    });

    // Second pass: build indices
    cards.forEach(card => {
        // Unigram index (existing)
        const titleTokens = tokenize(card.title).filter(w => !DYNAMIC_STOPWORDS.has(w));
        let infoSum = 0;

        titleTokens.forEach(token => {
            if (!titleIndex.has(token)) titleIndex.set(token, []);
            titleIndex.get(token)!.push(card.id);
            infoSum += getWeight(token);
        });

        // Abbreviation expansion index
        titleTokens.forEach(token => {
            const abbrKeys = expansionToAbbr.get(token);
            if (abbrKeys) {
                abbrKeys.forEach(abbrKey => {
                    if (!titleIndex.has(abbrKey)) titleIndex.set(abbrKey, []);
                    titleIndex.get(abbrKey)!.push(card.id);
                });
            }
        });

        // N-gram index: index title n-grams
        const titleNgrams = extractNgrams(card.title);
        titleNgrams.forEach(ng => {
            if (!ngramIndex.has(ng)) ngramIndex.set(ng, []);
            ngramIndex.get(ng)!.push(card.id);
        });

        titleInfoContent.set(card.id, Math.max(1.0, infoSum));

        // Tag index
        card.tags.forEach(tag => {
            const tagLower = tag.toLowerCase();
            if (tagLower.length >= 4) {
                if (!tagIndex.has(tagLower)) tagIndex.set(tagLower, []);
                tagIndex.get(tagLower)!.push(card.id);
            }
        });
    });

    // Veto set for hard constraints (instant lookup)
    const vetoSet = new Set(feedback?.vetoPairs || []);

    // CALIBRATED addLink: combines type compat × feedback × toxic keywords
    const addLink = (sourceId: string, targetId: string, rawValue: number, reason: string) => {
        if (sourceId === targetId) return;
        const linkKey = [sourceId, targetId].sort().join('-');
        if (linkSet.has(linkKey)) return;

        // HARD CONSTRAINT: check veto (never re-suggest)
        const vetoKey = [sourceId, targetId].sort().join('|');
        if (vetoSet.has(vetoKey)) return;

        const sourceCard = cardMap.get(sourceId);
        const targetCard = cardMap.get(targetId);
        if (!sourceCard || !targetCard) return;

        // === CALIBRATED COMPOSITE SCORE ===
        // Signal 1: Type compatibility (0.6 – 1.5) with EXPONENTIAL scaling
        // Incompatible (0.6) → 0.46, Compatible (1.5) → 1.84
        const typeRaw = getTypeCompat(sourceCard.type, targetCard.type);
        const typeMultiplier = Math.pow(typeRaw, 1.5);

        // Signal 2: Feedback adjustment (-0.5 to +0.3)
        const sharedTags = getSharedTags(sourceCard, targetCard);
        const keywords = tokenize(sourceCard.title + ' ' + targetCard.title).slice(0, 6);
        const feedbackAdj = feedback
            ? computeFeedbackAdjustment(feedback, sourceCard.type, targetCard.type, sharedTags, keywords)
            : 0;

        // Signal 3: Domain bonus (+0.1 if same domain)
        const domainBonus = sharesDomain(sourceCard, targetCard) ? 0.1 : 0;

        // Composite: base × type^1.5 + feedback + domain
        let calibratedScore = (rawValue * typeMultiplier) + feedbackAdj + domainBonus;

        // Clamp to [0.05, 1.0]
        calibratedScore = Math.max(0.05, Math.min(1.0, calibratedScore));

        // Enrich reason with confidence + type label
        let quality: 'boost' | 'match' | 'weak' | undefined;
        if (typeMultiplier >= 1.4) quality = 'boost';
        else if (typeMultiplier >= 1.1) quality = 'match';
        else if (typeMultiplier <= 0.7) quality = 'weak';

        linkSet.add(linkKey);
        links.push({ source: sourceId, target: targetId, value: calibratedScore, reason, quality });
    };

    // ===========================================
    // PHASE 3: LINKING LOGIC (unigrams + n-grams)
    // ===========================================
    const changedSet = changedIds ? new Set(changedIds) : null;

    cards.forEach(card => {
        if (changedSet && !changedSet.has(card.id)) return;

        // --- Unigram matching (existing) ---
        let contentTokens = tokenize(card.content + ' ' + card.details)
            .filter(w => !DYNAMIC_STOPWORDS.has(w));

        // Abbreviation expansion
        const expandedTokens: string[] = [];
        contentTokens.forEach(token => {
            const expansions = abbrToExpansions.get(token);
            if (expansions) {
                expansions.forEach(exp => {
                    if (!DYNAMIC_STOPWORDS.has(exp)) expandedTokens.push(exp);
                });
            }
        });
        contentTokens = [...contentTokens, ...expandedTokens];

        const potentialMatches = new Map<string, { score: number; matchCount: number; keywords: string[] }>();

        contentTokens.forEach(token => {
            const matchingCardIds = titleIndex.get(token);
            if (matchingCardIds) {
                const weight = getWeight(token);
                matchingCardIds.forEach(targetId => {
                    if (targetId === card.id) return;
                    const current = potentialMatches.get(targetId) || { score: 0, matchCount: 0, keywords: [] };
                    current.score += weight;
                    current.matchCount += 1;
                    if (!current.keywords.includes(token)) current.keywords.push(token);
                    potentialMatches.set(targetId, current);
                });
            }
        });

        // --- N-gram matching (NEW) ---
        const contentNgrams = extractNgrams(card.content + ' ' + card.details);
        contentNgrams.forEach(ng => {
            const matchingCardIds = ngramIndex.get(ng);
            if (matchingCardIds) {
                // N-gram IDF: log(N / df) * 1.5 bonus for multi-word specificity
                const df = ngramDocFreq.get(ng) || 1;
                const ngramWeight = Math.log(totalDocs / df) * 1.5;

                matchingCardIds.forEach(targetId => {
                    if (targetId === card.id) return;
                    const current = potentialMatches.get(targetId) || { score: 0, matchCount: 0, keywords: [] };
                    current.score += ngramWeight;
                    current.matchCount += 1;
                    if (!current.keywords.includes(ng)) current.keywords.push(`"${ng}"`);
                    potentialMatches.set(targetId, current);
                });
            }
        });

        // Validation & link creation
        potentialMatches.forEach(({ score, matchCount, keywords }, targetId) => {
            if (matchCount < 2) return;

            const targetCard = cardMap.get(targetId);
            const targetTitle = targetCard ? targetCard.title : targetId;
            const normalizedScore = Math.min(score / 5.0, 1.0);

            // Raised threshold from 2.5 to 3.5 to reduce noise in small corpora
            if (score >= 3.5) {
                if (score < 5.0) {
                    if (targetCard && !sharesDomain(card, targetCard)) return;
                }
                const reason = `Mots clés: ${keywords.slice(0, 4).join(', ')} → ${targetTitle}`;
                addLink(card.id, targetId, normalizedScore, reason);
                return;
            }

            const targetInfo = titleInfoContent.get(targetId) || 1.0;
            const threshold = Math.max(2.0, targetInfo * 0.35);

            if (score >= threshold) {
                if (targetCard && !sharesDomain(card, targetCard)) return;
                const reason = `Mots clés: ${keywords.slice(0, 4).join(', ')} → ${targetTitle}`;
                addLink(card.id, targetId, normalizedScore, reason);
            }
        });

        // Tag matching
        card.tags.forEach(tag => {
            const tagLower = tag.toLowerCase().trim();
            if (tagLower.length >= 6) {
                titleIndex.forEach((cardIds, titleKw) => {
                    if (titleKw === tagLower) {
                        cardIds.forEach(targetId => {
                            const targetCard = cardMap.get(targetId);
                            addLink(card.id, targetId, 0.7, `Tag "${tag}" → ${targetCard?.title || targetId}`);
                        });
                    }
                });
            }
        });

        // Title -> Tag
        const titleTokens = tokenize(card.title);
        titleTokens.forEach(kw => {
            if (kw.length < 6) return;
            tagIndex.forEach((cardIds, tagTerm) => {
                if (tagTerm === kw) {
                    cardIds.forEach(targetId => {
                        const targetCard = cardMap.get(targetId);
                        addLink(card.id, targetId, 0.7, `Titre "${card.title}" ↔ tag "${tagTerm}" de ${targetCard?.title || targetId}`);
                    });
                }
            });
        });
    });

    // PHASE 4: TRANSITIVE LINKS — REMOVED
    // Transitive links (A→B + B→C = A→C) were creating false associations
    // in pharma context (e.g., Drug→Symptom + Disease→Symptom ≠ Drug→Disease).
    // Users can visually deduce paths via intermediate nodes in the graph.

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
