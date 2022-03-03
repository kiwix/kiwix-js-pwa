// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.

'use strict';

// DEV: TO SUPPORT ELECTRON ^12 YOU WILL NEED THIS
const { ipcRenderer, contextBridge } = require('electron');
const { open, read, close, stat, readdir } = require('fs');

console.log("Inserting required Electron functions into DOM...");

// DEV: FOR ELECTRON ^12 DO IT THIS WAY:
contextBridge.exposeInMainWorld('fs', {
    open: open, 
    read: read,
    readdir: readdir,
    close: close, 
    stat: stat
});
// Event callback for electronAPI (you can add events to listen to, so long as main.js sends a message with name of the event)
contextBridge.exposeInMainWorld('electronAPI', {
    on: function (event, callback) {
        ipcRenderer.on(event, function (_, data) {
            callback(data);
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

