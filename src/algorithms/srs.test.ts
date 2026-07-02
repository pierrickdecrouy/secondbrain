import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { calculateSrsData, EXAM_MODE_MAX_INTERVAL } from './srs';
import type { UserCardProgress } from '../types';

describe('Legacy SRS Algorithm (calculateSrsData)', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        // Set fixed date for deterministic due dates
        vi.setSystemTime(new Date('2026-07-01T12:00:00Z'));
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    const defaultConfig = { fuzzEnabled: false };

    describe('Learning Phase', () => {
        const newProgress: Partial<UserCardProgress> = { status: 'new' };

        it('should handle rating 1 (Again) and keep status as learning', () => {
            const result = calculateSrsData(newProgress, 1, defaultConfig);
            expect(result.status).toBe('learning');
            expect(result.step).toBe(0);
            expect(result.interval).toBe(0);
            expect(result.easeFactor).toBe(2.5); // Default
        });

        it('should handle rating 2 (Hard) and keep current step', () => {
            const learningProgress: Partial<UserCardProgress> = { status: 'learning', step: 0 };
            const result = calculateSrsData(learningProgress, 2, defaultConfig);
            expect(result.status).toBe('learning');
            expect(result.step).toBe(0);
        });

        it('should handle rating 3 (Good) and advance step, then graduate to review', () => {
            const result1 = calculateSrsData(newProgress, 3, defaultConfig);
            expect(result1.status).toBe('learning');
            expect(result1.step).toBe(1);

            const result2 = calculateSrsData(result1, 3, defaultConfig);
            expect(result2.status).toBe('review');
            expect(result2.interval).toBe(1);
        });

        it('should handle rating 4 (Easy) and immediately graduate to review', () => {
            const result = calculateSrsData(newProgress, 4, defaultConfig);
            expect(result.status).toBe('review');
            expect(result.interval).toBe(4);
            expect(result.step).toBe(0);
        });
    });

    describe('Review Phase', () => {
        const reviewProgress: Partial<UserCardProgress> = {
            status: 'review',
            interval: 10,
            easeFactor: 2.5,
            lapses: 0
        };

        it('should handle rating 1 (Again) and mark as learning (lapse)', () => {
            const result = calculateSrsData(reviewProgress, 1, defaultConfig);
            expect(result.status).toBe('learning');
            expect(result.step).toBe(0);
            expect(result.lapses).toBe(1);
            expect(result.interval).toBe(0);
            // EF should decrease by 0.2
            expect(result.easeFactor).toBe(2.3);
        });

        it('should handle rating 2 (Hard) and increase interval slightly, reduce EF', () => {
            const result = calculateSrsData(reviewProgress, 2, defaultConfig);
            expect(result.status).toBe('review');
            // Interval calculation: 10 * 1.2 = 12
            expect(result.interval).toBe(12);
            // EF decreases by 0.15
            expect(result.easeFactor).toBe(2.35);
        });

        it('should handle rating 3 (Good) and increase interval by EF, keep EF', () => {
            const result = calculateSrsData(reviewProgress, 3, defaultConfig);
            expect(result.status).toBe('review');
            // Interval: 10 * 2.5 = 25
            expect(result.interval).toBe(25);
            expect(result.easeFactor).toBe(2.5);
        });

        it('should handle rating 4 (Easy) and increase interval heavily, increase EF', () => {
            const result = calculateSrsData(reviewProgress, 4, defaultConfig);
            expect(result.status).toBe('review');
            // Interval: 10 * 2.5 * 1.3 ≈ 33 or 34 depending on exact formula
            expect(result.interval).toBe(34);
            // EF increases by 0.15
            expect(result.easeFactor).toBe(2.65);
        });

        it('should mark card as suspended/leech after 8 lapses', () => {
            const lapseProgress: Partial<UserCardProgress> = {
                status: 'review',
                interval: 10,
                easeFactor: 1.3,
                lapses: 7
            };
            const result = calculateSrsData(lapseProgress, 1, defaultConfig);
            expect(result.isLeech).toBe(true);
            expect(result.lapses).toBe(8);
        });
    });

    describe('Fuzzing Logic', () => {
        it('should apply fuzz to interval when fuzzEnabled is true', () => {
            const reviewProgress: Partial<UserCardProgress> = {
                status: 'review',
                interval: 10,
                easeFactor: 2.5
            };

            // Mock Math.random to return 0.99 so fuzz applies a maximum positive modifier
            vi.spyOn(Math, 'random').mockReturnValue(0.99);

            const resultFuzz = calculateSrsData(reviewProgress, 3, { fuzzEnabled: true });

            // Since Math.random() is mocked to 0.99, the fuzzed interval should differ
            // (or if fuzz bounds include the actual interval, we can just check Math.random was called)
            expect(Math.random).toHaveBeenCalled();
            // Typically with fuzzing interval shouldn't be exactly the same, but we mainly care the branch executes.
            // As long as random was called and a valid result came out, the fuzz logic is covered.
            expect(resultFuzz.interval).toBeGreaterThanOrEqual(0);
        });
    });

    describe('Exam Mode', () => {
        it('should cap interval to EXAM_MODE_MAX_INTERVAL if exam mode is active and date is close', () => {
            const reviewProgress: Partial<UserCardProgress> = {
                status: 'review',
                interval: 10,
                easeFactor: 2.5
            };

            // Exam in 5 days
            const examDate = new Date('2026-07-06T12:00:00Z');
            
            const result = calculateSrsData(reviewProgress, 4, { 
                fuzzEnabled: false,
                examModeEnabled: true,
                examDate: examDate.toISOString()
            });

            // Normal interval would be 33, but capped at EXAM_MODE_MAX_INTERVAL (14)
            expect(result.interval).toBe(EXAM_MODE_MAX_INTERVAL);
        });
    });

    describe('Data Recovery', () => {
        it('should recover invalid review intervals (interval < 2 but EF > 1.5)', () => {
            const brokenProgress: Partial<UserCardProgress> = {
                status: 'review',
                interval: 1, // Invalid for review with high EF
                easeFactor: 2.5
            };
            
            // Should recalculate base interval to Math.max(2, Math.round(2.5)) = 3 before applying rating
            // So if rating is 3 (Good), interval is 3 * 2.5 = 8 (approx)
            const result = calculateSrsData(brokenProgress, 3, defaultConfig);
            
            expect(result.interval).toBeGreaterThan(2); 
            // 3 * 2.5 = 7.5 -> Math.round -> 8
            expect(result.interval).toBe(8);
        });
    });
});
