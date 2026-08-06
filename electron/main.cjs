const { app, BrowserWindow, ipcMain, protocol, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const isDev = require('electron-is-dev');
const crypto = require('crypto');
const db = require('./database.cjs');
const { generatePdf } = require('./pdfGenerator.cjs');

// Suppress security warnings in dev mode (unsafe-eval is needed for Vite)
if (isDev) {
    process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';
}

// GLOBAL ERROR HANDLER
process.on('uncaughtException', (error) => {
    dialog.showErrorBox('Main Process Error', `Uncaught exception:\n${error.message}\n${error.stack}`);
});

let mainWindow;

// Determine the user data path
const userDataPath = app.getPath('userData');
const legacyDbPath = path.join(userDataPath, 'pharma-brain-db.json');
const sqlitePath = path.join(userDataPath, 'pharma-brain.db');
const imagesPath = path.join(userDataPath, 'images');
const settingsPath = path.join(userDataPath, 'settings.json');

// Settings management
function readSettings() {
    try {
        if (!fs.existsSync(settingsPath)) return {};
        const raw = fs.readFileSync(settingsPath, 'utf-8');
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (error) {
        return {};
    }
}

function writeSettings(settings) {
    try {
        fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf-8');
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Workspaces directory
const workspacesPath = path.join(userDataPath, 'workspaces');
if (!fs.existsSync(workspacesPath)) {
    fs.mkdirSync(workspacesPath, { recursive: true });
}

// Initialize SQLite
try {
    db.initDB(sqlitePath);
    
    const settings = readSettings();
    const activeWorkspace = settings.activeWorkspace || 'pharma-brain.db';
    if (activeWorkspace !== 'pharma-brain.db') {
        const activeDbPath = path.join(workspacesPath, activeWorkspace);
        if (fs.existsSync(activeDbPath)) {
            db.switchWorkspace(activeDbPath);
        } else {
            // Fallback if workspace was deleted
            const s = readSettings();
            s.activeWorkspace = 'pharma-brain.db';
            writeSettings(s);
        }
    }
} catch (e) {
    dialog.showErrorBox('Database Error', `Failed to initialize database:\n${e.message}`);
}

// Ensure images directory exists
if (!fs.existsSync(imagesPath)) {
    fs.mkdirSync(imagesPath, { recursive: true });
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 900,
        minHeight: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.cjs'),
            contextIsolation: true,
            nodeIntegration: false,
        },
        backgroundColor: '#0d1117',
        titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'hidden',
        titleBarOverlay: process.platform !== 'darwin' ? {
            color: '#0d1117',
            symbolColor: '#ffffff'
        } : false,
        show: false,
    });

    // Load the app
    // IMPORTANT: use !app.isPackaged to reliably detect dev mode
    if (!app.isPackaged) {
        mainWindow.loadURL('http://localhost:5174').catch(err => {
            dialog.showErrorBox('Dev URL Load Failed', err.message);
        });
    } else {
        try {
            // PATH RESOLUTION LOGIC
            const strategies = [
                { name: 'appPath', path: path.join(app.getAppPath(), 'dist/index.html') },
                { name: 'dirname', path: path.join(__dirname, '../dist/index.html') },
                { name: 'resources', path: path.join(process.resourcesPath, 'app/dist/index.html') }
            ];

            // Use standard loadFile with the primary strategy's confirmed path (or default)
            const bestPath = strategies.find(s => fs.existsSync(s.path))?.path || strategies[0].path;
            mainWindow.loadFile(bestPath).catch(err => {
                dialog.showErrorBox('Failed to load application',
                    `Error loading: ${bestPath}\n\nDetails: ${err.message}\n\nStack: ${err.stack}`
                );
            });
        } catch (e) {
            dialog.showErrorBox('Main Process Crash', `Error in path resolution logic:\n${e.message}\n${e.stack}`);
        }
    }

    // Show window when ready
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        // mainWindow.webContents.openDevTools();
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    // Handle save request before window closes
    mainWindow.on('close', (e) => {
        if (mainWindow) {
            mainWindow.webContents.send('request-save');
        }
    });

    // Open external links in browser
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        require('electron').shell.openExternal(url);
        return { action: 'deny' };
    });
}

// IPC Handlers
ipcMain.handle('load-cards', async () => {
    try {
        let cards = db.getAllCards();

        // Migration: If SQLite is empty but Legacy JSON exists
        if (cards.length === 0 && fs.existsSync(legacyDbPath)) {
            try {
                const jsonData = fs.readFileSync(legacyDbPath, 'utf-8');
                const jsonCards = JSON.parse(jsonData);
                if (Array.isArray(jsonCards) && jsonCards.length > 0) {
                    db.saveCardsTransaction(jsonCards);
                    cards = db.getAllCards(); // Reload from DB
                }
            } catch (err) {
            }
        }
        return cards;
    } catch (error) {
        return [];
    }
});

