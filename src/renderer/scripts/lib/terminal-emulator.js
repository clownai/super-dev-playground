import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';
import { SearchAddon } from 'xterm-addon-search';

export class TerminalEmulator {
    constructor(options = {}) {
        this.container = document.createElement('div');
        this.container.className = 'terminal-container';
        
        this.terminal = new Terminal({
            cursorBlink: true,
            cursorStyle: 'block',
            fontSize: 14,
            fontFamily: 'Consolas, "Courier New", monospace',
            theme: {
                background: 'var(--bg-primary)',
                foreground: 'var(--text-primary)',
                cursor: 'var(--text-primary)',
                selection: 'var(--selection-color)',
                black: '#000000',
                red: '#e06c75',
                green: '#98c379',
                yellow: '#d19a66',
                blue: '#61afef',
                magenta: '#c678dd',
                cyan: '#56b6c2',
                white: '#abb2bf',
                brightBlack: '#5c6370',
                brightRed: '#e06c75',
                brightGreen: '#98c379',
                brightYellow: '#d19a66',
                brightBlue: '#61afef',
                brightMagenta: '#c678dd',
                brightCyan: '#56b6c2',
                brightWhite: '#ffffff'
            },
            allowTransparency: true,
            ...options
        });

        // Initialize addons
        this.fitAddon = new FitAddon();
        this.webLinksAddon = new WebLinksAddon();
        this.searchAddon = new SearchAddon();

        this.terminal.loadAddon(this.fitAddon);
        this.terminal.loadAddon(this.webLinksAddon);
        this.terminal.loadAddon(this.searchAddon);

        // Create styles
        const style = document.createElement('style');
        style.textContent = `
            .terminal-container {
                width: 100%;
                height: 100%;
                background: var(--bg-primary);
                padding: 8px;
                overflow: hidden;
            }

            .terminal-container .xterm {
                height: 100%;
            }

            .terminal-container .xterm-viewport {
                overflow-y: auto !important;
            }
        `;
        document.head.appendChild(style);

        // Open terminal in container
        this.terminal.open(this.container);
        
        // Set up resize observer
        this.resizeObserver = new ResizeObserver(() => {
            this.fitAddon.fit();
        });
        this.resizeObserver.observe(this.container);

        // Set up event handlers
        this.setupEventHandlers();
    }

    setupEventHandlers() {
        // Handle terminal input
        this.terminal.onData(data => {
            if (this.terminalId) {
                window.terminal.write(this.terminalId, data)
                    .catch(error => {
                        console.error('Failed to write to terminal:', error);
                        this.terminal.writeln('\r\n\x1b[31mError: Failed to send input to terminal\x1b[0m');
                    });
            }
        });

        // Handle terminal resize
        this.terminal.onResize(({ cols, rows }) => {
            if (this.terminalId) {
                window.terminal.resize(this.terminalId, cols, rows)
                    .catch(error => {
                        console.error('Failed to resize terminal:', error);
                    });
            }
        });
    }

    async initialize(cwd) {
        try {
            const { cols, rows } = this.terminal;
            this.terminalId = await window.terminal.create({ cols, rows, cwd });

            // Set up data listener
            const dataCleanup = window.terminal.onData(this.terminalId, (data) => {
                this.terminal.write(data);
            });

            // Set up exit listener
            const exitCleanup = window.terminal.onExit(this.terminalId, ({ exitCode, signal }) => {
                const message = signal
                    ? `\r\n\x1b[31mTerminal process terminated by signal ${signal}\x1b[0m`
                    : `\r\n\x1b[31mTerminal process exited with code ${exitCode}\x1b[0m`;
                
                this.terminal.writeln(message);
                this.terminal.writeln('\r\n\x1b[33mPress any key to restart the terminal...\x1b[0m');
                
                // Set up one-time key handler for restart
                const disposable = this.terminal.onData(() => {
                    disposable.dispose();
                    this.initialize(cwd);
                });
            });

            // Store cleanup functions
            this._cleanup = () => {
                dataCleanup();
                exitCleanup();
            };

            // Initial fit
            this.fitAddon.fit();
        } catch (error) {
            console.error('Failed to initialize terminal:', error);
            this.terminal.writeln('\x1b[31mFailed to initialize terminal: ' + error.message + '\x1b[0m');
            this.terminal.writeln('\r\n\x1b[33mPress any key to retry...\x1b[0m');

            // Set up one-time key handler for retry
            const disposable = this.terminal.onData(() => {
                disposable.dispose();
                this.initialize(cwd);
            });
        }
    }

    focus() {
        this.terminal.focus();
    }

    write(data) {
        this.terminal.write(data);
    }

    writeln(data) {
        this.terminal.writeln(data);
    }

    clear() {
        this.terminal.clear();
    }

    dispose() {
        if (this._cleanup) {
            this._cleanup();
        }

        if (this.terminalId) {
            window.terminal.close(this.terminalId)
                .catch(error => {
                    console.error('Failed to close terminal:', error);
                });
        }

        this.resizeObserver.disconnect();
        this.terminal.dispose();
    }

    // Search functionality
    findNext(query, options = {}) {
        return this.searchAddon.findNext(query, options);
    }

    findPrevious(query, options = {}) {
        return this.searchAddon.findPrevious(query, options);
    }
} 