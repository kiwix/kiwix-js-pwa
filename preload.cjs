// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.

'use strict';

// A regular expression that matches the hash of the Kiwix publisher on the Microsoft Store (CN=0A5438F5-EEA6-4300-9B77-E45BBD148885)
// If the app is installed from the Store rather than from the signed GitHub release, we need to disable update checking
const regexpInstalledFromMicrosoftStore = /_mc3511b08yc0e/;
// Print Electron version
console.log('[Preload] Electron version: ' + process.versions.electron);
// Print app directory and whether installed from Microsoft Store
console.log('[Preload] App directory: ' + __dirname);
console.log('[Preload] Is app installed from Microsoft Store? ' + (process.windowsStore && regexpInstalledFromMicrosoftStore.test(__dirname) ? 'Yes' : 'No'));

// Function to check APPX/MSIX - defined here for logging
const isAppxOrMSIX = function () {
    return !!(
        process.windowsStore ||
        process.env.LOCALAPPDATA && process.env.LOCALAPPDATA.includes('Packages') ||
        __dirname.includes('WindowsApps') ||
        __dirname.includes('Packages') ||
        process.env.ProgramW6432 && process.env.ProgramW6432.includes('WindowsApps')
    );
};

console.log('[Preload] Is app running as APPX/MSIX? ' + (isAppxOrMSIX() ? 'Yes' : 'No'));
console.log('[Preload] Window location: ' + window.location.pathname);
console.log('[Preload] Store publisher hash: ' + regexpInstalledFromMicrosoftStore);

// DEV: TO SUPPORT ELECTRON ^12 YOU WILL NEED THIS
const electron = require('electron');
const { ipcRenderer, contextBridge, webFrame } = electron;
// webUtils only exists from Electron 29; the legacy builds (Electron 18, 22 and 26) use File.path instead
const webUtils = electron.webUtils;
const fs = require('fs');
const path = require('path');

console.log('[Preload] Inserting required Electron functions into DOM...');

// The renderer may only read ZIM archives (including the parts of split archives) that sit directly inside a folder the
// main process has recorded: a folder the user picked, the folder of a file the user picked, dropped or launched the app
// with, or the folder of the packaged archive. The list is kept here, in the preload's isolated context, where page script
// cannot alter it, so that reads keep going straight to Node; the main process owns it and sends us every change
const regexpZimFileName = /^[^\\/:]+\.zim(?:\w\w)?$/i;
const isCaseInsensitiveFs = process.platform === 'win32';
let allowedFolders = ipcRenderer.sendSync('fs-get-allowed-folders');
ipcRenderer.on('fs-allowed-folders', function (_, folders) {
    allowedFolders = folders;
});
// File descriptors opened through the guarded open() below: read() and close() accept no others
const openedFds = new Set();

function normalizeFolder (folder) {
    folder = path.resolve(folder);
    return isCaseInsensitiveFs ? folder.toLowerCase() : folder;
}

function isAllowedFolder (folder) {
    if (typeof folder !== 'string' || !folder) return false;
    const normalized = normalizeFolder(folder);
    return allowedFolders.some(function (allowed) {
        return normalizeFolder(allowed) === normalized;
    });
}

function isAllowedZimFile (filePath) {
    if (typeof filePath !== 'string' || !filePath) return false;
    const resolved = path.resolve(filePath);
    return regexpZimFileName.test(path.basename(resolved)) && isAllowedFolder(path.dirname(resolved));
}

// Fails the call the way a missing file would, so that the app's usual "please pick the file again" handling runs
function denyAccess (callback, target) {
    const err = new Error('The app has not been given access to ' + target + '. Please pick the file or folder again.');
    err.code = 'EACCES';
    setTimeout(function () {
        callback(err);
    }, 0);
}

// Records the folders of ZIM files that the user has just dropped or picked through a file input in the app window (on the
// legacy builds these files carry a path that the app goes on to read through window.fs). Only trusted events count: page
// script can dispatch neither a genuine drop nor a genuine file-input change, and a File it constructs itself has no path
function allowFoldersOfUserFiles (files) {
    if (!files) return;
    const folders = [];
    for (let i = 0; i < files.length; i++) {
        let filePath = '';
        try {
            filePath = webUtils ? webUtils.getPathForFile(files[i]) : files[i].path;
        } catch (err) {
            filePath = '';
        }
        if (filePath && regexpZimFileName.test(path.basename(filePath))) folders.push(path.dirname(path.resolve(filePath)));
    }
    if (!folders.length) return;
    // Update our copy synchronously, because the app reads the files as soon as its own handler runs
    allowedFolders = allowedFolders.concat(folders);
    ipcRenderer.send('fs-allow-user-folders', folders);
}
window.addEventListener('drop', function (e) {
    if (e.isTrusted && e.dataTransfer) allowFoldersOfUserFiles(e.dataTransfer.files);
}, true);
window.addEventListener('change', function (e) {
    if (e.isTrusted && e.target && e.target.type === 'file') allowFoldersOfUserFiles(e.target.files);
}, true);

