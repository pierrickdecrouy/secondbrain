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

// Extract significant words (>=3 chars) from a string
function extractKeywords(text: string): string[] {
    return text.toLowerCase()
        .replace(/[^a-zàâäéèêëïîôùûüç0-9\s]/gi, '') // Keep accented chars
        .split(/\s+/)
        .filter(w => w.length >= 3);
}

self.onmessage = (e: MessageEvent<Card[]>) => {
    const cards = e.data;

    // Pre-process each card: extract keywords from title, content, and tags
    const cardData = cards.map(c => ({
        id: c.id,
        title: c.title.toLowerCase(),
        titleKeywords: extractKeywords(c.title),
        contentKeywords: extractKeywords(c.content + ' ' + c.details),
        tagKeywords: c.tags.map(t => t.toLowerCase())
    }));

    const links: Link[] = [];
    const linkSet = new Set<string>(); // Fast duplicate check

    // O(N^2) but offloaded to worker
    for (let i = 0; i < cardData.length; i++) {
        for (let j = i + 1; j < cardData.length; j++) {
            const cardA = cardData[i];
            const cardB = cardData[j];

            let isLinked = false;

            // Link if:
            // 1. Exact title of A appears in content of B (original logic)
            // 2. Exact title of B appears in content of A
            // 3. A keyword from title of A appears in content of B
            // 4. A keyword from title of B appears in content of A
            // 5. Shared tags

            // Check 1 & 2: Exact title inclusion
            if (cardB.contentKeywords.join(' ').includes(cardA.title) ||
                cardA.contentKeywords.join(' ').includes(cardB.title)) {
                isLinked = true;
            }

            // Check 3 & 4: Keyword overlap (title keywords in other's content)
            if (!isLinked) {
                for (const kw of cardA.titleKeywords) {
                    if (kw.length >= 4 && cardB.contentKeywords.some(ckw => ckw.includes(kw))) {
                        isLinked = true;
                        break;
                    }
                }
            }
            if (!isLinked) {
                for (const kw of cardB.titleKeywords) {
                    if (kw.length >= 4 && cardA.contentKeywords.some(ckw => ckw.includes(kw))) {
                        isLinked = true;
                        break;
                    }
                }
            }

            // Check 5: Tag-to-Title matching (SEMANTIC LINKS)
            // If a tag from Card A appears in the TITLE of Card B (or vice versa)
            // Example: Card A tag="diabète" links to Card B title="Diabète Type 1"
            if (!isLinked) {
                for (const tagA of cardA.tagKeywords) {
                    if (tagA.length >= 4 && cardB.titleKeywords.some(tkw => tkw.includes(tagA) || tagA.includes(tkw))) {
                        isLinked = true;
                        break;
                    }
                }
            }
            if (!isLinked) {
                for (const tagB of cardB.tagKeywords) {
                    if (tagB.length >= 4 && cardA.titleKeywords.some(tkw => tkw.includes(tagB) || tagB.includes(tkw))) {
                        isLinked = true;
                        break;
                    }
                }
            }

            if (isLinked) {


                const linkKey = [cardA.id, cardB.id].sort().join('-');
                if (!linkSet.has(linkKey)) {
                    linkSet.add(linkKey);
                    links.push({ source: cardA.id, target: cardB.id });
                }
            }
        }
    }

    const nodes: Node[] = cards.map(c => ({
        id: c.id,
        name: c.title,
        type: c.type
    }));

    self.postMessage({ nodes, links });
};

