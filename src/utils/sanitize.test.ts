import { describe, it, expect } from 'vitest';
import { sanitizeHtml, safeHtml } from './sanitize';

describe('sanitize', () => {
    describe('sanitizeHtml', () => {
        it('should return empty string for null or undefined', () => {
            expect(sanitizeHtml(null)).toBe('');
            expect(sanitizeHtml(undefined)).toBe('');
            expect(sanitizeHtml('')).toBe('');
        });

        it('should keep allowed tags and attributes', () => {
            const html = '<p class="text-red-500">Hello <strong>world</strong>! <a href="https://example.com" target="_blank">Link</a></p>';
            expect(sanitizeHtml(html)).toBe(html);
        });

        it('should remove malicious script tags', () => {
            const maliciousHtml = '<p>Safe</p><script>alert("XSS")</script>';
            expect(sanitizeHtml(maliciousHtml)).toBe('<p>Safe</p>');
        });

        it('should remove dangerous attributes like onerror', () => {
            const maliciousHtml = '<img src="invalid" onerror="alert(1)" /><p>Text</p>';
            // Note: img is not in the ALLOWED_TAGS list in sanitize.ts, so the whole img should be removed
            expect(sanitizeHtml(maliciousHtml)).toBe('<p>Text</p>');
        });

        it('should remove tags not in ALLOWED_TAGS (like iframe)', () => {
            const iframeHtml = '<div><iframe src="malicious"></iframe></div>';
            expect(sanitizeHtml(iframeHtml)).toBe('<div></div>');
        });
    });

    describe('safeHtml', () => {
        it('should return an object with __html property', () => {
            const result = safeHtml('<strong>bold</strong>');
            expect(result).toEqual({ __html: '<strong>bold</strong>' });
        });
    });
});
