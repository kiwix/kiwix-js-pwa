// Modules to control application life and create native browser window
const { app, dialog, ipcMain, BrowserWindow, shell, session } = require('electron');
const express = require('express');
const Store = require('electron-store');
const path = require('path');
const { autoUpdater } = require('electron-updater');
const contextMenu = require('electron-context-menu');
const fs = require('fs');
const os = require('os');
const { fileURLToPath } = require('url');
// In-app BitTorrent downloader (lazily imports WebTorrent on first use)
const torrentDownloader = require('./torrentDownloader.cjs');
const { createLibzimHost } = require('./libzimNodeWorker.cjs');
// const https = require('https');

const store = new Store();

let expressServer; // This gets populated in the startServer function
let currentBinding = '127.0.0.1'; // Always start secure, session-only
let server; // Express server instance
let startServer; // Function to start the server
let restartServer; // Function to restart the server with new binding
const connections = new Set(); // Track active connections for clean shutdown

// Identifies this app in Kiwix's server statistics, e.g. kiwix/3.9.1 (js-electron-windows), in the format proposed in
// kiwix/operations#797. Packaged apps add their flavour after the parenthesis, e.g. (js-electron-windows) wikimed, so
// that they count as the same reader; it is taken from the productName in the flavour branch's package.json. It is sent
// only to Kiwix's own servers, rather than set app-wide with app.userAgentFallback, which would also change
// navigator.userAgent, read by the renderer to detect the runtime [kiwix-js-pwa #986]
const appFlavour = /wikivoyage/i.test(app.getName()) ? ' wikivoyage' : /wikimed/i.test(app.getName()) ? ' wikimed' : '';
const kiwixUserAgent = 'kiwix/' + app.getVersion().replace(/-E$/i, '') + ' (js-electron-' +
    ({ win32: 'windows', darwin: 'macos' }[process.platform] || process.platform) + ')' + appFlavour;

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
let port = 3000;
// Check if we previously stored a different port, and validate it for security
if (store.has('expressPort')) {
    const storedPort = store.get('expressPort');
    if (typeof storedPort === 'number' && storedPort >= 3000 && storedPort <= 3999) {
        port = storedPort;
    }
}
console.log('Express Port: ' + port);

// The folders whose ZIM archives the renderer may read through window.fs (see preload.cjs, which enforces this). Only the main
// process adds to this list, from paths it obtained itself: the file and folder dialogues, the launch file, and files the user
// dropped or picked in the app window (reported by the preload from trusted events). Picked folders are remembered across
// launches, so that the app can reopen the last archive; the packaged archive folder is always allowed, so that packaged apps
// (e.g. WikiMed) open their archive without the user having to pick it
const ALLOWED_FOLDERS_KEY = 'fsAllowedFolders';
const MAX_ALLOWED_FOLDERS = 50;
const appRootDirectory = __dirname.replace(/[\\/]app\.asar$/, '');
const packagedArchiveFolders = [path.join(appRootDirectory, 'archives')];
if (process.resourcesPath) packagedArchiveFolders.push(path.join(process.resourcesPath, 'archives'));

function normalizeFolder (folder) {
    folder = path.resolve(folder);
    return process.platform === 'win32' ? folder.toLowerCase() : folder;
}

function getStoredAllowedFolders () {
    const stored = store.get(ALLOWED_FOLDERS_KEY);
    return Array.isArray(stored) ? stored.filter(folder => typeof folder === 'string' && folder) : [];
}

function getAllowedFolders () {
    return packagedArchiveFolders.concat(getStoredAllowedFolders());
}

function isAllowedFolder (folder) {
    if (typeof folder !== 'string' || !folder) return false;
    const normalized = normalizeFolder(folder);
    return getAllowedFolders().some(allowed => normalizeFolder(allowed) === normalized);
}

// Adds folders to the remembered list (most recent last, oldest dropped beyond the limit) and sends the new list to the preload
function allowFolders (folders) {
    let stored = getStoredAllowedFolders();
    folders.forEach(function (folder) {
        if (typeof folder !== 'string' || !folder) return;
        folder = path.resolve(folder);
        stored = stored.filter(existing => normalizeFolder(existing) !== normalizeFolder(folder));
        stored.push(folder);
    });
    store.set(ALLOWED_FOLDERS_KEY, stored.slice(-MAX_ALLOWED_FOLDERS));
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('fs-allowed-folders', getAllowedFolders());
    }
}

