/*!
 * init.js : Configuration for the app
 * This file sets the app's main parameters and variables
 *
 * Copyright 2013-2023 Jaifroid, Mossroy and contributors
 * License GPL v3:
 *
 * This file is part of Kiwix.
 *
 * Kiwix is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Kiwix is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Kiwix (file LICENSE-GPLv3.txt).  If not, see <http://www.gnu.org/licenses/>
 */

'use strict';

/* global Windows, launchArgumentsUWP, webpHero */
/* eslint-disable no-unused-vars */

// Set a global error handler to prevent app crashes
window.onerror = function (msg, url, line, col, error) {
    console.error('Error caught in app [' + url + ':' + line + ']:\n' + msg, error);
    return true;
};

// Set a beforeUnload handler to prevent app reloads without confirmation if a ZIM file is loaded
window.addEventListener('beforeunload', function (event) {
    if (params.interceptBeforeUnload && !params.useOPFS && appstate && appstate.selectedArchive && params.appCache && !/Electron/.test(params.appType)) {
        var confirmationMessage = 'Warning: you may have to reload the ZIM archive if you leave this page!';
        event.preventDefault();
        // Included for legacy support, e.g. Chrome/Edge < 119
        event.returnValue = confirmationMessage;
        // For modern browsers
        return confirmationMessage;
    }
});

/**
 * Provides caching for assets contained in ZIM (variable needs to be available app-wide)
 * It significantly speeds up subsequent page display. See kiwix-js issue #335
 */
var assetsCache = new Map();

/**
 * A global parameter object for storing variables that need to be remembered between page loads,
 * or across different functions and modules
 *
 * @type Object
 */
var params = {};

/**
 * A global state object
 *
 * @type Object
 */
var appstate = {};

