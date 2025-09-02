// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.

'use strict';

// A regular expression that matches the hash of the Kiwix publisher on the Microsoft Store (CN=0A5438F5-EEA6-4300-9B77-E45BBD148885)
// If the app is installed from the Store rather than from the signed GitHub release, we need to disable update checking
const regexpInstalledFromMicrosoftStore = /_mc3511b08yc0e/;
console.log('[Preload] App directory: ' + __dirname);
console.log('[Preload] Is app installed from Microsoft Store? ' + (process.windowsStore && regexpInstalledFromMicrosoftStore.test(__dirname) ? 'Yes' : 'No'));

// Function to check APPX/MSIX - defined here for logging
const isAppxOrMSIX = function() {
    return !!(
        process.windowsStore ||
        process.env.LOCALAPPDATA && process.env.LOCALAPPDATA.includes('Packages') ||
        __dirname.includes('WindowsApps') ||
        __dirname.includes('Packages') ||
        process.env.ProgramW6432 && process.env.ProgramW6432.includes('WindowsApps')
    );
};

console.log('[Preload] Is app running as APPX/MSIX? ' + (isAppxOrMSIX() ? 'Yes' : 'No'));
console.log('[Preload] Window location: ' + window.location.pathname + '\nStore publisher hash: ' + regexpInstalledFromMicrosoftStore);

// DEV: TO SUPPORT ELECTRON ^12 YOU WILL NEED THIS
const { ipcRenderer, contextBridge, webFrame } = require('electron');
const { open, read, close, stat, readdir } = require('fs');

console.log('Inserting required Electron functions into DOM...');

// DEV: FOR ELECTRON ^12 DO IT THIS WAY:
contextBridge.exposeInMainWorld('fs', {
    open: open,
    read: read,
    readdir: readdir,
    close: close,
    stat: stat
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
        console.log('Setting zoom limits to ' + min + ' and ' + max);
        webFrame.setVisualZoomLevelLimits(min, max);
    },
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
