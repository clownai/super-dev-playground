const { ipcMain } = require('electron');
const os = require('os');
const pty = require('node-pty');
const path = require('path');

const shells = {
    win32: 'C:\\Program Files\\PowerShell\\7\\pwsh.exe',
    linux: '/bin/bash',
    darwin: '/bin/zsh'
};

class TerminalHandler {
    constructor() {
        this.terminals = new Map();
        this.nextTerminalId = 1;
    }

    initialize() {
        ipcMain.handle('terminal-create', (_event, { cols, rows, cwd }) => {
            const shell = shells[process.platform] || shells.win32;
            const terminalId = this.nextTerminalId++;
            
            const ptyProcess = pty.spawn(shell, [], {
                name: 'xterm-256color',
                cols: cols || 80,
                rows: rows || 24,
                cwd: cwd || os.homedir(),
                env: process.env
            });

            this.terminals.set(terminalId, ptyProcess);

            ptyProcess.onData(data => {
                // Send terminal output to renderer
                _event.sender.send(`terminal-data-${terminalId}`, data);
            });

            return terminalId;
        });

        ipcMain.handle('terminal-resize', (_event, { terminalId, cols, rows }) => {
            const ptyProcess = this.terminals.get(terminalId);
            if (ptyProcess) {
                ptyProcess.resize(cols, rows);
            }
        });

        ipcMain.handle('terminal-write', (_event, { terminalId, data }) => {
            const ptyProcess = this.terminals.get(terminalId);
            if (ptyProcess) {
                ptyProcess.write(data);
            }
        });

        ipcMain.handle('terminal-close', (_event, { terminalId }) => {
            const ptyProcess = this.terminals.get(terminalId);
            if (ptyProcess) {
                ptyProcess.kill();
                this.terminals.delete(terminalId);
            }
        });

        // Change directory
        ipcMain.handle('terminal-cd', (_event, { terminalId, directory }) => {
            const ptyProcess = this.terminals.get(terminalId);
            if (ptyProcess) {
                const normalizedPath = path.normalize(directory);
                ptyProcess.write(`cd "${normalizedPath}"\r`);
            }
        });

        // Execute command
        ipcMain.handle('terminal-execute', (_event, { terminalId, command }) => {
            const ptyProcess = this.terminals.get(terminalId);
            if (ptyProcess) {
                ptyProcess.write(`${command}\r`);
            }
        });
    }

    cleanup() {
        // Clean up all terminals when the app is closing
        for (const [terminalId, ptyProcess] of this.terminals.entries()) {
            ptyProcess.kill();
            this.terminals.delete(terminalId);
        }
    }
}

module.exports = {
    TerminalHandler
}; 