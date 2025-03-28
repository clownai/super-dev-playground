const { contextBridge, ipcRenderer } = require('electron');
require('./api-api');

// Project API
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

// GitHub API
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

// n8n API
contextBridge.exposeInMainWorld(
    'n8n',
    {
        // Instance management
        addInstance: (instance) => ipcRenderer.invoke('n8n-add-instance', instance),
        removeInstance: (instanceId) => ipcRenderer.invoke('n8n-remove-instance', instanceId),
        listInstances: () => ipcRenderer.invoke('n8n-list-instances'),
        
        // API key management
        saveApiKey: (instanceId, apiKey) => ipcRenderer.invoke('n8n-save-api-key', { instanceId, apiKey }),
        testConnection: (instanceId) => ipcRenderer.invoke('n8n-test-connection', instanceId),
        
        // Workflow management
        listWorkflows: (instanceId) => ipcRenderer.invoke('n8n-list-workflows', instanceId),
        getWorkflow: (instanceId, workflowId) => 
            ipcRenderer.invoke('n8n-get-workflow', { instanceId, workflowId }),
        triggerWorkflow: (instanceId, workflowId, payload) => 
            ipcRenderer.invoke('n8n-trigger-workflow', { instanceId, workflowId, payload }),
        getExecutions: (instanceId, workflowId, limit) => 
            ipcRenderer.invoke('n8n-get-executions', { instanceId, workflowId, limit })
    }
);

// Terminal API
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