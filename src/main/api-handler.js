const { ipcMain } = require('electron');
const axios = require('axios');

class ApiHandler {
    constructor() {
        this.requests = new Map();
        this.nextRequestId = 1;
    }

    initialize() {
        // Make API request
        ipcMain.handle('api-request', async (_event, request) => {
            const requestId = this.nextRequestId++;
            const startTime = Date.now();

            try {
                // Prepare request config
                const config = {
                    url: request.url,
                    method: request.method || 'GET',
                    headers: request.headers || {},
                    timeout: request.timeout || 30000,
                    validateStatus: null // Don't throw on any status code
                };

                // Add request body if present
                if (request.body) {
                    if (typeof request.body === 'string') {
                        try {
                            config.data = JSON.parse(request.body);
                        } catch {
                            config.data = request.body;
                        }
                    } else {
                        config.data = request.body;
                    }
                }

                // Add query parameters if present
                if (request.params) {
                    config.params = request.params;
                }

                // Store request for potential cancellation
                const source = axios.CancelToken.source();
                config.cancelToken = source.token;
                this.requests.set(requestId, source);

                // Make the request
                const response = await axios(config);

                // Calculate timing
                const endTime = Date.now();
                const duration = endTime - startTime;

                // Format response
                const result = {
                    requestId,
                    status: response.status,
                    statusText: response.statusText,
                    headers: response.headers,
                    data: response.data,
                    timing: {
                        start: startTime,
                        end: endTime,
                        duration
                    }
                };

                // Clean up request
                this.requests.delete(requestId);

                return result;
            } catch (error) {
                // Handle errors
                const endTime = Date.now();
                const duration = endTime - startTime;

                let errorResponse = {
                    requestId,
                    error: true,
                    status: error.response?.status,
                    statusText: error.response?.statusText || error.message,
                    headers: error.response?.headers,
                    data: error.response?.data,
                    timing: {
                        start: startTime,
                        end: endTime,
                        duration
                    }
                };

                // Clean up request
                this.requests.delete(requestId);

                return errorResponse;
            }
        });

        // Cancel request
        ipcMain.handle('api-cancel-request', (_event, requestId) => {
            const source = this.requests.get(requestId);
            if (source) {
                source.cancel('Request cancelled by user');
                this.requests.delete(requestId);
                return true;
            }
            return false;
        });
    }

    cleanup() {
        // Cancel all pending requests
        for (const [requestId, source] of this.requests.entries()) {
            source.cancel('Application closing');
            this.requests.delete(requestId);
        }
    }
}

module.exports = {
    ApiHandler
}; 