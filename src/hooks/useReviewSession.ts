import { useState, useMemo, useCallback } from 'react';
import type { Card } from '../types';
import { useUIStore } from '../store/useUIStore';
import { auth } from '../lib/firebase';
import { loadSrsSettings } from '../components/settings/RevisionTab';

export function useReviewSession(cards: Card[]) {
    // Removed setActiveSection from useUIStore
    const [reviewSession, setReviewSession] = useState<{ cardIds: string[]; title: string; initialIndex?: number } | null>(null);

    const reviewSessionCards = useMemo(() => {
        if (!reviewSession) return [];
        const idSet = new Set(reviewSession.cardIds);
        const currentUid = auth.currentUser?.uid ?? null;
        return cards.filter((card) => {
            if (!idSet.has(card.id)) return false;
            // M-5 fix: only include cards owned by the current user or offline cards (ownerUid === null)
            if (currentUid && card.ownerUid && card.ownerUid !== currentUid) return false;
            return true;
        });
    }, [cards, reviewSession]);


    const startFSRSReview = useCallback((tags?: string[]) => {
        const now = Date.now();
        let dueCards = cards.filter((card) => {
            const dueDate = card.progress?.dueDate ? new Date(card.progress.dueDate).getTime() : 0;
            if (!card.progress) return false;
            if (card.progress.status === 'learning' || card.progress.status === 'review') {
                return dueDate <= now;
            }
            return false;
        });

        // [F-A] Inclure les nouvelles cartes
        let newCards = cards.filter((card) => {
            return !card.progress || card.progress.status === 'new';
        });

        if (tags && tags.length > 0) {
            dueCards = dueCards.filter(c => c.tags && c.tags.some(t => tags.includes(t)));
            newCards = newCards.filter(c => c.tags && c.tags.some(t => tags.includes(t)));
        }
        
        const srsSettings = loadSrsSettings();
        const maxNewCards = srsSettings.maxNewCardsPerSession || 10;
        // Prendre un maximum de nouvelles cartes par session pour ne pas surcharger l'utilisateur
        const selectedNewCards = newCards.slice(0, maxNewCards);
        
        // Interleave due and new cards for better learning (random shuffle)
        const finalCards = [...dueCards, ...selectedNewCards].sort(() => 0.5 - Math.random());
        
        // Si vraiment aucune carte n'est due ni nouvelle, on fallback sur une session de découverte (flashcards en priorité)
        const fallback = finalCards.length > 0 
            ? finalCards 
            : cards.filter(c => c.nodeType === 'flashcard').slice(0, 20);

        setReviewSession({
            cardIds: fallback.map((c) => c.id),
            title: finalCards.length > 0 ? (tags && tags.length > 0 ? `Révision planifiée (${tags.join(', ')})` : 'Révision planifiée (FSRS)') : 'Session découverte',
        });
    }, [cards]);

    const startIntensiveReview = useCallback(() => {
        // Shuffle all workspace cards
        const shuffled = [...cards].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, Math.min(30, shuffled.length));
        setReviewSession({
            cardIds: selected.map((c) => c.id),
            title: 'Bachotage Intensif',
        });
    }, [cards]);

    const startCourseReview = useCallback((courseId: string, title: string) => {
        const flashcards = cards.filter(c => c.nodeType === 'flashcard' && c.parentId === courseId);
        if (flashcards.length === 0) return;
        // Prioritize due cards first, then new ones
        const shuffled = [...flashcards].sort((a, b) => {
            const dueA = a.progress?.dueDate ? new Date(a.progress.dueDate).getTime() : Infinity;
            const dueB = b.progress?.dueDate ? new Date(b.progress.dueDate).getTime() : Infinity;
            return dueA - dueB;
        });
        setReviewSession({
            cardIds: shuffled.map(c => c.id),
            title,
        });
    }, [cards]);

    
    const startCustomReview = useCallback((config: { tags: string[]; types: string[]; statuses: string[]; limit: number | null }) => {
        let flashcards = cards.filter(c => c.nodeType === 'flashcard');
        
        // Filter by types
        if (config.types.length > 0) {
            flashcards = flashcards.filter(c => config.types.includes(c.type));
        }

        // Filter by tags
        if (config.tags.length > 0) {
            // Must have at least one of the tags
            flashcards = flashcards.filter(c => c.tags && c.tags.some(t => config.tags.includes(t)));
        }

        // Filter by status
        if (config.statuses.length > 0) {
            flashcards = flashcards.filter(c => {
                const status = c.progress?.status || 'new';
                return config.statuses.includes(status);
            });
        }

        // Shuffle
        let shuffled = [...flashcards].sort(() => 0.5 - Math.random());
        
        // Apply limit
        if (config.limit !== null && config.limit > 0) {
            shuffled = shuffled.slice(0, config.limit);
        }

        if (shuffled.length === 0) return;

        setReviewSession({
            cardIds: shuffled.map(c => c.id),
            title: 'Deck Personnalisé',
        });
    }, [cards]);

    const startQuizReview = useCallback(() => {
        // Pick 10 random flashcards, prioritizing due/learning ones
        const flashcards = cards.filter(c => c.nodeType === 'flashcard');
        const due = flashcards.filter(c => c.progress?.status === 'review' || c.progress?.status === 'learning');
        const pool = due.length >= 10 ? due : [...due, ...flashcards.filter(c => !due.includes(c))];
        const shuffled = [...pool].sort(() => 0.5 - Math.random()).slice(0, 10);
        setReviewSession({
            cardIds: shuffled.map(c => c.id),
            title: 'Quiz Express',
        });
    }, [cards]);

    return {
        reviewSession,
        setReviewSession,
        reviewSessionCards,
        startFSRSReview,
        startIntensiveReview,
        startCourseReview,
        startQuizReview,
        startCustomReview,
    };
}
