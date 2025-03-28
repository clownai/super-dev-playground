import { TerminalEmulator } from '../lib/terminal-emulator.js';

export default class Terminal {
    constructor() {
        this.container = document.createElement('div');
        this.container.className = 'terminal-feature';
        
        this.terminal = null;
        this.searchInput = null;
        this.searchVisible = false;

        this.render();
        this.setupEventListeners();
    }

    render() {
        this.container.innerHTML = `
            <div class="terminal-header">
                <div class="terminal-title">Terminal</div>
                <div class="terminal-actions">
                    <button class="icon-button" id="searchButton" title="Search">
                        <i class="fas fa-search"></i>
                    </button>
                    <button class="icon-button" id="clearButton" title="Clear">
                        <i class="fas fa-eraser"></i>
                    </button>
                </div>
            </div>
            <div class="terminal-search" style="display: none;">
                <div class="search-input-container">
                    <input type="text" id="searchInput" placeholder="Search...">
                    <button class="icon-button" id="prevButton" title="Previous">
                        <i class="fas fa-chevron-up"></i>
                    </button>
                    <button class="icon-button" id="nextButton" title="Next">
                        <i class="fas fa-chevron-down"></i>
                    </button>
                </div>
            </div>
            <div class="terminal-content"></div>
        `;

        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .terminal-feature {
                height: 100%;
                display: flex;
                flex-direction: column;
                background: var(--bg-primary);
            }

            .terminal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 8px 16px;
                background: var(--bg-secondary);
                border-bottom: 1px solid var(--border-color);
            }

            .terminal-title {
                font-weight: bold;
                color: var(--text-primary);
            }

            .terminal-actions {
                display: flex;
                gap: 8px;
            }

            .terminal-search {
                padding: 8px;
                background: var(--bg-secondary);
                border-bottom: 1px solid var(--border-color);
            }

            .search-input-container {
                display: flex;
                gap: 8px;
            }

            .search-input-container input {
                flex: 1;
                padding: 4px 8px;
                border: 1px solid var(--border-color);
                border-radius: 4px;
                background: var(--bg-primary);
                color: var(--text-primary);
            }

            .terminal-content {
                flex: 1;
                position: relative;
            }

            .icon-button {
                padding: 4px 8px;
                border: none;
                background: none;
                color: var(--text-secondary);
                cursor: pointer;
                border-radius: 4px;
            }

            .icon-button:hover {
                background: var(--bg-tertiary);
                color: var(--text-primary);
            }
        `;
        document.head.appendChild(style);

        // Initialize terminal
        this.terminal = new TerminalEmulator();
        this.container.querySelector('.terminal-content').appendChild(this.terminal.container);
        
        // Initialize terminal process
        this.terminal.initialize();
    }

    setupEventListeners() {
        // Search button
        this.container.querySelector('#searchButton').addEventListener('click', () => {
            this.toggleSearch();
        });

        // Clear button
        this.container.querySelector('#clearButton').addEventListener('click', () => {
            this.terminal.clear();
        });

        // Search input
        this.searchInput = this.container.querySelector('#searchInput');
        this.searchInput.addEventListener('input', () => {
            const query = this.searchInput.value;
            if (query) {
                this.terminal.findNext(query);
            }
        });

        // Search navigation
        this.container.querySelector('#prevButton').addEventListener('click', () => {
            const query = this.searchInput.value;
            if (query) {
                this.terminal.findPrevious(query);
            }
        });

        this.container.querySelector('#nextButton').addEventListener('click', () => {
            const query = this.searchInput.value;
            if (query) {
                this.terminal.findNext(query);
            }
        });

        // Search keyboard shortcuts
        this.searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (e.shiftKey) {
                    this.terminal.findPrevious(this.searchInput.value);
                } else {
                    this.terminal.findNext(this.searchInput.value);
                }
            } else if (e.key === 'Escape') {
                e.preventDefault();
                this.toggleSearch();
            }
        });
    }

    toggleSearch() {
        this.searchVisible = !this.searchVisible;
        this.container.querySelector('.terminal-search').style.display = 
            this.searchVisible ? 'block' : 'none';
        
        if (this.searchVisible) {
            this.searchInput.focus();
        } else {
            this.searchInput.value = '';
            this.terminal.focus();
        }
    }

    focus() {
        this.terminal.focus();
    }

    dispose() {
        if (this.terminal) {
            this.terminal.dispose();
        }
    }
}