import { describe, it, expect } from 'vitest';
import { validateImportData } from './importValidation';

describe('validateImportData', () => {
    const validCard = {
        id: 'card1',
        title: 'Valid Card',
        type: 'data',
        content: 'This is a valid card content.'
    };

    it('should successfully validate a valid single card', () => {
        const result = validateImportData(validCard);
        expect(result.success).toBe(true);
        expect(result.errors).toHaveLength(0);
        expect(result.validCards).toHaveLength(1);
        expect(result.validCards[0].id).toBe('card1');
    });

    it('should successfully validate a valid array of cards', () => {
        const result = validateImportData([
            validCard,
            { ...validCard, id: 'card2', title: 'Second Card' }
        ]);
        expect(result.success).toBe(true);
        expect(result.validCards).toHaveLength(2);
    });

    it('should fail if batch size exceeds MAX_BATCH_SIZE', () => {
        const largeBatch = Array(2001).fill(validCard);
        const result = validateImportData(largeBatch);
        expect(result.success).toBe(false);
        expect(result.errors[0]).toContain('Import batch too large');
    });

    it('should detect and reject script injection in string fields', () => {
        const maliciousCard = {
            ...validCard,
            content: 'Hello <script>alert(1)</script>'
        };
        const result = validateImportData([maliciousCard]);
        expect(result.success).toBe(false);
        expect(result.errors[0]).toContain('dangerous content detected in fields: content');
    });

    it('should detect and reject javascript protocol injection', () => {
        const maliciousCard = {
            ...validCard,
            details: 'Click here: javascript:alert(1)'
        };
        const result = validateImportData([maliciousCard]);
        expect(result.success).toBe(false);
        expect(result.errors[0]).toContain('dangerous content detected in fields: details');
    });

    it('should warn about duplicate IDs and deduplicate them', () => {
        const result = validateImportData([
            validCard,
            { ...validCard, title: 'Duplicate ID but different title' }
        ]);
        expect(result.success).toBe(true);
        expect(result.warnings).toHaveLength(1);
        expect(result.warnings[0]).toContain('Duplicate IDs found');
        expect(result.validCards).toHaveLength(1);
        // Should keep the last occurrence
        expect(result.validCards[0].title).toBe('Duplicate ID but different title');
    });

    it('should fail validation if required fields are missing', () => {
        const invalidCard = {
            id: 'card1',
            // title is missing
        };
        const result = validateImportData(invalidCard);
        expect(result.success).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.errors.some(e => e.includes('title') || e.includes('Title'))).toBe(true);
    });

    it('should sanitize zero-width characters in ID and title', () => {
        const cardWithZeroWidth = {
            ...validCard,
            id: 'card1\u200B',
            title: '\uFEFFValid Title'
        };
        const result = validateImportData(cardWithZeroWidth);
        expect(result.success).toBe(true);
        expect(result.validCards[0].id).toBe('card1');
        expect(result.validCards[0].title).toBe('Valid Title');
    });
});
