const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld(
    'api',
    {
        makeApiRequest: (request) => ipcRenderer.invoke('api-request', request),
        cancelApiRequest: (requestId) => ipcRenderer.invoke('api-cancel-request', requestId)
    }
); 