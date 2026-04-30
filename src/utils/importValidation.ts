import { z } from 'zod';
import type { Card } from '../types';

const MAX_TEXT_LENGTH = 50_000;
const MAX_TAGS = 50;
const MAX_TAG_LENGTH = 100;
const MAX_CONNECTIONS = 200;

// Strip HTML tags to prevent XSS from being persisted
function stripHtmlTags(value: string): string {
    return value.replace(/<[^>]*>/g, '');
}

// Safe string transformer: strip HTML and limit length
function safeString(maxLen: number) {
    return z.string().max(maxLen, `Exceeds ${maxLen} characters`).transform(stripHtmlTags);
}

// Zod Schema for strict validation
export const CardSchema = z.object({
    // ID must be slug-safe: lowercase alphanumeric and hyphens only (prevents path traversal)
    id: z
        .string()
        .min(1, 'ID is required')
        .max(200, 'ID exceeds 200 characters')
        .regex(/^[a-z0-9][a-z0-9\-]*$/, 'ID must be lowercase alphanumeric with hyphens only'),
    title: safeString(500).pipe(z.string().min(1, 'Title is required')),
    type: z.enum(['drug', 'patho', 'physio', 'data'] as const).default('data'),
    subtitle: safeString(500).optional(),
    content: safeString(MAX_TEXT_LENGTH).optional(),
    details: safeString(MAX_TEXT_LENGTH).optional(),
    tags: z
        .array(z.string().max(MAX_TAG_LENGTH, `Tag exceeds ${MAX_TAG_LENGTH} characters`))
        .max(MAX_TAGS, `Cannot have more than ${MAX_TAGS} tags`)
        .default([]),
    // imageUrl: only https URLs allowed; data URIs and other protocols are blocked
    imageUrl: z
        .string()
        .refine(
            (val) => val === '' || /^https:\/\/.+/i.test(val),
            'imageUrl must be a valid https URL'
        )
        .optional()
        .or(z.literal('')),
    manualConnections: z
        .array(z.string().max(200, 'Connection ID exceeds 200 characters'))
        .max(MAX_CONNECTIONS, `Cannot have more than ${MAX_CONNECTIONS} connections`)
        .optional(),
});

export const ImportBatchSchema = z.array(CardSchema);

export type ValidationResult = {
    success: boolean;
    errors: string[];
    validCards: Card[];
    skippedCount: number;
};

/**
 * Validates a batch of imported data against the schema.
 * Uses partial (per-item) validation: valid cards are imported, invalid ones are reported.
 * @param data Raw JSON or object data
 */
export function validateImportData(data: unknown): ValidationResult {
    const arrayData = Array.isArray(data) ? data : [data];

    const validCards: Card[] = [];
    const errors: string[] = [];
    let skippedCount = 0;

    for (let i = 0; i < arrayData.length; i++) {
        const item = arrayData[i];
        const result = CardSchema.safeParse(item);

        if (result.success) {
            validCards.push(result.data as Card);
        } else {
            skippedCount++;
            const itemTitle = (item as any)?.title ?? `item[${i}]`;
            result.error.errors.forEach((err) => {
                const path = err.path.join('.');
                errors.push(`"${itemTitle}" — Field '${path}': ${err.message}`);
            });
        }
    }

    return {
        success: errors.length === 0,
        errors,
        validCards,
        skippedCount,
    };
}
