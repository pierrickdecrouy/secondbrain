// @ts-nocheck
import type { Card } from './types';
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

    constructor() {
        super('PharmaBrainDB');
        this.version(1).stores({
            cards: 'id, type', // Primary key and indexed props
            settings: 'key'
        });
    }
}
const db = new PharmaBrainDB();

// Convert HTML to plain text/Markdown
function convertHtmlToText(html: string): string {
    if (!html) return '';
    if (!/<[^>]+>/.test(html)) return html;
    let text = html;
    text = text.replace(/<strong>(.*?)<\/strong>/gi, '**$1**');
    text = text.replace(/<b>(.*?)<\/b>/gi, '**$1**');
    text = text.replace(/<em>(.*?)<\/em>/gi, '*$1*');
    text = text.replace(/<i>(.*?)<\/i>/gi, '*$1*');
    text = text.replace(/<br\s*\/?>/gi, '\n');
    text = text.replace(/<\/p>\s*<p>/gi, '\n\n');
    text = text.replace(/<p>(.*?)<\/p>/gi, '$1\n\n');
    text = text.replace(/<li>(.*?)<\/li>/gi, '- $1\n');
    text = text.replace(/<\/?ul>/gi, '\n');
    text = text.replace(/<\/?ol>/gi, '\n');
    text = text.replace(/<h(\d)>(.*?)<\/h\1>/gi, (_, level, content) => '#'.repeat(parseInt(level)) + ' ' + content + '\n\n');
    text = text.replace(/<[^>]+>/g, '');
    text = text.replace(/\n{3,}/g, '\n\n');
    text = text.trim();
    return text;
}

function cleanCards(cards: Card[]): Card[] {
    return cards.map(card => ({
        ...card,
        details: convertHtmlToText(card.details),
        content: convertHtmlToText(card.content),
        createdAt: card.createdAt || 0,
        updatedAt: card.updatedAt || 0
    }));
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

    // Dexie Fallback
    try {
        await db.transaction('rw', db.cards, async () => {
            await db.cards.clear();
            await db.cards.bulkAdd(cards);
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
        const setting = await db.settings.get(key);
        return setting ? setting.value : defaultValue;
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
        await db.settings.put({ key, value });
    } catch (e) {
        console.error('Dexie write setting error', e);
    }
}

export function generateId(title: string): string {
    return title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove accents
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
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
        backup.cards = await db.cards.toArray();
        backup.settings = await db.settings.toArray();
    }

    try {
        const storedAbbr = localStorage.getItem(CUSTOM_ABBREVIATIONS_KEY);
        if (storedAbbr) backup.abbreviations = JSON.parse(storedAbbr);
    } catch(e) {}

    return JSON.stringify(backup, null, 2);
}

export async function importAllData(jsonString: string): Promise<void> {
    try {
        const data: BackupData = JSON.parse(jsonString);
        if (!data.cards || !Array.isArray(data.cards)) {
            throw new Error("Invalid backup file: Missing cards array");
        }

        if (isElectron() && window.electronAPI) {
            await window.electronAPI.saveCards(data.cards);
        } else {
            await db.transaction('rw', db.cards, db.settings, async () => {
                await db.cards.clear();
                await db.settings.clear();
                
                await db.cards.bulkAdd(cleanCards(data.cards));
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