// Read synchronously by the preload before any page script runs
ipcMain.on('fs-get-allowed-folders', function (event) {
    event.returnValue = getAllowedFolders();
});

// Folders of ZIM files the user has dropped or picked in the app window; this channel is not exposed to page script
ipcMain.on('fs-allow-user-folders', function (event, folders) {
    if (Array.isArray(folders)) allowFolders(folders);
});

// A full reset of the app forgets the remembered folders, keeping only the folder of any file the app was launched with (which
// the reloaded app opens again) and the packaged archive folder
ipcMain.handle('fs-reset-allowed-folders', function () {
    store.delete(ALLOWED_FOLDERS_KEY);
    allowFolders(launchFilePath ? [path.dirname(launchFilePath)] : []);
});

// Whether the renderer may read the given file: a ZIM archive (or part of a split archive) in an allowed folder
function isAllowedZimFile (filePath) {
    if (typeof filePath !== 'string' || !filePath) return false;
    const resolved = path.resolve(filePath);
    if (!regexpZimFile.test(path.basename(resolved)) || !isAllowedFolder(path.dirname(resolved))) return false;
    // As in preload.cjs, the file the name points to (following any link) must be a ZIM archive too
    try {
        return regexpZimFile.test(path.basename(fs.realpathSync(resolved)));
    } catch (err) {
        return false;
    }
}

// libzim for the archives the renderer knows only by their path (see libzimNodeWorker.cjs)
const libzimHost = createLibzimHost({ isAllowedZimFile: isAllowedZimFile });

// The only electron-store keys the renderer may read or write
const rendererStoreKeys = ['expressPort'];