// ******** UPDATE VERSION IN service-worker.js TO MATCH VERSION AND CHECK PWASERVER BELOW!!!!!!! *******
params['appVersion'] = '3.4.9'; // DEV: Manually update this version when there is a new release: it is compared to the Settings Store "appVersion" in order to show first-time info, and the cookie is updated in app.js
// ******* UPDATE THIS ^^^^^^ IN service worker AND PWA-SERVER BELOW !! ********************
params['packagedFile'] = getSetting('packagedFile') || ''; // For packaged Kiwix JS (e.g. with Wikivoyage file), set this to the filename (for split files, give the first chunk *.zimaa) and place file(s) in default storage
params['archivePath'] = 'archives'; // The directory containing the packaged archive(s) (relative to app's root directory)
params['fileVersion'] = getSetting('fileVersion') || ''; // This will be displayed in the app - optionally include date of ZIM file
// List of known start pages cached in the FS:
params['cachedStartPages'] = {
    'wikipedia_en_medicine-app_maxi': 'A/Wikipedia:WikiProject_Medicine/Open_Textbook_of_Medicine2',
    wikipedia_en_medicine_maxi: 'A/Wikipedia:WikiProject_Medicine/Open_Textbook_of_Medicine2',
    // 'mdwiki_en_all_maxi': 'A/Wikipedia:WikiProject_Medicine/Open_Textbook_of_Medicine2',
    wikivoyage_en_all_maxi: 'A/Main_Page'
};
params['win7ElectronVersion'] = '22.3'; // KEEP UP TO DATE!!! This is the last minor version to support Win 7/8/8.1. Auto-update is embargoed for values starting with this.
params['kiwixDownloadLink'] = 'https://download.kiwix.org/zim/'; // Include final slash
params['kiwixHiddenDownloadLink'] = 'https://master.download.kiwix.org/zim/';
/** ***** DEV: ENSURE SERVERS BELOW ARE LISTED IN package.appxmanifest ************/
params['PWAServer'] = 'https://pwa.kiwix.org/'; // Production server
// params['PWAServer'] = 'https://kiwix.github.io/kiwix-js-pwa/dist/'; // Test server
params['storeType'] = getBestAvailableStorageAPI();
params['appType'] = getAppType();
params['keyPrefix'] = 'kiwixjs-'; // Prefix to use for localStorage keys
// Maximum number of article titles to return (range is 5 - 100, default 30)
params['maxSearchResultsSize'] = ~~(getSetting('maxSearchResultsSize') || 30);
params['relativeFontSize'] = ~~(getSetting('relativeFontSize') || 100); // Sets the initial font size for articles (as a percentage) - user can adjust using zoom buttons
params['relativeUIFontSize'] = ~~(getSetting('relativeUIFontSize') || 100); // Sets the initial font size for UI (as a percentage) - user can adjust using slider in Config
params['cssSource'] = getSetting('cssSource') || 'auto'; // Set default to "auto", "desktop" or "mobile"
params['removePageMaxWidth'] = getSetting('removePageMaxWidth') != null ? getSetting('removePageMaxWidth') : 'auto'; // Set default for removing max-width restriction on Wikimedia pages ("auto" = removed in desktop, not in mobile; true = always remove; false = never remove)
params['displayHiddenBlockElements'] = getSetting('displayHiddenBlockElements') !== null ? getSetting('displayHiddenBlockElements') : 'auto'; // Set default for displaying hidden block elements ("auto" = displayed in Wikimedia archives in mobile style)
params['openAllSections'] = getSetting('openAllSections') != null ? getSetting('openAllSections') : true; // Set default for opening all sections in ZIMs that have collapsible sections and headings ("auto" = let CSS decide according to screen width; true = always open until clicked by user; false = always closed until clicked by user)
params['cssCache'] = getSetting('cssCache') != null ? getSetting('cssCache') : true; // Set default to true to use cached CSS, false to use Zim only
params['cssTheme'] = getSetting('cssTheme') || 'light'; // Set default to 'auto', 'light', 'dark' or 'invert' to use respective themes for articles
params['cssUITheme'] = getSetting('cssUITheme') || 'light'; // Set default to 'auto', 'light' or 'dark' to use respective themes for UI'
params['resetDisplayOnResize'] = getSetting('resetDisplayOnResize') == true; // Default for the display reset feature that fixes bugs with secondary displays
params['imageDisplay'] = getSetting('imageDisplay') != null ? getSetting('imageDisplay') : true; // Set default to display images from Zim
params['manipulateImages'] = getSetting('manipulateImages') != null ? getSetting('manipulateImages') : true; // Makes dataURIs by default instead of BLOB URIs for images
params['linkToWikimediaImageFile'] = getSetting('linkToWikimediaImageFile') == true; // Links images to Wikimedia online version if ZIM archive is a Wikipedia archive
params['hideToolbars'] = getSetting('hideToolbars') != null ? getSetting('hideToolbars') : true; // Set default to true (hides both), 'top' (hides top only), or false (no hiding)
params['rememberLastPage'] = getSetting('rememberLastPage') != null ? getSetting('rememberLastPage') : true; // Set default option to remember the last visited page between sessions
params['showPopoverPreviews'] = getSetting('showPopoverPreviews') !== false; // Allows popover previews of articles for Wikimedia ZIMs (defaults to true)
params['assetsCache'] = getSetting('appCache') !== false; // Whether to use cache by default or not
params['appCache'] = getSetting('appCache') !== false; // Will be true by default unless explicitly set to false
params['useMathJax'] = getSetting('useMathJax') != null ? getSetting('useMathJax') : true; // Set default to true to display math formulae with MathJax, false to use fallback SVG images only
// params['showFileSelectors'] = getCookie('showFileSelectors') != null ? getCookie('showFileSelectors') : false; //Set to true to display hidden file selectors in packaged apps
params['showFileSelectors'] = true; // False will cause file selectors to be hidden on each load of the app (by ignoring cookie)
params['hideActiveContentWarning'] = getSetting('hideActiveContentWarning') != null ? getSetting('hideActiveContentWarning') : false;
params['useLibzim'] = getSetting('useLibzim') == true; // Set to true to use libzim for decoding ZIM files (experimental)
params['allowHTMLExtraction'] = getSetting('allowHTMLExtraction') == true;
params['alphaChar'] = getSetting('alphaChar') || 'A'; // Set default start of alphabet string (used by the Archive Index)
params['omegaChar'] = getSetting('omegaChar') || 'Z'; // Set default end of alphabet string
params['contentInjectionMode'] = getSetting('contentInjectionMode') || ((navigator.serviceWorker && !window.nw) ? 'serviceworker' : 'jquery'); // Deafault to SW mode if the browser supports it
params['allowInternetAccess'] = getSetting('allowInternetAccess'); // Access disabled unless user specifically asked for it: NB allow this value to be null as we use it later
params['openExternalLinksInNewTabs'] = getSetting('openExternalLinksInNewTabs') !== null ? getSetting('openExternalLinksInNewTabs') : true; // Parameter to turn on/off opening external links in new tab
params['disableDragAndDrop'] = getSetting('disableDragAndDrop') == true; // A parameter to disable drag-and-drop
params['windowOpener'] = getSetting('windowOpener'); // 'tab|window|false' A setting that determines whether right-click/long-press of a ZIM link opens a new window/tab
params['rightClickType'] = getSetting('rightClickType'); // 'single|double|false' A setting that determines whether a single or double right-click is used to open a new window/tab
params['navButtonsPos'] = getSetting('navButtonsPos') || 'bottom'; // 'top|bottom' A setting that determines where the back-forward nav buttons appear
params['useOPFS'] = getSetting('useOPFS') === true; // A setting that determines whether to use OPFS (experimental)
params['useLegacyZimitSupport'] = getSetting('useLegacyZimitSupport') === true; // A setting that determines whether to force the use of legacy Zimit support
params['sourceVerification'] = params.contentInjectionMode === 'serviceworker' ? (getSetting('sourceVerification') === null ? true : getSetting('sourceVerification')) : false; // Sets a boolean indicating weather a user trusts the source of zim files
params['interceptBeforeUnload'] = getSetting('interceptBeforeUnload') !== null ? getSetting('interceptBeforeUnload') : true; // A setting that determines whether to warn user before leaving the app (default is true)

