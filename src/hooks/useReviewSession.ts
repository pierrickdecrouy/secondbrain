import { useState, useMemo, useCallback } from 'react';
import type { Card } from '../types';
import { useUIStore } from '../store/useUIStore';

export function useReviewSession(cards: Card[]) {
    const { setActiveSection } = useUIStore();
    const [reviewSession, setReviewSession] = useState<{ cardIds: string[]; title: string } | null>(null);

    const reviewSessionCards = useMemo(() => {
        if (!reviewSession) return [];
        const idSet = new Set(reviewSession.cardIds);
        return cards.filter((card) => idSet.has(card.id));
    }, [cards, reviewSession]);

    const startFSRSReview = useCallback(() => {
        const now = Date.now();
        const dueCards = cards.filter((card) => {
            const dueDate = card.progress?.dueDate ? new Date(card.progress.dueDate).getTime() : 0;
            if (!card.progress) return false;
            if (card.progress.status === 'learning' || card.progress.status === 'review') {
                return dueDate <= now;
            }
            return false;
        });
        const fallback = dueCards.length > 0 ? dueCards : cards.slice(0, 20);
        setReviewSession({
            cardIds: fallback.map((c) => c.id),
            title: dueCards.length > 0 ? 'Révision planifiée (FSRS)' : 'Session découverte',
        });
        setActiveSection('cards');
    }, [cards, setActiveSection]);

    const startIntensiveReview = useCallback(() => {
        // Shuffle all workspace cards
        const shuffled = [...cards].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, Math.min(30, shuffled.length));
        setReviewSession({
            cardIds: selected.map((c) => c.id),
            title: 'Bachotage Intensif',
        });
        setActiveSection('cards');
    }, [cards, setActiveSection]);

    return {
        reviewSession,
        setReviewSession,
        reviewSessionCards,
        startFSRSReview,
        startIntensiveReview,
    };
}