// The in-app BitTorrent downloader only fetches Kiwix torrents
const regexpKiwixTorrentUrl = /^https?:\/\/(?:[a-z0-9-]+\.)*kiwix\.org\/[^?#]+\.torrent$/i;

// The download the renderer may later ask to discard (its folder and file name), recorded here rather than taken from the
// renderer, so that the discard request can only ever delete the partial file of the app's own download
const TORRENT_IN_PROGRESS_KEY = 'torrentInProgress';

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
            // The page's Web Workers do not need Node.js: libzim reads archives through Node's fs in the main process
            // instead (see libzimNodeWorker.cjs)
            nodeIntegrationInWorker: false,
            nodeIntegration: false,
            // The preload script needs Node.js, and Electron sandboxes the renderer unless this is set explicitly
            sandbox: false,
            contextIsolation: true
            // enableRemoteModule: false,
        }
    });

    // DEV: Uncomment this to open dev tools early in load process
    // mainWindow.webContents.openDevTools();

    // mainWindow.loadFile('www/index.html');
    mainWindow.loadURL('http://localhost:' + port + '/www/index.html');

    // Send the renderer the path of any archive it should open, once its scripts have run (see the note on
    // 'get-launch-file-path-sync' below). This belongs to every window rather than only the first, because on
    // macOS the app keeps running after its window is closed and the dock icon or Finder can open a new one,
    // whose preload script would otherwise report a launch file that is never sent [kiwix-js-pwa #917]
    mainWindow.webContents.on('did-finish-load', () => {
        mainWindow.webContents.send('get-launch-file-path', launchFilePath);
    });

    // The page's own Web Workers end with the page, but the libzim worker in the main process has to be stopped when the page
    // is reloaded (e.g. by resetting the app) or closed
    mainWindow.webContents.on('did-navigate', () => libzimHost.terminate());
    mainWindow.webContents.on('render-process-gone', () => libzimHost.terminate());
    mainWindow.on('closed', () => libzimHost.terminate());
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
                // The folder, not just the file, because the other parts of a split archive sit beside it
                allowFolders([path.dirname(filePaths[0])]);
                event.reply('file-dialog', filePaths[0]);
            }
        });
    });
    ipcMain.on('dir-dialog', function (event) {
        dialog.showOpenDialog(mainWindow, {
            properties: ['openDirectory']
        }).then(function ({ filePaths }) {
            if (filePaths.length) {
                allowFolders([filePaths[0]]);
                event.reply('dir-dialog', filePaths[0]);
            }
        });
    });
    // Requests for libzim, for an archive the renderer knows only by its path (see libzimNodeWorker.cjs, which validates them)
    ipcMain.handle('libzim-call', (event, data) => libzimHost.call(data));
    ipcMain.on('libzim-terminate', () => libzimHost.terminate());
    ipcMain.on('check-updates', function (event) {
        console.log('Auto-update check request received...\n');
        autoUpdater.checkForUpdates();
    });
    // Set a value using the Electron Store API
    ipcMain.on('set-store-value', function (event, key, value) {
        if (!rendererStoreKeys.includes(key)) {
            console.warn('Refusing to set store value for key ' + key);
            return;
        }
        console.log('Setting store value for key ' + key + ' to ' + value);
        store.set(key, value);
    });
    // Get a value from the Electron Store API
    ipcMain.on('get-store-value', function (event, key) {
        if (!rendererStoreKeys.includes(key)) {
            console.warn('Refusing to get store value for key ' + key);
            return;
        }
        var value = store.get(key);
        console.log('Store value for key ' + key + ' is ' + value);
        event.reply('get-store-value', key, value);
    });
    ipcMain.on('open-external', function (event, url) {
        let protocol = '';
        try {
            protocol = new URL(url).protocol;
        } catch (err) {
            protocol = '';
        }
        if (protocol !== 'http:' && protocol !== 'https:') {
            console.warn('Refusing to open external URL: ' + url);
            return;
        }
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
    // In-app BitTorrent download handlers: these wrap torrentDownloader.cjs, relaying progress
    // and completion events to the renderer over IPC
    const sendToRenderer = function (channel, data) {
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send(channel, data);
        }
    };
    ipcMain.handle('torrent-start', async (event, args) => {
        // Only Kiwix torrents, and only into a folder the user has picked
        if (!args || typeof args.torrentUrl !== 'string' || !regexpKiwixTorrentUrl.test(args.torrentUrl)) {
            return { ok: false, error: 'Only torrents from kiwix.org can be downloaded' };
        }
        if (!isAllowedFolder(args.savePath)) {
            return { ok: false, error: 'The download folder has not been picked in the app: please choose it again' };
        }
        // The infoHash of this download, once known: it lets the renderer route the error
        // event to the right torrent (progress and done statuses carry their own infoHash)
        let infoHash = null;
        // Set once the download has finished or failed, which can happen before startDownload resolves (e.g. when resuming
        // a file that was already complete), in which case it must not be recorded as discardable
        let settled = false;
        // Forgets the recorded download once it can no longer be discarded (it finished, failed or was stopped)
        const forgetTorrentInProgress = function () {
            settled = true;
            const record = store.get(TORRENT_IN_PROGRESS_KEY);
            if (record && record.infoHash === infoHash) store.delete(TORRENT_IN_PROGRESS_KEY);
        };
        try {
            // The torrent-start guard above admits only kiwix.org torrents, so the .torrent file is always fetched with kiwixUserAgent
            const status = await torrentDownloader.startDownload({ torrentUrl: args.torrentUrl, savePath: args.savePath, userAgent: kiwixUserAgent }, {
                onProgress: (s) => sendToRenderer('torrent-progress', s),
                onDone: (s) => {
                    forgetTorrentInProgress();
                    sendToRenderer('torrent-done', s);
                },
                onError: (err) => {
                    forgetTorrentInProgress();
                    sendToRenderer('torrent-error', { infoHash: infoHash, message: err.message });
                }
            });
            infoHash = status.infoHash;
            // If it settled early, infoHash was not yet known, so forget now any record of it left by an earlier session
            if (settled) forgetTorrentInProgress();
            else store.set(TORRENT_IN_PROGRESS_KEY, { infoHash: infoHash, savePath: path.resolve(args.savePath), name: status.name });
            return { ok: true, status: status };
        } catch (err) {
            console.error('Torrent start failed:', err);
            return { ok: false, error: err.message };
        }
    });
    ipcMain.handle('torrent-stop', async (event, infoHash, deletePartial) => {
        const record = store.get(TORRENT_IN_PROGRESS_KEY);
        if (record && record.infoHash === infoHash) store.delete(TORRENT_IN_PROGRESS_KEY);
        return torrentDownloader.stopTorrent(infoHash, deletePartial);
    });
    ipcMain.handle('torrent-status', (event, infoHash) => {
        return torrentDownloader.getStatus(infoHash);
    });
    ipcMain.on('torrent-set-seeding', (event, value) => {
        console.log('Setting torrent seeding to ' + value);
        torrentDownloader.setKeepSeeding(value);
    });
    // Deletes the partial file of the download recorded at 'torrent-start' (any arguments from the renderer are ignored)
    ipcMain.handle('torrent-delete-partial', async () => {
        const record = store.get(TORRENT_IN_PROGRESS_KEY);
        store.delete(TORRENT_IN_PROGRESS_KEY);
        if (!record || typeof record.savePath !== 'string' || typeof record.name !== 'string') {
            return { ok: true, deleted: false };
        }
        const name = path.basename(record.name);
        if (!regexpZimFile.test(name)) return { ok: true, deleted: false };
        try {
            return { ok: true, deleted: await torrentDownloader.deletePartialFile(record.savePath, name) };
        } catch (err) {
            console.error('Torrent partial-file delete failed:', err);
            return { ok: false, error: err.message };
        }
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

// Matches ZIM archives, including the first part of a split archive (.zimaa)
const regexpZimFile = /\.zim(?:\w\w)?$/i;

// Linux file managers hand the app a file:// URI, because the .desktop entry electron-builder generates launches
// it with %U, and a percent-encoded URI is not a path any of our filesystem code can open. Anything else, including
// the plain paths Windows and macOS supply, is returned untouched [kiwix-js-pwa #917]
function pathFromFileUri (arg) {
    if (!/^file:\/\//i.test(arg)) return arg;
    try {
        return fileURLToPath(arg);
    } catch (err) {
        console.error('Could not convert ' + arg + ' to a file path', err);
        return arg;
    }
}

// Get the launch file path
function processLaunchFilePath (arg) {
    console.log('Scanning for launch file path...');
    var openFilePath = null;
    if (arg && arg.length >= 2) {
        for (var i = 0; i < arg.length; i++) {
            console.log('Arg ' + i + ': ' + arg[i]);
            if (regexpZimFile.test(arg[i])) {
                openFilePath = pathFromFileUri(arg[i]);
                break;
            }
        }
        console.log('Launch file path: ' + openFilePath);
    }
    return openFilePath;
}

// The path of the ZIM archive that the OS most recently asked us to open, or null if there is none. On Windows
// and Linux the OS passes it on the command line, but on macOS Launch Services delivers it through the 'open-file'
// event, which on a cold launch fires before the app has a window. Both routes therefore store the path here, and
// the renderer is always given this value, so that what it is told at startup and what it loads stay in step
let launchFilePath = processLaunchFilePath(process.argv);
if (launchFilePath) allowFolders([path.dirname(launchFilePath)]);

// Opens an archive that the OS has asked us to open after startup (or, on macOS, during it)
function openLaunchFile (filePath) {
    if (filePath) {
        launchFilePath = filePath;
        allowFolders([path.dirname(filePath)]);
    }
    // Still starting up: the window has not been created yet, and will pick up the stored path when it is
    if (!mainWindow) return;
    if (mainWindow.isDestroyed()) {
        // On macOS the app stays running after its window is closed, so open a new one (which reads the stored path)
        createWindow();
        return;
    }
    if (mainWindow.isMinimized()) {
        mainWindow.restore();
    }
    mainWindow.focus();
    // While the page is (re)loading it may not yet be listening, so leave it to did-finish-load to send the path
    if (!mainWindow.webContents.isLoading()) {
        mainWindow.webContents.send('get-launch-file-path', filePath);
    }
}

// The 'get-launch-file-path' message is sent on did-finish-load (see createWindow), i.e. after all the renderer's
// scripts have run, which is too late for the renderer to know at startup that it should not also load the last-used
// archive (this caused the archive to be loaded, and verified, twice: see kiwix-js-pwa #915). We therefore
// also expose the path synchronously, for the preload script to read before any page script runs. This is
// registered at module level so that it is always in place by the time a preload can ask for it
ipcMain.on('get-launch-file-path-sync', function (event) {
    event.returnValue = launchFilePath;
});

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
            openLaunchFile(processLaunchFilePath(argv));
        }
    });
    // On macOS, opening a ZIM from Finder does not put its path in argv: Launch Services sends it through this event
    // instead, both when the app is already running and on a cold launch. In the latter case it can fire before the
    // app is ready, which is why it is registered here rather than in whenReady [kiwix-js-pwa #917]
    app.on('open-file', (event, filePath) => {
        event.preventDefault();
        console.log('Received request to open file: ' + filePath);
        if (regexpZimFile.test(filePath)) {
            openLaunchFile(filePath);
        }
    });
}

