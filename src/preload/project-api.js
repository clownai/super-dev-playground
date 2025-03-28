const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
    'api',
    {
        // Project management
        getProjects: () => ipcRenderer.invoke('get-projects'),
        saveProject: (project) => ipcRenderer.invoke('save-project', project),
        updateProject: (project) => ipcRenderer.invoke('update-project', project),
        deleteProject: (projectId) => ipcRenderer.invoke('delete-project', projectId),
        getLastActiveProject: () => ipcRenderer.invoke('get-last-active-project'),
        setLastActiveProject: (projectId) => ipcRenderer.invoke('set-last-active-project', projectId),

        // Secret management
        saveSecret: (projectId, key, value) => ipcRenderer.invoke('save-secret', projectId, key, value),
        getSecret: (projectId, key) => ipcRenderer.invoke('get-secret', projectId, key),
        deleteSecret: (projectId, key) => ipcRenderer.invoke('delete-secret', projectId, key),

        // Event listeners
        on: (channel, callback) => {
            // Whitelist channels
            const validChannels = [
                'project-created',
                'project-updated',
                'project-deleted',
                'active-project-changed'
            ];
            if (validChannels.includes(channel)) {
                const subscription = (_event, data) => callback(data);
                ipcRenderer.on(channel, subscription);
                return () => {
                    ipcRenderer.removeListener(channel, subscription);
                };
            }
            return null;
        }
    }
); 