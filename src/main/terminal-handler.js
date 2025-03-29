const { ipcMain } = require('electron');
const { spawn } = require('child_process');
const os = require('os');
const path = require('path');

function getDefaultShell() {
    if (process.platform === 'win32') {
        return 'powershell.exe';
    }
    return process.env.SHELL || '/bin/bash';
}

function getDefaultEnv() {
    return { ...process.env };
}

class TerminalHandler {
    constructor() {
        this.terminals = new Map();
        this.nextTerminalId = 1;
        this.defaultShell = getDefaultShell();
    }

    initialize() {
        ipcMain.handle('terminal-create', () => {
            const id = this.nextTerminalId++;
            const terminal = spawn(this.defaultShell, [], {
                env: getDefaultEnv(),
                cwd: os.homedir()
            });

            this.terminals.set(id, terminal);

            terminal.stdout.on('data', (data) => {
                const window = this.getMainWindow();
                if (window) {
                    window.webContents.send('terminal-output', { id, data: data.toString() });
                }
            });

            terminal.stderr.on('data', (data) => {
                const window = this.getMainWindow();
                if (window) {
                    window.webContents.send('terminal-output', { id, data: data.toString() });
                }
            });

            terminal.on('exit', (code) => {
                const window = this.getMainWindow();
                if (window) {
                    window.webContents.send('terminal-exit', { id, code });
                }
                this.terminals.delete(id);
            });

            return id;
        });

        ipcMain.handle('terminal-input', (_event, { id, data }) => {
            const terminal = this.terminals.get(id);
            if (terminal) {
                terminal.stdin.write(data);
            }
        });

        ipcMain.handle('terminal-resize', (_event, { id, cols, rows }) => {
            // Resize functionality not supported in this simplified version
        });
    }

    cleanup() {
        for (const terminal of this.terminals.values()) {
            terminal.kill();
        }
        this.terminals.clear();
    }

    getMainWindow() {
        const windows = require('electron').BrowserWindow.getAllWindows();
        return windows.length > 0 ? windows[0] : null;
    }
}

module.exports = {
    TerminalHandler
};