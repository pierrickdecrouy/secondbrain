const { contextBridge, ipcRenderer } = require('electron');

// Expose safe APIs to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
    // Load cards from disk
    loadCards: () => ipcRenderer.invoke('load-cards'),

    // Save cards to disk
    saveCards: (cards) => ipcRenderer.invoke('save-cards', cards),

    // Get database path (for debugging)
    getDbPath: () => ipcRenderer.invoke('get-db-path'),

    // Save image to disk
    saveImage: (data) => ipcRenderer.invoke('save-image', data),

    // Listen for save request before app closes
    onRequestSave: (callback) => ipcRenderer.on('request-save', callback),

    // Learned abbreviations
    loadAbbreviations: () => ipcRenderer.invoke('load-abbreviations'),
    saveAbbreviations: (abbrevs) => ipcRenderer.invoke('save-abbreviations', abbrevs),

    // Check if running in Electron
    isElectron: true,
});
