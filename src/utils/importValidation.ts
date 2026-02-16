import { z } from 'zod';
import type { Card } from '../types';
import { CARD_TYPES } from '../types';

/**
 * Zod Schema for Card Validation
 * Ensures data integrity for "Concours de l'internat" reliability.
 */

// Tag Schema: Must be non-empty string, trimmed
const TagSchema = z.string()
    .min(1, "Tag cannot be empty")
    .transform(t => t.trim())
    .refine(t => t.length > 0, "Tag cannot be just whitespace");

// Card Type Schema
// forcing unknown cast to avoid readonly tuple issues with zod
const CardTypeSchema = z.enum(CARD_TYPES as unknown as [string, ...string[]]);

// Full Card Import Schema
const CardImportSchema = z.object({
    id: z.string().optional(), // Can be generated if missing
    type: CardTypeSchema,
    title: z.string().min(2, "Title must be at least 2 characters").max(200, "Title too long"),
    subtitle: z.string().optional().default(''),
    content: z.string().optional().default(''), // Summary
    details: z.string().optional().default(''), // Rich text
    tags: z.array(TagSchema).default([]),
    imageUrl: z.string().url("Invalid image URL").optional().or(z.literal('')),
    manualConnections: z.array(z.string()).optional().default([]),
    suppressedConnections: z.array(z.string()).optional().default([]),
    createdAt: z.number().optional(),
    updatedAt: z.number().optional(),
});

// Batch Import Schema
const BatchImportSchema = z.array(CardImportSchema);

/**
 * Validate a single card or a batch of cards
 */
export function validateImportData(data: unknown) {
    // Determine if array or single object
    const isArray = Array.isArray(data);
    const schema = isArray ? BatchImportSchema : CardImportSchema;

    const result = schema.safeParse(data);

    if (result.success) {
        return {
            success: true,
            data: result.data as Card | Card[],
            errors: []
        };
    } else {
        // Format Zod errors into readable messages
        const formattedErrors = (result.error as any).errors.map((err: any) => {
            const path = err.path.join('.');
            return `${path}: ${err.message}`;
        });
        return {
            success: false,
            data: null,
            errors: formattedErrors
        };
    }
}

/**
 * Sanitize and fix minor issues in a card
 * (e.g., removing duplicate tags, trimming whitespace)
 */
export function sanitizeCard(card: Partial<Card>): Card {
    return {
        id: card.id || crypto.randomUUID(),
        type: card.type || 'data',
        title: (card.title || 'Untitled').trim(),
        subtitle: (card.subtitle || '').trim(),
        content: (card.content || '').trim(),
        details: (card.details || '').trim(),
        tags: Array.from(new Set((card.tags || []).map(t => t.trim()).filter(t => t.length > 0))),
        imageUrl: card.imageUrl || '',
        manualConnections: card.manualConnections || [],
        suppressedConnections: card.suppressedConnections || [],
        createdAt: card.createdAt || Date.now(),
        updatedAt: card.updatedAt || Date.now()
    } as Card;
}
