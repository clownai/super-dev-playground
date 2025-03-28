const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld(
    'terminal',
    {
        // Terminal management
        create: ({ cols, rows, cwd }) => ipcRenderer.invoke('terminal-create', { cols, rows, cwd }),
        resize: (terminalId, cols, rows) => ipcRenderer.invoke('terminal-resize', { terminalId, cols, rows }),
        write: (terminalId, data) => ipcRenderer.invoke('terminal-write', { terminalId, data }),
        close: (terminalId) => ipcRenderer.invoke('terminal-close', { terminalId }),
        cd: (terminalId, directory) => ipcRenderer.invoke('terminal-cd', { terminalId, directory }),
        execute: (terminalId, command) => ipcRenderer.invoke('terminal-execute', { terminalId, command }),

        // Event listeners
        onData: (terminalId, callback) => {
            const channel = `terminal-data-${terminalId}`;
            const subscription = (_event, data) => callback(data);
            ipcRenderer.on(channel, subscription);
            return () => {
                ipcRenderer.removeListener(channel, subscription);
            };
        }
    }
); 