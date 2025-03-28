import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';
import { SearchAddon } from 'xterm-addon-search';

export default class TerminalComponent {
    constructor(options = {}) {
        this.container = document.createElement('div');
        this.container.className = 'terminal-component';
        
        this.terminalId = null;
        this.terminal = null;
        this.fitAddon = null;
        this.searchAddon = null;
        this.unsubscribeFromData = null;
        this.options = options;

        this.render();
        this.setupTerminal();
    }

    render() {
        this.container.innerHTML = `
            <div class="terminal-header">
                <div class="terminal-title">Terminal</div>
                <div class="terminal-actions">
                    <button class="button" id="searchBtn" title="Search">
                        <i class="fas fa-search"></i>
                    </button>
                    <button class="button" id="clearBtn" title="Clear">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="terminal-container"></div>
            <div class="search-bar" style="display: none;">
                <input type="text" id="searchInput" placeholder="Search...">
                <button class="button" id="prevSearchBtn">
                    <i class="fas fa-chevron-up"></i>
                </button>
                <button class="button" id="nextSearchBtn">
                    <i class="fas fa-chevron-down"></i>
                </button>
                <button class="button" id="closeSearchBtn">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .terminal-component {
                height: 100%;
                display: flex;
                flex-direction: column;
                background: var(--bg-primary);
            }

            .terminal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 8px;
                background: var(--bg-secondary);
                border-bottom: 1px solid var(--border-color);
            }

            .terminal-title {
                font-weight: bold;
            }

            .terminal-actions {
                display: flex;
                gap: 8px;
            }

            .terminal-container {
                flex: 1;
                padding: 8px;
                overflow: hidden;
            }

            .search-bar {
                display: flex;
                gap: 8px;
                padding: 8px;
                background: var(--bg-secondary);
                border-top: 1px solid var(--border-color);
            }

            .search-bar input {
                flex: 1;
                padding: 4px 8px;
                border: 1px solid var(--border-color);
                border-radius: 4px;
                background: var(--bg-tertiary);
                color: var(--text-primary);
            }

            .terminal-component .xterm {
                padding: 8px;
            }
        `;
        document.head.appendChild(style);
    }

    async setupTerminal() {
        // Create xterm.js instance
        this.terminal = new Terminal({
            fontFamily: 'Consolas, "Courier New", monospace',
            fontSize: 14,
            theme: {
                background: '#1e1e1e',
                foreground: '#d4d4d4',
                cursor: '#d4d4d4',
                selection: '#264f78',
                black: '#1e1e1e',
                red: '#f44747',
                green: '#6a9955',
                yellow: '#d7ba7d',
                blue: '#569cd6',
                magenta: '#c586c0',
                cyan: '#4dc9b0',
                white: '#d4d4d4',
                brightBlack: '#808080',
                brightRed: '#f44747',
                brightGreen: '#6a9955',
                brightYellow: '#d7ba7d',
                brightBlue: '#569cd6',
                brightMagenta: '#c586c0',
                brightCyan: '#4dc9b0',
                brightWhite: '#d4d4d4'
            }
        });

        // Add addons
        this.fitAddon = new FitAddon();
        this.searchAddon = new SearchAddon();
        this.terminal.loadAddon(this.fitAddon);
        this.terminal.loadAddon(this.searchAddon);
        this.terminal.loadAddon(new WebLinksAddon());

        // Open terminal in container
        const terminalContainer = this.container.querySelector('.terminal-container');
        this.terminal.open(terminalContainer);
        this.fitAddon.fit();

        // Create pty process
        this.terminalId = await window.terminal.create({
            cols: this.terminal.cols,
            rows: this.terminal.rows,
            cwd: this.options.cwd
        });

        // Handle terminal input
        this.terminal.onData(data => {
            window.terminal.write(this.terminalId, data);
        });

        // Handle terminal resize
        this.terminal.onResize(({ cols, rows }) => {
            window.terminal.resize(this.terminalId, cols, rows);
        });

        // Handle terminal output
        this.unsubscribeFromData = window.terminal.onData(this.terminalId, data => {
            this.terminal.write(data);
        });

        // Handle window resize
        window.addEventListener('resize', () => {
            this.fitAddon.fit();
        });

        // Set up event listeners
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Search button
        this.container.querySelector('#searchBtn').addEventListener('click', () => {
            const searchBar = this.container.querySelector('.search-bar');
            searchBar.style.display = searchBar.style.display === 'none' ? 'flex' : 'none';
            if (searchBar.style.display === 'flex') {
                this.container.querySelector('#searchInput').focus();
            }
        });

        // Search input
        this.container.querySelector('#searchInput').addEventListener('input', (e) => {
            const searchTerm = e.target.value;
            if (searchTerm) {
                this.searchAddon.findNext(searchTerm);
            }
        });

        // Previous search result
        this.container.querySelector('#prevSearchBtn').addEventListener('click', () => {
            const searchTerm = this.container.querySelector('#searchInput').value;
            if (searchTerm) {
                this.searchAddon.findPrevious(searchTerm);
            }
        });

        // Next search result
        this.container.querySelector('#nextSearchBtn').addEventListener('click', () => {
            const searchTerm = this.container.querySelector('#searchInput').value;
            if (searchTerm) {
                this.searchAddon.findNext(searchTerm);
            }
        });

        // Close search
        this.container.querySelector('#closeSearchBtn').addEventListener('click', () => {
            this.container.querySelector('.search-bar').style.display = 'none';
            this.searchAddon.clearDecorations();
        });

        // Clear terminal
        this.container.querySelector('#clearBtn').addEventListener('click', () => {
            this.terminal.clear();
        });
    }

    // Public methods
    focus() {
        this.terminal.focus();
    }

    write(data) {
        this.terminal.write(data);
    }

    clear() {
        this.terminal.clear();
    }

    cd(directory) {
        return window.terminal.cd(this.terminalId, directory);
    }

    execute(command) {
        return window.terminal.execute(this.terminalId, command);
    }

    dispose() {
        if (this.unsubscribeFromData) {
            this.unsubscribeFromData();
        }
        if (this.terminalId !== null) {
            window.terminal.close(this.terminalId);
        }
        if (this.terminal) {
            this.terminal.dispose();
        }
    }
} 