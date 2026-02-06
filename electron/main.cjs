const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const isDev = require('electron-is-dev');

let mainWindow;

// Determine the user data path for storing the database
const userDataPath = app.getPath('userData');
const dbPath = path.join(userDataPath, 'pharma-brain-db.json');

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
        // Send save request to renderer before closing
        if (mainWindow) {
            mainWindow.webContents.send('request-save');
        }
    });
}

// IPC Handlers for file operations
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

ipcMain.handle('save-cards', async (event, cards) => {
    try {
        fs.writeFileSync(dbPath, JSON.stringify(cards, null, 2), 'utf-8');
        return { success: true };
    } catch (error) {
        console.error('Error saving cards:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('get-db-path', async () => {
    return dbPath;
});

// App lifecycle
app.whenReady().then(createWindow);

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
