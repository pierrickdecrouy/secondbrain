import type { Card } from './types';
import { COURSE_TYPE } from './types';
import { CardSchema } from './schema';
import { initialCards } from './data';
import { MEDICAL_ABBREVIATIONS } from './medicalAbbreviations';

const CUSTOM_ABBREVIATIONS_KEY = 'pharma_brain_custom_abbreviations';

// Check if running in Electron
export function isElectron(): boolean {
    return !!(window.electronAPI?.isElectron);
}

import Dexie, { type Table } from 'dexie';

// Define Dexie Database for web fallback
class PharmaBrainDB extends Dexie {
    cards!: Table<Card, string>;
    settings!: Table<{ key: string; value: unknown }, string>;

    constructor(dbName: string) {
        super(dbName);
        this.version(1).stores({
            cards: 'id, type', // Primary key and indexed props
            settings: 'key'
        });
    }
}
let dbInstance: PharmaBrainDB | null = null;

export function getDB(): PharmaBrainDB {
    if (!dbInstance) {
        dbInstance = new PharmaBrainDB('PharmaBrainDB_offline');
    }
    return dbInstance;
}

export function setStorageUid(uid: string | null) {
    if (dbInstance && dbInstance.isOpen()) {
        dbInstance.close();
    }
    const dbName = uid ? `PharmaBrainDB_${uid}` : 'PharmaBrainDB_offline';
    dbInstance = new PharmaBrainDB(dbName);
    dbInstance.open().catch(e => console.error('Failed to open DB after uid switch:', e));
}

