const { contextBridge, ipcRenderer } = require('electron');

// Helper function to create event subscription cleanup
const createEventSubscription = (channel, callback) => {
    const subscription = (_event, ...args) => callback(...args);
    ipcRenderer.on(channel, subscription);
    return () => {
        ipcRenderer.removeListener(channel, subscription);
    };
};

// Expose terminal API to renderer
contextBridge.exposeInMainWorld(
    'terminal',
    {
        // Terminal management
        create: async ({ cols, rows, cwd } = {}) => {
            try {
                return await ipcRenderer.invoke('terminal-create', { cols, rows, cwd });
            } catch (error) {
                console.error('Failed to create terminal:', error);
                throw error;
            }
        },

        resize: async (terminalId, cols, rows) => {
            try {
                return await ipcRenderer.invoke('terminal-resize', { terminalId, cols, rows });
            } catch (error) {
                console.error(`Failed to resize terminal ${terminalId}:`, error);
                throw error;
            }
        },

        write: async (terminalId, data) => {
            try {
                return await ipcRenderer.invoke('terminal-write', { terminalId, data });
            } catch (error) {
                console.error(`Failed to write to terminal ${terminalId}:`, error);
                throw error;
            }
        },

        close: async (terminalId) => {
            try {
                return await ipcRenderer.invoke('terminal-close', { terminalId });
            } catch (error) {
                console.error(`Failed to close terminal ${terminalId}:`, error);
                throw error;
            }
        },

        cd: async (terminalId, directory) => {
            try {
                return await ipcRenderer.invoke('terminal-cd', { terminalId, directory });
            } catch (error) {
                console.error(`Failed to change directory in terminal ${terminalId}:`, error);
                throw error;
            }
        },

        execute: (terminalId, command) => ipcRenderer.invoke('terminal-execute', { terminalId, command }),

        // Event listeners
        onData: (terminalId, callback) => {
            const channel = `terminal-data-${terminalId}`;
            return createEventSubscription(channel, callback);
        },

        onExit: (terminalId, callback) => {
            const channel = `terminal-exit-${terminalId}`;
            return createEventSubscription(channel, callback);
        }
    }
); 