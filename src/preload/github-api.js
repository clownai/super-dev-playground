const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
    'github',
    {
        // Authentication
        startAuth: () => ipcRenderer.invoke('github-start-auth'),
        checkAuth: () => ipcRenderer.invoke('github-check-auth'),

        // Repository management
        listRepos: () => ipcRenderer.invoke('github-list-repos'),
        
        // Workflow management
        listWorkflows: (owner, repo) => ipcRenderer.invoke('github-list-workflows', { owner, repo }),
        triggerWorkflow: (owner, repo, workflowId, ref, inputs) => 
            ipcRenderer.invoke('github-trigger-workflow', { owner, repo, workflowId, ref, inputs }),
        getWorkflowRuns: (owner, repo, workflowId) => 
            ipcRenderer.invoke('github-get-workflow-runs', { owner, repo, workflowId }),

        // Event listeners
        on: (channel, callback) => {
            // Whitelist channels
            const validChannels = [
                'github-auth-status'
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