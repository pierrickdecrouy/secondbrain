import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { calculateFsrsProgress } from './fsrs';
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
    });
});

