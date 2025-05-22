const { app, BrowserWindow } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const AutoLaunch = require('auto-launch');
const kill = require('tree-kill'); // 👈 include this

let backendProc;

function startBackend() {
  const exePath = path.join(process.resourcesPath, 'backend', 'meeting_reminder_wsgi.exe');
  backendProc = spawn(exePath, [], {
    // shell: true,
    cwd: path.dirname(exePath),
    windowsHide: true
  });

  backendProc.stdout.on('data', data => {
    console.log(`Flask stdout: ${data}`);
  });

  backendProc.stderr.on('data', data => {
    console.error(`Flask stderr: ${data}`);
  });

  backendProc.on('close', code => {
    console.log(`Flask backend exited with code ${code}`);
  });
}

function stopBackend() {
  if (backendProc && backendProc.pid) {
    console.log('Attempting to kill Flask backend...');
    kill(backendProc.pid, 'SIGTERM', err => {
      if (err) {
        console.error('Failed to kill backend:', err);
      } else {
        console.log('Flask backend killed');
      }
    });
    backendProc = null;
  }
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

  // Delay to give Flask backend time to start
  setTimeout(() => {
    win.loadFile(path.join(__dirname, 'build', 'index.html'));
  }, 3000);
}

const appAutoLauncher = new AutoLaunch({
  name: 'Meeting Reminder',
  path: app.getPath('exe'),
});

app.whenReady().then(() => {
  appAutoLauncher.isEnabled().then((isEnabled) => {
    if (!isEnabled) {
      appAutoLauncher.enable();
    }
  }).catch(err => console.error('AutoLaunch error:', err));

  startBackend();
  createWindow();
});

app.on('window-all-closed', () => {
  stopBackend(); // Make sure this uses the updated function
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
