const { app, BrowserWindow } = require('electron');

function initWindow() {
    const appWindow = new BrowserWindow({
        fullscreen: true,
        height: 1200,
        width: 1600,
        webPreferences: {
            nodeIntegration: true,
        },
    });

    // Electron Build Path
    const path = `${__dirname}/dist/client/index.html`;
    appWindow.loadFile(path);

    appWindow.setMenuBarVisibility(false);
}

app.whenReady().then(initWindow);

// Close when all windows are closed.
app.on('window-all-closed', function () {
    // On macOS specific close process
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) {
        initWindow();
    }
});