// Do not touch these values unless you know what they do! Some are global variables, some are set programmatically
params['cacheAPI'] = 'kiwixjs-assetsCache'; // Set the global Cache API database or cache name here, and synchronize with Service Worker
params['cacheIDB'] = 'kiwix-assetsCache'; // Set the global IndexedDB database here (Slightly different name to disambiguate)
params['imageDisplayMode'] = params.imageDisplay ? 'progressive' : 'manual';
params['storedFile'] = getSetting('lastSelectedArchive');
params.storedFile = params.storedFile || (!params.useOPFS ? params['packagedFile'] : '') || '';
params['lastPageVisit'] = params.rememberLastPage && params.storedFile ? getSetting(params.storedFile.replace(/(\.zim)\w?\w?$/, '$1')) || '' : '';
params.lastPageVisit = params.lastPageVisit ? params.lastPageVisit + '@kiwixKey@' + params.storedFile : '';
params['storedFilePath'] = getSetting('lastSelectedArchivePath');
params.storedFilePath = params.storedFilePath ? decodeURIComponent(params.storedFilePath) : params.archivePath + '/' + params.packagedFile;
params.originalPackagedFile = params.packagedFile;
params['localStorage'] = '';
params['pickedFolder'] = '';
params['themeChanged'] = params['themeChanged'] || false;
params['printIntercept'] = false;
params['printInterception'] = false;
params['appIsLaunching'] = true; // Allows some routines to tell if the app has just been launched
params['PWAInstalled'] = window.matchMedia('(display-mode: standalone)').matches; // Because user may reset the app, we have to test for standalone mode
params['falFileToken'] = 'zimfile'; // UWP support
params['falFolderToken'] = 'zimfilestore'; // UWP support
params.pagesLoaded = 0; // Page counter used to show PWA Install Prompt only after user has played with the app for a while
params.localUWPSettings = /UWP/.test(params.appType) ? Windows.Storage.ApplicationData.current.localSettings.values : null;
appstate['target'] = 'iframe'; // The target for article loads (this should always be 'iframe' initially, and will only be changed as a result of user action)
params['mapsURI'] = getSetting('mapsURI') || (/UWP|Windows/.test(params.appType) ? 'bingmaps:' : 'https://www.openstreetmap.org/'); // Protocol with colon ('bingmaps:') or URL with final slash ('https://www.openstreetmap.org/')
params['debugLibzimASM'] = getSetting('debugLibzimASM'); // 'wasm|asm' Forces use of wasm or asm for libzim decoder. You can also set this as an override URL querystring e.g. ?debugLibzimASM=wasm;
params['lockDisplayOrientation'] = getSetting('lockDisplayOrientation'); // 'portrait|landscape' (or empty for no lock)
params['noHiddenElementsWarning'] = getSetting('noHiddenElementsWarning') !== null ? getSetting('noHiddenElementsWarning') : false; // A one-time warning about Hidden elements display

