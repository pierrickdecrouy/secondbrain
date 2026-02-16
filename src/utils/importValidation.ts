import { z } from 'zod';
import type { Card } from '../types';

// Zod Schema for strict validation
export const CardSchema = z.object({
    id: z.string().min(1, "ID is required"),
    title: z.string().min(1, "Title is required"),
    type: z.enum(['drug', 'patho', 'physio', 'data'] as const).default('data'),
    subtitle: z.string().optional(),
    content: z.string().optional(),
    details: z.string().optional(), // Full markdown content
    tags: z.array(z.string()).default([]),
    imageUrl: z.string().url("Invalid image URL").optional().or(z.literal('')),
    manualConnections: z.array(z.string()).optional(),
});

export const ImportBatchSchema = z.array(CardSchema);

export type ValidationResult = {
    success: boolean;
    errors: string[];
    validCards: Card[];
};

/**
 * Validates a batch of imported data against the schema
 * @param data Raw JSON or object data
 */
export function validateImportData(data: any): ValidationResult {
    try {
        // Ensure array
        const arrayData = Array.isArray(data) ? data : [data];

        // Parse with Zod
        const parsed = ImportBatchSchema.parse(arrayData);

        return {
            success: true,
            errors: [],
            validCards: parsed as Card[]
        };
    } catch (e: any) {
        if (e instanceof z.ZodError) {
            // Force cast to any to avoid TS issues with ZodError<T>
            const zodError = e as any;
            const formattedErrors = zodError.errors.map((err: any) => {
                const path = err.path.join('.');
                return `Field '${path}': ${err.message}`;
            });
            return {
                success: false,
                errors: formattedErrors,
                validCards: []
            };
        }
        return {
            success: false,
            errors: [(e as Error).message],
            validCards: []
        };
    }
}
