import { app, BrowserWindow } from 'electron';
import { fileURLToPath } from 'url';
import path from 'path';
import isDev from 'electron-is-dev';

// __dirname is not available in ES modules, so we recreate it
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createWindow() {
  // Create the main application window
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      // Point to our preload script — runs before the web page loads
      preload: path.join(__dirname, 'preload.js'),
      // contextIsolation keeps the Node.js world separate from the web page world
      contextIsolation: true,
      // nodeIntegration: false means the web page cannot use Node.js APIs directly
      nodeIntegration: false,
    },
    // Remove the default menu bar for a cleaner desktop app look
    autoHideMenuBar: true,
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#0d1117',
  });

  if (isDev) {
    // In development: load from the Vite dev server (supports hot reload)
    mainWindow.loadURL('http://localhost:5173');
    // Open DevTools automatically during development
    mainWindow.webContents.openDevTools();
  } else {
    // In production: load the built index.html file
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

// Create the window once Electron is ready
app.whenReady().then(() => {
  createWindow();

  // On macOS, re-create the window when the dock icon is clicked and no windows are open
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit the app when all windows are closed (except on macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
