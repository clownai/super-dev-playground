const { app, BrowserWindow, ipcMain } = require('electron');
const Store = require('electron-store');
const path = require('path');
const store = new Store();

// Handle creating/removing shortcuts on Windows when installing/uninstalling
if (require('electron-squirrel-startup')) {
  app.quit();
}

let mainWindow;

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    frame: false, // Custom window frame
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, '../preload/preload.js')
    },
  });

  // Load the index.html file.
  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

  // Restore window position and size
  const windowState = store.get('windowState', {
    width: 1200,
    height: 800,
    x: undefined,
    y: undefined
  });

  if (windowState.x !== undefined && windowState.y !== undefined) {
    mainWindow.setPosition(windowState.x, windowState.y);
  }
  mainWindow.setSize(windowState.width, windowState.height);

  // Save window state on close
  mainWindow.on('close', () => {
    const { width, height } = mainWindow.getBounds();
    const [x, y] = mainWindow.getPosition();
    store.set('windowState', { width, height, x, y });
  });
};

// This method will be called when Electron has finished initialization
app.whenReady().then(createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC Handlers

// Theme management
ipcMain.handle('get-theme', () => {
  return store.get('theme', 'light');
});

ipcMain.handle('set-theme', (event, theme) => {
  store.set('theme', theme);
  return theme;
});

// App state
ipcMain.handle('save-state', (event, key, value) => {
  store.set(key, value);
  return true;
});

ipcMain.handle('load-state', (event, key) => {
  return store.get(key);
});

// Window controls
ipcMain.on('minimize-window', () => {
  mainWindow.minimize();
});

ipcMain.on('maximize-window', () => {
  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow.maximize();
  }
});

ipcMain.on('close-window', () => {
  mainWindow.close();
}); 