import { useEffect } from 'react';
import { useUIStore } from '../store/useUIStore';
import { useCardStore } from '../store/useCardStore';
import { scheduleLocalNotification } from '../lib/notifications';

export function useAppEffects() {
    const { hasCompletedOnboarding, completeOnboarding } = useUIStore();
    const { cards } = useCardStore();

    // Auto-complete onboarding if the user already has cards (e.g. connected on a new device)
    useEffect(() => {
        if (!hasCompletedOnboarding && cards.length > 0) {
            completeOnboarding();
        }
    }, [cards.length, hasCompletedOnboarding, completeOnboarding]);

    // Check due cards for local notification
    useEffect(() => {
        if (!hasCompletedOnboarding) return;
        
        const dueCount = cards.filter(
            (c) =>
                c.progress?.status === "review" &&
                c.progress.dueDate &&
                new Date(c.progress.dueDate) <= new Date()
        ).length;

        if (dueCount > 0) {
            scheduleLocalNotification(
                "Extnd. — Révisions FSRS",
                `Vous avez ${dueCount} fiche${dueCount > 1 ? 's' : ''} à réviser aujourd'hui. Ne perdez pas le fil !`,
                '/review'
            );
        }
    }, [cards, hasCompletedOnboarding]);
}
