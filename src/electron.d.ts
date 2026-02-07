// Type declarations for Electron API exposed via preload.js

interface ElectronAPI {
    loadCards: () => Promise<import('./types').Card[]>;
    saveCards: (cards: import('./types').Card[]) => Promise<{ success: boolean; error?: string }>;
    saveImage: (data: { buffer: ArrayBuffer; name: string; type: string }) => Promise<string>;
    getDbPath: () => Promise<string>;
    onRequestSave: (callback: () => void) => void;
    loadAbbreviations: () => Promise<Record<string, string[]>>;
    saveAbbreviations: (abbrevs: Record<string, string[]>) => Promise<{ success: boolean; error?: string }>;
    isElectron: boolean;
}

declare global {
    interface Window {
        electronAPI?: ElectronAPI;
    }
}

export { };