// Apply any override parameters in querystring (done as a self-calling function to avoid creating global variables)
(function overrideParams () {
    var rgx = /[?&]([^=]+)=([^&]+)/g;
    var matches = rgx.exec(window.location.search);
    while (matches) {
        if (matches[1] && matches[2]) {
            var paramKey = decodeURIComponent(matches[1]);
            var paramVal = decodeURIComponent(matches[2]);
            if (paramKey !== 'title') {
                // Store new values
                setSetting(paramKey, paramVal);
                paramKey = paramKey === 'lastSelectedArchive' ? 'storedFile' : paramKey;
                params[paramKey] = paramVal === 'false' ? false : paramVal === 'true' ? true : paramVal;
            }
        }
        matches = rgx.exec(window.location.search);
    }
})();

// This code runs on the PWA UWP app running from https://
if (/^http/i.test(window.location.protocol) && /UWP\|PWA/.test(params.appType)) {
    // We are in a PWA, so signal success
    params.localUWPSettings.PWA_launch = 'success';
    // DEV: Internal code for testing. If you need to debug restart of app, pause in DevTools on line below,
    // set params.reboot = true and then continue. App will reboot to local code.
    if (params.reboot) {
        window.location.href = 'ms-appx-web:///www/index.html';
        // throw 'Beam me down, Scotty!';
    }
}

// This code runs on the basic UWP app running from ms-appx-web://
if (!/^http/i.test(window.location.protocol) && params.localUWPSettings &&
    params.contentInjectionMode === 'serviceworker' && params.allowInternetAccess) {
    // Test that there has been a successful handover to the PWA
    if (params.localUWPSettings.PWA_launch === 'success') {
        var uriParams = '?allowInternetAccess=true';
        uriParams += params.packagedFile ? '&packagedFile=' + encodeURIComponent(params.packagedFile) : '';
        uriParams += params.fileVersion ? '&fileVersion=' + encodeURIComponent(params.fileVersion) : '';
        // Signal failure of PWA until it has successfully launched (in init.js it will be changed to 'success')
        params.localUWPSettings.PWA_launch = 'fail';
        if (launchArgumentsUWP && typeof Windows.Storage !== 'undefined') {
            // We have to ensure the PWA will have access to the file with which the app was launched
            var fal = Windows.Storage.AccessCache.StorageApplicationPermissions.futureAccessList;
            fal.addOrReplace(params.falFileToken, launchArgumentsUWP.files[0]);
            if (fal.containsItem(params.falFolderToken)) fal.remove(params.falFolderToken);
            uriParams += '&lasSelectedArchivePath=&lastSelectedArchive=' + encodeURIComponent(launchArgumentsUWP.files[0].name);
        }
        window.location.href = params.PWAServer + 'www/index.html' + uriParams;
        // This will trigger the error catching above, cleanly dematerialize this script and transport us swiftly to PWA land
        // throw 'Beam me up, Scotty!';
    } else {
        console.error('PWA may have failed to launch correctly last time! Setting failsafe to avoid boot-loop...');
        params.localUWPSettings.PWA_launch = 'fail';
    }
}

if (/UWP/.test(params.appType)) {
    if (params.resetDisplayOnResize && !getSetting('reloadDispatched')) {
        // We need to reload the UWP app in order to get the new pixelRatio due to a bug in the UWP framework
        setSetting('reloadDispatched', true);
        window.location.reload();
        throw 'So long, and thanks for all the fish!';
    } else {
        document.getElementById('resetDisplayOnResize').style.display = 'block';
    }
}

