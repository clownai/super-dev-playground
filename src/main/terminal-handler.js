const { ipcMain } = require('electron');
const os = require('os');
const pty = require('node-pty');
const path = require('path');

// Shell configuration based on OS
const getDefaultShell = () => {
    switch (process.platform) {
        case 'win32':
            // Prefer PowerShell Core if available
            if (process.env.ProgramFiles) {
                const pwshPath = path.join(process.env.ProgramFiles, 'PowerShell', '7', 'pwsh.exe');
                if (require('fs').existsSync(pwshPath)) {
                    return pwshPath;
                }
            }
            // Fall back to Windows PowerShell
            return process.env.COMSPEC || 'powershell.exe';
        case 'darwin':
            return process.env.SHELL || '/bin/zsh';
        default:
            return process.env.SHELL || '/bin/bash';
    }
};

const getDefaultEnv = () => {
    const env = { ...process.env };
    
    // Ensure TERM is set for proper terminal behavior
    env.TERM = 'xterm-256color';
    
    // Add any additional environment variables needed
    if (process.platform === 'win32') {
        // Ensure PowerShell uses UTF-8
        env.PYTHONIOENCODING = 'utf-8';
        env.LANG = 'en_US.UTF-8';
    }
    
    return env;
};

class TerminalHandler {
    constructor() {
        this.terminals = new Map();
        this.nextTerminalId = 1;
        this.defaultShell = getDefaultShell();
    }

    initialize() {
        // Handle terminal creation
        ipcMain.handle('terminal-create', (_event, { cols, rows, cwd }) => {
            const terminalId = this.nextTerminalId++;
            
            const ptyProcess = pty.spawn(this.defaultShell, [], {
                name: 'xterm-256color',
                cols: cols || 80,
                rows: rows || 24,
                cwd: cwd || os.homedir(),
                env: getDefaultEnv(),
                useConpty: process.platform === 'win32' // Use ConPTY on Windows
            });

            // Set up data handling
            ptyProcess.onData((data) => {
                _event.sender.send(`terminal-data-${terminalId}`, data);
            });

            // Set up exit handling
            ptyProcess.onExit(({ exitCode, signal }) => {
                _event.sender.send(`terminal-exit-${terminalId}`, { exitCode, signal });
                this.terminals.delete(terminalId);
            });

            this.terminals.set(terminalId, ptyProcess);
            return terminalId;
        });

        // Handle terminal resizing
        ipcMain.handle('terminal-resize', (_event, { terminalId, cols, rows }) => {
            const ptyProcess = this.terminals.get(terminalId);
            if (ptyProcess) {
                try {
                    ptyProcess.resize(cols, rows);
                    return true;
                } catch (error) {
                    console.error(`Failed to resize terminal ${terminalId}:`, error);
                    return false;
                }
            }
            return false;
        });

        // Handle terminal input
        ipcMain.handle('terminal-write', (_event, { terminalId, data }) => {
            const ptyProcess = this.terminals.get(terminalId);
            if (ptyProcess) {
                try {
                    ptyProcess.write(data);
                    return true;
                } catch (error) {
                    console.error(`Failed to write to terminal ${terminalId}:`, error);
                    return false;
                }
            }
            return false;
        });

        // Handle terminal closure
        ipcMain.handle('terminal-close', (_event, { terminalId }) => {
            const ptyProcess = this.terminals.get(terminalId);
            if (ptyProcess) {
                try {
                    ptyProcess.kill();
                    this.terminals.delete(terminalId);
                    return true;
                } catch (error) {
                    console.error(`Failed to close terminal ${terminalId}:`, error);
                    return false;
                }
            }
            return false;
        });

        // Handle directory change
        ipcMain.handle('terminal-cd', (_event, { terminalId, directory }) => {
            const ptyProcess = this.terminals.get(terminalId);
            if (ptyProcess) {
                try {
                    const normalizedPath = path.normalize(directory);
                    const command = process.platform === 'win32' 
                        ? `cd "${normalizedPath}"\r\n`
                        : `cd "${normalizedPath}"\n`;
                    ptyProcess.write(command);
                    return true;
                } catch (error) {
                    console.error(`Failed to change directory in terminal ${terminalId}:`, error);
                    return false;
                }
            }
            return false;
        });
    }

    cleanup() {
        for (const [terminalId, ptyProcess] of this.terminals.entries()) {
            try {
                ptyProcess.kill();
                this.terminals.delete(terminalId);
            } catch (error) {
                console.error(`Failed to cleanup terminal ${terminalId}:`, error);
            }
        }
    }
}

module.exports = {
    TerminalHandler
}; 
}; 