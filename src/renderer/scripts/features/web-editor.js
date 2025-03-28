import { CodeEditor } from '../lib/code-editor.js';

export default class WebEditor {
    constructor() {
        this.container = document.createElement('div');
        this.container.className = 'web-editor';
        
        this.htmlEditor = null;
        this.cssEditor = null;
        this.jsEditor = null;
        this.previewFrame = null;
        this.autoRefresh = true;
        this.refreshTimeout = null;

        this.render();
        this.setupEditors();
        this.setupEventListeners();
    }

    render() {
        this.container.innerHTML = `
            <div class="web-editor-header">
                <div class="web-editor-title">Web Editor</div>
                <div class="web-editor-actions">
                    <label class="auto-refresh">
                        <input type="checkbox" id="autoRefreshToggle" checked>
                        Auto-refresh
                    </label>
                    <button class="button" id="runButton">
                        <i class="fas fa-play"></i>
                        Run
                    </button>
                </div>
            </div>
            <div class="web-editor-content">
                <div class="editors-panel">
                    <div class="editor-tabs">
                        <button class="tab-button active" data-tab="html">HTML</button>
                        <button class="tab-button" data-tab="css">CSS</button>
                        <button class="tab-button" data-tab="js">JavaScript</button>
                    </div>
                    <div class="editor-containers">
                        <div class="editor-container active" id="htmlEditor"></div>
                        <div class="editor-container" id="cssEditor"></div>
                        <div class="editor-container" id="jsEditor"></div>
                    </div>
                </div>
                <div class="preview-panel">
                    <div class="preview-header">
                        <div class="preview-title">Preview</div>
                        <button class="icon-button" id="refreshButton" title="Refresh">
                            <i class="fas fa-sync-alt"></i>
                        </button>
                    </div>
                    <div class="preview-container">
                        <iframe id="previewFrame" sandbox="allow-scripts"></iframe>
                    </div>
                </div>
            </div>
        `;

        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .web-editor {
                height: 100%;
                display: flex;
                flex-direction: column;
                background: var(--bg-primary);
            }

            .web-editor-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 8px 16px;
                background: var(--bg-secondary);
                border-bottom: 1px solid var(--border-color);
            }

            .web-editor-title {
                font-weight: bold;
                color: var(--text-primary);
            }

            .web-editor-actions {
                display: flex;
                align-items: center;
                gap: 16px;
            }

            .auto-refresh {
                display: flex;
                align-items: center;
                gap: 8px;
                color: var(--text-secondary);
            }

            .web-editor-content {
                flex: 1;
                display: flex;
                gap: 16px;
                padding: 16px;
                overflow: hidden;
            }

            .editors-panel {
                flex: 1;
                display: flex;
                flex-direction: column;
                border: 1px solid var(--border-color);
                border-radius: 4px;
                overflow: hidden;
            }

            .editor-tabs {
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

            .editor-containers {
                flex: 1;
                position: relative;
            }

            .editor-container {
                display: none;
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
            }

            .editor-container.active {
                display: block;
            }

            .preview-panel {
                flex: 1;
                display: flex;
                flex-direction: column;
                border: 1px solid var(--border-color);
                border-radius: 4px;
                overflow: hidden;
            }

            .preview-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 8px 16px;
                background: var(--bg-secondary);
                border-bottom: 1px solid var(--border-color);
            }

            .preview-title {
                font-weight: bold;
                color: var(--text-primary);
            }

            .preview-container {
                flex: 1;
                position: relative;
                background: white;
            }

            #previewFrame {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                border: none;
                background: white;
            }
        `;
        document.head.appendChild(style);
    }

    setupEditors() {
        // HTML editor
        this.htmlEditor = new CodeEditor({
            language: 'html',
            value: '<!DOCTYPE html>\n<html>\n<head>\n    <title>Web Editor</title>\n</head>\n<body>\n    <h1>Hello, World!</h1>\n</body>\n</html>',
            onChange: () => this.handleChange()
        });
        document.getElementById('htmlEditor').appendChild(this.htmlEditor.container);

        // CSS editor
        this.cssEditor = new CodeEditor({
            language: 'css',
            value: 'body {\n    margin: 0;\n    padding: 20px;\n    font-family: Arial, sans-serif;\n}',
            onChange: () => this.handleChange()
        });
        document.getElementById('cssEditor').appendChild(this.cssEditor.container);

        // JavaScript editor
        this.jsEditor = new CodeEditor({
            language: 'javascript',
            value: 'console.log("Hello from JavaScript!");',
            onChange: () => this.handleChange()
        });
        document.getElementById('jsEditor').appendChild(this.jsEditor.container);

        // Get preview frame
        this.previewFrame = document.getElementById('previewFrame');
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

                // Update active editor
                const tabId = button.dataset.tab + 'Editor';
                this.container.querySelectorAll('.editor-container').forEach(editor => {
                    editor.classList.remove('active');
                });
                document.getElementById(tabId).classList.add('active');

                // Focus the active editor
                this[tabId.charAt(0).toLowerCase() + tabId.slice(1)].focus();
            });
        });

        // Run button
        this.container.querySelector('#runButton').addEventListener('click', () => {
            this.updatePreview();
        });

        // Refresh button
        this.container.querySelector('#refreshButton').addEventListener('click', () => {
            this.updatePreview();
        });

        // Auto-refresh toggle
        this.container.querySelector('#autoRefreshToggle').addEventListener('change', (e) => {
            this.autoRefresh = e.target.checked;
            if (this.autoRefresh) {
                this.handleChange();
            }
        });
    }

    handleChange() {
        if (this.autoRefresh) {
            // Debounce preview update
            if (this.refreshTimeout) {
                clearTimeout(this.refreshTimeout);
            }
            this.refreshTimeout = setTimeout(() => {
                this.updatePreview();
            }, 1000);
        }
    }

    updatePreview() {
        const html = this.htmlEditor.getValue();
        const css = this.cssEditor.getValue();
        const js = this.jsEditor.getValue();

        // Create a new document with the combined code
        const doc = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>${css}</style>
            </head>
            <body>
                ${html}
                <script>${js}</script>
            </body>
            </html>
        `;

        // Update the preview frame
        this.previewFrame.srcdoc = doc;
    }

    dispose() {
        if (this.htmlEditor) {
            this.htmlEditor.dispose();
        }
        if (this.cssEditor) {
            this.cssEditor.dispose();
        }
        if (this.jsEditor) {
            this.jsEditor.dispose();
        }
    }
} 