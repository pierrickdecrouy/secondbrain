import type { Card } from './types';
import { initialCards } from './data';

const STORAGE_KEY = 'pharmabrain_cards';

export function loadCards(): Card[] {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            return JSON.parse(stored) as Card[];
        }
    } catch (e) {
        console.error('Error loading cards from localStorage:', e);
    }
    // Return initial cards if nothing in storage
    return [...initialCards];
}

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
