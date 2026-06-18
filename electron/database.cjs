const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const { app } = require('electron');

let db;

function initDB(dbPath) {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    db = new Database(dbPath); // verbose: console.log

    // Enable WAL mode for better concurrency/performance
    db.pragma('journal_mode = WAL');

    // Create Cards Table
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
    } catch (e) {
        // Column might already exist, ignore error
    }

    // Create Index on Type for filtering
    db.exec(`CREATE INDEX IF NOT EXISTS idx_cards_type ON cards(type);`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_next_review ON cards(next_review);`);

    console.log(`[DB] Initialized at ${dbPath}`);
}

// Transform DB row to Card object
function rowToCard(row) {
    if (!row) return null;
    const metadata = row.metadata ? JSON.parse(row.metadata) : {};
    return {
        id: row.id,
        type: row.type,
        title: row.title,
        subtitle: row.subtitle || '',
        content: row.content || '',
        tags: row.tags ? JSON.parse(row.tags) : [],
        createdAt: row.createdAt || 0,
        updatedAt: row.updatedAt || 0,
        ...metadata // details, manualConnections, suppressedConnections, imageUrl
    };
}

// Transform Card object to DB parameters
function cardToParams(card) {
    const { id, type, title, subtitle, content, tags, createdAt, updatedAt, ...rest } = card;
    return {
        id,
        type,
        title,
        subtitle: subtitle || '',
        content: content || '',
        tags: JSON.stringify(tags || []),
        metadata: JSON.stringify(rest),
        createdAt: createdAt || Date.now(),
        updatedAt: updatedAt || Date.now()
    };
}

function getAllCards() {
    const stmt = db.prepare('SELECT * FROM cards');
    const rows = stmt.all();
    return rows.map(rowToCard);
}

function saveCardsTransaction(cards, options = {}) {
    const { allowDeleteAll = false } = options;

    const insert = db.prepare(`
        INSERT OR REPLACE INTO cards (id, type, title, subtitle, content, tags, metadata, createdAt, updatedAt)
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

        if (cards.length > 0) {
            // Find ids to delete instead of using NOT IN with thousands of params
            // which crashes SQLite due to SQLITE_MAX_VARIABLE_NUMBER
            const keepIds = new Set(cards.map(c => c.id));
            const existingIdsStmt = db.prepare('SELECT id FROM cards');
            const existingIds = existingIdsStmt.all().map(row => row.id);
            
            const deleteStmt = db.prepare('DELETE FROM cards WHERE id = ?');
            for (const id of existingIds) {
                if (!keepIds.has(id)) {
                    deleteStmt.run(id);
                }
            }
        } else {
            db.prepare('DELETE FROM cards').run();
        }
    });

    transaction(cards);
}

function upsertCard(card) {
    const stmt = db.prepare(`
        INSERT OR REPLACE INTO cards (id, type, title, subtitle, content, tags, metadata, createdAt, updatedAt)
        VALUES (@id, @type, @title, @subtitle, @content, @tags, @metadata, @createdAt, @updatedAt)
    `);
    stmt.run(cardToParams(card));
}

function deleteCard(id) {
    const stmt = db.prepare('DELETE FROM cards WHERE id = ?');
    stmt.run(id);
}

function importCardsTransaction(cards) {
    const insert = db.prepare(`
        INSERT OR REPLACE INTO cards (id, type, title, subtitle, content, tags, metadata, createdAt, updatedAt)
        VALUES (@id, @type, @title, @subtitle, @content, @tags, @metadata, @createdAt, @updatedAt)
    `);

    const transaction = db.transaction((cards) => {
        for (const card of cards) {
            insert.run(cardToParams(card));
        }
    });

    transaction(cards);
    console.log(`[DB] Imported ${cards.length} cards safely (Upsert only).`);
}

module.exports = {
    initDB,
    getAllCards,
    saveCardsTransaction,
    importCardsTransaction,
    upsertCard,
    deleteCard
};
