const { contextBridge, ipcRenderer } = require('electron');

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