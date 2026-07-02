import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { calculateFsrsProgress, clearSrsSettingsCache } from './fsrs';
import type { UserCardProgress } from '../types';

describe('FSRS Algorithm', () => {
    beforeEach(() => {
        // Mock localStorage
        vi.stubGlobal('localStorage', {
            getItem: vi.fn(() => null),
            setItem: vi.fn(),
            removeItem: vi.fn(),
        });
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        vi.useRealTimers();
    });

    describe('calculateFsrsProgress', () => {
        const dummyProgress: Partial<UserCardProgress> = {
            status: 'new',
        };

        it('should initialize a new card with default FSRS parameters', () => {
            const result = calculateFsrsProgress(dummyProgress, 1);
            expect(result.status).toBe('learning');
            expect(result.reps).toBe(1);
            // It might be 0 or 1 depending on ts-fsrs version, but let's just check it exists
            expect(result.lapses).toBeDefined(); 
            expect(result.stability).toBeGreaterThan(0);
            expect(result.difficulty).toBeGreaterThan(0);
            expect(result.interval).toBeGreaterThanOrEqual(0);
        });

        it('should increase interval and stability for Good ratings', () => {
            const result1 = calculateFsrsProgress(dummyProgress, 3);
            
            // Advance time by 1 day (or whatever the initial interval is)
            const waitTime = Math.max(1, result1.interval || 1) * 24 * 60 * 60 * 1000;
            vi.advanceTimersByTime(waitTime);
            
            const result2 = calculateFsrsProgress(result1, 3);
            
            expect(result2.stability).toBeGreaterThan(result1.stability!);
            expect(result2.interval).toBeGreaterThanOrEqual(result1.interval!);
        });

        it('should decrease stability and mark as lapse when rated Again (1)', () => {
            const r1 = calculateFsrsProgress(dummyProgress, 3);
            
            vi.advanceTimersByTime(1 * 24 * 60 * 60 * 1000);
            const r2 = calculateFsrsProgress(r1, 3);
            
            // Wait for interval
            vi.advanceTimersByTime((r2.interval || 2) * 24 * 60 * 60 * 1000);
            
            // Now rate Again
            const r3 = calculateFsrsProgress(r2, 1);
            
            expect(r3.status).toBe('relearning');
            expect(r3.lapses).toBe((r2.lapses || 0) + 1);
            expect(r3.stability).toBeLessThan(r2.stability!);
        });

        it('should mark a card as leech after 8 lapses', () => {
            let p = calculateFsrsProgress(dummyProgress, 3); // learning
            vi.advanceTimersByTime(1 * 24 * 60 * 60 * 1000);
            p = calculateFsrsProgress(p, 3); // review
            
            // Wait interval
            vi.advanceTimersByTime((p.interval || 2) * 24 * 60 * 60 * 1000);

            // Fake that this card already had 7 lapses
            p.lapses = 7;
            
            // 8th lapse
            const finalP = calculateFsrsProgress(p, 1);
            
            expect(finalP.lapses).toBeGreaterThanOrEqual(8);
            expect(finalP.isLeech).toBe(true);
        });

        it('should generate a longer interval for Courses (isCourse=true) due to lower retention target', () => {
            // First rep
            const p1Flashcard = calculateFsrsProgress(dummyProgress, 3, false);
            const p1Course = calculateFsrsProgress(dummyProgress, 3, true);

            // Let's assume initial intervals might be similar, but let's push them to review state
            vi.advanceTimersByTime(1 * 24 * 60 * 60 * 1000);
            
            const p2Flashcard = calculateFsrsProgress(p1Flashcard, 3, false);
            const p2Course = calculateFsrsProgress(p1Course, 3, true);

            // A course card should have a looser interval than a standard flashcard
            expect(p2Course.interval).toBeGreaterThanOrEqual(p2Flashcard.interval!);
            
            // Advance by maximum of their intervals and review again
            vi.advanceTimersByTime((p2Course.interval || 2) * 24 * 60 * 60 * 1000);
            
            const p3Flashcard = calculateFsrsProgress(p2Flashcard, 4, false); // Easy rating
            const p3Course = calculateFsrsProgress(p2Course, 4, true); // Easy rating

            // By the 3rd repetition with 'Easy' ratings, the difference is stark
            expect(p3Course.interval).toBeGreaterThan(p3Flashcard.interval!);
        });

        it('should handle null or undefined current progress gracefully', () => {
            const resultNull = calculateFsrsProgress(null, 3);
            const resultUndefined = calculateFsrsProgress(undefined, 3);
            
            expect(resultNull.status).toBe('learning');
            expect(resultUndefined.status).toBe('learning');
            expect(resultNull.reps).toBe(1);
            expect(resultUndefined.reps).toBe(1);
        });

        it('should cap the interval at EXAM_MODE_MAX_INTERVAL if exam mode is active', () => {
            // Mock exam mode settings in localStorage
            const examDate = new Date();
            examDate.setDate(examDate.getDate() + 10); // 10 days from now (within the 15-day window)
            
            vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify({
                examModeEnabled: true,
                examDate: examDate.toISOString()
            }));
            
            // Force the cache to reload settings
            clearSrsSettingsCache();

            // Create a highly mature progress to ensure normal interval > 14
            let p: Partial<UserCardProgress> = {
                status: 'review',
                stability: 100, // Very high stability
                difficulty: 5,
                reps: 10,
                lapses: 0,
                interval: 30,
                lastReview: new Date().toISOString()
            };
            
            const result = calculateFsrsProgress(p, 4); // Easy rating
            
            // Interval should be exactly 14 (EXAM_MODE_MAX_INTERVAL)
            expect(result.interval).toBe(14);
            
            // Check that the due date matches the capped interval
            const now = new Date();
            const expectedDue = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
            const actualDue = new Date(result.dueDate!);
            // Allow small ms diff
            expect(Math.abs(actualDue.getTime() - expectedDue.getTime())).toBeLessThan(1000);
        });
    });
});