// Import Handler (Safe Upsert)
ipcMain.handle('import-cards', async (event, cards) => {
    try {
        db.importCardsTransaction(cards);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// Save Handler (SQLite)
ipcMain.handle('save-cards', async (event, cards) => {
    try {
        db.saveCardsTransaction(cards);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// FTS5 Search Handler
ipcMain.handle('search-cards-fts', async (event, query, limit = 50) => {
    try {
        return db.searchCardsFTS(query, limit);
    } catch (error) {
        return [];
    }
});

// Workspace Handlers
ipcMain.handle('get-workspaces', async () => {
    try {
        const files = fs.existsSync(workspacesPath) ? fs.readdirSync(workspacesPath) : [];
        const sqliteFiles = files.filter(f => f.endsWith('.db') || f.endsWith('.sqlite'));
        const workspaces = [
            { id: 'pharma-brain.db', name: 'Base Principale' },
            ...sqliteFiles.map(f => ({ id: f, name: f.replace(/\.(db|sqlite)$/, '') }))
        ];
        
        const settings = readSettings();
        const activeWorkspace = settings.activeWorkspace || 'pharma-brain.db';
        
        return { workspaces, activeWorkspace };
    } catch (e) {
        return { workspaces: [{ id: 'pharma-brain.db', name: 'Base Principale' }], activeWorkspace: 'pharma-brain.db' };
    }
});

ipcMain.handle('switch-workspace', async (event, workspaceId) => {
    try {
        let dbPath;
        if (workspaceId === 'pharma-brain.db') {
            dbPath = sqlitePath;
        } else {
            dbPath = path.join(workspacesPath, workspaceId);
        }
        
        if (workspaceId !== 'pharma-brain.db' && !fs.existsSync(dbPath)) {
            throw new Error(`Le fichier ${workspaceId} n'existe pas.`);
        }
        
        db.switchWorkspace(dbPath);
        
        const settings = readSettings();
        settings.activeWorkspace = workspaceId;
        writeSettings(settings);
        
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// Asset Handler
ipcMain.handle('save-image', async (event, { buffer, name }) => {
    try {
        const ext = path.extname(name) || '.png';
        // Create hash from buffer content
        const hash = crypto.createHash('md5').update(Buffer.from(buffer)).digest('hex');
        const filename = `${hash}${ext}`;
        const filePath = path.join(imagesPath, filename);

        // Write file
        fs.writeFileSync(filePath, Buffer.from(buffer));
        // Return the protocol URL
        return `safe-file://${filename}`;
    } catch (error) {
        throw error;
    }
});

ipcMain.handle('get-db-path', async () => {
    return sqlitePath;
});

// Learned abbreviations storage
const abbreviationsPath = path.join(userDataPath, 'learned-abbreviations.json');

ipcMain.handle('load-abbreviations', async () => {
    try {
        if (fs.existsSync(abbreviationsPath)) {
            const data = fs.readFileSync(abbreviationsPath, 'utf-8');
            return JSON.parse(data);
        }
        return {};
    } catch (error) {
        return {};
    }
});

ipcMain.handle('save-abbreviations', async (event, abbreviations) => {
    try {
        fs.writeFileSync(abbreviationsPath, JSON.stringify(abbreviations, null, 2), 'utf-8');
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// Generic settings storage (renderer preferences/state)
ipcMain.handle('load-setting', async (event, key) => {
    const settings = readSettings();
    return settings[key];
});

ipcMain.handle('save-setting', async (event, key, value) => {
    const settings = readSettings();
    settings[key] = value;
    return writeSettings(settings);
});

ipcMain.handle('remove-setting', async (event, key) => {
    const settings = readSettings();
    delete settings[key];
    return writeSettings(settings);
});

// Vector Index Persistence
const getVectorIndexPath = (shardId = 'global') => {
    // Sanitize shardId to prevent directory traversal
    const safeShardId = path.basename(shardId).replace(/[^a-zA-Z0-9_-]/g, '_');
    return path.join(userDataPath, `vector-index-${safeShardId}.bin`);
};

ipcMain.handle('load-vector-index', async (event, shardId = 'global') => {
    try {
        const filePath = getVectorIndexPath(shardId);
        if (fs.existsSync(filePath)) {
            const buffer = fs.readFileSync(filePath);
            return new Uint8Array(buffer);
        }
        return null;
    } catch (error) {
        return null;
    }
});

ipcMain.handle('save-vector-index', async (event, buffer, shardId = 'global') => {
    try {
        const filePath = getVectorIndexPath(shardId);
        fs.writeFileSync(filePath, Buffer.from(buffer));
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// App Lifecycle
app.whenReady().then(() => {
    // Register custom protocol for images
    protocol.registerFileProtocol('safe-file', (request, callback) => {
        const url = request.url.replace('safe-file://', '');
        const decodedUrl = decodeURI(url);
        try {
            // Prevent directory traversal
            const safePath = path.normalize(path.join(imagesPath, decodedUrl));
            if (!safePath.startsWith(imagesPath)) {
                return callback({ error: -2 }); // ACCESS_DENIED
            }
            callback({ path: safePath });
        } catch (error) {
            callback({ error: -2 });
        }
    });

    // Register custom protocol for models
    protocol.registerFileProtocol('local-model', (request, callback) => {
        const url = request.url.replace('local-model://', '');
        const decodedUrl = decodeURI(url);
        const modelsPath = path.join(userDataPath, 'models');

        try {
            const safePath = path.normalize(path.join(modelsPath, decodedUrl));
            if (!safePath.startsWith(modelsPath)) {
                return callback({ error: -2 });
            }
            callback({ path: safePath });
        } catch (error) {
            callback({ error: -2 });
        }
    });

    // Enforce COOP/COEP for SharedArrayBuffer (Wllama multi-threading)
    // const { session } = require('electron');
    // session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    //     callback({
    //         responseHeaders: {
    //             ...details.responseHeaders,
    //             'Cross-Origin-Opener-Policy': 'same-origin',
    //             'Cross-Origin-Embedder-Policy': 'require-corp',
    //         },
    //     });
    // });

    createWindow();
});

// Model Management
const modelsPath = path.join(userDataPath, 'models');
if (!fs.existsSync(modelsPath)) {
    fs.mkdirSync(modelsPath, { recursive: true });
}

ipcMain.handle('check-model-exists', async (event, filename) => {
    return fs.existsSync(path.join(modelsPath, filename));
});

ipcMain.handle('read-model-as-buffer', async (event, filename) => {
    const filePath = path.join(modelsPath, filename);
    if (!fs.existsSync(filePath)) {
        throw new Error('Model file not found');
    }
    const buffer = fs.readFileSync(filePath);
    return buffer;
});

ipcMain.handle('download-model', async (event, { url, filename }) => {
    const dest = path.join(modelsPath, filename);
    const https = require('https');
    const http = require('http');

    // Recursive function to follow redirects
    const downloadWithRedirects = (downloadUrl, maxRedirects = 5) => {
        return new Promise((resolve, reject) => {
            if (maxRedirects <= 0) {
                reject(new Error('Too many redirects'));
                return;
            }

            const protocol = downloadUrl.startsWith('https') ? https : http;

            protocol.get(downloadUrl, (response) => {
                // Handle redirects (301, 302, 307, 308)
                if ([301, 302, 307, 308].includes(response.statusCode)) {
                    const redirectUrl = response.headers.location;
                    if (!redirectUrl) {
                        reject(new Error('Redirect without location header'));
                        return;
                    }
                    downloadWithRedirects(redirectUrl, maxRedirects - 1)
                        .then(resolve)
                        .catch(reject);
                    return;
                }

                if (response.statusCode !== 200) {
                    reject(new Error(`Failed to download: ${response.statusCode}`));
                    return;
                }

                const file = fs.createWriteStream(dest);
                const totalSize = parseInt(response.headers['content-length'], 10) || 0;
                let downloaded = 0;

                response.on('data', (chunk) => {
                    downloaded += chunk.length;
                    if (mainWindow && totalSize > 0) {
                        mainWindow.webContents.send('model-download-progress', {
                            filename,
                            loaded: downloaded,
                            total: totalSize
                        });
                    }
                });

                response.pipe(file);

                file.on('finish', () => {
                    file.close(() => {
                        // Verify file integrity using content-length if available, else fallback to 1MB check
                        const stats = fs.statSync(dest);
                        if (totalSize > 0 && stats.size !== totalSize) {
                            fs.unlinkSync(dest);
                            reject(new Error(`Downloaded file corrupted: expected ${totalSize} bytes, got ${stats.size} bytes`));
                            return;
                        } else if (totalSize === 0 && stats.size < 1000000) {
                            fs.unlinkSync(dest);
                            reject(new Error('Downloaded file too small, likely corrupted'));
                            return;
                        }
                        resolve({ success: true, path: `local-model://${filename}` });
                    });
                });

                file.on('error', (err) => {
                    fs.unlink(dest, () => { });
                    reject(err);
                });
            }).on('error', (err) => {
                fs.unlink(dest, () => { });
                reject(err);
            });
        });
    };

    try {
        return await downloadWithRedirects(url);
    } catch (error) {
        // Clean up on error
        if (fs.existsSync(dest)) {
            fs.unlinkSync(dest);
        }
        throw error;
    }
});

ipcMain.handle('generate-course-pdf', async (event, courseData) => {
    return await generatePdf(courseData, mainWindow);
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
