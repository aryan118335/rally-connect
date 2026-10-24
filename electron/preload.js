// preload.js runs in a special isolated context before the web page loads.
// It acts as a secure bridge between Electron (Node.js) and the React app.
// We use contextBridge to safely expose ONLY what we need.

const { contextBridge } = require('electron');

// Expose a small API on window.electron that the React app can call
contextBridge.exposeInMainWorld('electron', {
  // Expose the versions of Node, Chrome and Electron for debugging/display purposes
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron,
  },
});

// In the future (Stage 7), we can expose Socket.IO or IPC functions here.
// For now this is intentionally minimal — only what is genuinely needed.
