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
    subject?: string; // Matière / Subject category
    workspaceId?: string; // Identifier for the workspace
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
    cluster?: number; // Semantic cluster assigned by the graph worker
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
    status: 'new' | 'learning' | 'review' | 'suspended' | 'relearning';
    step: number;
    dueDate: string;
    interval: number; // Scheduled days
    easeFactor: number;
    lapses: number;
    isLeech?: boolean;
    algorithm?: 'srs' | 'fsrs';
    stability?: number;
    difficulty?: number;
    reps?: number;
    lastReview?: string | null;
    history?: string[]; // Array of ISO date strings for each review
}

export type PausedTaskType = 'card_edit' | 'course_edit' | 'review_session';

export interface PausedTask {
    id: string;
    type: PausedTaskType;
    title: string;
    state: Record<string, unknown>;
    timestamp: number;
}

declare global {
  interface Window {
    electronAPI?: {
      isElectron: boolean;
      loadCards: () => Promise<any[]>;
      saveCards: (cards: any[]) => Promise<void>;
      loadSetting: <T>(key: string) => Promise<T | undefined>;
      saveSetting: <T>(key: string, value: T) => Promise<void>;
      removeSetting: (key: string) => Promise<void>;
      loadVectorIndex: () => Promise<Uint8Array | null>;
      saveVectorIndex: (data: Uint8Array) => Promise<void>;
      loadAbbreviations: () => Promise<Record<string, string[]>>;
      saveAbbreviations: (abbreviations: Record<string, string[]>) => Promise<void>;
      startPdfImport?: (paths: string[]) => void;
      onPdfProgress?: (callback: (data: any) => void) => void;
      onPdfDone?: (callback: (data: any) => void) => void;
      onPdfError?: (callback: (error: string) => void) => void;
    };
  }
}
