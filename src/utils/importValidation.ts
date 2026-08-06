// @ts-nocheck
import { z } from 'zod';
import type { Card } from '../types';

/** Maximum allowed length for string fields to prevent oversized imports */
const MAX_TITLE_LENGTH = 300;
const MAX_CONTENT_LENGTH = 50_000;
const MAX_DETAILS_LENGTH = 200_000;
const MAX_SUBTITLE_LENGTH = 500;
const MAX_TAG_LENGTH = 100;
const MAX_TAGS_COUNT = 50;
const MAX_BATCH_SIZE = 2_000;

/** Regex to detect script injection patterns in content strings */
const SCRIPT_INJECTION_RE = /<\s*script[\s>]/i;
const DANGEROUS_PROTO_RE = /javascript\s*:/i;

/** Strip invisible / zero-width characters that can corrupt IDs:
 *  \u0000-\u0008  – C0 control characters (NUL..BS)
 *  \u000B-\u000C  – VT, FF
 *  \u000E-\u001F  – SO..US (remaining C0 controls)
 *  \u007F         – DEL
 *  \u200B-\u200D  – Zero-width space/non-joiner/joiner
 *  \uFEFF         – BOM / zero-width no-break space
 */
const sanitizeString = (s: string): string => s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u200B-\u200D\uFEFF]/g, '').trim();

// Zod Schema for strict validation
export const CardSchema = z.object({
    id: z.string().min(1, "ID is required").max(200, "ID too long").transform(sanitizeString),
    title: z.string().min(1, "Title is required").max(MAX_TITLE_LENGTH, `Title exceeds ${MAX_TITLE_LENGTH} chars`).transform(sanitizeString),
    type: z.enum(['drug', 'patho', 'physio', 'data'] as const).default('data'),
    subtitle: z.string().max(MAX_SUBTITLE_LENGTH, `Subtitle exceeds ${MAX_SUBTITLE_LENGTH} chars`).transform(sanitizeString).optional(),
    content: z.string().max(MAX_CONTENT_LENGTH, `Content exceeds ${MAX_CONTENT_LENGTH} chars`).optional(),
    details: z.string().max(MAX_DETAILS_LENGTH, `Details exceeds ${MAX_DETAILS_LENGTH} chars`).optional(),
    tags: z.array(
        z.string().max(MAX_TAG_LENGTH, `Tag exceeds ${MAX_TAG_LENGTH} chars`).transform(sanitizeString)
    ).max(MAX_TAGS_COUNT, `Too many tags (max ${MAX_TAGS_COUNT})`).default([]),
    imageUrl: z.string().url("Invalid image URL").optional().or(z.literal('')),
    manualConnections: z.array(z.string().max(200)).max(500, "Too many manual connections").optional(),
    subject: z.string().max(100, "Subject too long").transform(sanitizeString).optional(),
});

export const ImportBatchSchema = z.array(CardSchema).max(MAX_BATCH_SIZE, `Batch exceeds max size of ${MAX_BATCH_SIZE} cards`);

export type ValidationResult = {
    success: boolean;
    errors: string[];
    validCards: Card[];
    warnings: string[];
};

/**
 * Checks whether a string contains dangerous script injection patterns.
 */
function containsInjection(value: string): boolean {
    return SCRIPT_INJECTION_RE.test(value) || DANGEROUS_PROTO_RE.test(value);
}

/**
 * Deep-scans all string fields of a raw card object for injection patterns.
 * Returns a list of field names that are suspicious.
 */
function detectInjectionFields(raw: Record<string, unknown>): string[] {
    const suspicious: string[] = [];
    const stringFields: (keyof typeof raw)[] = ['title', 'subtitle', 'content', 'details', 'id'];
    for (const field of stringFields) {
        const val = raw[field];
        if (typeof val === 'string' && containsInjection(val)) {
            suspicious.push(String(field));
        }
    }
    if (Array.isArray(raw.tags)) {
        (raw.tags as unknown[]).forEach((tag, i) => {
            if (typeof tag === 'string' && containsInjection(tag)) {
                suspicious.push(`tags[${i}]`);
            }
        });
    }
    return suspicious;
}

/**
 * Validates a batch of imported data against the schema
 * @param data Raw JSON or object data
 */
export function validateImportData(data: unknown): ValidationResult {
    const warnings: string[] = [];

    try {
        // Ensure array
        const arrayData = Array.isArray(data) ? data : [data];

        // Pre-validation: size guard
        if (arrayData.length > MAX_BATCH_SIZE) {
            return {
                success: false,
                errors: [`Import batch too large: ${arrayData.length} cards (max ${MAX_BATCH_SIZE})`],
                validCards: [],
                warnings: [],
            };
        }

        // Pre-validation: check for injection attempts and duplicate IDs
        const seenIds = new Set<string>();
        const duplicateIds: string[] = [];

        for (let i = 0; i < arrayData.length; i++) {
            const raw = arrayData[i];
            if (typeof raw !== 'object' || raw === null) continue;

            const rawObj = raw as Record<string, unknown>;

            // Injection detection
            const badFields = detectInjectionFields(rawObj);
            if (badFields.length > 0) {
                return {
                    success: false,
                    errors: [`Card at index ${i}: dangerous content detected in fields: ${badFields.join(', ')}`],
                    validCards: [],
                    warnings: [],
                };
            }

            // Duplicate ID detection
            const rawId = typeof rawObj.id === 'string' ? rawObj.id.trim() : null;
            if (rawId) {
                if (seenIds.has(rawId)) {
                    duplicateIds.push(rawId);
                } else {
                    seenIds.add(rawId);
                }
            }
        }

        if (duplicateIds.length > 0) {
            warnings.push(`Duplicate IDs found (will be deduplicated): ${duplicateIds.slice(0, 5).join(', ')}${duplicateIds.length > 5 ? ` (+${duplicateIds.length - 5} more)` : ''}`);
        }

        // Parse with Zod
        const parsed = ImportBatchSchema.parse(arrayData);

        // Post-parse deduplication by ID (keep last occurrence, matching upsert semantics)
        const deduped = new Map<string, Card>();
        for (const card of parsed) {
            deduped.set(card.id, card as Card);
        }

        return {
            success: true,
            errors: [],
            validCards: Array.from(deduped.values()),
            warnings,
        };
    } catch (e: unknown) {
        if (e instanceof z.ZodError) {
            const zodError = e as z.ZodError<unknown>;
            const formattedErrors = zodError.issues.map((err: z.ZodIssue) => {
                const path = err.path.join('.');
                return `Field '${path}': ${(err as Error).message}`;
            });
            return {
                success: false,
                errors: formattedErrors,
                validCards: [],
                warnings,
            };
        }
        return {
            success: false,
            errors: [(e as Error).message],
            validCards: [],
            warnings,
        };
    }
}

