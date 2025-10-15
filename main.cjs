// Modules to control application life and create native browser window
const { app, dialog, ipcMain, BrowserWindow, shell, session } = require('electron');
const express = require('express');
const Store = require('electron-store');
const path = require('path');
const { autoUpdater } = require('electron-updater');
const contextMenu = require('electron-context-menu');
const fs = require('fs');
// const https = require('https');

const store = new Store();

let expressServer; // This gets populated in the startServer function

// Get the stored port value or standard value if not set
// Use these values:
// 3000: Main App
// 3001: WikiMed
// 3002: WikiVoyage
let port = 3000;
// Check if we previously stored a different port, and validate it for security
if (store.has('expressPort')) {
    const storedPort = store.get('expressPort');
    if (typeof storedPort === 'number' && storedPort >= 3000 && storedPort <= 3999) {
        port = storedPort;
    }
}
console.log('Express Port: ' + port);

app.commandLine.appendSwitch('enable-experimental-web-platform-features');

contextMenu({
    labels: {
        cut: 'Cut',
        copy: 'Copy',
        paste: 'Paste',
        save: 'Save Image',
        saveImageAs: 'Save Image As…',
        copyLink: 'Copy Link',
        saveLinkAs: 'Save Link As…',
        inspect: 'Inspect Element'
    },
    prepend: () => { },
    append: () => { },
    showCopyImageAddress: true,
    showSaveImageAs: true,
    showInspectElement: true,
    showSaveLinkAs: true,
    cut: true,
    copy: true,
    paste: true,
    save: true,
    saveImageAs: true,
    copyLink: true,
    saveLinkAs: true,
    inspect: true
});

let mainWindow;

function createWindow () {
    // Create the browser window.
    mainWindow = new BrowserWindow({
        // titleBarStyle: 'hidden',
        width: 1281,
        height: 800,
        minWidth: 640,
        minHeight: 480,
        autoHideMenuBar: true,
        icon: path.join(__dirname, 'www/img/icons/kiwix-64.png'),
        // titleBarStyle: 'hidden',
        // titleBarOverlay: {
        //     color: '#000000',
        //     symbolColor: '#ffffff',
        //     height: 16
        // },
        webPreferences: {
            preload: path.join(__dirname, 'preload.cjs'),
            nativeWindowOpen: true,
            nodeIntegrationInWorker: true,
            nodeIntegration: false,
            contextIsolation: true
            // enableRemoteModule: false,
            // sandbox: true
        }
    });

    // DEV: Uncomment this to open dev tools early in load process
    // mainWindow.webContents.openDevTools();

    // mainWindow.loadFile('www/index.html');
    mainWindow.loadURL('http://localhost:' + port + '/www/index.html');
}

function registerListeners () {
    ipcMain.on('file-dialog', function (event) {
        dialog.showOpenDialog(mainWindow, {
            filters: [
                { name: 'ZIM Archives', extensions: ['zim', 'zimaa'] }
            ],
            properties: ['openFile']
        }).then(function ({ filePaths }) {
            if (filePaths.length) {
                event.reply('file-dialog', filePaths[0]);
            }
        });
    });
    ipcMain.on('dir-dialog', function (event) {
        dialog.showOpenDialog(mainWindow, {
            properties: ['openDirectory']
        }).then(function ({ filePaths }) {
            if (filePaths.length) {
                event.reply('dir-dialog', filePaths[0]);
            }
        });
    });
    ipcMain.on('check-updates', function (event) {
        console.log('Auto-update check request received...\n');
        autoUpdater.checkForUpdates();
    });
    // Set a value using the Electron Store API
    ipcMain.on('set-store-value', function (event, key, value) {
        console.log('Setting store value for key ' + key + ' to ' + value);
        store.set(key, value);
    });
    // Get a value from the Electron Store API
    ipcMain.on('get-store-value', function (event, key) {
        var value = store.get(key);
        console.log('Store value for key ' + key + ' is ' + value);
        event.reply('get-store-value', key, value);
    });
    ipcMain.on('open-external', function (event, url) {
        console.log('Opening external URL: ' + url);
        shell.openExternal(url);
    });
    // Registers listener for download events
    mainWindow.webContents.session.on('will-download', (event, item, webContents) => {
        // Set the save path, making Electron not to prompt a save dialog.
        // item.setSavePath('/tmp/save.pdf')
        let receivedBytes = 0;
        item.on('updated', (event, state) => {
            if (state === 'interrupted') {
                console.log('Download is interrupted but can be resumed');
                mainWindow.webContents.send('dl-received', state);
            } else if (state === 'progressing') {
                if (item.isPaused()) {
                    console.log('Download is paused');
                    mainWindow.webContents.send('dl-received', 'paused');
                } else {
                    const newReceivedBytes = item.getReceivedBytes();
                    const totalBytes = item.getTotalBytes();
                    if (newReceivedBytes - receivedBytes < 250000) return;
                    receivedBytes = newReceivedBytes;
                    mainWindow.webContents.send('dl-received', receivedBytes, totalBytes);
                }
            }
        });
        item.once('done', (event, state) => {
            if (state === 'completed') {
                console.log('Download successful');
            } else {
                console.log(`Download failed: ${state}`);
            }
            mainWindow.webContents.send('dl-received', state);
        });
    });
}

