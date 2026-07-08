import { Model, Deck, Package } from 'genanki-js';
import initSqlJs from 'sql.js';
import { marked } from 'marked';
import { saveAs } from 'file-saver';
import type { Card } from '../types';

/**
 * Locates the sql-wasm.wasm file in different environments:
 * - Web (Vite dev/prod): served from /
 * - Electron (file:// protocol): relative to window.location
 */
function getSqlWasmPath(file: string): string {
    // In Electron, window.location.href is like file:///path/to/dist/index.html
    // We need to serve the wasm file from the same directory
    if (typeof window !== 'undefined' && window.location.protocol === 'file:') {
        const base = window.location.href.replace(/[^/]+$/, '');
        return `${base}${file}`;
    }
    // Standard web: the wasm is at the root of the public folder
    return `/${file}`;
}

export async function exportToAnki(deckName: string, cards: Card[]): Promise<void> {
    if (!cards || cards.length === 0) {
        throw new Error("Aucune carte à exporter.");
    }

    // Initialize SQL.js — handles both web and Electron environments
    const SQL = await initSqlJs({
        locateFile: (file) => getSqlWasmPath(file)
    });

    const m = new Model({
        name: "SecondBrain Basic",
        id: "1543634829843",
        flds: [{ name: "Front" }, { name: "Back" }],
        req: [[0, "all", [0]]],
        tmpls: [{
            name: "Card 1",
            qfmt: "{{Front}}",
            afmt: "{{FrontSide}}\n\n<hr id=answer>\n\n{{Back}}"
        }]
    });

    const deckId = 1276438724672;
    const d = new Deck(deckId, deckName);

    for (const card of cards) {
        const typeLabel = card.type === 'patho'  ? 'Pathologie'  :
                          card.type === 'drug'   ? 'Médicament'  :
                          card.type === 'physio' ? 'Physiologie' : 'Donnée';

        const front = `
            <div style="font-family: -apple-system, sans-serif; text-align: center; padding: 16px;">
                <span style="font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600;">${typeLabel}</span>
                <h2 style="margin: 8px 0 0; font-size: 22px; color: #1e293b;">${card.title}</h2>
                ${card.subtitle ? `<p style="margin: 6px 0 0; font-size: 14px; color: #64748b;">${card.subtitle}</p>` : ''}
            </div>
        `;

        const htmlContent = await Promise.resolve(marked.parse(card.content || ''));
        const back = `
            <div style="font-family: -apple-system, sans-serif; text-align: left; line-height: 1.6; padding: 8px 16px;">
                ${htmlContent}
            </div>
        `;

        const tags: string[] = [];
        if (card.type) tags.push(card.type);
        if (card.tags && Array.isArray(card.tags)) {
            // Anki tags cannot contain spaces — replace with underscores
            tags.push(...card.tags.map(t => t.replace(/\s+/g, '_')));
        }

        d.addNote(m.note([front, back], tags));
    }

    const p = new Package();
    p.setSqlJs(SQL);
    p.addDeck(d);

    // .export() returns Uint8Array or ArrayBuffer depending on jszip config in genanki-js
    // @ts-expect-error genanki-js typings are incomplete
    const zipBuffer = await p.export();
    const blob = new Blob([zipBuffer], { type: 'application/octet-stream' });

    const safeName = deckName.replace(/[^a-zA-Z0-9_\-]/g, '_');
    saveAs(blob, `${safeName}.apkg`);
}
