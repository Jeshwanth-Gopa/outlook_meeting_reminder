const { app, BrowserWindow } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const AutoLaunch = require('auto-launch');
const net = require('net');

let backendProc;

// Check if a port is already in use (e.g., Flask backend already running)
function isPortInUse(port, callback) {
  const tester = net.createServer()
    .once('error', err => (err.code === 'EADDRINUSE' ? callback(true) : callback(false)))
    .once('listening', () => tester.once('close', () => callback(false)).close());

  // Bind specifically to 127.0.0.1
  tester.listen(port, '127.0.0.1');
}

function startBackend() {
  const exePath = path.join(process.resourcesPath, 'backend', 'meeting_reminder_wsgi.exe');

  backendProc = spawn(exePath, [], {
    cwd: path.dirname(exePath),
    detached: true,
    stdio: 'ignore',
    windowsHide: true,
  });

  backendProc.unref(); // Ensure it keeps running after Electron exits
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    }
  });

  // Wait for backend to start (5 seconds) before loading frontend
  setTimeout(() => {
    win.loadFile(path.join(__dirname, 'build', 'index.html'));
  }, 5000);
}

// Auto-launch the app on startup
const appAutoLauncher = new AutoLaunch({
  name: 'Meeting Reminder',
  path: app.getPath('exe'),
});

app.whenReady().then(() => {
  // Enable auto-launch if not already
  appAutoLauncher.isEnabled().then((isEnabled) => {
    if (!isEnabled) appAutoLauncher.enable();
  }).catch(err => console.error('AutoLaunch error:', err));

  // Only start backend if not already running
  isPortInUse(5000, (inUse) => {
    if (!inUse) {
      console.log('Starting backend...');
      startBackend();
    } else {
      console.log('Backend already running on port 5000');
    }
    createWindow();
  });
});

// Handle window close
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Handle dock click / app reopen (macOS)
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});