// Get the launch file path
function processLaunchFilePath (arg) {
    console.log('Scanning for launch file path...');
    var openFilePath = null;
    if (arg && arg.length >= 2) {
        for (var i = 0; i < arg.length; i++) {
            console.log('Arg ' + i + ': ' + arg[i]);
            if (/\.zim(?:\w\w)?$/i.test(arg[i])) {
                openFilePath = arg[i];
                break;
            }
        }
        console.log('Launch file path: ' + openFilePath);
    }
    return openFilePath;
}

// Prevent launching multiple instances for now (they are not isolated)
// Code from https://stackoverflow.com/a/73669484/9727685
// Behaviour on second instance for parent process
const gotSingleInstanceLock = app.requestSingleInstanceLock();
if (!gotSingleInstanceLock) {
    app.quit(); // Quits the app if app.requestSingleInstanceLock() returns false
} else {
    app.on('second-instance', (_, argv) => {
        // User requested a second instance of the app.
        // argv has the process.argv arguments of the second instance.
        if (app.hasSingleInstanceLock()) {
            if (mainWindow) {
                if (mainWindow.isMinimized()) {
                    mainWindow.restore();
                }
                mainWindow.focus();
                const launchFilePath = processLaunchFilePath(argv);
                mainWindow.webContents.send('get-launch-file-path', launchFilePath);
            }
        }
    });
}

// SSL options
// var options = {
//     key: fs.readFileSync('path/to/your/key.pem'),
//     cert: fs.readFileSync('path/to/your/cert.pem')
// };

app.whenReady().then(() => {
    const server = express()

    // Add security headers
    server.use((req, res, next) => {
        res.setHeader('X-Content-Type-Options', 'nosniff');
        // res.setHeader('X-Frame-Options', 'SAMEORIGIN');
        res.setHeader('X-XSS-Protection', '1; mode=block');
        // We already set the CSP in the HTML file and in the SErviceWorker...
        // res.setHeader('Content-Security-Policy', "default-src 'self'");
        next();
    });

    // Whitelist specific root files that are needed by the app
    const whitelistedRootFiles = [
        'service-worker.js',
        'manifest.json',
        'package.json'
    ];

    whitelistedRootFiles.forEach(file => {
        server.get(`/${file}`, (_req, res) => {
            res.sendFile(path.join(__dirname, file));
        });
    });

    // In development mode, serve node_modules for dependencies (e.g., jQuery)
    // Production builds bundle these dependencies, so this is only needed in dev
    const isDevelopment = fs.existsSync(path.join(__dirname, 'node_modules'));
    if (isDevelopment) {
        console.log('Development mode detected: serving node_modules');
        server.use('/node_modules', express.static(path.join(__dirname, 'node_modules')));
    }

    // Serve static files from the www directory only
    server.use('/www', express.static(path.join(__dirname, 'www')));

    // Function to start the Express server and check for port availability
    const startServer = (port) => {
        if (port > 3999) { // Set a reasonable maximum
            console.error('Unable to find available port in acceptable range');
            // Remove the expressPort key from the store so app will try again on restart
            store.delete('expressPort');
            app.quit();
            return;
        }
        expressServer = server.listen(port, '127.0.0.1', () => {
            console.log(`Server running on port ${port} (localhost only)`);
            // Create the new window
            createWindow();
            registerListeners();
            mainWindow.webContents.on('did-finish-load', () => {
                const launchFilePath = processLaunchFilePath(process.argv);
                mainWindow.webContents.send('get-launch-file-path', launchFilePath);
            });
        }).on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                const newPort = port + 10;
                console.log(`Port ${port} is already in use, trying port ${newPort}`);
                store.set('expressPort', newPort);
                startServer(newPort); // Try the next port
            } else {
                console.error(err);
                app.quit(); // Or handle error differently
            }
        });
    };

    startServer(port);

    var appName = app.getName();
    console.log('App name: ' + appName);

    // Send message to renderer if update is available
    autoUpdater.on('update-downloaded', function (info) {
        mainWindow.webContents.send('update-available', info);
    });
    autoUpdater.on('download-progress', function (info) {
        mainWindow.webContents.send('update-available', info);
    });

    app.on('activate', function () {
        // On macOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });

    let permissionPathGranted = null;
    // Set up filesystem permission check handler (for PERSISTENT/STORED permissions)
    session.defaultSession.setPermissionCheckHandler((webContents, permission, origin, details) => {
        if (permission === 'fileSystem') {
            if (details.filePath && permissionPathGranted !== details.filePath) {
                console.log('\nPermission check received:');
                console.log('  Permission type:', permission);
                console.log('  Origin:', origin);
                console.log('  Details:', JSON.stringify(details, null, 2).replace(/\n/g, '\n      '));
                console.log('  -> Granting PERSISTENT filesystem permission\n');
                permissionPathGranted = details.filePath;
            }
            return true; // Note: return value, not callback
        }
    });
});

// Quit when all windows are closed.
app.on('window-all-closed', function () {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') app.quit();
});

// Explicit shutdown of the Express server for security
app.on('before-quit', () => {
    if (expressServer) {
        expressServer.close();
    }
});
