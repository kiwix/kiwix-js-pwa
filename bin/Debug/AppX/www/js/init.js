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
var results = params['results'] || 15; //Number of search results to display
params['cssSource'] = getCookie('cssSource') || "auto"; //Set default to "auto", "desktop" or "mobile"
params['cssCache'] = getCookie('cssCache') || true; //Set default to true to use cached CSS, false to use Zim only
//Convert string values of true / false to Boolean without disturbing any Boolean already set:
params['cssCache'] = params['cssCache'] == "false" ? false : (params['cssCache'] == "true" ? true : params['cssCache']);
params['cssTheme'] = getCookie('cssTheme') || 'light'; //Set default to 'light' or 'dark' to use respective themes for Wiki articles
params['cssUITheme'] = getCookie('cssUITheme') || 'light'; //Set default to 'light' or 'dark' to use respective themes for UI
params['imageDisplay'] = getCookie('imageDisplay') || true; //Set default to display images from Zim
params['imageDisplay'] = params['imageDisplay'] == "false" ? false : (params['imageDisplay'] == "true" ? true : params['imageDisplay']);
params['useMathJax'] = params['useMathJax'] || true; //Set default to true to display math formulae with MathJax, false to use fallback SVG images

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
    config: { '../app': { results: results, params: params } },
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