// Prevent app boot loop with problematic pages that cause an app crash
console.debug('lastPageLoad: ' + getSetting('lastPageLoad'));
if (getSetting('lastPageLoad') === 'failed') {
    console.warn('Removing params.lastPageVisit because lastPageLoad failed!');
    params.lastPageVisit = '';
} else {
    // Cookie will signal failure until article is fully loaded
    setSetting('lastPageLoad', 'failed');
}

// Initialize checkbox, radio and other values
document.getElementById('cssCacheModeCheck').checked = params.cssCache;
document.getElementById('navButtonsPosCheck').checked = params.navButtonsPos === 'top';
document.getElementById('imageDisplayModeCheck').checked = params.imageDisplay;
document.getElementById('manipulateImagesCheck').checked = params.manipulateImages;
document.getElementById('removePageMaxWidthCheck').checked = params.removePageMaxWidth === true; // Will be false if false or auto
document.getElementById('removePageMaxWidthCheck').indeterminate = params.removePageMaxWidth === 'auto';
document.getElementById('removePageMaxWidthCheck').readOnly = params.removePageMaxWidth === 'auto';
document.getElementById('pageMaxWidthState').textContent = (params.removePageMaxWidth === 'auto' ? 'auto' : params.removePageMaxWidth ? 'always' : 'never');
document.getElementById('displayHiddenBlockElementsCheck').checked = params.displayHiddenBlockElements === true;
document.getElementById('displayHiddenBlockElementsCheck').indeterminate = params.displayHiddenBlockElements === 'auto';
document.getElementById('displayHiddenBlockElementsCheck').readOnly = params.displayHiddenBlockElements === 'auto';
document.getElementById('displayHiddenElementsState').textContent = (params.displayHiddenBlockElements === 'auto' ? 'auto' : params.displayHiddenBlockElements ? 'always' : 'never');
document.getElementById('openAllSectionsCheck').checked = params.openAllSections;
document.getElementById('linkToWikimediaImageFileCheck').checked = params.linkToWikimediaImageFile;
document.getElementById('useOSMCheck').checked = /openstreetmap/.test(params.mapsURI);
document.getElementById('cssUIDarkThemeCheck').checked = params.cssUITheme == 'dark'; // Will be true, or false if light or auto
document.getElementById('cssUIDarkThemeCheck').indeterminate = params.cssUITheme == 'auto';
document.getElementById('cssUIDarkThemeCheck').readOnly = params.cssUITheme == 'auto';
document.getElementById('cssUIDarkThemeState').innerHTML = params.cssUITheme;
document.getElementById('cssWikiDarkThemeCheck').checked = /dark|invert/.test(params.cssTheme);
document.getElementById('cssWikiDarkThemeCheck').indeterminate = params.cssTheme == 'auto';
document.getElementById('cssWikiDarkThemeCheck').readOnly = params.cssTheme == 'auto';
document.getElementById('cssWikiDarkThemeState').innerHTML = params.cssTheme;
document.getElementById('darkInvert').style.display = /dark|invert|darkReader/i.test(params.cssTheme) ? 'inline' : 'none';
document.getElementById('darkDarkReader').style.display = params.contentInjectionMode === 'serviceworker' && /dark|invert|darkReader/i.test(params.cssTheme) ? 'inline' : 'none';
document.getElementById('cssWikiDarkThemeInvertCheck').checked = params.cssTheme == 'invert';
document.getElementById('cssWikiDarkThemeDarkReaderCheck').checked = params.cssTheme == 'darkReader';
document.getElementById('resetDisplayOnResizeCheck').checked = params.resetDisplayOnResize;
document.getElementById('useMathJaxRadio' + (params.useMathJax ? 'True' : 'False')).checked = true;
document.getElementById('rememberLastPageCheck').checked = params.rememberLastPage;
document.getElementById('displayFileSelectorsCheck').checked = params.showFileSelectors;
document.getElementById('hideActiveContentWarningCheck').checked = params.hideActiveContentWarning;
document.getElementById('useLibzimReaderCheck').checked = params.useLibzim;
document.getElementById('enableSourceVerificationCheck').checked = getSetting('sourceVerification') === null ? true : getSetting('sourceVerification');
document.getElementById('useLegacyZimitSupportCheck').checked = params.useLegacyZimitSupport;
document.getElementById('alphaCharTxt').value = params.alphaChar;
document.getElementById('omegaCharTxt').value = params.omegaChar;
document.getElementById('titleSearchRange').value = params.maxSearchResultsSize;
document.getElementById('titleSearchRangeVal').innerHTML = params.maxSearchResultsSize;
document.getElementById('hideToolbarsCheck').checked = params.hideToolbars === true; // Will be false if false or 'top'
document.getElementById('hideToolbarsCheck').indeterminate = params.hideToolbars === 'top';
document.getElementById('hideToolbarsCheck').readOnly = params.hideToolbars === 'top';
document.getElementById('hideToolbarsState').innerHTML = (params.hideToolbars === 'top' ? 'top' : params.hideToolbars ? 'both' : 'never');
document.getElementById('openExternalLinksInNewTabsCheck').checked = params.openExternalLinksInNewTabs;
document.getElementById('showPopoverPreviewsCheck').checked = params.showPopoverPreviews;
document.getElementById('disableDragAndDropCheck').checked = params.disableDragAndDrop;
document.getElementById('debugLibzimASMDrop').value = params.debugLibzimASM || '';
if (params.debugLibzimASM === 'disable') document.getElementById('debugLibzimASMDrop').style.color = 'red';
if (params.windowOpener === null) { // Setting has never been activated, so determine a sensible default
    params.windowOpener = /UWP/.test(params.appType) && params.contentInjectionMode === 'jquery' ? false
        : /iOS/.test(params.appType) ? false
            : ('MSBlobBuilder' in window || params.PWAInstalled) ? 'window' // IE11/Edge Legacy/UWP work best in window mode, not in tab mode, as does installed PWA!
                : /PWA/.test(params.appType) ? 'tab' : false;
}
if (params.windowOpener) params.allowHTMLExtraction = false;
document.getElementById('allowHTMLExtractionCheck').checked = params.allowHTMLExtraction;
document.getElementById('allowInternetAccessCheck').checked = params.allowInternetAccess;
// Howeever, if we're accessing the app from a server, add indication that we are online by default (user can turn off and will receive instructions)
if (/^http/i.test(window.location.protocol) && params.allowInternetAccess === null) {
    document.getElementById('allowInternetAccessCheck').checked = true;
    params.allowInternetAccess = true;
}
document.getElementById('bypassAppCacheCheck').checked = !params.appCache;
document.getElementById('interceptBeforeUnloadCheck').checked = params.interceptBeforeUnload;
// If we're in a PWA served from http, change the app titles
if (/^http/i.test(window.location.protocol)) {
    Array.prototype.slice.call(document.querySelectorAll('span.identity')).forEach(function (ele) {
        ele.innerHTML = 'PWA';
    });
}
// Set cssInjectionMode radio buttons
Array.prototype.slice.call(document.querySelectorAll('input[name=cssInjectionMode]')).forEach(function (radio) {
    radio.checked = false;
    if (radio.value === params.cssSource) {
        radio.checked = true;
    }
});

