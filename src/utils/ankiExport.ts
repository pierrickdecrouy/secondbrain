import { Model, Deck, Package } from 'genanki-js';
import initSqlJs from 'sql.js';
import { marked } from 'marked';
import type { Card } from '../types';

export async function exportToAnki(deckName: string, cards: Card[]): Promise<void> {
    if (!cards || cards.length === 0) {
        throw new Error("Aucune carte à exporter.");
    }

    // Initialize SQL.js from the WASM file we placed in /public
    const SQL = await initSqlJs({
        locateFile: () => `/sql-wasm.wasm`
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

    // random unique ID based on deck name or fixed
    const deckId = 1276438724672;
    const d = new Deck(deckId, deckName);

    for (const card of cards) {
        const typeLabel = card.type === 'patho' ? 'Pathologie' : 
                          card.type === 'drug' ? 'Médicament' :
                          card.type === 'physio' ? 'Physiologie' : 'Donnée';
        
        const front = `
            <div style="font-family: sans-serif; text-align: center;">
                <span style="font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 1px;">${typeLabel}</span>
                <h2>${card.title}</h2>
            </div>
        `;

        const htmlContent = await Promise.resolve(marked.parse(card.content || ''));
        const back = `
            <div style="font-family: sans-serif; text-align: left; line-height: 1.5;">
                <hr style="border: 0; border-top: 1px solid #ccc; margin: 15px 0;">
                ${htmlContent}
            </div>
        `;

        const tags = [];
        if (card.type) tags.push(card.type);
        if (card.tags && Array.isArray(card.tags)) {
            tags.push(...card.tags);
        }

        d.addNote(m.note([front, back], tags));
    }

    const p = new Package();
    p.setSqlJs(SQL);
    p.addDeck(d);

    // .export() returns Uint8Array or ArrayBuffer depending on jszip config in genanki-js
    // but typically it's an ArrayBuffer/Blob compatible
    const zipBuffer = await p.export();
    const blob = new Blob([zipBuffer], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${deckName.replace(/\s+/g, '_')}.apkg`;
    a.click();
    URL.revokeObjectURL(url);
}
