/*!
 * app.js : The main Kiwix User Interface implementation
 * This file handles the interaction between the Kiwix JS back end and the user
 *
 * Copyright 2013-2024 Jaifroid, Mossroy and contributors
 * Licence GPL v3:
 *
 * This file is part of Kiwix.
 *
 * Kiwix is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public Licence as published by
 * the Free Software Foundation, either version 3 of the Licence, or
 * (at your option) any later version.
 *
 * Kiwix is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public Licence for more details.
 *
 * You should have received a copy of the GNU General Public Licence
 * along with Kiwix (file LICENSE-GPLv3.txt).  If not, see <http://www.gnu.org/licenses/>
 */

'use strict';

/* eslint-disable indent, eqeqeq */

// import styles from '../css/app.css' assert { type: "css" };
// import bootstrap from '../css/bootstrap.min.css' assert { type: "css" };
import zimArchiveLoader from './lib/zimArchiveLoader.js';
import uiUtil from './lib/uiUtil.js';
import popovers from './lib/popovers.js';
import util from './lib/util.js';
import utf8 from './lib/utf8.js';
import cache from './lib/cache.js';
import images from './lib/images.js';
import settingsStore from './lib/settingsStore.js';
import transformStyles from './lib/transformStyles.js';
import transformZimit from './lib/transformZimit.js';
import kiwixServe from './lib/kiwixServe.js';
import updater from './lib/updater.js';
import resetApp from './lib/resetApp.js';

// Import stylesheets programmatically
// document.adoptedStyleSheets = [styles, bootstrap];

/**
 * Define global state variables:
 */

// The global parameter and app state objects are defined in init.js
/* global params, appstate, assetsCache, nw, electronAPI, Windows, webpMachine, dialog, LaunchParams, launchQueue, abstractFilesystemAccess, MSApp */

// Placeholders for the article container, the article window, the article DOM and some UI elements
var articleContainer = document.getElementById('articleContent');
articleContainer.kiwixType = 'iframe';
var articleWindow = articleContainer.contentWindow;
var articleDocument;
var scrollbox = document.getElementById('scrollbox');
var prefix = document.getElementById('prefix');

// The following variables are used to store the current article and its state

var messageChannelWaiting = false;
var transformedHTML = '';
var transDirEntry = null;

/**
 * @type ZIMArchive
 */
appstate.selectedArchive = null;

// An object to hold the current search and its state (allows cancellation of search across modules)
appstate['search'] = {
    prefix: '', // A field to hold the original search string
    status: '', // The status of the search: ''|'init'|'interim'|'cancelled'|'complete'
    type: '' // The type of the search: 'basic'|'full' (set automatically in search algorithm)
};

// A parameter to determine the Settings Store API in use (we need to nullify before testing
// because params.storeType is also set in a preliminary way in init.js)
params['storeType'] = null;
params['storeType'] = settingsStore.getBestAvailableStorageAPI();

// A parameter to determine whether the webkitdirectory API is available
params['webkitdirectory'] = util.webkitdirectorySupported();

// Retrieve UWP launch arguments when the app is started by double-clicking on a file
if (typeof Windows !== 'undefined' && Windows.UI && Windows.UI.WebUI && Windows.UI.WebUI.WebUIApplication) {
    Windows.UI.WebUI.WebUIApplication.addEventListener('activated', function (eventArgs) {
        if (eventArgs.kind === Windows.ApplicationModel.Activation.ActivationKind.file) {
            params.storedFile = eventArgs.files[0].name || '';
            if (params.storedFile) {
                params.pickedFile = eventArgs.files[0];
                params.storedFilePath = eventArgs.files[0].path;
                console.log('App was activated with a file: ' + params.storedFile);
                processPickedFileUWP(params.pickedFile);
            }
        }
    }, false);
}

// At launch, we set the correct content injection mode
if (params.contentInjectionMode === 'serviceworker' && window.nw) {
    // Failsafe for Windows XP version: reset app to Restricted mode because it cannot run in SW mode in Windows XP
    if (nw.process.versions.nw === '0.14.7') setContentInjectionMode('jquery');
} else {
    setContentInjectionMode(params.contentInjectionMode);
}

// Test caching capability
cache.test(function () {});

// Unique identifier of the article expected to be displayed
appstate.expectedArticleURLToBeDisplayed = '';
// Check if we have managed to switch to PWA mode (if running UWP app)
// DEV: we do this in init.js, but sometimes it doesn't seem to register, so we do it again once the app has fully launched
if (/UWP\|PWA/.test(params.appType) && /^http/i.test(window.location.protocol)) {
    // We are in a PWA, so signal success
    params.localUWPSettings.PWA_launch = 'success';
}
// Make Configuration headings collapsible
uiUtil.setupConfigurationToggles();

/**
 * Resize the IFrame height, so that it fills the whole available height in the window
 * @param {Boolean} reload Allows reload of the app on resize
 */
function resizeIFrame (reload) {
    // console.debug('Resizing iframe...');
    // Re-enable top-level scrolling
    var configuration = document.getElementById('configuration');
    var about = document.getElementById('about');
    if (configuration.style.display === 'none' && about.style.display === 'none' && prefix !== document.activeElement) {
        scrollbox.style.height = 0;
    } else {
        scrollbox.style.height = window.innerHeight - document.getElementById('top').getBoundingClientRect().height + 'px';
    }
    uiUtil.showSlidingUIElements();
    var ToCList = document.getElementById('ToCList');
    if (typeof ToCList !== 'undefined') {
        ToCList.style.maxHeight = ~~(window.innerHeight * 0.75) + 'px';
        ToCList.style.marginLeft = ~~(window.innerWidth / 2) - ~~(window.innerWidth * 0.16) + 'px';
    }
    if (window.outerWidth <= 470) {
        document.getElementById('dropup').classList.remove('col-xs-4');
        document.getElementById('dropup').classList.add('col-xs-3');
        if (window.outerWidth <= 360) {
            document.getElementById('btnTop').classList.remove('col-xs-2');
            document.getElementById('btnTop').classList.add('col-xs-1');
        } else {
            document.getElementById('btnTop').classList.remove('col-xs-1');
            document.getElementById('btnTop').classList.add('col-xs-2');
        }
    } else {
        document.getElementById('dropup').classList.remove('col-xs-3');
        document.getElementById('dropup').classList.add('col-xs-4');
    }
    if (settingsStore.getItem('reloadDispatched') === 'true') {
        setTimeout(function () {
            settingsStore.removeItem('reloadDispatched');
        }, 1000);
    } else if (reload && params.resetDisplayOnResize) {
        settingsStore.setItem('reloadDispatched', true, Infinity);
        window.location.reload();
        console.log('So long, and thanks for all the fish!');
        return;
    }
    removePageMaxWidth();
    checkToolbar();
}

window.onresize = function () {
    resizeIFrame(true);
    // Check whether fullscreen icon needs to be updated
    setDynamicIcons();
    // We need to load any images exposed by the resize
    var scrollFunc = document.getElementById('articleContent').contentWindow;
    scrollFunc = scrollFunc ? scrollFunc.onscroll : null;
    if (scrollFunc) scrollFunc();
};

// Define behavior of HTML elements

if (params.navButtonsPos === 'top') {
    // User has requested navigation buttons should be at top, so we need to swap them
    var btnBack = document.getElementById('btnBack');
    var btnBackAlt = document.getElementById('btnBackAlt');
    btnBack.id = 'btnBackAlt';
    btnBackAlt.id = 'btnBack';
    btnBackAlt.style.display = 'inline';
    btnBack.style.display = 'none';
    var btnForward = document.getElementById('btnForward');
    var btnForwardAlt = document.getElementById('btnForwardAlt');
    btnForward.id = 'btnForwardAlt';
    btnForwardAlt.id = 'btnForward';
    btnForwardAlt.style.display = 'inline';
    btnForward.style.display = 'none';
    var btnRandom = document.getElementById('btnRandomArticle');
    var btnRandomAlt = document.getElementById('btnRandomArticleAlt');
    btnRandom.id = 'btnRandomArticleAlt';
    btnRandomAlt.id = 'btnRandomArticle';
    btnRandom.style.display = 'none';
    btnRandomAlt.style.display = 'inline';
}

// Process pointerup events (used for checking if mouse back / forward buttons have been clicked)
function onPointerUp (e) {
    if (typeof e === 'object') {
        if (e.button === 3) {
            document.getElementById('btnBack').click();
        }
        if (e.button === 4) {
            document.getElementById('btnForward').click();
        }
    }
}

if (/UWP/.test(params.appType)) document.body.addEventListener('pointerup', onPointerUp);

var searchArticlesFocused = false;

document.getElementById('searchArticles').addEventListener('click', function () {
    var val = prefix.value;
    // Do not initiate the same search if it is already in progress
    if (appstate.search.prefix === val && !/^(cancelled|complete)$/.test(appstate.search.status)) return;
    document.getElementById('welcomeText').style.display = 'none';
    document.querySelectorAll('.alert').forEach(function (el) {
        el.style.display = 'none';
    });
    uiUtil.pollSpinner();
    pushBrowserHistoryState(null, val);
    // Initiate the search
    searchDirEntriesFromPrefix(val);
    clearFindInArticle();
    // Re-enable top-level scrolling
    var headerHeight = document.getElementById('top').getBoundingClientRect().height;
    var footerHeight = document.getElementById('footer').getBoundingClientRect().height;
    scrollbox.style.height = window.innerHeight - headerHeight - footerHeight + 'px';
    // This flag is set to true in the mousedown event below
    searchArticlesFocused = false;
});
document.getElementById('formArticleSearch').addEventListener('submit', function () {
    document.getElementById('searchArticles').click();
});
// Handle keyboard events in the prefix (article search) field
var keyPressHandled = false;
prefix.addEventListener('keydown', function (e) {
// If user presses Escape...
// IE11 returns "Esc" and the other browsers "Escape"; regex below matches both
    if (/^Esc/.test(e.key)) {
        // Hide the article list
        e.preventDefault();
        e.stopPropagation();
        document.getElementById('articleListWithHeader').style.display = 'none';
        document.getElementById('articleContent').focus();
        document.getElementById('mycloseMessage').click(); // This is in case the modal box is showing with an index search
        keyPressHandled = true;
    }
    // Arrow-key selection code adapted from https://stackoverflow.com/a/14747926/9727685
    // IE11 produces "Down" instead of "ArrowDown" and "Up" instead of "ArrowUp"
    if (/^((Arrow)?Down|(Arrow)?Up|Enter)$/.test(e.key)) {
        // User pressed Down arrow or Up arrow or Enter
        e.preventDefault();
        e.stopPropagation();
        // This is needed to prevent processing in the keyup event : https://stackoverflow.com/questions/9951274
        keyPressHandled = true;
        var activeElement = document.querySelector('#articleList .hover') || document.querySelector('#articleList a');
        if (!activeElement) return;
        // If user presses Enter, read the dirEntry
        if (/Enter/.test(e.key)) {
            if (activeElement.classList.contains('hover')) {
                var dirEntryId = activeElement.getAttribute('dirEntryId');
                findDirEntryFromDirEntryIdAndLaunchArticleRead(decodeURIComponent(dirEntryId));
                return;
            }
        }
        // If user presses ArrowDown...
        // (NB selection is limited to five possibilities by regex above)
        if (/Down/.test(e.key)) {
            if (activeElement.classList.contains('hover')) {
                activeElement.classList.remove('hover');
                activeElement = activeElement.nextElementSibling || activeElement;
                var nextElement = activeElement.nextElementSibling || activeElement;
                if (!uiUtil.isElementInView(window, nextElement, true)) nextElement.scrollIntoView(false);
            }
        }
        // If user presses ArrowUp...
        if (/Up/.test(e.key)) {
            activeElement.classList.remove('hover');
            activeElement = activeElement.previousElementSibling || activeElement;
            var previousElement = activeElement.previousElementSibling || activeElement;
            if (!uiUtil.isElementInView(window, previousElement, true)) previousElement.scrollIntoView();
            if (previousElement === activeElement) {
                document.getElementById('articleListWithHeader').scrollIntoView();
                document.getElementById('top').scrollIntoView();
            }
        }
        activeElement.classList.add('hover');
    }
});
// Search for titles as user types characters
prefix.addEventListener('keyup', function (e) {
    if (appstate.selectedArchive !== null && appstate.selectedArchive.isReady()) {
        // Prevent processing by keyup event if we already handled the keypress in keydown event
        if (keyPressHandled) {
            keyPressHandled = false;
        } else {
            onKeyUpPrefix(e);
        }
    }
});
// Restore the search results if user goes back into prefix field
prefix.addEventListener('focus', function () {
    var val = prefix.value;
    if (/^\s/.test(val)) {
        // If user had previously had the archive index open, clear it
        prefix.value = '';
    } else if (val !== '') {
        document.getElementById('articleListWithHeader').style.display = '';
    }
    scrollbox.style.position = 'absolute';
    var headerHeight = document.getElementById('top').getBoundingClientRect().height;
    var footerHeight = document.getElementById('footer').getBoundingClientRect().height;
    scrollbox.style.height = window.innerHeight - headerHeight - footerHeight + 'px';
});
// Hide the search results if user moves out of prefix field
prefix.addEventListener('blur', function () {
    if (!searchArticlesFocused) {
        appstate.search.status = 'cancelled';
    }
    // We need to wait one tick for the activeElement to receive focus
        setTimeout(function () {
            if (!(/^articleList|searchSyntaxLink/.test(document.activeElement.id) ||
            /^list-group/.test(document.activeElement.className))) {
                scrollbox.style.height = 0;
                document.getElementById('articleListWithHeader').style.display = 'none';
                appstate.tempPrefix = '';
                uiUtil.clearSpinner();
            }
        }, 1);
});

// Add keyboard shortcuts
window.addEventListener('keyup', function (e) {
    // Alt-F for search in article, also patches Ctrl-F for apps that do not have access to browser search
    if ((e.ctrlKey || e.altKey) && e.key === 'F') {
        document.getElementById('findText').click();
    }
});

window.addEventListener('keydown', function (e) {
    // Ctrl-P to patch printing support, so iframe gets printed
    if (e.ctrlKey && e.key === 'P') {
        e.stopPropagation();
        e.preventDefault();
        printIntercept();
    }
}, true);

// Set up listeners for print dialogues
function printArticle (doc) {
    uiUtil.printCustomElements(doc);
    uiUtil.systemAlert('<b>Document will now reload to restore the DOM after printing...</b>').then(function () {
        printCleanup();
    });
    // innerDocument.execCommand("print", false, null);
    // if (typeof window.nw !== 'undefined' || typeof window.fs === 'undefined') {
        doc.defaultView.print();
    // } else {
    //     // We are in an Electron app and need to use export to browser to print
    //     params.preloadingAllImages = false;
    //     // Add a window.print() script to the html
    //     document.getElementById('articleContent').contentDocument.head.innerHTML +=
    //         '\n<script type="text/javascript">window.onload=function() {\n' +
    //         '    alert("After you press OK, you will be asked to choose a printer.\\n" +\n' +
    //         '        "If you want to test the formatting, we suggest you print to\\n" +\n' +
    //         '        "PDF or XPS. You could then open the PDF and select specific pages.");\n' +
    //         '    window.print();\n' +
    //         '};<\/script>';
    //     //html = html.replace(/(<\/head>\s*)/i, '<script type="text/javascript">window.onload=window.print();<\/script>\n$1');
    //     uiUtil.extractHTML();
    // }
};
document.getElementById('printDesktopCheck').addEventListener('click', function (e) {
    // Reload article if user wants to print a different style
    params.cssSource = e.target.checked ? 'desktop' : 'mobile';
    params.printIntercept = true;
    params.printInterception = false;
    var btnContinue = document.getElementById('printapproveConfirm');
    var btnCancel = document.getElementById('printdeclineConfirm');
    btnCancel.disabled = true;
    btnContinue.disabled = true;
    btnContinue.innerHTML = 'Please wait';
    goToArticle(params.lastPageVisit.replace(/@kiwixKey@.+/, ''));
});
document.getElementById('printImageCheck').addEventListener('click', function (e) {
    // Reload article if user wants to print images
    if (e.target.checked && !params.allowHTMLExtraction) {
        params.printIntercept = true;
        params.printInterception = false;
        params.allowHTMLExtraction = true;
        var btnContinue = document.getElementById('printapproveConfirm');
        var btnCancel = document.getElementById('printdeclineConfirm');
        btnCancel.disabled = true;
        btnContinue.disabled = true;
        btnContinue.innerHTML = 'Please wait';
        goToArticle(params.lastPageVisit.replace(/@kiwixKey@.+/, ''));
    }
});

function printCleanup () {
    if (!params.printInterception) {
        // We don't need a radical cleanup because there was no printIntercept
        removePageMaxWidth();
        setTab();
        params.cssTheme = settingsStore.getItem('cssTheme') || 'light';
        if (document.getElementById('cssWikiDarkThemeDarkReaderCheck').checked) {
            // It seems darkReader has been auto-turned on, so we need to respect that
            params.cssTheme = 'darkReader';
        }
        switchCSSTheme();
        return;
    }
    params.printIntercept = false;
    params.printInterception = false;
    // Immediately restore temporarily changed values
    params.allowHTMLExtraction = settingsStore.getItem('allowHTMLExtraction') === 'true';
    goToArticle(params.lastPageVisit.replace(/@kiwixKey@.+/, ''));
    setTimeout(function () { // Restore temporarily changed value after page has reloaded
        params.rememberLastPage = settingsStore.getItem('rememberLastPage') === 'true';
        if (!params.rememberLastPage) {
            settingsStore.setItem('lastPageVisit', '', Infinity);
            params.lastPageHTML = '';
            // DEV: replace this with cache.clear when you have repaired that method
            cache.setArticle(params.lastPageVisit.replace(/.+@kiwixKey@/, ''), params.lastPageVisit.replace(/@kiwixKey@.+/, ''), '', function () {});
        }
    }, 5000);
}
// End of listeners for print dialogues

function printIntercept () {
    params.printInterception = params.printIntercept;
    params.printIntercept = false;
    document.getElementById('btnAbout').classList.add('active');
    var btnContinue = document.getElementById('printapproveConfirm');
    var btnCancel = document.getElementById('printdeclineConfirm');
    btnCancel.disabled = false;
    btnContinue.disabled = false;
    btnContinue.innerHTML = 'Continue';
    var printModalContent = document.getElementById('print-modal-content');
    openAllSections(true);
    printModalContent.classList.remove('dark');
    var determinedTheme = params.cssUITheme;
    determinedTheme = determinedTheme === 'auto' ? cssUIThemeGetOrSet('auto', true) : determinedTheme;
    if (determinedTheme !== 'light') {
        printModalContent.classList.add('dark');
    }
    // If document is in wrong style, or images are one-time BLOBs, reload it
    // var innerDoc = window.frames[0].frameElement.contentDocument;
    var innerDoc = document.getElementById('articleContent').contentDocument;
    if (appstate.isReplayWorkerAvailable) {
        innerDoc = innerDoc ? innerDoc.getElementById('replay_iframe').contentDocument : null;
    }
    if (!innerDoc) {
        return uiUtil.systemAlert('Sorry, we could not find a document to print! Please load one first.', 'Warning');
    }
    if (params.contentInjectionMode === 'serviceworker') {
        // Re-establish lastPageVisit because it is not always set, for example with dynamic loads, in SW mode
        params.lastPageVisit = articleDocument.location.href.replace(/^.+\/([^/]+\.[zZ][iI][mM]\w?\w?)\/([CA]\/.*$)/, function (m0, zimName, zimURL) {
            return decodeURI(zimURL) + '@kiwixKey@' + decodeURI(zimName);
        });
    }
    var printDesktopCheck = document.getElementById('printDesktopCheck').checked;
    var printImageCheck = document.getElementById('printImageCheck').checked;
    var styleIsDesktop = !/href\s*=\s*["'][^"']*?(?:minerva|mobile)/i.test(innerDoc.head.innerHTML);
    // if (styleIsDesktop != printDesktopCheck || printImageCheck && !params.allowHTMLExtraction || params.contentInjectionMode == 'serviceworker') {
    if (appstate.wikimediaZimLoaded && (styleIsDesktop !== printDesktopCheck || (printImageCheck && !params.allowHTMLExtraction))) {
        // We need to reload the document because it doesn't match the requested style or images are one-time BLOBs
        params.cssSource = printDesktopCheck ? 'desktop' : 'mobile';
        params.rememberLastPage = true; // Re-enable caching to speed up reloading of page
        // params.contentInjectionMode = 'jquery'; //Much easier to count images in Restricted mode
        params.allowHTMLExtraction = true;
        params.printIntercept = true;
        params.printInterception = false;
        btnCancel.disabled = true;
        btnContinue.disabled = true;
        btnContinue.innerHTML = 'Please wait';
        // Show the modal so the user knows that printing is being prepared
        document.getElementById('printModal').style.display = 'block';
        goToArticle(params.lastPageVisit.replace(/@kiwixKey@.+/, ''));
        return;
    }
    // Pre-load all images in case user wants to print them
    if (params.imageDisplay) {
        document.getElementById('printImageCheck').disabled = false;
        if (printImageCheck) {
            btnCancel.disabled = true;
            btnContinue.disabled = true;
            btnContinue.innerHTML = 'Loading images...';
            // Callback for when all images are loaded
            params.printImagesLoaded = function () {
                // Images have finished loading, so enable buttons
                btnCancel.disabled = false;
                btnContinue.disabled = false;
                btnContinue.innerHTML = 'Continue';
            };
            if (params.contentInjectionMode === 'jquery') {
                images.prepareImagesJQuery(articleWindow, true);
            } else {
                images.prepareImagesServiceWorker(articleWindow, true);
            }
        }
    } else {
        document.getElementById('printImageCheck').checked = false;
        document.getElementById('printImageCheck').disabled = true;
    }
    // Remove max page-width restriction
    if (params.removePageMaxWidth !== true) {
        var tempPageMaxWidth = params.removePageMaxWidth;
        params.removePageMaxWidth = true;
        removePageMaxWidth();
        params.removePageMaxWidth = tempPageMaxWidth;
    }
    // Put doc into light mode
    params.cssTheme = 'light';
    switchCSSTheme();
    uiUtil.systemAlert(' ', '', true, null, 'Continue', null, 'printModal').then(function (result) {
        // Restore temporarily changed values
        params.cssSource = settingsStore.getItem('cssSource') || 'auto';
        params.cssTheme = settingsStore.getItem('cssTheme') || 'light';
        if (result) printArticle(innerDoc);
        else printCleanup();
    });
}

// Establish some variables with global scope
var localSearch = {};

function clearFindInArticle () {
    if (document.getElementById('row2').style.display === 'none') return;
    if (typeof localSearch !== 'undefined' && localSearch.remove) {
        localSearch.remove();
    }
    document.getElementById('findInArticle').value = '';
    document.getElementById('matches').innerHTML = 'Full: 0';
    document.getElementById('partial').innerHTML = 'Partial: 0';
    document.getElementById('row2').style.display = 'none';
    document.getElementById('findText').classList.remove('active');
}

document.getElementById('findText').addEventListener('click', function () {
    var searchDiv = document.getElementById('row2');
    if (searchDiv.style.display !== 'none') {
        setTab();
        // Return sections to original state
        openAllSections();
        // Return params.hideToolbars to its original state
        checkToolbar();
        return;
    }
    var findInArticle = null;
    var innerDocument = document.getElementById('articleContent').contentDocument;
    if (appstate.isReplayWorkerAvailable) {
        innerDocument = innerDocument ? innerDocument.getElementById('replay_iframe').contentDocument : null;
    }
    innerDocument = innerDocument ? innerDocument.body : null;
    if (!innerDocument || innerDocument.innerHTML.length < 10) return;
    setTab('findText');
    findInArticle = document.getElementById('findInArticle');
    searchDiv.style.display = 'block';
    // Show the toolbar
    params.hideToolbars = false;
    checkToolbar();
    findInArticle.focus();
    // We need to open all sections to search
    openAllSections(true);
    localSearch = new util.Hilitor(innerDocument);
    // TODO: MatchType should be language specific
    findInArticle.addEventListener('keyup', function (e) {
        // If user pressed Alt-F or Ctrl-F, exit
        if ((e.altKey || e.ctrlKey) && e.key === 'F') return;
        var val = this.value;
        // If user pressed enter / return key
        if (val && (e.key === 'Enter' || e.keyCode === 13)) {
            localSearch.scrollFrom = localSearch.scrollToFullMatch(val, localSearch.scrollFrom);
            return;
        }
        // If value hasn't changed, exit
        if (val === localSearch.lastScrollValue) return;
        findInArticleKeyup(val);
    });
    var findInArticleKeyup = function (val) {
        // Use a timeout, so that very quick typing does not cause a lot of overhead
        if (window.timeoutFIAKeyup) {
            window.clearTimeout(window.timeoutFIAKeyup);
        }
        window.timeoutFIAKeyup = window.setTimeout(function () {
            findInArticleInitiate(val);
        }, 500);
    };
    var findInArticleInitiate = function (val) {
        // Ensure nothing happens if only one or two ASCII values have been entered (search is not specific enough)
        // if no value has been entered (clears highlighting if user deletes all values in search field)
        if (!/^\s*[A-Za-z\s]{1,2}$/.test(val)) {
            localSearch.scrollFrom = 0;
            localSearch.lastScrollValue = val;
            localSearch.setMatchType('open');
            // Change matchType to 'left' if we are dealing with an ASCII language and a space has been typed
            if (/\s/.test(val) && /(?:^|[\s\b])[A-Za-z]+(?:[\b\s]|$)/.test(val)) localSearch.setMatchType('left');
            localSearch.apply(val);
            if (val.length) {
                var fullTotal = localSearch.countFullMatches(val);
                var partialTotal = localSearch.countPartialMatches();
                fullTotal = fullTotal > partialTotal ? partialTotal : fullTotal;
                document.getElementById('matches').innerHTML = '<a id="scrollLink" href="#">Full: ' + fullTotal + '</a>';
                document.getElementById('partial').innerHTML = 'Partial: ' + partialTotal;
                document.getElementById('scrollLink').addEventListener('click', function () {
                    localSearch.scrollFrom = localSearch.scrollToFullMatch(val, localSearch.scrollFrom);
                });
                // Auto-scroll: TODO - consider making this an option
                localSearch.scrollFrom = localSearch.scrollToFullMatch(val, localSearch.scrollFrom);
            } else {
                document.getElementById('matches').innerHTML = 'Full: 0';
                document.getElementById('partial').innerHTML = 'Partial: 0';
            }
        }
    };
});

document.getElementById('btnRandomArticle').addEventListener('click', function () {
    // In Restricted mode, only load random content in iframe (not tab or window)
    appstate.target = 'iframe';
    setTab('btnRandomArticle');
    // Re-enable top-level scrolling
    goToRandomArticle();
});

document.getElementById('btnRescanDeviceStorage').addEventListener('click', function () {
    var returnDivs = document.getElementsByClassName('returntoArticle');
    for (var i = 0; i < returnDivs.length; i++) {
        returnDivs[i].innerHTML = '';
    }
    params.rescan = true;
    // Deprecated: Reload any ZIM files in local storage (which the usar can't otherwise select with the filepicker)
    // loadPackagedArchive();
    if (storages.length) {
        searchForArchivesInStorage();
    } else {
        displayFileSelect();
    }
    // Check if we are in an Android app, and if so, auto-select use of OPFS if there is no set value in settingsStore for useOPFS
    if ((/Android/.test(params.appType) || /Firefox/.test(navigator.userAgent)) && !params.useOPFS && !settingsStore.getItem('useOPFS')) {
        // This will only run first time app is run on Android
        setTimeout(function () {
            uiUtil.systemAlert('<p>We are switching to the Private File System (OPFS).</p>' +
                '<p><b><i>If asked, please accept a one-time Storage permission prompt.</i></b></p>' +
                '<i>More info</i>: the OPFS provides significant benefits such as: <b>faster file system access</b>; ' +
                '<b>no permission prompts</b>; <b>automatic reload of archive on app start</b>.</p>',
                'Switching to OPFS', true, 'Use classic file picker')
            .then(function (response) {
                if (response) {
                    document.getElementById('useOPFSCheck').click();
                } else {
                    settingsStore.setItem('useOPFS', false, Infinity);
                }
            });
        }, 2000);
    } else if (!settingsStore.getItem('useOPFS')) {
        // This esnures that there is an explicit setting for useOPFS, which in turn allows us to tell if the
        // app is running for the first time (so we don't keep prompting the user to use the OPFS)
        settingsStore.setItem('useOPFS', false, Infinity);
    }
});
// Bottom bar :
// @TODO Since bottom bar now hidden in Settings and About the returntoArticle code cannot be accessed;
// consider adding it to top home button instead
document.getElementById('btnBack').addEventListener('click', function () {
    if (document.getElementById('articleContent').style.display === 'none') {
        document.getElementById('returntoArticle').click();
        return;
    }
    clearFindInArticle();
    history.back();
});
document.getElementById('btnForward').addEventListener('click', function () {
    clearFindInArticle();
    history.forward();
});
document.getElementById('btnZoomin').addEventListener('click', function () {
    params.relativeFontSize += 5;
    var doc = document.getElementById('articleContent').contentDocument;
    var docElStyle = doc.documentElement.style;
    // IE11 and Firefox need to use fontSize on the body style
    var zoomProp = '-ms-zoom' in docElStyle ? 'fontSize' : 'zoom' in docElStyle ? 'zoom' : 'fontSize';
    docElStyle = zoomProp === 'fontSize' ? doc.body.style : docElStyle;
    docElStyle[zoomProp] = /-\/static\/main\.css|statc\/css\/sotoki.css/.test(doc.head.innerHTML) && zoomProp === 'fontSize' ? params.relativeFontSize * 1.5 + '%' : params.relativeFontSize + '%';
    var lblZoom = document.getElementById('lblZoom');
    lblZoom.innerHTML = params.relativeFontSize + '%';
    lblZoom.style.cssText = 'position:absolute;right:' + window.innerWidth / 5 + 'px;bottom:50px;z-index:50;';
    setTimeout(function () {
        lblZoom.innerHTML = '';
    }, 2000);
    settingsStore.setItem('relativeFontSize', params.relativeFontSize, Infinity);
    document.getElementById('articleContent').contentWindow.focus();
});
document.getElementById('btnZoomout').addEventListener('click', function () {
    params.relativeFontSize -= 5;
    var doc = document.getElementById('articleContent').contentDocument;
    var docElStyle = doc.documentElement.style;
    var zoomProp = '-ms-zoom' in docElStyle ? 'fontSize' : 'zoom' in docElStyle ? 'zoom' : 'fontSize';
    docElStyle = zoomProp === 'fontSize' ? doc.body.style : docElStyle;
    docElStyle[zoomProp] = /-\/static\/main\.css|statc\/css\/sotoki.css/.test(doc.head.innerHTML) && zoomProp === 'fontSize' ? params.relativeFontSize * 1.5 + '%' : params.relativeFontSize + '%';
    var lblZoom = document.getElementById('lblZoom');
    lblZoom.innerHTML = params.relativeFontSize + '%';
    lblZoom.style.cssText = 'position:absolute;right:' + window.innerWidth / 4 + 'px;bottom:50px;z-index:50;';
    setTimeout(function () {
        lblZoom.innerHTML = '';
    }, 2000);
    settingsStore.setItem('relativeFontSize', params.relativeFontSize, Infinity);
    document.getElementById('articleContent').contentWindow.focus();
});
setRelativeUIFontSize(params.relativeUIFontSize);
document.getElementById('relativeUIFontSizeSlider').addEventListener('change', function () {
    setRelativeUIFontSize(this.value);
});

function setRelativeUIFontSize (value) {
    value = ~~value;
    document.getElementById('spinnerVal').innerHTML = value + '%';
    document.getElementById('search-article').style.fontSize = value + '%';
    document.getElementById('relativeUIFontSizeSlider').value = value;
    var forms = document.querySelectorAll('.form-control');
    var i;
    for (i = 0; i < forms.length; i++) {
        forms[i].style.fontSize = ~~(value * 14 / 100) + 'px';
    }
    var buttons = document.getElementsByClassName('btn');
    for (i = 0; i < buttons.length; i++) {
        // Some specific buttons need to be smaller
        buttons[i].style.fontSize = /Archive|RefreshApp|Reset2/.test(buttons[i].id) ? ~~(value * 10 / 100) + 'px' : ~~(value * 14 / 100) + 'px';
    }
    var heads = document.querySelectorAll('h1, h2, h3, h4');
    for (i = 0; i < heads.length; i++) {
        var multiplier = 1;
        var head = heads[i].tagName;
        multiplier = head === 'H4' ? 1.4 : head === 'H3' ? 1.9 : head === 'H2' ? 2.3 : head === 'H1' ? 2.8 : multiplier;
        heads[i].style.fontSize = ~~(value * 0.14 * multiplier) + 'px';
    }
    document.getElementById('displaySettingsDiv').scrollIntoView();
    // prefix.style.height = ~~(value * 14 / 100) * 1.4285 + 14 + "px";
    if (value !== params.relativeUIFontSize) {
        params.relativeUIFontSize = value;
        settingsStore.setItem('relativeUIFontSize', value, Infinity);
    }
}

document.getElementById('btnHomeBottom').addEventListener('click', function () {
    document.getElementById('btnHome').click();
});

// Deal with the Windows Mobile / Tablet back button
if (typeof Windows !== 'undefined' &&
    typeof Windows.UI !== 'undefined' &&
    typeof Windows.ApplicationModel !== 'undefined') {
    var onBackRequested = function (eventArgs) {
        window.history.back();
        eventArgs.handled = true;
    }
    Windows.UI.Core.SystemNavigationManager.getForCurrentView()
        .appViewBackButtonVisibility =
        Windows.UI.Core.AppViewBackButtonVisibility.visible;
    Windows.UI.Core.SystemNavigationManager.getForCurrentView()
        .addEventListener('backrequested', onBackRequested);
}

document.getElementById('btnTop').addEventListener('click', function () {
    var header = document.getElementById('top');
    var iframe = document.getElementById('articleContent');
    // If the toolbar is hidden, show it instead of jumping to top
    if (!/\(0p?x?\)/.test(header.style.transform)) {
        header.style.transform = 'translateY(0)';
    } else {
        if (!params.hideToolbars) iframe.style.transform = 'translateY(-1px)';
        iframe.contentWindow.scrollTo({
            top: '0',
            behavior: 'smooth'
        });
        document.getElementById('search-article').scrollTop = 0;
    }
    iframe.contentWindow.focus();
});
// Top menu :
document.getElementById('btnHome').addEventListener('click', function () {
    // In Restricted mode, only load landing page in iframe (not tab or window)
    appstate.target = 'iframe';
    setTab('btnHome');
    document.getElementById('search-article').scrollTop = 0;
    const articleContent = document.getElementById('articleContent');
    const articleContentDoc = articleContent ? articleContent.contentDocument : null;
    while (articleContentDoc.firstChild) articleContentDoc.removeChild(articleContentDoc.firstChild);
    uiUtil.clearSpinner();
    document.getElementById('welcomeText').style.display = '';
    if (appstate.selectedArchive !== null && appstate.selectedArchive.isReady()) {
        document.getElementById('welcomeText').style.display = 'none';
        goToMainArticle();
    }
});

var currentArchive = document.getElementById('currentArchive');
var currentArchiveLink = document.getElementById('currentArchiveLink');
var openCurrentArchive = document.getElementById('openCurrentArchive');
var archiveFilesLegacy = document.getElementById('archiveFilesLegacy');
var archiveDirLegacy = document.getElementById('archiveDirLegacy');
if (!params.webkitdirectory) {
    archiveDirLegacy.style.display = 'none';
}

function setTab (activeBtn) {
    // Highlight the selected section in the navbar
    setActiveBtn(activeBtn);
    clearFindInArticle();
    // Re-enable bottom toolbar display
    document.getElementById('footer').style.display = 'block';
    // Re-enable top-level scrolling
    document.getElementById('top').style.position = 'relative';
    // Use the "light" navbar if the content is "light" (otherwise it looks shite....)
    var determinedTheme = cssUIThemeGetOrSet(params.cssUITheme);
    var determinedWikiTheme = params.cssTheme === 'auto' ? determinedTheme : params.cssTheme === 'inverted' ? 'dark' : params.cssTheme;
    if (determinedWikiTheme !== determinedTheme) {
        if ((determinedWikiTheme === 'light' && (!activeBtn || activeBtn === 'btnHome' || activeBtn === 'findText')) ||
            (determinedWikiTheme === 'dark' && activeBtn && activeBtn !== 'btnHome' && activeBtn !== 'findText')) {
            cssUIThemeGetOrSet('light');
        } else {
            cssUIThemeGetOrSet('dark');
        }
    } else {
        cssUIThemeGetOrSet(determinedTheme);
    }
    if (typeof Windows === 'undefined' && typeof window.showDirectoryPicker !== 'function' && !window.dialog && !params.webkitdirectory) {
        // If not UWP, File System Access API, webkitdirectory API or Electron methods, hide the folder picker
        document.getElementById('archiveFiles').style.display = 'none';
        document.getElementById('archiveFilesLabel').style.display = 'none';
    }
    // Display OPFS checkbox if the browser supports the full API
    if (navigator && navigator.storage && ('getDirectory' in navigator.storage) && ('estimate' in navigator.storage)) {
        document.getElementById('displayOPFS').style.display = '';
    }
    document.getElementById('archiveFilesLegacyDiv').style.display = 'none';
    document.getElementById('chooseArchiveFromLocalStorage').style.display = 'block';
    document.getElementById('libraryArea').style.borderColor = '';
    document.getElementById('libraryArea').style.borderStyle = '';
    if (params.packagedFile && params.storedFile && params.storedFile !== params.packagedFile) {
        currentArchiveLink.innerHTML = params.storedFile.replace(/\.zim(\w\w)?$/i, '');
        currentArchiveLink.dataset.archive = params.storedFile;
        currentArchive.style.display = 'block';
        openCurrentArchive.style.display = (params.pickedFile || params.pickedFolder) ? 'none' : '';
        document.getElementById('downloadLinksText').style.display = 'none';
        document.getElementById('usage').style.display = 'none';
    }
    if (params.storedFile && params.storedFile === params.packagedFile) {
        if (/wikipedia.en.(100|ray.charles)/i.test(params.packagedFile)) document.getElementById('usage').style.display = 'inline';
        document.getElementById('downloadLinksText').style.display = 'block';
        currentArchive.style.display = 'none';
    }
    var update = document.getElementById('update');
    if (update) document.getElementById('logUpdate').innerHTML = update.innerHTML.match(/<ul[^>]*>[\s\S]+/i);
    var features = document.getElementById('features');
    if (features) document.getElementById('logFeatures').innerHTML = features.innerHTML;
    // Show the selected content in the page
    document.getElementById('about').style.display = 'none';
    document.getElementById('configuration').style.display = 'none';
    document.getElementById('formArticleSearch').style.display = '';
    if (!activeBtn || activeBtn === 'btnHome') {
        scrollbox.style.height = 0;
        document.getElementById('search-article').style.overflowY = 'hidden';
        setTimeout(function () {
            if (appstate.target === 'iframe' && appstate.selectedArchive) {
                // Note that it is too early to display the zimit iframe due to possible loading of darkReader and other css issues
                if (articleContainer && articleContainer.style && articleDocument) {
                    articleContainer.style.display = '';
                }
                if (articleWindow) articleWindow.focus();
            }
        }, 400);
    }
    setDynamicIcons(activeBtn);
    const articleList = document.getElementById('articleList');
    const articleListHeaderMessage = document.getElementById('articleListHeaderMessage');
    while (articleList.firstChild) articleList.removeChild(articleList.firstChild);
    while (articleListHeaderMessage.firstChild) articleListHeaderMessage.removeChild(articleListHeaderMessage.firstChild);
    document.getElementById('articleListWithHeader').style.display = 'none';
    prefix.value = '';
    document.getElementById('welcomeText').style.display = 'none';
    if (params.themeChanged) {
        params.themeChanged = null;
        goToMainArticle();
    }
    if (params.beforeinstallpromptFired) {
        var divInstall1 = document.getElementById('divInstall1');
        if (activeBtn !== 'btnConfigure' && !params.installLater && (params.pagesLoaded === 3 || params.pagesLoaded === 9)) {
            divInstall1.style.display = 'block';
            setTimeout(function () {
                // If installLater is now true, then the user clicked the Later button and the timeout in init.js will hide the display
                if (!params.installLater) {
                    divInstall1.style.display = 'none';
                    resizeIFrame();
                }
            }, 9000);
        } else {
            divInstall1.style.display = 'none';
        }
    }
    // Check for upgrade of PWA
    if (activeBtn === 'btnConfigure') checkPWAUpdate();
    // Resize iframe
    setTimeout(resizeIFrame, 100);
}

// Set the dynamic icons in the navbar
function setDynamicIcons (btn) {
    var btnAbout = document.getElementById('btnAbout');
    if (params.lockDisplayOrientation) {
        if (uiUtil.appIsFullScreen()) {
            btnAbout.innerHTML = '<span class="glyphicon glyphicon-resize-small"></span>';
            btnAbout.title = 'Exit fullscreen';
        } else {
            btnAbout.innerHTML = '<span class="glyphicon glyphicon-fullscreen"></span>';
            btnAbout.title = 'Return to fullscreen';
        }
    } else {
        // When the scrollbox height is 0, we are not in Configuration or About
        if ((!btn && scrollbox.offsetHeight === 0) || btn === 'btnHome' || btn === 'findText') {
            btnAbout.innerHTML = '<span class="glyphicon glyphicon-print"></span>';
            btnAbout.title = 'Ctrl-P: Print';
        } else {
            btnAbout.innerHTML = '<span class="glyphicon glyphicon-info-sign"></span>';
            btnAbout.title = 'About';
        }
    }
}

// Check if a PWA update is available
function checkPWAUpdate () {
    if (!params.upgradeNeeded && /PWA/.test(params.appType)) {
        caches.keys().then(function (keyList) {
            var cachePrefix = cache.APPCACHE.replace(/^([^\d]+).+/, '$1');
            document.getElementById('alertBoxPersistent').innerHTML = '';
            keyList.forEach(function (key) {
                if (key === cache.APPCACHE || key === cache.CACHEAPI) return;
                // Ignore any keys that do not begin with the APPCACHE prefix (they could be from other apps using the same domain)
                if (key.indexOf(cachePrefix)) return;
                // If we get here, then there is a kiwix cache key that does not match our version, i.e. a PWA-in-waiting
                var version = key.replace(cachePrefix, '');
                var loadOrInstall = params.PWAInstalled ? 'install' : 'load';
                params.upgradeNeeded = true;
                uiUtil.showUpgradeReady(version, loadOrInstall);
            });
        });
    } else if (params.upgradeNeeded) {
        var upgradeAlert = document.getElementById('upgradeAlert');
        if (upgradeAlert) upgradeAlert.style.display = 'block';
    }
}

// Electron callback listener if an update is found by main.js
if (window.electronAPI) {
    electronAPI.on('update-available', function (data) {
        console.log('Upgrade is available or in progress:' + data);
        params.upgradeNeeded = true;
        if (data.percent) {
            var percent = data.percent.toFixed(1);
            uiUtil.showUpgradeReady(percent, 'progress');
        } else {
            uiUtil.showUpgradeReady(data.version, 'install');
        }
    });
    electronAPI.on('get-store-value', function (key, value) {
        if (key === 'expressPort') {
            setExpressServerUI(value);
        }
    });
    electronAPI.on('dl-received', function (received, total) {
        kiwixServe.reportDownloadProgress(received, total);
    });
    electronAPI.on('get-launch-file-path', function (fullPath) {
        if (fullPath) {
            fullPath = fullPath.replace(/\\/g, '/');
            var pathParts = fullPath.match(/^(.+[/\\])([^/\\]+)$/i);
            if (pathParts) {
                params.rescan = false;
                console.debug('[ElectronAPI] App was launched with the following file path: ' + fullPath);
                var archiveFolder = pathParts[1], archiveFile = pathParts[2];
                params.storedFile = archiveFile;
                // This is needed to prevent the app from trying to load the previous storedFilePath when the File System Access API is available
                params.storedFilePath = null;
                scanNodeFolderforArchives(archiveFolder, function (archivesInFolder) {
                    // console.debug('archivesInFolder: ' + JSON.stringify(archivesInFolder));
                    setLocalArchiveFromArchiveList(archiveFile);
                });
                return;
            }
        }
        console.debug('[ElectronAPI] No file was launched with the app');
    });
}

// Check for GitHub and Electron updates
var updateCheck = document.getElementById('updateCheck');
params.isUWPStoreApp = /UWP/.test(params.appType) && Windows.ApplicationModel && Windows.ApplicationModel.Package &&
    !/Association.Kiwix/.test(Windows.ApplicationModel.Package.current.id.publisher) || window.electronAPI && window.electronAPI.isMicrosoftStoreApp;
// If Internet access is allowed, or it's a UWP Store app, or it's HTML5 (i.e., not Electron/NWJS or UWP) ...
if (params.allowInternetAccess || params.isUWPStoreApp || /HTML5/.test(params.appType)) {
    updateCheck.style.display = 'none'; // ... hide the update check link
    if (params.isUWPStoreApp) console.debug('Hiding update check link because this is a UWP Store app.');
}
// Function to check for updates from GitHub
function checkUpdateServer () {
    if (!params.allowInternetAccess || params.upgradeNeeded) {
        console.warn('The GitHub update check was blocked because ' + (params.upgradeNeeded ? 'a PWA upgrade is needed.' : 'the user has not allowed Internet access.'));
        return;
    }
    // If it's plain HTML5 (not Electron/NWJS or UWP), don't check for updates
    if (/HTML5/.test(params.appType)) return;
    if (params.isUWPStoreApp) return; // It's a UWP app installed from the Store, so it will self update
    // Electron updates
    if (window.electronAPI) {
        var electronVersion = navigator.userAgent.replace(/^.*Electron.([\d.]+).*/i, '$1');
        var isUpdateableElectronVersion = !electronVersion.startsWith(params.win7ElectronVersion);
        var baseApp = (params.packagedFile && /wikivoyage/.test(params.packagedFile)) ? 'wikivoyage'
            : (params.packagedFile && /wikmed|mdwiki/.test(params.packagedFile)) ? 'wikimed'
                : 'electron';
        if (baseApp === 'electron' && isUpdateableElectronVersion) {
            console.log('Launching Electron auto-updater...');
            electronAPI.checkForUpdates();
        } else {
            console.log('Auto-update: ' + (isUpdateableElectronVersion ? 'Packaged apps with large ZIM archives are not currently'
              : 'Versions for Windows 7+ 32bit cannot be') + ' auto-updated.');
        }
    }
    // GitHub updates
    console.log('Checking for updates from Releases...');
    updater.getLatestUpdates(function (tag, url, releases) {
        var updateSpan = document.getElementById('updateStatus');
        if (!tag) {
            var upToDate = '[&nbsp;<b><i>Latest&nbsp;version</i></b>&nbsp;]';
            updateCheck.style.display = 'inline';
            updateCheck.innerHTML = upToDate;
            updateSpan.innerHTML = upToDate;
            console.log('No new update was found.');
            return;
        }
        console.log('We found this update: [' + tag + '] ' + url, releases);
        updateSpan.innerHTML = '[ <b><i><a href="#alertBoxPersistent">New update!</a></i></b> ]';
        params.upgradeNeeded = true;
        uiUtil.showUpgradeReady(tag.replace(/^v/, ''), 'download', url);
    });
}

// Do update checks 10s after startup
setTimeout(function () {
    if (/PWA/.test(params.appType)) {
        console.log('Internally checking for updates to the PWA...');
        checkPWAUpdate();
    }
    // Delay GitHub checks so that any needed PWA update can be notified first
    setTimeout(checkUpdateServer, 2000);
}, 8000);

function setActiveBtn (activeBtn) {
    document.getElementById('btnHome').classList.remove('active');
    document.getElementById('btnRandomArticle').classList.remove('active');
    document.getElementById('btnConfigure').classList.remove('active');
    document.getElementById('btnAbout').classList.remove('active');
    if (activeBtn) {
        var activeID = document.getElementById(activeBtn);
        if (activeID) activeID.classList.add('active');
    }
}

document.getElementById('btnConfigure').addEventListener('click', function () {
    var config = document.getElementById('configuration');
    // If Configuration is already displayed, we are "unclicking" the button...
    if (config.style.display !== 'none') {
        setTab();
        if (params.themeChanged) {
            params.themeChanged = false;
            var archiveName = appstate.selectedArchive ? appstate.selectedArchive.file.name : null;
            if (archiveName && ~params.lastPageVisit.indexOf(archiveName)) {
                goToArticle(params.lastPageVisit.replace(/@kiwixKey@.+$/, ''));
            }
        }
    } else {
        document.querySelectorAll('.alert').forEach(function (el) {
            el.style.display = 'none';
        });
        // Highlight the selected section in the navbar
        setTab('btnConfigure');
        // Hide footer toolbar
        document.getElementById('footer').style.display = 'none';
        // Show the selected content in the page
        document.getElementById('configuration').style.display = '';
        document.getElementById('articleContent').style.display = 'none';
        document.getElementById('downloadLinks').style.display = 'none';
        document.getElementById('serverResponse').style.display = 'none';
        document.getElementById('myModal').style.display = 'none';
        refreshAPIStatus();
        // Re-enable top-level scrolling
        scrollbox.style.height = window.innerHeight - document.getElementById('top').getBoundingClientRect().height + 'px';
        document.getElementById('search-article').style.overflowY = 'auto';
        // If user hadn't previously picked a folder or a file, resort to the local storage folder (UWP functionality)
        if (params.localStorage && !params.pickedFolder && !params.pickedFile) {
            params.pickedFolder = params.localStorage;
        }
        // If user had previously picked a file using Native FS, offer to re-open
        if ((typeof window.showOpenFilePicker === 'function' || params.useOPFS) && !(params.pickedFile || params.pickedFolder)) {
            getNativeFSHandle();
        }
    }
});

function getNativeFSHandle (callback) {
    if (params.useOPFS && navigator && navigator.storage && 'getDirectory' in navigator.storage) {
        // We should be able to get the folder from the OPFS entry
        console.debug('Getting the OPFS directory entry');
        return navigator.storage.getDirectory().then(function (handle) {
            if (callback) callback(handle);
            else return processNativeDirHandle(handle);
        }).catch(function (err) {
            console.warn('Unable to get the OPFS directory entry: ' + err);
            if (callback) callback(null);
        });
    }
    console.debug('Getting the last serialized file or folder entry');
    cache.idxDB('pickedFSHandle', function (val) {
        if (val) {
            var handle = val;
            return cache.verifyPermission(handle, false).then(function (accessible) {
                if (accessible) {
                    openCurrentArchive.style.display = 'none';
                    if (callback) {
                        callback(handle);
                        return;
                    }
                    if (handle.kind === 'file') {
                        return processNativeFileHandle(handle);
                    } else if (handle.kind === 'directory') {
                        return processNativeDirHandle(handle);
                    }
                } else {
                    openCurrentArchive.style.display = 'inline';
                    if (callback) {
                        callback(handle);
                    } else {
                        searchForArchivesInPreferencesOrStorage();
                    }
                }
            }).catch(function (err) {
                uiUtil.systemAlert('We could not verify permission for the requested file handle. Please try picking your archive again.', 'Verification failure!');
                console.error(err);
            });
        } else {
            console.warn('No file or folder handle was previously stored in indexedDB');
            if (callback) {
                callback(val);
            } else if (window.fs) {
                // We have failed to load a picked archive via the File System API, but if params.storedFilePath exists, then the archive
                // was launched with Electron APIs, so we can get the folder that way
                if (params.storedFile && params.storedFilePath) params.pickedFolder = params.pickedFolder = params.storedFilePath.replace(/[^\\/]+$/, '');
                scanNodeFolderforArchives(params.pickedFolder, function () {
                    // We now have the list of archives in the dropdown, so we try to select the storedFile
                    setLocalArchiveFromArchiveList(params.storedFile);
                });
            } else {
                console.warn('Unable to get a file or folder handle from indexedDB');
                // Go to Configuration if it is not already open
                setTimeout(function () {
                    if (document.getElementById('configuration').style.display === 'none') document.getElementById('btnConfigure').click();
                }, 250);
            }
        }
    });
}

document.getElementById('btnAbout').addEventListener('click', function () {
    var btnAboutElement = document.getElementById('btnAbout');
    // Don't allow this button to be clicked if button is being used as exit fullscreen button
    if (/glyphicon-(fullscreen|resize-small)/.test(btnAboutElement.innerHTML)) return;
    // Deal with use of button for printing
    if (/glyphicon-print/.test(btnAboutElement.innerHTML)) {
        printIntercept();
        return;
    }
    // Check if we're 'unclicking' the button
    var searchDiv = document.getElementById('about');
    if (searchDiv.style.display !== 'none') {
        setTab();
        return;
    }
    // Highlight the selected section in the navbar
    setTab('btnAbout');
    // Hide footer toolbar
    document.getElementById('footer').style.display = 'none';
    // Show the selected content in the page
    document.getElementById('about').style.display = '';
    document.getElementById('articleContent').style.display = 'none';
    document.querySelectorAll('.alert').forEach(function (el) {
        el.style.display = 'none';
    });
    // Re-enable top-level scrolling
    scrollbox.style.height = window.innerHeight - document.getElementById('top').getBoundingClientRect().height + 'px';
    document.getElementById('search-article').style.overflowY = 'auto';
});
var selectFired = false;
var archiveList = document.getElementById('archiveList');
archiveList.addEventListener('keydown', function (e) {
    e.preventDefault();
    if (/^Enter$/.test(e.key)) {
        selectArchive(e);
    } else if (/^ArrowDown$/.test(e.key)) {
        if (archiveList.selectedIndex === archiveList.length - 1) archiveList.selectedIndex = 0;
        else archiveList.selectedIndex++;
    } else if (/^ArrowUp$/.test(e.key)) {
        if (archiveList.selectedIndex === 0) archiveList.selectedIndex = archiveList.length - 1;
        else archiveList.selectedIndex--;
    }
});
archiveList.addEventListener('change', selectArchive);
archiveList.addEventListener('click', function (e) {
    // Esnsure the clicked item is selected in the dropdown
    if (e.target.value) archiveList.value = e.target.value;
    // Only accept the click if there is one archive in the list
    if (archiveList.length === 1) selectArchive(e);
});
archiveList.addEventListener('mousedown', function () {
    // Unselect any selected option so that the user can select the same option again
    if (archiveList.length > 1 && ~archiveList.selectedIndex) archiveList.selectedIndex = -1;
});
currentArchiveLink.addEventListener('click', function (e) {
    e.target.value = archiveList.value = currentArchiveLink.dataset.archive;
    selectArchive(e);
});
openCurrentArchive.addEventListener('click', function (e) {
    e.target.value = archiveList.value = currentArchiveLink.dataset.archive;
    selectArchive(e);
});

function selectArchive (list) {
    if (selectFired) return;
    // If nothing was selected, user will have to click again
    if (!list.target.value) return;
    selectFired = true;
    var selected = list.target.value;
    // Void any previous picked file to prevent it launching
    params.storedFile = selected;
    if (params.pickedFile && params.pickedFile.name !== selected) {
        params.pickedFile = '';
    }
    if (params.useOPFS && params.deleteOPFSEntry) {
        // User requested deletion of an OPFS entry, seek confirmation first
        var message = 'Are you sure you want to delete the OPFS entry for ' + selected;
        if (/\.zimaa$/i.test(selected)) message += ' <b>and all its parts</b>';
        message += '?';
        return uiUtil.systemAlert(message, 'Delete OPFS entries', true, null, 'Delete ZIM')
            .then(function (confirmed) {
            if (confirmed) {
                cache.deleteOPFSEntry(selected).then(function () {
                    settingsStore.removeItem('lastSelectedArchive');
                    params.rescan = true;
                    processNativeDirHandle(params.pickedFolder);
                });
            }
            document.getElementById('btnDeleteOPFSEntry').click();
            selectFired = false;
        });
    }
    if (params.useOPFS && params.exportOPFSEntry) {
        // User requested export of an OPFS entry
        // First check that user is not trying to export a split ZIM archive (which is impossible)
        if (/\.zimaa$/i.test(selected)) {
            selectFired = false;
            return uiUtil.systemAlert('It is unfortunately not possible to export all the parts of a split ZIM archive using this app. ' +
                'For split ZIMs, you are limited to opening or deleting the archive (and its parts).');
        }
        // Show the spinner while the OPFS entry is exported
        uiUtil.pollSpinner('Exporting OPFS entry...', true);
        document.getElementById('btnExportOPFSEntry').click();
        return cache.exportOPFSEntry(selected).then(function (exported) {
            uiUtil.clearSpinner();
            selectFired = false;
            if (exported) {
                uiUtil.systemAlert('The OPFS entry for ' + selected + ' was successfully exported to the selected folder.');
            } else {
                uiUtil.systemAlert('The OPFS entry for ' + selected + ' could not be exported.');
            }
        });
    }
    // Show the spinner because on some sytems loading the archive is slow
    uiUtil.pollSpinner('Loading archive...', 9000);
    var resetUI = function () {
        document.getElementById('openLocalFiles').style.display = 'none';
        document.getElementById('rescanStorage').style.display = 'block';
        document.getElementById('usage').style.display = 'none';
        selectFired = false;
    };
    // We need to handle the case where the user dragged and dropped multiple files into the app
    if (archiveFilesLegacy.files.length > 0) {
        // Let's see if the selected file is available in the legacy archive file list
        var fileFound = false;
        for (var i = 0; i < archiveFilesLegacy.files.length; i++) {
            if (archiveFilesLegacy.files[i].name === selected) {
                fileFound = true;
                break;
            }
        }
        if (fileFound) {
            params.pickedFile = archiveFilesLegacy.files[i];
            setTimeout(resetUI, 100);
            return setLocalArchiveFromFileList([params.pickedFile], true);
        }
    }
    if (window.showOpenFilePicker || params.useOPFS) {
        return getNativeFSHandle(function (handle) {
            resetUI();
            if (!handle) {
                if (window.fs && params.storedFilePath) {
                    // Fall back to using the Electron APIs
                    params.pickedFolder = params.storedFilePath.replace(/[^\\/]+$/, '');
                    return setLocalArchiveFromArchiveList(selected);
                }
                console.error('No handle was retrieved');
                document.getElementById('openLocalFiles').style.display = 'block';
                document.getElementById('rescanStorage').style.display = 'none';
                return uiUtil.systemAlert('We could not get a handle to the previously picked file or folder!<br>' +
                    'This is probably because the contents of the folder have changed. Please try picking it again.');
            }
            if (handle.kind === 'directory') {
                params.pickedFolder = handle;
                return setLocalArchiveFromArchiveList(params.storedFile);
            } else if (handle.kind === 'file') {
                return handle.getFile().then(function (file) {
                    params.pickedFile = file;
                    params.pickedFile.handle = handle;
                    return setLocalArchiveFromArchiveList(selected);
                }).catch(function (err) {
                    console.error('Unable to read previously picked file!', err);
                    uiUtil.systemAlert('We could not retrieve the previously picked file or folder!<br>Please try picking it again.');
                    document.getElementById('openLocalFiles').style.display = 'block';
                    document.getElementById('rescanStorage').style.display = 'none';
                });
            }
        });
    } else if (typeof MSApp === 'undefined' && !window.fs && params.webkitdirectory) {
        // If we don't have any picked files or directories...
        if (!archiveDirLegacy.files.length && !archiveFilesLegacy.files.length) {
            appstate.waitForFileSelect = selected;
            // No files are set, so we need to ask user to select the file or directory again
            if (params.pickedFolder || document.getElementById('archiveList').options.length > 1) {
                archiveDirLegacy.click();
            } else {
                archiveFilesLegacy.click();
            }
        } else {
            console.debug('Files are set, attempting to select ' + selected);
            params.pickedFile = selected;
            if (archiveDirLegacy.files.length) {
                params.pickedFolder = archiveDirLegacy.files[0].webkitRelativePath.replace(/\/[^/]*$/, '');
                params.pickedFile = '';
            }
            setLocalArchiveFromArchiveList(selected);
        }
    } else {
        setLocalArchiveFromArchiveList(selected);
    }
    setTimeout(resetUI, 0);
}

// Legacy file picker is used as a fallback when all other pickers are unavailable
archiveFilesLegacy.addEventListener('change', function (files) {
    var filesArray = Array.from(files.target.files);
    // Construct a list of filenames joined with <li> tags
    var filenamesList = '';
    var filesSize = 0;
    filesArray.forEach(function (file) {
        filesSize += file.size;
        filenamesList += '<li>' + file.name + '</li>';
    });
    if (params.useOPFS) {
        // Abort if user didn't select any files
        if (filesArray.length === 0) return;
        // Check the size of the files does not exceed the quota
        if (filesSize > appstate.OPFSQuota) {
            return uiUtil.systemAlert('<p>The total size of the selected files is <b>' + (filesSize / 1024 / 1024 / 1024).toFixed(2) +
            ' GB</b>, which<br />exceeds the estimated OPFS quota of <b>' + (appstate.OPFSQuota / 1024 / 1024 / 1024).toFixed(2) + ' GB</b>!',
            'OPFS Quota Exceeded', null, null, null, 'Cancel');
        }
        return uiUtil.systemAlert('<p>Do you want to add these files to the Private File System?<p><ul>' + filenamesList + '</ul>',
        'Add to OPFS', true, null, 'Add to OPFS').then(function (confirmed) {
            if (!confirmed) return;
            // User has chosen a file or files to store in the Origin Private File System
            // This operation can take a long time, so show opsPanel
            uiUtil.pollOpsPanel('<span class="glyphicon glyphicon-refresh spinning"></span>&emsp;<b>Please wait:</b> Importing files to OPFS...', true);
            return cache.importOPFSEntries(filesArray).then(function () {
                uiUtil.systemAlert('<p>The selected files were successfully added to the OPFS!</p><p><b>We will now reload the app, so that the file(s) can be accessed at full speed.</b></p>')
                .then(function () {
                    // Set the app to load this file on startup
                    settingsStore.setItem('lastSelectedArchive', filesArray[0].name, Infinity);
                    window.location.reload();
                });
                uiUtil.pollOpsPanel();
                processNativeDirHandle(params.pickedFolder);
                cache.populateOPFSStorageQuota();
            }).catch(function (err) {
                console.error('Unable to import files to OPFS!', err);
                var message = '<p>We could not import the selected files to the OPFS!</p><p>Reason: ' + err.message + '</p>';
                if (/iOS/.test(params.appType) || /^((?!chrome|android).)*safari/i.test(navigator.userAgent)) message = '<p>Unfortunately, Safari and iOS browsers do not currently support importing files into the OPFS. Please disable the OPFS and use other file selection options.</p><p>Error message: ' + err.message + '</p>';
                uiUtil.pollOpsPanel();
                uiUtil.systemAlert(message, 'OPFS import error').then(function () {
                    // Delete each of the files that failed to import
                    filesArray.forEach(function (file) {
                        cache.deleteOPFSEntry(file.name);
                    });
                });
            });
        });
    }
    uiUtil.pollSpinner('Loading archive...', 9000);
    params.pickedFolder = null;
    params.pickedFile = null;
    if (params.storedFile === params.packagedFile) {
        params.storedFile = null;
        params.storedFilePath = null;
    }
    if (filesArray.length === 1) {
        params.pickedFile = filesArray[0];
        params.storedFile = params.pickedFile.name.replace(/\.zim\w\w$/i, '.zimaa');
    }
    if (params.webkitdirectory) {
        settingsStore.setItem('pickedFolder', '', Infinity);
        processFilesArray(filesArray);
    }
    var selected = params.storedFile;
    if (appstate.waitForFileSelect) {
        selected = appstate.waitForFileSelect;
        appstate.waitForFileSelect = null;
        // Select the selected file in the dropdown list of archives
        document.getElementById('archiveList').value = selected;
        console.debug('Files are set, attempting to select ' + selected);
    }
    if (!window.fs && (params.webkitdirectory || params.useOPFS)) {
        // populateDropDownListOfArchives([params.pickedFile], true);
        setLocalArchiveFromArchiveList(selected);
    } else {
        setLocalArchiveFromFileList(files.target.files);
    }
});
// But in preference, use UWP, File System Access API
document.getElementById('archiveFile').addEventListener('click', function () {
    if (typeof Windows !== 'undefined' && typeof Windows.Storage !== 'undefined') {
        // UWP FilePicker
        pickFileUWP();
    } else if (typeof window.showOpenFilePicker === 'function' || params.useOPFS) {
        if (params.useOPFS) {
            // We need to pick a file and store it in the OPFS, so we use the legacy picker
            archiveFilesLegacy.click();
        } else {
            // File System Access API file picker
            pickFileNativeFS();
        }
    } else if (window.fs && window.dialog) {
        // Electron file picker if showOpenFilePicker is not available
        dialog.openFile();
    } else {
        // Legacy file picker
        archiveFilesLegacy.click();
    }
});
// Legacy webkitdirectory file picker is used as a fallback when File System Access API is unavailable
archiveDirLegacy.addEventListener('change', function (files) {
    if (files.target.files.length) {
        var filesArray = Array.from(files.target.files);
        // Supports reading in NWJS/Electron frameworks that have a path property on the File object
        var path = filesArray[0] ? filesArray[0].path ? filesArray[0].path : filesArray[0].webkitRelativePath : '';
        params.pickedFile = null;
        var oldDir = params.pickedFolder;
        params.pickedFolder = path.replace(/[^\\/]*$/, '');
        // If we're picking a different directroy, don't look for the previously picked file in it
        if (params.pickedFolder !== oldDir) {
            params.storedFile = null;
            params.storedFilePath = null;
        }
        settingsStore.setItem('pickedFolder', params.pickedFolder, Infinity);
        if (document.getElementById('archiveList').options.length === 0) {
            params.storedFile = null;
        }
        processFilesArray(filesArray);
        var selected = '';
        if (appstate.waitForFileSelect) {
            selected = appstate.waitForFileSelect;
            appstate.waitForFileSelect = null;
            // Select the selected file in the dropdown list of archives
            document.getElementById('archiveList').value = selected;
            console.debug('Files are set, attempting to select ' + selected);
        }
        if (selected) setLocalArchiveFromArchiveList(selected);
    } else {
        appstate.waitForFileSelect = null;
        console.log('User cancelled directory picker, or chose a directory with no files');
    }
});
document.getElementById('archiveFiles').addEventListener('click', function (e) {
    if (typeof Windows !== 'undefined' && typeof Windows.Storage !== 'undefined') {
        // UWP FolderPicker
        pickFolderUWP();
    } else if (typeof window.showOpenFilePicker === 'function') {
        // Native File System API folder picker
        pickFolderNativeFS();
    } else if (window.fs && window.dialog) {
        // Electron fallback
        dialog.openDirectory();
    } else if (params.webkitdirectory) {
        // Legacy webkitdirectory file picker
        archiveDirLegacy.click();
    }
});
document.getElementById('useOPFSCheck').addEventListener('change', function (e) {
    var checkStorageType = function () {
        // Requesting persistent storage (but we'll proceed anyway if the OPFS is available, even if persistence is not granted)
        if (e.target.checked) {
            return cache.requestPersistentStorage();
        } else {
            return Promise.resolve(false);
        }
    };
    if (e.target.checked && /Electron/i.test(params.appType)) {
        checkStorageType = function () {
            return uiUtil.systemAlert('<p>There is no advantage to using the Origin Private File System for Electron or NWJS apps.</p><p>Do you still want to use it?</p>',
            'Use OPFS?', true, null, 'Use OPFS');
        };
    }
    return checkStorageType().then(function (confirmed) {
        if (confirmed) {
            params.useOPFS = e.target.checked;
            setOPFSUI();
            if (params.useOPFS) {
                params.storedFile = null;
                params.storedFilePath = null;
                params.pickedFile = null;
                params.pickedFolder = null;
                settingsStore.removeItem('lastSelectedArchive');
                params.rescan = true;
                loadOPFSDirectory();
            } else {
                populateDropDownListOfArchives([], true);
            }
        } else {
            e.target.checked = false;
            params.useOPFS = false;
            settingsStore.setItem('useOPFS', false, Infinity);
            setOPFSUI();
        }
    });
});
function loadOPFSDirectory () {
    if (navigator && navigator.storage && ('getDirectory' in navigator.storage)) {
        console.debug('Loading the OPFS directory');
        return navigator.storage.getDirectory().then(function (dir) {
            params.pickedFolder = dir;
            processNativeDirHandle(dir);
            setOPFSUI();
        }).catch(function (err) {
            console.error('Unable to get Origin Private File System!', err);
            uiUtil.systemAlert('<p>We could not access the Origin Private File System!</p><p>Please try picking a folder instead.</p><p>Reported error: ' + err + '</p>');
            params.useOPFS = false;
            setOPFSUI();
        });
    } else {
        params.useOPFS = false;
        settingsStore.setItem('useOPFS', false, Infinity);
        setOPFSUI();
        return uiUtil.systemAlert('<p>Your browser does not support the Origin Private File System!</p><p>Please try picking a folder instead.</p>');
    }
}
function setOPFSUI () {
    var useOPFS = document.getElementById('useOPFSCheck');
    var archiveFile = document.getElementById('archiveFile');
    var archiveFileCol = document.getElementById('archiveFileCol');
    var archiveFileLabel = document.getElementById('archiveFileLabel');
    var archiveFiles = document.getElementById('archiveFiles');
    var archiveFilesCol = document.getElementById('archiveFilesCol');
    var archiveFilesLabel = document.getElementById('archiveFilesLabel');
    var btnDeleteOPFSEntry = document.getElementById('btnDeleteOPFSEntry');
    var btnExportOPFSEntry = document.getElementById('btnExportOPFSEntry');
    var OPFSQuota = document.getElementById('OPFSQuota');
    var determinedTheme = params.cssUITheme == 'auto' ? cssUIThemeGetOrSet('auto', true) : params.cssUITheme;
    if (params.useOPFS) {
        settingsStore.setItem('useOPFS', true, Infinity);
        useOPFS.checked = true;
        archiveFiles.style.display = 'none';
        archiveFilesLabel.style.display = 'none';
        archiveFileLabel.classList.remove('col-xs-6');
        archiveFileLabel.classList.add('col-xs-12');
        archiveFileLabel.innerHTML = '<p><b>Select file(s) to add to OPFS</b>:</p>'
        archiveFile.value = 'Add file(s)';
        archiveFile.title = 'Select a single file or multiple files to add to the Origin Private File System. In total, they must not exceed the estimated quota displayed in the OPFS quota panel.';
        archiveFileCol.classList.remove('col-xs-6');
        archiveFileCol.classList.add('col-xs-5');
        archiveFilesCol.classList.remove('col-xs-6');
        archiveFilesCol.classList.add('col-xs-7');
        archiveList.style.background = determinedTheme === 'dark' ? 'darkslategray' : 'lightcyan';
        OPFSQuota.style.display = '';
        btnDeleteOPFSEntry.style.display = '';
        if ('showOpenFilePicker' in window) btnExportOPFSEntry.style.display = '';
        cache.populateOPFSStorageQuota();
    } else {
        useOPFS.checked = false;
        archiveFileCol.classList.remove('col-xs-5');
        archiveFileCol.classList.add('col-xs-6');
        archiveFilesCol.classList.remove('col-xs-7');
        archiveFilesCol.classList.add('col-xs-6');
        archiveList.style.background = '';
        if (typeof Windows === 'undefined' && typeof window.showOpenFilePicker !== 'function' && !window.dialog && !params.webkitdirectory) {
            archiveFileLabel.innerHTML = '<p><b>Pick ZIM archive(s)</b>:</p>';
            archiveFileLabel.classList.remove('col-xs-6');
            archiveFileLabel.classList.add('col-xs-12');
            archiveFile.title = 'Select one or more files you wish to access during this session from your device\'s storage. You may load as many files as you wish, and they will be added to the selection list above.';
            archiveFile.value = 'Select file(s)';
        } else {
            archiveFiles.style.display = '';
            archiveFilesLabel.style.display = '';
            archiveFileLabel.innerHTML = '<p><b>Pick a single unsplit archive</b>:</p>';
            archiveFileLabel.classList.remove('col-xs-12');
            archiveFileLabel.classList.add('col-xs-6');
            archiveFile.title = 'Select a single file from your device\'s storage. For split or multiple files, place the files in a directory and use the "Select folder" button instead.'
            archiveFile.value = 'Select file';
        }
        OPFSQuota.style.display = 'none';
        btnDeleteOPFSEntry.style.display = 'none';
        btnExportOPFSEntry.style.display = 'none';
    }
}

// Set the OPFS UI on app launch
setOPFSUI();

document.getElementById('btnExportOPFSEntry').addEventListener('click', function () {
    params.exportOPFSEntry = !params.exportOPFSEntry;
    var determinedTheme = params.cssUITheme == 'auto' ? cssUIThemeGetOrSet('auto', true) : params.cssUITheme;
    if (params.exportOPFSEntry) {
        params.deleteOPFSEntry = false;
        archiveList.style.background = determinedTheme === 'dark' ? 'darkgoldenrod' : 'yellow';
    } else {
        setOPFSUI();
    }
    // Synchronize the OPFS file list
    if (params.pickedFolder && params.pickedFolder.kind === 'directory') {
        params.rescan = true;
        processNativeDirHandle(params.pickedFolder);
    }
});
document.getElementById('btnDeleteOPFSEntry').addEventListener('click', function () {
    params.deleteOPFSEntry = !params.deleteOPFSEntry;
    var determinedTheme = params.cssUITheme == 'auto' ? cssUIThemeGetOrSet('auto', true) : params.cssUITheme;
    if (params.deleteOPFSEntry) {
        params.exportOPFSEntry = false;
        archiveList.style.background = determinedTheme === 'dark' ? 'firebrick' : 'pink';
    } else {
        setOPFSUI();
    }
    // Synchronize the OPFS file list
    if (params.pickedFolder && params.pickedFolder.kind === 'directory') {
        params.rescan = true;
        processNativeDirHandle(params.pickedFolder);
    }
});
document.getElementById('btnRefresh').addEventListener('click', function () {
    // Refresh list of archives
    params.rescan = true;
    var btnArchiveFiles = document.getElementById('archiveFiles');
    var btnArchiveFile = document.getElementById('archiveFile');
    // Deselect any selected archive in the archiveList
    archiveList.selectedIndex = -1;
    if (!params.storedFile && !params.pickedFolder) {
        if (params.useOPFS || window.showOpenFilePicker) {
            getNativeFSHandle(function (fsHandle) {
                if (fsHandle && fsHandle.kind === 'directory') {
                    if (params.useOPFS) params.rescan = false;
                    processNativeDirHandle(fsHandle);
                    if (params.useOPFS) cache.populateOPFSStorageQuota();
                } else {
                    btnArchiveFiles.click();
                }
            });
        } else {
            uiUtil.systemAlert('You need to pick a file or folder before you can rescan it!');
        }
    } else if (params.storedFile && !params.pickedFolder) {
        console.debug('Could not automatically reload ' + params.pickedFile);
        if (!~params.storedFile.indexOf(params.packagedFile)) {
            if (archiveList.length > 1 && (params.webkitdirectory || 'showDirectoryPicker' in window)) {
                btnArchiveFiles.click();
            } else {
                btnArchiveFile.click();
            }
        } else uiUtil.systemAlert('You need to pick a file or folder before you can rescan it!');
    } else if (window.showOpenFilePicker || params.useOPFS) {
        processNativeDirHandle(params.pickedFolder);
        if (params.useOPFS) cache.populateOPFSStorageQuota();
    } else if (typeof Windows !== 'undefined') {
        scanUWPFolderforArchives(params.pickedFolder)
    } else if (window.fs) {
        scanNodeFolderforArchives(params.pickedFolder);
    } else if (params.webkitdirectory) {
        document.getElementById('archiveFiles').click();
    }
});
document.getElementById('downloadTrigger').addEventListener('click', function () {
    kiwixServe.requestXhttpData(params.kiwixDownloadLink);
});
document.querySelectorAll('input[name="contentInjectionMode"][type="radio"]').forEach(function (element) {
    element.addEventListener('change', function () {
        if (this.value === 'jquery' && !params.appCache) {
            uiUtil.systemAlert('You must deselect the "Bypass AppCache" option before switching to Restricted mode!');
            this.checked = false;
            document.getElementById('serviceworkerModeRadio').checked = true;
            return;
        }
        var returnDivs = document.getElementsByClassName('returntoArticle');
        for (var i = 0; i < returnDivs.length; i++) {
            returnDivs[i].innerHTML = '';
        }
        // Do the necessary to enable or disable the Service Worker
        setContentInjectionMode(this.value);

        /** DEV: PLEASE NOTE THAT "jQuery mode" HAS NOW CHANGED to "Restricted mode", but we still use "jquery" in code */

        // Actions that must be completed after switch to Restricted mode
        if (this.value === 'jquery') {
            // Hide the source verification option
            document.getElementById('enableSourceVerificationCheck').style.display = 'none';
            // If we're in a PWA UWP app, warn the user that this does not disable the PWA
            if (/^http/i.test(window.location.protocol) && /UWP\|PWA/.test(params.appType) &&
                params.allowInternetAccess === 'true') {
                uiUtil.systemAlert(
                    '<p>Please note that switching content injection mode does not revert to local code.</p>' +
                    '<p>If you wish to exit the PWA, you will need to turn off "Allow Internet access?" above.</p>'
                );
            }
        }
        if (this.value === 'serviceworker' && window.location.protocol !== 'ms-appx-web:') {
            document.getElementById('enableSourceVerificationCheck').style.display = '';
            if (params.sourceVerification && appstate.selectedArchive.isReady() && appstate.selectedArchive.file._files[0].name !== params.packagedFile &&
              !settingsStore.getItem('trustedZimFiles').includes(appstate.selectedArchive.file.name)) {
                verifyLoadedArchive(appstate.selectedArchive);
            }
            if (params.manipulateImages || params.allowHTMLExtraction) {
                if (!appstate.wikimediaZimLoaded) {
                    var message = 'Please note that we are disabling "Image manipulation" and/or "Download or open current article" features, as these options ' +
                    'can interfere with ZIMs that have active content. You may turn them back on, but be aware that they are only ' +
                    'recommended for use with Wikimedia ZIMs.';
                    uiUtil.systemAlert(message);
                    if (params.manipulateImages) document.getElementById('manipulateImagesCheck').click();
                    if (params.allowHTMLExtraction) document.getElementById('allowHTMLExtractionCheck').click();
                }
            }
        }
        params.themeChanged = true; // This will reload the page
    });
});
document.getElementById('allowInternetAccessCheck').addEventListener('change', function () {
    document.getElementById('serverResponse').style.display = 'none';
    params.allowInternetAccess = this.checked;
    if (!this.checked) {
        document.getElementById('downloadLinks').style.display = 'none';
        if (/^http/i.test(window.location.protocol)) {
            var message;
            if (!/PWA/.test(params.appType)) {
                message = '<p>You are accessing Kiwix JS from a remote server, and it is not possible to disable Internet access fully without exiting the app.</p>' +
                    '<p>Please visit <a href="https://kiwix.github.io/kiwix-js-pwa/app" target="_blank">Kiwix JS UWP/Electron/NWJS</a> to find an app version that will run fully offline.</p>';
                uiUtil.systemAlert(message);
                this.checked = true;
                params.allowInternetAccess = true;
                return;
            } else if (!/UWP/.test(params.appType)) {
                uiUtil.systemAlert("This PWA can run offline, but to be absolutely sure that it won't contact the server to update itself, you should shut " +
                    'off the Internet connection on your computer. By design, the PWA spec allows an offline app to check whether the Service Worker ' +
                    'code has changed, and this app cannot override that completely.');
            } else {
                message = '<p>This will switch to using locally packaged code only. Configuration settings may be lost.</p>' +
                    '<p><b>WARNING:</b> App will re-load in Restricted mode!</p>';
                var that = this;
                var launchLocal = function () {
                    settingsStore.setItem('allowInternetAccess', false, Infinity);
                    var uriParams = '?allowInternetAccess=false&contentInjectionMode=jquery';
                    // Commented line below causes crash when there are too many archives
                    // uriParams += '&listOfArchives=' + encodeURIComponent(settingsStore.getItem('listOfArchives'));
                    uriParams += '&lastSelectedArchive=' + encodeURIComponent(params.storedFile);
                    uriParams += '&lastPageVisit=' + encodeURIComponent(params.lastPageVisit);
                    // Void the PWA_launch signal so that user will be asked again next time
                    params.localUWPSettings.PWA_launch = '';
                    window.location.href = 'ms-appx-web:///www/index.html' + uriParams;
                    console.warn('Beam me down, Scotty!');
                };
                uiUtil.systemAlert(message, 'Information', true, 'Cancel', 'Reload app').then(function (response) {
                    if (response) {
                        launchLocal();
                    } else {
                        that.checked = true;
                        params.allowInternetAccess = true;
                        document.getElementById('btnConfigure').click();
                    }
                });
            }
        }
    } else {
        // We can check for updates if the user has allowed Internet access
        checkUpdateServer();
    }
    settingsStore.setItem('allowInternetAccess', params.allowInternetAccess, Infinity);
    library.style.borderColor = '';
    library.style.borderStyle = '';
});
document.getElementById('cssCacheModeCheck').addEventListener('change', function () {
    params.cssCache = this.checked;
    settingsStore.setItem('cssCache', params.cssCache, Infinity);
    params.themeChanged = true;
});
document.getElementById('navButtonsPosCheck').addEventListener('change', function (e) {
    params.navButtonsPos = e.target.checked ? 'top' : 'bottom';
    settingsStore.setItem('navButtonsPos', params.navButtonsPos, Infinity);
    uiUtil.systemAlert('This setting will be applied on next app launch');
});
document.getElementById('imageDisplayModeCheck').addEventListener('change', function (e) {
    if (!this.checked) {
        uiUtil.systemAlert('Please note that some images may still display if the ZIM type requires it (e.g. Zimit ZIMs, PhET, Gutenberg).');
    }
    params.imageDisplay = this.checked;
    params.imageDisplayMode = this.checked ? 'progressive' : 'manual';
    params.themeChanged = params.imageDisplay; // Only reload page if user asked for all images to be displayed
    settingsStore.setItem('imageDisplay', params.imageDisplay, Infinity);
});
document.getElementById('manipulateImagesCheck').addEventListener('click', function () {
    params.manipulateImages = this.checked;
    settingsStore.setItem('manipulateImages', params.manipulateImages, Infinity);
    if (this.checked && !params.displayHiddenBlockElements && !params.noWarning) {
        if (/UWP/.test(params.appType)) {
            uiUtil.systemAlert('<p><b>WORKAROUND FOR UWP APP:</b> To save an image to disk, please select the ' +
                '"Download or open current article" option below, load the article you require, and export it to a browser window by clicking the breakout icon.</p>' +
                '<p>You will then be able to right-click or long-press images in the exported page and save them.</p>');
        } else if (window.nw) {
            uiUtil.systemAlert('Unfortunately there is currently no way to save an image to disk in the NWJS version of this app.<br>You can do this in the PWA version: please visit https://pwa.kiwix.org.');
        } else if (params.contentInjectionMode === 'serviceworker' && appstate.selectedArchive &&
            !/wikipedia|wikivoyage|mdwiki|wiktionary/i.test(appstate.selectedArchive.file.name)) {
            uiUtil.systemAlert('Please be aware that Image manipulation can interfere with non-Wikimedia ZIMs (particularly ZIMs that have active content). If you cannot access the articles in such a ZIM, please turn this setting off.');
        } else if (/PWA/.test(params.appType) && params.contentInjectionMode === 'jquery') {
            uiUtil.systemAlert('Be aware that this option may interfere with active content if you switch to Service Worker mode.');
        }
    }
    params.themeChanged = true;
});
['btnReset', 'btnReset2'].forEach(function (id) {
    document.getElementById(id).addEventListener('click', function () {
        resetApp.reset();
    });
});
document.getElementById('btnRefreshApp').addEventListener('click', function () {
    window.location.reload();
});
document.getElementById('bypassAppCacheCheck').addEventListener('change', function () {
    if (params.contentInjectionMode !== 'serviceworker') {
        uiUtil.systemAlert('This setting can only be used in Service Worker mode!');
        this.checked = false;
    } else {
        params.appCache = !this.checked;
        settingsStore.setItem('appCache', params.appCache, Infinity);
        resetApp.reset('cacheAPI');
    }
    // This will also send any new values to Service Worker
    refreshCacheStatus();
});
if (window.electronAPI) {
    // DEV to find the callback for this call, search for electronAPI.on('get-store-value' above
    electronAPI.getStoreValue('expressPort');
    document.getElementById('expressPortInput').addEventListener('change', function (e) {
        // Ensure the port is a number and the value matches a permitted value
        var proposedPort = parseInt(e.target.value);
        if (proposedPort !== e.target.value && (proposedPort < 1024 || proposedPort > 65535)) {
            e.target.value = params.expressPort || 3000;
            setTimeout(function () {
                uiUtil.systemAlert('Please enter a valid port number between 1024 and 65535!');
            }, 250);
        } else {
            params.expressPort = proposedPort;
            electronAPI.setStoreValue('expressPort', params.expressPort);
            setTimeout(function () {
                uiUtil.systemAlert('Please note that the new port setting will only be applied after restarting the app.');
            }, 250);
        }
    });
    // Set the Zoom values for the window
    electronAPI.setZoomLimits(1, 3);
}
document.getElementById('disableDragAndDropCheck').addEventListener('change', function () {
    params.disableDragAndDrop = this.checked;
    settingsStore.setItem('disableDragAndDrop', params.disableDragAndDrop, Infinity);
    uiUtil.systemAlert('<p>We will now attempt to reload the app to apply the new setting.</p>' +
        '<p>(If you cancel, then the setting will only be applied when you next start the app.)</p>', 'Reload app', true).then(function (result) {
        if (result) {
            window.location.reload();
        }
    });
});
// Source verification is only makes sense in SW mode as doing the same in jQuery mode is redundant.
document.getElementById('enableSourceVerificationCheck').style.display = params.contentInjectionMode === ('serviceworker' || 'serviceworkerlocal') ? 'block' : 'none';
document.getElementById('enableSourceVerificationCheck').addEventListener('change', function () {
    params.sourceVerification = this.checked;
    settingsStore.setItem('sourceVerification', this.checked, Infinity);
});
document.getElementById('hideActiveContentWarningCheck').addEventListener('change', function () {
    params.hideActiveContentWarning = this.checked;
    settingsStore.setItem('hideActiveContentWarning', params.hideActiveContentWarning, Infinity);
    refreshCacheStatus();
});
document.getElementById('useLibzimReaderCheck').addEventListener('change', function (e) {
    if (params.debugLibzimASM === 'disable') {
        uiUtil.systemAlert('You cannot use the libzim reader if you have disabled it in the dropdown above!');
        this.checked = false;
        params.useLibzim = false;
    } else {
        params.useLibzim = e.target.checked;
    }
    settingsStore.setItem('useLibzim', params.useLibzim, Infinity);
    refreshAPIStatus();
});
document.getElementById('useLegacyZimitSupportCheck').addEventListener('change', function (e) {
    if (navigator.serviceWorker.controller) {
        params.useLegacyZimitSupport = e.target.checked;
        refreshAPIStatus();
        return uiUtil.systemAlert('<p>We need to reload the app to apply the new setting</p>', 'Reload app', true)
        .then(function (input) {
            if (input) {
                settingsStore.setItem('useLegacyZimitSupport', params.useLegacyZimitSupport, Infinity);
                console.log('Sending message to Service Worker to ' + (params.useLegacyZimitSupport ? 'deisable' : 'enable') + ' Zimit support...');
                navigator.serviceWorker.controller.postMessage({
                    action: params.useLegacyZimitSupport ? 'disableReplayWorker' : 'enableReplayWorker'
                });
                window.location.reload();
            } else {
                // Revert the checkbox
                e.target.checked = !e.target.checked;
                params.useLegacyZimitSupport = e.target.checked;
                refreshAPIStatus();
            }
        });
    }
});

// Function to restore the fullscreen/orientation lock state on user click in-app
// This is necessary because the browser will not restore the state without a user gesture
var refreshFullScreen = function (evt) {
    // console.debug('refreshFullScreen starting');
    // Don't react if user is selecting an archive or setting the lock orientation
    if (/archiveFilesLegacy|lockDisplayOrientationDrop/.test(evt.target.id)) return;
    // Don't react when picking archive or directory with the File System Access API (because entering fullscreen blocks the permissions prompt)
    if (evt.target.parentElement && evt.target.parentElement.id === 'archiveList' && window.showDirectoryPicker) return;
    if (params.lockDisplayOrientation && (evt.target.id === 'btnAbout' || /glyphicon-(resize-small|fullscreen)/.test(evt.target.className))) {
        if (uiUtil.appIsFullScreen()) {
            // Cancel fullscreen mode
            uiUtil.lockDisplayOrientation().then(function () {
                setDynamicIcons();
            });
            params.lockDisplayOrientation = '';
            settingsStore.setItem('lockDisplayOrientation', '', Infinity);
            document.getElementById('lockDisplayOrientationDrop').value = '';
        } else {
            // Enter fullscreen mode
            uiUtil.lockDisplayOrientation(params.lockDisplayOrientation).then(function () {
                setDynamicIcons();
                resizeIFrame();
            }).catch(function () {
                setDynamicIcons();
                resizeIFrame();
            });
        }
    } else {
        if (params.lockDisplayOrientation) uiUtil.lockDisplayOrientation(params.lockDisplayOrientation).catch(function () {});
    }
};
// Add event listener to the app UI
document.getElementById('search-article').addEventListener('mouseup', refreshFullScreen);
// Set the UI for the current fullscreen/orientation lock state
document.getElementById('lockDisplayOrientationDrop').value = params.lockDisplayOrientation || '';

document.getElementById('lockDisplayOrientationDrop').addEventListener('change', function (event) {
    var that = this;
    if (event.target.value) {
        return uiUtil.lockDisplayOrientation(event.target.value).then(function (rtn) {
            if (rtn === 'unsupported') {
                uiUtil.systemAlert('The Screen Orientation Lock API is not supported on this device!');
                that.value = params.lockDisplayOrientation || '';
            } else {
                params.lockDisplayOrientation = event.target.value || '';
                settingsStore.setItem('lockDisplayOrientation', params.lockDisplayOrientation, Infinity);
                if (rtn === 'click') {
                    uiUtil.systemAlert((!params.PWAInstalled && /iOS/.test(params.appType)
                        ? '<p>In Safari on iOS, consider adding this app to your homescreen (Share --&gt Add to Home), which will give a better experience than full-screen mode.</p>' : '') +
                         '<p>Please click the &nbsp;<span class="glyphicon glyphicon-fullscreen"></span>&nbsp; button top-right to enter full-screen mode.</p>'
                    );
                }
            }
            setDynamicIcons();
        }).catch(function (err) {
            // Note that in desktop contexts, the API might reject, but could still work
            if (err.name === 'NotSupportedError') {
                params.lockDisplayOrientation = event.target.value || '';
                settingsStore.setItem('lockDisplayOrientation', params.lockDisplayOrientation, Infinity);
                that.value = params.lockDisplayOrientation || '';
                if (params.lockDisplayOrientation) {
                    uiUtil.systemAlert('<p>The following error was received (this is expected on Desktop devices):</p>' +
                    '<blockquote><code>' + err.toString() + '</code></blockquote>' +
                    "<p>If screen lock doesn't work, please change setting back to 'Normal' or try a different option.</p>");
                }
            } else {
                uiUtil.systemAlert((!params.PWAInstalled && /iOS/.test(params.appType)
                ? '<p>In Safari on iOS, consider adding this app to your homescreen (Share --&gt Add to Home) isntead.</p>' : '') +
                 '<p>There was an error setting the requested screen state:</p><blockquote><code>' + err.toString() + '</code></blockquote>');
                that.value = params.lockDisplayOrientation || '';
            }
            setDynamicIcons();
        });
    } else {
        params.lockDisplayOrientation = '';
        settingsStore.setItem('lockDisplayOrientation', '', Infinity);
        uiUtil.lockDisplayOrientation().then(function () {
            setDynamicIcons();
        }).catch(function () {
            console.log('Error locking screen orientation');
        });
    }
});
document.getElementById('debugLibzimASMDrop').addEventListener('change', function (event) {
    var that = this;
    var message = '<p>App will reload to apply the new setting.</p>'
    if (event.target.value) {
        message += '<p><i>Please be aware that leaving this override setting on can have anomalous effects, ' +
        'e.g. the app will no longer check whether the OS supports full-text searching and searches may fail silently.</i></p>';
    }
    uiUtil.systemAlert(message,
        'Developer option!', true).then(function (confirm) {
        if (confirm) {
            params.debugLibzimASM = event.target.value || false;
            // If user disabled use of libzim for search, also turn off libzim for reading
            if (params.debugLibzimASM === 'disable' && params.useLibzim) {
                document.getElementById('useLibzimReaderCheck').click();
            }
            settingsStore.setItem('debugLibzimASM', params.debugLibzimASM, Infinity);
            window.location.reload();
        } else {
            that.value = params.debugLibzimASM || '';
        }
    });
});
document.getElementById('openExternalLinksInNewTabsCheck').addEventListener('change', function () {
    params.openExternalLinksInNewTabs = this.checked;
    settingsStore.setItem('openExternalLinksInNewTabs', params.openExternalLinksInNewTabs, Infinity);
    params.themeChanged = true;
});
document.getElementById('tabOpenerCheck').addEventListener('click', function () {
    params.windowOpener = this.checked ? 'tab' : false;
    if (!params.windowOpener && !params.noWarning) {
        uiUtil.systemAlert('Please note that due to the Content Secuirty Policy, external links and PDFs always open in a new tab or window, regardless of this setting.');
    }
    if (params.windowOpener && /UWP\|PWA/.test(params.appType) && params.contentInjectionMode === 'jquery') {
        if (!params.noWarning) {
            uiUtil.systemAlert('<p>In this UWP app, opening a new browsable window only works in Service Worker mode.</p>' +
            '<p>Your system appears to support SW mode, so please try switching to it in Expert Settings below.</p>' +
            '<p>If your system does not support SW mode, then use the more basic "Download or open current article" feature below.</p>');
        }
        params.windowOpener = false;
    } else if (params.windowOpener && /iOS|UWP$/.test(params.appType)) {
        if (!params.noWarning) {
            uiUtil.systemAlert('<p>This option is not currently supported ' + (/iOS/.test(params.appType)
            ? 'on iOS devices because programmatic opening of windows is forbidden. However, the native long-press feature may work.</p>'
            : 'in UWP apps that cannot use Service Worker mode.</p><p>Please try the more basic "Download or open current article" feature below instead.</p>'));
        }
        params.windowOpener = false;
    }
    settingsStore.setItem('windowOpener', params.windowOpener, Infinity);
    if (params.windowOpener && params.allowHTMLExtraction) {
        if (!params.noWarning) uiUtil.systemAlert('Enabling this option disables the more basic "Download or open current article" option below.');
        document.getElementById('allowHTMLExtractionCheck').click();
    }
    setWindowOpenerUI();
    params.themeChanged = true;
});
document.getElementById('winOpenerCheck').addEventListener('click', function () {
    var tabCheck = document.getElementById('tabOpenerCheck');
    params.windowOpener = this.checked ? 'window' : tabCheck.checked ? 'tab' : false;
    settingsStore.setItem('windowOpener', params.windowOpener, Infinity);
    setWindowOpenerUI();
});
document.getElementById('dblRightClickCheck').addEventListener('click', function () {
    var tabCheck = document.getElementById('tabOpenerCheck');
    params.rightClickType = this.checked ? 'double' : tabCheck.checked ? 'single' : false;
    settingsStore.setItem('rightClickType', params.rightClickType, Infinity);
    setWindowOpenerUI();
});
function setWindowOpenerUI () {
    var woHelp = document.getElementById('winOpenerHelp');
    var newWin = document.getElementById('openInNewWindow');
    var tabCheck = document.getElementById('tabOpenerCheck');
    var winCheck = document.getElementById('winOpenerCheck');
    var rtClickType = document.getElementById('dblRightClickCheck');
    if (params.rightClickType === 'double') rtClickType.checked = true;
    if (params.windowOpener === 'window') {
        newWin.style.display = 'block';
        woHelp.style.display = 'block';
        tabCheck.checked = true;
        winCheck.checked = true;
        woHelp.innerHTML = 'If blocked, allow popups permanently for this app and try again. May not work in mobile contexts.';
        if (params.rightClickType === 'double') woHelp.innerHTML += '<br />Single right-click will open context menu, double right-click will open new window.';
    } else if (params.windowOpener === 'tab') {
        tabCheck.checked = true;
        winCheck.checked = false;
        newWin.style.display = 'block';
        woHelp.style.display = 'block';
        woHelp.innerHTML = '';
        woHelp.innerHTML = 'In some cases a window may open regardless of this setting. May not work in mobile contexts.';
        if (params.rightClickType === 'double') woHelp.innerHTML += '<br />Single right-click will open context menu, double right-click will open new tab.';
    } else { // The options are turned off
        tabCheck.checked = false;
        winCheck.checked = false;
        rtClickType.checked = false;
        woHelp.style.display = 'none';
        newWin.style.display = 'none';
    }
}
document.getElementById('showPopoverPreviewsCheck').addEventListener('change', function (e) {
    params.showPopoverPreviews = e.target.checked;
    settingsStore.setItem('showPopoverPreviews', params.showPopoverPreviews, Infinity);
    params.themeChanged = true;
});
document.getElementById('allowHTMLExtractionCheck').addEventListener('click', function (e) {
    params.allowHTMLExtraction = e.target.checked;
    var alertMessage = '';
    if (params.allowHTMLExtraction) {
        if (params.windowOpener) alertMessage = '<p>Enabling this option disables the more advanced tab/window opening option above.</p>';
        if (/iOS/.test(params.appType)) {
            alertMessage = '<p><b>This option will only work if you turn off popup blocking in your iOS browser settings.</b><p>';
        }
        if (params.contentInjectionMode === 'serviceworker') {
            alertMessage = '<p>Please be aware that the "Download or open current article" functionality can interfere badly with non-Wikimedia ZIMs (particularly ZIMs that have active content). ' +
            'If you cannot access the articles in such a ZIM, please turn this setting off.</p>' + alertMessage;
        } else if (/PWA/.test(params.appType)) {
            alertMessage += '<p>Be aware that this option may interfere with active content if you switch to Service Worker mode.</p>';
        }
        uiUtil.systemAlert(alertMessage);
        params.windowOpener = false;
        settingsStore.setItem('windowOpener', params.windowOpener, Infinity);
        setWindowOpenerUI();
    }
    settingsStore.setItem('allowHTMLExtraction', params.allowHTMLExtraction, Infinity);
    params.themeChanged = true;
});
document.getElementById('alphaCharTxt').addEventListener('change', function () {
    params.alphaChar = this.value.length === 1 ? this.value : params.alphaChar;
    this.value = params.alphaChar;
    settingsStore.setItem('alphaChar', params.alphaChar, Infinity);
});
document.getElementById('omegaCharTxt').addEventListener('change', function () {
    params.omegaChar = this.value.length === 1 ? this.value : params.omegaChar;
    this.value = params.omegaChar;
    settingsStore.setItem('omegaChar', params.omegaChar, Infinity);
});
var titleSearchRangeVal = document.getElementById('titleSearchRangeVal');
document.getElementById('titleSearchRange').addEventListener('change', function (e) {
    settingsStore.setItem('maxSearchResultsSize', e.target.value, Infinity);
    params.maxSearchResultsSize = ~~e.target.value;
    titleSearchRangeVal.innerHTML = e.target.value;
});
document.getElementById('titleSearchRange').addEventListener('input', function (e) {
    titleSearchRangeVal.innerHTML = e.target.value;
});
document.getElementById('hideToolbarsCheck').addEventListener('click', function () {
    // This code implements a tri-state checkbox
    // DEV: You cannot use jQuery to add the click event listener above: it doesn't work properly!
    if (this.readOnly) this.checked = this.readOnly = false;
    else if (!this.checked) this.readOnly = this.indeterminate = true;
    // How to reverse the order of the checkbox
    // if (this.readOnly) { this.checked = true; this.readOnly = false; }
    // else if (this.checked) this.readOnly = this.indeterminate = true;
    params.hideToolbars = this.indeterminate ? 'top' : this.checked;
    document.getElementById('hideToolbarsState').innerHTML = params.hideToolbars === 'top' ? 'top only' : params.hideToolbars ? 'both' : 'never';
    settingsStore.setItem('hideToolbars', params.hideToolbars, Infinity);
    checkToolbar();
});
document.getElementById('interceptBeforeUnloadCheck').addEventListener('change', function () {
    params.interceptBeforeUnload = this.checked;
    settingsStore.setItem('interceptBeforeUnload', params.interceptBeforeUnload, Infinity);
});
Array.prototype.slice.call(document.querySelectorAll('.aboutLink')).forEach(function (link) {
    link.addEventListener('click', function () {
        document.getElementById('btnAbout').click();
    });
});

var iframe = document.getElementById('articleContent');
var iframeWindow = null;

function checkToolbar () {
    if (document.getElementById('row2').style.display === 'none') {
        // Check state of toolbar (this returns it to its original state if it was changed by find-in-article)
        params.hideToolbars = settingsStore.getItem('hideToolbars');
        params.hideToolbars = params.hideToolbars === null ? true : params.hideToolbars === 'true' ? true : params.hideToolbars === 'false' ? false : params.hideToolbars;
    }

    // Get the contentWindow of the iframe to operate on
    var replayIframe = iframe.contentWindow ? iframe.contentWindow.document ? iframe.contentWindow.document.getElementById('replay_iframe') : null : null;
    iframeWindow = replayIframe ? replayIframe.contentWindow : iframe.contentWindow;

    if (!iframeWindow) return;

    iframeWindow.removeEventListener('scroll', uiUtil.scroller);

    if (params.hideToolbars) {
        // We have to add this one this way, because another function is using the onscroll event
        iframeWindow.addEventListener('scroll', uiUtil.scroller);
        iframeWindow.ontouchstart = uiUtil.scroller;
        iframeWindow.ontouchend = uiUtil.scroller;
        iframeWindow.onwheel = uiUtil.scroller;
        iframeWindow.onkeydown = uiUtil.scroller;
    } else {
        iframeWindow.ontouchstart = null;
        iframeWindow.ontouchend = null;
        iframeWindow.onwheel = null;
        iframeWindow.onkeydown = null;
        uiUtil.showSlidingUIElements();
    }
}

// Set up hook into Windows ViewManagement uiSettings if needed
var uiSettings = null;
initializeUISettings();

function initializeUISettings () {
    var checkAuto = params.cssUITheme == 'auto' || params.cssTheme == 'auto';
    // Support for UWP
    if (checkAuto && typeof Windows !== 'undefined' && Windows.UI && Windows.UI.ViewManagement) {
        uiSettings = new Windows.UI.ViewManagement.UISettings();
        uiSettings.oncolorvalueschanged = function () {
            params.cssTheme = settingsStore.getItem('cssTheme');
            if (params.cssUITheme == 'auto') cssUIThemeGetOrSet('auto');
            if (params.cssTheme == 'auto') switchCSSTheme();
        };
    }
    // Support for other contexts (Firefox, Chromium, Electron, NWJS)
    if (checkAuto && window.matchMedia('(prefers-color-scheme)').media !== 'not all') {
        uiSettings = window.matchMedia('(prefers-color-scheme:dark)');
        uiSettings.onchange = function () {
            params.cssTheme = settingsStore.getItem('cssTheme');
            if (params.cssUITheme == 'auto') cssUIThemeGetOrSet('auto');
            if (params.cssTheme == 'auto') switchCSSTheme();
        };
    }
}
// Code below is needed on startup to show or hide the inverted and DarkReader theme checkboxes;
// similar code also runs in switchCSSTheme(), but that is not evoked on startup
if (params.cssTheme == 'auto') document.getElementById('darkInvert').style.display = cssUIThemeGetOrSet('auto', true) == 'light' ? 'none' : 'block';
if (params.cssTheme == 'auto') document.getElementById('darkDarkReader').style.display = params.contentInjectionMode === 'serviceworker' ? cssUIThemeGetOrSet('auto', true) == 'light' ? 'none' : 'block' : 'none';
document.getElementById('cssUIDarkThemeCheck').addEventListener('click', function () {
    params.cssThemeOriginal = params.cssTheme;
    // This code implements a tri-state checkbox
    if (this.readOnly) this.checked = this.readOnly = false;
    else if (!this.checked) this.readOnly = this.indeterminate = true;
    // Code below shows how to invert the order
    // if (this.readOnly) {
    //     this.checked = true; this.readOnly = false;
    // } else if (this.checked) this.readOnly = this.indeterminate = true;
    params.cssUITheme = this.indeterminate ? 'auto' : this.checked ? 'dark' : 'light';
    if (!uiSettings) initializeUISettings();
    settingsStore.setItem('cssUITheme', params.cssUITheme, Infinity);
    document.getElementById('cssUIDarkThemeState').innerHTML = params.cssUITheme;
    cssUIThemeGetOrSet(params.cssUITheme);
    // Make subsequent check valid if params.cssTheme is "invert" rather than "dark"
    if (params.cssUITheme != params.cssTheme) document.getElementById('cssWikiDarkThemeCheck').click();
    // If the darkReader theme has been turned off or on (and this is a change), then we need to reload the page
    if (params.cssTheme !== params.cssThemeOriginal && (params.cssTheme === 'darkReader' || params.cssThemeOriginal === 'darkReader')) {
        params.themeChanged = true;
        params.lastPageVisit = '';
    }
    params.cssThemeOriginal = null;
});
document.getElementById('cssWikiDarkThemeCheck').addEventListener('click', function () {
    if (this.readOnly) this.checked = this.readOnly = false;
    else if (!this.checked) this.readOnly = this.indeterminate = true;
    // Invert order:
    // if (this.readOnly) {
    //     this.checked = true; this.readOnly = false;
    // } else if (this.checked) this.readOnly = this.indeterminate = true;
    params.cssTheme = this.indeterminate ? 'auto' : this.checked ? 'dark' : 'light';
    if (!uiSettings) initializeUISettings();
    var determinedValue = params.cssTheme;
    if (params.cssTheme == 'auto') determinedValue = cssUIThemeGetOrSet('auto', true);
    if (determinedValue == 'light') document.getElementById('footer').classList.remove('darkfooter');
    if (params.cssTheme == 'light') document.getElementById('cssWikiDarkThemeInvertCheck').checked = false;
    if (determinedValue == 'dark') document.getElementById('footer').classList.add('darkfooter');
    document.getElementById('darkInvert').style.display = determinedValue == 'light' ? 'none' : 'block';
    document.getElementById('darkDarkReader').style.display = params.contentInjectionMode === 'serviceworker' ? determinedValue == 'light' ? 'none' : 'block' : 'none';
    params.cssTheme = document.getElementById('cssWikiDarkThemeInvertCheck').checked && determinedValue == 'dark' ? 'invert' : params.cssTheme;
    document.getElementById('cssWikiDarkThemeDarkReaderCheck').checked = determinedValue == 'dark' ? appstate.selectedArchive && /zimit/.test(appstate.selectedArchive.zimType) : false;
    params.cssTheme = document.getElementById('cssWikiDarkThemeDarkReaderCheck').checked ? 'darkReader' : params.cssTheme;
    document.getElementById('cssWikiDarkThemeState').innerHTML = params.cssTheme;
    settingsStore.setItem('cssTheme', params.cssTheme, Infinity);
    switchCSSTheme();
    params.cssThemeOriginal = null;
});
document.getElementById('cssWikiDarkThemeInvertCheck').addEventListener('change', function () {
    if (this.checked) {
        params.cssTheme = 'invert';
        document.getElementById('cssWikiDarkThemeDarkReaderCheck').checked = false;
    } else {
        var darkThemeCheckbox = document.getElementById('cssWikiDarkThemeCheck');
        params.cssTheme = darkThemeCheckbox.indeterminate ? 'auto' : darkThemeCheckbox.checked ? 'dark' : 'light';
    }
    settingsStore.setItem('cssTheme', params.cssTheme, Infinity);
    document.getElementById('cssWikiDarkThemeState').innerHTML = params.cssTheme;
    switchCSSTheme();
    params.cssThemeOriginal = null;
});
document.getElementById('cssWikiDarkThemeDarkReaderCheck').addEventListener('change', function () {
    params.cssThemeOriginal = params.cssTheme;
    if (this.checked) {
        params.cssTheme = 'darkReader';
        document.getElementById('cssWikiDarkThemeInvertCheck').checked = false;
    } else {
        var darkThemeCheckbox = document.getElementById('cssWikiDarkThemeCheck');
        params.cssTheme = darkThemeCheckbox.indeterminate ? 'auto' : darkThemeCheckbox.checked ? 'dark' : 'light';
    }
    settingsStore.setItem('cssTheme', params.cssTheme, Infinity);
    document.getElementById('cssWikiDarkThemeState').innerHTML = params.cssTheme;
    switchCSSTheme();
    // If the darkReader theme has been turned off or on (and this is a change), then we need to reload the page
    if (params.cssTheme !== params.cssThemeOriginal && (params.cssTheme === 'darkReader' || params.cssThemeOriginal === 'darkReader')) {
        params.themeChanged = true;
        params.lastPageVisit = '';
    }
    params.cssThemeOriginal = null;
});

function cssUIThemeGetOrSet (value, getOnly) {
    if (value === 'auto') {
        value = 'light'; // Default that most people expect
        if (uiSettings) {
            // We need to check the system theme
            if (uiSettings.getColorValue) {
                // Value 0 below is the 'background' constant in array Windows.UI.ViewManagement.UIColorType
                var colour = uiSettings.getColorValue(0);
                value = (colour.b + colour.g + colour.r) <= 382 ? 'dark' : 'light';
            } else {
                // Generic support for modern browser contexts
                value = uiSettings.matches ? 'dark' : 'light';
            }
        }
    }
    if (getOnly) return value;
    var elements;
    if (value == 'dark') {
        document.getElementsByTagName('body')[0].classList.add('dark');
        archiveFilesLegacy.classList.add('dark');
        document.getElementById('footer').classList.add('darkfooter');
        archiveFilesLegacy.classList.remove('btn');
        document.getElementById('findInArticle').classList.add('dark');
        prefix.classList.add('dark');
        elements = document.querySelectorAll('.settings');
        for (var i = 0; i < elements.length; i++) {
            elements[i].style.border = '1px solid darkgray';
        }
        document.getElementById('kiwixIcon').src = /wikivoyage/i.test(params.storedFile) ? 'img/icons/wikivoyage-white-32.png' : /medicine|mdwiki/i.test(params.storedFile) ? 'img/icons/wikimed-lightblue-32.png' : 'img/icons/kiwix-32.png';
        if (/wikivoyage/i.test(params.storedFile)) document.getElementById('kiwixIconAbout').src = 'img/icons/wikivoyage-90-white.png';
    }
    if (value == 'light') {
        document.getElementsByTagName('body')[0].classList.remove('dark');
        document.getElementById('search-article').classList.remove('dark');
        document.getElementById('footer').classList.remove('darkfooter');
        archiveFilesLegacy.classList.remove('dark');
        archiveFilesLegacy.classList.add('btn');
        document.getElementById('findInArticle').classList.remove('dark');
        prefix.classList.remove('dark');
        elements = document.querySelectorAll('.settings');
        for (i = 0; i < elements.length; i++) {
            elements[i].style.border = '1px solid black';
        }
        document.getElementById('kiwixIcon').src = /wikivoyage/i.test(params.storedFile) ? 'img/icons/wikivoyage-black-32.png' : /medicine|mdwiki/i.test(params.storedFile) ? 'img/icons/wikimed-blue-32.png' : 'img/icons/kiwix-blue-32.png';
        if (/wikivoyage/i.test(params.packagedFile)) document.getElementById('kiwixIconAbout').src = 'img/icons/wikivoyage-90.png';
    }
    refreshCacheStatus();
    setOPFSUI();
    return value;
}

function setExpressServerUI (value) {
    // See main.cjs for default values
    params.expressPort = value || 3000;
    document.getElementById('expressPortInput').value = params.expressPort;
    document.getElementById('expressPortInputDiv').style.display = 'block';
    console.log('Express port was reported as ' + params.expressPort);
    // Only encourage opening in browser if we are not in a packaged app
    if (!params.packagedFile) {
        var openAppInBrowserSpan = document.getElementById('openAppInBrowserSpan');
        openAppInBrowserSpan.style.display = 'inline';
        var openAppInBrowserLink = document.getElementById('openAppInBrowserLink');
        openAppInBrowserLink.innerHTML = 'http://localhost:' + params.expressPort + '/';
        openAppInBrowserLink.addEventListener('click', function () {
            electronAPI.openExternal('http://localhost:' + params.expressPort + '/www/index.html');
        });
    }
}

function switchCSSTheme () {
    // Choose the document, either the iframe contentDocument or else the replay_iframe contentDocument
    var doc = articleContainer ? articleContainer.contentDocument : '';
    var zimitIframe = doc && appstate.isReplayWorkerAvailable ? doc.getElementById('replay_iframe')
        : appstate.selectedArchive && appstate.selectedArchive.zimType === 'zimit2' ? articleContainer : null;
    doc = zimitIframe ? zimitIframe.contentDocument : doc;
    if (!doc) return;
    var styleSheets = doc.getElementsByTagName('link');
    // Remove any dark theme, as we don't know whether user switched from light to dark or from inverted to dark, etc.
    for (var i = styleSheets.length - 1; i > -1; i--) {
        if (~styleSheets[i].href.search(/-\/s\/style-dark/)) {
            styleSheets[i].disabled = true;
            styleSheets[i].parentNode.removeChild(styleSheets[i]);
        }
    }
    var determinedWikiTheme = params.cssTheme == 'auto' ? cssUIThemeGetOrSet('auto', true) : params.cssTheme;
    var breakoutLink = doc.getElementById('breakoutLink');
    // Construct an absolute reference becuase Service Worker needs this
    var locationPrefix = window.location.pathname.replace(/\/[^/]*$/, '');
    if (determinedWikiTheme !== 'light' && params.cssTheme !== 'darkReader') {
        var link = doc.createElement('link');
        link.setAttribute('rel', 'stylesheet');
        link.setAttribute('type', 'text/css');
        link.setAttribute('href', locationPrefix + (determinedWikiTheme == 'dark' ? '/-/s/style-dark.css' : '/-/s/style-dark-invert.css'));
        link.onload = function () {
            if (document.getElementById('configuration').style.display === 'none') {
                articleContainer.style.display = '';
                if (zimitIframe) zimitIframe.style.display = '';
                window.dispatchEvent(new Event('resize')); // Force repaint
            }
        }
        doc.head.appendChild(link);
        if (doc.defaultView.DarkReader) {
            doc.defaultView.DarkReader.disable();
        }
        if (breakoutLink) breakoutLink.src = locationPrefix + '/img/icons/new_window_lb.svg';
    } else {
        if (params.contentInjectionMode === 'serviceworker' && params.cssTheme === 'darkReader') {
            var loadDarkReader = function () {
                var darkReader = doc.createElement('script');
                darkReader.onload = function () {
                    doc.defaultView.DarkReader.setFetchMethod(doc.defaultView.fetch);
                    doc.defaultView.DarkReader.enable();
                    if (zimitIframe && document.getElementById('configuration').style.display === 'none') {
                        articleContainer.style.display = '';
                        setTimeout(function () {
                            zimitIframe.style.display = '';
                            window.dispatchEvent(new Event('resize')); // Force repaint
                        }, 350);
                    }
                }
                darkReader.type = 'text/javascript';
                darkReader.src = locationPrefix + '/js/lib/darkreader.min.js';
                doc.head.appendChild(darkReader);
            };
            // Use setInterval to keep attempting to load darkReader until doc.defaultView.DarkReader is available
            var interval = setInterval(function () {
                if (doc && doc.defaultView) {
                    if (!doc.defaultView.DarkReader) {
                        clearInterval(interval);
                            loadDarkReader();
                    }
                } else {
                    // Oops, we no longer have a handle on the iframe document, so get it again
                    doc = articleContainer ? articleContainer.contentDocument : '';
                    zimitIframe = doc && appstate.isReplayWorkerAvailable ? doc.getElementById('replay_iframe')
                        : appstate.selectedArchive.zimType === 'zimit2' ? articleContainer : null;
                    doc = zimitIframe ? zimitIframe.contentDocument : doc;
                }
            }, 100);
            // If the interval has not succeeded after 3 seconds, give up
            if (zimitIframe && document.getElementById('configuration').style.display === 'none') {
                setTimeout(function (zimitf, articleC) {
                    articleC.style.display = '';
                    zimitf.style.display = '';
                    clearInterval(interval);
                    window.dispatchEvent(new Event('resize')); // Force repaint
                }, 3000, zimitIframe, articleContainer);
            }
        } else if (document.getElementById('configuration').style.display === 'none') {
            // We're dealing with a light style, so we just display it
            articleContainer.style.display = '';
            if (zimitIframe) zimitIframe.style.display = '';
            window.dispatchEvent(new Event('resize')); // Force repaint
        }
        if (breakoutLink) breakoutLink.src = locationPrefix + '/img/icons/new_window.svg';
    }
    document.getElementById('darkInvert').style.display = determinedWikiTheme == 'light' ? 'none' : 'block';
    document.getElementById('darkDarkReader').style.display = params.contentInjectionMode === 'serviceworker' ? determinedWikiTheme == 'light' ? 'none' : 'block' : 'none';
}

document.getElementById('resetDisplayOnResizeCheck').addEventListener('click', function () {
    params.resetDisplayOnResize = this.checked;
    settingsStore.setItem('resetDisplayOnResize', this.checked, Infinity);
    resizeIFrame(this.checked);
});
document.getElementById('rememberLastPageCheck').addEventListener('change', function () {
    params.rememberLastPage = this.checked;
    settingsStore.setItem('rememberLastPage', params.rememberLastPage, Infinity);
    if (!params.rememberLastPage) {
        settingsStore.setItem('lastPageVisit', '', Infinity);
        // DEV: replace this with cache.clear when you have repaired that method
        cache.setArticle(params.lastPageVisit.replace(/.+@kiwixKey@/, ''), params.lastPageVisit.replace(/@kiwixKey@.+/, ''), '', function () {});
        params.lastPageHTML = '';
    }
});
document.getElementById('cachedAssetsModeRadioTrue').addEventListener('change', function (e) {
    if (e.target.checked) {
        settingsStore.setItem('assetsCache', true, Infinity);
        params.assetsCache = true;
        refreshCacheStatus();
    }
});
document.getElementById('cachedAssetsModeRadioFalse').addEventListener('change', function (e) {
    if (e.target.checked) {
        settingsStore.setItem('assetsCache', false, Infinity);
        params.assetsCache = false;
        // Delete all caches
        cache.clear('all', refreshCacheStatus);
    }
});
document.querySelectorAll('input[name=cssInjectionMode]').forEach(function (element) {
    element.addEventListener('click', function () {
        params.cssSource = this.value;
        settingsStore.setItem('cssSource', params.cssSource, Infinity);
        if (params.cssSource === 'desktop' && !params.openAllSections) {
            // If the user has selected desktop style, we should ensure all sections are opened by default
            document.getElementById('openAllSectionsCheck').click();
        }
        params.themeChanged = true;
    });
});
document.getElementById('removePageMaxWidthCheck').addEventListener('click', function () {
    // This code implements a tri-state checkbox
    if (this.readOnly) this.checked = this.readOnly = false;
    else if (!this.checked) this.readOnly = this.indeterminate = true;
    params.removePageMaxWidth = this.indeterminate ? 'auto' : this.checked;
    document.getElementById('pageMaxWidthState').textContent = (params.removePageMaxWidth == 'auto' ? 'auto' : params.removePageMaxWidth ? 'always' : 'never');
    settingsStore.setItem('removePageMaxWidth', params.removePageMaxWidth, Infinity);
    removePageMaxWidth();
});
document.getElementById('displayHiddenBlockElementsCheck').addEventListener('click', function () {
    if (this.readOnly) this.checked = this.readOnly = false;
    else if (!this.checked) this.readOnly = this.indeterminate = true;
    params.displayHiddenBlockElements = this.indeterminate ? 'auto' : this.checked;
    document.getElementById('displayHiddenElementsState').textContent = (params.displayHiddenBlockElements == 'auto' ? 'auto' : params.displayHiddenBlockElements ? 'always' : 'never');
    settingsStore.setItem('displayHiddenBlockElements', params.displayHiddenBlockElements, Infinity);
    if (params.contentInjectionMode === 'serviceworker') {
        var message = '';
        if (this.checked && !params.manipulateImages) {
            message += 'We need to turn on "Allow image manipulation" (below) in order to display hidden images. Please be aware that ' +
                'image manipulation can interfere badly with non-Wikimedia ZIMs that contain active content, so please turn it off if ' +
                'you experience problems.';
            document.getElementById('manipulateImagesCheck').click();
        }
        if (this.checked && /UWP/.test(params.appType) && params.windowOpener && params.cssSource !== 'desktop') {
            if (message) message += '\n\n';
            message += 'Please note that hidden elements will not be displayed in any NEW windows or tabs that you open in this UWP app. If you want to see hidden elements in new windows in *Wikimedia* ZIMs, please switch to Desktop style (above), where they are shown by default.';
        }
        if (!params.displayHiddenBlockElements && params.manipulateImages) {
            message += 'We are turning off the image manipulation option because it is no longer needed to display hidden elements. You may turn it back on if you need it for another reason.';
            document.getElementById('manipulateImagesCheck').click();
        }
        if (message) uiUtil.systemAlert(message);
    }
    // Forces page reload
    params.themeChanged = true;
});

/**
 * Removes the WikiMedia max-page-width restrictions using DOM methods on the articleWindow
 */
function removePageMaxWidth () {
    if (!appstate.wikimediaZimLoaded) return;
    // Note that the UWP app has no access to the content of opened windows, so we can't access the DOM of the articleWindow
    if (/UWP/.test(params.appType) && appstate.target !== 'iframe') return;
    var zimType;
    var cssSource;
    var contentElement;
    var docStyle;
    var updatedCssText;
    var doc = articleWindow.document;
    if (!doc || !doc.head || !doc.body) return;
    var body = doc.body;
    // Remove max-width: 100ex; from the element's style attribute (in new ZIMs from mobile html enpoint)
    if (body.style) body.style.maxWidth = '';
    zimType = /<link\b[^>]+(?:minerva|mobile)/i.test(doc.head.innerHTML) ? 'mobile' : 'desktop';
    cssSource = params.cssSource === 'auto' ? zimType : params.cssSource;
    var idArray = ['content', 'bodyContent'];
    for (var i = 0; i < idArray.length; i++) {
        contentElement = doc.getElementById(idArray[i]);
        if (!contentElement) continue;
        docStyle = contentElement.style;
        if (!docStyle) continue;
        if (contentElement.className === 'mw-body') {
            docStyle.padding = '1em';
            docStyle.border = '1px solid #a7d7f9';
        }
        if (params.removePageMaxWidth === 'auto') {
            updatedCssText = cssSource === 'desktop' ? '100%' : window.innerWidth > 1012 ? '94%'
                // /android/i.test(params.appType) ? '98%' :
                : '55.8em';
            docStyle.maxWidth = updatedCssText;
            docStyle.cssText = docStyle.cssText.replace(/max-width:[^;]+/i, 'max-width: ' + updatedCssText + ' !important');
            docStyle.border = '0';
        } else {
            updatedCssText = params.removePageMaxWidth ? '100%' : '55.8em';
            docStyle.maxWidth = updatedCssText;
            docStyle.cssText = docStyle.cssText.replace(/max-width:[^;]+/i, 'max-width: ' + updatedCssText + ' !important');
            if (params.removePageMaxWidth || zimType == 'mobile') docStyle.border = '0';
        }
        docStyle.margin = '0 auto';
    }
    if (doc.body && doc.body.classList.contains('article-list-home')) {
        doc.body.style.padding = '2em';
    }
}

document.getElementById('openAllSectionsCheck').addEventListener('click', function (e) {
    params.openAllSections = this.checked;
    settingsStore.setItem('openAllSections', params.openAllSections, Infinity);
    if (appstate.selectedArchive) {
        if (params.contentInjectionMode === 'serviceworker') {
            // We have to reload the article to respect user's choice
            goToArticle(params.lastPageVisit.replace(/@[^@].+$/, ''));
            return;
        }
        openAllSections();
    }
});
document.getElementById('linkToWikimediaImageFileCheck').addEventListener('click', function () {
    params.linkToWikimediaImageFile = this.checked;
    settingsStore.setItem('linkToWikimediaImageFile', this.checked, Infinity);
    params.themeChanged = true;
});
document.getElementById('useOSMCheck').addEventListener('click', function () {
    params.mapsURI = this.checked ? 'https://www.openstreetmap.org/' : 'bingmaps:';
    settingsStore.setItem('mapsURI', params.mapsURI, Infinity);
    params.themeChanged = true;
});
document.querySelectorAll('input[name=useMathJax]').forEach(function (element) {
    element.addEventListener('click', function () {
        params.useMathJax = /true/i.test(this.value);
        settingsStore.setItem('useMathJax', params.useMathJax, Infinity);
        params.themeChanged = true;
    });
});

var library = document.getElementById('libraryArea');
var unhideArchiveLibraryAnchors = document.getElementsByClassName('unhideLibrary');
for (var i = 0; i < unhideArchiveLibraryAnchors.length; i++) {
    unhideArchiveLibraryAnchors[i].addEventListener('click', function () {
        if (!params.showFileSelectors) document.getElementById('displayFileSelectorsCheck').click();
        library.style.borderColor = 'red';
        library.style.borderStyle = 'solid';
    });
}
document.getElementById('downloadTrigger').addEventListener('mousedown', function () {
    library.style.borderColor = '';
    library.style.borderStyle = '';
});

document.getElementById('displayFileSelectorsCheck').addEventListener('change', function () {
    params.showFileSelectors = this.checked;
    document.getElementById('rescanStorage').style.display = 'block';
    document.getElementById('openLocalFiles').style.display = 'none';
    document.getElementById('hideFileSelectors').style.display = params.showFileSelectors ? 'block' : 'none';
    document.getElementById('downloadLinksText').style.display = params.showFileSelectors ? 'none' : 'inline';
    document.getElementById('usage').style.display = params.showFileSelectors ? 'none' : 'inline';
    if (params.packagedFile && params.storedFile && params.storedFile != params.packagedFile) {
        currentArchiveLink.innerHTML = params.storedFile.replace(/\.zim(\w\w)?$/i, '');
        currentArchiveLink.dataset.archive = params.storedFile;
        openCurrentArchive.style.display = (params.pickedFile || params.pickedFolder) ? 'none' : '';
        currentArchive.style.display = params.showFileSelectors ? 'none' : 'block';
        document.getElementById('downloadLinksText').style.display = params.showFileSelectors ? 'none' : 'block';
    }
    settingsStore.setItem('showFileSelectors', params.showFileSelectors, Infinity);
    if (params.showFileSelectors) document.getElementById('configuration').scrollIntoView();
});

document.addEventListener('DOMContentLoaded', function () {
    // Set initial behaviour (see also init.js)
    cssUIThemeGetOrSet(params.cssUITheme);
    // DEV this hides file selectors if it is a packaged file -- add your own packaged file test to regex below
    if (params.packagedFile && !/wikipedia.en.100|ray.charles/i.test(params.fileVersion)) {
        document.getElementById('packagedAppFileSelectors').style.display = 'block';
        document.getElementById('hideFileSelectors').style.display = 'none';
        // document.getElementById('downloadLinksText').style.display = "none";
        if (params.showFileSelectors) {
            document.getElementById('hideFileSelectors').style.display = 'block';
            document.getElementById('downloadLinksText').style.display = 'inline';
        }
    }
    // Populate version info
    var versionSpans = document.getElementsByClassName('version');
    for (var i = 0; i < versionSpans.length; i++) {
        versionSpans[i].innerHTML = i ? params.appVersion : params.appVersion.replace(/\s+.*$/, '');
    }
    if (params.fileVersion && /UWP|Electron/.test(params.appType)) {
        var packagedInfoParas = document.getElementsByClassName('packagedInfo');
        var fileVersionDivs = document.getElementsByClassName('fileVersion');
        for (i = 0; i < fileVersionDivs.length; i++) {
            packagedInfoParas[i].style.display = 'block';
            fileVersionDivs[i].innerHTML = i ? params.fileVersion.replace(/\s+.+$/, '') : params.fileVersion;
        }
    }
    var appType = document.getElementById('appType');
    appType.innerHTML = /^(?=.*PWA).*UWP/.test(params.appType) &&
        /^https:/i.test(location.protocol) ? 'UWP (PWA) '
        : /UWP/.test(params.appType) ? 'UWP '
        : window.nw ? 'NWJS '
        : /Electron/.test(params.appType) ? 'Electron '
        : /PWA/.test(params.appType) ? 'PWA ' : '';
    // Code below triggers display of modal info box if app is run for the first time, or it has been upgraded to new version
    if (settingsStore.getItem('appVersion') !== params.appVersion) {
        //  Update the installed version
        if (settingsStore.getItem('PWAInstalled')) {
            params.PWAInstalled = params.appVersion;
            settingsStore.setItem('PWAInstalled', params.PWAInstalled);
        }
        // One-time cleanup of idxDB files to delete deprecated databases if possible
        cache.idxDB('deleteNonCurrent', function (result) {
            if (result === false) console.log('Unable to delete old idxDB databases (this is normal in non-Chromium browsers');
            else console.log('Deleted ' + result + ' deprecated database(s).');
        });
        var noPackagedZIM = document.getElementById('noPackagedZIM');
        if (params.packagedFile && /medicine|wikivoyage|mdwiki/i.test(params.packagedFile)) {
            noPackagedZIM.style.display = 'none';
        }
        // On some platforms, bootstrap's jQuery functions have not been injected yet, so we have to run in a timeout
        setTimeout(function () {
            uiUtil.systemAlert(' ', '', false, null, null, null, 'myModal').then(function () {
                // We need to delay any attempt to launch the UWP Service Worker till after the bootstrap modal is displayed
                // or else app is left in an anomalous situation whereby it's not possible to exit the modal in some cases
                if (appstate.launchUWPServiceWorker) {
                    launchUWPServiceWorker();
                    return;
                }
                if (params.isUWPStoreApp) return; // It's a UWP app installed from the Store, so it will self update
                if (!params.allowInternetAccess) {
                    var updateServer = params.updateServer.url.replace(/^([^:]+:\/\/[^/]+).*/, '$1');
                    uiUtil.systemAlert('<p>Do you want this app to check for updates on startup?<br />(this will allow access to <i>' + updateServer + '</i>)</p>' +
                        '<p><i>If you change your mind, use the <b>"Allow Internet Access"</b> option in Configuration to turn on or off.</i></p>'
                        , 'Updates check disabled!', true)
                    .then(function (response) {
                        if (response) document.getElementById('allowInternetAccessCheck').click();
                    });
                }
            });
            settingsStore.setItem('appVersion', params.appVersion, Infinity);
        }, 1000);
    } else if (appstate.launchUWPServiceWorker) {
        launchUWPServiceWorker();
    }
});

/**
 * Displays or refreshes the API status shown to the user
 */
function refreshAPIStatus () {
    var messageChannelStatus = document.getElementById('messageChannelStatus');
    var serviceWorkerStatus = document.getElementById('serviceWorkerStatus');
    var apiStatusPanel = document.getElementById('apiStatusDiv');
    apiStatusPanel.classList.remove('panel-success', 'panel-warning', 'panel-danger');
    var apiPanelClass = 'panel-success';
    if (isMessageChannelAvailable()) {
        messageChannelStatus.textContent = 'MessageChannel API available';
        messageChannelStatus.classList.remove('apiAvailable');
        messageChannelStatus.classList.remove('apiUnavailable')
        messageChannelStatus.classList.add('apiAvailable');
    } else {
        apiPanelClass = 'panel-warning';
        messageChannelStatus.textContent = 'MessageChannel API unavailable';
        messageChannelStatus.classList.remove('apiAvailable');
        messageChannelStatus.classList.remove('apiUnavailable');
        messageChannelStatus.classList.add('apiUnavailable');
    }
    if (isServiceWorkerAvailable()) {
        if (isServiceWorkerReady()) {
            serviceWorkerStatus.textContent = 'ServiceWorker API available, and registered';
            serviceWorkerStatus.classList.remove('apiAvailable');
            serviceWorkerStatus.classList.remove('apiUnavailable');
            serviceWorkerStatus.classList.add('apiAvailable');
        } else {
            apiPanelClass = 'panel-warning';
            serviceWorkerStatus.textContent = 'ServiceWorker API available, but not registered';
            serviceWorkerStatus.classList.remove('apiAvailable');
            serviceWorkerStatus.classList.remove('apiUnavailable');
            serviceWorkerStatus.classList.add('apiUnavailable');
        }
    } else {
        apiPanelClass = 'panel-warning';
        serviceWorkerStatus.textContent = 'ServiceWorker API unavailable';
        serviceWorkerStatus.classList.remove('apiAvailable');
        serviceWorkerStatus.classList.remove('apiUnavailable');
        serviceWorkerStatus.classList.add('apiUnavailable');
    }

    // Update Settings Store section of API panel with API name
    var settingsStoreStatusDiv = document.getElementById('settingsStoreStatus');
    var apiName = params.storeType === 'cookie' ? 'Cookie' : params.storeType === 'local_storage' ? 'Local Storage' : 'None';
    settingsStoreStatusDiv.innerHTML = 'Settings Storage API in use: ' + apiName;
    settingsStoreStatusDiv.classList.remove('apiAvailable', 'apiUnavailable');
    settingsStoreStatusDiv.classList.add(params.storeType === 'none' ? 'apiUnavailable' : 'apiAvailable');
    apiPanelClass = params.storeType === 'none' ? 'panel-warning' : apiPanelClass;

    // Update Decompressor API section of panel
    var decompAPIStatusDiv = document.getElementById('decompressorAPIStatus');
    apiName = params.useLibzim ? 'LIBZIM' : params.decompressorAPI.assemblerMachineType;
    if (apiName && params.decompressorAPI.decompressorLastUsed) {
        apiName += ' [&nbsp;' + (params.useLibzim ? (params.debugLibzimASM || 'default') : params.decompressorAPI.decompressorLastUsed) + '&nbsp;]';
    }
    apiPanelClass = params.decompressorAPI.errorStatus ? 'panel-danger' : apiName ? apiPanelClass : 'panel-warning';
    decompAPIStatusDiv.className = apiName ? params.decompressorAPI.errorStatus ? 'apiBroken' : 'apiAvailable' : 'apiUnavailable';
    apiName = params.decompressorAPI.errorStatus || apiName || 'Not initialized';
    decompAPIStatusDiv.innerHTML = 'Decompressor API: ' + apiName;

    // Update Search Provider
    uiUtil.reportSearchProviderToAPIStatusPanel(params.searchProvider);

    // Update PWA origin
    var pwaOriginStatusDiv = document.getElementById('pwaOriginStatus');
    pwaOriginStatusDiv.className = 'apiAvailable';
    pwaOriginStatusDiv.innerHTML = 'PWA Origin: ' + window.location.origin;

    // Add a warning colour to the API Status Panel if any of the above tests failed
    apiStatusPanel.classList.add(apiPanelClass);

    // Set visibility of UI elements according to mode
    document.getElementById('bypassAppCacheDiv').style.display = params.contentInjectionMode === 'serviceworker' ? 'block' : 'none';

    // Set colour of contentInjectionMode div
    var contentInjectionDiv = document.getElementById('contentInjectionModeDiv');
    contentInjectionDiv.classList.remove('parnel-warning');
    contentInjectionDiv.classList.remove('panel-danger');
    if (params.contentInjectionMode === 'serviceworker') contentInjectionDiv.classList.add('panel-warning');
    else contentInjectionDiv.classList.add('panel-danger');

    refreshCacheStatus();
}

/**
 * Refreshes the UI (Configuration) with the cache attributes obtained from getCacheAttributes()
 */
function refreshCacheStatus () {
    // Update radio buttons and checkbox
    document.getElementById('cachedAssetsModeRadio' + (params.assetsCache ? 'True' : 'False')).checked = true;
    // Get cache attributes, then update the UI with the obtained data
    cache.count(function (c) {
        document.getElementById('cacheUsed').innerHTML = c.description;
        document.getElementById('assetsCount').innerHTML = c.count;
        var cacheSettings = document.getElementById('performanceSettingsDiv');
        var cacheStatusPanel = document.getElementById('cacheStatusPanel');
        [cacheSettings, cacheStatusPanel].forEach(function (card) {
            // IE11 cannot remove more than one class from a list at a time
            card.classList.remove('panel-warning');
            card.classList.remove('panel-danger');
            if (params.assetsCache) card.classList.add('panel-warning');
            else card.classList.add('panel-danger');
        });
    });
    if (params.appCache) {
        scrollbox.style.removeProperty('background');
        prefix.style.removeProperty('background');
    } else {
        scrollbox.style.background = /^dark/.test(document.body.className) ? '#300000' : 'mistyrose';
        prefix.style.setProperty('background', /^dark/.test(document.body.className) ? '#200000' : 'lavenderblush', 'important');
    }
    var expertSettings = document.getElementById('expertSettingsDiv');
    expertSettings.classList.remove('panel-warning');
    expertSettings.classList.remove('panel-danger');
    if (!params.appCache || params.hideActiveContentWarning || params.debugLibzimASM || params.useLibzim || params.useLegacyZimitSupport) {
        expertSettings.classList.add('panel-danger');
    } else {
        expertSettings.classList.add('panel-warning');
    }
}

var serviceWorkerRegistration = null;

/**
 * Sends an 'init' message to the ServiceWorker and inititalizes the onmessage event
 * It is called when the Service Worker is first activated, and also when a new archive is loaded
 * When a message is received, it will provide a MessageChannel port to respond to the ServiceWorker
 */
function initServiceWorkerMessaging () {
    if (!(isServiceWorkerAvailable() && isMessageChannelAvailable())) {
        console.warn('Cannot initiate ServiceWorker messaging, because one or more API is unavailable!');
        return;
    };
    // Create a message listener
    navigator.serviceWorker.onmessage = function (event) {
        if (event.data.error) {
            console.error('Error in MessageChannel', event.data.error);
            throw event.data.error;
        } else if (event.data.action === 'acknowledge') {
            // The Service Worker is acknowledging receipt of init message
            console.log('SW acknowledged init message');
            serviceWorkerRegistration = true;
            refreshAPIStatus();
        } else if (event.data.action === 'askForContent') {
            // The Service Worker is asking for content. Check we have a loaded ZIM in this instance.
            // DEV: This can happen if there are various instances of the app open in different tabs or windows, and no archive has been selected in this instance.
            if (!appstate.selectedArchive) {
                console.warn('Message from SW received, but no archive is selected!');
                return;
            }
            // See below for explanation of this exception
            const videoException = appstate.selectedArchive.zimType === 'zimit' && /\/\/youtubei.*player/.test(event.data.title);
            // Check that the zimFileId in the messageChannel event data is the same as the one in the currently open archive
            // Because the SW broadcasts its request to all open tabs or windows, we need to check that the request is for this instance
            if (event.data.zimFileName !== appstate.selectedArchive.file.name && !videoException) {
                // Do nothing if the request is not for this instance
                // console.debug('SW request does not match this instance', '[zimFileName:' + event.data.zimFileName + ' !== ' + appstate.selectedArchive.file.name + ']');
            } else {
                if (videoException) {
                    // DEV: This is a hack to allow YouTube videos to play in Zimit archives:
                    // Because links are embedded in a nested iframe, the SW cannot identify the top-level window from which to request the ZIM content
                    // Until we find a way to tell where it is coming from, we allow the request through on all controlled clients and try to load the content
                    console.warn('>>> Allowing passthrough of SW request to process Zimit video <<<');
                }
                if (params.useLibzim) {
                    handleMessageChannelForLibzim(event);
                } else {
                    handleMessageChannelMessage(event);
                }
            }
        } else if (event.data.msg_type) {
            // Messages received from the ReplayWorker
            if (event.data.msg_type === 'colAdded') {
                console.debug('ReplayWorker added a collection');
            }
        } else {
            console.error('Invalid message received', event.data);
        }
    };
    // Send the init message to the ServiceWorker
    if (navigator.serviceWorker.controller) {
        console.log('Initializing SW messaging...');
        navigator.serviceWorker.controller.postMessage({
            action: 'init'
        });
    } else if (serviceWorkerRegistration) {
        // If this is the first time we are initiating the SW, allow Promises to complete by delaying potential reload till next tick
        console.warn('The Service Worker needs more time to load, or else the app was force-refreshed...');
        serviceWorkerRegistration = null;
        setTimeout(initServiceWorkerMessaging, 3000);
    } else if (params.contentInjectionMode === 'serviceworker') {
        console.error('The Service Worker is not controlling the current page! We have to reload.');
        // Turn off failsafe, as this is a controlled reboot
        settingsStore.setItem('lastPageLoad', 'rebooting', Infinity);
        if (!appstate.preventAutoReboot) window.location.reload();
    } else if (/^https/.test(window.location.protocol) && navigator && navigator.serviceWorker && !navigator.serviceWorker.controller) {
        if (!params.noPrompts) {
            uiUtil.systemAlert('<p>No Service Worker is registered, meaning this app will not currently work offline!</p><p>Would you like to switch to ServiceWorker mode?</p>',
                'Offline use is disabled!', true).then(function (response) {
                if (response) {
                    setContentInjectionMode('serviceworker');
                    if (appstate.selectedArchive) {
                        setTimeout(function () {
                            params.themeChanged = true;
                            document.getElementById('btnHome').click();
                        }, 800);
                    }
                }
            });
        }
    }
}

/**
 * Sets the given injection mode.
 * This involves registering (or re-enabling) the Service Worker if necessary
 * It also refreshes the API status for the user afterwards.
 *
 * @param {String} value The chosen content injection mode : 'jquery' or 'serviceworker'
 */
function setContentInjectionMode (value) {
    params.contentInjectionMode = value;
    if (value === 'jquery') {
        // Because the Service Worker must still run in a PWA app so that it can work offline, we don't actually disable the SW in this context,
        // but it will no longer be intercepting requests for ZIM assets (only requests for the app's own code)
        if ('serviceWorker' in navigator) {
            serviceWorkerRegistration = null;
        }
        // User has switched to Restricted mode, so no longer needs ASSETS_CACHE on SW side (it will still be used app-side)
        // if ('caches' in window && isMessageChannelAvailable()) {
        //     if (isServiceWorkerAvailable() && navigator.serviceWorker.controller) {
        //         var channel = new MessageChannel();
        //         navigator.serviceWorker.controller.postMessage({
        //             action: { assetsCache: 'disable' }
        //         }, [channel.port2]);
        //     }
        //     caches.delete(cache.ASSETS_CACHE);
        // }
        refreshAPIStatus();
    } else if (value === 'serviceworker') {
        if (!isServiceWorkerAvailable()) {
            uiUtil.systemAlert('The ServiceWorker API is not available on your device. Falling back to Restricted mode').then(function () {
                setContentInjectionMode('jquery');
            });
            return;
        }
        if (!isMessageChannelAvailable()) {
            uiUtil.systemAlert('The MessageChannel API is not available on your device. Falling back to Restricted mode').then(function () {
                setContentInjectionMode('jquery');
            });
            return;
        }
        if (window.nw && nw.process.versions.nw === '0.14.7') {
            uiUtil.systemAlert('Service Worker mode is not available in the XP version of this app, due to the age of the Chromium build. Falling back to Restricted mode...')
            .then(function () {
                setContentInjectionMode('jquery');
            });
            return;
        }
        // Reset params.assetsCache in case it was changed when loading a Zimit ZIM in Restricted mode
        params.assetsCache = settingsStore.getItem('assetsCache') !== 'false';
        if (!isServiceWorkerReady()) {
            var serviceWorkerStatus = document.getElementById('serviceWorkerStatus');
            serviceWorkerStatus.textContent = 'ServiceWorker API available : trying to register it...';
            if (navigator.serviceWorker.controller) {
                console.log('Active Service Worker found, no need to register');
                serviceWorkerRegistration = true;
                // Remove any jQuery hooks from a previous jQuery session
                while (articleContainer.firstChild) {
                    articleContainer.removeChild(articleContainer.firstChild);
                }
                // Create the MessageChannel and send 'init'
                // initOrKeepAliveServiceWorker();
                refreshAPIStatus();
            } else {
                navigator.serviceWorker.register('../service-worker.js').then(function (reg) {
                    // The ServiceWorker is registered
                    console.log('Service worker is registered with a scope of ' + reg.scope);
                    serviceWorkerRegistration = reg;
                    // Process registration waiting for immediate load
                    // navigator.serviceWorker.ready.then(registration => {
                    //     if (registration.waiting) {
                    //         registration.waiting.postMessage('skipWaiting');
                    //     }
                    // });
                    // Controller change listener to reload the page
                    navigator.serviceWorker.addEventListener('controllerchange', () => {
                        window.location.reload();
                    });
                    // We need to wait for the ServiceWorker to be activated
                    // before sending the first init message
                    var serviceWorker = reg.installing || reg.waiting || reg.active;
                    serviceWorker.addEventListener('statechange', function (statechangeevent) {
                        if (statechangeevent.target.state === 'activated') {
                            // Remove any jQuery hooks from a previous jQuery session
                            while (articleContainer.firstChild) {
                                articleContainer.removeChild(articleContainer.firstChild);
                            }
                            // Create the MessageChannel and send the 'init' message to the ServiceWorker
                            // initOrKeepAliveServiceWorker();
                            // We need to refresh cache status here on first activation because SW was inaccessible till now
                            // We also initialize the ASSETS_CACHE constant in SW here
                            refreshCacheStatus();
                            setWindowOpenerUI();
                            refreshAPIStatus();
                        }
                    });
                    if (serviceWorker.state === 'activated') {
                        // Even if the ServiceWorker is already activated,
                        // We need to re-create the MessageChannel
                        // and send the 'init' message to the ServiceWorker
                        // in case it has been stopped and lost its context
                        // initOrKeepAliveServiceWorker();
                    }
                    refreshAPIStatus();
                }).catch(function (err) {
                    console.error('Error while registering serviceWorker', err);
                    refreshAPIStatus();
                    var message = 'The ServiceWorker could not be properly registered. Switching back to Restricted mode. Error message : ' + err;
                    var protocol = window.location.protocol;
                    if (protocol === 'ms-appx-web:') {
                        // We can't launch straight away if the app is starting, because the large modal could be showing
                        if (params.appIsLaunching) {
                            appstate.launchUWPServiceWorker = true;
                        } else {
                            launchUWPServiceWorker();
                        }
                        message = '';
                    } else if (protocol === 'moz-extension:') {
                        message += '\n\nYou seem to be using kiwix-js through a Firefox extension : ServiceWorkers are disabled by Mozilla in extensions.';
                        message += '\nPlease vote for https://bugzilla.mozilla.org/show_bug.cgi?id=1344561 so that some future Firefox versions support it';
                    } else if (protocol === 'file:') {
                        message += '\n\nYou seem to be opening kiwix-js with the file:// protocol. You should open it through a web server : either through a local one (http://localhost/...) or through a remote one (but you need SSL : https://webserver/...)';
                    }
                    appstate.preventAutoReboot = true;
                    if (message) uiUtil.systemAlert(message, 'Information');
                    setContentInjectionMode('jquery');
                });
            }
        } else {
            // We need to set this variable earlier else the Service Worker does not get reactivated
            params.contentInjectionMode = value;
            // initOrKeepAliveServiceWorker();
        }
    }
    var radioButtons = document.querySelectorAll('input[name=contentInjectionMode]');
    radioButtons.forEach(function (button) {
        button.checked = false;
        if (button.value === value) {
            button.checked = true;
        }
    });
    // Save the value in the Settings Store, so that to be able to keep it after a reload/restart
    settingsStore.setItem('contentInjectionMode', value, Infinity);
    setWindowOpenerUI();
    // Even in Restricted mode, the PWA needs to be able to serve the app in offline mode
    setTimeout(initServiceWorkerMessaging, 3000);
}

/**
 * Detects whether the ServiceWorker API is available
 * https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorker
 * @returns {Boolean}
 */
function isServiceWorkerAvailable () {
    return 'serviceWorker' in navigator;
}

/**
 * Detects whether the MessageChannel API is available
 * https://developer.mozilla.org/en-US/docs/Web/API/MessageChannel
 * @returns {Boolean}
 */
function isMessageChannelAvailable () {
    try {
        var dummyMessageChannel = new MessageChannel();
        if (dummyMessageChannel) return true;
    } catch (e) {
        return false;
    }
    return false;
}

/**
 * Tells if the ServiceWorker is registered, and ready to capture HTTP requests
 * and inject content in articles.
 * @returns {Boolean}
 */
function isServiceWorkerReady () {
    // Return true if the serviceWorkerRegistration is not null and not undefined
    return serviceWorkerRegistration;
}

function launchUWPServiceWorker () {
    delete appstate.launchUWPServiceWorker;
    var message = '<p>To enable the Service Worker, we need one-time access to our secure server ' +
        'so that the app can re-launch as a Progressive Web App (PWA).</p>' +
        '<p>The PWA will be able to run offline, but will auto-update periodically when online ' +
        'as per the Service Worker spec.</p>' +
        '<p>You can switch back any time by toggling <i>Allow Internet access?</i> off.</p>' +
        '<p><b>WARNING:</b> This will attempt to access the following server: <i>' + params.PWAServer + '</i></p>' +
        '<p><b>*** Screen may flash between black and white. ***</b></p>' +
        '<p>Note: If the app crashes, simply relaunch it.</p>';
    var launchPWA = function () {
        settingsStore.setItem('contentInjectionMode', 'serviceworker', Infinity);
        // This is needed so that we get passthrough on subsequent launches
        settingsStore.setItem('allowInternetAccess', true, Infinity);
        var uriParams = '?allowInternetAccess=true';
        // We are using allowInternetAccess as a passthrough, so we don't force a switch to SW mode on the server
        // except on first launch of SW mode
        uriParams += params.allowInternetAccess ? '' : '&contentInjectionMode=serviceworker';
        uriParams += '&manipulateImages=false&allowHTMLExtraction=false';
        // Commented line below causes crash if there are too many archives
        // uriParams += '&listOfArchives=' + encodeURIComponent(settingsStore.getItem('listOfArchives'));
        uriParams += '&lastSelectedArchive=' + encodeURIComponent(params.storedFile);
        // DEV: Line below causes crash when switching to SW mode in UWP app!
        // uriParams += '&lastPageVisit=' + encodeURIComponent(params.lastPageVisit);
        uriParams += params.packagedFile ? '&packagedFile=' + encodeURIComponent(params.packagedFile) : '';
        uriParams += params.fileVersion ? '&fileVersion=' + encodeURIComponent(params.fileVersion) : '';
        // Signal failure of PWA until it has successfully launched (in init.js it will be changed to 'success')
        params.localUWPSettings.PWA_launch = 'fail';
        window.location.href = params.PWAServer + 'www/index.html' + uriParams;
        // throw 'Beam me up, Scotty!';
    };
    var checkPWAIsOnline = function () {
        uiUtil.checkServerIsAccessible(params.PWAServer + 'www/img/icons/kiwix-32.png', launchPWA, function () {
            uiUtil.systemAlert('<p>The server is not currently accessible!</p>' +
                '<p>(Kiwix needs one-time access to the server to cache the PWA).</p>' +
                '<p>Please try again when you have a stable Internet connection.</p>', 'Error!');
        });
    };
    if (settingsStore.getItem('allowInternetAccess') === 'true' && params.localUWPSettings.PWA_launch && params.localUWPSettings.PWA_launch !== 'fail') {
        if (params.localUWPSettings.PWA_launch === 'success') launchPWA();
        else checkPWAIsOnline();
    } else {
        if (params.localUWPSettings.PWA_launch === 'fail') {
            message = '<p>The PWA MAY have failed to launch on the last attempt ' +
                '(we show this information to prevent a boot loop).</p>' +
                '<p>Please try again by selecting "Access server":</p>';
        }
        uiUtil.systemAlert(message, 'Information', true, 'Cancel', 'Access server').then(function (confirm) {
            if (confirm) launchPWA();
            else {
                var allowAccessCheck = document.getElementById('allowInternetAccessCheck');
                if (allowAccessCheck.checked) allowAccessCheck.click();
            }
        });
    }
}

/**
 *
 * @type Array.<StorageFirefoxOS>
 */
var storages = [];

function searchForArchivesInPreferencesOrStorage (displayOnly) {
    // First see if the list of archives is stored in the cookie
    var listOfArchivesFromCookie = settingsStore.getItem('listOfArchives');
    if (listOfArchivesFromCookie) {
        var directories = listOfArchivesFromCookie.split('|');
        populateDropDownListOfArchives(directories, displayOnly);
    } else {
        if (storages.length || params.localStorage) {
            searchForArchivesInStorage();
        } else {
            displayFileSelect();
            if (document.getElementById('archiveFiles').files && document.getElementById('archiveFiles').files.length > 0) {
                // Archive files are already selected,
                setLocalArchiveFromFileSelect();
            } else {
                var btnConfigure = document.getElementById('btnConfigure');
                if (!btnConfigure.classList.contains('active')) btnConfigure.click();
            }
        }
    }
}

function searchForArchivesInStorage () {
    // If DeviceStorage is available, we look for archives in it
    document.getElementById('btnConfigure').click();
    if (params.localStorage && typeof Windows !== 'undefined' && typeof Windows.Storage !== 'undefined') {
        scanUWPFolderforArchives(params.localStorage);
    } else {
        zimArchiveLoader.scanForArchives(storages, populateDropDownListOfArchives, function () {
            // callbackError function is called in case of an error
            uiUtil.systemAlert().then(populateDropDownListOfArchives(null));
        });
    }
}

// Check if there are files in the launch queue to be handled by the File Handling API
if ('launchQueue' in window && 'files' in LaunchParams.prototype) {
    console.log('File Handling API is available');
    launchQueue.setConsumer(function (launchParams) {
        // Nothing to do when the queue is empty.
        if (!launchParams.files.length) {
            console.debug('Launch Queue is empty');
        } else {
            // User launched app by double-clicking on file
            console.debug('Processing NativeFileHandle for ' + launchParams);
            // Turn off OPFS if it is on, because we are using the File Handling API instead
            params.useOPFS = false;
            params.pickedFolder = '';
            params.storedFile = '';
            setOPFSUI();
            processNativeFileHandle(launchParams.files[0]);
        }
    });
}

// @STORAGE AUTOLOAD STARTS HERE
if (navigator.getDeviceStorages && typeof navigator.getDeviceStorages === 'function') {
    // The method getDeviceStorages is available (FxOS>=1.1)
    storages = Array.from(navigator.getDeviceStorages('sdcard')).map(function (s) {
        return new abstractFilesystemAccess.StorageFirefoxOS(s);
    });
}
if (storages !== null && storages.length > 0 ||
    typeof Windows !== 'undefined' && typeof Windows.Storage !== 'undefined' ||
    typeof window.fs !== 'undefined' || typeof window.showOpenFilePicker === 'function' ||
    params.webkitdirectory || params.useOPFS) {
    if (window.fs && !(params.pickedFile || params.pickedFolder)) {
        // Below we compare the prefix of the files, i.e. the generic filename without date, so we can smoothly deal with upgrades
        if (params.packagedFile && params.storedFile.replace(/(^[^-]+all).+/, '$1') === params.packagedFile.replace(/(^[^-]+all).+/, '$1')) {
            // We're in Electron / NWJS and we need to load the packaged app, so we are forced to use the .fs code
            params.pickedFile = params.packagedFile;
            params.storedFile = params.packagedFile;
        } else if (!params.storedFile) {
            // If there is no last selected archive, we need to use the .fs code anyway
            params.pickedFile = params.packagedFile;
        } else if (/\/archives\//.test(params.storedFilePath) && ~params.storedFilePath.indexOf(params.storedFile)) {
            // We're in an Electron / NWJS app, and there is a stored file in the archive, but it's not the packaged archive!
            // Probably there is more than one archive in the archive folder, so we are forced to use .fs code
            console.warn('There may be more than one archive in the directory ' + params.storedFilePath.replace(/[^\\/]+$/, ''));
            params.pickedFile = params.storedFile;
        }
    }
    if (!params.pickedFile && !params.pickedFolder || params.useOPFS) {
        var btnConfigure = document.getElementById('btnConfigure');
        // If we are using OPFS, we should can load the entries directly
        if (params.useOPFS) {
            if (!params.storedFile) btnConfigure.click();
            loadOPFSDirectory();
        } else if (params.storedFile && navigator && navigator.storage && 'getDirectory' in navigator.storage) {
            getNativeFSHandle();
        } else {
            // We are in an app that cannot open files auotomatically, so populate archive list and show file pickers
            document.getElementById('btnRescanDeviceStorage').click();
            btnConfigure.click();
            searchForArchivesInPreferencesOrStorage(true);
        }
    } else if (typeof Windows !== 'undefined' && typeof Windows.Storage !== 'undefined') {
        console.log('Loading picked file for UWP app...');
        if (params.pickedFile) processPickedFileUWP(params.pickedFile);
        else searchForArchivesInPreferencesOrStorage();
    } else if (!window.fs) {
        // This should run, e.g., if we have params.webkitdirectory but not windows.fs, and also if we're using legacy file picking
        searchForArchivesInPreferencesOrStorage(true);
        // If we're not in Configuration, click
        btnConfigure = document.getElementById('btnConfigure');
        if (!btnConfigure.classList.contains('active')) btnConfigure.click();
    } else {
        // @AUTOLOAD packaged archive in Electron and NWJS packaged apps
        // We need to read the packaged file using the node File System API (so user doesn't need to pick it on startup)
        console.log('Loading packaged ZIM or last selected archive for Electron or NWJS...');
        // If we're in an AppImage package and the storedFilePath points to the packaged archive, then the storedFilePath will be invalid,
        // because a new path is established each time the image's filesystem is mounted. So we reset to default.
        var archiveFilePath = params.storedFilePath;
        if (params.storedFile === params.packagedFile) {
            // If the app is packed inside an asar archive, or is Electron running from localhost, we need to alter the archivePath to point outside the asar directory
            if (window.electronAPI && window.electronAPI.__dirname) {
                archiveFilePath = electronAPI.__dirname.replace(/[/\\]app\.asar/, '');
            }
            archiveFilePath = archiveFilePath + '/' + params.archivePath + '/' + params.packagedFile;
            if (~params.storedFilePath.indexOf(archiveFilePath)) {
                params.storedFilePath = archiveFilePath;
            }
        }
        var archiveDirectory = archiveFilePath.replace(/[\\/][^\\/]+$/, '');
        readNodeDirectoryAndCreateNodeFileObjects(archiveDirectory, params.storedFile).then(function (archiveFiles) {
            var pickedFileset = archiveFiles[0], archivesInFolder = archiveFiles[1];
            params.pickedFolder = archiveDirectory;
            params.pickedfile = '';
            setLocalArchiveFromFileList(pickedFileset);
            if (!params.rescan) populateDropDownListOfArchives(archivesInFolder, true);
            document.getElementById('hideFileSelectors').style.display = params.showFileSelectors ? 'inline' : 'none';
        }).catch(function (err) {
            console.error('There was an error reading the directory!', err);
            // Attempts to load the file seem to have failed: maybe it has moved or been deleted
            // Let's see if we can open the packaged ZIM instead (if this isn't the packaged ZIM)
            settingsStore.removeItem('lastSelectedArchive');
            settingsStore.removeItem('lastSelectedArchivePath');
            if (params.packagedFile && params.storedFile !== params.packagedFile) {
                createFakeFileObjectNode(params.packagedFile, params.archivePath + '/' + params.packagedFile, function (fakeFileList) {
                    var fakeFile = fakeFileList[0];
                    if (fakeFile && fakeFile.size) {
                        params.pickedFile = fakeFile;
                        setLocalArchiveFromFileList([params.pickedFile]);
                    } else {
                        // This shouldn't happen!
                        params.showFileSelectors = true;
                        document.getElementById('hideFileSelectors').style.display = 'inline';
                        document.getElementById('btnConfigure').click();
                        setTimeout(function () {
                            uiUtil.systemAlert('The packaged file cannot be loaded!\nPlease check that it is in the "' + params.archivePath + '" folder\nor pick a new ZIM file.');
                        }, 10);
                    }
                });
            } else {
                params.showFileSelectors = true;
                document.getElementById('hideFileSelectors').style.display = 'inline';
                document.getElementById('btnConfigure').click();
                var message = params.packagedFile ? ('The packaged file cannot be found!\nPlease check that it is in the "' + params.archivePath +
                    '" folder\nor pick a new ZIM file.') : 'The previously picked file cannot be found!\nPlease pick a new ZIM file.'
                setTimeout(function () {
                    uiUtil.systemAlert(message);
                }, 10);
            }
        });
        document.getElementById('hideFileSelectors').style.display = params.showFileSelectors ? 'inline' : 'none';
    }
} else {
    // If DeviceStorage is not available, we display the file select components
    document.getElementById('btnRescanDeviceStorage').click();
    if (document.getElementById('archiveFilesLegacy').files && document.getElementById('archiveFilesLegacy').files.length > 0) {
        // Archive files are already selected,
        setLocalArchiveFromFileSelect();
    } else {
        document.getElementById('btnConfigure').click();
        searchForArchivesInPreferencesOrStorage(true);
    }
}

// Display the article when the user goes back in the browser history
var historyPop = function (event) {
    if (event.state) {
        var title = event.state.title;
        var titleSearch = event.state.titleSearch;
        appstate.target = event.target.kiwixType;
        // Select the correct window to which to write the popped history in case the user
        // siwtches to a tab and navigates history without first clicking on a link
        if (appstate.target === 'window') articleWindow = event.target;
        prefix.value = '';
        document.getElementById('welcomeText').style.display = 'none';
        uiUtil.clearSpinner();
        document.getElementById('configuration').style.display = 'none';
        document.getElementById('articleListWithHeader').style.display = 'none';
        const articleContent = document.getElementById('articleContent');
        const articleContentDoc = articleContent ? articleContent.contentDocument : null;
        while (articleContentDoc.firstChild) articleContentDoc.removeChild(articleContentDoc.firstChild);
        if (title && !(title === '')) {
            goToArticle(title);
        } else if (titleSearch && titleSearch !== '') {
            prefix.value = titleSearch;
            if (titleSearch !== appstate.search.prefix) {
                searchDirEntriesFromPrefix(titleSearch);
            } else {
                prefix.focus();
            }
        }
    }
};

window.onpopstate = historyPop;

/**
 * Populate the drop-down list of archives with the given list
 * @param {Array.<String>} archiveDirectories
 */
function populateDropDownListOfArchives (archiveDirectories, displayOnly) {
    document.getElementById('chooseArchiveFromLocalStorage').style.display = '';
    document.getElementById('rescanStorage').style.display = params.rescan ? 'none' : 'block';
    document.getElementById('openLocalFiles').style.display = params.rescan ? 'block' : 'none';
    var plural = 's';
    plural = archiveDirectories.length === 1 ? '' : plural;
    document.getElementById('archiveNumber').innerHTML = '<b>' + archiveDirectories.length + '</b> Archive' + plural + ' found in selected location';
    var usage = document.getElementById('usage');
    archiveList.options.length = 0;
    for (var i = 0; i < archiveDirectories.length; i++) {
        var archiveDirectory = archiveDirectories[i];
        if (archiveDirectory === '/') {
            uiUtil.systemAlert('It looks like you have put some archive files at the root of your sdcard (or internal storage). Please move them in a subdirectory');
        } else {
            archiveList.options[i] = new Option(archiveDirectory, archiveDirectory);
        }
    }
    // Store the list of archives in settingsStore, to avoid rescanning at each start
    settingsStore.setItem('listOfArchives', archiveDirectories.join('|'), Infinity);
    if (!/Android|iOS/.test(params.appType)) {
        archiveList.size = archiveList.length > 15 ? 15 : archiveList.length;
        if (archiveList.length > 1) archiveList.removeAttribute('multiple');
        if (archiveList.length === 1) archiveList.setAttribute('multiple', '1');
    }
    if (archiveList.options.length > 0) {
        // If we're doing a rescan, then don't attempt to jump to the last selected archive, but leave selectors open
        var lastSelectedArchive = params.rescan ? '' : params.storedFile;
        if (lastSelectedArchive) {
            // console.debug('Last selected archive: ' + lastSelectedArchive);
            // Attempt to select the corresponding item in the list, if it exists
            var success = false;
            var arrayOfOptionValues = Array.apply(null, archiveList.options).map(function (el) { return el.text; })
            // console.debug('Archive list: ' + arrayOfOptionValues);
            if (~arrayOfOptionValues.indexOf(lastSelectedArchive)) {
                archiveList.value = lastSelectedArchive;
                success = true;
                settingsStore.setItem('lastSelectedArchive', lastSelectedArchive, Infinity);
            }
            if (displayOnly) return;
            // Set the localArchive as the last selected (if none has been selected previously, wait for user input)
            if (success) {
                setLocalArchiveFromArchiveList(lastSelectedArchive);
            } else {
                // We can't find lastSelectedArchive in the archive list
                // Warn user that the file they wanted is no longer available
                var message = '<p>We could not find the archive <b>' + lastSelectedArchive + '</b>!</p><p>Please select its location...</p>';
                if (params.webkitdirectory && !window.fs || typeof Windows !== 'undefined' && typeof Windows.Storage !== 'undefined') {
                    message += '<p><i>Note:</i> If you drag-drop ' + (window.showOpenFilePicker ? 'a <b>split</b>' : 'an') + ' archive into this app, then it will have to be dragged again each time you launch the app. Try ';
                    message += typeof Windows !== 'undefined' ? 'double-clicking on the archive instead, or ' : '';
                    message += 'selecting it using the controls on this page.</p>';
                }
                if (document.getElementById('configuration').style.display === 'none') {
                    document.getElementById('btnConfigure').click();
                }
                uiUtil.systemAlert(message).then(function () {
                    displayFileSelect();
                });
            }
        }
        usage.style.display = 'none';
    } else {
        usage.style.display = 'block';
        // No ZIM files, so if Configuration is not displayed, display it and open file selectors
        setTimeout(function () {
            if (document.getElementById('configuration').style.display === 'none') {
                document.getElementById('btnConfigure').click();
            }
            displayFileSelect();
        }, 250);
    }
}

/**
 * Sets the localArchive from the selected archive in the drop-down list
 */
function setLocalArchiveFromArchiveList (archive) {
    params.rescan = false;
    archive = archive || document.getElementById('archiveList').value;
    if (archive && archive.length > 0) {
        // Now, try to find which DeviceStorage has been selected by the user
        // It is the prefix of the archive directory
        var regexpStorageName = /^\/([^/]+)\//;
        var regexpResults = regexpStorageName.exec(archive);
        var selectedStorage = null;
        if (regexpResults && regexpResults.length > 0) {
            var selectedStorageName = regexpResults[1];
            for (var i = 0; i < storages.length; i++) {
                var storage = storages[i];
                if (selectedStorageName === storage.storageName) {
                    // We found the selected storage
                    selectedStorage = storage;
                }
            }
            if (selectedStorage === null) {
                uiUtil.systemAlert('Unable to find which device storage corresponds to archive ' + archive);
            }
        } else {
            // This happens when the archive is not prefixed by the name of the storage
            // (in the Simulator, or with FxOs 1.0, or probably on devices that only have one device storage)
            // In this case, we use the first storage of the list (there should be only one)
            if (storages.length === 1) {
                selectedStorage = storages[0];
            } else { // IT'S NOT FREAKIN FFOS!!!!!!!!!!
                // Patched for UWP support:
                if (!params.pickedFile && params.pickedFolder && typeof MSApp !== 'undefined') {
                    var query = params.pickedFolder.createFileQuery();
                    query.getFilesAsync().done(function (files) {
                        var file;
                        var fileset = [];
                        if (files) {
                            for (var i = 0; i < files.length; i++) {
                                if (files[i].name == archive) {
                                    file = files[i];
                                    break;
                                }
                            }
                            if (file) {
                                if (/\.zim\w\w$/i.test(file.name)) {
                                    var genericFileName = file.name.replace(/(\.zim)\w\w$/i, '$1');
                                    var testFileName = new RegExp(genericFileName + '\\w\\w$');
                                    for (i = 0; i < files.length; i++) {
                                        if (testFileName.test(files[i].name)) {
                                            // This converts a UWP storage file object into a standard JavaScript web file object
                                            fileset.push(MSApp.createFileFromStorageFile(files[i]));
                                        }
                                    }
                                } else {
                                    // This converts a UWP storage file object into a standard JavaScript web file object
                                    fileset.push(MSApp.createFileFromStorageFile(file));
                                }
                            }
                        }
                        if (fileset.length) {
                            setLocalArchiveFromFileList(fileset, true);
                        } else {
                            console.error('The picked file could not be found in the selected folder!\n' + params.pickedFile);
                            var archiveList = [];
                            for (i = 0; i < files.length; i++) {
                                if (/\.zim(aa)?$/i.test(files[i].name)) {
                                    archiveList.push(files[i].name);
                                }
                            }
                            populateDropDownListOfArchives(archiveList);
                            document.getElementById('btnConfigure').click();
                        }
                    });
                    return;
                } else if (!params.pickedFile && params.pickedFolder && params.pickedFolder.kind) {
                    // Native FS support
                    return cache.verifyPermission(params.pickedFolder).then(function (permission) {
                        if (!permission) {
                            console.log('User denied permission to access the folder');
                            openCurrentArchive.style.display = 'inline';
                            return;
                        } else if (params.pickedFolder.kind === 'directory') {
                            return processNativeDirHandle(params.pickedFolder, function (files) {
                                processDirectoryOfFiles(files, archive);
                            });
                        }
                        openCurrentArchive.style.display = 'none';
                    }).catch(function () {
                        openCurrentArchive.style.display = 'inline';
                    });
                } else if (window.fs) {
                    if (params.pickedFile) {
                        setLocalArchiveFromFileList([params.pickedFile], true);
                    } else {
                        if (params.pickedFolder) {
                            readNodeDirectoryAndCreateNodeFileObjects(params.pickedFolder, archive)
                            .then(function (fileset) {
                                var selectedFiles = fileset[0];
                                if (appstate.selectedArchive && appstate.selectedArchive.file._files[0].name === selectedFiles[0].name) {
                                    document.getElementById('btnHome').click();
                                } else {
                                    setLocalArchiveFromFileList(selectedFiles);
                                }
                            }).catch(function (err) {
                                console.error(err);
                            });
                        } else {
                            uiUtil.systemAlert('We could not find the location of the file ' + archive +
                                '. This can happen if you dragged and dropped a file into the app. Please use the file or folder pickers instead.');
                            if (document.getElementById('configuration').style.display === 'none') {
                                document.getElementById('btnConfigure').click();
                            }
                            displayFileSelect();
                        }
                    }
                    return;
                } else if (params.pickedFolder && params.webkitdirectory || archiveDirLegacy.files.length) {
                    processDirectoryOfFiles(archiveDirLegacy.files, archive);
                    return;
                } else { // Check if user previously picked a specific file rather than a folder
                    if (params.pickedFile && typeof MSApp !== 'undefined') {
                        try {
                            selectedStorage = MSApp.createFileFromStorageFile(params.pickedFile);
                            setLocalArchiveFromFileList([selectedStorage], true);
                        } catch (err) {
                            // Probably user has moved or deleted the previously selected file
                            uiUtil.systemAlert('The previously picked archive can no longer be found!');
                            console.error('Picked archive not found: ' + err);
                        }
                        return;
                    } else if (params.pickedFile && typeof window.showOpenFilePicker === 'function') {
                        // Native FS API for single file
                        setLocalArchiveFromFileList([params.pickedFile], true);
                        return;
                    } else if (params.pickedFile && params.webkitdirectory) {
                        // Webkitdirectory API for single file
                        setLocalArchiveFromFileList(archiveFilesLegacy.files, true);
                        return;
                    }
                }
                // There was no picked file or folder, so we'll try setting the default localStorage
                // if (!params.pickedFolder) {
                // This gets called, for example, if the picked folder or picked file are in FutureAccessList but now are
                // no longer accessible. There will be a (handled) error in cosole log, and params.pickedFolder and params.pickedFile will be blank
                if (params.localStorage) {
                    scanUWPFolderforArchives(params.localStorage);
                } else if (params.pickedFile && params.pickedFile.name) {
                    // We already have a file handle, which means the file is already loaded or can be loaded
                    if (!appstate.selectedArchive) {
                        setLocalArchiveFromFileList([params.pickedFile], true);
                    } else {
                        document.getElementById('btnHome').click();
                    }
                } else if (archiveFilesLegacy.files.length) {
                    // There are files already loaded, so see if the selected file is one of those
                    setLocalArchiveFromFileList(archiveFilesLegacy.files, true);
                } else {
                    var btnConfigure = document.getElementById('btnConfigure');
                    if (!btnConfigure.classList.contains('active')) btnConfigure.click();
                    document.getElementById('archiveFile').click();
                }
                return;
                // }
            }
        }
        // Show spinner with archive name
        uiUtil.pollSpinner('Loading ' + archive + '...', true);
        zimArchiveLoader.loadArchiveFromDeviceStorage(selectedStorage, archive, archiveReadyCallback, function (message, label) {
            // callbackError which is called in case of an error
            uiUtil.systemAlert(message, label);
        });
    }
}

/**
 * Processes all the given fileHandles (which should be the fileHandles of the ZIM files in a directory) and matches them to the requested archive.
 * In particular, it deals with split archives, gathering all the file parts. Intended for use with the File System API.
 *
 * @param {Array<FileSystemHandle>} fileHandles A set of fileHandles in a directory
 * @param {String} archive The name of the archive to be loaded, or of the first split part (.zimaa)
 */
function processDirectoryOfFiles (fileHandles, archive) {
    var fileHandle;
    var fileset = [];
    if (fileHandles) {
        for (var i = 0; i < fileHandles.length; i++) {
            if (fileHandles[i].name === archive) {
                fileHandle = fileHandles[i];
                break;
            }
        }
        if (fileHandle) {
            // Deal with split archives
            if (/\.zim\w\w$/i.test(fileHandle.name)) {
                var genericFileName = fileHandle.name.replace(/(\.zim)\w\w$/i, '$1');
                var testFileName = new RegExp(genericFileName + '\\w\\w$');
                for (i = 0; i < fileHandles.length; i++) {
                    if (testFileName.test(fileHandles[i].name)) {
                        if (fileHandles[i].getFile) {
                            // This gets a JS File object from a file handle
                            fileset.push(fileHandles[i].getFile().then(function (file) {
                                return file;
                            }));
                        } else {
                            fileset.push(fileHandles[i]);
                        }
                    }
                }
            } else {
                // Deal with single unslpit archive
                if (fileHandle.getFile) {
                    fileset.push(fileHandle.getFile().then(function (file) {
                        return file;
                    }));
                } else {
                    fileset.push(fileHandle);
                }
            }
            if (fileset.length) {
                // Wait for all getFile Promises to resolve
                Promise.all(fileset).then(function (resolvedFiles) {
                    setLocalArchiveFromFileList(resolvedFiles, true);
                });
            } else {
                console.error('There was an error reading the picked file(s)!');
            }
        } else {
            console.error('The picked file could not be found in the selected folder!');
            var archiveList = [];
            for (i = 0; i < fileHandles.length; i++) {
                if (/\.zim(aa)?$/i.test(fileHandles[i].name)) {
                    archiveList.push(fileHandles[i].name);
                }
            }
            populateDropDownListOfArchives(archiveList);
            document.getElementById('btnConfigure').click();
        }
    } else {
        console.log('There was an error obtaining the file handle(s).');
    }
}

/**
 * Displays the zone to select files from the archive
 */
function displayFileSelect () {
    document.getElementById('openLocalFiles').style.display = 'block';
    document.getElementById('rescanStorage').style.display = 'none';
}

/** Drag and Drop handling for ZIM files (see kiwix-js#1245 by @D3V-D) **/

// Set a global drop zone, so that whole page is enabled for drag and drop
const globalDropZone = document.getElementById('search-article');
// Keep track of entrance event so we only fire the correct leave event
let enteredElement;

// Add drag-and-drop event listeners
if (!params.disableDragAndDrop) {
    globalDropZone.addEventListener('dragover', handleGlobalDragover);
    globalDropZone.addEventListener('dragleave', handleGlobalDragleave);
    globalDropZone.addEventListener('drop', handleFileDrop);
    globalDropZone.addEventListener('dragenter', handleGlobalDragenter);
}

function handleGlobalDragenter (e) {
    e.preventDefault();
    // Disable pointer-events on children so they don't interfere with dragleave events
    globalDropZone.classList.add('dragging-over');
    enteredElement = e.target;
}

function handleGlobalDragover (e) {
    e.preventDefault();
    if (hasType(e.dataTransfer.types, 'Files') && !hasInvalidType(e.dataTransfer.types)) {
        e.dataTransfer.dropEffect = 'link';
        globalDropZone.classList.add('dragging-over');
        globalDropZone.style.border = '3px dashed red';
        if (document.getElementById('configuration').style.display === 'none') {
            btnConfigure.click();
        }
    }
}

function handleGlobalDragleave (e) {
    e.preventDefault();
    globalDropZone.style.border = '';
    if (enteredElement === e.target) {
        globalDropZone.classList.remove('dragging-over');
        // Only return to page if a ZIM is actually loaded
        if (appstate.selectedArchive !== null && appstate.selectedArchive.isReady()) {
            setTab();
        }
    }
}

function handleIframeDragover (e) {
    e.preventDefault();
    if (hasType(e.dataTransfer.types, 'Files') && !hasInvalidType(e.dataTransfer.types)) {
        globalDropZone.classList.add('dragging-over');
        e.dataTransfer.dropEffect = 'link';
        document.getElementById('btnConfigure').click();
    }
}

function handleIframeDrop (e) {
    e.preventDefault();
    e.stopPropagation();
}

// Add type check for chromium browsers, since they count images on the same page as files
function hasInvalidType (typesList) {
    for (var i = 0; i < typesList.length; i++) {
        // Use indexOf() instead of startsWith() for IE11 support. Also, IE11 uses Text instead of text (and so does Opera).
        // This is not comprehensive, but should cover most cases.
        if (typesList[i].indexOf('image') === 0 || typesList[i].indexOf('text') === 0 || typesList[i].indexOf('Text') === 0 || typesList[i].indexOf('video') === 0) {
            return true;
        }
    }
    return false;
}

// IE11 doesn't support .includes(), so custom function to check for presence of types
function hasType (typesList, type) {
    for (var i = 0; i < typesList.length; i++) {
        if (typesList[i] === type) {
            return true;
        }
    }
    return false;
}

function handleFileDrop (packet) {
    appstate.filesDropped = true;
    packet.stopPropagation();
    packet.preventDefault();
    globalDropZone.style.border = '';
    globalDropZone.classList.remove('dragging-over');
    var items = packet.dataTransfer.items;
    // Turn off OPFS if it is on
    if (params.useOPFS) {
        document.getElementById('useOPFSCheck').click();
        params.pickedFolder = '';
        params.storedFile = '';
    }
    // When dropping multiple files (e.g. a split archive), we cannot use the File System Access API
    if (items && items.length === 1 && items[0].kind === 'file' && typeof items[0].getAsFileSystemHandle !== 'undefined') {
        items[0].getAsFileSystemHandle().then(function (handle) {
            if (handle.kind === 'file') {
                processNativeFileHandle(handle);
            } else if (handle.kind === 'directory') {
                processNativeDirHandle(handle);
            }
        });
    } else {
        var files = packet.dataTransfer.files;
        // Try to store the dragged files (in at least IE11, this is read only, so we have to wrap in try ... catch)
        try {
            archiveFilesLegacy.files = files;
        } catch (err) {
            console.warn('Unable to store dropped files in legacy file picker, so selecting first file if not split', err);
            if (!/\.zim\w\w$/i.test(files[0].name) && files.length > 1) {
                uiUtil.systemAlert('You have dropped multiple files, but in older browsers only the first can be loaded. Please drop only one file at a time in this browser, or use the file picker to pick more.');
                files = [files[0]];
            }
        }
        document.getElementById('openLocalFiles').style.display = 'none';
        document.getElementById('rescanStorage').style.display = 'block';
        document.getElementById('usage').style.display = 'none';
        // We have to void the previous picked folder, because dragged files don't have a folder
        // This also prevents a file-not-found alert to the user when picking a new directory
        params.pickedFolder = null;
        settingsStore.setItem('pickedFolder', '', Infinity);
        params.pickedFile = null;
        params.storedFile = null;
        params.rescan = false;
        setLocalArchiveFromFileList(files);
        // Delete any previous file system handle (as otherwise, it will get inadvertienly reloaded)
        cache.idxDB('delete', 'pickedFSHandle', function () {});
    }
}

function pickFileUWP () { // Support UWP FilePicker [kiwix-js-pwa #3]
    // Create the picker object and set options
    var filePicker = new Windows.Storage.Pickers.FileOpenPicker();
    filePicker.suggestedStartLocation = Windows.Storage.Pickers.PickerLocationId.downloads;
    // Filter folder contents
    filePicker.fileTypeFilter.replaceAll(['.zim']);
    filePicker.pickSingleFileAsync().then(processPickedFileUWP);
}

function pickFileNativeFS () {
    return window.showOpenFilePicker({ multiple: false }).then(function (fileHandle) {
        return processNativeFileHandle(fileHandle[0]);
    }).catch(function (err) {
        // This is normal if the user is starting the app for the first time
        console.warn('User cancelled file picker, or else it is not possible to access the file system programmatically', err);
    });
}

// Electron file pickers
if (window.dialog) {
    dialog.on('file-dialog', function (fullPath) {
        console.log('Path: ' + fullPath);
        fullPath = fullPath.replace(/\\/g, '/');
        var pathParts = fullPath.match(/^(.+[/\\])([^/\\]+)$/i);
        params.rescan = false;
        createFakeFileObjectNode(pathParts[2], fullPath, processFakeFile);
    });
    dialog.on('dir-dialog', function (fullPath) {
        console.log('Path: ' + fullPath);
        fullPath = fullPath.replace(/\\/g, '/');
        scanNodeFolderforArchives(fullPath);
    });
}

function processFakeFile (fakeFileList) {
    var fakeFile = fakeFileList[0];
    if (fakeFile.size) {
        params.pickedFile = fakeFile;
        params.storedFile = fakeFile.name;
        params.storedFilePath = fakeFile.path;
        settingsStore.removeItem('pickedFolder');
        params.pickedFolder = '';
        if (window.nw && window.showOpenFilePicker) {
            populateDropDownListOfArchives([fakeFile.name]);
        } else {
            populateDropDownListOfArchives([fakeFile.name]);
            if (!params.rescan) setLocalArchiveFromFileList([fakeFile]);
        }
    } else {
        // This shouldn't happen!
        params.showFileSelectors = true;
        document.getElementById('hideFileSelectors').style.display = 'inline';
        document.getElementById('btnConfigure').click();
        setTimeout(function () {
            uiUtil.systemAlert('The packaged file cannot be loaded!\nPlease check that it is in the "' + params.archivePath + '" folder\nor pick a new ZIM file.');
        }, 10);
    }
}

function pickFolderNativeFS () {
    window.showDirectoryPicker().then(function (dirHandle) {
        // Do not attempt to jump to file if permission is needed (we have to let user choose)
        if (params.useOPFS) params.rescan = false;
        else params.rescan = true;
        return processNativeDirHandle(dirHandle);
    }).catch(function (err) {
        console.error('Error reading directory', err);
    });
}

function processNativeFileHandle (fileHandle) {
    // console.debug('Processing Native File Handle for: ' + fileHandle.name + ' and storedFile: ' + params.storedFile);
    var handle = fileHandle;
    // Serialize fileHandle to indexedDB
    cache.idxDB('pickedFSHandle', fileHandle, function (val) {
        console.debug('IndexedDB responded with ' + val);
    });
    settingsStore.setItem('lastSelectedArchive', fileHandle.name, Infinity);
    params.storedFile = fileHandle.name;
    params.pickedFolder = null;
    return fileHandle.getFile().then(function (file) {
        file.handle = handle;
        params.pickedFile = file;
        params.rescan = false;
        populateDropDownListOfArchives([file.name]);
    });
}

function processPickedFileUWP (file) {
    if (file) {
        if (params.falFolderToken && /\.zim\w\w$/i.test(file.name)) {
            // This is a split file in a picked folder, so we need to process differently
            params.pickedFile = '';
            setLocalArchiveFromArchiveList([file]);
            return;
        }
        // Cache file so the contents can be accessed at a later time
        Windows.Storage.AccessCache.StorageApplicationPermissions.futureAccessList.addOrReplace(params.falFileToken, file);
        params.pickedFile = file;
        if (params.pickedFolder) Windows.Storage.AccessCache.StorageApplicationPermissions.futureAccessList.remove(params.falFolderToken);
        params.pickedFolder = '';
        settingsStore.setItem('lastSelectedArchive', file.name, Infinity);
        params.storedFile = file.name;
        // Since we've explicitly picked a file, we should jump to it
        params.rescan = false;
        populateDropDownListOfArchives([file.name], true);
        setLocalArchiveFromArchiveList([file.name]);
    } else {
        // The picker was dismissed with no selected file
        console.log('User closed folder picker without picking a file');
    }
}

function pickFolderUWP () { // Support UWP FilePicker [kiwix-js-pwa #3]
    var folderPicker = new Windows.Storage.Pickers.FolderPicker();
    folderPicker.suggestedStartLocation = Windows.Storage.Pickers.PickerLocationId.downloads;
    folderPicker.fileTypeFilter.replaceAll(['.zim', '.dat', '.idx', '.txt', '.zimaa']);

    folderPicker.pickSingleFolderAsync().done(function (folder) {
        if (folder) {
            scanUWPFolderforArchives(folder);
        }
    });
}

function processNativeDirHandle (dirHandle, callback) {
    // console.debug('Processing Native Directory Handle for: ' + dirHandle + ' and storedFile: ' + params.storedFile);
    // Serialize dirHandle to indexedDB
    cache.idxDB('pickedFSHandle', dirHandle, function (val) {
        console.debug('IndexedDB responded with ' + val);
    });
    params.pickedFolder = dirHandle;
    params.pickedFile = '';
    var archiveDisplay = document.getElementById('chooseArchiveFromLocalStorage');
    archiveDisplay.style.display = 'block';
    var iterableEntryList = dirHandle.entries();
    return cache.iterateAsyncDirEntries(iterableEntryList, [], !!callback).then(function (archiveList) {
        var noZIMFound = document.getElementById('noZIMFound');
        var hasArchives = archiveList.length > 0;
        if (!hasArchives) console.warn('No archives found in directory ' + dirHandle.name);
        if (callback) {
            callback(archiveList);
        } else {
            noZIMFound.style.display = hasArchives ? 'none' : 'block';
            populateDropDownListOfArchives(archiveList, !hasArchives);
        }
    }).catch(function (err) {
        uiUtil.systemAlert('<p>We could not find your archive! Is the location or file still available? Try picking the file or folder again.</p>' +
        '<p>[System error message: ' + err.message + ']</p>', 'Error!');
    });
}

function scanNodeFolderforArchives (folder, callback) {
    // var stackTrace = Error().stack;
    // console.debug('Stack trace: ' + stackTrace);
    if (folder) {
        window.fs.readdir(folder, function (err, files) {
            if (err) console.error('There was an error reading files in the folder: ' + err.message, err);
            else {
                params.pickedFolder = folder;
                settingsStore.setItem('pickedFolder', params.pickedFolder, Infinity);
                params.pickedFile = '';
                processFilesArray(files, callback);
            }
        });
    } else {
        // The picker was dismissed with no selected file
        console.log('User closed folder picker without picking a file');
    }
}

function scanUWPFolderforArchives (folder) {
    if (folder) {
        // Application now has read/write access to all contents in the picked folder (including sub-folder contents)
        // Cache folder so the contents can be accessed at a later time
        Windows.Storage.AccessCache.StorageApplicationPermissions.futureAccessList.addOrReplace(params.falFolderToken, folder);
        params.pickedFolder = folder;
        // Query the folder.
        var query = folder.createFileQuery();
        query.getFilesAsync().done(function (files) {
            processFilesArray(files, function (resolvedFiles) {
                // If there is only one file in the folder, we should load it
                if ((resolvedFiles.length === 1 || params.storedFile) && !params.rescan) {
                    var fileToLoad = params.storedFile || resolvedFiles[0].name;
                    setLocalArchiveFromArchiveList(fileToLoad);
                }
            });
        });
    } else {
        // The picker was dismissed with no selected file
        console.log('User closed folder picker without picking a file');
    }
}

function processFilesArray (files, callback) {
    // Display file list
    var archiveDisplay = document.getElementById('chooseArchiveFromLocalStorage');
    if (files) {
        var archiveList = [];
        files.forEach(function (file) {
            if (/\.zim(aa)?$/i.test(file.fileType) || /\.zim(aa)?$/i.test(file) || /\.zim(aa)?$/i.test(file.name)) {
                archiveList.push(file.name || file);
            }
        });
        if (archiveList.length) {
            document.getElementById('noZIMFound').style.display = 'none';
            populateDropDownListOfArchives(archiveList, true);
            if (callback) callback(files, archiveList);
            return;
        }
    }
    archiveDisplay.style.display = 'block';
    document.getElementById('noZIMFound').style.display = 'block';
    document.getElementById('archiveList').options.length = 0;
    document.getElementById('archiveList').size = 0;
    document.getElementById('archiveNumber').innerHTML = '<b>0</b> Archives found in local storage (tap "Select storage" to select an archive location)';
    if (/UWP/.test(params.appType)) Windows.Storage.AccessCache.StorageApplicationPermissions.futureAccessList.remove(params.falFolderToken);
}

/**
 * Sets the local archive from an array of File objects
 * @param {Array<File>} files An array of File objects
 * @param {Boolean} fromArchiveList Indicates that the file was picked from the archive list, so don't re-populate list
 * @returns A callback function that resolves when the archive is loaded
 */
function setLocalArchiveFromFileList (files, fromArchiveList) {
    if (!files.length) {
        if (document.getElementById('configuration').style.display == 'none') {
            document.getElementById('btnConfigure').click();
        }
        displayFileSelect();
        return;
    }
    // Check for usable file types
    var firstSplitFileIndex = null;
    var storedFileIndex = null;
    var fileNames = [];
    for (var i = files.length; i--;) {
        // DEV: you can support other file types by adding (e.g.) '|dat|idx' after 'zim\w{0,2}'
        if (!/\.(?:zim\w{0,2})$/i.test(files[i].name)) {
            uiUtil.systemAlert('One or more files does not appear to be a ZIM file!');
            return;
        }
        // Add file names to array
        if (/\.zim(aa)?$/i.test(files[i].name)) fileNames.push(files[i].name);
        // Note the index of any .zimaa file
        firstSplitFileIndex = /\.zimaa$/i.test(files[i].name) ? i : firstSplitFileIndex;
        // Note the index of the stored file
        storedFileIndex = files[i].name === params.storedFile ? i : storedFileIndex;
        // Allow reading with electron if we have the path info
        if (typeof window.fs !== 'undefined' && files[i].path) {
            files[i].readMode = 'electron';
            console.log('File path is: ' + files[i].path);
            if (files.length === 1 || ~firstSplitFileIndex) {
                params.pickedFile = files[i].path;
                settingsStore.setItem('pickedFile', params.pickedFile, Infinity);
            }
        }
    }
    var noZIMFound = document.getElementById('noZIMFound');
    if (fileNames.length) {
        noZIMFound.style.display = 'none';
    } else {
        noZIMFound.style.display = '';
    }
    // If there was only one file chosen (or set of split ZIMs, but we only store zimaa), select it
    if (fileNames.length === 1 || firstSplitFileIndex !== null) storedFileIndex = firstSplitFileIndex || 0;
    // Populate the list of archives with the newly selected file(s)
    if (!fromArchiveList) populateDropDownListOfArchives(fileNames, true);
    // Check that user hasn't picked just part of split ZIM
    if (fileNames.length === 1 && firstSplitFileIndex && files.length === 1) {
        return uiUtil.systemAlert('<p>You have picked only part of a split archive!</p><p>Please select its folder in Config, ' +
            'or drag and drop <b>all</b> of its parts into Config.</p>').then(function () {
                if (document.getElementById('configuration').style.display === 'none') {
                    document.getElementById('btnConfigure').click();
                }
                displayFileSelect();
            }
        );
    }
    // If a picked file name is already in the archive list, try to select it in the list
    if (archiveList && files[storedFileIndex]) {
        archiveList.value = files[storedFileIndex].name;
    }
    // We should not proceed if there is no selected archive
    if (!archiveList.value) {
        return;
    }
    // If we only picked one archive, display it
    if (fileNames.length === 1) {
        params.rescan = false;
    }
    // If the number of files is greater than one and the user hasn't selected a split archive, then set files to the selected file index
    if (files.length > 1 && firstSplitFileIndex === null) {
        files = [files[storedFileIndex]];
    }
    // Show the spinner
    uiUtil.pollSpinner('Loading archive ' + files[0].name + '...', true);
    // TODO: Turn this into a Promise
    zimArchiveLoader.loadArchiveFromFiles(files, archiveReadyCallback, function (message, label) {
        // callbackError which is called in case of an error
        uiUtil.systemAlert(message, label);
    });
}

/**
 * Verifies the given archive and switches contentInjectionMode accourdingly
 * Code to undertake the verification adapted from kiwix/kiwix-js #1192 kindly authored by @Greeshmanth1909
 *
 * @param {Object} archive The archive that needs verification
 *
 */
function verifyLoadedArchive (archive) {
    return uiUtil.systemAlert('<p><b>Is this ZIM archive from a trusted source?</b> If in doubt, we strongly recommend you open it in Restricted mode.</p><p style="border: 1px solid;padding:5px;">' +
      'Name:&nbsp;<b>' + archive.file.name + '</b><br />' +
      'Creator:&nbsp;<b>' + archive.creator + '</b><br />' +
      'Publisher:&nbsp;<b>' + archive.publisher + '</b><br />' +
      'Scraper:&nbsp;<b>' + archive.scraper + '</b><br />' +
      '</p><p><b><i>Warning: above data can easily be spoofed!</i></b></p>' +
      '</p><p><i>If you mark the file as trusted, this alert will not show again.</i> (Security checks can be disabled in Expert Settings.)</p>',
    'Security alert!', true, 'Open in Restricted mode', 'Trust source').then(response => {
        if (response) {
            params.contentInjectionMode = 'serviceworker';
            var trustedZimFiles = settingsStore.getItem('trustedZimFiles');
            var updatedTrustedZimFiles = trustedZimFiles + archive.file.name + '|';
            settingsStore.setItem('trustedZimFiles', updatedTrustedZimFiles, Infinity);
            // Change radio buttons accordingly
            document.getElementById('serviceworkerModeRadio').checked = true;
        } else {
            // Switch to Restricted mode
            params.contentInjectionMode = 'jquery';
            document.getElementById('jQueryModeRadio').checked = true;
        }
    });
}

/**
 * Functions to be run immediately after the archive is loaded
 *
 * @param {ZIMArchive} archive The ZIM archive
 */
function archiveReadyCallback (archive) {
    appstate.selectedArchive = archive;
    // A blob cache significantly speeds up the loading of CSS files
    appstate.selectedArchive.cssBlobCache = new Map();
    // As a new ZIM only opens in the iframe, we need to reset the pointers in case they were changed
    articleContainer = document.getElementById('articleContent');
    articleContainer.kiwixType = 'iframe';
    articleWindow = articleContainer.contentWindow;
    uiUtil.clearSpinner();
    // When a new ZIM is loaded, we turn this flag to null, so that we don't get false positive attempts to use the Worker
    // It will be defined as false or true when the first article is loaded
    appstate.isReplayWorkerAvailable = null;
    // Initialize the Service Worker
    if (params.contentInjectionMode === 'serviceworker') {
        initServiceWorkerMessaging();
    }
    // Ensure that the new ZIM output is initially sent to the iframe (e.g. if the last article was loaded in a window)
    // (this only affects Restricted mode)
    appstate.target = 'iframe';
    appstate.wikimediaZimLoaded = /wikipedia|wikivoyage|mdwiki|wiktionary/i.test(archive.file.name);
    appstate.pureMode = false;
    // Reset params.assetsCache in case it was changed below
    params.assetsCache = settingsStore.getItem('assetsCache') !== 'false';
    params.imageDisplayMode = params.imageDisplay ? 'progressive' : 'manual';
    // These ZIM types have so much dynamic content that we have to allow all images
    if (/gutenberg|phet|(?:^|_)ted_/i.test(archive.file.name) ||
      // params.isLandingPage ||
      /kolibri/i.test(archive.creator) ||
      archive.zimType !== 'open') {
        if (params.imageDisplay) params.imageDisplayMode = 'all';
        if (params.zimType !== 'zimit') {
            // For some archive types (zimit2, Gutenberg, PhET, Kolibri at least), we have to get out of the way and allow the Service Worker
            // to act as a transparent passthrough (this key will be read in the handleMessageChannelMessage function)
            console.debug('*** Activating pureMode for ZIM: ' + archive.file.name + ' ***');
            appstate.pureMode = true;
        }
        // Turn off the assetsCache for now in Restricted mode
        // @TODO: Check why it works better with it off for Zimit archives in Restricted mode!
        if (/zimit/.test(archive.zimType)) {
            params.assetsCache = params.contentInjectionMode !== 'jquery';
        }
    }
    if (params.contentInjectionMode === 'serviceworker') {
        if (!appstate.wikimediaZimLoaded) {
            if (params.manipulateImages) document.getElementById('manipulateImagesCheck').click();
            if (settingsStore.getItem('displayHiddenBlockeElements') === 'auto') params.displayHiddenBlockElements = false;
            if (params.allowHTMLExtraction) document.getElementById('allowHTMLExtractionCheck').click();
            // Set defaults that allow for greatest compabitibility with Zimit ZIM types
            if (/zimit/.test(params.zimType)) {
                var determinedTheme = params.cssTheme == 'auto' ? cssUIThemeGetOrSet('auto', true) : params.cssTheme;
                // Originally we only selected darkReader if auto had been selected, but this is confusing, so
                // we now always select it if the theme is dark and the ZIM type is zimit (1 or 2)
                // if (params.cssTheme === 'auto' && determinedTheme !== 'light' && !/UWP/.test(params.appType)) {
                if (determinedTheme !== 'light' && !/UWP/.test(params.appType)) {
                    params.cssTheme = 'darkReader';
                    document.getElementById('cssWikiDarkThemeDarkReaderCheck').checked = true;
                }
                if (!params.windowOpener) {
                    params.noWarning = true;
                    document.getElementById('tabOpenerCheck').click();
                    params.noWarning = false;
                }
            }
        } else {
            params.noWarning = true;
            if (!params.manipulateImages) document.getElementById('manipulateImagesCheck').click();
            if (settingsStore.getItem('displayHiddenBlockeElements') === 'auto') params.displayHiddenBlockElements = 'auto';
            params.noWarning = false;
            params.cssTheme = settingsStore.getItem('cssTheme') || 'light';
            // if (params.cssTheme === 'auto') {
                document.getElementById('cssWikiDarkThemeDarkReaderCheck').checked = false;
            // }
        }
    }
    // The archive is set : go back to home page to start searching
    params.storedFile = archive.file._files[0].name;
    params.storedFilePath = archive.file._files[0].path ? archive.file._files[0].path : '';
    settingsStore.setItem('lastSelectedArchive', params.storedFile, Infinity);
    settingsStore.setItem('lastSelectedArchivePath', params.storedFilePath, Infinity);
    if (!~params.lastPageVisit.indexOf(params.storedFile.replace(/\.zim(\w\w)?$/, ''))) {
        // The archive has changed, so we must blank the last page
        params.lastPageVisit = '';
        params.lastPageHTML = '';
    }
    // If we have dragged and dropped files into an Electron app, we should have access to the path, so we should store it
    if (appstate.filesDropped && params.storedFilePath) {
        params.pickedFolder = null;
        params.pickedFile = params.storedFilePath;
        settingsStore.setItem('pickedFolder', '', Infinity);
        settingsStore.setItem('pickedFile', params.pickedFile, Infinity);
        populateDropDownListOfArchives([params.storedFile], true);
        settingsStore.setItem('listOfArchives', encodeURI(params.storedFile), Infinity);
        // We have to remove the file handle to prevent it from launching next time
        cache.idxDB('delete', 'pickedFSHandle', function () {
            console.debug('File handle deleted');
        });
        appstate.filesDropped = false;
    }
    var reloadLink = document.getElementById('reloadPackagedArchive');
    if (reloadLink) {
        if (params.packagedFile != params.storedFile) {
            reloadLink.style.display = 'inline';
            reloadLink.removeEventListener('click', loadPackagedArchive);
            reloadLink.addEventListener('click', loadPackagedArchive);
            document.getElementById('usage').style.display = 'none';
        } else {
            reloadLink.style.display = 'none';
            currentArchive.style.display = 'none';
            document.getElementById('usage').style.display = 'inline';
        }
    }
    // This ensures the correct icon is set for the newly loaded archive
    cssUIThemeGetOrSet(params.cssUITheme);
    var displayArchive = function () {
        if (params.rescan) {
            document.getElementById('btnConfigure').click();
            setTimeout(function () {
                document.getElementById('btnConfigure').click();
                params.rescan = false;
            }, 100);
        } else {
            if (typeof Windows === 'undefined' && typeof window.showOpenFilePicker !== 'function' && !params.useOPFS && !window.dialog) {
                document.getElementById('instructions').style.display = 'none';
            } else {
                document.getElementById('openLocalFiles').style.display = 'none';
                document.getElementById('rescanStorage').style.display = 'block';
            }
            document.getElementById('usage').style.display = 'none';
            if (params.rememberLastPage && ~params.lastPageVisit.indexOf(params.storedFile.replace(/\.zim(\w\w)?$/, ''))) {
                var lastPage = params.lastPageVisit.replace(/@kiwixKey@.+/, '');
                goToArticle(lastPage);
            } else {
                document.getElementById('btnHome').click();
            }
        }
    }
    // Set contentInjectionMode to serviceWorker when opening a new archive in case the user switched to Restricted mode/jQuery Mode when opening the previous archive
    if (params.contentInjectionMode === 'jquery') {
        params.contentInjectionMode = settingsStore.getItem('contentInjectionMode');
        // Change the radio buttons accordingly
        switch (settingsStore.getItem('contentInjectionMode')) {
            case 'serviceworker':
                document.getElementById('serviceworkerModeRadio').checked = true;
                // In case we atuo-switched off assetsCache due to switch to Restricted mode, we need to reset
                params.assetsCache = settingsStore.getItem('asetsCache') !== 'false';
                break;
            case 'serviceworkerlocal':
                document.getElementById('serviceworkerLocalModeRadio').checked = true;
                break;
        }
    }
    if (settingsStore.getItem('trustedZimFiles') === null) {
        settingsStore.setItem('trustedZimFiles', '', Infinity);
    }
    if (params.sourceVerification && window.location.protocol !== 'ms-appx-web:' && /^serviceworker/.test(params.contentInjectionMode)) {
        // Check if source of the zim file can be trusted and that it is not a packaged archive
        if (!settingsStore.getItem('trustedZimFiles').includes(archive.file.name) && archive.file._files[0].name !== params.packagedFile &&
          // And it's not an Electron-accessed file inside the app's package
          !(window.electronAPI && archive.file._files[0].path.indexOf(electronAPI.__dirname.replace(/[\\/]+(?:app\.asar)?$/, '') + '/' + params.archivePath) === 0)) {
            verifyLoadedArchive(archive).then(function () {
                displayArchive();
            });
            return;
        }
    }
    displayArchive();
}

function loadPackagedArchive () {
    // Reload any ZIM files in local storage (whcih the user can't otherwise select with the filepicker)

    // Reset params.packagedFile to its original value, in case we manipulated it previously
    params.packagedFile = params.originalPackagedFile;
    params.pickedFile = '';
    settingsStore.removeItem('pickedFolder');
    if (params.localStorage) {
        params.pickedFolder = params.localStorage;
        params.storedFile = params.packagedFile || '';
        scanUWPFolderforArchives(params.localStorage);
    } else if (typeof window.fs !== 'undefined') {
        // We're in an Electron packaged app
        settingsStore.removeItem('lastSelectedArchive');
        settingsStore.removeItem('lastSelectedArchivePath');
        params.lastPageVisit = '';
        if (params.packagedFile && params.storedFile !== params.packagedFile) {
            // If we're in an AppImage package and the storedFilePath points to the packaged archive, then the storedFilePath will be invalid,
            // because a new path is established each time the image's filesystem is mounted. So we reset to default.
            var archiveFilePrefix = params.storedFilePath;
            // If the app is packed inside an asar archive, or is Electron running from localhost, we need to alter the archivePath to point outside the asar directory
            if (window.electronAPI && window.electronAPI.__dirname) {
                archiveFilePrefix = electronAPI.__dirname.replace(/[/\\]app\.asar/, '');
            }
            var archiveDirectory = archiveFilePrefix + '/' + params.archivePath + '/' + params.packagedFile;
            if (~params.storedFilePath.indexOf(archiveFilePrefix)) {
                params.storedFilePath = archiveFilePrefix;
            }
            archiveDirectory = archiveDirectory.replace(/[\\/][^\\/]+$/, '');
            readNodeDirectoryAndCreateNodeFileObjects(archiveDirectory, params.packagedFile).then(function (fileset) {
                var fileObjects = fileset[0], fileNames = fileset[1];
                // params.pickedFile = params.packagedFile;
                params.pickedFolder = params.archivePath;
                settingsStore.setItem('pickedFolder', params.pickedFolder, Infinity);
                params.storedFile = params.packagedFile;
                setLocalArchiveFromFileList(fileObjects);
                populateDropDownListOfArchives(fileNames, true);
            }).catch(function (err) {
                console.error(err);
            });
            // createFakeFileObjectNode(params.packagedFile, params.archivePath + '/' + params.packagedFile, processFakeFile);
        }
    }
}

/**
 * Sets the localArchive from the File selects populated by user
 */
function setLocalArchiveFromFileSelect () {
    setLocalArchiveFromFileList(archiveFilesLegacy.files);
    params.rescan = false;
}
/**
 * Sets the localArchive from the directory selected by user
 */
function setLocalArchiveFromDirSelect () {
    setLocalArchiveFromFileList(archiveDirLegacy.files);
    params.rescan = false;
}

/**
 * Creates a fake file object from the given filename and filepath. This can only be used if the app is running
 * in the Electron framework.
 *
 * @param {String} filename The name of the file to be represented
 * @param {String} filepath The path of the file to be represented
 * @param {Function} callback The function to call back with the constructed file
 */
function createFakeFileObjectNode (filename, filepath, callback) {
    var file = {};
    // For Electron, we need to set an absolute filepath in case the file was launched from a shortcut (and if it's not already absolute)
    if (filepath === params.archivePath + '/' + filename && /^file:/i.test(window.location.protocol)) {
        filepath = decodeURIComponent(window.location.href.replace(/www\/[^/?#]+(?:[?#].*)?$/, '') + filepath);
    }
    // DEV if you get pesky Electron error 'The "path" argument must be one of type string, Buffer, or URL', try commenting below
    // if (/^file:/i.test(filepath)) filepath = new URL(filepath);
    // and uncomment comment line below (seems to depend on node and fs versions) - this line conditionally turns the URL into a filepath string for Windows only
    filepath = /^file:\/+\w:[/\\]/i.test(filepath) ? filepath.replace(/^file:\/+/i, '') : filepath.replace(/^file:\/\//i, '');
    // Remove any drive letter (incompatible with Emscripten NODERAWFS)
    // filepath = filepath.replace(/^\w:/, '');
    file.name = filename;
    file.path = filepath;
    file.readMode = 'electron';
    // Get file size
    window.fs.stat(file.path, function (err, stats) {
        if (err) {
            file.size = null;
            console.error('File cannot be found!', err);
            uiUtil.systemAlert('The archive you are attempting to load (' + file.path + ') cannot be found. Perhaps it has moved?');
            document.getElementById('btnConfigure').click();
        } else {
            file.size = stats.size;
            console.log('Stored file size is: ' + file.size);
        }
        callback([file]);
    });
}

/**
 * Reads a directory using the Node File System API and creates a file object or objects for the requested file or split fileset
 * @param {String} folder The directory path to read
 * @param {String|Array} file The file or split file array to match in the folder (only file[0] will be tested if it is an array)
 * @returns {Promise<Array>} A Promise for the Array of files matching the requested file
 */
function readNodeDirectoryAndCreateNodeFileObjects (folder, file) {
    return new Promise(function (resolve, reject) {
        var selectedFileSet = [], selectedFileNamesSet = [];
        var count = 0;
        var fileHandle = typeof file === 'string' ? file : file[0];
        // Electron may need to handle the path differently
        if (folder === params.archivePath && /^file:/i.test(window.location.protocol)) {
            folder = decodeURIComponent(window.location.href.replace(/www\/[^/?#]+(?:[?#].*)?$/, '') + folder);
        }
        // Check for a Windows-style path and process accordingly to create absolute path appropriate to fs
        folder = /^file:\/+\w:[/\\]/i.test(folder) ? folder.replace(/^file:\/+/i, '') : folder.replace(/^file:\/\//i, '');
        window.fs.readdir(folder, function (err, fileNames) {
            if (err) {
                reject(err);
            } else if (fileNames) {
                // Deal with split archives
                if (/\.zim\w{0,2}$/i.test(fileHandle)) {
                    var genericFileName = fileHandle.replace(/(\.zim)\w\w$/i, '$1');
                    var fileFilter = new RegExp(genericFileName + '\\w\\w$');
                    if (/\.zim$/i.test(fileHandle)) { fileFilter = new RegExp(genericFileName); }
                    for (var i = 0; i < fileNames.length; i++) {
                        // Filter filenames so we only get zim or zimaa
                        if (/\.zim(aa)?$/i.test(fileNames[i])) {
                            selectedFileNamesSet.push(fileNames[i]);
                        }
                        if (fileFilter.test(fileNames[i])) {
                            count++;
                            // This gets a pseudo File object from a file handle
                            createFakeFileObjectNode(fileNames[i], folder + '/' + fileNames[i], function (file) {
                                selectedFileSet.push(file[0]);
                                if (count === selectedFileSet.length) {
                                    resolve([selectedFileSet, selectedFileNamesSet]);
                                }
                            });
                        }
                    }
                    if (!selectedFileNamesSet.length) {
                        reject(new Error('The requested archive is not in the archive folder ' + folder + '!'));
                    } else if (!count) {
                        // It looks like we don't have a matching file, so we should try to load the first one we found
                        createFakeFileObjectNode(selectedFileNamesSet[0], folder + '/' + selectedFileNamesSet[0], function (file) {
                            selectedFileSet.push(file[0]);
                            resolve([selectedFileSet, selectedFileNamesSet]);
                        });
                    }
                } else {
                    reject(new Error('The requested archive does not appear to be a ZIM file!'));
                }
            } else {
                // Folder was empty...
                // createFakeFileObjectNode(fileHandle, folder + '/' + fileHandle, setLocalArchiveFromFileList);
                reject(new Error('No files were found in the folder!'));
            }
         });
    });
}

// Set up the event listener for return to article links
var linkListener = function () {
    setTab();
    if (params.themeChanged) {
        params.themeChanged = false;
        if (history.state !== null) {
            var thisURL = decodeURIComponent(history.state.title);
            goToArticle(thisURL);
        }
    }
};
var returnDivs = document.getElementsByClassName('returntoArticle');
for (i = 0; i < returnDivs.length; i++) {
    returnDivs[i].addEventListener('click', linkListener);
}

/**
 * Reads a remote archive with given URL, and returns the response in a Promise.
 * This function is used by setRemoteArchives below, for UI tests
 *
 * @param {String} url The URL of the archive to read
 * @returns {Promise<Blob>} A promise for the requested file (blob)
 */
function readRemoteArchive (url) {
    return new Promise(function (resolve, reject) {
        var request = new XMLHttpRequest();
        request.open('GET', url);
        request.responseType = 'blob';
        request.onreadystatechange = function () {
            if (request.readyState === XMLHttpRequest.DONE) {
                if (request.status >= 200 && request.status < 300 || request.status === 0) {
                    // Hack to make this look similar to a file
                    request.response.name = url;
                    resolve(request.response);
                } else {
                    reject(new Error('HTTP status ' + request.status + ' when reading ' + url));
                }
            }
        };
        request.onabort = request.onerror = reject;
        request.send();
    });
}

/**
 * This is used in the testing interface to inject remote archives
 * @returns {Promise<Array>} A Promise for an array of archives
 */
window.setRemoteArchives = function () {
    var readRequests = [];
    Array.prototype.slice.call(arguments).forEach(function (arg) {
        readRequests.push(readRemoteArchive(arg));
    });
    return Promise.all(readRequests).then(function (arrayOfArchives) {
        setLocalArchiveFromFileList(arrayOfArchives);
    }).catch(function (e) {
        console.error('Unable to load remote archive(s)', e);
    });
};

/**
 * Handle key input in the prefix input zone
 * @param {Event} evt The event data to handle
 */
function onKeyUpPrefix (evt) {
    // Use a timeout, so that very quick typing does not cause a lot of overhead
    // It is also necessary for the words suggestions to work inside Firefox OS
    if (window.timeoutKeyUpPrefix) {
        window.clearTimeout(window.timeoutKeyUpPrefix);
    }
    window.timeoutKeyUpPrefix = window.setTimeout(function () {
        // Don't process anything if it's the same prefix as recently entered (this prevents searching
        // if user is simply using arrow key to correct something typed).
        if (!/^\s/.test(prefix.value) && prefix.value === appstate.tempPrefix) return;
        if (prefix.value && prefix.value.length > 0 && (prefix.value !== appstate.search.prefix || /^\s/.test(prefix.value))) {
            appstate.tempPrefix = prefix.value;
            document.getElementById('searchArticles').click();
        }
    }, 1000);
}

function listenForNavigationKeys () {
    var listener = function (e) {
        var hit = false;
        if (/^(Arrow)?Left$/.test(e.key) && (e.ctrlKey || e.altKey)) {
            // Ctrl/Alt-Left was pressed
            e.preventDefault();
            if (hit) return;
            hit = true;
            articleWindow.history.back();
        } else if (/^(Arrow)?Right$/.test(e.key) && (e.ctrlKey || e.altKey)) {
            // Ctrl/Alt-Right was pressed
            e.preventDefault();
            if (hit) return;
            hit = true;
            articleWindow.history.forward();
        }
    };
    articleWindow.removeEventListener('keydown', listener);
    articleWindow.addEventListener('keydown', listener);
}

function listenForSearchKeys () {
    // Listen to iframe key presses for in-page search
    var iframeContentWindow = articleWindow;
    if (appstate.isReplayWorkerAvailable) {
        var replayIframe = articleWindow.document.getElementById('replay_iframe');
        if (replayIframe) {
            iframeContentWindow = replayIframe.contentWindow;
        }
    }
    iframeContentWindow.addEventListener('keyup', function (e) {
        // Alt-F for search in article, also patches Ctrl-F for apps that do not have access to browser search
        if ((e.ctrlKey || e.altKey) && e.which == 70) {
            document.getElementById('findText').click();
        }
    });
    iframeContentWindow.addEventListener('keydown', function (e) {
        // Ctrl-P to patch printing support, so iframe gets printed
        if (e.ctrlKey && e.which == 80) {
            e.stopPropagation();
            e.preventDefault();
            printIntercept();
        }
    }, true);
}

/**
 * Search the index for DirEntries with title that start with the given prefix (implemented
 * with a binary search inside the index file)
 * @param {String} prefix The string that must appear at the start of any title searched for
 */
function searchDirEntriesFromPrefix (prefix) {
    if (appstate.selectedArchive !== null && appstate.selectedArchive.isReady()) {
        // Cancel the old search (zimArchive search object will receive this change)
        appstate.search.status = 'cancelled';
        // Initiate a new search object and point appstate.search to it (the zimAcrhive search object will continue to point to the old object)
        appstate.search = { prefix: prefix, status: 'init', type: '', size: params.maxSearchResultsSize };
        uiUtil.hideActiveContentWarning();
        if (!prefix || /^\s/.test(prefix)) {
            var sel = prefix ? prefix.replace(/^\s(.*)/, '$1') : '';
            if (sel.length) {
                sel = sel.replace(/^(.)(.*)/, function (p0, p1, p2) {
                    return p1.toUpperCase() + p2;
                });
            }
            showZIMIndex(null, sel);
        } else {
            appstate.selectedArchive.findDirEntriesWithPrefix(appstate.search, populateListOfArticles);
        }
    } else {
        uiUtil.clearSpinner();
        // We have to remove the focus from the search field,
        // so that the keyboard does not stay above the message
        document.getElementById('searchArticles').focus();
        uiUtil.systemAlert('Archive not set: please select an archive!');
        document.getElementById('btnConfigure').click();
    }
}
/**
 * Extracts and displays in htmlArticle the first params.maxSearchResultsSize articles beginning with start
 * @param {String} start Optional index number to begin the list with
 * @param {String} search Optional search prefix from which to start an alphabetical search
 */
function showZIMIndex (start, search) {
    var searchUrlIndex = /^[-ABCHIJMUVWX]?\//.test(search);
    // If we're searching by title index number (other than 0 or null), we should ignore any prefix
    if (isNaN(start)) {
        search = search || '';
    } else {
        search = start > 0 ? '' : search;
    }
    appstate.search = { prefix: search, state: '', searchUrlIndex: searchUrlIndex, size: params.maxSearchResultsSize, window: params.maxSearchResultsSize };
    if (appstate.selectedArchive !== null && appstate.selectedArchive.isReady()) {
        appstate.selectedArchive.findDirEntriesWithPrefixCaseSensitive(search, appstate.search, function (dirEntryArray, nextStart) {
            var docBody = document.getElementById('mymodalVariableContent');
            var newHtml = '';
            for (var i = 0; i < dirEntryArray.length; i++) {
                var dirEntry = dirEntryArray[i];
                // NB Ensure you use double quotes for HTML attributes below - see comment in populateListOfArticles
                newHtml += '\n<a  class="list-group-item" href="#" dirEntryId="' + encodeURIComponent(dirEntry.toStringId()) +
                    '">' + (appstate.search.searchUrlIndex ? dirEntry.namespace + '/' + dirEntry.url : '' + dirEntry.getTitleOrUrl()) + '</a>';
            }
            start = start || 0;
            var back = start ? '<a href="#" data-start="' + (start - params.maxSearchResultsSize) +
                '" class="continueAnchor">&lt;&lt; Previous ' + params.maxSearchResultsSize + '</a>' : '';
            var next = dirEntryArray.length === params.maxSearchResultsSize ? '<a href="#" data-start="' + nextStart +
                '" class="continueAnchor">Next ' + params.maxSearchResultsSize + ' &gt;&gt;</a>' : '';
            var backNext = back ? next ? back + ' | ' + next : back : next;
            // Only construct the ZIM Index if it is not already displayed
            if (document.getElementById('myModal').style.display !== 'block') {
                backNext = '<div class="backNext" style="float:right;">' + backNext + '</div>\n';
                var alphaSelector = [];
                // Set up the alphabetic selector
                var lower = params.alphaChar.charCodeAt();
                var upper = params.omegaChar.charCodeAt();
                if (appstate.search.searchUrlIndex) {
                    lower = '-'.charCodeAt(); upper = 'X'.charCodeAt();
                }
                if (upper <= lower) {
                    alphaSelector.push('<a href="#" class="alphaSelector" data-sel="A">PLEASE SELECT VALID START AND END ALPHABET CHARACTERS IN CONFIGURATION</a>');
                } else {
                    for (i = lower; i <= upper; i++) {
                        var char = String.fromCharCode(i);
                        if (appstate.search.searchUrlIndex) {
                            // In URL search mode, we only show namespaces in alphabet
                            if (!/^[-ABCHIJMUVWX]/.test(char)) continue;
                            char = char + '/';
                        }
                        alphaSelector.push('<a href="#" class="alphaSelector" data-sel="' + char + '">' + char + '</a>');
                    }
                }
                // Add selectors for diacritics, etc. for Roman alphabet
                if (String.fromCharCode(lower) === 'A' && String.fromCharCode(upper) == 'Z') {
                    alphaSelector.push('<a href="#" class="alphaSelector" data-sel="¡">¡¿ÀÑ</a>');
                    alphaSelector.unshift('<a href="#" class="alphaSelector" data-sel="!">!#123</a>');
                    // Add way of selecting a non-Roman alphabet
                    var switchAlphaButton = document.getElementById('extraModalFooterContent');
                    // Don't re-add button and event listeners if they already exist
                    if (!/button/.test(switchAlphaButton.innerHTML)) {
                        switchAlphaButton.innerHTML = '<button class="btn btn-primary" style="float:left;" type="button">Switch to non-Roman alphabet</button>';
                        switchAlphaButton.addEventListener('click', function () {
                            var alphaLabel = document.getElementById('alphaCharTxt').parentNode;
                            var panelBody = util.closest(alphaLabel, '.panel-body');
                            if (panelBody && panelBody.style.display === 'none') {
                                var panelHeading = util.getClosestBack(panelBody, function (el) { return /panel-heading/.test(el.className) });
                                if (panelHeading) panelHeading.click();
                            }
                            alphaLabel.style.borderColor = 'red';
                            alphaLabel.style.borderStyle = 'solid';
                            alphaLabel.addEventListener('mousedown', function () {
                                this.style.borderColor = '';
                                this.style.borderStyle = '';
                            });
                            document.getElementById('mycloseMessage').click();
                            document.getElementById('btnConfigure').click();
                            window.location.href = '#otherSettingsDiv';
                        });
                    }
                }
                // Add diacritics for Greek alphabet
                if (params.alphaChar === 'Α' && params.omegaChar == 'Ω') {
                    alphaSelector.push('<a href="#" class="alphaSelector" data-sel="Ϊ">ΪΫά</a>');
                    alphaSelector.unshift('<a href="#" class="alphaSelector" data-sel="΄">ΆΈΉ</a>');
                }
                var alphaString = '<div style="text-align:center">' + (appstate.search.searchUrlIndex ? 'ZIM Namespaces: ' : '') + '[ ' + alphaSelector.join(' | \n') + ' ]</div>\n';
                docBody.innerHTML = '<div style="font-size:120%;"><br />\n' + alphaString + '<br />' + backNext + '</div>\n' +
                    '<h2>ZIM ' + (appstate.search.searchUrlIndex ? 'URL' : 'Archive') + ' Index</h2>\n' +
                    '<div id="zimDirEntryIndex" class="list-group">' + newHtml + '\n</div>\n' +
                    '<div style="font-size:120%">\n' + backNext + '<br /><br />' + alphaString + '</div>\n';
                alphaSelector = docBody.querySelectorAll('.alphaSelector');
                Array.prototype.slice.call(alphaSelector).forEach(function (selector) {
                    selector.addEventListener('click', function (event) {
                        event.preventDefault();
                        var char = selector.dataset.sel;
                        prefix.value = ' ' + char;
                        showZIMIndex(null, char);
                    });
                });
                uiUtil.clearSpinner();
                document.getElementById('articleListWithHeader').style.display = 'none';
                var modalTheme = document.getElementById('modalTheme');
                modalTheme.classList.remove('dark');
                var determinedTheme = params.cssUITheme == 'auto' ? cssUIThemeGetOrSet('auto', true) : params.cssUITheme;
                if (determinedTheme === 'dark') modalTheme.classList.add('dark');
            } else {
                // If the ZIM Index is already displayed, just update the list of articles
                var zimIndex = document.getElementById('zimDirEntryIndex');
                if (zimIndex) zimIndex.innerHTML = newHtml;
                var backNextBlocks = document.querySelectorAll('.backNext');
                if (backNextBlocks) {
                    Array.prototype.slice.call(backNextBlocks).forEach(function (block) {
                        block.innerHTML = backNext;
                    });
                }
            }
            // This is content that must be changed each time the list of articles changes
            var continueAnchors = docBody.querySelectorAll('.continueAnchor');
            Array.prototype.slice.call(continueAnchors).forEach(function (anchor) {
                anchor.addEventListener('click', function (event) {
                    event.preventDefault();
                    var start = ~~anchor.dataset.start;
                    showZIMIndex(start, (appstate.search.searchUrlIndex ? '/' : ''));
                });
            });
            var indexEntries = docBody.querySelectorAll('.list-group-item');
            Array.prototype.slice.call(indexEntries).forEach(function (index) {
                index.addEventListener('click', function (event) {
                    event.preventDefault();
                    handleTitleClick(event);
                    document.getElementById('mycloseMessage').click();
                });
            });
            if (document.getElementById('myModal').style.display !== 'block') {
                uiUtil.systemAlert(' ', '', null, null, null, null, 'myModal');
            }
        }, start);
    }
}

/**
 * Display the list of articles with the given array of DirEntry
 * @param {Array} dirEntryArray The array of dirEntries returned from the binary search
 * @param {Object} reportingSearch The the reporting search object
 */
function populateListOfArticles (dirEntryArray, reportingSearch) {
    // Do not allow cancelled searches to report
    if (reportingSearch.status === 'cancelled') return;
    var stillSearching = appstate.search.status === 'interim';
    var articleListHeaderMessageDiv = document.getElementById('articleListHeaderMessage');
    var nbDirEntry = dirEntryArray ? dirEntryArray.length : 0;

    var message;
    if (stillSearching) {
        message = 'Searching [' + appstate.search.type + ']... found: ' + nbDirEntry + '...' +
        (reportingSearch.scanCount ? ' [scanning ' + reportingSearch.scanCount + ' titles] <a href="#">stop</a>' : '');
    } else if (nbDirEntry >= params.maxSearchResultsSize) {
        message = 'First ' + params.maxSearchResultsSize + (reportingSearch.searchUrlIndex ? ' assets' : ' articles') + ' found: refine your search.';
    } else if (reportingSearch.status === 'error') {
        message = 'Incorrect search syntax! See <a href="#searchSyntaxError" id="searchSyntaxLink">Search syntax</a> in About!';
    } else {
        message = 'Finished. ' + (nbDirEntry || 'No') + ' articles found' +
        (appstate.search.type === 'basic' ? ': try fewer words for full search.' : '.');
    }
    if (!stillSearching && reportingSearch.scanCount) message += ' [scanned ' + reportingSearch.scanCount + ' titles]';

    articleListHeaderMessageDiv.innerHTML = message;
    if (stillSearching && reportingSearch.countReport) return;

    var articleListDiv = document.getElementById('articleList');
    var articleListDivHtml = '';
    var listLength = dirEntryArray.length < params.maxSearchResultsSize ? dirEntryArray.length : params.maxSearchResultsSize;
    for (var i = 0; i < listLength; i++) {
        var dirEntry = dirEntryArray[i];
        // NB We use encodeURIComponent rather than encodeURI here because we know that any question marks in the title are not querystrings,
        // and should be encoded [kiwix-js #806]. DEV: be very careful if you edit the dirEntryId attribute below, because the contents must be
        // inside double quotes (in the final HTML string), given that dirEntryStringId may contain bare apostrophes
        // Info: encodeURIComponent encodes all characters except  A-Z a-z 0-9 - _ . ! ~ * ' ( )
        var dirEntryStringId = encodeURIComponent(dirEntry.toStringId());
        // DEV: Some titles may contain malformed HTML characters like '&lt;i>' for '<i>', so we transform only bold and italics for display
        // @TODO: Remove when [openzim/mwoffliner #1797] is fixed
        var dirEntryTitle = dirEntry.getTitleOrUrl();
        dirEntryTitle = dirEntryTitle.replace(/&lt;([ib])>([^&]+)&lt;\/\1>/g, '<$1>$2</$1>');
        articleListDivHtml += '<a href="#" dirEntryId="' + dirEntryStringId +
            '" class="list-group-item">' + (reportingSearch.searchUrlIndex ? dirEntry.namespace + '/' + dirEntry.url : '' + dirEntryTitle) + '</a>';
    }
    articleListDiv.innerHTML = articleListDivHtml;
    // We have to use mousedown below instead of click as otherwise the prefix blur event fires first
    // and prevents this event from firing; note that touch also triggers mousedown
    document.querySelectorAll('#articleList a').forEach(function (link) {
        link.addEventListener('mousedown', function (e) {
            e.preventDefault();
            // Cancel search immediately
            appstate.search.status = 'cancelled';
            handleTitleClick(e);
            scrollbox.style.height = 0;
            document.getElementById('articleListWithHeader').style.display = 'none';
        });
    });
    if (!stillSearching) uiUtil.clearSpinner();
    document.getElementById('articleListWithHeader').style.display = '';
    if (reportingSearch.status === 'error') {
        document.getElementById('searchSyntaxLink').addEventListener('click', function () {
            setTab('about');
            document.getElementById('btnAbout').click();
        });
    }
}
/**
 * Handles the click on the title of an article in search results
 * @param {Event} event The click event to handle
 * @returns {Boolean} Always returns false for JQuery event handling
 */
function handleTitleClick (event) {
    var dirEntryId = decodeURIComponent(event.target.getAttribute('dirEntryId'));
    findDirEntryFromDirEntryIdAndLaunchArticleRead(dirEntryId);
    return false;
}

/**
 * Creates an instance of DirEntry from given dirEntryId (including resolving redirects),
 * and call the function to read the corresponding article
 * @param {String} dirEntryId The stringified Directory Entry to parse and launch
 */
function findDirEntryFromDirEntryIdAndLaunchArticleRead (dirEntryId) {
    if (appstate.selectedArchive.isReady()) {
        var dirEntry = appstate.selectedArchive.parseDirEntryId(dirEntryId);
        // Remove focus from search field to hide keyboard and to allow navigation keys to be used
        document.getElementById('articleContent').contentWindow.focus();
        // Ensure selected search item is displayed in the iframe, not a new window or tab
        appstate.target = 'iframe';
        uiUtil.pollSpinner();
        if (dirEntry.isRedirect()) {
            appstate.selectedArchive.resolveRedirect(dirEntry, readArticle);
        } else {
            params.isLandingPage = false;
            readArticle(dirEntry);
        }
    } else {
        uiUtil.systemAlert('Data files not set');
    }
}

/**
 * Check whether the given URL from given dirEntry equals the expectedArticleURLToBeDisplayed
 * @param {DirEntry} dirEntry The directory entry of the article to read
 * @returns {Boolean} Returns false if the current article does not match the expected article
 */
function isDirEntryExpectedToBeDisplayed (dirEntry) {
    var curArticleURL = dirEntry.namespace + '/' + dirEntry.url;
    if (appstate.expectedArticleURLToBeDisplayed !== curArticleURL) {
        console.debug('url of current article :' + curArticleURL + ', does not match the expected url :' +
            appstate.expectedArticleURLToBeDisplayed);
        return false;
    }
    return true;
}

/**
 * Read the article corresponding to the given dirEntry
 * @param {DirEntry} dirEntry The directory entry of the article to read
 */
function readArticle (dirEntry) {
    // Reset search prefix to allow users to search the same string again if they want to
    appstate.search.prefix = '';
    // Only update for expectedArticleURLToBeDisplayed.
    appstate.expectedArticleURLToBeDisplayed = dirEntry.namespace + '/' + dirEntry.url;
    params.pagesLoaded++;
    // Select the correct target window for the article, defaulting to the iframe
    articleContainer = appstate.target === 'window' ? articleWindow : iframe;
    // We must remove focus from UI elements in order to deselect whichever one was clicked (in both Restricted and SW modes),
    if (!params.isLandingPage && articleContainer.contentWindow) articleContainer.contentWindow.focus();
    uiUtil.pollSpinner()
    // Show the spinner with a loading message
    var message = dirEntry.url.match(/(?:^|\/)([^/]{1,13})[^/]*?$/);
    message = message ? message[1] + '...' : '...';
    uiUtil.pollSpinner('Loading ' + message);
    var mimeType = dirEntry.getMimetype();

    // For Zimit ZIMS and pureMode, we need to go straight to article loading, and not look for cached content
    if (params.contentInjectionMode === 'serviceworker' && (appstate.pureMode || appstate.selectedArchive.zimType === 'zimit' && appstate.isReplayWorkerAvailable !== false)) {
        // We will need the encoded URL on article load so that we can set the iframe's src correctly,
        // but we must not encode the '/' character or else relative links may fail [kiwix-js #498]
        var encodedUrl = dirEntry.url.replace(/[^/]+/g, function (matchedSubstring) {
            return encodeURIComponent(matchedSubstring);
        });

        // Set up article onload handler
        articleLoader(dirEntry, mimeType);

        if (!isDirEntryExpectedToBeDisplayed(dirEntry)) {
            return;
        }

        // Zimit archives contain content that is blocked in a local Chromium extension (on every page), so we must fall back to Restricted mode
        if (/zimit/.test(appstate.selectedArchive.zimType) && window.location.protocol === 'chrome-extension:' && !window.nw) {
            return handleUnsupportedReplayWorker(dirEntry);
        }
        // If we are dealing with a classic Zimit ZIM, we need to instruct Replay to add the file as a new collection
        if (appstate.selectedArchive.zimType === 'zimit' && appstate.isReplayWorkerAvailable === null) {
            if (params.useLegacyZimitSupport) {
                navigator.serviceWorker.controller.postMessage({ action: 'disableZimitSupport' });
                return handleUnsupportedReplayWorker(dirEntry);
            }
            var archiveName = appstate.selectedArchive.file.name.replace(/\.zim\w{0,2}$/i, '');
            var cns = appstate.selectedArchive.getContentNamespace();
            // Support type 0 and type 1 Zimit archives
            var replayCns = cns === 'C' ? '/C/A/' : '/A/';
            var base = window.location.href.replace(/^(.*?\/)www\/.*$/, '$1');
            var prefix = base + appstate.selectedArchive.file.name + replayCns;
            // Open a new message channel to the ServiceWorker
            var zimitMessageChannel = new MessageChannel();
            zimitMessageChannel.port1.onmessage = function (event) {
                if (event.data.error) {
                    console.error('Reading Zimit archives with the Replay system is not supported in this browser', event.data.error);
                    return handleUnsupportedReplayWorker(dirEntry);
                } else if (event.data.success) {
                    // For now Electron apps cannot use the Replay Worker because of the file:// protocol
                    if (document.location.protocol !== 'file:' && !params.useLegacyZimitSupport) {
                        appstate.isReplayWorkerAvailable = true;
                        // Make sure the configuration panel is closed
                        if (document.getElementById('configuration').style.display !== 'none') {
                            btnConfigure.click();
                        }
                        // We put the ZIM filename as a prefix in the URL, so that browser caches are separate for each ZIM file
                        articleContainer.src = '../' + appstate.selectedArchive.file.name + '/' + dirEntry.namespace + '/' + encodedUrl;
                    } else {
                        return handleUnsupportedReplayWorker(dirEntry);
                    }
                }
            };
            // If we are dealing with a Zimit ZIM, we need to instruct Replay to add the file as a new collection
            if (!navigator.serviceWorker.controller) {
                uiUtil.clearSpinner();
                return;
            }
            navigator.serviceWorker.controller.postMessage({
                msg_type: 'addColl',
                name: archiveName,
                prefix: prefix,
                file: { sourceUrl: 'proxy:' + prefix },
                root: true,
                skipExisting: false,
                extraConfig: {
                    // prefix: prefix, // If not set, Replay will use the proxy URL (without the 'proxy:' prefix)
                    sourceType: 'kiwix',
                    notFoundPageUrl: './404.html'/*,
                    baseUrl: base + selectedArchive.file.name + '/',
                    baseUrlHashReplay: false */
                },
                topTemplateUrl: './www/topFrame.html'
            }, [zimitMessageChannel.port2]);
        } else {
            // We put the ZIM filename as a prefix in the URL, so that browser caches are separate for each ZIM file
            articleContainer.src = '../' + appstate.selectedArchive.file.name + '/' + dirEntry.namespace + '/' + encodedUrl;
        }
    } else if (dirEntry.isRedirect()) {
        appstate.selectedArchive.resolveRedirect(dirEntry, readArticle);
    } else {
        // TESTING//
        console.log('Initiating ' + mimeType + ' load of ' + dirEntry.namespace + '/' + dirEntry.url + '...');
        uiUtil.hideActiveContentWarning();
        // Set startup parameter to guard against boot loop
        if (settingsStore.getItem('lastPageLoad') !== 'rebooting') settingsStore.setItem('lastPageLoad', 'failed', Infinity);
        // Void the localSearch variable to prevent invalid DOM references remainining [kiwix-js-pwa #56]
        localSearch = {};
        // Calculate the current article's ZIM baseUrl to use when processing relative links
        params.baseURL = encodeURI(dirEntry.namespace + '/' + dirEntry.url.replace(/[^/]+$/, ''));
        // URI-encode anything that is not a '/'
        // .replace(/[^/]+/g, function(m) {
        //     return encodeURIComponent(m);
        // });
        if (!/\bx?html\b/i.test(mimeType)) {
            // If the selected article isn't HTML, e.g. it might be a PDF, we can either download it if we recognize the type, or ask the SW to deal with it
            if ((params.zimType === 'zimit' || appstate.search.searchUrlIndex) &&
                /\/(plain|.*javascript|css|csv|.*officedocument|.*opendocument|epub|pdf|zip|png|jpeg|webp|svg|gif|tiff|mp4|webm|mpeg|mp3|octet-stream|warc-headers)/i.test(mimeType)) {
                return appstate.selectedArchive.readBinaryFile(dirEntry, function (fileDirEntry, content) {
                    var filename = dirEntry.title || dirEntry.url;
                    if (/^text|\/.*javascript|\/warc-headers/i.test(mimeType)) {
                        var contentString = content;
                        if (typeof content !== 'string') contentString = utf8.parse(content);
                        displayArticleContentInContainer(fileDirEntry, contentString);
                        // Provide a download link for js and css asset types at least
                        if (!(/plain|warc-headers/i.test(mimeType))) {
                            uiUtil.displayFileDownloadAlert(filename, false, mimeType, content);
                        }
                    } else {
                        uiUtil.displayFileDownloadAlert(filename, true, mimeType, content);
                    }
                    uiUtil.clearSpinner();
                });
            } else if (params.contentInjectionMode === 'serviceworker') {
                articleContainer = window.open('../' + appstate.selectedArchive.file.name + '/' + dirEntry.namespace + '/' + encodeURIComponent(dirEntry.url),
                    params.windowOpener === 'tab' ? '_blank' : encodeURIComponent(dirEntry.title | mimeType),
                    params.windowOpener === 'window' ? 'toolbar=0,location=0,menubar=0,width=800,height=600,resizable=1,scrollbars=1' : null);
                if (articleContainer) {
                    appstate.target = 'window';
                    articleContainer.kiwixType = appstate.target;
                    articleWindow = articleContainer;
                }
                uiUtil.clearSpinner();
                return;
            }
        }
        // Load cached start page if it exists and we have loaded the packaged file
        var htmlContent = 0;
        var zimName = appstate.selectedArchive.file.name.replace(/\.[^.]+$/, '').replace(/_\d+-\d+$/, '');
        if (params.isLandingPage && params.cachedStartPages[zimName]) {
            htmlContent = -1;
            // @TODO: Why are we double-encoding here????? Clearly we double-decode somewhere...
            // var encURL = encodeURIComponent(encodeURIComponent(params.cachedStartPages[zimName]).replace(/%2F/g, '/')).replace(/%2F/g, '/');
            var encURL = encodeURI(encodeURI(params.cachedStartPages[zimName]));
            uiUtil.XHR(encURL, 'text', function (responseTxt, status) {
                htmlContent = /<html[^>]*>/.test(responseTxt) ? responseTxt : 0;
                if (htmlContent) {
                    console.log('Article retrieved from storage cache...');
                    // Alter the dirEntry url and title parameters in case we are overriding the start page
                    dirEntry.url = params.cachedStartPages[zimName].replace(/[AC]\//, '');
                    var title = htmlContent.match(/<title[^>]*>((?:[^<]|<(?!\/title))+)/);
                    dirEntry.title = title ? title[1] : dirEntry.title;
                    appstate.selectedArchive.landingPageUrl = params.cachedStartPages[zimName];
                    displayArticleContentInContainer(dirEntry, htmlContent);
                } else {
                    appstate.selectedArchive.readUtf8File(dirEntry, function (fileDirEntry, data) {
                        if (fileDirEntry.zimitRedirect) goToArticle(fileDirEntry.zimitRedirect);
                        else displayArticleContentInContainer(fileDirEntry, data);
                    });
                }
            });
        }

        // Load lastPageVisit if it is the currently requested page
        if (!htmlContent) {
            var lastPage = '';
            // NB code below must be able to run async, hence it is a function
            var goToRetrievedContent = function (html) {
                if (/<html[^>]*>/i.test(html)) {
                    console.log('Fast article retrieval from localStorage: ' + lastPage);
                    if (/<html[^>]*islandingpage/i.test(html)) {
                        params.isLandingPage = true;
                        appstate.selectedArchive.landingPageUrl = dirEntry.namespace + '/' + dirEntry.url;
                    }
                    setTimeout(function () {
                        displayArticleContentInContainer(dirEntry, html);
                    }, 0);
                } else {
                    // if (params.contentInjectionMode === 'jquery') {
                    // In Restricted mode, we read the article content in the backend and manually insert it in the iframe
                    appstate.selectedArchive.readUtf8File(dirEntry, function (fileDirEntry, data) {
                        if (fileDirEntry && fileDirEntry.zimitRedirect) {
                            goToArticle(fileDirEntry.zimitRedirect);
                        } else {
                            if (!data) {
                                var requestedURL = (dirEntry.zimitRedirect ? dirEntry.zimitRedirect : dirEntry.namespace + '/' + dirEntry.url)
                                uiUtil.systemAlert(
                                    '<p>The requested page <b>' + requestedURL + '</b> does not appear to be an article!</p>' +
                                    '<p>Try searching for content in the search bar, or type a <b><i>space</i></b> for the ZIM ' +
                                    'index, or <b><i>space /</i></b> for the URL index.</p>'
                                ).then(function () {
                                    prefix.focus();
                                });
                            }
                            fileDirEntry = fileDirEntry || dirEntry;
                            displayArticleContentInContainer(fileDirEntry, data);
                        }
                    });
                    // This is needed so that the html is cached in displayArticleInForm
                    params.lastPageVisit = '';
                    params.lastPageHTML = '';
                    // }
                }
            };
            if (params.rememberLastPage && params.lastPageVisit) lastPage = params.lastPageVisit.replace(/@kiwixKey@.+/, '');
            // If we have the HTML of the last loaded page, use it to save lookups
            if (params.rememberLastPage && dirEntry.namespace + '/' + dirEntry.url === lastPage) {
                if (!params.lastPageHTML) {
                    // DEV: Timout is needed here to allow time for cache capability to be tested before calling it
                    // otherwise the app will return only a memory capibility for apps that use indexedDB
                    setTimeout(function () {
                        cache.getArticle(params.lastPageVisit.replace(/.*@kiwixKey@/, ''), lastPage, function (html) {
                            params.lastPageHTML = html;
                            htmlContent = params.lastPageHTML || htmlContent;
                            goToRetrievedContent(htmlContent);
                        });
                    }, 250);
                } else {
                    htmlContent = params.lastPageHTML;
                    goToRetrievedContent(htmlContent);
                }
        // } else if (params.zimType === 'zimit' && params.contentInjectionMode === 'serviceworker' && !messageChannelWaiting) {
        //     // DEF: If the messageChannel isn't waiting for transformed HTML, we could instruct the SW to load this article
        //     // It uses more CPU, as it starts the lookups all over again, but it is arguably a "purer" method especially for Zimit
        //     var newLocation = '../' + appstate.selectedArchive.file.name + '/' + dirEntry.namespace + '/' + dirEntry.url + '?isKiwixHref';
        //     loaded = false;
        //     articleWindow.location.href = newLocation;
            } else {
                goToRetrievedContent(htmlContent);
            }
        }
    }
}

var previousReplayDocLocation = '';

/**
 * Selects the iframe to which to attach the onload event, and attaches it
 */
function articleLoader (entry, mimeType) {
    if (/warc-headers/i.test(mimeType)) return;
    if (appstate.selectedArchive.zimType === 'zimit') {
        var doc = articleContainer.contentDocument || null;
        if (doc) {
            var replayIframe = doc.getElementById('replay_iframe');
            if (!replayIframe) return;
            // Add a failsafe to ensure that the iframe is displayed after 1.5 seconds
            if (replayIframe.timeout) clearTimeout(replayIframe.timeout);
            replayIframe.timeout = setTimeout(function () {
                replayIframe.style.display = '';
                // Only show the sliding UI elements if the iframe window has not already been scrolled
                if (replayIframe.contentWindow && !replayIframe.contentWindow.scrollFired) {
                    uiUtil.showSlidingUIElements();
                }
            }, 1500);
            // Don't set up listeners for the Header type, as it is not a real article
            if (/warc-headers/i.test(mimeType)) return;
            var replayDoc = replayIframe && replayIframe.contentDocument || null;
            if (!replayDoc || !replayDoc.readyState || replayDoc.readyState === 'loading') return;
            if (replayDoc.location.href !== previousReplayDocLocation) {
                // console.debug('Previous replayDoc location: ' + previousReplayDocLocation);
                // console.debug('New replayDoc location: ' + replayDoc.location.href);
                previousReplayDocLocation = replayDoc.location.href;
                setTimeout(function () {
                    articleLoadedSW(entry, replayIframe);
                    switchCSSTheme();
                }, 100);
            }
        }
    } else {
        articleContainer.onload = function () {
            articleLoadedSW(entry, articleContainer);
        };
    }
}

// Add event listener to iframe window to check for links to external resources
function filterClickEvent (event) {
    console.debug('filterClickEvent fired');
    // Ignore click if we are dealing with an image that has not yet been extracted
    if (event.target.dataset && event.target.dataset.kiwixhidden) return;
    // Find the closest enclosing A tag (if any)
    var clickedAnchor = uiUtil.closestAnchorEnclosingElement(event.target);
    // If the anchor has a passthrough property, then we have already checked it is safe, so we can return
    if (clickedAnchor && clickedAnchor.passthrough) {
        clickedAnchor.passthrough = false;
        return;
    }
    // Remove any Kiwix Popovers that may be hanging around
    popovers.removeKiwixPopoverDivs(event.target.ownerDocument);
    // Trap clicks in the iframe to restore Fullscreen mode
    if (params.lockDisplayOrientation) refreshFullScreen(event);
    if (clickedAnchor) {
        // Get the window of the clicked anchor
        articleWindow = clickedAnchor.ownerDocument.defaultView;
        // Select the correct target window for the article, defaulting to the iframe
        articleContainer = articleWindow.self === articleWindow.top ? articleWindow : iframe;
        appstate.target = articleContainer === articleWindow ? 'window' : 'iframe';
        if (params.contentInjectionMode === 'jquery') return;
        // This prevents any popover from being displayed when the user clicks on a link
        clickedAnchor.articleisloading = true;
        // Check for Zimit links that would normally be handled by the Replay Worker
        // DEV: '__WB_pmw' is a function inserted by wombat.js, so this detects links that have been rewritten in zimit2 archives
        // however, this misses zimit2 archives where the framework doesn't support wombat.js, so monitor if always processing zimit2 links
        // causes any adverse effects @TODO
        if (appstate.isReplayWorkerAvailable || '__WB_pmw' in clickedAnchor || appstate.selectedArchive.zimType === 'zimit2' &&
          articleWindow.location.href.replace(/[#?].*$/, '') !== clickedAnchor.href.replace(/[#?].*$/, '') && !clickedAnchor.hash) {
            return handleClickOnReplayLink(event, clickedAnchor);
        }
        // DEV: The href returned below is the href as written in the HTML, which may be relative
        var href = clickedAnchor.getAttribute('href');
        // We assume that, if an absolute http(s) link is hardcoded inside an HTML string, it means it's a link to an external website
        // (this assumption is only safe for non-Replay archives, but we deal with those separately above: they are routed to handleClickOnReplayLink).
        // Additionally, by comparing the protocols, we can filter out protocols such as `mailto:`, `tel:`, `skype:`, etc. (these should open in a new window).
        // DEV: The test for a protocol of ':' may no longer be needed. It needs careful testing in all browsers (particularly in Edge Legacy), and if no
        // longer triggered, it can be removed.
        if (/^http/i.test(href) || clickedAnchor.protocol && clickedAnchor.protocol !== ':' && articleWindow.location.protocol !== clickedAnchor.protocol) {
            console.debug('filterClickEvent opening external link in new tab');
            clickedAnchor.newcontainer = true;
            uiUtil.warnAndOpenExternalLinkInNewTab(event, clickedAnchor);
        } else if (/\.pdf([?#]|$)/i.test(href) && params.zimType !== 'zimit' && !/UWP/.test(params.appType)) { // Not currently supported in UWP app
            // Due to the iframe sandbox, we have to prevent the PDF viewer from opening in the iframe and instead open it in a new tab
            event.preventDefault();
            event.stopPropagation();
            console.debug('filterClickEvent opening new window for PDF');
            clickedAnchor.newcontainer = true;
            window.open(clickedAnchor.href, params.windowOpener === 'tab' ? '_blank' : clickedAnchor.title,
                params.windowOpener === 'window' ? 'toolbar=0,location=0,menubar=0,width=800,height=600,resizable=1,scrollbars=1' : null);
            // Make sure that the last saved page is not a PDF, or else we'll have a CSP exception on restarting the app
            // @TODO - may not be necessary because params.lastPageVisit is only set when HTML is loaded
        } else {
            var decHref = decodeURIComponent(href);
            if (!/^(?:#|javascript)/i.test(decHref)) {
                uiUtil.pollSpinner('Loading ' + decHref.replace(/([^/]+)$/, '$1').substring(0, 18) + '...');
                // Tear down contents of previous document -- this is needed when a link in a ZIM link in an external window hasn't had
                // an event listener attached. For example, links in popovers in external windows. UWP doesn't allow access to the contents
                // of the external window, so we can't clear it.
                if (!/UWP/.test(params.appType) && articleWindow && articleWindow.document && articleWindow.document.body) {
                    articleWindow.document.body.innerHTML = '';
                }
            }
        }
    }
};

var loaded = false;
var unhideArticleTries = 12; // Set up a repeasting loop 12 times (= 6 seconds max) to attempt to unhide the article container

// Function to unhide a hidden article
var unhideArticleContainer = function () {
    console.debug('Unhiding article container...');
    if (articleWindow.document) {
        articleWindow.document.bgcolor = '';
        if (appstate.target === 'iframe') iframe.style.display = '';
        if (articleWindow.document.body && articleWindow.document.body.style) {
            articleWindow.document.body.style.display = 'block';
            // Some contents need this to be able to display correctly (e.g. masonry landing pages)
            iframe.style.height = 'auto';
            resizeIFrame();
            // Scroll down and up to kickstart lazy loading which might not happen if brower has been slow to display the content
            if (!(/zimit/.test(params.zimType) || appstate.pureMode)) {
                articleWindow.scrollBy(0, 5);
                setTimeout(function () {
                    articleWindow.scrollBy(0, -5);
                    unhideArticleTries = 12; // Reset counter
                }, 250);
            }
        }
    }
}

// The main article loader for Service Worker mode
var articleLoadedSW = function (dirEntry, container) {
    console.debug('Checking if article loaded... ' + loaded);
    if (loaded) {
        // Last-ditch attempt to unhide
        unhideArticleContainer();
        return;
    }
    loaded = true;
    // Get the container windows
    articleWindow = container.contentWindow || container;
    uiUtil.showSlidingUIElements();
    var doc = articleWindow ? articleWindow.document : null;
    articleDocument = doc;
    var mimeType = dirEntry.getMimetype();
    // If we've successfully loaded an HTML document...
    if (doc && /\bx?html/i.test(mimeType)) {
        console.debug('HTML appears to be available...');
        if (params.rememberLastPage) {
            params.lastPageVisit = dirEntry.namespace + '/' + dirEntry.url + '@kiwixKey@' + appstate.selectedArchive.file.name;
        } else {
            params.lastPageVisit = '';
        }
        // Turn off failsafe for SW mode
        settingsStore.setItem('lastPageLoad', 'OK', Infinity);
        settingsStore.setItem('lastPageVisit', params.lastPageVisit, Infinity);
        // Set or clear the ZIM store of last page
        var lastPage = params.rememberLastPage ? dirEntry.namespace + '/' + dirEntry.url : '';
        settingsStore.setItem(appstate.selectedArchive.file.name, lastPage, Infinity);
    }
    var docBody = doc ? doc.body : null;
    if (docBody && docBody.innerHTML) { // docBody must contain contents, otherwise we haven't loaded an article yet
        console.debug('We appear to have a document body with HTML...');
        // Trap clicks in the iframe to enable us to work around the sandbox when opening external links and PDFs
        articleWindow.onclick = filterClickEvent;
        // Ensure the window target is permanently stored as a property of the articleWindow (since appstate.target can change)
        articleWindow.kiwixType = appstate.target;
        // Deflect drag-and-drop of ZIM file on the iframe to Config
        if (!params.disableDragAndDrop && appstate.target === 'iframe') {
            docBody.addEventListener('dragover', handleIframeDragover);
            docBody.addEventListener('drop', handleIframeDrop);
            setupTableOfContents();
            listenForSearchKeys();
        }
        // Note that switchCSSTheme() requires access to params.lastPageVisit
        if (!appstate.isReplayWorkerAvailable) switchCSSTheme(); // Gets called in articleLoader for replay_iframe
        if (appstate.selectedArchive.zimType === 'open') {
            // Set relative font size + Stackexchange-family multiplier
            var zimType = /-\/s\/style\.css/i.test(doc.head.innerHTML) ? 'desktop' : 'mobile';
            zimType = /-\/static\/main\.css|statc\/css\/sotoki.css/i.test(doc.head.innerHTML) ? 'desktop-stx' : zimType; // Support stackexchange
            zimType = /minerva|mobile[^"']*\.css/i.test(doc.head.innerHTML) ? 'mobile' : zimType;
            var docElStyle = doc.documentElement.style;
            var zoomProp = '-ms-zoom' in docElStyle ? 'fontSize' : 'zoom' in docElStyle ? 'zoom' : 'fontSize';
            docElStyle = zoomProp === 'fontSize' ? docBody.style : docElStyle;
            docElStyle[zoomProp] = ~zimType.indexOf('stx') && zoomProp === 'fontSize' ? params.relativeFontSize * 1.5 + '%' : params.relativeFontSize + '%';
            if (!params.isLandingPage) openAllSections();
        }
        checkToolbar();
        // Set page width according to user preference
        removePageMaxWidth();
        setupHeadings();
        listenForNavigationKeys();
        if (!appstate.isReplayWorkerAvailable) {
            // We need to keep tabs on the opened tabs or windows if the user wants right-click functionality, and also parse download links
            // We need to set a timeout so that dynamically generated URLs are parsed as well (e.g. in Gutenberg ZIMs)
            if ((params.windowOpener || appstate.wikimediaZimLoaded) && !appstate.pureMode && !params.useLibzim && dirEntry) {
                setTimeout(function () {
                    parseAnchorsJQuery(dirEntry);
                }, 1500);
            }
            if ((params.zimType === 'open' || params.manipulateImages) && /manual|progressive/.test(params.imageDisplayMode) && !params.useLibzim) {
                images.prepareImagesServiceWorker(articleWindow);
            } else {
                setTimeout(function () {
                    images.loadMathJax(articleWindow);
                }, 1000);
            }
            if (params.allowHTMLExtraction && appstate.target === 'iframe') {
                var determinedTheme = params.cssTheme == 'auto' ? cssUIThemeGetOrSet('auto') : params.cssTheme;
                uiUtil.insertBreakoutLink(determinedTheme);
            }
            // Trap any clicks on the iframe to detect if mouse back or forward buttons have been pressed (Chromium does this natively)
            if (/UWP/.test(params.appType)) docBody.addEventListener('pointerup', onPointerUp);
            // The content is ready : we can hide the spinner
            setTab();
            // If the body is not yet displayed, we need to wait for it to be displayed before we can unhide the article container
            const intervalId = setInterval(function () {
                docBody = articleWindow.document.body;
                unhideArticleTries--;
                unhideArticleContainer();
                // Check that the contents of docBody aren't empty and that the unhiding worked
                if (unhideArticleTries < 1 || docBody.innerHTML && docBody.style.display === 'block') {
                    console.debug('Attempt ' + (12 - unhideArticleTries) + ' to unhide article container...');
                    clearInterval(intervalId);
                }
            }, 500);
        }
        uiUtil.clearSpinner();
        // If we reloaded the page to print the desktop style, we need to return to the printIntercept dialogue
        if (params.printIntercept) printIntercept();
        // Jump to any anchor parameter
        if (anchorParameter) {
            var target = articleWindow.document.getElementById(anchorParameter);
            if (target) {
                setTimeout(function () {
                    target.scrollIntoView();
                }, 1000);
            }
            anchorParameter = '';
        }
        if (dirEntry) uiUtil.makeReturnLink(dirEntry.getTitleOrUrl());
        if (appstate.wikimediaZimLoaded && params.showPopoverPreviews) {
            var darkTheme = (params.cssUITheme == 'auto' ? cssUIThemeGetOrSet('auto', true) : params.cssUITheme) !== 'light';
            popovers.attachKiwixPopoverCss(doc, darkTheme);
        }
        params.isLandingPage = false;
    } else if (unhideArticleTries > 0) {
        // If we havent' loaded a text-type document, we probably haven't finished loading
        loaded = false;
        unhideArticleTries--;
        // Try again...
        console.debug('Attempt ' + (12 - unhideArticleTries) + ' to process loaded article...');
        setTimeout(articleLoadedSW, 250, dirEntry, container);
    }

    // Show spinner when the article unloads
    // DEV: Note that this doesn't fire on the Replay iframe, because the src is set programmatically
    container.onunload = function () {
        if (articleWindow.kiwixType === 'iframe') {
            uiUtil.pollSpinner();
        }
    };
};

// Handles a click on a Zimit link that has been processed by Wombat
function handleClickOnReplayLink (ev, anchor) {
    var basePath = window.location.href.replace(/^(.*?\/)www\/.*$/, '$1');
    var pathToZim = basePath + appstate.selectedArchive.file.name + '/';
    var pseudoNamespace = appstate.selectedArchive.zimitPseudoContentNamespace;
    var pseudoDomainPath = (anchor.hostname === window.location.hostname ? appstate.selectedArchive.zimitPrefix.replace(/\/$/, '') : anchor.hostname) + anchor.pathname;
    var containingDocDomainPath = anchor.ownerDocument.location.hostname + anchor.ownerDocument.location.pathname;
    // Normalize the protocols of the clicked anchor and the document, because some PDFs are served with a protocol of http: instead of https:
    var normalizedAnchorProtocol = anchor.protocol ? anchor.protocol.replace(/s:/, ':') : '';
    var normalizedDocumentProtocol = document.location.protocol.replace(/s:/, ':');
    // If the paths are identical, then we are dealing with a link to an anchor in the same document
    if (pseudoDomainPath === containingDocDomainPath) return;
    // If it's for a different protocol (e.g. javascript:) we may need to handle that, or if the user has pressed the ctrl or command key, the document
    // will open in a new window anyway, so we can return.
    if (normalizedAnchorProtocol && normalizedAnchorProtocol !== normalizedDocumentProtocol) {
        // DEV: Monitor whether you need to handle /blob:|data:|file:/ as well (probably not, as they would be blocked by the sandbox if loaded into iframe)
        if (/about:|javascript:/i.test(anchor.protocol) || ev.ctrlKey || ev.metaKey || ev.button === 1) return;
        // So it's probably a URI scheme or protocol like mailto: that would violate the CSP, so we need to open it explicitly in a new tab
        ev.preventDefault();
        ev.stopPropagation();
        console.debug('handleClickOnReplayLink opening custom protocol ' + anchor.protocol + ' in new tab');
        uiUtil.warnAndOpenExternalLinkInNewTab(ev, anchor);
        return;
    }
    var zimUrl;
    // If it starts with the path to the ZIM file, then we are dealing with an untransformed absolute local ZIM link
    if (!anchor.href.indexOf(pathToZim)) {
        zimUrl = anchor.href.replace(pathToZim, '');
    // If it is the same as the pseudoDomainPath, then we are dealing with an untransformed pseuodo relative link that looks like an absolute https:// link
    // (this probably only applies to zimit2 without Wombat)
    } else if (anchor.href.replace(/^[^:]+:\/\//, '') === pseudoDomainPath && /\.zim\/[CA]\//.test(anchor.href)) {
        zimUrl = anchor.href.replace(/^(?:[^.]|\.(?!zim\/[CA]\/))+\.zim\//, '');
    } else {
        zimUrl = pseudoNamespace + pseudoDomainPath + anchor.search;
    }
    // It is necessary to fully decode zimit2, as these archives follow OpenZIM spec
    if (params.zimType === 'zimit2') {
        zimUrl = decodeURIComponent(zimUrl);
    }
    // We need to test the ZIM link
    if (zimUrl) {
        ev.preventDefault();
        ev.stopPropagation();
        // Note that true in the fourth argument instructs getDirEntryByPath to follow redirects by looking up the Header
        return appstate.selectedArchive.getDirEntryByPath(zimUrl, null, null, true).then(function (dirEntry) {
            var processDirEntry = function (dirEntry) {
                var pathToArticleDocumentRoot = document.location.href.replace(/www\/index\.html.*$/, appstate.selectedArchive.file.name + '/');
                var mimetype = dirEntry.getMimetype();
                // Due to the iframe sandbox, we have to prevent the PDF viewer from opening in the iframe and instead open it in a new tab
                // Note that some Replay PDFs have html mimetypes, or can be redirects to PDFs, we need to check the URL as well
                if (/pdf/i.test(mimetype) || /\.pdf(?:[#?]|$)/i.test(anchor.href) || /\.pdf(?:[#?]|$)/i.test(dirEntry.url)) {
                    if (/Android/.test(params.appType) || window.nw) {
                        // User is on an Android device, where opening a PDF in a new tab is not sufficient to evade the sandbox
                        // so we need to download the PDF instead
                        var readAndDownloadBinaryContent = function (zimUrl) {
                            return appstate.selectedArchive.getDirEntryByPath(zimUrl).then(function (dirEntry) {
                                if (dirEntry) {
                                    appstate.selectedArchive.readBinaryFile(dirEntry, function (fileDirEntry, content) {
                                        var mimetype = fileDirEntry.getMimetype();
                                        uiUtil.displayFileDownloadAlert(zimUrl, true, mimetype, content);
                                        uiUtil.clearSpinner();
                                    });
                                } else {
                                    return uiUtil.systemAlert('We could not find a PDF document at ' + zimUrl, 'PDF not found');
                                }
                            });
                        };
                        // If the document is in fact an html redirect, we need to follow it first till we get the underlying PDF document
                        if (/\bx?html\b/.test(mimetype)) {
                            appstate.selectedArchive.readUtf8File(dirEntry, function (fileDirEntry, data) {
                                var redirectURL = data.match(/<meta[^>]*http-equiv="refresh"[^>]*content="[^;]*;url='?([^"']+)/i);
                                if (redirectURL) {
                                    redirectURL = redirectURL[1];
                                    var contentUrl = pseudoNamespace + redirectURL.replace(/^[^/]+\/\//, '');
                                    return readAndDownloadBinaryContent(contentUrl);
                                } else {
                                    return readAndDownloadBinaryContent(zimUrl);
                                }
                            });
                        } else {
                            return readAndDownloadBinaryContent(zimUrl);
                        }
                    } else {
                        window.open(pathToArticleDocumentRoot + zimUrl, params.windowOpener === 'tab' ? '_blank' : dirEntry.title,
                            params.windowOpener === 'window' ? 'toolbar=0,location=0,menubar=0,width=800,height=600,resizable=1,scrollbars=1' : null);
                    }
                } else {
                    clearFindInArticle();
                    if (/\bx?html\b/i.test(mimetype)) {
                        // We need to remember this page as the last-visted page
                        params.lastPageVisit = dirEntry.namespace + '/' + dirEntry.url + '@kiwixKey@' + appstate.selectedArchive.file.name;
                        if (params.rememberLastPage) {
                            settingsStore.setItem('lastPageVisit', params.lastPageVisit, Infinity);
                            settingsStore.setItem(appstate.selectedArchive.file.name, dirEntry.namespace + '/' + dirEntry.url, Infinity);
                        }
                    }
                    // Handle middle-clicks and ctrl-clicks
                    if (ev.ctrlKey || ev.metaKey || ev.button === 1) {
                        var encodedTitle = encodeURIComponent(dirEntry.getTitleOrUrl());
                        articleWindow = window.open(pathToArticleDocumentRoot + zimUrl,
                            params.windowOpener === 'tab' ? '_blank' : encodedTitle,
                            params.windowOpener === 'window' ? 'toolbar=0,location=0,menubar=0,width=800,height=600,resizable=1,scrollbars=1' : null
                        );
                        // Conditional, because opening a new window can be blocked by the browser
                        if (articleWindow) {
                            appstate.target = 'window';
                            // This throws in the UWP app
                            if (!/UWP/.test(params.appType)) {
                                articleWindow.kiwixType = appstate.target;
                            }
                            articleContainer = articleWindow;
                        }
                        uiUtil.clearSpinner();
                    } else {
                        // Let Replay handle this link
                        anchor.passthrough = true;
                        articleContainer = document.getElementById('articleContent');
                        articleWindow = articleContainer.contentWindow;
                        appstate.target = 'iframe';
                        articleContainer.kiwixType = appstate.target;
                        if (appstate.selectedArchive.zimType === 'zimit2') {
                            // Since we know the URL works, normalize the href (this is needed for zimit2 relative links)
                            // NB We mustn't do this for zimit classic because it breaks wombat rewriting of absolute links!
                            anchor.href = pathToArticleDocumentRoot + zimUrl;
                        }
                        anchor.click();
                        // Poll spinner with abbreviated title
                        uiUtil.pollSpinner('Loading ' + dirEntry.getTitleOrUrl().replace(/([^/]+)$/, '$1').substring(0, 18) + '...');
                        var zimitIframe = appstate.selectedArchive.zimType === 'zimit' ? articleContainer.contentDocument.getElementById('replay_iframe')
                            : appstate.selectedArchive.zimType === 'zimit2' ? articleContainer : null;
                        if (params.cssTheme === 'darkReader' && zimitIframe) {
                            // articleContainer.style.display = 'none';
                            zimitIframe.style.display = 'none';
                            uiUtil.hideSlidingUIElements();
                        }
                    }
                }
            };
            if (dirEntry) {
                processDirEntry(dirEntry);
            } else {
                // If URL has final slash, we need to try it without the slash
                if (/\/$/.test(zimUrl)) {
                    zimUrl = zimUrl.replace(/\/$/, '');
                    return appstate.selectedArchive.getDirEntryByPath(zimUrl).then(function (dirEntry) {
                        if (dirEntry) {
                            processDirEntry(dirEntry);
                        } else {
                            // If dirEntry was still not-found, it's probably an external link, so warn user before opening a new tab/window
                            uiUtil.warnAndOpenExternalLinkInNewTab(null, anchor);
                        }
                    });
                } else {
                    // It's probably an external link, so warn user before opening a new tab/window
                    uiUtil.warnAndOpenExternalLinkInNewTab(null, anchor);
                }
            }
        }).catch(function (err) {
            console.error('Error getting dirEntry for ' + zimUrl, err);
            uiUtil.systemAlert('There was an error looking up ' + zimUrl, 'Error reading direcotry entry!');
        });
    }
}

function handleUnsupportedReplayWorker (unhandledDirEntry) {
    appstate.isReplayWorkerAvailable = false;
    // params.originalContentInjectionMode = params.contentInjectionMode;
    // params.contentInjectionMode = 'jquery';
    readArticle(unhandledDirEntry);
    if (!params.hideActiveContentWarning) {
        uiUtil.displayActiveContentWarning();
        return uiUtil.systemAlert('<p>You are attempting to open a Zimit (classic) archive, ' +
            'which is not fully supported by your browser in ServiceWorker(Local) mode.</p><p>We are using a legacy ' +
            'fallback method to read this archive, but some highly dynamic content may not work.</p>',
            'Legacy support for Zimit archives'
        );
    }
}

/**
 * Function that handles a messaging from the Service Worker when using libzim as the backend.
 * It tries to read the content in the backend, and sends it back to the ServiceWorker
 *
 * @param {Event} event The event object of the message channel
 */
function handleMessageChannelForLibzim (event) {
    if (appstate.selectedArchive.libzimReady !== 'ready') {
        return uiUtil.systemAlert("We're sorry, but the experimental libzim file reader isn't ready yet. Please wait a few seconds and try again, or reload the app.");
    }
    // The ServiceWorker asks for some content
    loaded = false;
    var title = event.data.title;
    var messagePort = event.ports[0];
    return appstate.selectedArchive.callLibzimWorker({ action: 'getEntryByPath', path: title, follow: false })
    .then(function (dirEntry) {
        if (dirEntry === null) {
            console.error('Title ' + title + ' not found in archive.');
            messagePort.postMessage({ action: 'giveContent', title: title, content: '' });
        } else if (dirEntry.isRedirect) {
            var redirectPath = dirEntry.redirectPath;
            // Ask the ServiceWorker to send an HTTP redirect to the browser.
            messagePort.postMessage({ action: 'sendRedirect', title: title, redirectUrl: redirectPath });
            // We have to prevent a null load event from firing, or else we get CORS errors blocking the app
            // loaded = true;
        } else {
            dirEntry.url = title.replace(/^[-ABCHIJMUVWX]\//, '');
            // DEV: Unlike with custom backend, libzim dirEntries contain a mimetype string rather than a function
            var message = { action: 'giveContent', title: title, content: dirEntry.content, mimetype: dirEntry.mimetype, origin: 'libzim' };
            if (/\bx?html\b/i.test(dirEntry.mimetype) && !dirEntry.isAsset) {
                if (articleContainer.kiwixType === 'iframe') articleContainer.style.display = 'none';
                articleContainer.onload = function () {
                    // if (loaded) return;
                    // articleContainer.style.display = '';
                    // resizeIFrame();
                    // // Trap clicks in the iframe to enable us to work around the sandbox when opening external links and PDFs
                    // articleWindow.removeEventListener('click', filterClickEvent, true);
                    // articleWindow.addEventListener('click', filterClickEvent, true);
                    articleLoadedSW(dirEntry, articleContainer);
                };
            }
            messagePort.postMessage(message);
        }
    }).catch(function () {
        messagePort.postMessage({ action: 'giveContent', title: title, content: new Uint8Array() });
    });
}

var loadingArticle = '';

/**
 * Function that handles a message of the messageChannel.
 * It tries to read the content in the backend, and sends it back to the ServiceWorker
 *
 * @param {Event} event The event object of the message channel
 */
function handleMessageChannelMessage (event) {
    // We received a message from the ServiceWorker
    loaded = false;
    var title = event.data.title;
    if (appstate.isReplayWorkerAvailable) {
        // Zimit ZIMs store assets with the querystring, so we need to add it!
        title = title + event.data.search;
    } else {
        // Zimit1 (classic) archives store URLs encoded, and also need the URI component (search parameter) if any
        if (params.zimType === 'zimit') {
            title = encodeURI(event.data.title) + event.data.search;
        }
        // If it's an asset, we have to mark the dirEntry so that we don't load it if it has an html MIME type
        var titleIsAsset = /\.(png|gif|jpe?g|svg|css|js|mpe?g|webp|webm|woff2?|eot|mp[43])(\?|$)/i.test(title);
        // For Zimit archives, articles will have a special parameter added to the URL to help distinguish an article from an asset
        if (params.zimType === 'zimit') {
            titleIsAsset = titleIsAsset || !/\??isKiwixHref/.test(title);
        }
        title = title.replace(/\??isKiwixHref/, ''); // Only applies to Zimit archives (added in transformZimit.js)
    }
    if (appstate.selectedArchive.landingPageUrl === title) params.isLandingPage = true;
    var messagePort = event.ports[0];
    if (!anchorParameter && event.data.anchorTarget) anchorParameter = event.data.anchorTarget;
    // Intercept landing page if already transformed (because this might have a fake dirEntry)
    // Note that due to inconsistencies in Zimit archives, we need to test the encoded and the decoded version of the title
    if (transformedHTML && transDirEntry && (title === transDirEntry.namespace + '/' + transDirEntry.url ||
        decodeURIComponent(title) === transDirEntry.namespace + '/' + transDirEntry.url)) {
        var message = {
            action: 'giveContent',
            title: title,
            mimetype: 'text/html'
        };
        postTransformedHTML(message, messagePort, transDirEntry);
        return;
    }
    var readFile = function (dirEntry) {
        if (dirEntry === null) {
            console.warn('Title ' + title.replace(/^(.{1,160}).*/, '$1...') + ' not found in archive.');
            if (!titleIsAsset && appstate.selectedArchive.zimType === 'zimit' && !appstate.isReplayWorkerAvailable) {
                // Use special routine to handle not-found titles for Zimit
                goToArticle(decodeURI(title));
            } else if (title === loadingArticle) {
                goToMainArticle();
            } else {
                // DEV: We send null for the content, so that the ServiceWorker knows that the article was not found (as opposed to being merely empty)
                messagePort.postMessage({ action: 'giveContent', title: title, content: null, zimType: appstate.selectedArchive.zimType });
            }
        } else if (dirEntry.isRedirect()) {
            appstate.selectedArchive.resolveRedirect(dirEntry, function (resolvedDirEntry) {
                var redirectURL = resolvedDirEntry.namespace + '/' + resolvedDirEntry.url;
                // Ask the ServiceWork to send an HTTP redirect to the browser.
                // We could send the final content directly, but it is necessary to let the browser know in which directory it ends up.
                // Else, if the redirect URL is in a different directory than the original URL,
                // the relative links in the HTML content would fail. See #312
                messagePort.postMessage({ action: 'sendRedirect', title: title, redirectUrl: redirectURL });
            });
        // Bypass all processing if we're using the Replay Worker
        } else if (appstate.isReplayWorkerAvailable) {
            // Let's read the content in the ZIM file
            appstate.selectedArchive.readBinaryFile(dirEntry, function (fileDirEntry, content) {
                var mimetype = fileDirEntry.getMimetype();
                // Show the spinner
                var shortTitle = dirEntry.getTitleOrUrl().replace(/^.*?([^/]{3,18})[^/]*\/?$/, '$1 ...');
                if (!/moved/i.test(shortTitle) && !/javascript|image|woff|warc-headers|jsonp?/.test(mimetype)) {
                    uiUtil.pollSpinner(shortTitle);
                }
                // Let's send the content to the ServiceWorker
                var buffer = content.buffer ? content.buffer : content;
                var message = { action: 'giveContent', title: title, content: buffer, mimetype: mimetype, zimType: appstate.selectedArchive.zimType };
                messagePort.postMessage(message);
                // Ensure the article onload event gets attached to the right iframe
                articleLoader(dirEntry, mimetype);
            });
        } else {
            var mimetype = dirEntry.getMimetype();
            var imageDisplayMode = params.imageDisplayMode;
            if (/\b(css|javascript|video|vtt|webm)\b/i.test(mimetype)) {
                var shortTitle = dirEntry.url.replace(/[^/]+\//g, '').substring(0, 18);
                uiUtil.pollSpinner('Getting ' + shortTitle + '...');
            }
            // If it's an HTML type and not an asset, and we're not using pureMode, then we load it in a new page instance
            if (/\bx?html\b/i.test(mimetype) && !appstate.pureMode &&
            !dirEntry.isAsset && !/\.(png|gif|jpe?g|svg|css|js|mpe?g|webp|webm|woff2?|eot|mp[43])(\?|$)/i.test(dirEntry.url)) {
                loadingArticle = title;
                // Intercept files of type html and apply transformations
                var message = {
                    action: 'giveContent',
                    title: title,
                    mimetype: mimetype,
                    imageDisplay: imageDisplayMode
                };
                if (!transformedHTML) {
                    // It's an unstransformed html file, so we need to do some content transforms and wait for the HTML to be available
                    if (!~params.lastPageVisit.indexOf(dirEntry.url)) params.lastPageVisit = '';
                    // Tell the read routine that the request comes from a messageChannel
                    messageChannelWaiting = true;
                    readArticle(dirEntry);
                    setTimeout(postTransformedHTML, 300, message, messagePort, dirEntry);
                } else {
                    postTransformedHTML(message, messagePort, dirEntry);
                }
                return;
            } else {
                loadingArticle = '';
            }
            var cacheKey = appstate.selectedArchive.file.name + '/' + title;
            cache.getItemFromCacheOrZIM(appstate.selectedArchive, cacheKey, dirEntry).then(function (content) {
                if (params.zimType === 'zimit' && (loadingArticle || /\bx?html/.test(mimetype) && /window._WBWombat/.test(content))) {
                    // We need to work around the redirection script in all Zimit HTML files in case we're loading the HTML in a frame
                    // or as a new window
                    content = content.replace(/!(window._WBWombat)/, '$1');
                }
                // Let's send the content to the ServiceWorker
                var buffer = content.buffer ? content.buffer : content;
                var message = {
                    action: 'giveContent',
                    title: title,
                    mimetype: mimetype,
                    imageDisplay: imageDisplayMode,
                    content: buffer
                };
                if (dirEntry.nullify) {
                    message.content = '';
                } else if (!params.windowOpener && /\/pdf\b/.test(mimetype)) {
                    // This is a last gasp attempt to avoid a CSP violation with PDFs. If windowOpener is set, then they should open
                    // in a new window, but if user has turned that off, we need to offer PDFs as a download
                    uiUtil.displayFileDownloadAlert(title, true, mimetype, content);
                    uiUtil.clearSpinner();
                    return;
                }
                messagePort.postMessage(message);
            });
        }
    };
    if (params.zimType === 'zimit' && !appstate.isReplayWorkerAvailable) {
        title = title.replace(/^([^?]+)(\?[^?]*)?$/, function (m0, m1, m2) {
            // Note that Zimit ZIMs store ZIM URLs encoded, but SOME incorrectly encode using encodeURIComponent, instead of encodeURI!
            return m1.replace(/[&]/g, '%26').replace(/,/g, '%2C') + (m2 || '');
        });
    }
    // Intercept YouTube video requests
    if (params.zimType === 'zimit' && !appstate.isReplayWorkerAvailable && /youtubei.*player/.test(title)) {
        var cns = appstate.selectedArchive.getContentNamespace();
        var newTitle = (cns === 'C' ? 'C/' : '') + 'A/' + 'youtube.com/embed/' + title.replace(/^[^?]+\?key=([^&]+).*/, '$1');
        newTitle = 'videoembed/' + newTitle; // This is purely to match the regex in transformZimit
        transformZimit.transformVideoUrl(newTitle, articleDocument, function (newVideoUrl) {
            // NB this will intentionally fail, as we don't want to look up content yet
            return newVideoUrl;
        });
        return;
    }
    appstate.selectedArchive.getDirEntryByPath(title).then(function (dirEntry) {
        if (dirEntry) dirEntry.isAsset = titleIsAsset;
        return readFile(dirEntry);
    }).catch(function (err) {
        console.error('Failed to read ' + title, err);
        messagePort.postMessage({ action: 'giveContent', title: title, content: new Uint8Array(), zimType: appstate.selectedArchive.zimType });
    });
}

function postTransformedHTML (thisMessage, thisMessagePort, thisDirEntry) {
    if (transformedHTML && /<html[^>]*>/i.test(transformedHTML)) {
        // Because UWP app window can only be controlled from the Service Worker, we have to allow all images
        // to be called from any external windows. NB messageChannelWaiting is only true when user requested article from a UWP window
        if (/UWP/.test(params.appType) && (appstate.target === 'window' || messageChannelWaiting) &&
            params.imageDisplay) { thisMessage.imageDisplay = 'all'; }
        // We need to do the same for Gutenberg and PHET ZIMs
        if (params.imageDisplay && (/gutenberg|phet/i.test(appstate.selectedArchive.file.name)
            // || params.isLandingPage
            )) {
            thisMessage.imageDisplay = 'all';
        }
        // Let's send the content to the ServiceWorker
        thisMessage.content = transformedHTML;
        transformedHTML = '';
        transDirEntry = null;
        loaded = false;
        // If loading the iframe, we can hide the frame for UWP apps (for others, the doc should already be hidden)
        // NB Test for messageChannelWaiting filters out requests coming from a UWP window
        if (articleContainer.kiwixType === 'iframe' && !messageChannelWaiting) {
            if (/UWP/.test(params.appType)) {
                articleContainer.style.display = 'none';
                setTimeout(function () {
                    if (!loaded) articleLoadedSW(thisDirEntry, articleContainer);
                }, 800);
            }
            articleContainer.onload = function () {
                if (!loaded) articleLoadedSW(thisDirEntry, articleContainer);
            };
        } else {
            // New windows do not respect the onload event because they've been pre-populated,
            // so we have to simulate this event (note potential for race condition if timeout is too short)
            // NB The UWP app cannot control the opened window, so it can only be controlled by the Service Worker
            setTimeout(function () {
                uiUtil.clearSpinner();
            }, 2000);
            if (!/UWP/.test(params.appType)) {
                setTimeout(function () {
                    if (!loaded) articleLoadedSW(thisDirEntry, articleContainer);
                }, 400);
            }
        }
        thisMessagePort.postMessage(thisMessage);
        messageChannelWaiting = false;
        // Failsafe to turn off spinner
        setTimeout(function () {
            uiUtil.clearSpinner();
        }, 5000);
    } else if (messageChannelWaiting) {
        setTimeout(postTransformedHTML, 500, thisMessage, thisMessagePort, thisDirEntry);
    }
}

// Compile some regular expressions needed to modify links

// Pattern to find the path in a url
var regexpPath = /^(.*\/)[^/]+$/;

// Pattern to find a ZIM URL (with its namespace) - see https://wiki.openzim.org/wiki/ZIM_file_format#Namespaces
params.regexpZIMUrlWithNamespace = /^[./]*([-ABCHIJMUVWX]\/.+)$/;

// The case-insensitive regex below finds images, scripts, and stylesheets with ZIM-type metadata and image namespaces.
// It first searches for <img, <script, <link, etc., then scans forward to find, on a word boundary, either src=["'] or href=["']
// (ignoring any extra whitespace), and it then tests the path of the URL with a non-capturing negative lookahead (?!...) that excludes
// absolute URIs with protocols that conform to RFC 3986 (e.g. 'http:', 'data:'). It then captures the whole of the URL up until any
// querystring (? character) which (if it is exists) is captured with its contents in another group. The regex then tests for the end
// of the URL with the opening delimiter (" or ', which is capture group \3) or a hash character (#). When the regex is used below, it
// will be further processed to calculate the ZIM URL from the relative path. This regex can cope with legitimate single quote marks (') in the URL.
params.regexpTagsWithZimUrl = /(<(?:img|script|link)\b[^>]*?\s)(?:src|href)(\s*=\s*(["']))(?![a-z][a-z0-9+.-]+:)(.+?)(\?.*?)?(?=\3|#)([\s\S]*?>)/ig;

// Similar to above, but tailored for Zimit links
// params.regexpZimitLinks = /(<(?:a|img|script|link|track)\b[^>]*?\s)(?:src|href)(=(["']))(?!#)(.+?)(?=\3|\?|#)([\s\S]*?>)/ig;

// Regex below tests the html of an article for active content [kiwix-js #466]
// It inspects every <script> block in the html and matches in the following cases: 1) the script is of type "module"; 2) the script
// loads a UI application called app.js, init.js, or other common scripts found in unsupported ZIMs; 3) the script block has inline
// content that does not contain "importScript()", "toggleOpenSection" or an "articleId" assignment (these strings are used widely in our
// fully supported wikimedia ZIMs, so they are excluded); 4) the script block is not of type "math" (these are MathJax markup scripts used
// extensively in Stackexchange ZIMs). Note that the regex will match ReactJS <script type="text/html"> markup, which is common in unsupported
// packaged UIs, e.g. PhET ZIMs.
var regexpActiveContent = /<script\b(?:(?![^>]+src\b)|(?=[^>]*type=["']module["'])|(?=[^>]+src\b=["'][^"']*?\b(?:app|init|ractive|l1[08]9)\.js))(?![^<]+(?:importScript\(\)|toggleOpenSection|articleId\s?=\s?['"]|window.NREUM))(?![^>]+type\s*=\s*["'](?:math\/|[^"']*?math))/i;

// DEV: The regex below matches ZIM links (anchor hrefs) that should have the html5 "donwnload" attribute added to
// the link. This is currently the case for epub and pdf files in Project Gutenberg ZIMs -- add any further types you need
// to support to this regex. The "zip" has been added here as an example of how to support further filetypes
var regexpDownloadLinks = /^.*?\.epub([?#]|$)|^.*?\.pdf([?#]|$)|^.*?\.odt([?#]|$)|^.*?\.zip([?#]|$)/i;

// This matches the data-kiwixurl of all <link> tags containing rel="stylesheet" or "...icon" in raw HTML unless commented out
var regexpSheetHref = /(<link\s+(?=[^>]*rel\s*=\s*["'](?:stylesheet|[^"']*icon))[^>]*(?:href|data-kiwixurl)\s*=\s*["'])([^"']+)(["'][^>]*>)(?!\s*--\s*>)/ig;

// A string to hold any anchor parameter in clicked ZIM URLs (as we must strip these to find the article in the ZIM)
var anchorParameter;

params.containsMathTexRaw = false;
params.containsMathTex = false;
params.containsMathSVG = false;

/**
 * Display the the given HTML article in the web page,
 * and convert links to javascript calls
 * NB : in some error cases, the given title can be null, and the htmlArticle contains the error message
 * @param {DirEntry} dirEntry The Directory Entry of the article
 * @param {String} htmlArticle The decoded HTML of the article
 */
function displayArticleContentInContainer (dirEntry, htmlArticle) {
    // if (! isDirEntryExpectedToBeDisplayed(dirEntry)) {
    //    return;
    // }

    // TESTING
    console.log('** HTML received for article ' + dirEntry.url + ' **');

    if (!/\bx?html\b/.test(dirEntry.getMimetype())) {
        // Construct an HTML document to wrap the content
        htmlArticle = '<html><body style="color:yellow;background:darkblue;"><pre>' + htmlArticle + '</pre></body></html>';
        // Ensure the window target is permanently stored as a property of the articleWindow (since appstate.target can change)
        articleWindow.kiwixType = appstate.target;
        // Scroll the old container to the top
        articleWindow.scrollTo(0, 0);
        var articleDoc = articleWindow.document;
        articleDoc.open();
        articleDoc.write(htmlArticle);
        articleDoc.close();
        return;
    }
    // If we find a stylesheet beginning with a root-relative link ('/something.css'), then we're in a very old legacy ZIM
    params.isLegacyZIM = false;
    if (params.zimType === 'open') {
        params.isLegacyZIM = /<link\b[^>]+href\s*=\s*["']\/[^."']+\.css["']/i.test(htmlArticle);
    }
    params.isLandingPage = appstate.selectedArchive.landingPageUrl === dirEntry.namespace + '/' + dirEntry.url
        ? true : params.isLandingPage;
    // Due to fast article retrieval algorithm, we need to embed a reference to the landing page in the html
    if (params.isLandingPage && !/<html[^>]*islandingpage/i.test(htmlArticle)) {
        htmlArticle = htmlArticle.replace(/(<html[^>]*)>/i, '$1 data-kiwixid="islandingpage">');
    }

    // Display Bootstrap warning alert if the landing page contains active content
    if (!params.hideActiveContentWarning && (params.isLandingPage || appstate.selectedArchive.zimitStartPage === dirEntry.namespace + '/' + dirEntry.url) &&
        (params.contentInjectionMode === 'jquery' || params.manipulateImages || params.allowHTMLExtraction || /zimit/.test(appstate.selectedArchive.zimType))) {
        if (params.isLegacyZIM || regexpActiveContent.test(htmlArticle)) {
            // Exempted scripts: active content warning will not be displayed if any listed script is in the html [kiwix-js #889]
            if (params.isLegacyZIM || !/<script\b[^'"]+['"][^'"]*?mooc\.js/i.test(htmlArticle)) {
                setTimeout(function () {
                    uiUtil.displayActiveContentWarning(params.isLegacyZIM ? 'legacy' : params.zimType);
                }, 1500);
            }
            if (params.isLegacyZIM && params.contentInjectionMode === 'serviceworker') {
                // Pop up a dialogue box to warn the user about the legacy ZIM
                uiUtil.systemAlert('<p>To view this legacy ZIM archive with its correct stylesheets, you will need to switch to Restricted mode.</p>' +
                    "<p>Don't forget to switch back afterwards!</p>", 'Legacy ZIM file');
            }
        }
    }

    // App appears to have successfully launched
    params.appIsLaunching = false;

    // Calculate the current article's ZIM baseUrl to use when processing relative links
    // (duplicated because we sometimes bypass readArticle above)
    params.baseURL = encodeURI(dirEntry.namespace + '/' + dirEntry.url.replace(/[^/]+$/, ''));
        // URI-encode anything that is not a '/'
        // .replace(/[^/]+/g, function(m) {
        //     return encodeURIComponent(m);
        // });

    // Since page has been successfully loaded, store it in the browser history
    if (params.contentInjectionMode === 'jquery') pushBrowserHistoryState(dirEntry.namespace + '/' + dirEntry.url);
    // Store for fast retrieval
    params.lastPageVisit = dirEntry.namespace + '/' + dirEntry.url + '@kiwixKey@' + appstate.selectedArchive.file.name;
    if (params.rememberLastPage) settingsStore.setItem('lastPageVisit', params.lastPageVisit, Infinity);
    cache.setArticle(appstate.selectedArchive.file.name, dirEntry.namespace + '/' + dirEntry.url, htmlArticle, function () {});
    params.htmlArticle = htmlArticle;

    // Replaces ZIM-style URLs of img, script, link and media tags with a data-kiwixurl to prevent 404 errors [kiwix-js #272 #376]
    // This replacement also processes the URL relative to the page's ZIM URL so that we can find the ZIM URL of the asset
    // with the correct namespace (this works for old-style -,I,J namespaces and for new-style C namespace)
    if (params.linkToWikimediaImageFile && !params.isLandingPage && /(?:wikipedia|wikivoyage|wiktionary|mdwiki)_/i.test(appstate.selectedArchive.file.name)) {
        var wikiLang = appstate.selectedArchive.file.name.replace(/(?:wikipedia|wikivoyage|wiktionary|mdwiki)_([^_]+).+/i, '$1');
        var wikimediaZimFlavour = appstate.selectedArchive.file.name.replace(/_.+/, '');
    }
    var newBlock;
    var assetZIMUrlEnc;
    var indexRoot = window.location.pathname.replace(/[^/]+$/, '') + encodeURI(appstate.selectedArchive.file.name) + '/';
    if (params.contentInjectionMode == 'jquery') {
        htmlArticle = htmlArticle.replace(params.regexpTagsWithZimUrl, function (match, blockStart, equals, quote, relAssetUrl, querystring, blockClose) {
            // Don't process data URIs (yet)
            if (/data:image/i.test(relAssetUrl)) return match;
            // We need to save the query string if any for Zimit-style archives
            querystring = querystring || '';
            if (/zimit/.test(params.zimType)) {
                assetZIMUrlEnc = relAssetUrl.replace(indexRoot, '');
                assetZIMUrlEnc = assetZIMUrlEnc + querystring;
            }
            if (params.zimType !== 'zimit') {
                // DEV: Note that deriveZimUrlFromRelativeUrl produces a *decoded* URL (and incidentally would remove any URI component
                // if we had captured it). We therefore re-encode the URI with encodeURI (which does not encode forward slashes) instead
                // of encodeURIComponent.
                assetZIMUrlEnc = encodeURI(uiUtil.deriveZimUrlFromRelativeUrl(relAssetUrl, params.baseURL));
            }
            newBlock = blockStart + 'data-kiwixurl' + equals + assetZIMUrlEnc + blockClose;
            // Replace any srcset with data-kiwixsrcset
            newBlock = newBlock.replace(/\bsrcset\s*=/, 'data-kiwixsrcset=');
            // For Wikipedia archives, hyperlink the image to the File version
            if (wikiLang && /^<img/i.test(blockStart) && !/usemap=|math-fallback-image/i.test(match)) {
                newBlock = '<a href="https://' + (wikimediaZimFlavour !== 'mdwiki' ? wikiLang + '.' : '') + wikimediaZimFlavour +
                    '.org/wiki/File:' + assetZIMUrlEnc.replace(/^.+\/([^/]+?\.(?:jpe?g|svg|png|gif))[^/]*$/i, '$1') +
                    '" target="_blank">' + newBlock + '</a>'
            }
            return newBlock;
        });
        // We also need to process data:image/webp if the browser needs the WebPMachine
        if (webpMachine) htmlArticle = htmlArticle.replace(/(<img\b[^>]*?\s)src(\s*=\s*["'])(?=data:image\/webp)([^"']+)/ig, '$1data-kiwixurl$2$3');
        // Remove any empty media containers on page (they can cause layout issue in Restricted mode)
        htmlArticle = htmlArticle.replace(/(<(audio|video)\b(?:[^<]|<(?!\/\2))+<\/\2>)/ig, function (p0) {
            return /(?:src|data-kiwixurl)\s*=\s*["']/.test(p0) ? p0 : '';
        });
    } else if (wikiLang || params.manipulateImages) {
        htmlArticle = htmlArticle.replace(params.regexpTagsWithZimUrl, function (match, blockStart, equals, quote, relAssetUrl, querystring, blockClose) {
            // Don't process data URIs (yet)
            if (/data:image/i.test(relAssetUrl)) return match;
            newBlock = match;
            // Add the kiwix-display directive so that the SW sends a dummy image instead
            if (params.manipulateImages && params.imageDisplay !== 'all' && /^<img/i.test(blockStart)) {
                newBlock = newBlock.replace(relAssetUrl, relAssetUrl + '?kiwix-display');
            }
            if (wikiLang) {
                // For Wikipedia archives, hyperlink the image to the File version
                var assetZIMUrl = decodeURIComponent(relAssetUrl);
                if (/^<img/i.test(blockStart) && !/usemap=|math-fallback-image/i.test(match)) {
                    newBlock = '<a href="https://' + (wikimediaZimFlavour !== 'mdwiki' ? wikiLang + '.' : '') + wikimediaZimFlavour +
                        '.org/wiki/File:' + assetZIMUrl.replace(/^.+\/([^/]+?\.(?:jpe?g|svg|png|gif))[^/]*$/i, '$1') +
                        '" target="_blank">' + newBlock + '</a>'
                }
            }
            return newBlock;
        });
    }

    if (params.zimType === 'open') {
        // Some documents (e.g. Ray Charles Index) can't be scrolled to the very end, as some content remains benath the footer
        // so add some whitespace at the end of the document
        htmlArticle = htmlArticle.replace(/(<\/body>)/i, '\r\n<p>&nbsp;</p><p>&nbsp;</p><p>&nbsp;</p><p>&nbsp;</p>\r\n$1');
        htmlArticle = htmlArticle.replace(/(dditional\s+terms\s+may\s+apply\s+for\s+the\s+media\s+files[^<]+<\/div>\s*)/i, '$1\r\n<h1></h1><p>&nbsp;</p><p>&nbsp;</p><p>&nbsp;</p>\r\n');
        var i;
        // Dirty patches that improve performance or layout with Wikimedia ZIMs. DEV: review regularly and remove when no longer needed.
        if (appstate.wikimediaZimLoaded && params.cssCache) {
            // Reduce weight of unused JS archives for mediawiki ZIMs and troublesome JS in mobile-html endpoint ZIMs. This patch also removes mediawiki.page.ready.js which breakds the iframe kiwix-js #972
            htmlArticle = htmlArticle.replace(/<script\b[^<]+src=["'][^"']*(mediawiki|wikimedia|jquery|configvars|startup|visibilitytoggles|site|enhancements|scribunto|ext\.math|\.player|webp(?:Handler|Hero))[^"']*\.js\b[^<]+<\/script>/gi, '');
            // @TODO - remove this when issue fixed: VERY DIRTY PATCH FOR HTML IN PAGE TITLES on Wikivoyage
            htmlArticle = htmlArticle.replace(/&lt;a href[^"]+"\/wiki\/([^"]+)[^<]+&gt;([^<]+)&lt;\/a&gt;/ig, '<a href="$1.html">$2</a>');
            htmlArticle = htmlArticle.replace(/&lt;(\/?)(i|b|em|strong)&gt;/ig, '<$1$2>');
            // @TODO - remove when fixed on mw-offliner: dirty patch for removing extraneous tags in ids
            htmlArticle = htmlArticle.replace(/(\bid\s*=\s*"[^\s}]+)\s*\}[^"]*/g, '$1');
            // Remove erroneous content frequently on front page
            htmlArticle = htmlArticle.replace(/<h1\b[^>]+>[^/]*?User:Popo[^<]+<\/h1>\s*/i, '');
            htmlArticle = htmlArticle.replace(/<span\b[^>]+>[^/]*?User:Popo[^<]+<\/span>\s*/i, '');
            // Remove landing page scripts that don't work in SW mode
            htmlArticle = htmlArticle.replace(/<script\b[^>]+-\/[^>]*((?:images_loaded|masonry)\.min|article_list_home)\.js"[^<]*<\/script>/gi, '');
            // Remove wm_mobile_override script that intercepts all clicks and causes CORS errors
            htmlArticle = htmlArticle.replace(/<script\b[^>]+wm_mobile_override_script\.js[^<]*<\/script>/i, '');
            // Edit sidebar style to make it an infobox
            htmlArticle = htmlArticle.replace(/(<table\s+class=["'][^"']*)sidebar\s/gi, '$1infobox ');
            // Remove the script.js that closes top-level sections if user requested this
            if (params.openAllSections) htmlArticle = htmlArticle.replace(/<script\b[^>]+-\/(j\/js_modules\/)?script\.js"[^<]*<\/script>/i, '');
            // Deal with incorrectly sized masonry pages
            htmlArticle = htmlArticle.replace(/(<body\b[^<]+<div\b[^>]+?id=['"]container['"][^>]*)/i, '$1 style="height:auto;"');
            // @TODO Remove when fixed in https://github.com/openzim/mwoffliner/issues/1662
            // Put site.js in the correct position
            htmlArticle = htmlArticle.replace(/(<script\b[^>]+\/site\.js["']><\/script>\s*)((?:[^<]|<(?!\/body))+)/, '$2$1');
            // @TODO Remove when fixed in https://github.com/openzim/mwoffliner/issues/1872
            // Add missing title to WikiMedia articles for post June 2023 scrapes
            htmlArticle = !params.isLandingPage && !/<h1\b[^>]+(?:section-heading|article-header)/i.test(htmlArticle) ? htmlArticle.replace(/(<section\sdata-mw-section-id="0"[^>]+>\s*)/i, '$1<h1 style="margin:10px 0">' + dirEntry.getTitleOrUrl().replace(/&lt;/g, '<') + '</h1>') : htmlArticle;
            // Remove hard-coded image widths for new mobile-html endpoint ZIMs
            htmlArticle = htmlArticle.replace(/(<div\s+class=['"]thumb\stright['"][^<]+?<div\s+class=['"]thumbinner['"]\s+style=['"])width:\s*642px([^<]+?<img\s[^>]+?width=)[^>]+?height=['"][^'"]+?['"]/ig, '$1$2"320px"');
            htmlArticle = htmlArticle.replace(/(<img\s[^>]+(?:min-width:\s*|width=['"]))(\d+px)([^>]+>\s*<div\b[^>]+style=['"])/ig, '$1$2$3max-width: $2; ');
            // Remove reference to unusued pcs scripts (onBodyStart and onBodyEnd) in mobile-html endpoint ZIMs (causes unhandled type error)
            htmlArticle = htmlArticle.replace(/<script[^>]*>[^<]*pcs\.c1\.Page\.onBody[^<]+<\/script>\s*/ig, '');
            if (!params.isLandingPage) {
                // Convert section tags to details tags (we have to loop because regex only matches innermost <section>...</section>)
                for (i = 5; i--;) {
                    htmlArticle = htmlArticle.replace(/<section\b([^>]*data-mw-section-id=["'][1-9][^>]*)>((?:(?=([^<]+))\3|<(?!section\b[^>]*>))*?)<\/section>/ig, function (m0, m1, m2) {
                        var summary = m2.replace(/(?:<div\s+class=["']pcs-edit[^>]+>)?(<(h[2-9])\b[^>]*>(?:[^<]|<(?!\2))+?<\/\2>)(?:<\/div>)?/i, '<summary class="section-heading collapsible-heading">$1</summary>');
                        return '<details ' + m1 + '>' + summary + '</details>';
                    });
                    // We can stop iterating if all sections are consumed
                    if (!/<section\b[^>]*data-mw-section-id=["'][1-9]/i.test(htmlArticle)) break;
                }
            }
        } else if (appstate.wikimediaZimLoaded && params.openAllSections) {
            // Remove incompatible webP handler that breaks on some Edge Legacy and conflicts with own webP handler
            // @TODO It appears webpHandler is loaded by script.js, so this line and equivalent in block above may be redundant. Check for latest ZIMs.
            // Maybe older ZIMs loaded them direct?
            htmlArticle = htmlArticle.replace(/<script\b[^>]+src=["'][^"']*(webp(?:Handler|Hero))[^"']*\.js\b[^<]+<\/script>/gi, '');
            htmlArticle = htmlArticle.replace(/<script\b[^>]+-\/(j\/js_modules\/)?script\.js"[^<]*<\/script>/i, '');
        }

        // Add a fake favicon to prevent the browser making a useless search for one
        if (!/<link\s[^>]*rel=["']icon["']/.test(htmlArticle)) htmlArticle = htmlArticle.replace(/(<head\b[^>]*>)(\s*)/i, '$1<link rel="icon" href="data:,">$2');

        // Gutenberg ZIMs try to initialize before all assets are fully loaded. Affect UWP app.
        htmlArticle = htmlArticle.replace(/(<body\s[^<]*onload=(['"]))([^'"]*init\([^'"]+showBooks\([^'"]+)\2/i, '$1setTimeout(function () {$3}, 300);$2');

        // Put misplaced disambiguation header back in its correct position @TODO remove this when fixed in mw-offliner
        var noexcerpt = htmlArticle.match(/<h1\b(?:[^<]|<(?!h2))+?(<dl\b(?:[^<]|<(?!\/dl>)){1,50}?(?:For\sother\s.{5,20}\swith\s|Not\sto\sbe\sconfused\swith|mw-redirect[^<]+travel\stopic|This\sarticle\sis\sa|See\salso:)(?:[^<]|<(?!\/dl>))+<\/dl>\s*)/i);
        if (noexcerpt && noexcerpt[1] && noexcerpt[1].length) {
            htmlArticle = htmlArticle.replace(noexcerpt[1], '');
            htmlArticle = htmlArticle.replace(/(<\/h1>\s*)/i, '$1' + noexcerpt[1]);
        }
        // Put misplaced hatnote headers inside <h1> block back in correct position @TODO remove this when fixed in mw-offliner
        var hatnote;
        var hatnotes = [];
        do {
            hatnote = util.matchOuter(htmlArticle, '<div\\b[^>]+\\b(?:hatnote|homonymie|dablink)\\b', '</div>\\s*', 'i');
            if (hatnote && hatnote.length) {
                // Ensure the next matching hatnote is under h1
                if (/<h1\b(?:[^<]|<(?!h2))+<div\b[^>]+\b(?:hatnote|homonymie|dablink)\b/i.test(htmlArticle)) {
                    htmlArticle = htmlArticle.replace(hatnote[0], '');
                    hatnotes.push(hatnote[0]);
                } else {
                    break;
                }
            }
        } while (hatnote.length);
        // Ensure we replace them in the right order
        for (i = hatnotes.length; i--;) {
            htmlArticle = htmlArticle.replace(/(<\/h1>\s*)/i, '$1' + hatnotes[i].replace(/(<div\s+)/i, '$1style="padding-top:10px;" '));
        }

        // Remove white background colour (causes flashes in dark mode)
        htmlArticle = htmlArticle.replace(/(<body\b[^>]+style=["'][^"']*)background-color\s*:\s*[^;]+;\s*/i, '$1');
        htmlArticle = htmlArticle.replace(/(<div\b(?=[^>]+class=\s*["'][^"']*mw-body)[^>]+style=["'][^"']*)background-color\s*:\s*[^;]+;\s*/i, '$1');

        // Display IPA pronunciation info erroneously hidden in some ZIMs
        htmlArticle = htmlArticle.replace(/(<span\b[^>]+?class\s*=\s*"[^"]+?mcs-ipa[^>]+?display:\s*)none/i, '$1inline');

        // Remove any background:url statements in style blocks as they cause the system to attempt to load them
        htmlArticle = htmlArticle.replace(/background:url\([^)]+\)[^;}]*/ig, '');

        // Remove the details polyfill: it's poor and doesn't recognize Edgium
        htmlArticle = htmlArticle.replace(/<script\b[^<]+details[^"']*polyfill\.js[^<]+<\/script>\s*/i, '');

        // Remove article.js on youtube ZIMs as it erroneously hides description
        htmlArticle = /<video\b/i.test(htmlArticle) ? htmlArticle.replace(/<script\b[^<]+assets\/article\.js[^<]+<\/script>\s*/i, '') : htmlArticle;

        // Remove empty div that causes layout issues in desktop style (but don't remove in SW mode, as they are dynamically filled)
        if (params.contentInjectionMode === 'jquery') htmlArticle = htmlArticle.replace(/<div\b[^>]*?>\s*<\/div>\s*/, '');

        // Remove erroneous scrape of MDWiki owid iframes @TODO remove this when fixed in mw-offliner
        htmlArticle = htmlArticle.replace(/<iframe\b[^>]+class=["'][^"']*?owid-frame(?:[^<]|<(?!\/iframe>))+<\/iframe>\s*/ig, '');
    }

    if (params.contentInjectionMode == 'jquery') {
        // Neutralize all inline scripts for now (later use above), excluding math blocks or react templates
        htmlArticle = htmlArticle.replace(/<(script\b(?![^>]+type\s*=\s*["'](?:math\/|text\/html|[^"']*?math))(?![^<]*darkreader\.)(?:[^<]|<(?!\/script>))+<\/script)>/ig, function (p0, p1) {
            return '<!-- ' + p1 + ' --!>';
        });
        // Neutralize onload events, as they cause a crash in ZIMs with proprietary UIs
        htmlArticle = htmlArticle.replace(/(<[^>]+?)onload\s*=\s*["'][^"']+["']\s*/ig, '$1');
        // Neutralize onclick events
        htmlArticle = htmlArticle.replace(/(<[^>]+?)onclick\s*=\s*["'][^"']+["']\s*/ig, '$1');
        // Neutralize href="javascript:" links
        htmlArticle = htmlArticle.replace(/href\s*=\s*["']javascript:[^"']+["']/gi, 'href=""');
    // } else if (/journals\.openedition\.org/i.test(params.zimitPrefix)) {
    //     // Neutralize all inline scripts, excluding math blocks or react templates, as they cause a loop on loading article
    //     htmlArticle = htmlArticle.replace(/<(script\b(?![^>]+type\s*=\s*["'](?:math\/|text\/html|[^"']*?math))(?:[^<]|<(?!\/script>))+<\/script)>/ig, function (p0, p1) {
    //         return '<!-- ' + p1 + ' --!>';
    //     });
    }

    /**
     * MathML detection
     */

    // Get out of the way if Service Worker mode and there is an existing MathJax installation
    params.useMathJax = params.contentInjectionMode === 'serviceworker' && /<script\b[^>]+MathJax\.js/i.test(htmlArticle)
        ? false : params.useMathJax;
    // Detect raw MathML on page for certain ZIMs that are expected to have it
    params.containsMathTexRaw = params.useMathJax &&
        /stackexchange|askubuntu|superuser|stackoverflow|mathoverflow|serverfault|stackapps|proofwiki/i.test(appstate.selectedArchive.file.name)
        ? /[^\\](\$\$?)((?:\\\$|(?!\1)[\s\S])+)\1/.test(htmlArticle) : false;

    // if (params.containsMathTexRaw) {
    //    //Replace undefined \size controlscript with \normalsize (found on proofwiki)
    //    htmlArticle = htmlArticle.replace(/(\\)size\b/g, '$1normalsize');
    // }

    // Replace all TeX SVGs with MathJax scripts
    if (params.useMathJax) {
        // Deal with any newer MathML blocks
        htmlArticle = htmlArticle.replace(/(<math\b[^>]+alttext=(["']))((?:[^"']|[\s\S](?!\2))+?)(\2(?:[^<]|<(?!\/math))+(?:[^<]|<(?!img))+)<img\b[^>]+?class=["'][^"']*?mwe-math-fallback-image[^>]+>/ig,
        function (_p0, p1, _p2, math, p4) {
            // Remove any rogue ampersands in MathJax due to double escaping (by Wikipedia)
            math = math.replace(/&amp;/g, '&');
            // Change any mbox commands to fbox (because KaTeX doesn't support mbox)
            math = math.replace(/mbox{/g, 'fbox{');
            return p1 + math + p4 + '<script type="math/tex">' + math + '</script>';
        });
        // Older math blocks
        htmlArticle = htmlArticle.replace(/<img\s+(?=[^>]+?math-fallback-image)[^>]*?alt\s*=\s*(['"])((?:[^"']|(?!\1)[\s\S])+)[^>]+>/ig,
        function (p0, p1, math) {
            // Remove any rogue ampersands in MathJax due to double escaping (by Wikipedia)
            math = math.replace(/&amp;/g, '&');
            // Change any mbox commands to fbox (because KaTeX doesn't support mbox)
            math = math.replace(/mbox{/g, 'fbox{');
            return '<script type="math/tex">' + math + '</script>';
        });
    }

    params.containsMathTex = params.useMathJax ? /<(script|span)\s+(type|class)\s*=\s*['"]\s*(math\/tex|latex)\s*['"]/i.test(htmlArticle) : false;
    params.containsMathSVG = params.useMathJax ? /<img\s+(?=[^>]+?math-fallback-image)[^>]*?alt\s*=\s*['"][^'"]+[^>]+>/i.test(htmlArticle) : false;

    // Add CSP to prevent external scripts and content - note that any existing CSP can only be hardened, not loosened
    htmlArticle = htmlArticle.replace(/(<head\b[^>]*>)\s*/, '$1\n    <meta http-equiv="Content-Security-Policy" content="default-src \'self\' data: file: blob: bingmaps: about: \'unsafe-inline\' \'unsafe-eval\';"></meta>\n    ');

    // Maker return links
    uiUtil.makeReturnLink(dirEntry.getTitleOrUrl());

    if (params.zimType === 'open') {
        // Adapt German Wikivoyage POI data format
        var regexpGeoLocationDE = /<span\s+class="[^"]+?listing-coordinates[\s\S]+?latitude">([^<]+)[\s\S]+?longitude">([^<]+)<[\s\S]+?(<bdi\s[^>]+?listing-name[^>]+>(?:<a\b\s+href[^>]+>)?([^<]+))/ig;
        htmlArticle = htmlArticle.replace(regexpGeoLocationDE, function (match, latitude, longitude, href, id) {
            var html;
            if (/bingmaps/.test(params.mapsURI)) {
                html = '<a href="' + params.mapsURI + '?collection=point.' + latitude + '_' + longitude + '_' + encodeURIComponent(id.replace(/_/g, ' ')) + '">\r\n';
            }
            if (/openstreetmap/.test(params.mapsURI)) {
                html = '<a href="' + params.mapsURI + '?mlat=' + latitude + '&mlon=' + longitude + '#map=18/' + latitude + '/' + longitude + '">\r\n';
            }
            html += '<img alt="Map marker" title="Diesen Ort auf einer Karte zeigen" src="app:///www/img/icons/map_marker-30px.png" width="18px" style="position:relative !important;top:-5px !important;margin-top:5px !important" />\r\n</a>' + href;
            return html;
        });

        // Adapt English Wikivoyage POI data format
        var regexpGeoLocationEN = /(href\s?=\s?")geo:([^,]+),([^"]+)("[^>]+?(?:data-zoom[^"]+"([^"]+))?[^>]+>)[^<]+(<\/a>[\s\S]+?<span\b(?=[^>]+listing-name)[\s\S]+?id\s?=\s?")([^"]+)/ig;
        var mapPin30 = '<img alt="Map marker" title="Show this place on a map" src="app:///www/img/icons/map_marker-30px.png" width="18px" style="position:relative !important;top:-5px !important;" />';
        htmlArticle = htmlArticle.replace(regexpGeoLocationEN, function (match, hrefAttr, latitude, longitude, p4, p5, p6, id) {
            var html;
            if (/bingmaps/.test(params.mapsURI)) {
                html = hrefAttr + params.mapsURI + '?collection=point.' + latitude + '_' + longitude + '_' +
                encodeURIComponent(id.replace(/_/g, ' ')).replace(/\.(\w\w)/g, '%$1') +
                (p5 ? '&lvl=' + p5 : '') + p4.replace(/style=["']\s?background:[^"']+["']/i, '');
            }
            if (/openstreetmap/.test(params.mapsURI)) {
                html = hrefAttr + params.mapsURI + '?mlat=' + latitude + '&mlon=' + longitude + '#map=18/' + latitude + '/' + longitude +
                    p4.replace(/style=["']\s?background:[^"']+["']/i, '');
            }
            html += mapPin30 + p6 + id;
            return html;
        });

        // Clean up remaining geo: links
        var mapPin18 = '<img alt="Map marker" title="Show this place on a map" src="app:///www/img/icons/map_marker-18px.png" width="12px" />';
        if (/bingmaps:/.test(params.mapsURI)) {
            htmlArticle = htmlArticle.replace(/href=['"]geo:([\d.-]+),([\d.-]+)[^"']*([^>]+>)/ig, 'href="' + params.mapsURI + '?collection=point.$1_$2_' +
            encodeURIComponent(dirEntry.getTitleOrUrl()) + '$3' + mapPin18 + '&nbsp;');
        }
        if (/openstreetmap/.test(params.mapsURI)) {
            htmlArticle = htmlArticle.replace(/href=['"]geo:([\d.-]+),([\d.-]+)[^"']*([^>]+>)/ig, 'href="' + params.mapsURI + '?mlat=$1&mlon=$2#map=18/$1/$2$3' + mapPin18 + '&nbsp;');
        }

        // Process any app:// links (these are always from the app payload) to match the current protocol
        htmlArticle = htmlArticle.replace(/(['"])app:\/\//g, function (p0, p1) {
            var appRootDir = window.location.href.replace(/\/www\/.*$/i, '');
            return p1 + appRootDir;
        });

        // Remove erroneous caption on maps that displaces the location marker in at least German Wikivoyage
        htmlArticle = htmlArticle.replace(/(<table\b(?=[^>]+class=["']locationMap)(?:[^<]|<(?!\/table>))+?<img\b[^>]+>)<div\s+class=['"]thumbcaption(?:[^<]|<(?!\/div>))+<\/div>((?:[^<]|<(?!\/table>))+?<div\s+style=['"]position:\s*absolute)/ig, '$1$2');

        // Setup endnote backlinks if the ZIM doesn't have any
        htmlArticle = htmlArticle.replace(/<li\b[^>]+id=["']cite[-_]note[-_]([^"']+)[^>]+>(?![^/]+?[↑^])/ig, function (match, id) {
            var fnReturnMatch = '';
            try {
                var fnSearchRegxp = new RegExp('id=["' + "'](cite[-_]ref[-_]" + id.replace(/[-_()+?]/g, '[-_()]+?') + '[^"' + "']*)", 'i');
                fnReturnMatch = htmlArticle.match(fnSearchRegxp);
            } catch (err) {
                console.error('Error constructiong regular expression in app.js', err);
            }
            var fnReturnID = fnReturnMatch ? fnReturnMatch[1] : '';
            return match + '\r\n<a href="#' + fnReturnID + '">^&nbsp;</a>';
        });

        // Exempt Nautilus and YouTube based ZIMs from stylesheet preloading
        var nautilus = params.contentInjectionMode === 'serviceworker'
            ? htmlArticle.match(/<script\b[^>]+['"][^'"]*(?:nautilus|zim_prefix)\.js[^'"]*[^>]*>[^<]*<\/script>\s*/i) : null;
    }

    if (params.zimType === 'open' && !nautilus) {
        // Preload stylesheets [kiwix-js #149]
        console.log('Loading stylesheets...');
        // Set up blobArray of promises
        var locationPrefix = window.location.pathname.replace(/\/[^/]*$/, '');
        var cssArray = htmlArticle.match(regexpSheetHref);
        var blobArray = [];
        var cssSource = params.cssSource;
        var cssCache = params.cssCache;
        var zimType = '';
        if (cssArray) {
            getBLOB(cssArray);
        } else {
            // Apply dark or light content theme if necessary
            var determinedTheme = params.cssTheme == 'auto' ? cssUIThemeGetOrSet('auto', true) : params.cssTheme;
            var contentThemeStyle = (determinedTheme == 'dark' && params.cssTheme !== 'darkReader') ? '<link href="' + locationPrefix + '/-/s/style-dark.css" rel="stylesheet" type="text/css">\r\n'
                : params.cssTheme == 'invert' ? '<link href="' + locationPrefix + '/-/s/style-dark-invert.css" rel="stylesheet" type="text/css">\r\n' : '';
            htmlArticle = htmlArticle.replace(/\s*(<\/head>)/i, contentThemeStyle + '$1');
            injectHTML();
        }
    } else {
        // Zimit ZIMs, or nautilus, should not manipulate styles
        injectHTML();
    }

    // Extract CSS URLs from given array of links
    function getBLOB (arr) {
        var testCSS = arr.join();
        zimType = /-\/s\/style\.css/i.test(testCSS) ? 'desktop' : zimType;
        zimType = /-\/static\/main\.css|statc\/css\/sotoki.css/i.test(testCSS) ? 'desktop-stx' : zimType; // Support stackexchange
        zimType = /gutenberg\.css/i.test(testCSS) ? 'desktop-gtb' : zimType; // Support Gutenberg
        zimType = /minerva|mobile/i.test(testCSS) ? 'mobile' : zimType;
        cssSource = cssSource == 'auto' ? zimType : cssSource; // Default to in-built zimType if user has selected automatic detection of styles
        if (/minerva|inserted.style|pcs\.css/i.test(testCSS) && (cssCache || zimType != cssSource)) {
            // Substitute ridiculously long style name TODO: move this code to transformStyles
            for (var i = arr.length; i--;) { // TODO: move to transfromStyles
                arr[i] = /minerva/i.test(arr[i]) ? '<link ' + (params.contentInjectionMode == 'jquery' ? 'data-kiwixurl' : 'href') +
                    '="-/s/style-mobile.css" rel="stylesheet" type="text/css">' : arr[i];
                // Delete stylesheet if will be inserted via minerva anyway (avoid linking it twice)
                if (/inserted.style/i.test(arr[i]) && /minerva/i.test(testCSS) ||
                  // We also remove the new pcs.css style as it is causing issues
                  /pcs\.css/i.test(arr[i])) {
                    arr.splice(i, 1);
                }
            }
        }
        for (i = 0; i < arr.length; i++) {
            var zimLink = arr[i].match(/(?:href|data-kiwixurl)\s*=\s*['"]([^'"]+)/i);
            zimLink = zimLink ? /zimit/.test(params.zimType) ? zimLink[1] : decodeURIComponent(uiUtil.removeUrlParameters(zimLink[1])) : '';
            /* zl = zimLink; zim = zimType; cc = cssCache; cs = cssSource; i  */
            var filteredLink = transformStyles.filterCSS(zimLink, zimType, cssCache, cssSource, i);
            if (filteredLink.rtnFunction == 'injectCSS') {
                blobArray[i] = filteredLink.zl;
                injectCSS();
            } else {
                resolveCSS(filteredLink.zl, i);
            }
        }
    }

    function resolveCSS (title, index) {
        if (appstate.selectedArchive.cssBlobCache.has(title)) {
            console.log('*** cssBlobCache hit ***');
            blobArray.push([title, appstate.selectedArchive.cssBlobCache.get(title)]);
            injectCSS();
        } else {
            var cacheKey = appstate.selectedArchive.file.name + '/' + title;
            cache.getItemFromCacheOrZIM(appstate.selectedArchive, cacheKey).then(function (content) {
                // DEV: Uncomment line below and break on next to capture cssContent for local filesystem cache
                // var cssContent = util.uintToString(content);
                var mimetype = /\.ico$/i.test(title) ? 'image' : 'text/css';
                var cssBlob;
                if (content) {
                    cssBlob = new Blob([content], {
                        type: mimetype
                    });
                }
                var newURL = cssBlob ? [title, URL.createObjectURL(cssBlob)] : [title, ''];
                blobArray.push(newURL);
                appstate.selectedArchive.cssBlobCache.set(newURL[0], newURL[1]);
                injectCSS(); // DO NOT move this: it must run within .then function to pass correct values
            }).catch(function (err) {
                console.error(err);
                var newURL = [title, ''];
                blobArray.push(newURL);
                appstate.selectedArchive.cssBlobCache.set(newURL[0], newURL[1]);
                injectCSS();
            });
        }
    }

    function injectCSS () {
        // We have to count the blobArray elements because some may have been spliced out
        // See https://stackoverflow.com/questions/28811911/find-array-length-in-javascript
        var blobArrayLength = blobArray.filter(function () {
            return true;
        }).length;
        if (blobArrayLength >= cssArray.length) { // If all promised values have been obtained
            var resultsArray = [];
            var testBlob;
            for (var i in cssArray) { // Put them back in the correct order
                var match = 0;
                for (var j in blobArray) { // Iterate the blobArray to find the matching entry
                    // console.log("blobArray[j]: " + blobArray[j] + "\r\nblobArray[j][0]: " + blobArray[j][0]);
                    testBlob = blobArray[j][0].length == 1 ? blobArray[j] : blobArray[j][0]; // What a kludge! TODO: fix this ugly mixing of arrays and strings
                    if (~cssArray[i].indexOf(testBlob)) {
                        match = 1;
                        break;
                    }
                }
                testBlob = match && /blob:/i.test(blobArray[j][1]) ? blobArray[j][1] : blobArray[i]; // Whoa!!! Steady on!
                resultsArray[i] = cssArray[i].replace(/(?:data-kiwixurl|href)\s*=\s*["']([^"']+)/i, 'href="' +
                    testBlob + '" data-kiwixhref="$1'); // Store the original URL for later use
                // DEV note: do not attempt to add onload="URL.revokeObjectURL...)": see [kiwix.js #284]
                // DEBUG:
                // console.log("BLOB CSS #" + i + ": " + resultsArray[i] + "\nshould correspond to: " + testBlob);
            }
            cssArray = resultsArray;
            htmlArticle = htmlArticle.replace(regexpSheetHref, ''); // Void existing stylesheets
            var cssArray$ = '\r\n' + cssArray.join('\r\n') + '\r\n';
            if (~cssSource.indexOf('mobile') && zimType === 'desktop') { // If user has selected mobile display mode...
                var mobileCSS = transformStyles.toMobileCSS(htmlArticle, zimType, cssCache, cssSource, cssArray$);
                htmlArticle = mobileCSS.html;
                cssArray$ = mobileCSS.css;
            }
            if (~cssSource.indexOf('desktop') && zimType === 'mobile') { // If user has selected desktop display mode...
                var desktopCSS = transformStyles.toDesktopCSS(htmlArticle, zimType, cssCache, cssSource, cssArray$);
                htmlArticle = desktopCSS.html;
                cssArray$ = desktopCSS.css;
            }
            // Remove any voided styles
            cssArray$ = cssArray$.replace(/<link\shref="#"[^>]+>\s*/g, '');
            // Add dark mode CSS if required
            var determinedTheme = params.cssTheme == 'auto' ? cssUIThemeGetOrSet('auto', true) : params.cssTheme;
            cssArray$ += (determinedTheme === 'dark' && params.cssTheme !== 'darkReader') ? '<link href="' + locationPrefix + '/-/s/style-dark.css" rel="stylesheet" type="text/css">\r\n'
                : params.cssTheme == 'invert' ? '<link href="' + locationPrefix + '/-/s/style-dark-invert.css" rel="stylesheet" type="text/css">\r\n' : '';
            // Ensure all headings are open
            // htmlArticle = htmlArticle.replace(/class\s*=\s*["']\s*client-js\s*["']\s*/i, "");
            htmlArticle = htmlArticle.replace(/\s*(<\/head>)/i, cssArray$ + '$1');
            console.log('All CSS resolved');
            injectHTML(); // Pass the revised HTML to the image and JS subroutine...
        }
    }
    // End of preload stylesheets code

    function injectHTML () {
        // For articles loaded in the iframe, we need to set the articleWindow (but if the user is opening a new tab/window,
        // then the articleWindow has already been set in the click event of the ZIM link)
        if (appstate.target === 'iframe') {
            // Tell jQuery we're removing the iframe document: clears jQuery cache and prevents memory leaks [kiwix-js #361]
            while (articleContainer.firstChild) {
                articleContainer.removeChild(articleContainer.firstChild);
            }
            articleContainer = document.getElementById('articleContent');
            articleContainer.kiwixType = 'iframe';
            articleWindow = articleContainer.contentWindow;
        }
        // We can't access the DOM of a new Window in the UWP app
        if (!(/UWP/.test(params.appType) && appstate.target !== 'iframe')) {
            articleDocument = articleWindow.document.documentElement;
        }

        // Inject htmlArticle into iframe
        // uiUtil.pollSpinner(); //Void progress messages
        // Extract any css classes from the html tag (they will be stripped when injected in iframe with .innerHTML)
        var htmlCSS;
        if (params.contentInjectionMode === 'jquery') htmlCSS = htmlArticle.match(/<html[^>]*class\s*=\s*["']\s*([^"']+)/i);
        htmlCSS = htmlCSS ? htmlCSS[1].replace(/\s+/g, ' ').split(' ') : '';

        // Hide any alert box that was activated in uiUtil.displayFileDownloadAlert function
        var downloadAlert = document.getElementById('downloadAlert');
        if (downloadAlert) downloadAlert.style.display = 'none';

        // Code below will run after we have written the new article to the articleContainer
        var articleLoaded = function () {
            if (params.contentInjectionMode === 'serviceworker') return;
            // Set a global error handler for articleWindow
            articleWindow.onerror = function (msg, url, line, col, error) {
                console.error('Error caught in ZIM contents [' + url + ':' + line + ']:\n' + msg, error);
                return true;
            };
            uiUtil.showSlidingUIElements();
            uiUtil.clearSpinner();
            if (appstate.target === 'iframe' && !articleContainer.contentDocument && window.location.protocol === 'file:') {
                uiUtil.systemAlert("<p>You seem to be opening kiwix-js with the file:// protocol, which blocks access to the app's iframe. " +
                'We have tried to open your article in a separate window. You may be able to use it with limited functionality.</p>' +
                '<p>The easiest way to run this app fully is to download and run it as a browser extension (from the vendor store). ' +
                'Alternatively, you can open it through a web server: either use a local one (http://localhost/...) ' +
                'or a remote one. For example, you can try your ZIM out right now with our online version of the app: ' +
                "<a href='https://kiwix.github.io/kiwix-js/'>https://kiwix.github.io/kiwix-js/</a>.</p>" +
                '<p>Another option is to force your browser to accept file access (a potential security breach): ' +
                'on Chrome, you can start it with the <code>--allow-file-access-from-files</code> command-line argument; on Firefox, ' +
                'you can set <code>privacy.file_unique_origin</code> to <code>false</code> in about:config.</p>');
                articleContainer = window.open('', dirEntry.title, 'toolbar=0,location=0,menubar=0,width=800,height=600,resizable=1,scrollbars=1');
                if (articleContainer) {
                    params.windowOpener = 'window';
                    appstate.target = 'window';
                    articleContainer.kiwixType = appstate.target;
                    articleWindow = articleContainer;
                }
            }

            // Ensure the window target is permanently stored as a property of the articleWindow (since appstate.target can change)
            articleWindow.kiwixType = appstate.target;
            // Scroll the old container to the top
            articleWindow.scrollTo(0, 0);
            articleDocument = articleWindow.document.documentElement;

            // ** Write article html to the new article container **
            articleDocument.innerHTML = htmlArticle;

            var docBody = articleDocument.querySelector('body');

            if (articleWindow.kiwixType === 'iframe') {
                // Add any missing classes stripped from the <html> tag
                if (htmlCSS) {
                    htmlCSS.forEach(function (cl) {
                        docBody.classList.add(cl);
                    });
                }
                if (!params.disableDragAndDrop) {
                    // Deflect drag-and-drop of ZIM file on the iframe to Config
                    docBody.addEventListener('dragover', handleIframeDragover);
                    docBody.addEventListener('drop', handleIframeDrop);
                }
                listenForSearchKeys();
                // Trap clicks in the iframe to restore Fullscreen mode
                if (params.lockDisplayOrientation) articleWindow.addEventListener('mousedown', refreshFullScreen, true);
                setupTableOfContents();
            }
            // Set relative font size + Stackexchange-family multiplier
            var docElStyle = articleDocument.style;
            var zoomProp = '-ms-zoom' in docElStyle ? 'fontSize' : 'zoom' in docElStyle ? 'zoom' : 'fontSize';
            docElStyle = zoomProp === 'fontSize' ? docBody.style : docElStyle;
            docElStyle[zoomProp] = zimType && ~zimType.indexOf('stx') && zoomProp === 'fontSize' ? params.relativeFontSize * 1.5 + '%' : params.relativeFontSize + '%';
            // Set page width according to user preference
            removePageMaxWidth();
            setupHeadings();
            listenForNavigationKeys();
            // if (appstate.target === 'iframe') uiUtil.initTouchZoom(articleDocument, docBody);
            // Process endnote references (so they open the reference block if closed)
            var refs = docBody.getElementsByClassName('mw-reflink-text');
            if (refs) {
                for (var l = 0; l < refs.length; l++) {
                    var reference = refs[l].parentElement;
                    if (reference) {
                        reference.addEventListener('click', function (obj) {
                            var refID = obj.target.hash || obj.target.parentNode.hash;
                            if (!refID) return;
                            var refLocation = docBody.querySelector(refID);
                            if (!refLocation) return;
                            // In some ZIMs the id is in the parent node or in the parent of the parent
                            var returnID = obj.target.id || obj.target.parentNode.id || obj.target.parentNode.parentNode.id;
                            // Add backlink to refLocation if missing
                            if (returnID && !~refLocation.innerHTML.indexOf('#' + returnID)) {
                                var returnLink = document.createElement('a');
                                returnLink.href = '#' + returnID;
                                returnLink.innerHTML = '↑';
                                refLocation.insertBefore(returnLink, refLocation.firstChild);
                            }
                            var refNext = util.getClosestBack(refLocation, function (el) {
                                return /^(H2|DETAILS)$/.test(el.tagName);
                            });
                            if (refNext) {
                                if (/DETAILS/.test(refNext.tagName)) {
                                    refNext.open = true;
                                    return;
                                }
                                refNext.classList.add('open-block');
                                // refNext.innerHTML = refNext.innerHTML.replace(/<br\s*\/?>$/i, "");
                                refNext = refNext.nextElementSibling;
                                while (refNext && refNext.classList.contains('collapsible-block')) {
                                    refNext.classList.add('open-block');
                                    refNext = refNext.nextElementSibling;
                                }
                            }
                        });
                    }
                }
            }
            if (!params.isLandingPage) openAllSections();

            parseAnchorsJQuery(dirEntry);
            loadCSSJQuery();
            images.prepareImagesJQuery(articleWindow);
            if (appstate.wikimediaZimLoaded && params.showPopoverPreviews) {
                var darkTheme = (params.cssUITheme == 'auto' ? cssUIThemeGetOrSet('auto', true) : params.cssUITheme) !== 'light';
                popovers.attachKiwixPopoverCss(articleWindow.document, darkTheme);
            }
            var determinedTheme = params.cssTheme === 'auto' ? cssUIThemeGetOrSet('auto') : params.cssTheme;
            if (params.allowHTMLExtraction && appstate.target === 'iframe') {
                uiUtil.insertBreakoutLink(determinedTheme);
            }
            // Trap any clicks on the iframe to detect if mouse back or forward buttons have been pressed (Chromium does this natively)
            if (/UWP/.test(params.appType)) docBody.addEventListener('pointerup', onPointerUp);
            // Document has loaded except for images, so we can now change the startup failsafe [see init.js]
            settingsStore.setItem('lastPageLoad', 'OK', Infinity);

            // If we reloaded the page to print the desktop style, we need to return to the printIntercept dialogue
            if (params.printIntercept) printIntercept();

            // Make sure the article area is displayed
            setTab();
            checkToolbar();
            // Show the article
            unhideArticleContainer();
            // Jump to any anchor parameter
            if (anchorParameter) {
                var target = articleWindow.document.getElementById(anchorParameter);
                if (target) {
                    setTimeout(function () {
                        target.scrollIntoView();
                    }, 1000);
                }
                anchorParameter = '';
            }
            // Trap clicks in the iframe (currently only used for removing popovers in Restricted mode)
            articleWindow.onclick = filterClickEvent;
            params.isLandingPage = false;
        };

        // Hide the document to avoid display flash before stylesheets are loaded; also improves performance during loading of
        // assets in most browsers
        // DEV: We cannot do `articleWindow.document.documentElement.hidden = true;` because documentElement gets overwritten
        // during the document.write() process (if used); and since the latter is synchronous, we get slow display rewrites before it is
        // effective if we do it after document.close().
        // Note that UWP apps cannot communicate to a newly opened window except via postmessage, but Service Worker can still
        // control the Window. Additionally, Edge Legacy cannot build the DOM for a completely hidden document, hence we catch
        // these browser types with 'MSBlobBuilder' (and also IE11).
        if (!(/UWP/.test(params.appType) && (appstate.target === 'window' || messageChannelWaiting))) {
            htmlArticle = htmlArticle.replace(/(<html\b[^>]*)>/i, '$1 bgcolor="' +
                (cssUIThemeGetOrSet(params.cssTheme, true) !== 'light' ? 'grey' : 'whitesmoke') + '">');
            // NB Don't hide the document body if we don't have any window management, because native loading of documents in a new tab is slow, and we can't
            // guarantee to unhide the document in time
            if (!('MSBlobBuilder' in window) && params.windowOpener) htmlArticle = htmlArticle.replace(/(<body\b[^>]*)/i, '$1 style="display: none;"');
        }

        // Display any hidden block elements, with a timeout, so as not to interfere with image loading
        if (params.displayHiddenBlockElements && settingsStore.getItem('appVersion') === params.appVersion &&
          !(/UWP/.test(params.appType) && appstate.target !== 'iframe')) {
            setTimeout(function () {
                if (appstate.wikimediaZimLoaded || params.displayHiddenBlockElements === true) {
                    displayHiddenBlockElements(articleWindow, articleDocument);
                }
            }, 1200);
        }

        // Calculate the current article's encoded ZIM baseUrl to use when processing relative links (also needed for SW mode when params.windowOpener is set)
        params.baseURL = encodeURI(dirEntry.namespace + '/' + dirEntry.url.replace(/[^/]+$/, ''));
            // URI-encode anything that is not a '/'
        //     .replace(/[^/]+/g, function(m) {
        //         return encodeURIComponent(m);
        // });

        if (params.contentInjectionMode === 'serviceworker') {
            // For UWP apps, we need to add the Zoom level to the HTML if we are opening in external window
            if (/UWP/.test(params.appType) && appstate.target === 'window') {
                htmlArticle = htmlArticle.replace(/(<html\b[^>]+?style=['"])/i, '$1zoom:' + params.relativeFontSize + '%; ');
                htmlArticle = htmlArticle.replace(/(<html\b(?![^>]+?style=['"])\s)/i, '$1style="zoom:' + params.relativeFontSize + '%;" ');
            }
            // Add darkreader script to article
            var determinedWikiTheme = params.cssTheme == 'auto' ? cssUIThemeGetOrSet('auto', true) : params.cssTheme;
            if (determinedWikiTheme !== 'light' && params.cssTheme === 'darkReader') {
                htmlArticle = htmlArticle.replace(/(<\/head>)/i, '<script type="text/javascript" src="' +
                    document.location.pathname.replace(/index\.html/i, 'js/lib/darkreader.min.js') + '"></script>\r\n' +
                    '<script>DarkReader.setFetchMethod(window.fetch);\r\nDarkReader.enable();</script>\r\n$1');
            }
            // Prevent the script that detects whether wombat is loaded from running
            if (params.zimType === 'zimit') htmlArticle = htmlArticle.replace(/!(window._WBWombat)/, '$1');
            // Add doctype if missing so that scripts run in standards mode
            // (quirks mode prevents katex from running, and is incompatible with jQuery)
            transformedHTML = !/^\s*(?:<!DOCTYPE|<\?xml)\s+/i.test(htmlArticle) ? '<!DOCTYPE html>\n' + htmlArticle : htmlArticle;
            transDirEntry = dirEntry;
            // We will need the encoded URL on article load so that we can set the iframe's src correctly,
            // but we must not encode the '/' character or else relative links may fail [kiwix-js #498]
            var encodedUrl = dirEntry.url.replace(/[^/]+/g, function (matchedSubstring) {
                return encodeURIComponent(matchedSubstring);
            });
            // If the request was not initiated by an existing controlled window, we instantiate the request here
            if (!messageChannelWaiting) {
                // We put the ZIM filename as a prefix in the URL, so that browser caches are separate for each ZIM file
                var newLocation = '../' + appstate.selectedArchive.file.name + '/' + dirEntry.namespace + '/' + encodedUrl + (params.zimType === 'zimit' ? '?isKiwixHref' : '');
                if (navigator.serviceWorker.controller) {
                    loaded = false;
                    articleWindow.location.href = newLocation;
                } else {
                    console.warn('No Service Worker controller found while waiting for transformed HTML to be loaded! Let\'s wait...');
                    setTimeout(function () {
                        document.getElementById('btnHome').click();
                    }, 1800);
                }
            }
            return;
        }

        // Write article html to the article container
        // articleWindow.document.open('text/html', 'replace');
        // articleWindow.document.write(htmlArticle);
        // articleWindow.document.close();

        if (appstate.target === 'iframe') {
            // Store the frame article's target in the top-level window, so that when we retrieve the window with
            // history manipulation, we'll know where to place the iframe contentWindow
            window.kiwixType = appstate.target;
            articleContainer.onload = articleLoaded;
            articleContainer.src = 'article.html';
        } else {
            // Attempt to establish an independent history record for windows (Restricted / window-tab mode)
            articleWindow.onpopstate = historyPop;
            // The articleWindow has already been set in the click event of the ZIM link and the dummy article was loaded there
            // (to avoid popup blockers). Firefox loads windows asynchronously, so we need to wait for onclick load to be fully
            // cleared, or else Firefox overwrites the window immediately after we load the html content into it.
            setTimeout(articleLoaded, 400);
        }
        // Failsafe for spinner
        setTimeout(function () {
            uiUtil.clearSpinner();
        }, 6000);
    } // End of injectHtml
} // End of displayArticleInForm()

function parseAnchorsJQuery (dirEntry) {
    var currentProtocol = articleWindow.location.protocol;
    currentProtocol = currentProtocol === 'about:' ? ':' : currentProtocol;
    var currentHost = articleWindow.location.host;
    // Percent-encode dirEntry.url and add regex escape character \ to the RegExp special characters - see https://www.regular-expressions.info/characters.html;
    // NB dirEntry.url can also contain path separator / in some ZIMs (Stackexchange). } and ] do not need to be escaped as they have no meaning on their own.
    var escapedUrl = encodeURIComponent(dirEntry.url).replace(/([\\$^.|?*+/()[{])/g, '\\$1');
    // Pattern to match a local anchor in an href even if prefixed by escaped url; will also match # on its own
    // Note that we exclude any # with a semicolon between it and the end of the string, to avoid accidentally matching e.g. &#39;
    var regexpLocalAnchorHref = new RegExp('^(?:#|' + escapedUrl + '#)([^#;]*$)');
    Array.prototype.slice.call(articleDocument.querySelectorAll('a, area')).forEach(function (anchor) {
        // Attempts to access any properties of 'this' with malformed URLs causes app crash in Edge/UWP [kiwix-js #430]
        try {
            var testHref = anchor.href;
        } catch (err) {
            console.error('Malformed href caused error:' + err.message);
            return;
        }
        var href = anchor.getAttribute('href');
        if (href === null || href === undefined || /^javascript:/i.test(anchor.protocol)) return;
        var anchorTarget = href.match(regexpLocalAnchorHref);
        if (href.length === 0) {
            // It's a link with an empty href, pointing to the current page: do nothing.
        } else if (anchorTarget) {
            // It's a local anchor link : remove escapedUrl if any (see above)
            anchor.setAttribute('href', '#' + anchorTarget[1]);
        } else if (anchor.protocol && anchor.protocol !== currentProtocol || anchor.host && anchor.host !== currentHost) {
            // It's an external URL : we should open it in a new tab
            anchor.addEventListener('click', function (event) {
                if (anchor.protocol === 'bingmaps:') {
                    anchor.removeAttribute('target');
                    event.preventDefault();
                    window.location = href;
                } else {
                    // Find the closest enclosing A tag
                    var clickedAnchor = uiUtil.closestAnchorEnclosingElement(event.target);
                    uiUtil.warnAndOpenExternalLinkInNewTab(event, clickedAnchor);
                }
            });
        } else {
            // Intercept YouTube videos in Zimit archives
            if (params.zimType === 'zimit' && /youtu(?:be(?:-nocookie)?\.com|\.be)\//i.test(href)) {
                transformZimit.transformVideoUrl(href, articleDocument, function (transHref) {
                    addListenersToLink(anchor, transHref, params.baseURL);
                });
            } else {
                addListenersToLink(anchor, href, params.baseURL);
            }
        }
    });
    // Add event listeners to the main heading so user can open current document in new tab or window by clicking on it
    if (articleWindow.document.body) {
        var h1 = articleWindow.document.body.querySelector('h1');
        if (h1 && dirEntry) addListenersToLink(h1, encodeURIComponent(dirEntry.url.replace(/[^/]+\//g, '')), params.baseURL);
    }
}

function loadCSSJQuery () {
    // Ensure all sections are open for clients that lack JavaScript support, or that have some restrictive CSP [kiwix-js #355].
    // This is needed only for some versions of ZIM files generated by mwoffliner (at least in early 2018), where the article sections are closed by default on small screens.
    // These sections can be opened by clicking on them, but this is done with some javascript.
    // The code below is a workaround we still need for compatibility with ZIM files generated by mwoffliner in 2018.
    // A better fix has been made for more recent ZIM files, with the use of noscript tags : see https://github.com/openzim/mwoffliner/issues/324
    var collapsedBlocks = articleDocument.querySelectorAll('.collapsible-block:not(.open-block), .collapsible-heading:not(.open-block)');
    // Using decrementing loop to optimize performance : see https://stackoverflow.com/questions/3520688
    for (var i = collapsedBlocks.length; i--;) {
        collapsedBlocks[i].classList.add('open-block');
    }
    var cssCount = 0;
    var cssFulfilled = 0;
    Array.prototype.slice.call(articleDocument.querySelectorAll('link[data-kiwixurl]')).forEach(function (link) {
        cssCount++;
        var linkUrl = link.getAttribute('data-kiwixurl');
        var url = decodeURIComponent(/zimit/.test(appstate.selectedArchive.zimType) ? linkUrl : uiUtil.removeUrlParameters(linkUrl));
        // See if we can get asset from cache. However, if we don't have the link type, the assets cache can fail, so we had better extract the asset instead of getting it from the cache
        if (assetsCache.has(url) && link.type) {
            var nodeContent = assetsCache.get(url);
            uiUtil.feedNodeWithBlob(link, 'href', nodeContent, link.type, true);
            cssFulfilled++;
        } else {
            if (params.assetsCache) document.getElementById('cachingAssets').style.display = '';
            appstate.selectedArchive.getDirEntryByPath(url).then(function (dirEntry) {
                if (!dirEntry) {
                    assetsCache.set(url, ''); // Prevent repeated lookups of this unfindable asset
                    throw new Error('DirEntry ' + typeof dirEntry);
                }
                var mimetype = dirEntry.getMimetype();
                var readFile = /^text\//i.test(mimetype) ? appstate.selectedArchive.readUtf8File : appstate.selectedArchive.readBinaryFile;
                return readFile(dirEntry, function (fileDirEntry, content) {
                    var fullUrl = fileDirEntry.namespace + '/' + fileDirEntry.url;
                    if (params.assetsCache) assetsCache.set(fullUrl, content);
                    uiUtil.feedNodeWithBlob(link, 'href', content, mimetype, true);
                    cssFulfilled++;
                    renderIfCSSFulfilled(fileDirEntry.url);
                });
            }).catch(function (e) {
                console.error('Could not find DirEntry for link element: ' + url, e);
                cssCount--;
                renderIfCSSFulfilled();
            });
        }
    });
    renderIfCSSFulfilled();

    // Some pages are extremely heavy to render, so we prevent rendering by keeping the iframe hidden
    // until all CSS content is available [kiwix-js #381]
    function renderIfCSSFulfilled (title) {
        if (cssFulfilled >= cssCount) {
            uiUtil.clearSpinner();
            document.getElementById('articleContent').style.display = '';
            // We have to resize here for devices with On Screen Keyboards when loading from the article search list
            resizeIFrame();
        }
    }
}

/**
 * Add event listeners to a hyperlinked element to extract the linked article or file from the ZIM instead
 * of following links
 * @param {Node} a The anchor or other linked element to which event listeners will be attached
 * @param {String} href The href of the linked element
 * @param {String} baseUrl The baseUrl against which relative links will be calculated
 */
function addListenersToLink (a, href, baseUrl) {
    appstate.baseUrl = baseUrl;
    var uriComponent = uiUtil.removeUrlParameters(href);
    // var namespace = baseUrl.replace(/^([-ABCIJMUVWX])\/.+/, '$1');
    var loadingContainer = false;
    var contentType;
    var downloadAttrValue;
    // Some file types need to be downloaded rather than displayed (e.g. *.epub)
    // The HTML download attribute can be Boolean or a string representing the specified filename for saving the file
    // For Boolean values, getAttribute can return any of the following: download="" download="download" download="true"
    // So we need to test hasAttribute first: see https://developer.mozilla.org/en-US/docs/Web/API/Element/getAttribute
    // However, we cannot rely on the download attribute having been set, so we also need to test for known download file types
    var isDownloadableLink = a.hasAttribute('download') || regexpDownloadLinks.test(href);
    if (isDownloadableLink) {
        // if (!/UWP/.test(params.appType) && params.contentInjectionMode === 'serviceworker') return;
        downloadAttrValue = a.getAttribute('download');
        // Normalize the value to a true Boolean or a filename string or true if there is no download attribute
        downloadAttrValue = /^(download|true|\s*)$/i.test(downloadAttrValue) || downloadAttrValue || true;
        contentType = a.getAttribute('type');
    }
    // DEV: We need to use the '#' location trick here for cross-browser compatibility with opening a new tab/window
    // if (params.windowOpener && a.tagName !== 'IFRAME') a.setAttribute('href', '#' + href);
    // Store the current values, as they may be changed if user switches to another tab before returning to this one
    var kiwixTarget = appstate.target;
    var thisWindow = articleWindow;
    var thisContainer = articleContainer;
    var reset = function () {
        if (appstate.target === 'window') {
            // By delaying unblocking of the touch event, we prevent multiple touch events launching the same window
            a.touched = false;
            a.newcontainer = false;
        }
        loadingContainer = false;
        a.articleisloading = false;
        a.dataset.touchevoked = false;
        a.popoverisloading = false;
    };
    var onDetectedClick = function (e) {
        // Restore original values for this window/tab
        appstate.target = kiwixTarget;
        articleWindow = thisWindow;
        articleContainer = thisContainer;
        var isNautilusPopup = a.dataset.popup && !/0|false/i.test(a.dataset.popup);
        if (a.tagName === 'H1' || isNautilusPopup) {
            // We have registered a click on the header or on a dynamic link (e.g. in Nautilus archives)
            if (isNautilusPopup) {
                // Pop-up window sometimes opens out of view, so we have to scroll into view
                iframe.contentWindow.scrollTo({
                    top: '0',
                    behavior: 'smooth'
                });
            }
            if (!a.newcontainer) return; // A new tab wasn't requested, so ignore
        }
        if (params.windowOpener) {
            // This processes Ctrl-click, Command-click, the long-press event, and middle-click
            if (a.newcontainer) {
                // We open the new window immediately so that it is a direct result of user action (click)
                // and we'll populate it later - this avoids most popup blockers
                loadingContainer = true;
                articleContainer = window.open('article.html', params.windowOpener === 'tab' ? '_blank' : a.title,
                    params.windowOpener === 'window' ? 'toolbar=0,location=0,menubar=0,width=800,height=600,resizable=1,scrollbars=1' : null);
                appstate.target = 'window';
                // We have to make this conditional, because sometimes this action is blocked by the browser
                if (articleContainer) {
                    articleContainer.kiwixType = appstate.target;
                    articleWindow = articleContainer;
                }
            }
        }
        e.preventDefault();
        e.stopPropagation();
        anchorParameter = href.match(/#([^#;]+)$/);
        anchorParameter = anchorParameter ? anchorParameter[1] : '';
        var indexRoot = window.location.pathname.replace(/[^/]+$/, '') + encodeURI(appstate.selectedArchive.file.name) + '/';
        var zimRoot = indexRoot.replace(/^.+?\/www\//, '/');
        var zimUrl = href;
        var zimUrlFullEncoding;
        // Some URLs are incorrectly given with spaces at the beginning and end, so we remove these
        zimUrl = zimUrl.replace(/^\s+|\s+$/g, '');
        if (/zimit/.test(params.zimType)) {
            // Deal with root-relative URLs in zimit ZIMs
            if (!zimUrl.indexOf(indexRoot)) { // If begins with indexRoot
                zimUrl = zimUrl.replace(indexRoot, '').replace('#' + anchorParameter, '');
            } else if (!zimUrl.indexOf(zimRoot)) { // If begins with zimRoot
                zimUrl = zimUrl.replace(zimRoot, '').replace('#' + anchorParameter, '');
            } else if (/^\//.test(zimUrl)) {
                zimUrl = zimUrl.replace(/^\//, appstate.selectedArchive.zimitPseudoContentNamespace + appstate.selectedArchive.zimitPrefix.replace(/^A\//, ''));
            } else if (!~zimUrl.indexOf(appstate.selectedArchive.zimitPseudoContentNamespace)) { // Doesn't begin with pseudoContentNamespace
                // Zimit ZIMs store URLs percent-encoded and with querystring and
                // deriveZimUrlFromRelativeUrls strips any querystring and decodes
                var zimUrlToTransform = zimUrl;
                zimUrl = encodeURI(uiUtil.deriveZimUrlFromRelativeUrl(zimUrlToTransform, baseUrl)) +
                    href.replace(uriComponent, '').replace('#' + anchorParameter, '');
                zimUrlFullEncoding = encodeURI(uiUtil.deriveZimUrlFromRelativeUrl(zimUrlToTransform, baseUrl) +
                    href.replace(uriComponent, '').replace('#' + anchorParameter, ''));
            }
        } else {
            zimUrl = uiUtil.deriveZimUrlFromRelativeUrl(uriComponent, baseUrl);
        }
        // @TODO: We are getting double activations of the click event. This needs debugging. For now, we use a flag to prevent this.
        a.newcontainer = true; // Prevents double activation
        // uiUtil.showSlidingUIElements();
        // Tear down contents of articleWindow.document
        if (!/UWP/.test(params.appType) && articleWindow && articleWindow.document && articleWindow.document.body) {
            articleWindow.document.body.innerHTML = '';
        }
        goToArticle(zimUrl, downloadAttrValue, contentType, zimUrlFullEncoding);
        setTimeout(reset, 1400);
    };

    var darkTheme = (params.cssUITheme == 'auto' ? cssUIThemeGetOrSet('auto', true) : params.cssUITheme) !== 'light';

    /* Event processing */
    a.addEventListener('touchstart', function (e) {
        // console.debug('a.touchstart');
        var timeout = 500;
        if (!appstate.wikimediaZimLoaded || !params.showPopoverPreviews) {
            if (!params.windowOpener || a.touched) return;
            loadingContainer = true;
        } else {
            timeout = 200;
        }
        a.touched = true;
        var event = e;
        // The link will be clicked if the user long-presses for more than 500ms (if the option is enabled), or 200ms for popover
        setTimeout(function () {
            // DEV: appstate.startVector indicates that the app is processing a touch zoom event, so we cancel any new windows
            // see uiUtil.pointermove_handler
            if (!a.touched || a.newcontainer || appstate.startVector) return;
            if (appstate.wikimediaZimLoaded && params.showPopoverPreviews) {
                a.dataset.touchevoked = true;
                popovers.populateKiwixPopoverDiv(event, a, appstate, darkTheme, appstate.selectedArchive);
            } else {
                a.newcontainer = true;
                onDetectedClick(event);
            }
            event.preventDefault();
        }, timeout);
    }, { passive: false });
    a.addEventListener('touchend', function () {
        // console.debug('a.touchend');
        a.touched = false;
        a.newcontainer = false;
        loadingContainer = false;
        // Cancel any popovers because user has clicked
        a.articleisloading = true;
        setTimeout(reset, 1000);
    });
    // This detects right-click in all browsers (only if the option is enabled)
    a.addEventListener('contextmenu', function (e) {
        // console.debug('contextmenu');
        if (appstate.wikimediaZimLoaded && params.showPopoverPreviews) {
            e.preventDefault();
            e.stopPropagation();
            // console.debug('suppressed contextmenu because processing popovers');
            var kiwixPopover = e.target.ownerDocument.querySelector('.kiwixtooltip');
            if (kiwixPopover) {
                // return;
            } else if (!a.touched) {
                a.touched = true;
                popovers.populateKiwixPopoverDiv(e, a, appstate, darkTheme, appstate.selectedArchive);
            }
        } else {
            if (!params.windowOpener) return;
            if (params.rightClickType === 'double' && !a.touched) {
                a.touched = true;
                setTimeout(function () {
                    a.touched = false;
                }, 700);
            } else {
                if (a.newcontainer) return; // Prevent accidental double activation
                e.preventDefault();
                e.stopPropagation();
                a.newcontainer = true;
                a.touched = false;
                onDetectedClick(e);
            }
        }
    });
    // This traps the middle-click event before tha auxclick event fires
    a.addEventListener('mousedown', function (e) {
        // console.debug('a.mousedown');
        a.dataset.touchevoked = true; // This is needed to simulate touch events in UWP app
        if (!params.windowOpener) return;
        e.preventDefault();
        e.stopPropagation();
        if (a.touched || a.newcontainer) return; // Prevent double activations
        if (e.ctrlKey || e.metaKey || e.which === 2 || e.button === 4) {
            a.newcontainer = true;
            onDetectedClick(e);
        } else {
            // console.debug('suppressed mousedown');
        }
    });
    a.addEventListener('mouseup', function (e) {
        setTimeout(reset, 1400); // Needed for UWP app which doesn't have touch events, so touchevoked simulates them
    });

    // This detects the middle-click event that opens a new tab in recent Firefox and Chrome
    // See https://developer.mozilla.org/en-US/docs/Web/API/Element/auxclick_event
    a.addEventListener('auxclick', function (e) {
        // console.debug('a.auxclick');
        if (!params.windowOpener) return;
        e.preventDefault();
        e.stopPropagation();
    });
    // The popover feature requires as a minimum that the browser supports the css matches function
    // (having this condition prevents very erratic popover placement in IE11, for example, so the feature is disabled)
    if (appstate.wikimediaZimLoaded && params.showPopoverPreviews && 'matches' in Element.prototype) {
        // Prevent accidental selection of the anchor text in some contexts
        if (a.style.userSelect === undefined && appstate.wikimediaZimLoaded && params.showPopoverPreviews) {
            // This prevents selection of the text in a touched link in iOS Safari
            a.style.webkitUserSelect = 'none';
            a.style.msUserSelect = 'none';
        }
        a.addEventListener('mouseover', function (e) {
            // console.debug('a.mouseover');
            if (a.dataset.touchevoked === 'true') return;
            popovers.populateKiwixPopoverDiv(e, a, appstate, darkTheme, appstate.selectedArchive);
        });
        a.addEventListener('mouseout', function (e) {
            if (a.dataset.touchevoked === 'true') return;
            popovers.removeKiwixPopoverDivs(e.target.ownerDocument);
            setTimeout(reset, 1000);
        });
        a.addEventListener('focus', function (e) {
            setTimeout(function () { // Delay focus event so touchstart can fire first
                // console.debug('a.focus');
                if (a.touched) return;
                a.focused = true;
                popovers.populateKiwixPopoverDiv(e, a, appstate, darkTheme, appstate.selectedArchive);
            }, 200);
        });
        a.addEventListener('blur', function (e) {
            // console.debug('a.blur');
            a.focused = false;
            setTimeout(reset, 1400);
        });
    }
    // The main click routine (called by other events above as well)
    a.addEventListener('click', function (e) {
        console.log('a.click', e);
        // Cancel any popovers because user has clicked
        a.articleisloading = true;
        // Prevent opening multiple windows
        if (loadingContainer || a.touched) {
            e.preventDefault();
            e.stopPropagation();
        } else {
            onDetectedClick(e);
        }
    });
}

/**
 * Unhides all hidden divs or tables, for use in Wikimedia mobile display style, which hides some crucial
 * elements that users want optionally to be able to access
 */
function displayHiddenBlockElements (win, doc) {
    if (!doc) return;
    console.debug('Searching for hidden block elements to display...');
    Array.prototype.slice.call(doc.querySelectorAll('table, div')).forEach(function (element) {
        if (win.getComputedStyle(element).display === 'none') {
            element.style.setProperty('display', 'block', 'important');
            if (!params.noHiddenElementsWarning) {
                var message;
                if (!appstate.wikimediaZimLoaded) {
                    message = '<p>The way the <i>Display hidden block elements setting</i> works has changed! Because it is currently set ' +
                    'to <b>always</b>, it will now apply to <i>any</i> ZIM type. This can have unexpected effects in non-Wikipedia ZIMs.</p>' +
                    '<p>We strongly recommend that you change this setting to <b>auto</b> in Configuration. The new auto setting allows the ' +
                    'app to decide when to apply the setting. If you never want to see hidden elements, even in Wikimedia ZIMs, change the ' +
                    'setting to <b>never</b>.</p>';
                }
                if (message) {
                    message += '<p><i>This message will not be displayed again, unless you reset the app.</i></p>';
                    params.noHiddenElementsWarning = true;
                    uiUtil.systemAlert(message, 'One-time message!').then(function () {
                        settingsStore.setItem('noHiddenElementsWarning', true, Infinity);
                    });
                }
            }
        }
    });
    // Ensure images are picked up by lazy loading
    win.scrollBy(0, 5);
    win.scrollBy(0, -5);
}

var dropup = document.getElementById('dropup');
dropup.addEventListener('click', function () {
    var ToCList = document.getElementById('ToCList');
    ToCList.style.display = ToCList.style.display === 'block' ? 'none' : 'block';
});

function setupTableOfContents () {
    var iframe = document.getElementById('articleContent');
    var innerDoc = iframe.contentDocument;
    var tableOfContents = new uiUtil.ToC(innerDoc);
    var headings = tableOfContents.getHeadingObjects();

    dropup.style.fontSize = ~~(params.relativeUIFontSize * 0.14) + 'px';
    var dropupHtml = '';
    headings.forEach(function (heading) {
        if (/^h1$/i.test(heading.tagName)) {
            dropupHtml += '<li style="font-size:' + params.relativeFontSize + '%;"><a href="#" data-heading-id="' + heading.id + '">' + heading.textContent + '</a></li>';
        } else if (/^h2$/i.test(heading.tagName)) {
            dropupHtml += '<li style="font-size:' + ~~(params.relativeFontSize * 0.9) + '%;"><a href="#" data-heading-id="' + heading.id + '">' + heading.textContent + '</a></li>';
        } else if (/^h3$/i.test(heading.tagName)) {
            dropupHtml += '<li style="font-size:' + ~~(params.relativeFontSize * 0.8) + '%;"><a href="#" data-heading-id="' + heading.id + '">' + heading.textContent + '</a></li>';
        } else if (/^h4$/i.test(heading.tagName)) {
            dropupHtml += '<li style="font-size:' + ~~(params.relativeFontSize * 0.7) + '%;"><a href="#" data-heading-id="' + heading.id + '">' + heading.textContent + '</a></li>';
        }
        // Skip smaller headings (if there are any) to avoid making list too long
    });
    var ToCList = document.getElementById('ToCList');
    ToCList.style.maxHeight = ~~(window.innerHeight * 0.75) + 'px';
    ToCList.style.marginLeft = ~~(window.innerWidth / 2) - ~~(window.innerWidth * 0.16) + 'px';
    ToCList.innerHTML = dropupHtml;
    Array.prototype.slice.call(ToCList.getElementsByTagName('a')).forEach(function (listElement) {
        listElement.addEventListener('click', function () {
            var sectionEle = innerDoc.getElementById(this.dataset.headingId);
            var csec = util.closest(sectionEle, 'details, section');
            csec = csec && /DETAILS|SECTION/.test(csec.parentElement.tagName) ? csec.parentElement : csec;
            openAllSections(true, csec);
            // Scroll to element
            sectionEle.scrollIntoView();
            // Scrolling up then down ensures that the toolbars show according to user settings
            iframe.contentWindow.scrollBy(0, -5);
            setTimeout(function () {
                iframe.contentWindow.scrollBy(0, 5);
                iframe.contentWindow.focus();
            }, 250);
            ToCList.style.display = 'none';
        });
    });
}

/**
 * Sets the state of collapsible sections for the iframe document, or for the given node
 * @param {Boolean} override An optional value that overrides params.openAllSections (true to open, false to close)
 * @param {Node} node An optional node within which elements will be opened or closed (this will normally be a details element)
 */
// Sets state of collapsible sections
function openAllSections (override, node) {
    var open = override === false ? false : override || params.openAllSections;
    var container = node || articleDocument;
    if (container) {
        var blocks = container.querySelectorAll('details, section:not([data-mw-section-id="0"]), .collapsible-block, .collapsible-heading');
        if (node) processSection(open, node);
        for (var x = blocks.length; x--;) {
            processSection(open, blocks[x]);
        }
    }
}

function processSection (open, node) {
    if (/DETAILS|SECTION/.test(node.tagName)) {
        if (open) {
            node.setAttribute('open', '');
            node.style.display = '';
        } else {
            node.removeAttribute('open');
        }
        if (typeof HTMLDetailsElement === 'undefined' || node.tagName === 'SECTION') {
            var children = node.children;
            for (var y = children.length; y--;) {
                if (/SUMMARY|H\d/.test(children[y].tagName)) continue;
                if (open) {
                    if (/DETAILS|SECTION/.test(children[y].tagName)) children[y].setAttribute('open', '');
                    children[y].style.removeProperty('display');
                } else {
                    if (/DETAILS|SECTION/.test(children[y].tagName)) children[y].removeAttribute('open');
                    children[y].style.display = 'none';
                }
            }
        }
    } else {
        if (open) node.classList.add('open-block');
        else node.classList.remove('open-block');
    }
}

// Attach listeners to headers to open-close following sections
function setupHeadings () {
    var headings = document.getElementById('articleContent').querySelectorAll('h2, h3, h4, h5');
    for (var i = headings.length; i--;) {
        // Prevent heading from being selected when user clicks on it
        headings[i].style.userSelect = 'none';
        headings[i].style.msUserSelect = 'none';
        headings[i].addEventListener('click', function (e) {
            // Override the built-in simplistic polyfill
            e.preventDefault();
            var that = e.currentTarget;
            var detailsEl = util.closest(that, 'details, section');
            if (detailsEl) {
                var toggle = !detailsEl.hasAttribute('open');
                openAllSections(toggle, detailsEl);
            }
        });
    }
}

params.preloadAllImages = function () {
    if (params.preloadingAllImages !== true) {
        setTimeout(function () {
            if (params.preloadingAllImages) {
                uiUtil.pollSpinner('Extracting images...');
            }
        }, 1000);
        params.preloadingAllImages = true;
        if (params.imageDisplay) {
            params.contentInjectionMode === 'jquery'
            ? images.prepareImagesJQuery(articleWindow, true) : images.prepareImagesServiceWorker(articleWindow, true);
        }
        return;
    }
    // All images should now be loaded, or else user did not request loading images
    uiUtil.clearSpinner();
    uiUtil.extractHTML();
    uiUtil.clearSpinner();
};

/**
 * Changes the URL of the browser page, so that the user might go back to it
 *
 * @param {String} title The title of the article to store (if storing an article)
 * @param {String} titleSearch The title of the search (if storing a search)
 */
function pushBrowserHistoryState (title, titleSearch) {
    // DEV: Note that appstate.target will always be 'iframe' for title searches, so we do not need to account for that
    var targetWin = appstate.target === 'iframe' ? window : articleWindow;
    var stateObj = {};
    var urlParameters;
    var stateLabel;
    if (title && !(title === '')) {
        // Prevents creating a double history for the same page (wrapped to prevent exception in IE and Edge Legacy for tabs)
        try {
            if (targetWin.history.state && targetWin.history.state.title === title) return;
        } catch (err) { console.error('Unable to access History for this window', err); return; }
        stateObj.title = title;
        urlParameters = '?title=' + title;
        stateLabel = 'Wikipedia Article : ' + title;
    } else if (titleSearch && !(titleSearch === '')) {
        stateObj.titleSearch = titleSearch;
        urlParameters = '?titleSearch=' + titleSearch;
        stateLabel = 'Wikipedia search : ' + titleSearch;
    } else return;
    // Edge Legacy and IE cannot push history state to another window/tab and produce an exception;
    // independent navigation history is therefore disabled for these browsers
    try {
        targetWin.history.pushState(stateObj, stateLabel, urlParameters);
    } catch (error) {
        history.pushState(stateObj, stateLabel, urlParameters);
    }
}

/**
 * Extracts the content of the given article pathname, or a downloadable file, from the ZIM
 *
 * @param {String} path The pathname (namespace + filename) to the article or file to be extracted
 * @param {Boolean|String} download A Bolean value that will trigger download of title, or the filename that should
 *     be used to save the file in local FS (in HTML5 spec, a string value for the download attribute is optional)
 * @param {String} contentType The mimetype of the downloadable file, if known
 * @param {String} pathEnc The fully encoded version of the path for use with some Zimit archives
 */
function goToArticle (path, download, contentType, pathEnc) {
    var pathForServiceWorker = path;
    path = path.replace(/\??isKiwixHref/, '');
    appstate.expectedArticleURLToBeDisplayed = path;
    // This removes any search highlighting
    clearFindInArticle();
    var shortTitle = path.replace(/[^/]+\//g, '').substring(0, 18);
    uiUtil.pollSpinner('Loading ' + shortTitle);
    var zimName = appstate.selectedArchive.file.name.replace(/\.[^.]+$/, '').replace(/_\d+-\d+$/, '');
    if (~path.indexOf(params.cachedStartPages[zimName])) {
        goToMainArticle();
        return;
    }
    appstate.selectedArchive.getDirEntryByPath(path).then(function (dirEntry) {
        var mimetype = contentType || dirEntry ? dirEntry.getMimetype() : '';
        if (dirEntry === null || dirEntry === undefined) {
            uiUtil.clearSpinner();
            console.error('Article with title ' + path + ' not found in the archive');
            if (params.zimType === 'zimit') {
                if (pathEnc) {
                    // We failed to get path, so we should try the fully encoded version instead
                    goToArticle(pathEnc, download, contentType);
                } else {
                    var anchor = {
                        href: path.replace(/^(C\/)?A\//, ''),
                        target: '_blank'
                    };
                    uiUtil.warnAndOpenExternalLinkInNewTab(null, anchor)
                    setTab();
                }
            } else {
                uiUtil.systemAlert('<p>Sorry, but we couldn\'t find the article:</p><p><i>' + path + '</i></p><p>in this archive!</p>');
            }
        } else if (download || /\/(epub|pdf|zip|.*opendocument|.*officedocument|tiff|mp4|webm|mpeg|octet-stream)\b/i.test(mimetype)) {
            // PDFs can be treated as a special case, as they can be displayed directly in a browser window or tab in most browsers (but not UWP)
            if (!/UWP/.test(params.appType) && params.contentInjectionMode === 'serviceworker' && (/\/pdf\b/.test(mimetype) || /\.pdf([?#]|$)/i.test(dirEntry.url))) {
                window.open(document.location.pathname.replace(/[^/]+$/, '') + appstate.selectedArchive.file.name + '/' + pathForServiceWorker,
                    params.windowOpener === 'tab' ? '_blank' : 'Download PDF',
                    params.windowOpener === 'window' ? 'toolbar=0,location=0,menubar=0,width=800,height=600,resizable=1,scrollbars=1' : null);
            } else {
                download = true;
                appstate.selectedArchive.readBinaryFile(dirEntry, function (fileDirEntry, content) {
                    uiUtil.displayFileDownloadAlert(path, download, mimetype, content);
                    uiUtil.clearSpinner();
                });
            }
        } else {
            // params.isLandingPage = false;
            document.querySelectorAll('.alert').forEach(function (el) {
                el.style.display = 'none';
            });
            document.getElementById('welcomeText').style.display = 'none';
            resizeIFrame();
            readArticle(dirEntry);
        }
    }).catch(function (e) {
        console.error('Error reading article with title ' + path, e);
        if (params.appIsLaunching) goToMainArticle();
        // Line below prevents bootloop
        params.appIsLaunching = false;
    });
}

function goToRandomArticle () {
    if (appstate.selectedArchive !== null && appstate.selectedArchive.isReady()) {
        uiUtil.pollSpinner();
        appstate.selectedArchive.getRandomDirEntry(function (dirEntry) {
            if (dirEntry === null || dirEntry === undefined) {
                uiUtil.clearSpinner();
                uiUtil.systemAlert('Error finding random article', 'Error finding article');
            } else {
                // We fall back to the old A namespace to support old ZIM files without a text/html MIME type for articles
                // DEV: If minorVersion is 1, then we are using a v1 article-only title listing. By definition,
                // all dirEntries in an article-only listing must be articles.
                if (appstate.selectedArchive.file.minorVersion >= 1 || /text\/html\b/i.test(dirEntry.getMimetype()) ||
                    params.zimType !== 'zimit' && dirEntry.namespace === 'A') {
                    params.isLandingPage = false;
                    uiUtil.hideActiveContentWarning();
                    readArticle(dirEntry);
                } else {
                    // If the random title search did not end up on an article,
                    // we try again, until we find one
                    goToRandomArticle();
                }
            }
        });
    } else {
        // Showing the relevant error message and redirecting to config page for adding the ZIM file
        uiUtil.systemAlert('Archive not set: please select an archive', 'No archive selected').then(function () {
            document.getElementById('btnConfigure').click();
        });
    }
}

function goToMainArticle () {
    uiUtil.pollSpinner();
    params.isLandingPage = true;
    appstate.selectedArchive.getMainPageDirEntry(function (dirEntry) {
        if (dirEntry === null || dirEntry === undefined) {
            params.isLandingPage = false;
            console.error('Error finding main article.');
            uiUtil.clearSpinner();
            document.getElementById('welcomeText').style.display = '';
            uiUtil.systemAlert('We cannot find the landing page!<br />' +
                    'Please check that this ZIM archive is valid. You may be able to search for other pages in the ZIM above.',
                    'Main page not found!');
        } else {
            // DEV: see comment above under goToRandomArticle()
            var setMainPage = function (dirEntry) {
                params.isLandingPage = true;
                appstate.selectedArchive.landingPageUrl = dirEntry.namespace + '/' + dirEntry.url;
                readArticle(dirEntry);
            }
            if (dirEntry.redirect) {
                appstate.selectedArchive.resolveRedirect(dirEntry, setMainPage);
            } else if (/text/.test(dirEntry.getMimetype()) || dirEntry.namespace === 'A') {
                setMainPage(dirEntry);
            } else {
                params.isLandingPage = false;
                console.error('The main page of this archive does not seem to be an article');
                uiUtil.clearSpinner();
                document.getElementById('welcomeText').style.display = '';
                uiUtil.systemAlert('The main page of this archive does not seem to be an article!<br />' +
                    'Please check that this ZIM archive is valid. You may be able to search for other pages in the ZIM above.',
                    'Invalid article!');
            }
        }
    });
}

export default {};
