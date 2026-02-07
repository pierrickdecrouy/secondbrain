const { app, BrowserWindow, ipcMain, protocol } = require('electron');
const path = require('path');
const fs = require('fs');
const isDev = require('electron-is-dev');
const crypto = require('crypto');

let mainWindow;

// Determine the user data path
const userDataPath = app.getPath('userData');
const dbPath = path.join(userDataPath, 'pharma-brain-db.json');
const imagesPath = path.join(userDataPath, 'images');

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
        titleBarStyle: 'hiddenInset', // macOS style
        show: false,
    });

    // Load the app
    const startUrl = isDev
        ? 'http://localhost:5174'
        : `file://${path.join(__dirname, '../dist/index.html')}`;

    mainWindow.loadURL(startUrl);

    // Show window when ready
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
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
        if (fs.existsSync(dbPath)) {
            const data = fs.readFileSync(dbPath, 'utf-8');
            return JSON.parse(data);
        }
        return [];
    } catch (error) {
        console.error('Error loading cards:', error);
        return [];
    }
});

// Save Handler with Backup Rotation
ipcMain.handle('save-cards', async (event, cards) => {
    try {
        const MAX_BACKUPS = 3;
        // Rotate backups
        for (let i = MAX_BACKUPS - 1; i >= 1; i--) {
            const older = `${dbPath}.bak${i + 1}`;
            const newer = i === 1 ? dbPath : `${dbPath}.bak${i}`;
            if (fs.existsSync(newer)) {
                try {
                    fs.copyFileSync(newer, older);
                } catch (e) {
                    // Ignore missing files
                }
            }
        }
        // Backup current
        if (fs.existsSync(dbPath)) {
            try {
                fs.copyFileSync(dbPath, `${dbPath}.bak1`);
            } catch (e) {
                // Ignore
            }
        }

        fs.writeFileSync(dbPath, JSON.stringify(cards, null, 2), 'utf-8');
        return { success: true };
    } catch (error) {
        console.error('Error saving cards:', error);
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
    return dbPath;
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

// App Lifecycle
app.whenReady().then(() => {
    // Register custom protocol
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

    createWindow();
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