// Get app type
function getAppType () {
    var type = 'HTML5';
    if (typeof Windows !== 'undefined' && typeof Windows.Storage !== 'undefined') type = 'UWP';
    if (window.fs || window.nw) type = 'Electron';
    if (navigator.serviceWorker) type += '|PWA';
    if (/Windows/i.test(navigator.userAgent)) type += '|Windows';
    else if (/Android/i.test(navigator.userAgent)) type += '|Android';
    else if (/Linux/i.test(navigator.userAgent)) type += '|Linux';
    else if (/iphone|ipad|ipod/i.test(navigator.userAgent) || navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) type += '|iOS';
    return type;
}

// Set up storage types
// First check that we have not simply upgraded the app and the packaged file
params.packagedFileStub = params.packagedFile ? params.packagedFile.replace(/(?:-app_maxi)?_[\d-]+\.zim\w?\w?$/, '') : null;
if (params.packagedFileStub && params.appVersion !== getSetting('appVersion') && ~params.storedFile.indexOf(params.packagedFileStub)) {
    console.log('The packaged archive has been upgraded: resetting file pointers to point to ' + params.packagedFile);
    params.lastPageVisit = '';
    params.storedFile = params.packagedFile;
    params.storedFilePath = params.archivePath + '/' + params.packagedFile;
    deleteSetting('lastSelectedArchive');
    deleteSetting('lastSelectedArchivePath');
    deleteSetting('listOfArchives');
    params.localStorageUpgradeNeeded = true;
}
if (params.storedFile && typeof Windows !== 'undefined' && typeof Windows.Storage !== 'undefined') { // UWP
    var futureAccessList = Windows.Storage.AccessCache.StorageApplicationPermissions.futureAccessList;
    Windows.ApplicationModel.Package.current.installedLocation.getFolderAsync(params.archivePath).done(function (appFolder) {
        params.localStorage = appFolder;
        if (futureAccessList.containsItem(params.falFolderToken)) {
            futureAccessList.getFolderAsync(params.falFolderToken).done(function (pickedFolder) {
                params.pickedFolder = params.localStorageUpgradeNeeded ? params.localStorage : pickedFolder;
            }, function (err) {
                console.error('The previously picked folder is no longer accessible: ' + err.message);
            });
        }
    }, function (err) {
        console.error("This app doesn't appear to have access to local storage!", err);
    });
    // If we don't already have a picked file (e.g. by launching app with click on a ZIM file), then retrieve it from futureAccessList if possible
    var listOfArchives = getSetting('listOfArchives');
    // But don't get the picked file if we already have access to the folder and the file is in it!
    if (listOfArchives && ~listOfArchives.indexOf(params.storedFile) && params.pickedFolder) {
        params.pickedFile = '';
    } else {
        if (!params.pickedFile && futureAccessList.containsItem(params.falFileToken)) {
            params.pickedFile = '';
            futureAccessList.getFileAsync(params.falFileToken).done(function (file) {
                if (file.name === params.storedFile) params.pickedFile = file;
            }, function (err) {
                console.error('The previously picked file is no longer accessible: ' + err.message);
            });
        }
    }
}

