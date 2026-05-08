const { app, BrowserWindow, ipcMain, protocol, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const isDev = require('electron-is-dev');
const crypto = require('crypto');
const db = require('./database.cjs');

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

// Initialize SQLite
try {
    db.initDB(sqlitePath);
} catch (e) {
    console.error("Failed to initialize SQLite Database:", e);
    dialog.showErrorBox('Database Error', `Failed to initialize database:\n${e.message}`);
}

// Ensure images directory exists
if (!fs.existsSync(imagesPath)) {
    fs.mkdirSync(imagesPath, { recursive: true });
}

function readSettings() {
    try {
        if (!fs.existsSync(settingsPath)) return {};
        const raw = fs.readFileSync(settingsPath, 'utf-8');
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (error) {
        console.error('Error reading settings:', error);
        return {};
    }
}

function writeSettings(settings) {
    try {
        fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf-8');
        return { success: true };
    } catch (error) {
        console.error('Error writing settings:', error);
        return { success: false, error: error.message };
    }
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
        titleBarStyle: 'hiddenInset', // macOS style
        show: false,
    });

    // Load the app
    // IMPORTANT: use !app.isPackaged to reliably detect dev mode
    if (!app.isPackaged) {
        console.log('[Main] Loading development URL');
        mainWindow.loadURL('http://localhost:5174').catch(err => {
            dialog.showErrorBox('Dev URL Load Failed', err.message);
        });
    } else {
        console.log('[Main] Loading production file');

        try {
            // PATH RESOLUTION LOGIC
            const strategies = [
                { name: 'appPath', path: path.join(app.getAppPath(), 'dist/index.html') },
                { name: 'dirname', path: path.join(__dirname, '../dist/index.html') },
                { name: 'resources', path: path.join(process.resourcesPath, 'app/dist/index.html') }
            ];

            // Use standard loadFile with the primary strategy's confirmed path (or default)
            const bestPath = strategies.find(s => fs.existsSync(s.path))?.path || strategies[0].path;

            console.log(`[Main] Loading: ${bestPath}`);

            mainWindow.loadFile(bestPath).catch(err => {
                console.error('[Main] Failed to load file:', err);
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
            console.log('[Migration] Found Legacy JSON DB, migrating to SQLite...');
            try {
                const jsonData = fs.readFileSync(legacyDbPath, 'utf-8');
                const jsonCards = JSON.parse(jsonData);
                if (Array.isArray(jsonCards) && jsonCards.length > 0) {
                    db.saveCardsTransaction(jsonCards);
                    cards = db.getAllCards(); // Reload from DB
                    console.log(`[Migration] Successfully migrated ${cards.length} cards.`);
                }
            } catch (err) {
                console.error('[Migration] Failed to migrate JSON:', err);
            }
        }
        return cards;
    } catch (error) {
        console.error('Error loading cards from DB:', error);
        return [];
    }
});

// Import Handler (Safe Upsert)
ipcMain.handle('import-cards', async (event, cards) => {
    try {
        db.importCardsTransaction(cards);
        return { success: true };
    } catch (error) {
        console.error('Error importing cards to DB:', error);
        return { success: false, error: error.message };
    }
});

// Save Handler (SQLite)
ipcMain.handle('save-cards', async (event, cards) => {
    try {
        db.saveCardsTransaction(cards);
        return { success: true };
    } catch (error) {
        console.error('Error saving cards to DB:', error);
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
        console.log(`Saved image to ${filePath}`);

        // Return the protocol URL
        return `safe-file://${filename}`;
    } catch (error) {
        console.error('Error saving image:', error);
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
        console.error('Error loading abbreviations:', error);
        return {};
    }
});

ipcMain.handle('save-abbreviations', async (event, abbreviations) => {
    try {
        fs.writeFileSync(abbreviationsPath, JSON.stringify(abbreviations, null, 2), 'utf-8');
        return { success: true };
    } catch (error) {
        console.error('Error saving abbreviations:', error);
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
const vectorIndexPath = path.join(userDataPath, 'vector-index.bin');

ipcMain.handle('load-vector-index', async () => {
    try {
        if (fs.existsSync(vectorIndexPath)) {
            const buffer = fs.readFileSync(vectorIndexPath);
            return new Uint8Array(buffer);
        }
        return null;
    } catch (error) {
        console.error('Error loading vector index:', error);
        return null;
    }
});

ipcMain.handle('save-vector-index', async (event, buffer) => {
    try {
        fs.writeFileSync(vectorIndexPath, Buffer.from(buffer));
        return { success: true };
    } catch (error) {
        console.error('Error saving vector index:', error);
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
                console.error('Blocked safe-file access outside of images directory');
                return callback({ error: -2 }); // ACCESS_DENIED
            }
            callback({ path: safePath });
        } catch (error) {
            console.error('Failed to register protocol', error);
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
                    console.log(`[Download] Redirect to: ${redirectUrl}`);
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
                        // Verify file is not too small (corrupted)
                        const stats = fs.statSync(dest);
                        if (stats.size < 1000000) { // Less than 1MB = likely error page
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