// SSL options
// var options = {
//     key: fs.readFileSync('path/to/your/key.pem'),
//     cert: fs.readFileSync('path/to/your/cert.pem')
// };

app.whenReady().then(() => {
    // app.quit() above is asynchronous, so a second instance still gets here before it exits. It must not start a
    // server: finding the port taken by the first instance, it would store the next one, moving the app (and all its
    // origin-scoped storage) to a different port on next launch every time a ZIM was opened while the app was running
    if (!gotSingleInstanceLock) return;
    server = express();

    // Only answer requests addressed to this machine by loopback name, IP address or local network name, so that a web page
    // cannot reach the server through a DNS name of its own that it has pointed at this machine
    const localHostName = os.hostname().toLowerCase();
    server.use((req, res, next) => {
        const hostName = (req.hostname || '').toLowerCase().replace(/^\[|\]$/g, '');
        if (hostName === 'localhost' || hostName === localHostName || /\.local$/.test(hostName) ||
            /^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostName) || hostName.indexOf(':') !== -1) {
            return next();
        }
        console.warn('Refusing request for host ' + req.headers.host);
        res.status(421).end();
    });

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
            // The root option confines send's dotfile check to the file name. Without it, send 1.x (Express 5) refuses any
            // path with a dot-segment, such as the /tmp/.mount_* directory that an AppImage runs from
            res.sendFile(file, { root: __dirname });
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
    startServer = (serverPort, binding = currentBinding, callback) => {
        if (serverPort > 3999) { // Set a reasonable maximum
            console.error('Unable to find available port in acceptable range');
            // Remove the expressPort key from the store so app will try again on restart
            store.delete('expressPort');
            app.quit();
            return;
        }
        expressServer = server.listen(serverPort, binding, () => {
            console.log(`Server running on port ${serverPort} bound to ${binding}`);
            // Record the port actually bound, which differs from the stored one if that was taken: the window is loaded
            // from this port, and restartServer rebinds to it, so neither may be left pointing at another program's server
            port = serverPort;
            // Create window and register listeners on initial startup (after server is listening)
            if (!mainWindow) {
                createWindow();
                registerListeners();
            }
            // Call the callback if provided (used by restartServer)
            if (callback) callback();
        }).on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                const newPort = serverPort + 10;
                console.log(`Port ${serverPort} is already in use, trying port ${newPort}`);
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

    // Send kiwixUserAgent on all requests the app's windows make to Kiwix's servers (catalogue, meta4, downloads)
    session.defaultSession.webRequest.onBeforeSendHeaders({ urls: ['*://*.kiwix.org/*'] }, (details, callback) => {
        details.requestHeaders['User-Agent'] = kiwixUserAgent;
        callback({ requestHeaders: details.requestHeaders });
    });

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

    // Electron emits this when the user picks a file or folder that Chromium's blocklist protects (e.g. ~/Documents itself).
    // With no listener the request is never answered, so the picker never settles and Chromium then refuses every later
    // picker as "already active" until a restart [kiwix-js-pwa #992]. Legacy Electrons (Win7, High Sierra) lack the event.
    session.defaultSession.on('file-system-access-restricted', async (event, details, callback) => {
        const { response } = await dialog.showMessageBox(mainWindow, {
            type: 'warning',
            message: 'This ' + (details.isDirectory ? 'folder' : 'file') + ' cannot be opened because it contains system files.',
            detail: details.path + '\n\nPlease choose a subfolder, or a different location.',
            buttons: ['Choose another location', 'Cancel'],
            defaultId: 0,
            cancelId: 1
        });
        callback(response === 0 ? 'tryAgain' : 'deny');
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
    // Stop any active or seeding torrents (partial downloads are kept on disk for later resume)
    torrentDownloader.destroyAll();
    libzimHost.terminate();
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