if (!params.pickedFolder && typeof window.showOpenFilePicker !== 'function' && !/UWP/.test(params.appType)) {
    params.pickedFolder = getSetting('pickedFolder') || '';
    // if (!params.pickedFolder && !params.pickedFile) {
    //     params.pickedFile = params.storedFilePath || '';
    // }
}

// Routine for installing the app adapted from https://pwa-workshop.js.org/

var deferredPrompt;
var divInstall1 = document.getElementById('divInstall1');
var btnInstall1 = document.getElementById('btnInstall1');
var divInstall2 = document.getElementById('divInstall2');
var btnInstall2 = document.getElementById('btnInstall2');
var btnLater = document.getElementById('btnLater');

window.addEventListener('beforeinstallprompt', function (e) {
    console.debug('beforeinstallprompt fired');
    // Prevent Chrome 76 and earlier from automatically showing a prompt
    e.preventDefault();
    // Stash the event so it can be triggered later.
    deferredPrompt = e;
    // Show the install button
    divInstall2.style.display = 'block';
    btnInstall2.addEventListener('click', installApp);
    // Don't display prompt if the PWA for this version is already installed
    if (!params.beforeinstallpromptFired) {
        params.beforeinstallpromptFired = true;
        btnInstall1.addEventListener('click', installApp);
        btnLater.addEventListener('click', function (e) {
            e.preventDefault();
            divInstall1.innerHTML = '<b>You can install this app later from Configuration</b>';
            setTimeout(function () {
                divInstall1.style.display = 'none';
            }, 4000);
            params.installLater = true;
        });
    }
    // The app hasn't actually been installed or user has uninstalled, so we need to reset any setting
    deleteSetting('PWAInstalled');
});

