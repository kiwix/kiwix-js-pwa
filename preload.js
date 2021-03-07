// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.

'use strict';

// DEV: TO SUPPORT ELECTRON ^12 YOU WILL NEED THIS
// const { contextBridge } = require('electron');
const { open, read, close, stat } = require('fs');

console.log("Inserting required Electron functions into DOM...");

// DEV: FOR ELECTRON ^12 DO IT THIS WAY:
// contextBridge.exposeInMainWorld('fs', {
//     open: open, 
//     read: read,
//     close: close, 
//     stat: stat
// });

window.fs = {
    open: open, 
    read: read,
    close: close, 
    stat: stat
};
// window.Buffer = Buffer;

// console.log(win.session.cookies);

// win.session.cookies.get({}, (error, cookies) => {
//     console.log(cookies);
// });


// window.addEventListener('DOMContentLoaded', () => {
//     const replaceText = (selector, text) => {
//       const element = document.getElementById(selector)
//       if (element) element.innerText = text;
//     } 
    
//     for (const type of ['chrome', 'node', 'electron']) {
//       replaceText(`${type}-version`, process.versions[type]);
//     }
//   });

