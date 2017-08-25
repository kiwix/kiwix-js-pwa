/**
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
params['results'] = params['results'] || 15; //Number of search results to display
params['relativeFontSize'] = ~~(getCookie('relativeFontSize') || "100"); //Sets the initial font size for articles (as a percentage) - user can adjust using zoom buttons
params['cssSource'] = getCookie('cssSource') || "auto"; //Set default to "auto", "desktop" or "mobile"
params['cssCache'] = getCookie('cssCache') || true; //Set default to true to use cached CSS, false to use Zim only
//Convert string values of true / false to Boolean without disturbing any Boolean already set:
params['cssCache'] = params['cssCache'] == "false" ? false : (params['cssCache'] == "true" ? true : params['cssCache']);
params['cssTheme'] = getCookie('cssTheme') || 'light'; //Set default to 'light' or 'dark' to use respective themes for Wiki articles
params['cssUITheme'] = getCookie('cssUITheme') || 'light'; //Set default to 'light' or 'dark' to use respective themes for UI
params['imageDisplay'] = getCookie('imageDisplay') || true; //Set default to display images from Zim
params['imageDisplay'] = params['imageDisplay'] == "false" ? false : (params['imageDisplay'] == "true" ? true : params['imageDisplay']);
params['useMathJax'] = params['useMathJax'] || true; //Set default to true to display math formulae with MathJax, false to use fallback SVG images only
params['storedFile'] = getCookie('lastSelectedArchive') || "wikipedia_en_ray_charles_2015-06.zimaa"; //For packaged Kiwix JS (e.g. with Wikivoyage file), set this to the filename (for split files, give the first chunk *.zimaa) and place file(s) in default storage
params['falFileToken'] = params['falFileToken'] || "zimfile";
params['falFolderToken'] = params['falFolderToken'] || "zimfilestore";
params['localStorage'] = params['localStorage'] || ""; //These will be set programmatically below
params['pickedFile'] = params['pickeFile'] || "";
params['pickedFolder'] = params['pickedFolder'] || "";

if (params['storedFile'] && typeof Windows !== 'undefined' && typeof Windows.Storage !== 'undefined') { //UWP
    //DEV change "archives" below if you wish to store local archives in a different location in the installation package
    Windows.ApplicationModel.Package.current.installedLocation.getFolderAsync("archives").done(function (folder) {
        if (folder) params['localStorage'] = folder;
    });
    var StorageApplicationPermissions = Windows.Storage.AccessCache.StorageApplicationPermissions;
    if (StorageApplicationPermissions.futureAccessList.containsItem(params['falFileToken'])) {
        StorageApplicationPermissions.futureAccessList.getFileAsync(params['falFileToken']).done(function (file) {
            if (file) params['pickedFile'] = file;
        });
    }
    if (StorageApplicationPermissions.futureAccessList.containsItem(params['falFolderToken'])) {
        StorageApplicationPermissions.futureAccessList.getFolderAsync(params['falFolderToken']).done(function (folder) {
            if (folder) params['pickedFolder'] = folder;
        });
    }
}


function getCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
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
