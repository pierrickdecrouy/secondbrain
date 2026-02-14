import type { Card } from './types';
import { initialCards } from './data';
import { MEDICAL_ABBREVIATIONS } from './medicalAbbreviations';

const STORAGE_KEY = 'pharmabrain_cards';
const CUSTOM_ABBREVIATIONS_KEY = 'pharma_brain_custom_abbreviations';

// Check if running in Electron
export function isElectron(): boolean {
    return !!(window.electronAPI?.isElectron);
}

// Convert HTML to plain text/Markdown
function convertHtmlToText(html: string): string {
    if (!html) return '';

    // If it doesn't contain HTML tags, return as-is
    if (!/<[^>]+>/.test(html)) return html;

    let text = html;

    // Convert common HTML to Markdown
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
    text = text.replace(/<h(\d)>(.*?)<\/h\1>/gi, (_, level, content) => {
        return '#'.repeat(parseInt(level)) + ' ' + content + '\n\n';
    });

    // Remove remaining HTML tags
    text = text.replace(/<[^>]+>/g, '');

    // Clean up whitespace
    text = text.replace(/\n{3,}/g, '\n\n');
    text = text.trim();

    return text;
}

// Clean cards by converting HTML details to text
function cleanCards(cards: Card[]): Card[] {
    return cards.map(card => ({
        ...card,
        details: convertHtmlToText(card.details),
        content: convertHtmlToText(card.content),
        createdAt: card.createdAt || 0, // Default to 0 (oldest) if missing
        updatedAt: card.updatedAt || 0
    }));
}

// Load cards - async for Electron, sync fallback for browser
export async function loadCardsAsync(): Promise<Card[]> {
    // If running in Electron, use file system
    if (isElectron() && window.electronAPI) {
        try {
            const cards = await window.electronAPI.loadCards();
            if (cards && cards.length > 0) {
                return cleanCards(cards);
            }
            // If no cards on disk, return initial cards and save them
            await window.electronAPI.saveCards(initialCards);
            return [...initialCards];
        } catch (e) {
            console.error('Error loading cards from Electron:', e);
            return [...initialCards];
        }
    }

    // Fallback to localStorage for browser
    return cleanCards(loadCards());
}

// Save cards - async for Electron, sync fallback for browser
export async function saveCardsAsync(cards: Card[]): Promise<void> {
    // If running in Electron, use file system
    if (isElectron() && window.electronAPI) {
        try {
            await window.electronAPI.saveCards(cards);
        } catch (e) {
            console.error('Error saving cards to Electron:', e);
        }
        return;
    }

    // Fallback to localStorage for browser
    saveCards(cards);
}

// Synchronous version for browser-only use
export function loadCards(): Card[] {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            return JSON.parse(stored) as Card[];
        }
    } catch (e) {
        console.error('Error loading cards from localStorage:', e);
    }
    return [...initialCards];
}

// Synchronous version for browser-only use
export function saveCards(cards: Card[]): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
    } catch (e) {
        console.error('Error saving cards to localStorage:', e);
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
