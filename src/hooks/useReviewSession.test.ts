import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useReviewSession } from './useReviewSession';
import { useReviewStore } from '../store/useReviewStore';

// Mock Firebase
vi.mock('../lib/firebase', () => ({
    auth: { currentUser: { uid: 'user1' } }
}));

// Mock loadSrsSettings
vi.mock('../components/settings/RevisionTab', () => ({
    loadSrsSettings: vi.fn(() => ({ maxNewCardsPerSession: 10 }))
}));

describe('useReviewSession', () => {
    beforeEach(() => {
        useReviewStore.getState().setReviewSession(null);
        vi.clearAllMocks();
    });

    describe('startCourseReview', () => {
        it('should extract flashcards deeply nested in concepts (Course -> Concept -> Flashcard)', () => {
            const mockCards = [
                { id: 'course1', nodeType: 'course', type: 'course', title: 'Cours 1' },
                { id: 'concept1', nodeType: 'concept', type: 'concept', parentId: 'course1', title: 'Concept 1' },
                { id: 'flashcard1', nodeType: 'flashcard', type: 'concept', parentId: 'concept1', title: 'Flashcard 1' },
                { id: 'flashcard2', nodeType: 'flashcard', type: 'concept', parentId: 'course1', title: 'Flashcard 2 (direct)' },
                { id: 'otherCourse', nodeType: 'course', type: 'course', title: 'Cours 2' },
                { id: 'otherFlashcard', nodeType: 'flashcard', type: 'concept', parentId: 'otherCourse', title: 'Flashcard 3' },
            ] as any[];

            const { result } = renderHook(() => useReviewSession(mockCards));

            act(() => {
                result.current.startCourseReview('course1', 'Review Cours 1');
            });

            const session = useReviewStore.getState().reviewSession;
            expect(session).toBeDefined();
            expect(session?.title).toBe('Review Cours 1');
            
            // Should contain flashcard1 (nested) and flashcard2 (direct), but not otherFlashcard
            expect(session?.cardIds).toHaveLength(2);
            expect(session?.cardIds).toContain('flashcard1');
            expect(session?.cardIds).toContain('flashcard2');
        });

        it('should do nothing if no flashcards are found', () => {
            const mockCards = [
                { id: 'course1', nodeType: 'course', type: 'course', title: 'Cours 1' },
                { id: 'concept1', nodeType: 'concept', type: 'concept', parentId: 'course1', title: 'Concept 1' },
            ] as any[];

            const { result } = renderHook(() => useReviewSession(mockCards));

            act(() => {
                result.current.startCourseReview('course1', 'Review Cours 1');
            });

            const session = useReviewStore.getState().reviewSession;
            expect(session).toBeNull();
        });
    });

    describe('reviewSessionCards (Memo)', () => {
        it('should filter cards based on reviewSession and ownership', () => {
            const mockCards = [
                { id: 'f1', ownerUid: 'user1' },
                { id: 'f2', ownerUid: 'user1' },
                { id: 'f3', ownerUid: 'otherUser' }, // Should be excluded
                { id: 'f4', ownerUid: null }, // Offline card, should be included
            ] as any[];

            const { result } = renderHook(() => useReviewSession(mockCards));

            // Manually set a session
            act(() => {
                useReviewStore.getState().setReviewSession({
                    title: 'Test',
                    cardIds: ['f1', 'f3', 'f4']
                });
            });

            expect(result.current.reviewSessionCards).toHaveLength(2);
            expect(result.current.reviewSessionCards.map(c => c.id)).toContain('f1');
            expect(result.current.reviewSessionCards.map(c => c.id)).toContain('f4');
            expect(result.current.reviewSessionCards.map(c => c.id)).not.toContain('f3');
        });
    });
});
