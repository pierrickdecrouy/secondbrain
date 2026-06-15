import JSZip from 'jszip';
import initSqlJs from 'sql.js';
import type { Card } from './types';
import { v4 as uuidv4 } from 'uuid';

export async function importAnkiPackage(file: File, onProgress: (msg: string) => void): Promise<Card[]> {
    onProgress("Décompression de l'archive...");
    const zip = new JSZip();
    const contents = await zip.loadAsync(file);

    const dbFile = contents.file('collection.anki2') || contents.file('collection.anki21');
    if (!dbFile) {
        throw new Error("Le fichier ne semble pas être un paquet Anki valide (collection.anki2 introuvable).");
    }

    onProgress("Chargement du moteur SQLite...");
    // Load sql.js wasm from CDN to avoid build setup issues
    const SQL = await initSqlJs({
        locateFile: () => 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/sql-wasm.wasm'
    });

    onProgress("Lecture de la base de données...");
    const dbBuffer = await dbFile.async('uint8array');
    const db = new SQL.Database(dbBuffer);

    onProgress("Extraction des fiches...");
    
    // Notes contains the actual text data.
    // Fields are separated by \x1f
    const result = db.exec("SELECT id, flds, tags FROM notes");
    
    if (result.length === 0) {
        throw new Error("Aucune fiche trouvée dans ce paquet.");
    }

    const rows = result[0].values;
    const cards: Card[] = [];
    const now = Date.now();

    for (const row of rows) {
        const [, flds, tags] = row as [number, string, string];
        const fields = flds.split('\x1f');
        
        if (fields.length < 1) continue;
        
        let title = fields[0].replace(/<[^>]+>/g, '').trim(); // Remove HTML from title
        if (title.length > 80) {
            title = title.substring(0, 80) + '...';
        }
        if (!title) title = "Fiche Anki sans titre";

        let contentHtml = fields.slice(1).join('<br><br>');
        if (fields.length === 1) {
            contentHtml = fields[0];
        }

        // Clean up Anki media references to avoid broken images since we don't import media
        contentHtml = contentHtml.replace(/<img[^>]*>/gi, '[Image ignorée]');
        contentHtml = contentHtml.replace(/\[sound:[^\]]*\]/gi, '[Son ignoré]');

        // Extract Anki tags (separated by spaces)
        const parsedTags = tags ? tags.split(' ').filter(t => t.trim().length > 0) : [];
        parsedTags.push('Anki'); // Add a default tag to easily find imported cards

        const card: Card = {
            id: uuidv4(),
            title,
            subtitle: 'Fiche Anki',
            type: 'data', // Default category for imported items
            content: contentHtml.replace(/<[^>]+>/g, ' ').substring(0, 200),
            details: contentHtml,
            createdAt: now,
            updatedAt: now,
            progress: {
                status: 'new',
                interval: 0,
                easeFactor: 2.5,
                dueDate: new Date().toISOString(),
                lapses: 0,
                step: 0
            },
            tags: parsedTags
        };

        cards.push(card);
    }

    db.close();
    onProgress(`Importation terminée : ${cards.length} fiches récupérées.`);
    return cards;
}
