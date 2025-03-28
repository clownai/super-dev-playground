const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { initializeProjectHandlers } = require('./project-handler');
const { initializeGitHubHandlers } = require('./github-handler');
const { initializeN8nHandlers } = require('./n8n-handler');
const { TerminalHandler } = require('./terminal-handler');
const { ApiHandler } = require('./api-handler');
const tokenManager = require('./token-manager');

// Keep a global reference of the window object
let mainWindow;
let githubHandler;
let terminalHandler;
let apiHandler;

function createWindow() {
    // Create the browser window
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, '../preload/index.js')
        }
    });

    // Load the index.html file
    mainWindow.loadFile('src/renderer/index.html');

    // Open DevTools in development
    if (process.env.NODE_ENV === 'development') {
        mainWindow.webContents.openDevTools();
    }
}

// This method will be called when Electron has finished initialization
app.whenReady().then(async () => {
    // Set up custom protocol
    if (process.defaultApp) {
        if (process.argv.length >= 2) {
            app.setAsDefaultProtocolClient('superdevplayground', process.execPath, [path.resolve(process.argv[1])])
        }
    } else {
        app.setAsDefaultProtocolClient('superdevplayground')
    }

    // Initialize handlers
    initializeProjectHandlers();
    initializeN8nHandlers();
    githubHandler = await initializeGitHubHandlers(mainWindow);
    
    // Initialize terminal handler
    terminalHandler = new TerminalHandler();
    terminalHandler.initialize();
    
    apiHandler = new ApiHandler();
    apiHandler.initialize();
    
    // Store GitHub PAT
    await tokenManager.setGitHubToken('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');
    
    createWindow();

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

// Handle custom protocol on Windows
if (process.platform === 'win32') {
    const gotTheLock = app.requestSingleInstanceLock();

    if (!gotTheLock) {
        app.quit();
    } else {
        app.on('second-instance', (event, commandLine) => {
            // Someone tried to run a second instance, focus our window instead
            if (mainWindow) {
                if (mainWindow.isMinimized()) mainWindow.restore();
                mainWindow.focus();

                // Handle the OAuth callback URL
                const url = commandLine.pop();
                if (url) {
                    githubHandler.handleOAuthCallback(url);
                }
            }
        });
    }
}

// Handle custom protocol on macOS
app.on('open-url', (event, url) => {
    event.preventDefault();
    if (githubHandler) {
        githubHandler.handleOAuthCallback(url);
    }
});

// Clean up when all windows are closed
app.on('window-all-closed', function () {
    if (terminalHandler) {
        terminalHandler.cleanup();
    }
    if (apiHandler) {
        apiHandler.cleanup();
    }
    if (process.platform !== 'darwin') app.quit();
}); 