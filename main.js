// Modules to control application life and create native browser window
const {
    app,
    protocol,
    BrowserWindow
} = require('electron');
const path = require('path');

// This is used to set capabilities of the app: protocol in onready event below
protocol.registerSchemesAsPrivileged([{
    scheme: 'app',
    privileges: {
        standard: true,
        secure: true,
        allowServiceWorkers: true,
        supportFetchAPI: true
    }
}]);

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

function createWindow() {
    // Create the browser window.
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600
        //, webPreferences: {
        //     preload: path.join(__dirname, 'preload.js')
        // }
    });

    // and load the index.html of the app.
    mainWindow.loadURL('app://www/index.html');
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

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
    protocol.registerFileProtocol('app', (request, callback) => {
    //protocol.registerHttpProtocol('app', (request, callback) => {
        const url = request.url.substr(6);
        callback({
            path: path.normalize(`${__dirname}/${url}`)
            // url: 'file://' + path.normalize(`${__dirname}/${url}`),
            // method: 'GET'
        });
        console.log(path.normalize(`${__dirname}/${url}` + ':' + url));
    }, (error) => {
        if (error) console.error('Failed to register protocol');
    });
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