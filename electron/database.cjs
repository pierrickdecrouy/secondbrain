const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

let db;
let isExternalWorkspaceActive = false;

function initDB(dbPath) {
    if (db) {
        db.close();
    }

    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    db = new Database(dbPath); // verbose: console.log
    db.pragma('journal_mode = WAL');

    // Create Main Cards Table (for local cards and metadata of external cards)
    db.exec(`
    CREATE TABLE IF NOT EXISTS cards (
        id TEXT PRIMARY KEY,
        type TEXT,
        title TEXT,
        subtitle TEXT,
        content TEXT,
        tags TEXT,
        metadata TEXT,
        createdAt INTEGER,
        updatedAt INTEGER
    );
    `);

    // Add Virtual Column for FSRS next_review and create Index
    try {
        db.exec(`ALTER TABLE cards ADD COLUMN next_review DATETIME AS (json_extract(metadata, '$.fsrs.next_review')) VIRTUAL;`);
    } catch (e) {}

    // Create Index on Type for filtering
    db.exec(`CREATE INDEX IF NOT EXISTS idx_cards_type ON cards(type);`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_next_review ON cards(next_review);`);

    // Create FTS5 Virtual Table for full-text search
    db.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS cards_fts USING fts5(
        id UNINDEXED,
        title,
        subtitle,
        content,
        tags,
        tokenize='porter unicode61'
    );
    `);

    // Create Triggers to keep FTS5 table in sync with cards table
    db.exec(`
    CREATE TRIGGER IF NOT EXISTS cards_ai AFTER INSERT ON cards BEGIN
        INSERT INTO cards_fts(rowid, id, title, subtitle, content, tags)
        VALUES (new.rowid, new.id, new.title, new.subtitle, new.content, new.tags);
    END;
    
    CREATE TRIGGER IF NOT EXISTS cards_ad AFTER DELETE ON cards BEGIN
        INSERT INTO cards_fts(cards_fts, rowid, id, title, subtitle, content, tags)
        VALUES('delete', old.rowid, old.id, old.title, old.subtitle, old.content, old.tags);
    END;
    
    CREATE TRIGGER IF NOT EXISTS cards_au AFTER UPDATE ON cards BEGIN
        INSERT INTO cards_fts(cards_fts, rowid, id, title, subtitle, content, tags)
        VALUES('delete', old.rowid, old.id, old.title, old.subtitle, old.content, old.tags);
        INSERT INTO cards_fts(rowid, id, title, subtitle, content, tags)
        VALUES (new.rowid, new.id, new.title, new.subtitle, new.content, new.tags);
    END;
    `);

    isExternalWorkspaceActive = false;
}

function switchWorkspace(dbPath) {
    if (!db) return;

    // 1. Detach previously attached external workspace if any
    try {
        db.exec(`DROP VIEW IF EXISTS temp.ext_cards;`);
        db.exec(`DROP TABLE IF EXISTS temp.ext_fts;`);
        db.exec(`DETACH DATABASE ext;`);
    } catch (e) {
        // Ignore if 'ext' was not attached
    }
    
    isExternalWorkspaceActive = false;

    // 2. If it's the main db, we just stop here (already initialized)
    if (db.name === dbPath || dbPath.endsWith('pharma-brain.db')) {
        return;
    }

    // 3. Attach the external database
    db.exec(`ATTACH DATABASE '${dbPath}' AS ext;`);
    isExternalWorkspaceActive = true;

    // 4. Create the Virtual View merging external read-only content with local mutable metadata
    // We assume external databases use the 'documents' table scheme from IngestionSQL
    db.exec(`
        CREATE TEMP VIEW ext_cards AS
        SELECT 
            d.id, 
            d.content_type as type, 
            d.title, 
            d.course_name as subtitle, 
            d.content, 
            COALESCE(c.tags, '[]') as tags, 
            COALESCE(c.metadata, '{}') as metadata, 
            d.created_at as createdAt, 
            COALESCE(c.updatedAt, d.created_at) as updatedAt
        FROM ext.documents d
        LEFT JOIN main.cards c ON d.id = c.id;
    `);

    // 5. Create a temporary FTS5 table for fast searching on the external workspace
    db.exec(`
        CREATE VIRTUAL TABLE temp.ext_fts USING fts5(
            id UNINDEXED,
            title,
            subtitle,
            content,
            tags,
            tokenize='porter unicode61'
        );
    `);

    // Populate FTS5 table from the view
    db.exec(`
        INSERT INTO temp.ext_fts (rowid, id, title, subtitle, content, tags)
        SELECT rowid, id, title, subtitle, content, tags FROM temp.ext_cards;
    `);
}

// Transform DB row to Card object
function rowToCard(row) {
    if (!row) return null;
    const metadata = row.metadata ? JSON.parse(row.metadata) : {};
    return {
        id: row.id,
        type: row.type || 'concept',
        title: row.title || '',
        subtitle: row.subtitle || '',
        content: row.content || '',
        tags: row.tags ? JSON.parse(row.tags) : [],
        createdAt: row.createdAt || 0,
        updatedAt: row.updatedAt || 0,
        ...metadata // details, manualConnections, suppressedConnections, imageUrl
    };
}

