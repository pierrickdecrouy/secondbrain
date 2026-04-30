export type CardType = string;

export interface Card {
    id: string;
    type: CardType;
    title: string;
    subtitle: string;
    content: string; // Plain text summary
    details: string; // Markdown content (supports rich text)
    tags: string[];
    imageUrl?: string; // Optional image URL or local path
    manualConnections?: string[]; // IDs of manually connected cards
    suppressedConnections?: string[]; // IDs of excluded/blacklisted connections
    createdAt?: number;
    updatedAt?: number;
    progress?: UserCardProgress;
}

/**
 * A segment is a sub-section of a card (e.g. a H2/H3 chapter).
 * It has its own SRS progress for micro-learning.
 */
export interface CardSegment {
    id: string;           // Unique: `${cardId}__${slugified title}`
    cardId: string;       // Parent card ID
    title: string;        // Section heading (e.g. "Mécanisme d'action")
    content: string;      // Text content of the segment
    progress?: UserCardProgress;
}

// Export a value to ensure this file is treated as a module at runtime
export const CARD_TYPES = ['drug', 'patho', 'physio', 'data'] as const;

export const generateId = (text: string): string => {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
};

export interface Node {
    id: string;
    name: string;
    type: string;
    val?: number;
    color?: string;
    // ... any other props from worker
}

export interface Link {
    source: string | Node;
    target: string | Node;
    value?: number;
    type?: string;
    reason?: string;
    quality?: 'boost' | 'match' | 'neutral';
}

export interface UserCardProgress {
    status: 'new' | 'learning' | 'review' | 'suspended';
    step: number;
    dueDate: string;
    interval: number;
    easeFactor: number;
    lapses: number;
    isLeech?: boolean;
    algorithm?: 'srs' | 'fsrs';
    stability?: number;
    difficulty?: number;
    reps?: number;
    lastReview?: string | null;
}
