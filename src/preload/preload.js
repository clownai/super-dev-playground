const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// specific electron APIs through a secure bridge
contextBridge.exposeInMainWorld(
  'electronAPI', {
    // Theme management
    getTheme: () => ipcRenderer.invoke('get-theme'),
    setTheme: (theme) => ipcRenderer.invoke('set-theme', theme),
    
    // API Testing
    makeRequest: (requestData) => ipcRenderer.invoke('make-api-request', requestData),
    
    // Terminal operations
    sendTerminalInput: (input) => ipcRenderer.send('terminal-input', input),
    onTerminalOutput: (callback) => ipcRenderer.on('terminal-output', callback),
    
    // File operations
    readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
    writeFile: (filePath, content) => ipcRenderer.invoke('write-file', filePath, content),
    
    // App state
    saveState: (key, value) => ipcRenderer.invoke('save-state', key, value),
    loadState: (key) => ipcRenderer.invoke('load-state', key),
    
    // Window management
    minimizeWindow: () => ipcRenderer.send('minimize-window'),
    maximizeWindow: () => ipcRenderer.send('maximize-window'),
    closeWindow: () => ipcRenderer.send('close-window')
  }
); 