// Transform Card object to DB parameters (always saves to main.cards)
function cardToParams(card) {
    const { id, type, title, subtitle, content, tags, createdAt, updatedAt, ...rest } = card;
    return {
        id,
        type: type || 'concept',
        title: title || '',
        subtitle: subtitle || '',
        content: content || '',
        tags: JSON.stringify(tags || []),
        metadata: JSON.stringify(rest),
        createdAt: createdAt || Date.now(),
        updatedAt: updatedAt || Date.now()
    };
}

function getAllCards() {
    // If an external workspace is active, read from the merged view
    const query = isExternalWorkspaceActive ? 'SELECT * FROM temp.ext_cards' : 'SELECT * FROM main.cards';
    const stmt = db.prepare(query);
    const rows = stmt.all();
    return rows.map(rowToCard);
}

function saveCardsTransaction(cards, options = {}) {
    const { allowDeleteAll = false } = options;
    
    // Always insert/update into the main 'cards' table to preserve local progress
    const insert = db.prepare(`
        INSERT OR REPLACE INTO main.cards (id, type, title, subtitle, content, tags, metadata, createdAt, updatedAt)
        VALUES (@id, @type, @title, @subtitle, @content, @tags, @metadata, @createdAt, @updatedAt)
    `);

    if (cards.length === 0 && !allowDeleteAll) {
        throw new Error('[DB] Refusing full delete from empty payload without explicit allowDeleteAll.');
    }

    const transaction = db.transaction((cards) => {
        // 1. Upsert all current cards
        for (const card of cards) {
            insert.run(cardToParams(card));
        }

        // Only process deletions if we are on the main workspace
        // We shouldn't delete local progress just because an external DB changed its cards
        if (!isExternalWorkspaceActive) {
            if (cards.length > 0) {
                const keepIds = new Set(cards.map(c => c.id));
                const existingIdsStmt = db.prepare('SELECT id FROM main.cards');
                const existingIds = existingIdsStmt.all().map(row => row.id);
                
                const idsToDelete = existingIds.filter(id => !keepIds.has(id));
                if (idsToDelete.length > 0) {
                    const chunkSize = 900;
                    for (let i = 0; i < idsToDelete.length; i += chunkSize) {
                        const chunk = idsToDelete.slice(i, i + chunkSize);
                        const placeholders = chunk.map(() => '?').join(',');
                        const deleteStmt = db.prepare(`DELETE FROM main.cards WHERE id IN (${placeholders})`);
                        deleteStmt.run(...chunk);
                    }
                }
            } else {
                db.prepare('DELETE FROM main.cards').run();
            }
        }
    });

    transaction(cards);
}

function upsertCard(card) {
    const stmt = db.prepare(`
        INSERT OR REPLACE INTO main.cards (id, type, title, subtitle, content, tags, metadata, createdAt, updatedAt)
        VALUES (@id, @type, @title, @subtitle, @content, @tags, @metadata, @createdAt, @updatedAt)
    `);
    stmt.run(cardToParams(card));
}

function deleteCard(id) {
    if (isExternalWorkspaceActive) {
        throw new Error('[DB] Impossible de supprimer une fiche d\'un pack de contenu externe.');
    }
    const stmt = db.prepare('DELETE FROM main.cards WHERE id = ?');
    stmt.run(id);
}

function importCardsTransaction(cards) {
    const insert = db.prepare(`
        INSERT OR REPLACE INTO main.cards (id, type, title, subtitle, content, tags, metadata, createdAt, updatedAt)
        VALUES (@id, @type, @title, @subtitle, @content, @tags, @metadata, @createdAt, @updatedAt)
    `);

    const transaction = db.transaction((cards) => {
        for (const card of cards) {
            insert.run(cardToParams(card));
        }
    });

    transaction(cards);
}

function searchCardsFTS(query, limit = 50) {
    if (!query || !query.trim()) return [];
    
    const sanitized = query.replace(/[^\w\s"'-]/gi, ' ').trim();
    if (!sanitized) return [];

    const terms = sanitized.split(/\s+/).map(t => `"${t}"*`).join(' AND ');
    
    try {
        const tableName = isExternalWorkspaceActive ? 'temp.ext_fts' : 'main.cards_fts';
        const stmt = db.prepare(`
            SELECT id, snippet(${tableName}, -1, '<b>', '</b>', '...', 64) as highlight 
            FROM ${tableName} 
            WHERE ${tableName} MATCH ? 
            ORDER BY rank 
            LIMIT ?
        `);
        return stmt.all(terms, limit);
    } catch (e) {
        return [];
    }
}

module.exports = {
    initDB,
    switchWorkspace,
    getAllCards,
    saveCardsTransaction,
    importCardsTransaction,
    upsertCard,
    deleteCard,
    searchCardsFTS
};
