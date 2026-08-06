// UUID generation natively with fallback

export type AppSection = 'dashboard' | 'cards' | 'courses' | 'network' | 'review' | 'settings' | 'stats' | 'add';
export type CategoryType = 'drug' | 'patho' | 'physio' | 'data';
export type AddDataMode = 'none' | 'create' | 'edit' | 'import';
export const CARD_TYPES = ['drug', 'patho', 'physio', 'data'] as const;
export type CardType = typeof CARD_TYPES[number] | (string & {});
export type NodeType = 'course' | 'concept' | 'flashcard';
export type FlashcardFormat = 'q&a' | 'cloze' | 'basic';

export interface CardHistory {
    timestamp: number;
    userId: string | null;
    action: 'create' | 'update';
    diff?: {
        title?: { old: string; new: string };
        subtitle?: { old: string; new: string };
        content?: { old: string; new: string };
        details?: { old: string; new: string };
        tags?: { old: string[]; new: string[] };
        manualConnections?: { old: string[]; new: string[] };
    };
}

export interface Card {
    id: string;
    type: CardType; // Used as category (drug, patho, physio, data, etc.)
    nodeType?: NodeType; // New 3-tier hierarchy
    format?: FlashcardFormat; // Only for flashcards
    parentId?: string; // Links flashcard to concept, concept to course
    title: string; // Question for flashcards
    subtitle: string;
    content: string; // Plain text summary or front of flashcard/cloze text
    details: string; // Markdown content or back of flashcard
    tags: string[];
    imageUrl?: string; // Optional image URL or local path
    manualConnections?: string[]; // IDs of manually connected cards
    suppressedConnections?: string[]; // IDs of excluded/blacklisted connections
    createdAt?: number;
    updatedAt?: number;
    progress?: UserCardProgress;
    subject?: string; // Matière / Subject category
    workspaceId?: string; // Identifier for the workspace
    ownerUid?: string | null; // null = created offline (no account), string = Firebase uid
    history?: CardHistory[]; // Full history of modifications
}

export const COURSE_TYPE = 'course';

export const generateId = (): string => {
    return crypto.randomUUID();
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
    type?: 'stimulates' | 'inhibits' | 'relates' | string;
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
      loadCards: () => Promise<Card[]>;
      saveCards: (cards: Card[]) => Promise<void>;
      searchCardsFTS: (query: string, limit?: number) => Promise<{id: string, highlight: string}[]>;
      loadSetting: <T>(key: string) => Promise<T | undefined>;
      saveSetting: <T>(key: string, value: T) => Promise<void>;
      removeSetting: (key: string) => Promise<void>;
      loadVectorIndex: (shardId?: string) => Promise<Uint8Array | null>;
      saveVectorIndex: (data: Uint8Array, shardId?: string) => Promise<void>;
      loadAbbreviations: () => Promise<Record<string, string[]>>;
      saveAbbreviations: (abbreviations: Record<string, string[]>) => Promise<void>;
      startPdfImport?: (paths: string[]) => void;
      onPdfProgress?: (callback: (data: unknown) => void) => void;
      onPdfDone?: (callback: (data: unknown) => void) => void;
      onPdfError?: (callback: (error: string) => void) => void;
    };
  }
}
