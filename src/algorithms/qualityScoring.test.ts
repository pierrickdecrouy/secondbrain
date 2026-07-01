import { describe, it, expect } from 'vitest';
import { calculateQualityScore } from './qualityScoring';
import type { Card } from '../types';

describe('qualityScoring', () => {
    describe('calculateQualityScore', () => {
        const baseCard: Card = {
            id: '1',
            type: 'flashcard',
            title: 'Test',
            subtitle: '',
            content: '',
            details: '',
            tags: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
            ownerUid: 'uid'
        };

        it('should calculate score for an empty card', () => {
            const result = calculateQualityScore(baseCard, 0);
            expect(result.score).toBeGreaterThanOrEqual(0);
            expect(result.score).toBeLessThan(100);
            // Label is Ebauche, color is slate
            expect(result.color).toBe('#94a3b8');
        });

        it('should give high score for a well-connected and detailed card', () => {
            const richCard: Card = {
                ...baseCard,
                content: '', // content is ignored if details is present in the algorithm
                details: 'This is a very long text that explains the concept in detail with multiple paragraphs. ' + 
                         'It contains sufficient words to trigger a good length score. ' +
                         'Let us add more text to be absolutely sure it passes the minimum thresholds for content. ' +
                         '# Heading\n- List item\n`code`\n| Table | Header |\n| -- | -- |',
                tags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5'],
                subtitle: 'A valid subtitle'
            };
            const result = calculateQualityScore(richCard, 5); // 5 connections
            
            expect(result.score).toBeGreaterThan(60);
            expect(['#f59e0b', '#10b981', '#3b82f6']).toContain(result.color);
        });

        it('should cap the score at 100', () => {
            const perfectCard: Card = {
                ...baseCard,
                content: '',
                details: 'A'.repeat(1500) + '\n# Heading\n- List\n`code`\n| Table | -- |',
                subtitle: 'Subtitle present',
                tags: ['t1', 't2', 't3', 't4', 't5', 't6']
            };
            const result = calculateQualityScore(perfectCard, 20); // Massive connections
            
            expect(result.score).toBe(100);
            expect(result.color).toBe('#f59e0b'); // Excellence is Amber/Gold
        });
    });
});