// DEV: FOR ELECTRON ^12 DO IT THIS WAY:
// Keep window.fs an object with these method names: parts of the app detect Electron by its presence
contextBridge.exposeInMainWorld('fs', {
    open: function (filePath, flags, mode, callback) {
        callback = [flags, mode, callback].filter(function (arg) {
            return typeof arg === 'function';
        })[0];
        if (!callback) return;
        if (!isAllowedZimFile(filePath)) return denyAccess(callback, filePath);
        // Read-only, whatever flags were requested
        fs.open(filePath, 'r', function (err, fd) {
            if (!err) openedFds.add(fd);
            callback(err, fd);
        });
    },
    read: function (fd, buffer, offset, length, position, callback) {
        if (typeof callback !== 'function') return;
        if (!openedFds.has(fd)) return denyAccess(callback, 'this file descriptor');
        fs.read(fd, buffer, offset, length, position, callback);
    },
    close: function (fd, callback) {
        if (typeof callback !== 'function') callback = function () {};
        if (!openedFds.has(fd)) return denyAccess(callback, 'this file descriptor');
        openedFds.delete(fd);
        fs.close(fd, callback);
    },
    stat: function (filePath, options, callback) {
        if (typeof options === 'function') callback = options;
        if (typeof callback !== 'function') return;
        if (!isAllowedZimFile(filePath)) return denyAccess(callback, filePath);
        fs.stat(filePath, callback);
    },
    // Lists only the ZIM archives in the folder
    readdir: function (folder, options, callback) {
        if (typeof options === 'function') callback = options;
        if (typeof callback !== 'function') return;
        if (!isAllowedFolder(folder)) return denyAccess(callback, folder);
        fs.readdir(folder, function (err, fileNames) {
            callback(err, fileNames && fileNames.filter(function (name) {
                return regexpZimFileName.test(name);
            }));
        });
    }
});
// Exposed events and Event callback for electronAPI (you can add events to listen to, so long as main.js sends a message with name of the event)
contextBridge.exposeInMainWorld('electronAPI', {
    checkForUpdates: function () {
        ipcRenderer.send('check-updates');
    },
    setStoreValue: function (key, value) {
        ipcRenderer.send('set-store-value', key, value);
    },
    getStoreValue: function (key) {
        ipcRenderer.send('get-store-value', key);
    },
    openExternal: function (url) {
        ipcRenderer.send('open-external', url);
    },
    setZoomLimits: function (min, max) {
        console.log('[Preload] Setting zoom limits to ' + min + ' and ' + max);
        webFrame.setVisualZoomLevelLimits(min, max);
    },
    toggleExternalAccess: function (enable) {
        return ipcRenderer.invoke('toggle-external-access', enable);
    },
    getExternalAccessState: function () {
        return ipcRenderer.invoke('get-external-access-state');
    },
    // In-app BitTorrent needs WebTorrent 3.x (Node 20+) and the native node-datachannel WebRTC
    // addon. Two independent conditions gate it:
    //   Node 20+ — excludes every legacy target, each of which is pinned to an Electron whose Node
    //   is below that floor and has webtorrent stripped from its package at build time: 32-bit
    //   Linux (Electron 18.3.15 = Node 16), Windows 7/8/8.1 (Electron 22.3.25 = Node 16) and
    //   High Sierra/Mojave macOS (Electron 26.6.10 = Node 18).
    //   arch/platform — node-datachannel publishes a 32-bit prebuild for Windows only (as "x86";
    //   see afterPack.cjs, which installs it), so ia32 is supported on win32 but not elsewhere.
    // The renderer gates on this flag (see torrentClient.js) so builds without a loadable addon
    // never offer a download that would fail.
    torrentSupported: parseInt(process.versions.node, 10) >= 20 &&
        (process.arch !== 'ia32' || process.platform === 'win32'),
    // In-app BitTorrent download API (implemented in torrentDownloader.cjs, wired in main.cjs);
    // progress/completion events arrive via the generic 'on' listener below, on the channels
    // 'torrent-progress', 'torrent-done' and 'torrent-error'
    startTorrentDownload: function (args) {
        return ipcRenderer.invoke('torrent-start', args);
    },
    stopTorrentDownload: function (infoHash, deletePartial) {
        return ipcRenderer.invoke('torrent-stop', infoHash, deletePartial);
    },
    getTorrentStatus: function (infoHash) {
        return ipcRenderer.invoke('torrent-status', infoHash);
    },
    setTorrentSeeding: function (value) {
        ipcRenderer.send('torrent-set-seeding', value);
    },
    // Deletes the partial file of the download the main process recorded when it started it
    deletePartialTorrentFile: function () {
        return ipcRenderer.invoke('torrent-delete-partial');
    },
    // libzim in the main process, for archives the app knows only by their path (see libzimNodeWorker.cjs and zimArchive.js)
    callLibzim: function (data) {
        return ipcRenderer.invoke('libzim-call', data);
    },
    terminateLibzim: function () {
        ipcRenderer.send('libzim-terminate');
    },
    // The path of any ZIM the app was launched with (null if there is none). The renderer is also sent this
    // path over IPC once the page has loaded (which is what actually opens the archive), but that arrives
    // after the renderer's startup autoload has run, so we read it synchronously here to let the renderer
    // know in time that it should not also restore the last-used archive [kiwix-js-pwa #915]
    launchFilePath: ipcRenderer.sendSync('get-launch-file-path-sync'),
    isMicrosoftStoreApp: process.windowsStore && regexpInstalledFromMicrosoftStore.test(__dirname),
    isAppxOrMSIX: isAppxOrMSIX(),
    __dirname: __dirname,
    on: function (event, callback) {
        ipcRenderer.on(event, function (_, data1, data2) {
            callback(data1, data2);
        });
    }
});

// Adapted from: https://stackoverflow.com/questions/69717365/using-electron-save-dialog-in-renderer-with-context-isolation
contextBridge.exposeInMainWorld('dialog', {
    openFile: function () {
        ipcRenderer.send('file-dialog'); // adjust naming for your project
    },
    openDirectory: function () {
        ipcRenderer.send('dir-dialog'); // adjust naming for your project
    },
    // Provide an easier way to listen to events
    on: function (channel, callback) {
        ipcRenderer.on(channel, function (_, data) {
            callback(data);
        });
    }
});

// window.Buffer = Buffer;

// console.log(win.session.cookies);

// win.session.cookies.get({}, (error, cookies) => {
//     console.log(cookies);
// });
