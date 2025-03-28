import { CodeEditor } from '../lib/code-editor.js';

export default class JsPlayground {
    constructor() {
        this.container = document.createElement('div');
        this.container.className = 'js-playground';
        
        this.editor = null;
        this.output = null;
        this.isRunning = false;

        this.render();
        this.setupEditor();
        this.setupEventListeners();
    }

    render() {
        this.container.innerHTML = `
            <div class="js-playground-header">
                <div class="js-playground-title">JavaScript Playground</div>
                <div class="js-playground-actions">
                    <button class="button" id="runButton">
                        <i class="fas fa-play"></i>
                        Run
                    </button>
                    <button class="button secondary" id="clearButton">
                        <i class="fas fa-eraser"></i>
                        Clear Console
                    </button>
                </div>
            </div>
            <div class="js-playground-content">
                <div class="editor-panel">
                    <div class="editor-container" id="codeEditor"></div>
                </div>
                <div class="output-panel">
                    <div class="output-header">
                        <div class="output-title">Console</div>
                    </div>
                    <div class="output-container">
                        <pre id="output"></pre>
                    </div>
                </div>
            </div>
        `;

        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .js-playground {
                height: 100%;
                display: flex;
                flex-direction: column;
                background: var(--bg-primary);
            }

            .js-playground-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 8px 16px;
                background: var(--bg-secondary);
                border-bottom: 1px solid var(--border-color);
            }

            .js-playground-title {
                font-weight: bold;
                color: var(--text-primary);
            }

            .js-playground-actions {
                display: flex;
                gap: 8px;
            }

            .js-playground-content {
                flex: 1;
                display: flex;
                gap: 16px;
                padding: 16px;
                overflow: hidden;
            }

            .editor-panel {
                flex: 1;
                border: 1px solid var(--border-color);
                border-radius: 4px;
                overflow: hidden;
            }

            .editor-container {
                height: 100%;
            }

            .output-panel {
                flex: 1;
                display: flex;
                flex-direction: column;
                border: 1px solid var(--border-color);
                border-radius: 4px;
                overflow: hidden;
            }

            .output-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 8px 16px;
                background: var(--bg-secondary);
                border-bottom: 1px solid var(--border-color);
            }

            .output-title {
                font-weight: bold;
                color: var(--text-primary);
            }

            .output-container {
                flex: 1;
                overflow: auto;
                padding: 16px;
                background: var(--bg-primary);
            }

            #output {
                margin: 0;
                font-family: 'Consolas', 'Courier New', monospace;
                font-size: 14px;
                line-height: 1.5;
                color: var(--text-primary);
                white-space: pre-wrap;
            }

            .log-entry {
                margin: 4px 0;
                padding: 4px 8px;
                border-radius: 4px;
            }

            .log-entry.error {
                color: var(--error-color);
                background: var(--error-bg);
            }

            .log-entry.warn {
                color: var(--warning-color);
                background: var(--warning-bg);
            }

            .log-entry.info {
                color: var(--info-color);
                background: var(--info-bg);
            }
        `;
        document.head.appendChild(style);
    }

    setupEditor() {
        // Code editor
        this.editor = new CodeEditor({
            language: 'javascript',
            value: '// Write your JavaScript code here\nconsole.log("Hello, World!");'
        });
        document.getElementById('codeEditor').appendChild(this.editor.container);

        // Output container
        this.output = document.getElementById('output');
    }

    setupEventListeners() {
        // Run button
        this.container.querySelector('#runButton').addEventListener('click', () => {
            this.runCode();
        });

        // Clear button
        this.container.querySelector('#clearButton').addEventListener('click', () => {
            this.clearOutput();
        });

        // Keyboard shortcuts
        this.editor.container.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + Enter to run code
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                this.runCode();
            }
        });
    }

    createCustomConsole() {
        const customConsole = {
            log: (...args) => this.logOutput('log', ...args),
            error: (...args) => this.logOutput('error', ...args),
            warn: (...args) => this.logOutput('warn', ...args),
            info: (...args) => this.logOutput('info', ...args),
            clear: () => this.clearOutput()
        };

        return customConsole;
    }

    logOutput(type, ...args) {
        const entry = document.createElement('div');
        entry.className = `log-entry ${type}`;
        
        const formattedArgs = args.map(arg => {
            if (typeof arg === 'object') {
                return JSON.stringify(arg, null, 2);
            }
            return String(arg);
        });

        entry.textContent = formattedArgs.join(' ');
        this.output.appendChild(entry);
        this.output.scrollTop = this.output.scrollHeight;
    }

    clearOutput() {
        this.output.innerHTML = '';
    }

    async runCode() {
        if (this.isRunning) return;
        this.isRunning = true;

        try {
            const code = this.editor.getValue();
            const customConsole = this.createCustomConsole();

            // Create a new AsyncFunction with the code
            const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
            const fn = new AsyncFunction('console', code);

            // Run the code with the custom console
            await fn(customConsole);
        } catch (error) {
            this.logOutput('error', error.toString());
        } finally {
            this.isRunning = false;
        }
    }

    dispose() {
        if (this.editor) {
            this.editor.dispose();
        }
    }
} 