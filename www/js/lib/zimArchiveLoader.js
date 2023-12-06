﻿/**
 * zimArchiveLoader.js: Functions to search and read ZIM archives.
 *
 * Copyright 2015-2024 Mossroy and contributors
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

/* global $ */

import zimArchive from './zimArchive.js';

/**
 * Create a ZIMArchive from DeviceStorage location
 * @param {DeviceStorage} storage
 * @param {String} path
 * @param {callbackZIMArchive} callbackReady
 * @param {callbackZIMArchive} callbackError
 * @returns {ZIMArchive}
 */
function loadArchiveFromDeviceStorage (storage, path, callbackReady, callbackError) {
    return new zimArchive.ZIMArchive(storage, path, callbackReady, callbackError);
}
/**
 * Create a ZIMArchive from Files
 * @param {Array.<File>} files
 * @param {callbackZIMArchive} callbackReady
 * @param {callbackZIMArchive} callbackError
 * @returns {ZIMArchive}
 */
function loadArchiveFromFiles (files, callbackReady, callbackError) {
    if (files.length >= 1) {
        return new zimArchive.ZIMArchive(files, null, callbackReady, callbackError);
    }
}

/**
 * @callback callbackPathList
 * @param {Array.<String>} directoryList List of directories
 */

/**
 *  Scans the DeviceStorage for archives
 *
 * @param {Array.<DeviceStorage>} storages List of DeviceStorage instances
 * @param {callbackPathList} callbackFunction Function to call with the list of directories where archives are found
 * @param {callbackPathList} callbackError Function to call in case of an error
 */
function scanForArchives (storages, callbackFunction, callbackError) {
    var directories = [];
    var promises = $.map(storages, function (storage) {
        return storage.scanForArchives()
            .then(function (dirs) {
                $.merge(directories, dirs);
                return true;
            });
    });
    $.when.apply(null, promises).then(function () {
        callbackFunction(directories);
    }).catch(function (error) {
        callbackError('Error scanning your device storage : ' + error +
        ". If you're using the Firefox OS Simulator, please put the archives in " +
        "a 'fake-sdcard' directory inside your Firefox profile " +
        '(ex : ~/.mozilla/firefox/xxxx.default/extensions/fxos_2_x_simulator@mozilla.org/' +
        'profile/fake-sdcard/wikipedia_en_ray_charles_2015-06.zim)', 'Error reading Device Storage');
    });
}

export default {
    loadArchiveFromDeviceStorage: loadArchiveFromDeviceStorage,
    loadArchiveFromFiles: loadArchiveFromFiles,
    scanForArchives: scanForArchives
};
