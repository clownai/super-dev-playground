const { ipcMain } = require('electron');
const keytar = require('keytar');
const Store = require('electron-store');
const axios = require('axios');

const SERVICE_NAME = 'SuperDevPlayground';
const store = new Store({
    name: 'n8n-config',
    defaults: {
        instances: []
    }
});

async function initializeN8nHandlers() {
    // Instance management
    ipcMain.handle('n8n-add-instance', async (_event, { name, url }) => {
        try {
            const instances = store.get('instances', []);
            const instance = {
                id: crypto.randomUUID(),
                name,
                url: url.endsWith('/') ? url.slice(0, -1) : url,
                createdAt: new Date().toISOString()
            };
            
            instances.push(instance);
            store.set('instances', instances);
            return instance;
        } catch (error) {
            console.error('Failed to add n8n instance:', error);
            throw error;
        }
    });

    ipcMain.handle('n8n-remove-instance', async (_event, instanceId) => {
        try {
            const instances = store.get('instances', []);
            const filteredInstances = instances.filter(i => i.id !== instanceId);
            store.set('instances', filteredInstances);

            // Remove associated API key
            await keytar.deletePassword(SERVICE_NAME, `n8n_${instanceId}`);
            return instanceId;
        } catch (error) {
            console.error('Failed to remove n8n instance:', error);
            throw error;
        }
    });

    ipcMain.handle('n8n-list-instances', () => {
        return store.get('instances', []);
    });

    // API key management
    ipcMain.handle('n8n-save-api-key', async (_event, { instanceId, apiKey }) => {
        try {
            await keytar.setPassword(SERVICE_NAME, `n8n_${instanceId}`, apiKey);
            return true;
        } catch (error) {
            console.error('Failed to save n8n API key:', error);
            throw error;
        }
    });

    // Workflow management
    ipcMain.handle('n8n-list-workflows', async (_event, instanceId) => {
        try {
            const instance = store.get('instances', []).find(i => i.id === instanceId);
            if (!instance) {
                throw new Error('n8n instance not found');
            }

            const apiKey = await keytar.getPassword(SERVICE_NAME, `n8n_${instanceId}`);
            if (!apiKey) {
                throw new Error('API key not found');
            }

            const response = await axios.get(`${instance.url}/api/v1/workflows`, {
                headers: {
                    'X-N8N-API-KEY': apiKey
                }
            });

            return response.data.data.map(workflow => ({
                id: workflow.id,
                name: workflow.name,
                active: workflow.active,
                createdAt: workflow.createdAt,
                updatedAt: workflow.updatedAt,
                tags: workflow.tags || []
            }));
        } catch (error) {
            console.error('Failed to list n8n workflows:', error);
            throw error;
        }
    });

    ipcMain.handle('n8n-get-workflow', async (_event, { instanceId, workflowId }) => {
        try {
            const instance = store.get('instances', []).find(i => i.id === instanceId);
            if (!instance) {
                throw new Error('n8n instance not found');
            }

            const apiKey = await keytar.getPassword(SERVICE_NAME, `n8n_${instanceId}`);
            if (!apiKey) {
                throw new Error('API key not found');
            }

            const response = await axios.get(`${instance.url}/api/v1/workflows/${workflowId}`, {
                headers: {
                    'X-N8N-API-KEY': apiKey
                }
            });

            return response.data;
        } catch (error) {
            console.error('Failed to get n8n workflow:', error);
            throw error;
        }
    });

    ipcMain.handle('n8n-trigger-workflow', async (_event, { instanceId, workflowId, payload }) => {
        try {
            const instance = store.get('instances', []).find(i => i.id === instanceId);
            if (!instance) {
                throw new Error('n8n instance not found');
            }

            const apiKey = await keytar.getPassword(SERVICE_NAME, `n8n_${instanceId}`);
            if (!apiKey) {
                throw new Error('API key not found');
            }

            const response = await axios.post(
                `${instance.url}/api/v1/workflows/${workflowId}/trigger`,
                payload,
                {
                    headers: {
                        'X-N8N-API-KEY': apiKey
                    }
                }
            );

            return response.data;
        } catch (error) {
            console.error('Failed to trigger n8n workflow:', error);
            throw error;
        }
    });

    ipcMain.handle('n8n-get-executions', async (_event, { instanceId, workflowId, limit = 10 }) => {
        try {
            const instance = store.get('instances', []).find(i => i.id === instanceId);
            if (!instance) {
                throw new Error('n8n instance not found');
            }

            const apiKey = await keytar.getPassword(SERVICE_NAME, `n8n_${instanceId}`);
            if (!apiKey) {
                throw new Error('API key not found');
            }

            const response = await axios.get(
                `${instance.url}/api/v1/executions`,
                {
                    params: {
                        workflowId,
                        limit
                    },
                    headers: {
                        'X-N8N-API-KEY': apiKey
                    }
                }
            );

            return response.data.data.map(execution => ({
                id: execution.id,
                status: execution.status,
                finished: execution.finished,
                mode: execution.mode,
                startedAt: execution.startedAt,
                stoppedAt: execution.stoppedAt,
                data: execution.data
            }));
        } catch (error) {
            console.error('Failed to get n8n executions:', error);
            throw error;
        }
    });

    // Test connection
    ipcMain.handle('n8n-test-connection', async (_event, instanceId) => {
        try {
            const instance = store.get('instances', []).find(i => i.id === instanceId);
            if (!instance) {
                throw new Error('n8n instance not found');
            }

            const apiKey = await keytar.getPassword(SERVICE_NAME, `n8n_${instanceId}`);
            if (!apiKey) {
                throw new Error('API key not found');
            }

            await axios.get(`${instance.url}/api/v1/workflows`, {
                headers: {
                    'X-N8N-API-KEY': apiKey
                }
            });

            return { success: true };
        } catch (error) {
            console.error('Failed to test n8n connection:', error);
            return { 
                success: false, 
                error: error.response?.data?.message || error.message 
            };
        }
    });
}

module.exports = {
    initializeN8nHandlers
}; 