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
    workspaceId?: string;
}

// Export a value to ensure this file is treated as a module at runtime
export const CARD_TYPES = ['drug', 'patho', 'physio', 'data'] as const;
export const COURSE_TYPE = 'course';

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
