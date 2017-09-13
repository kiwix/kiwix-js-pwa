﻿/**
 * init.js : Configuration for the library require.js
 * This file handles the dependencies between javascript libraries
 * 
 * Copyright 2013-2014 Mossroy and contributors
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
var params = {};
params['version'] = "0.8.2 Beta"; //DEV: do not set this dynamically -- it is compared to the cookie "version" in order to show first-time info, and the cookie is updated in app.js
params['storedFile'] = getCookie('lastSelectedArchive') || "wikipedia_en_ray_charles_2015-06.zimaa"; //For packaged Kiwix JS (e.g. with Wikivoyage file), set this to the filename (for split files, give the first chunk *.zimaa) and place file(s) in default storage
params['kiwixDownloadLink'] = "http://download.kiwix.org/zim/"; //Include final slash

params['results'] = params['results'] || 15; //Number of search results to display
params['relativeFontSize'] = ~~(getCookie('relativeFontSize') || 100); //Sets the initial font size for articles (as a percentage) - user can adjust using zoom buttons
var x = getCookie('relativeUIFontSize');
params['relativeUIFontSize'] = ~~(getCookie('relativeUIFontSize') || 100); //Sets the initial font size for UI (as a percentage) - user can adjust using slider in Config
params['cssSource'] = getCookie('cssSource') || "auto"; //Set default to "auto", "desktop" or "mobile"
params['cssCache'] = getCookie('cssCache') != null ? getCookie('cssCache') : true; //Set default to true to use cached CSS, false to use Zim only
//Convert string values of true / false to Boolean without disturbing any Boolean already set:
//params['cssCache'] = params['cssCache'] == "false" ? false : (params['cssCache'] == "true" ? true : params['cssCache']);
params['cssTheme'] = getCookie('cssTheme') || 'light'; //Set default to 'light' or 'dark' to use respective themes for Wiki articles
params['cssUITheme'] = getCookie('cssUITheme') || 'light'; //Set default to 'light' or 'dark' to use respective themes for UI
params['imageDisplay'] = getCookie('imageDisplay') != null ? getCookie('imageDisplay') : true; //Set default to display images from Zim
params['hideToolbar'] = getCookie('hideToolbar') != null ? getCookie('hideToolbar') : false; //Set default to hide the top toolbar on scroll
params['useMathJax'] = getCookie('useMathJax') != null ? getCookie('useMathJax') : true; //Set default to true to display math formulae with MathJax, false to use fallback SVG images only

//Do not touch these values unless you know what they do! Some are global variables, some are set programmatically
params['falFileToken'] = params['falFileToken'] || "zimfile"; //UWP support
params['falFolderToken'] = params['falFolderToken'] || "zimfilestore"; //UWP support
params['localStorage'] = params['localStorage'] || "";
params['pickedFile'] = params['pickeFile'] || "";
params['pickedFolder'] = params['pickedFolder'] || "";
params['themeChanged'] = params['themeChanged'] || false;
params['allowInternetAccess'] = params['allowInternetAccess'] || false; //Do not get value from cookie, should be explicitly set by user on a per-session basis

//Initialize checkbox and radio values
document.getElementById('cssCacheModeCheck').checked = params.cssCache;
document.getElementById('imageDisplayModeCheck').checked = params.imageDisplay;
document.getElementById('hideToolbarCheck').checked = params.hideToolbar;
document.getElementById('cssWikiDarkThemeCheck').checked = params.cssTheme == 'dark' ? true : false;
document.getElementById('cssUIDarkThemeCheck').checked = params.cssUITheme == 'dark' ? true : false;
document.getElementById('useMathJaxRadio' + (params.useMathJax ? 'True' : 'False')).checked = true;


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
    baseUrl: 'js/lib',
    config: { '../app': { params: params } },
    paths: {
        'jquery': 'jquery-3.2.1.slim',
        //'bootstrap': 'bootstrap'
        'bootstrap': 'bootstrap.min' //GK testing
    },
    shim: {
        'jquery' : {
            exports : '$'
        },
        'bootstrap': {
            deps: ['jquery']
        }
    }
});

requirejs(['bootstrap', '../app']);
