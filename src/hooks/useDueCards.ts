import { useMemo } from 'react';
import type { Card } from '../types';

export function useDueCards(cards: Card[]) {
    return useMemo(() => {
        const nowTs = Date.now();
        const dueCards = cards.filter((c) =>
            (c.progress?.status === 'review' || c.progress?.status === 'learning' || c.progress?.status === 'relearning') &&
            c.progress.dueDate &&
            new Date(c.progress.dueDate).getTime() <= nowTs
        );
        const learningCards = cards.filter((c) => c.progress?.status === 'learning' || c.progress?.status === 'relearning');
        const newCards = cards.filter((c) => !c.progress || c.progress.status === 'new');
        
        return {
            dueCards,
            learningCards,
            newCards,
            totalToReview: dueCards.length,
        };
    }, [cards]);
}