// Convert HTML to plain text/Markdown
function convertHtmlToText(html: string): string {
    if (!html) return '';
    if (!/<[^>]+>/.test(html)) return html;
    
    if (typeof window === 'undefined' || !window.DOMParser) {
        return html.replace(/<[^>]+>/g, '').trim();
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    function parseNode(node: Node): string {
        if (node.nodeType === Node.TEXT_NODE) {
            return node.textContent || '';
        }
        if (node.nodeType !== Node.ELEMENT_NODE) return '';
        
        const el = node as HTMLElement;
        const tag = el.tagName.toLowerCase();
        
        let content = '';
        for (const child of Array.from(el.childNodes)) {
            content += parseNode(child);
        }
        
        switch (tag) {
            case 'strong':
            case 'b':
                return `**${content}**`;
            case 'em':
            case 'i':
                return `*${content}*`;
            case 'br':
                return '\n';
            case 'p':
                return `${content}\n\n`;
            case 'li':
                return `- ${content}\n`;
            case 'ul':
            case 'ol':
                return `${content}\n`;
            case 'h1': return `# ${content}\n\n`;
            case 'h2': return `## ${content}\n\n`;
            case 'h3': return `### ${content}\n\n`;
            case 'h4': return `#### ${content}\n\n`;
            case 'h5': return `##### ${content}\n\n`;
            case 'h6': return `###### ${content}\n\n`;
            default:
                return content;
        }
    }
    
    let text = parseNode(doc.body);
    text = text.replace(/\n{3,}/g, '\n\n').trim();
    return text;
}

function cleanCards(cards: Card[]): Card[] {
    return cards.map(card => {
        let nodeType = card.nodeType;
        if (!nodeType) {
            nodeType = card.type === COURSE_TYPE ? 'course' : 'concept';
        }
        return {
            ...card,
            nodeType,
            details: convertHtmlToText(card.details),
            content: convertHtmlToText(card.content),
            createdAt: card.createdAt || 0,
            updatedAt: card.updatedAt || 0
        };
    });
}

export async function loadCardsAsync(): Promise<Card[]> {
    const isInitialized = await loadSettingAsync('db_initialized', false);

    if (isElectron() && window.electronAPI) {
        try {
            const cards = await window.electronAPI.loadCards();
            if (!isInitialized && (!cards || cards.length === 0)) {
                await window.electronAPI.saveCards(initialCards);
                await saveSettingAsync('db_initialized', true);
                return [...initialCards];
            }
            return cards ? cleanCards(cards) : [];
        } catch (e) {
            console.error('Error loading cards from Electron:', e);
            return [];
        }
    }

    // Dexie Fallback
    try {
        const db = getDB();
        const stored = await db.cards.toArray();
        if (!isInitialized && (!stored || stored.length === 0)) {
            await db.cards.bulkAdd(initialCards);
            await saveSettingAsync('db_initialized', true);
            return [...initialCards];
        }
        return cleanCards(stored);
    } catch (e) {
        console.error('Error loading cards from Dexie:', e);
        return [];
    }
}

export async function saveCardsAsync(cards: Card[]): Promise<void> {
    if (isElectron() && window.electronAPI) {
        try {
            await window.electronAPI.saveCards(cards);
        } catch (e) {
            console.error('Error saving cards to Electron:', e);
        }
        return;
    }

    // C-5 fix: use bulkPut (upsert) instead of clear+bulkAdd to prevent data loss on write failure
    // Additionally, remove cards that are no longer in the array
    try {
        const db = getDB();
        await db.transaction('rw', db.cards, async () => {
            const currentIds = new Set(cards.map(c => c.id));
            const existingIds = await db.cards.toCollection().primaryKeys();
            const toDelete = (existingIds as string[]).filter(id => !currentIds.has(id));
            if (toDelete.length > 0) {
                await db.cards.bulkDelete(toDelete);
            }
            await db.cards.bulkPut(cards);
        });
    } catch (e) {
        console.error('Error saving cards to Dexie:', e);
    }
}

export async function loadSettingAsync<T>(key: string, defaultValue: T): Promise<T> {
    if (isElectron() && window.electronAPI?.loadSetting) {
        const value = await window.electronAPI.loadSetting<T>(key);
        return value !== undefined ? value : defaultValue;
    }
    try {
        const db = getDB();
        const setting = await db.settings.get(key);
        return setting ? (setting.value as T) : defaultValue;
    } catch (e) {
        console.error('Dexie read setting error', e);
        return defaultValue;
    }
}

export async function saveSettingAsync<T>(key: string, value: T): Promise<void> {
    if (isElectron() && window.electronAPI?.saveSetting) {
        await window.electronAPI.saveSetting(key, value);
        return;
    }
    try {
        const db = getDB();
        await db.settings.put({ key, value });
    } catch (e) {
        console.error('Dexie write setting error', e);
    }
}


// Abbreviation Storage Logic

export const loadCustomAbbreviations = (): Record<string, string> => {
    try {
        const stored = localStorage.getItem(CUSTOM_ABBREVIATIONS_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (e) {
        console.error("Failed to load custom abbreviations", e);
    }

    // Default to the static list if nothing is stored
    const defaultSimple: Record<string, string> = {};
    Object.entries(MEDICAL_ABBREVIATIONS).forEach(([key, values]) => {
        if (Array.isArray(values) && values.length > 0) {
            defaultSimple[key] = values[0];
        }
    });

    return defaultSimple;
};

export const saveCustomAbbreviations = (abbreviations: Record<string, string>) => {
    try {
        localStorage.setItem(CUSTOM_ABBREVIATIONS_KEY, JSON.stringify(abbreviations));
    } catch (e) {
        console.error("Failed to save abbreviations", e);
    }
};

export const resetToDefaults = () => {
    localStorage.removeItem(CUSTOM_ABBREVIATIONS_KEY);
};

// ==========================================
// FULL BACKUP & RESTORE
// ==========================================

export interface BackupData {
    version: number;
    timestamp: string;
    cards: Card[];
    settings: { key: string; value: unknown }[];
    abbreviations: Record<string, string>;
}

export async function exportAllData(): Promise<string> {
    const backup: BackupData = {
        version: 1,
        timestamp: new Date().toISOString(),
        cards: [],
        settings: [],
        abbreviations: {}
    };

    if (isElectron() && window.electronAPI) {
        backup.cards = await window.electronAPI.loadCards() || [];
        // Note: Full settings export in Electron would need a new API, but for now we'll do web-first
        // Assuming web fallback for settings if electron API lacks it.
    } else {
        const db = getDB();
        backup.cards = await db.cards.toArray();
        backup.settings = await db.settings.toArray();
    }

    try {
        const storedAbbr = localStorage.getItem(CUSTOM_ABBREVIATIONS_KEY);
        if (storedAbbr) backup.abbreviations = JSON.parse(storedAbbr);
    } catch (e) { console.warn('Failed to load custom abbreviations from localStorage:', e); }

    return JSON.stringify(backup, null, 2);
}

export async function importAllData(jsonString: string): Promise<void> {
    try {
        const data: BackupData = JSON.parse(jsonString);
        if (!data.cards || !Array.isArray(data.cards)) {
            throw new Error("Invalid backup file: Missing cards array");
        }
        
        // Zod validation for malformed cards
        const validCards: Card[] = [];
        data.cards.forEach(card => {
            const res = CardSchema.safeParse(card);
            if (res.success) {
                validCards.push(res.data as Card);
            } else {
                console.warn(`Card skipped during restore due to invalid schema (ID: ${card.id}):`, res.error);
            }
        });
        
        if (validCards.length === 0) {
            throw new Error("Invalid backup file: No valid cards found.");
        }

        if (isElectron() && window.electronAPI) {
            await window.electronAPI.saveCards(validCards);
        } else {
            const db = getDB();
            await db.transaction('rw', db.cards, db.settings, async () => {
                await db.cards.clear();
                await db.settings.clear();
                
                await db.cards.bulkAdd(cleanCards(validCards));
                if (data.settings && Array.isArray(data.settings)) {
                    await db.settings.bulkAdd(data.settings);
                }
            });
        }

        if (data.abbreviations) {
            localStorage.setItem(CUSTOM_ABBREVIATIONS_KEY, JSON.stringify(data.abbreviations));
        }

        // We reload the page to ensure all React context/state is refreshed from the DB
        window.location.reload();
    } catch (e) {
        console.error("Failed to import data:", e);
        throw e;
    }
}
