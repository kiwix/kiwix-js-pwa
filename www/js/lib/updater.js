/**
 * updater.js : Functions for checking and initiating app updates
 *
 * Copyright 2013-2023 Jaifroid and contributors
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

/* global params */

import uiUtil from './uiUtil.js';

/**
 * The update server configuration
 */
params.updateServer = {
    url: 'https://api.github.com/repos/kiwix/kiwix-js-pwa/',
    releases: 'releases'
};

// A RegExp prototype string to match the current app's releases
function getBaseAppPattern () {
    return (params.packagedFile && /wikivoyage/.test(params.packagedFile)) ? 'wikivoyage'
        : (params.packagedFile && /wikimed|mdwiki/.test(params.packagedFile)) ? 'wikimed'
            : 'windows|electron|kiwixwebapp_'; // Default value
}

/**
 * Get and return the JSON list of releases from the update server's REST API
 *
 * @param {Function} callback The function to call with the data
 * @returns {String} A JSON string containing hierarchical release data
 */
function getReleasesObject (callback) {
    uiUtil.XHR(params.updateServer.url + params.updateServer.releases, 'text',
        function (response, mimetype, status) {
            if (status === 200) {
                callback(response);
            } else callback('');
        }
    );
}

/**
 * A function to get the latest updates from a GitHub releases source
 * Only updates that are greater than the current update are returned
 * Attempts to match by channel, but also matches non-channel releases
 *
 * @param {Function} callback A function to call back with the results
 * @returns {Object} Calls back with update tag, update URL, and array of releases
 */
function getLatestUpdates (callback) {
    var updatedReleases = [];
    var currentRelease = params.appVersion.replace(/^v?([\d.]+)/, '$1');
    var currentReleaseChannel = params.appVersion.replace(/^[v\d.]+/, '');
    var updateTag;
    var channelMatchedTag;
    var updateUrl;
    var channelMatchedUpdateUrl;
    getReleasesObject(function (releases) {
        var releaseFile;
        var releaseVersion;
        var releaseChannel;
        // Build the RegExp fresh on every call: baseApp depends on params.packagedFile, which
        // may not be set yet when this module is first evaluated, and a module-level /g RegExp
        // would also carry its lastIndex over between calls.
        // [^"]+ is used in place of a plain wildcard so each capture group stays confined to the
        // single JSON string value it started in, even if the payload is minified to one line.
        var regexpMatchGitHubReleases = RegExp('"browser_download_url[":\\s]+"(https:[^"]*download\\/([^\\/"]+)[^"]*(?:' + getBaseAppPattern() + ')[^"]+)"', 'ig');
        // Loop through every line in releases
        var matchedRelease = regexpMatchGitHubReleases.exec(releases);
        while (matchedRelease != null) {
            releaseFile = matchedRelease[1];
            releaseVersion = matchedRelease[2].replace(/^v?([\d.]+).*/, '$1');
            releaseChannel = matchedRelease[2].replace(/^[v\d.]+/, '');
            // Compare the releases using a version-type comparison
            if (releaseVersion.localeCompare(currentRelease, { numeric: true, sensitivity: 'base' }) === 1) {
                if (!channelMatchedTag && currentReleaseChannel === releaseChannel) {
                    channelMatchedTag = matchedRelease[2];
                    channelMatchedUpdateUrl = releaseFile.replace(/\/download\//, '/tag/').replace(/[^/]+$/, '');
                }
                if (!updateTag) updateTag = matchedRelease[2];
                if (!updateUrl) updateUrl = releaseFile.replace(/\/download\//, '/tag/').replace(/[^/]+$/, '');
                updatedReleases.push(releaseFile);
            }
            matchedRelease = regexpMatchGitHubReleases.exec(releases);
        }
        // We should now have a list of all candidate updates, and candidate channel update
        // Compare the channel-matched update with the update, and if they are the same underlying
        // version number, choose the channel match.
        // channelMatchedTag stays undefined whenever no newer release in this app's own channel
        // carries an asset matching baseApp, so it has to be tested before use: a newer release
        // with no channel counterpart would otherwise throw a TypeError here and take the whole
        // update check down with it. Falling through leaves updateTag as the non-channel match,
        // which is the best answer available.
        if (updateTag && channelMatchedTag && updateTag.replace(/^v?([\d.]+).*/, '$1') === channelMatchedTag.replace(/^v?([\d.]+).*/, '$1')) {
            updateTag = channelMatchedTag;
            updateUrl = channelMatchedUpdateUrl;
        }
        callback(updateTag, updateUrl, updatedReleases);
    });
}

export default {
    getLatestUpdates: getLatestUpdates
};
