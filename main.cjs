// Modules to control application life and create native browser window
const { app, dialog, ipcMain, BrowserWindow, shell, session } = require('electron');
const express = require('express');
const Store = require('electron-store');
const path = require('path');
const { autoUpdater } = require('electron-updater');
const contextMenu = require('electron-context-menu');
const fs = require('fs');
const os = require('os');
// const https = require('https');

const store = new Store();

let expressServer; // This gets populated in the startServer function
let currentBinding = '127.0.0.1'; // Always start secure, session-only
let server; // Express server instance
let startServer; // Function to start the server
let restartServer; // Function to restart the server with new binding
const connections = new Set(); // Track active connections for clean shutdown

// Helper function to get local IP address
function getLocalIPAddress () {
    const interfaces = os.networkInterfaces();
    const candidates = [];

    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            // Skip internal (loopback) and non-IPv4 addresses
            if (iface.family === 'IPv4' && !iface.internal) {
                const addr = iface.address;
                // Prioritize common private network ranges (192.168.x.x and 10.x.x.x)
                // These are more likely to be real WiFi/Ethernet connections
                if (addr.startsWith('192.168.') || addr.startsWith('10.')) {
                    candidates.unshift({ priority: 1, address: addr, name: name });
                } else if (addr.startsWith('172.')) {
                    // 172.16-31.x.x is private, but often virtual adapters
                    // Lower priority
                    candidates.push({ priority: 2, address: addr, name: name });
                } else {
                    // Public IP or other
                    candidates.push({ priority: 3, address: addr, name: name });
                }
            }
        }
    }

    if (candidates.length > 0) {
        // Sort by priority and return the best candidate
        candidates.sort((a, b) => a.priority - b.priority);
        console.log('Selected IP address: ' + candidates[0].address + ' (' + candidates[0].name + ')');
        return candidates[0].address;
    }

    return 'localhost'; // Fallback
}

// Get the stored port value or standard value if not set
// Use these values:
// 3000: Main App
// 3001: WikiMed
// 3002: WikiVoyage
let port = 3001;
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
        icon: path.join(__dirname, 'build/64x64.png'),
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
    // Toggle external access (binding to 0.0.0.0 vs 127.0.0.1)
    ipcMain.handle('toggle-external-access', async (event, enable) => {
        const newBinding = enable ? '0.0.0.0' : '127.0.0.1';
        console.log(`Toggle external access: ${enable} (binding to ${newBinding})`);
        try {
            await restartServer(newBinding);
            const localIP = enable ? getLocalIPAddress() : null;
            return { success: true, binding: currentBinding, localIP: localIP };
        } catch (err) {
            console.error('Error toggling external access:', err);
            return { success: false, error: err.message };
        }
    });
    // Get current external access state
    ipcMain.handle('get-external-access-state', () => {
        const isExternal = currentBinding === '0.0.0.0';
        const localIP = isExternal ? getLocalIPAddress() : null;
        console.log(`Get external access state: ${isExternal} (binding: ${currentBinding})`);
        return { enabled: isExternal, binding: currentBinding, localIP: localIP };
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
    server = express()

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
        'replayWorker.js'
    ];

    whitelistedRootFiles.forEach(file => {
        server.get(`/${file}`, (_req, res) => {
            res.sendFile(path.join(__dirname, file));
        });
    });

    // In development mode, serve node_modules for dependencies (e.g., jQuery)
    // Production builds bundle these dependencies, so this is only needed in dev
    // We detect dev mode by checking if app.js exists (production uses bundle.min.js)
    const isDevelopment = fs.existsSync(path.join(__dirname, 'www/js/app.js'));
    if (isDevelopment) {
        console.log('Development mode detected: serving node_modules');
        server.use('/node_modules', express.static(path.join(__dirname, 'node_modules')));
    }

    // Serve static files from the www directory only
    server.use('/www', express.static(path.join(__dirname, 'www')));

    // Redirect root to the main app page
    server.get('/', (_req, res) => {
        res.redirect('/www/index.html');
    });

    // Function to start the Express server and check for port availability
    startServer = (port, binding = currentBinding, callback) => {
        if (port > 3999) { // Set a reasonable maximum
            console.error('Unable to find available port in acceptable range');
            // Remove the expressPort key from the store so app will try again on restart
            store.delete('expressPort');
            app.quit();
            return;
        }
        expressServer = server.listen(port, binding, () => {
            console.log(`Server running on port ${port} bound to ${binding}`);
            // Create window and register listeners on initial startup (after server is listening)
            if (!mainWindow) {
                createWindow();
                registerListeners();
                mainWindow.webContents.on('did-finish-load', () => {
                    const launchFilePath = processLaunchFilePath(process.argv);
                    mainWindow.webContents.send('get-launch-file-path', launchFilePath);
                });
            }
            // Call the callback if provided (used by restartServer)
            if (callback) callback();
        }).on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                const newPort = port + 10;
                console.log(`Port ${port} is already in use, trying port ${newPort}`);
                store.set('expressPort', newPort);
                startServer(newPort, binding, callback); // Try the next port with same binding
            } else {
                console.error(err);
                app.quit(); // Or handle error differently
            }
        });

        // Track connections for clean shutdown
        expressServer.on('connection', (conn) => {
            connections.add(conn);
            conn.on('close', () => {
                connections.delete(conn);
            });
        });
    };

    // Function to restart server with new binding
    restartServer = (newBinding) => {
        return new Promise((resolve, reject) => {
            if (expressServer) {
                console.log(`Restarting server with binding: ${newBinding}`);
                console.log(`Closing ${connections.size} active connection(s)...`);

                // Forcefully close all active connections
                connections.forEach((conn) => {
                    conn.destroy();
                });
                connections.clear();

                // Set a timeout in case close hangs
                const closeTimeout = setTimeout(() => {
                    console.warn('Server close timeout - forcing restart anyway');
                    currentBinding = newBinding;
                    startServer(port, newBinding, () => {
                        resolve(currentBinding);
                    });
                }, 2000);

                // Attempt graceful close
                expressServer.close((err) => {
                    clearTimeout(closeTimeout);
                    if (err) {
                        console.error('Error closing server:', err);
                        // Don't reject - try to start anyway
                    }
                    currentBinding = newBinding;
                    startServer(port, newBinding, () => {
                        resolve(currentBinding);
                    });
                });
            } else {
                currentBinding = newBinding;
                startServer(port, newBinding, () => {
                    resolve(currentBinding);
                });
            }
        });
    };

    // Start the server (this will create the window and register listeners once ready)
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
        console.log('Shutting down server...');
        // Forcefully close all active connections
        connections.forEach((conn) => {
            conn.destroy();
        });
        connections.clear();
        expressServer.close();
    }
});
