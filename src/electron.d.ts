// Type declarations for Electron API exposed via preload.js

interface ElectronAPI {
    loadCards: () => Promise<import('./types').Card[]>;
    saveCards: (cards: import('./types').Card[]) => Promise<{ success: boolean; error?: string }>;
    importCards: (cards: import('./types').Card[]) => Promise<{ success: boolean; error?: string }>;
    saveImage: (data: { buffer: ArrayBuffer; name: string; type: string }) => Promise<string>;
    getDbPath: () => Promise<string>;
    onRequestSave: (callback: () => void) => void;
    loadAbbreviations: () => Promise<Record<string, string[]>>;
    saveAbbreviations: (abbrevs: Record<string, string[]>) => Promise<{ success: boolean; error?: string }>;

    // Vector Index
    loadVectorIndex: () => Promise<Uint8Array | null>;
    saveVectorIndex: (buffer: Uint8Array) => Promise<{ success: boolean; error?: string }>;

    // AI Model
    checkModelExists: (filename: string) => Promise<boolean>;
    downloadModel: (url: string, filename: string) => Promise<{ success: boolean; path: string }>;
    readModelAsBuffer: (filename: string) => Promise<ArrayBuffer>;
    onDownloadProgress: (callback: (data: { filename: string; loaded: number; total: number }) => void) => void;

    isElectron: boolean;
}

declare global {
    interface Window {
        electronAPI?: ElectronAPI;
    }
}

export { };
