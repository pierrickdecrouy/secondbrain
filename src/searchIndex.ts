import FlexSearch from 'flexsearch';
import type { Card } from './types';

// FlexSearch Document Index for cards
// Using 'any' to avoid TypeScript issues with FlexSearch's complex generics
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const index = new (FlexSearch as any).Document({
    document: {
        id: 'id',
        index: ['title', 'subtitle', 'content', 'details'],
        store: ['id']
    },
    tokenize: 'forward', // Partial matching (e.g., "para" finds "paracetamol")
    charset: 'latin:extra', // French accents support
    optimize: true,
    cache: 100,
});

// Rebuild the entire index with new cards
export function rebuildIndex(cards: Card[]): void {
    // Clear and rebuild - FlexSearch Document doesn't have a clear() method
    // so we re-create by re-adding all cards (add replaces existing)
    cards.forEach(card => {
        index.add({
            id: card.id,
            title: card.title,
            subtitle: card.subtitle,
            content: card.content,
            details: card.details,
        });
    });
}

// Add a single card to the index
export function addToIndex(card: Card): void {
    index.add({
        id: card.id,
        title: card.title,
        subtitle: card.subtitle,
        content: card.content,
        details: card.details,
    });
}

// Remove a card from the index
export function removeFromIndex(cardId: string): void {
    try {
        index.remove(cardId);
    } catch {
        // Ignore if not exists
    }
}

// Search and return matching card IDs
export function searchCards(query: string, limit = 50): string[] {
    if (!query.trim()) return [];

    // FlexSearch Document.search() returns synchronously in this setup
    const results = index.search(query, {
        limit,
        enrich: true,
    });

    // Collect unique IDs from all field results
    const idSet = new Set<string>();
    if (Array.isArray(results)) {
        results.forEach((fieldResult: { field: string; result: { id: string }[] }) => {
            if (fieldResult.result && Array.isArray(fieldResult.result)) {
                fieldResult.result.forEach((item) => {
                    if (typeof item === 'string') {
                        idSet.add(item);
                    } else if (item && typeof item === 'object' && 'id' in item) {
                        idSet.add(item.id);
                    }
                });
            }
        });
    }

    return Array.from(idSet);
}

export { index };
