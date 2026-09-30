import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ReviewSessionModal } from './ReviewSessionModal';

vi.mock('../hooks/useFocusTrap', () => ({
    useFocusTrap: () => ({ current: null }),
}));

vi.mock('./MarkdownRenderer', () => ({
    MarkdownRenderer: ({ content }: { content: string }) => <div>{content}</div>,
}));

vi.mock('./SessionTimer', () => ({
    SessionTimer: () => <div>Timer</div>,
}));

vi.mock('../context/ThemeContext', () => ({
    useTheme: () => ({ darkMode: false }),
}));

vi.mock('../services/llmService', () => ({
    explainCardConcept: vi.fn(),
}));

describe('ReviewSessionModal', () => {
    it('shows a completion state on the last rated card', () => {
        const onClose = vi.fn();
        const onRate = vi.fn();
        const card = {
            id: 'c1',
            title: 'Question',
            subtitle: '',
            content: 'Réponse',
            details: '',
            type: 'drug',
            nodeType: 'flashcard',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            progress: { status: 'review', dueDate: new Date().toISOString(), difficulty: 5, reps: 1, lapses: 0, stability: 3 },
        } as any;

        render(
            <ReviewSessionModal
                cards={[card]}
                allCards={[card]}
                onClose={onClose}
                onRate={onRate}
            />
        );

        fireEvent.click(screen.getByRole('button', { name: /révéler la réponse/i }));
        fireEvent.click(screen.getByRole('button', { name: /je connais/i }));

        expect(onRate).toHaveBeenCalledWith('c1', 3);
        expect(screen.getByText('Session terminée')).toBeInTheDocument();
    });
});
