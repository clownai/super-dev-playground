import { CodeEditor } from '../lib/code-editor.js';
import notifications from '../notifications.js';

export default class ApiTester {
    constructor() {
        this.container = document.createElement('div');
        this.container.className = 'api-tester';
        
        this.currentRequestId = null;
        this.bodyEditor = null;
        this.responseEditor = null;
        this.headersEditor = null;

        this.render();
        this.setupEditors();
        this.setupEventListeners();
    }

    render() {
        this.container.innerHTML = `
            <div class="api-tester-header">
                <h2>API Tester</h2>
            </div>
            <div class="api-tester-content">
                <div class="request-section">
                    <div class="request-url">
                        <select id="methodSelect" class="method-select">
                            <option value="GET">GET</option>
                            <option value="POST">POST</option>
                            <option value="PUT">PUT</option>
                            <option value="PATCH">PATCH</option>
                            <option value="DELETE">DELETE</option>
                            <option value="HEAD">HEAD</option>
                            <option value="OPTIONS">OPTIONS</option>
                        </select>
                        <input type="url" id="urlInput" placeholder="Enter URL" class="url-input">
                        <button id="sendButton" class="button">Send</button>
                        <button id="cancelButton" class="button secondary" style="display: none;">Cancel</button>
                    </div>
                    <div class="request-tabs">
                        <div class="tab-headers">
                            <button class="tab-button active" data-tab="headers">Headers</button>
                            <button class="tab-button" data-tab="body">Body</button>
                        </div>
                        <div class="tab-content">
                            <div class="tab-panel active" id="headersPanel">
                                <div id="headersEditor" class="editor-container"></div>
                            </div>
                            <div class="tab-panel" id="bodyPanel">
                                <div id="bodyEditor" class="editor-container"></div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="response-section">
                    <div class="response-info" style="display: none;">
                        <div class="status">
                            <span class="status-code"></span>
                            <span class="status-text"></span>
                        </div>
                        <div class="timing">
                            <span class="duration"></span>
                        </div>
                    </div>
                    <div id="responseEditor" class="editor-container"></div>
                </div>
            </div>
        `;

        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .api-tester {
                height: 100%;
                display: flex;
                flex-direction: column;
                background: var(--bg-primary);
            }

            .api-tester-header {
                padding: 16px;
                background: var(--bg-secondary);
                border-bottom: 1px solid var(--border-color);
            }

            .api-tester-header h2 {
                margin: 0;
            }

            .api-tester-content {
                flex: 1;
                display: flex;
                flex-direction: column;
                gap: 16px;
                padding: 16px;
                overflow: hidden;
            }

            .request-section {
                display: flex;
                flex-direction: column;
                gap: 16px;
                height: 50%;
            }

            .request-url {
                display: flex;
                gap: 8px;
            }

            .method-select {
                width: 100px;
                padding: 8px;
                border: 1px solid var(--border-color);
                border-radius: 4px;
                background: var(--bg-secondary);
                color: var(--text-primary);
            }

            .url-input {
                flex: 1;
                padding: 8px;
                border: 1px solid var(--border-color);
                border-radius: 4px;
                background: var(--bg-secondary);
                color: var(--text-primary);
            }

            .request-tabs {
                flex: 1;
                display: flex;
                flex-direction: column;
                border: 1px solid var(--border-color);
                border-radius: 4px;
                overflow: hidden;
            }

            .tab-headers {
                display: flex;
                background: var(--bg-secondary);
                border-bottom: 1px solid var(--border-color);
            }

            .tab-button {
                padding: 8px 16px;
                border: none;
                background: none;
                color: var(--text-secondary);
                cursor: pointer;
            }

            .tab-button.active {
                color: var(--text-primary);
                border-bottom: 2px solid var(--accent-color);
            }

            .tab-content {
                flex: 1;
                position: relative;
            }

            .tab-panel {
                display: none;
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
            }

            .tab-panel.active {
                display: block;
            }

            .editor-container {
                height: 100%;
            }

            .response-section {
                flex: 1;
                display: flex;
                flex-direction: column;
                gap: 8px;
                height: 50%;
            }

            .response-info {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 8px;
                background: var(--bg-secondary);
                border: 1px solid var(--border-color);
                border-radius: 4px;
            }

            .status {
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .status-code {
                font-weight: bold;
            }

            .status-code.success {
                color: var(--success-color);
            }

            .status-code.error {
                color: var(--error-color);
            }

            .status-code.redirect {
                color: var(--warning-color);
            }

            .timing {
                color: var(--text-secondary);
            }
        `;
        document.head.appendChild(style);
    }

    setupEditors() {
        // Headers editor
        this.headersEditor = new CodeEditor({
            language: 'json',
            value: JSON.stringify({
                'Content-Type': 'application/json'
            }, null, 2)
        });
        document.getElementById('headersEditor').appendChild(this.headersEditor.container);

        // Body editor
        this.bodyEditor = new CodeEditor({
            language: 'json',
            value: '{}'
        });
        document.getElementById('bodyEditor').appendChild(this.bodyEditor.container);

        // Response editor
        this.responseEditor = new CodeEditor({
            language: 'json',
            readOnly: true
        });
        document.getElementById('responseEditor').appendChild(this.responseEditor.container);
    }

    setupEventListeners() {
        // Tab switching
        this.container.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', () => {
                // Update active tab button
                this.container.querySelectorAll('.tab-button').forEach(btn => {
                    btn.classList.remove('active');
                });
                button.classList.add('active');

                // Update active tab panel
                const tabId = button.dataset.tab;
                this.container.querySelectorAll('.tab-panel').forEach(panel => {
                    panel.classList.remove('active');
                });
                this.container.querySelector(`#${tabId}Panel`).classList.add('active');
            });
        });

        // Send button
        this.container.querySelector('#sendButton').addEventListener('click', () => {
            this.sendRequest();
        });

        // Cancel button
        this.container.querySelector('#cancelButton').addEventListener('click', () => {
            this.cancelRequest();
        });

        // URL input enter key
        this.container.querySelector('#urlInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendRequest();
            }
        });
    }

    async sendRequest() {
        const url = this.container.querySelector('#urlInput').value;
        if (!url) {
            notifications.error('Please enter a URL');
            return;
        }

        try {
            // Parse headers
            let headers = {};
            try {
                headers = JSON.parse(this.headersEditor.getValue());
            } catch (error) {
                notifications.error('Invalid headers JSON');
                return;
            }

            // Parse body
            let body = null;
            const method = this.container.querySelector('#methodSelect').value;
            if (['POST', 'PUT', 'PATCH'].includes(method)) {
                try {
                    body = this.bodyEditor.getValue();
                } catch (error) {
                    notifications.error('Invalid request body');
                    return;
                }
            }

            // Update UI
            this.container.querySelector('#sendButton').style.display = 'none';
            this.container.querySelector('#cancelButton').style.display = 'inline-block';
            this.container.querySelector('.response-info').style.display = 'none';
            this.responseEditor.setValue('Loading...');

            // Send request
            const response = await window.api.makeApiRequest({
                url,
                method,
                headers,
                body
            });

            // Update response info
            const responseInfo = this.container.querySelector('.response-info');
            responseInfo.style.display = 'flex';

            const statusCode = this.container.querySelector('.status-code');
            statusCode.textContent = response.status;
            statusCode.className = 'status-code';
            if (response.status >= 200 && response.status < 300) {
                statusCode.classList.add('success');
            } else if (response.status >= 300 && response.status < 400) {
                statusCode.classList.add('redirect');
            } else {
                statusCode.classList.add('error');
            }

            this.container.querySelector('.status-text').textContent = response.statusText;
            this.container.querySelector('.duration').textContent = `${response.timing.duration}ms`;

            // Update response editor
            let formattedResponse = '';
            if (typeof response.data === 'object') {
                formattedResponse = JSON.stringify(response.data, null, 2);
                this.responseEditor.setLanguage('json');
            } else {
                formattedResponse = response.data;
                this.responseEditor.setLanguage('plaintext');
            }
            this.responseEditor.setValue(formattedResponse);

        } catch (error) {
            notifications.error(error.message);
            this.responseEditor.setValue(error.message);
        } finally {
            // Reset UI
            this.container.querySelector('#sendButton').style.display = 'inline-block';
            this.container.querySelector('#cancelButton').style.display = 'none';
        }
    }

    async cancelRequest() {
        if (this.currentRequestId) {
            await window.api.cancelApiRequest(this.currentRequestId);
            this.currentRequestId = null;
            this.container.querySelector('#sendButton').style.display = 'inline-block';
            this.container.querySelector('#cancelButton').style.display = 'none';
        }
    }

    dispose() {
        if (this.headersEditor) {
            this.headersEditor.dispose();
        }
        if (this.bodyEditor) {
            this.bodyEditor.dispose();
        }
        if (this.responseEditor) {
            this.responseEditor.dispose();
        }
    }
} 