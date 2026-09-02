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
    if (params.interceptBeforeUnload && !params.useOPFS && params.appCache && !/UWP|Electron/.test(params.appType)) {
        if (!appstate.selectedArchive) return; // No need to intercept if no archive is loaded
        if (params.pickedFile || params.pickedFolder) return; // No need to intercept if we have FS access to a file or folder
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
params['appVersion'] = '3.8.93'; // DEV: Manually update this version when there is a new release: it is compared to the Settings Store "appVersion" in order to show first-time info, and the cookie is updated in app.js
// ******* UPDATE THIS ^^^^^^ IN service worker AND PWA-SERVER BELOW !! ********************
params['packagedFile'] = getSetting('packagedFile') || ''; // For packaged Kiwix JS (e.g. with Wikivoyage file), set this to the filename (for split files, give the first chunk *.zimaa) and place file(s) in default storage
params['archivePath'] = 'archives'; // The directory containing the packaged archive(s) (relative to app's root directory)
params['fileVersion'] = getSetting('fileVersion') || ''; // This will be displayed in the app - optionally include date of ZIM file

// List of known start pages cached in the FS - ensure these strings are double-URI-encoded, and then store the file itself with single-
// URI-enoding. This string will be decoded once in the app. E.g. the file name "C/Wikipedia:WikiProject_Medicine/Open_Textbook_of_Medicine2"
// should be stored in the directory as "C/Wikipedia%3AWikiProject_Medicine/Open_Textbook_of_Medicine2" (since we can't store colons in some
// file systems), and the string "C/Wikipedia%253AWikiProject_Medicine/Open_Textbook_of_Medicine2" will be decoded to this
// before being passed to the Service Worker
params['cachedStartPages'] = {
    'wikipedia_en_medicine-app_maxi': 'C/Wikipedia%253AWikiProject_Medicine/Open_Textbook_of_Medicine2',
    wikipedia_en_medicine_maxi: 'C/Wikipedia%253AWikiProject_Medicine/Open_Textbook_of_Medicine2',
    'mdwiki_en_all-app_maxi': 'C/Wikipedia%253AWikiProject_Medicine/Open_Textbook_of_Medicine2',
    mdwiki_en_all_maxi: 'C/Wikipedia%253AWikiProject_Medicine/Open_Textbook_of_Medicine2',
    wikivoyage_en_all_maxi: 'C/Main_Page'
};
if (window.electronAPI) {
    // Initial port for Express server in Electron: this will be different for base app (3000), WikiMed (3001) and Wikivoyage (3002)
    // This will be overridden by the actual port defined or stored in main.cjs
    params['expressPort'] = 3000;
}
params['win7ElectronVersion'] = '22.3'; // KEEP UP TO DATE!!! This is the last minor version to support Win 7/8/8.1. Auto-update is embargoed for values starting with this.
params['macLegacyElectronVersion'] = '26.6'; // KEEP UP TO DATE!!! This is the last minor version whose macOS floor is 10.13, which is why the legacy build (serving 10.13 to 11) is pinned to it. Auto-update is embargoed for values starting with this.
params['kiwixLibraryServer'] = 'https://opds.library.kiwix.org';
params['kiwixLibraryBrowser'] = 'https://browse.library.kiwix.org';
params['kiwixCatalogRoot'] = params.kiwixLibraryServer + '/catalog/v2';
params['kiwixCatalogCategories'] = params.kiwixCatalogRoot + '/categories';
// The categories feed only lists categories declared in ZIM Category metadata, so archives with no
// category (currently ~23% of the catalogue, including most of devdocs, maps, freecodecamp and
// libretexts) are unreachable by category alone. This is the catalogue-wide feed advertised in root.xml.
params['kiwixCatalogEntries'] = params.kiwixCatalogRoot + '/entries?count=-1';
params['kiwixStagingCatalogEntries'] = 'https://staging.library.kiwix.org/catalog/v2/entries?count=-1';
params['kiwixDownloadServer'] = 'https://download.kiwix.org/zim/'; // Include final slash
params['kiwixDownloadMirrors'] = ['https://ftp.fau.de/kiwix/zim/', 'https://mirrors.dotsrc.org/kiwix/zim/', 'https://www.mirrorservice.org/sites/download.kiwix.org/zim/', 'https://md.mirrors.hacktegic.com/kiwix-md/zim/', 'https://lb.download.kiwix.org/zim/'];
params['kiwixMirrorServer'] = 'https://mirror.download.kiwix.org'; // CORS-enabled *.kiwix.org mirror; used as fallback for OPFS downloads if not found in meta4
params['kiwixStagingServer'] = 'https://staging.download.kiwix.org';
/** ***** DEV: ENSURE SERVERS BELOW ARE LISTED IN package.appxmanifest ************/
params['PWAServer'] = 'https://pwa.kiwix.org/'; // Production server
// params['PWAServer'] = 'https://kiwix.github.io/kiwix-js-pwa/dist/'; // Test server
params['storeType'] = getBestAvailableStorageAPI();
params['appType'] = getAppType();
params['keyPrefix'] = 'kiwixjs-'; // Prefix to use for localStorage keys
// Maximum number of article titles to return (range is 5 - 100, default 20), but see intelligent search-size calculation in uiUtils.js
params['maxSearchResultsSize'] = ~~(getSetting('maxSearchResultsSize') || 20);
params['relativeFontSize'] = ~~(getSetting('relativeFontSize') || 100); // Sets the initial font size for articles (as a percentage) - user can adjust using zoom buttons
params['relativeUIFontSize'] = ~~(getSetting('relativeUIFontSize') || 100); // Sets the initial font size for UI (as a percentage) - user can adjust using slider in Config
params['cssSource'] = getSetting('cssSource') || 'auto'; // Set default to "auto", "desktop" or "mobile"
params['removePageMaxWidth'] = getSetting('removePageMaxWidth') != null ? getSetting('removePageMaxWidth') : 'auto'; // Set default for removing max-width restriction on Wikimedia pages ("auto" = removed in desktop, not in mobile; true = always remove; false = never remove)
params['displayHiddenBlockElements'] = getSetting('displayHiddenBlockElements') !== null ? getSetting('displayHiddenBlockElements') : 'auto'; // Set default for displaying hidden block elements ("auto" = displayed in Wikimedia archives in mobile style)
params['openAllSections'] = getSetting('openAllSections') != null ? getSetting('openAllSections') : true; // Set default for opening all sections in ZIMs that have collapsible sections and headings ("auto" = let CSS decide according to screen width; true = always open until clicked by user; false = always closed until clicked by user)
params['cssCache'] = getSetting('cssCache') != null ? getSetting('cssCache') : true; // Set default to true to use cached CSS, false to use Zim only
params['cssTheme'] = getSetting('cssTheme') || 'light'; // Set default to 'auto', 'light', 'dark', 'invert' or 'darkreader' to use respective themes for articles
params['customDarkTheme'] = getSetting('customDarkTheme') === true; // Set to true to use custom dark theme (legacy Wikimedia dark theme)
params['cssUITheme'] = getSetting('cssUITheme') || 'light'; // Set default to 'auto', 'light' or 'dark' to use respective themes for UI'
params['displayThemeOrRandomButtons'] = getSetting('displayThemeOrRandomButtons') != null ? getSetting('displayThemeOrRandomButtons') : 'theme'; // theme | random | both
params['resetDisplayOnResize'] = getSetting('resetDisplayOnResize') === true; // Default for the display reset feature that fixes bugs with secondary displays
params['imageDisplay'] = getSetting('imageDisplay') != null ? getSetting('imageDisplay') : true; // Set default to display images from Zim
params['manipulateImages'] = getSetting('manipulateImages') === true; // Makes dataURIs by default instead of BLOB URIs for images
params['linkToWikimediaImageFile'] = getSetting('linkToWikimediaImageFile') === true; // Links images to Wikimedia online version if ZIM archive is a Wikipedia archive
params['hideToolbars'] = getSetting('hideToolbars') != null ? getSetting('hideToolbars') : true; // Set default to true (hides both), 'top' (hides top only), or false (no hiding)
params['useWindowControlsOverlay'] = true; // MASTER SWITCH: set to false to ignore the Window Controls Overlay entirely and keep the navbar full-width under the window buttons (see the html:not(.no-wco) rules in app.css, and uiUtil.windowControlsOverlayIsVisible)
params['showTitleBar'] = getSetting('showTitleBar') === true; // Draws an emulated title bar in the strip occupied by the window controls overlay, for users who prefer the window buttons not to sit over the app's own controls (has no effect unless the overlay is being drawn)
params['rememberLastPage'] = getSetting('rememberLastPage') != null ? getSetting('rememberLastPage') : true; // Set default option to remember the last visited page between sessions
params['showPopoverPreviews'] = getSetting('showPopoverPreviews') !== false; // Allows popover previews of articles for Wikimedia ZIMs (defaults to true)
// The assets cache is subordinate to appCache (Developer Mode): that mode exists to run the app with no caches at
// all, so a stored 'cache assets' preference is clamped here rather than overwritten, and returns intact when
// Developer Mode is switched off. DEV: before #926 this line read appCache alone, which also forced the assets
// cache ON whenever Developer Mode was off, discarding a deliberate 'do not cache assets' choice at every launch.
// That was a side effect of #503, where the line's job was only to give this param a default of true
params['assetsCache'] = getSetting('appCache') !== false && getSetting('assetsCache') !== false;
params['appCache'] = getSetting('appCache') !== false; // Will be true by default unless explicitly set to false
params['useMathJax'] = getSetting('useMathJax') != null ? getSetting('useMathJax') : true; // Set default to true to display math formulae with MathJax, false to use fallback SVG images only
// params['showFileSelectors'] = getCookie('showFileSelectors') != null ? getCookie('showFileSelectors') : false; //Set to true to display hidden file selectors in packaged apps
params['showFileSelectors'] = true; // False will cause file selectors to be hidden on each load of the app (by ignoring cookie)
params['hideActiveContentWarning'] = getSetting('hideActiveContentWarning') != null ? getSetting('hideActiveContentWarning') : false;
params['useLibzim'] = getSetting('useLibzim') === true; // Set to true to use libzim for decoding ZIM files (experimental)
params['libzimSearchType'] = getSetting('libzimSearchType') || 'searchWithSnippets'; // Sets a value indicating the type of search to use with libzim (currently 'search' or 'searchWithSnippets')
params['allowHTMLExtraction'] = getSetting('allowHTMLExtraction') === true;
params['alphaChar'] = getSetting('alphaChar') || 'A'; // Set default start of alphabet string (used by the Archive Index)
params['omegaChar'] = getSetting('omegaChar') || 'Z'; // Set default end of alphabet string
// DEV: NW.js is excluded from the ServiceWorker default below because it primarily targets Windows XP. If that
// changes, note that params.sourceVerification (set further down) becomes live in NW.js as a result, and NW.js
// runs from file: - see the notes on the trusted context in overrideParams() below before altering this line.
// NB the stored value is checked against the modes this app actually supports, and anything else falls back to
// the default: an unrecognized mode matches neither branch of setContentInjectionMode() in app.js, which leaves
// the app in a hybrid state with no radio button selected. This also heals a value stored before that was so
params['contentInjectionMode'] = /^(?:jquery|serviceworker)$/.test(getSetting('contentInjectionMode'))
    ? getSetting('contentInjectionMode') : ((navigator.serviceWorker && !window.nw) ? 'serviceworker' : 'jquery'); // Deafault to SW mode if the browser supports it
params['allowInternetAccess'] = getSetting('allowInternetAccess'); // Access disabled unless user specifically asked for it: NB allow this value to be null as we use it later
params['openExternalLinksInNewTabs'] = getSetting('openExternalLinksInNewTabs') !== null ? getSetting('openExternalLinksInNewTabs') : true; // Parameter to turn on/off opening external links in new tab
params['disableDragAndDrop'] = getSetting('disableDragAndDrop') === true; // A parameter to disable drag-and-drop
params['windowOpener'] = getSetting('windowOpener'); // 'tab|window|false' A setting that determines whether right-click/long-press of a ZIM link opens a new window/tab
params['rightClickType'] = getSetting('rightClickType'); // 'single|double|false' A setting that determines whether a single or double right-click is used to open a new window/tab
params['navButtonsPos'] = getSetting('navButtonsPos') || 'bottom'; // 'top|bottom' A setting that determines where the back-forward nav buttons appear
params['useOPFS'] = getSetting('useOPFS') === true; // A setting that determines whether to use OPFS (experimental)
params['useLegacyZimitSupport'] = getSetting('useLegacyZimitSupport') === true; // A setting that determines whether to force the use of legacy Zimit support
// Sets a boolean indicating whether a user trusts the source of zim files. NB this tests the start of the mode
// string rather than matching it exactly, both because the gate in app.js does the same and because upstream
// kiwix-js has a further 'serviceworkerlocal' mode: an exact match would silently leave the gate off in any
// mode whose name merely begins with 'serviceworker'
params['sourceVerification'] = /^serviceworker/.test(params.contentInjectionMode) ? (getSetting('sourceVerification') === null ? true : getSetting('sourceVerification')) : false;
params['interceptBeforeUnload'] = getSetting('interceptBeforeUnload') !== null ? getSetting('interceptBeforeUnload') : true; // A setting that determines whether to warn user before leaving the app (default is true)
params['autoUpdatePWA'] = getSetting('autoUpdatePWA') !== false; // A setting that determines whether to auto-update the PWA without asking the user (default is true)
params['keepTorrentSeeding'] = getSetting('keepTorrentSeeding') !== false; // A setting that determines whether completed in-app BitTorrent downloads keep seeding until app quit (default is true; Electron/NWJS only)

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
// Only the keys listed below are written to the Settings Store. Any other key is applied to the current page
// load alone and is deliberately not stored, so that a crafted link cannot make a lasting change to the app's
// configuration: DEV keeps the ability to drive any setting from the querystring while debugging, but the
// setting reverts as soon as the app is reloaded without it.
(function overrideParams () {
    // Parameters that may be set from the querystring and written to the Settings Store. These are the keys the
    // app passes between its own contexts (the UWP <-> PWA handoffs in this file and in app.js, and the reload
    // in resetApp.js), together with the cosmetic settings and the escape hatches DEV needs to break out of a
    // boot loop. NB a handoff key only belongs here if it is read back from the Store at boot: params that are
    // merely needed for the page load they arrive on (e.g. lastPageVisit) work correctly as session-only values.
    var persistableParams = ['allowInternetAccess', 'contentInjectionMode', 'packagedFile', 'fileVersion',
        'lastSelectedArchive', 'lastSelectedArchivePath', 'manipulateImages', 'allowHTMLExtraction',
        'appCache', 'assetsCache', 'cssTheme', 'cssUITheme', 'hideActiveContentWarning', 'rememberLastPage'];

    // Parameters that are never accepted from the querystring, in any context. The source verification prompt is
    // the app's gate on opening an untrusted archive, and a stored "off" survives every subsequent visit, so a
    // single crafted link must not be able to disarm it. It is deliberately not enough to gate this on a
    // development origin: the app is documented as self-hostable via Docker (see README), where the user's own
    // production instance is reached at http://localhost:<port> on a conventional port, and no origin test can
    // tell that apart from a developer's dev server. DEV: set this once in Configuration, or from DevTools with
    // localStorage.setItem('kiwixjs-sourceVerification', 'false') - both persist, so it is not a per-load cost.
    var neverFromQuerystring = ['sourceVerification'];

    // Parameters that weaken or bypass security-relevant behaviour, and are only ever needed when developing.
    // They are honoured in a development context but ignored everywhere else, so that a crafted link to the
    // production PWA cannot use them to disarm the app.
    var devOnlyParams = ['noPrompts', 'PWAServer'];

    // Parameters whose value must match a pattern before it will be accepted. Most are the URL-shaped params:
    // the OPDS catalogue and download endpoints, and the PWA jump target. Restricting them to the Kiwix domains
    // stops a crafted link repointing the library or a download at a host of the attacker's choosing. NB the
    // trailing group also permits the bare origin, as several of these defaults carry no trailing slash.
    // contentInjectionMode is here for a different reason: it is a mode name rather than a URL, and a value the
    // app does not recognize leaves it in a state its own UI cannot represent (see params.contentInjectionMode
    // above). The two names below are the values of the radio buttons in index.html.
    var kiwixServerPattern = /^https:\/\/(?:(?:[a-z0-9-]+\.)*kiwix\.org|kiwix\.github\.io)(?:[/?#]|$)/;
    var validatedParams = {
        contentInjectionMode: /^(?:jquery|serviceworker)$/,
        kiwixLibraryServer: kiwixServerPattern,
        kiwixLibraryBrowser: kiwixServerPattern,
        kiwixCatalogRoot: kiwixServerPattern,
        kiwixCatalogCategories: kiwixServerPattern,
        kiwixCatalogEntries: kiwixServerPattern,
        kiwixStagingCatalogEntries: kiwixServerPattern,
        kiwixDownloadServer: kiwixServerPattern,
        kiwixMirrorServer: kiwixServerPattern,
        kiwixStagingServer: kiwixServerPattern,
        PWAServer: kiwixServerPattern
    };

    // Keys that must never be copied onto the params object, because assigning them could alter the object's
    // prototype chain rather than setting a parameter
    var forbiddenParams = ['__proto__', 'constructor', 'prototype'];

    // Determines whether we are running from a developer's own machine, as opposed to a shipped app. Note this
    // is deliberately not a secure-context test: the production PWA is served over https, and it is precisely
    // the context we must not trust with the parameters in devOnlyParams.
    // The packaged app types are excluded before the origin is examined, because their origins are
    // indistinguishable from a developer's: the Electron app serves itself from http://localhost via its
    // bundled Express server, and NW.js runs from file:. Trusting those origins would trust every desktop
    // install rather than the developer. DEV: this is why changing the default contentInjectionMode for NW.js
    // (see params.contentInjectionMode above) does not open a hole here - do not reduce this to an origin test.
    // Both clauses below still fire for the cases they are meant for, i.e. a browser pointed at the dev server
    // on localhost, or at www/index.html opened directly from disk.
    var trustedContext = !/Electron|UWP/.test(params.appType) &&
        (/^(?:localhost|127\.0\.0\.1|\[::1\])$/.test(window.location.hostname) || /^file:$/.test(window.location.protocol));

    // NB the value is [^&]* rather than [^&]+ so that an empty value is parsed rather than silently skipped:
    // the UWP handoff clears a stale setting by sending it empty (e.g. '&lastSelectedArchivePath=' below),
    // which never worked while the parser demanded at least one character. Senders that may legitimately have
    // no value must therefore omit the parameter entirely rather than send it empty - see app.js. The pattern
    // still cannot match an empty string overall (it needs at least '?x='), so the global exec loop terminates.
    var rgx = /[?&]([^=]+)=([^&]*)/g;
    var matches = rgx.exec(window.location.search);
    while (matches) {
        // NB test matches[2] against undefined, not truthiness: an empty value is meaningful here
        if (matches[1] && matches[2] !== undefined) {
            var paramKey = decodeURIComponent(matches[1]);
            var paramVal = decodeURIComponent(matches[2]);
            // The title key is a ZIM article path, which is consumed by the router rather than being a setting
            if (paramKey !== 'title' && !~forbiddenParams.indexOf(paramKey)) {
                // NB we must use hasOwnProperty here, or a key such as 'toString' would pick up an inherited
                // function, which is truthy, and calling .test() on it would throw
                var paramPattern = Object.prototype.hasOwnProperty.call(validatedParams, paramKey) ? validatedParams[paramKey] : null;
                if (~neverFromQuerystring.indexOf(paramKey)) {
                    console.warn('Ignoring querystring parameter "' + paramKey + '": it can only be set in Configuration');
                } else if (~devOnlyParams.indexOf(paramKey) && !trustedContext) {
                    console.warn('Ignoring querystring parameter "' + paramKey + '": it is only honoured when running from a development location');
                } else if (paramPattern && !paramPattern.test(paramVal)) {
                    console.warn('Ignoring querystring parameter "' + paramKey + '": the value is not in the expected format');
                } else {
                    // Store new values
                    // NB if we reach here with a devOnlyParams key, we are necessarily in a trusted context (see above)
                    if (~persistableParams.indexOf(paramKey) || paramPattern || ~devOnlyParams.indexOf(paramKey)) {
                        setSetting(paramKey, paramVal);
                    } else {
                        console.debug('Parameter "' + paramKey + '" applies to this page load only, and will not be stored');
                    }
                    paramKey = paramKey === 'lastSelectedArchive' ? 'storedFile' : paramKey;
                    params[paramKey] = paramVal === 'false' ? false : paramVal === 'true' ? true : paramVal;
                }
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
            uriParams += '&lastSelectedArchivePath=&lastSelectedArchive=' + encodeURIComponent(launchArgumentsUWP.files[0].name);
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
        throw new Error('So long, and thanks for all the fish!');
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
document.getElementById('cssUIDarkThemeCheck').checked = params.cssUITheme === 'dark'; // Will be true, or false if light or auto
document.getElementById('cssUIDarkThemeCheck').indeterminate = params.cssUITheme === 'auto';
document.getElementById('cssUIDarkThemeCheck').readOnly = params.cssUITheme === 'auto';
document.getElementById('cssUIDarkThemeState').innerHTML = params.cssUITheme;
document.getElementById('cssWikiDarkThemeCheck').checked = /dark|invert/.test(params.cssTheme);
document.getElementById('cssWikiDarkThemeCheck').indeterminate = params.cssTheme === 'auto';
document.getElementById('cssWikiDarkThemeCheck').readOnly = params.cssTheme === 'auto';
document.getElementById('cssWikiDarkThemeState').innerHTML = params.cssTheme;
document.getElementById('darkInvert').style.display = /dark|invert|darkReader/i.test(params.cssTheme) ? 'inline' : 'none';
document.getElementById('darkLegacy').style.display = /dark|invert|darkReader/i.test(params.cssTheme) ? 'inline' : 'none';
document.getElementById('darkDarkReader').style.display = params.contentInjectionMode === 'serviceworker' && /dark|invert|darkReader/i.test(params.cssTheme) ? 'inline' : 'none';
document.getElementById('cssWikiDarkThemeInvertCheck').checked = params.cssTheme === 'invert';
document.getElementById('cssWikiDarkThemeLegacyCheck').checked = params.customDarkTheme;
document.getElementById('cssWikiDarkThemeDarkReaderCheck').checked = params.cssTheme === 'darkReader';
document.getElementById('triStateThemeRandomBtnCheck').checked = params.displayThemeOrRandomButtons === 'random';
document.getElementById('triStateThemeRandomBtnCheck').indeterminate = params.displayThemeOrRandomButtons === 'both';
document.getElementById('triStateThemeRandomBtnCheck').readOnly = params.displayThemeOrRandomButtons === 'both';
document.getElementById('triStateThemeRandomBtnState').innerHTML = params.displayThemeOrRandomButtons;
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
document.getElementById('hideToolbarsCheck').checked = params.hideToolbars === true; // Will be false if false or 'top'
document.getElementById('hideToolbarsCheck').indeterminate = params.hideToolbars === 'top';
document.getElementById('hideToolbarsCheck').readOnly = params.hideToolbars === 'top';
document.getElementById('hideToolbarsState').innerHTML = (params.hideToolbars === 'top' ? 'top' : params.hideToolbars ? 'both' : 'never');
document.getElementById('showTitleBarCheck').checked = params.showTitleBar;
document.getElementById('openExternalLinksInNewTabsCheck').checked = params.openExternalLinksInNewTabs;
document.getElementById('showPopoverPreviewsCheck').checked = params.showPopoverPreviews;
document.getElementById('disableDragAndDropCheck').checked = params.disableDragAndDrop;
document.getElementById('debugLibzimASMDrop').value = params.debugLibzimASM || '';
document.getElementById('autoUpdatePWACheck').checked = params.autoUpdatePWA;
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
// Set the initial value for params.navbarHeight from the computedvalues of #navbar
params.navbarHeight = parseInt(getComputedStyle(document.getElementById('navbar')).height, 10) || 0;

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
        };
        webpScript.src = 'js/webpHeroBundle_0.0.2.js';
        document.head.appendChild(webpScript);
    }
});
