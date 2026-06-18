import re

with open('src/synthesisService.ts', 'r') as f:
    content = f.read()

new_func = """export function generateSearchSynthesis(
    query: string,
    matchedCards: Card[],
    allCards: Card[] = [] // Optional for backward compatibility, but needed for Graph-RAG
): { title: string; points: { text: string; source: { id: string; title: string, type: string } }[]; sources: string[]; keywords: string[] } | null {
    if (matchedCards.length === 0) return null;

    const normalizedQuery = query.toLowerCase().trim();
    // Expand query: "DT1" -> ["dt1", "diabete type 1", "did"]
    const expandedQueries = expandMedicalQuery(normalizedQuery);

    const relevantCards = matchedCards;

    let sortedCards = [...relevantCards];
    const exactMatchIndex = sortedCards.findIndex(c => c.title.toLowerCase() === normalizedQuery);

    if (exactMatchIndex !== -1) {
        const exact = sortedCards.splice(exactMatchIndex, 1)[0];
        sortedCards.unshift(exact);
    } else {
        const startsWithIndex = sortedCards.findIndex(c => c.title.toLowerCase().startsWith(normalizedQuery));
        if (startsWithIndex !== -1) {
            const start = sortedCards.splice(startsWithIndex, 1)[0];
            sortedCards.unshift(start);
        }
    }

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

    let directLinkReason: string | null = null;
    let directLinkSource: { id: string, title: string, type: string } | null = null;

    if (sortedCards.length >= 2) {
        const c1 = sortedCards[0];
        const c2 = sortedCards[1];

        if (c1.manualConnections?.includes(c2.id)) {
            directLinkReason = `Connexion forte : le concept **${c1.title}** est directement lié à **${c2.title}**.`;
            directLinkSource = { id: c1.id, title: "Relation Sémantique", type: "relation" };
        }
        else if (c2.manualConnections?.includes(c1.id)) {
            directLinkReason = `Connexion forte : le concept **${c2.title}** est directement lié à **${c1.title}**.`;
            directLinkSource = { id: c2.id, title: "Relation Sémantique", type: "relation" };
        }
    }

    const topCards = sortedCards.slice(0, 6);

    let points: { text: string; source: { id: string; title: string, type: string } }[] = [];

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
            const segmenter = new Intl.Segmenter('fr', { granularity: 'sentence' });
            const segments = segmenter.segment(content);

            const sentences = Array.from(segments)
                .map(s => s.segment.trim().replace(/^[-*#\\s]+/, '')) // remove markdown list/headers
                .filter(s => s.length > 20);

            let bestScore = -1;

            sentences.forEach(s => {
                const lower = s.toLowerCase();
                let score = 0;

                const hasTerm = expandedQueries.some(q => lower.includes(q));
                if (hasTerm) score += 10;

                if (lower.includes('est un') || lower.includes('est une') || lower.includes('se définit')) {
                    score += 5;
                }
                
                // Bonus based on card type
                if (card.type === 'drug' && (lower.includes('indiqué') || lower.includes('traitement') || lower.includes('classe'))) {
                    score += 5;
                } else if (card.type === 'pathology' && (lower.includes('maladie') || lower.includes('syndrome') || lower.includes('caractérisé'))) {
                    score += 5;
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
            
            // Format intelligent based on type
            if (card.type === 'drug') {
               cleanPoint = `**${card.title}** : ` + cleanPoint;
            } else if (card.type === 'pathology') {
               cleanPoint = `**${card.title}** : ` + cleanPoint;
            } else {
               cleanPoint = cleanPoint; // default
            }

            if (cleanPoint.length > 180) cleanPoint = cleanPoint.slice(0, 180) + '...';

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
        title: 'Synthèse sémantique',
        points: points.slice(0, 6),
        sources: sources,
        keywords: expandedQueries
    };
}"""

# Extract the old function signature and body and replace it.
import re

pattern = re.compile(r'export function generateSearchSynthesis\(.*?\}\n', re.DOTALL)
content = re.sub(pattern, new_func + '\n', content, count=1)

with open('src/synthesisService.ts', 'w') as f:
    f.write(content)

