const { contextBridge, ipcRenderer } = require('electron');

// Expose safe APIs to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
    // Load cards from disk
    loadCards: () => ipcRenderer.invoke('load-cards'),

    // Save cards to disk
    saveCards: (cards) => ipcRenderer.invoke('save-cards', cards),

    // Import cards (Safe Upsert)
    importCards: (cards) => ipcRenderer.invoke('import-cards', cards),

    // Search cards using FTS5 (Lexical)
    searchCardsFTS: (query, limit) => ipcRenderer.invoke('search-cards-fts', query, limit),

    // Get database path (for debugging)
    getDbPath: () => ipcRenderer.invoke('get-db-path'),

    // Save image to disk
    saveImage: (data) => ipcRenderer.invoke('save-image', data),

    // Listen for save request before app closes
    onRequestSave: (callback) => ipcRenderer.on('request-save', callback),

    // Workspaces
    getWorkspaces: () => ipcRenderer.invoke('get-workspaces'),
    switchWorkspace: (workspaceId) => ipcRenderer.invoke('switch-workspace', workspaceId),

    // Learned abbreviations
    loadAbbreviations: () => ipcRenderer.invoke('load-abbreviations'),
    saveAbbreviations: (abbrevs) => ipcRenderer.invoke('save-abbreviations', abbrevs),
    loadSetting: (key) => ipcRenderer.invoke('load-setting', key),
    saveSetting: (key, value) => ipcRenderer.invoke('save-setting', key, value),
    removeSetting: (key) => ipcRenderer.invoke('remove-setting', key),

    // Vector Index
    loadVectorIndex: (shardId) => ipcRenderer.invoke('load-vector-index', shardId),
    saveVectorIndex: (buffer, shardId) => ipcRenderer.invoke('save-vector-index', buffer, shardId),

    // AI Model Management
    checkModelExists: (filename) => ipcRenderer.invoke('check-model-exists', filename),
    downloadModel: (url, filename) => ipcRenderer.invoke('download-model', { url, filename }),
    readModelAsBuffer: (filename) => ipcRenderer.invoke('read-model-as-buffer', filename),
    onDownloadProgress: (callback) => ipcRenderer.on('model-download-progress', (event, data) => callback(data)),

    // Check if running in Electron
    isElectron: true,

    // PDF Export
    generateCoursePdf: (courseData) => ipcRenderer.invoke('generate-course-pdf', courseData),
});