function installApp (e) {
    e.preventDefault();
    // Show the prompt
    deferredPrompt.prompt();
    btnInstall1.disabled = true;
    btnInstall2.disabled = true;
    // Wait for the user to respond to the prompt
    deferredPrompt.userChoice.then(function (choiceResult) {
        if (choiceResult.outcome === 'accepted') {
            console.log('PWA installation accepted');
            divInstall1.style.display = 'none';
            divInstall2.style.display = 'none';
        } else {
            console.log('PWA installation rejected');
        }
        btnInstall1.disabled = false;
        btnInstall2.disabled = false;
        deferredPrompt = null;
        params.beforeinstallpromptFired = false;
    });
}

window.addEventListener('appinstalled', function (e) {
    params.PWAInstalled = params.appVersion;
    setSetting('PWAInstalled', params.PWAInstalled);
});

function getSetting (name) {
    var result;
    if (params.storeType === 'cookie') {
        var regexp = new RegExp('(?:^|;)\\s*' + name + '=([^;]+)(?:;|$)');
        result = document.cookie.match(regexp);
        result = result && result.length > 1 ? decodeURIComponent(result[1]) : null;
    } else if (params.storeType === 'local_storage') {
        // Use localStorage instead
        result = localStorage.getItem(params.keyPrefix + name);
    }
    return result === null || result === 'undefined' ? null : result === 'true' ? true : result === 'false' ? false : result;
}

function setSetting (name, val) {
    if (params.storeType === 'cookie') {
        document.cookie = encodeURIComponent(name) + '=' + encodeURIComponent(val) + ';expires=Fri, 31 Dec 9999 23:59:59 GMT';
    }
    // Make Boolean value
    val = val === 'false' ? false : val === 'true' ? true : val;
    if (params.storeType === 'local_storage') {
        localStorage.setItem(params.keyPrefix + name, val);
    }
}

// NB This only deals with simple names that don't need to be URI-encoded
function deleteSetting (name) {
    if (params.storeType === 'cookie') {
        document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict';
    } else if (params.storeType === 'local_storage') {
        localStorage.removeItem(params.keyPrefix + name);
    }
}

// Tests for available Storage APIs (document.cookie or localStorage) and returns the best available of these
// DEV: This function is replicated from settingsStore.js because it's not available from init
// It returns 'cookie' if the always-present contentInjectionMode is still in cookie, which
// means the store previously used cookies and hasn't upgraded yet: this won't be done till app.js is loaded
function getBestAvailableStorageAPI () {
    var type = 'none';
    var localStorageTest;
    try {
        localStorageTest = 'localStorage' in window && window['localStorage'] !== null;
        if (localStorageTest) {
            localStorage.setItem('tempKiwixStorageTest', '');
            localStorage.removeItem('tempKiwixStorageTest');
        }
    } catch (e) {
        localStorageTest = false;
    }
    document.cookie = 'tempKiwixCookieTest=working; expires=Fri, 31 Dec 9999 23:59:59 GMT; SameSite=Strict';
    var kiwixCookieTest = /tempKiwixCookieTest=working/.test(document.cookie);
    document.cookie = 'tempKiwixCookieTest=; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict';
    if (kiwixCookieTest) type = 'cookie';
    if (localStorageTest && !/contentInjectionMode=(?:jquery|serviceworker)/.test(document.cookie)) type = 'local_storage';
    return type;
}

// Test if WebP is natively supported, and if not, load a webpMachine instance. This is used in uiUtils.js.
var webpMachine = false;

// We use a self-invoking function here to avoid defining unnecessary global functions and variables
(function (callback) {
    // Tests for native WebP support
    var webP = new Image();
    webP.onload = webP.onerror = function () {
        callback(webP.height === 2);
    };
    webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
})(function (support) {
    if (!support) {
        // Note we set the location of this to be the directory where scripts reside after bundling
        var webpScript = document.createElement('script');
        webpScript.onload = function () {
            webpMachine = new webpHero.WebpMachine();
        }
        webpScript.src = 'js/webpHeroBundle_0.0.2.js';
        document.head.appendChild(webpScript);
    }
});
