// Modules to control application life and create native browser window
const {
    app,
    protocol,
    BrowserWindow,
    shell
} = require('electron');
const path = require('path');

// This is used to set capabilities of the app: protocol in onready event below
// protocol.registerSchemesAsPrivileged([{
//     scheme: 'app',
//     privileges: {
//         standard: true,
//         secure: true,
//         allowServiceWorkers: true,
//         supportFetchAPI: true
//     }
// }]);

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

function createWindow() {
    // Create the browser window.
    mainWindow = new BrowserWindow({
        titleBarStyle: 'hidden',
        width: 1281,
        height: 800,
        minWidth: 640,
        minHeight: 480,
        autoHideMenuBar: true,
        icon: path.join(__dirname, 'www/img/icons/kiwix-64.png'),
        webPreferences: {
            nodeIntegration: false
            // contextIsolation: true,
            , preload: path.join(__dirname, 'preload.js')
            , nativeWindowOpen: true
            // , webSecurity: false
            // , session: ses
            // , partition: 'persist:kiwixjs'
        }
    });

    // and load the index.html of the app.
    // mainWindow.loadURL(`https://${__dirname}/www/index.html`);
    // mainWindow.loadURL(`https://pwa.kiwix.org/`);
    // DEV: If you need Service Worker more than you need document.cookie, load app like this:
    mainWindow.loadFile('www/index.html');

    //mainWindow.autoHideMenuBar = true;

    // mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    //     if (!/blob:/i.test(url)) {
    //         return { action: 'allow' };
    //     }
    //     return { action: 'deny' };
    // });

    // mainWindow.webContents.on('new-window', function(e, url) {
    //     // Make sure blob urls stay in electron perimeter
    //     if(/^blob:/i.test(url)) {
    //       return;
    //     }
    //     // And open every other protocol in the OS browser      
    //     e.preventDefault();
    //     shell.openExternal(url);
    // });
    
    // DEV: Enable code below to check cookies saved by app in console log
    // mainWindow.webContents.on('did-finish-load', function() {
    //     mainWindow.webContents.session.cookies.get({}, (error, cookies) => {
    //       console.log(cookies);
    //     });
    // });

    // Open the DevTools.
    // mainWindow.webContents.openDevTools()

    // Emitted when the window is closed.
    mainWindow.on('closed', function () {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null;
    });
}

// let dirnameParts = __dirname.match(/[^\/\\]+(?:[\/\\]|$)/g);

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.

app.on('ready', () => {
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
});

// Quit when all windows are closed.
app.on('window-all-closed', function () {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) createWindow();
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.