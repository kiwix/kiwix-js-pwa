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
var results = params['results'] || 10; //Number of search results to display
params['cssSource'] = params['cssSource'] || "desktop"; //Set default to "desktop" or "mobile"
params['cssCache'] = params['cssCache'] || true; //Set default to true to use cached CSS, false to use Zim only
params['imageDisplay'] = params['imageDisplay'] || true; //Set default to display images from Zim

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
