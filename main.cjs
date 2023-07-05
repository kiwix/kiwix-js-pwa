// Modules to control application life and create native browser window
const { app, dialog, ipcMain, BrowserWindow } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');
const contextMenu = require('electron-context-menu');

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
            nodeIntegrationInWorker: true
        }
    });

    // DEV: Uncomment this to open dev tools early in load process
    // mainWindow.webContents.openDevTools();

    mainWindow.loadFile('www/index.html');
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
                    if (newReceivedBytes - receivedBytes < 250000) return;
                    receivedBytes = newReceivedBytes;
                    mainWindow.webContents.send('dl-received', receivedBytes);
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

app.whenReady().then(() => {
    // //protocol.registerFileProtocol('app', (request, callback) => {
    // protocol.registerHttpProtocol('app', (request, callback) => {
    //     const url = request.url.replace(/^app:\/\/([^?#]*?)([^?#\/\\]+)([#?].*$|$)/, function(_p0, relPath, linkUrl, hash) {
    //         let replaceLink = relPath + linkUrl;
    //         // This prevents the querystring from being passed to Electron on main app reload
    //         if (/www\/index\.html/.test(replaceLink)) return replaceLink;
    //         return replaceLink + hash;
    //     });
    //     //let returnPath = path.normalize(`${__dirname}/${url}`);
    //     let returnPath = __dirname + '/' + url;
    //     returnPath = path.normalize(returnPath);
    //     console.log(returnPath);
    //     callback({
    //         path: returnPath
    //         // url: 'file://' + path.normalize(`${__dirname}/${url}`),
    //         // method: 'GET'
    //     });
    //     // console.log(path.normalize(`${__dirname}/${url}` + ':' + url));
    // }, (error) => {
    //     if (error) console.error('Failed to register protocol');
    // });
    // Create the new window
    createWindow();
    registerListeners();

    var appName = app.getName();
    console.log('App name: ' + appName);

    // setTimeout(function () {
    //     // Don't auto update if the app is a packaged app
    //     if (/wikimed|wikivoyage/i.test(appName)) {
    //         console.log('Auto-update: Packaged apps with large ZIM archives are not auto-updated.\n');
    //         return;
    //     }
    //     console.log('Auto-update: checking for update...\n');
    //     autoUpdater.checkForUpdates();
    // }, 30000);

    // Send message to renderer if update is available
    autoUpdater.on('update-downloaded', function (info) {
        mainWindow.webContents.send('update-available', info);
    });

    app.on('activate', function () {
        // On macOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

// Quit when all windows are closed.
app.on('window-all-closed', function () {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') app.quit();
});
