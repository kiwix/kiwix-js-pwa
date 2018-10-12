﻿/**
 * init.js : Configuration for the library require.js
 * This file handles the dependencies between javascript libraries
 * 
 * Copyright 2013-2018 Mossroy and contributors
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

// Parameters that define overall operation of app
var params = {};
params['version'] = "0.9.9.80 Beta-dev"; //DEV: do not set this dynamically -- it is compared to the cookie "version" in order to show first-time info, and the cookie is updated in app.js
params['packagedFile'] = "wikipedia_en_ray_charles_novid_2018-10.zim"; //For packaged Kiwix JS (e.g. with Wikivoyage file), set this to the filename (for split files, give the first chunk *.zimaa) and place file(s) in default storage
params['fileVersion'] = "wikipedia_en_ray_charles_novid_2018-10.zim (12-Oct-2018)"; //Use generic name for actual file, and give version here
params['cachedStartPage'] = false; //If you have cached the start page for quick start, give its URI here
params['kiwixDownloadLink'] = "http://download.kiwix.org/zim/"; //Include final slash

params['results'] = params['results'] || 15; //Number of search results to display
params['relativeFontSize'] = ~~(getCookie('relativeFontSize') || 100); //Sets the initial font size for articles (as a percentage) - user can adjust using zoom buttons
params['relativeUIFontSize'] = ~~(getCookie('relativeUIFontSize') || 100); //Sets the initial font size for UI (as a percentage) - user can adjust using slider in Config
params['cssSource'] = getCookie('cssSource') || "auto"; //Set default to "auto", "desktop" or "mobile"
params['removePageMaxWidth'] = getCookie('removePageMaxWidth') != null ? getCookie('removePageMaxWidth') : "auto"; //Set default for removing max-width restriction on Wikimedia pages ("auto" = removed in desktop, not in mobile; true = always remove; false = never remove)
params['openAllSections'] = getCookie('openAllSections') != null ? getCookie('openAllSections') : true; //Set default for opening all sections in ZIMs that have collapsible sections and headings ("auto" = let CSS decide according to screen width; true = always open until clicked by user; false = always closed until clicked by user)
params['cssCache'] = getCookie('cssCache') != null ? getCookie('cssCache') : true; //Set default to true to use cached CSS, false to use Zim only
params['cssTheme'] = getCookie('cssTheme') || 'light'; //Set default to 'light', 'dark' or 'invert' to use respective themes for articles
params['cssUITheme'] = getCookie('cssUITheme') || 'light'; //Set default to 'light' or 'dark' to use respective themes for UI
params['imageDisplay'] = getCookie('imageDisplay') != null ? getCookie('imageDisplay') : true; //Set default to display images from Zim
params['hideToolbar'] = getCookie('hideToolbar') != null ? getCookie('hideToolbar') : false; //Set default to hide the top toolbar on scroll
params['rememberLastPage'] = getCookie('rememberLastPage') != null ? getCookie('rememberLastPage') : true; //Set default option to remember the last visited page between sessions
params['useMathJax'] = getCookie('useMathJax') != null ? getCookie('useMathJax') : true; //Set default to true to display math formulae with MathJax, false to use fallback SVG images only
//params['showFileSelectors'] = getCookie('showFileSelectors') != null ? getCookie('showFileSelectors') : false; //Set to true to display hidden file selectors in packaged apps
params['showFileSelectors'] = false; //This will cause file selectors to be hidden on each load of the app (by ignoring cookie)

//Do not touch these values unless you know what they do! Some are global variables, some are set programmatically
params['storedFile'] = getCookie('lastSelectedArchive') || params['packagedFile'];
params['falFileToken'] = params['falFileToken'] || "zimfile"; //UWP support
params['falFolderToken'] = params['falFolderToken'] || "zimfilestore"; //UWP support
params['localStorage'] = params['localStorage'] || "";
params['pickedFile'] = params['pickeFile'] || "";
params['pickedFolder'] = params['pickedFolder'] || "";
params['lastPageVisit'] = getCookie('lastPageVisit') || "";
params['lastPageVisit'] = params['lastPageVisit'] ? decodeURIComponent(params['lastPageVisit']) : "";
params['themeChanged'] = params['themeChanged'] || false;
params['allowInternetAccess'] = params['allowInternetAccess'] || false; //Do not get value from cookie, should be explicitly set by user on a per-session basis
params['printIntercept'] = false;
params['printInterception'] = false;

//Initialize checkbox, radio and other values
document.getElementById('cssCacheModeCheck').checked = params.cssCache;
document.getElementById('imageDisplayModeCheck').checked = params.imageDisplay;
document.getElementById('removePageMaxWidthCheck').checked = params.removePageMaxWidth == "auto" ? false : params.removePageMaxWidth;
document.getElementById('removePageMaxWidthCheck').indeterminate = params.removePageMaxWidth == "auto" ? true : false;
document.getElementById('removePageMaxWidthCheck').readOnly = params.removePageMaxWidth == "auto" ? true : false;
document.getElementById('pageMaxWidthState').innerHTML = (params.removePageMaxWidth == "auto" ? "[auto]" : params.removePageMaxWidth ? "[true]" : "[false]");
document.getElementById('hideToolbarCheck').checked = params.hideToolbar;
document.getElementById('cssWikiDarkThemeCheck').checked = params.cssTheme == 'dark' ? true : params.cssTheme == 'invert' ? true : false;
document.getElementById('darkInvert').style.display = params.cssTheme == 'dark' ? "inline" : params.cssTheme == 'invert' ? "inline" : "none";
document.getElementById('cssWikiDarkThemeInvertCheck').checked = params.cssTheme == 'invert' ? true : false;
document.getElementById('cssUIDarkThemeCheck').checked = params.cssUITheme == 'dark' ? true : false;
document.getElementById('useMathJaxRadio' + (params.useMathJax ? 'True' : 'False')).checked = true;
document.getElementById('rememberLastPageCheck').checked = params.rememberLastPage;
document.getElementById('displayFileSelectorsCheck').checked = params.showFileSelectors;
var versionSpans = document.getElementsByClassName('version');
for (var i = 0; i < versionSpans.length; i++) {
    versionSpans[i].innerHTML = i ? params.version : params.version.replace(/\s+.*$/, "");
}
var fileVersionDivs = document.getElementsByClassName('fileVersion');
for (i = 0; i < fileVersionDivs.length; i++) {
    fileVersionDivs[i].innerHTML = i ? params.fileVersion.replace(/\s+.+$/, "") : params.fileVersion;
}
if (!params.showFileSelectors && params.packagedFile && params.storedFile && params.storedFile != params.packagedFile) {
    var currentArchive = document.getElementById('currentArchive');
    if (currentArchive) {
        currentArchive.innerHTML = "Currently loaded archive: <b>" + params.storedFile.replace(/\.zim$/i, "") + "</b>";
        currentArchive.style.display = "block";
    }
}
document.getElementById('logUpdate').innerHTML = document.getElementById('update').innerHTML.match(/<ul[^>]*>[\s\S]+/i);
document.getElementById('logFeatures').innerHTML = document.getElementById('features').innerHTML;

//Set up storage types
if (params.storedFile && typeof Windows !== 'undefined' && typeof Windows.Storage !== 'undefined') { //UWP
    //DEV change "archives" below if you wish to store local archives in a different location in the installation package
    Windows.ApplicationModel.Package.current.installedLocation.getFolderAsync("archives").done(function (folder) {
        if (folder) params.localStorage = folder;
    }, function (err) {
        console.error("This app doesn't appear to have access to local storage!");
    });
    var futureAccessList = Windows.Storage.AccessCache.StorageApplicationPermissions.futureAccessList;
    if (futureAccessList.containsItem(params.falFileToken)) {
        futureAccessList.getFileAsync(params.falFileToken).done(function (file) {
            if (file) params.pickedFile = file;
        }, function (err) {
            console.error("The previously picked file is no longer accessible: " + err.message);
        });
    }
    if (futureAccessList.containsItem(params.falFolderToken)) {
        futureAccessList.getFolderAsync(params.falFolderToken).then(function (folder) {
            if (folder) params.pickedFolder = folder;
        }, function (err) {
            console.error("The previously picked folder is no longer accessible: " + err.message);
        });
    }
}


function getCookie(name) {
    var regexp = new RegExp('(?:^|;)\\s*' + name + '=([^;]+)(?:;|$)');
    var result = document.cookie.match(regexp);
    return result === null || result[1] == "undefined" ? null : result[1] == "true" ? true : result[1] == "false" ? false : result[1];
}

require.config({
    //enforceDefine: true, //This is for debugging IE errors
    baseUrl: 'js/lib',
    config: { '../app': { params: params } },
    paths: {
        'jquery': 'jquery-3.2.1.slim',
        //'jquery': 'jquery-3.2.1',
        //'bootstrap': 'bootstrap'
        'bootstrap': 'bootstrap.min'
    },
    shim: {
        'jquery': {
            exports: '$'
        },
        'bootstrap': {
            deps: ['jquery']
        }
    }
});

define(['bootstrap','../app']);
