/**
 * updater.js : Functions for checking and initiating app updtes
 * 
 * Copyright 2013-2022 Jaifroid, Mossroy and contributors
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

define(['uiUtil'], function (uiUtil) {

    /**
     * The update server configuration
     */
    params.updateServer = {
        url: 'https://api.github.com/repos/kiwix/kiwix-js-windows/',
        releases: 'releases'
    };

    // A RegExp prototype string to match the current app's releases
    const baseApp = (params.packagedFile && /wikivoyage/.test(params.packagedFile)) ? 'wikivoyage' :
        (params.packagedFile && /wikmed|mdwiki/.test(params.packagedFile)) ? 'wikimed' :
        'windows|electron|kiwixwebapp_'; // Default value
    
    // A RegExp to match download URLs of releases
    const regexpMatchGitHubReleases = RegExp('"browser_download_url[":\\s]+"(https:.*download\\/([^\\/]+).*(?:' + baseApp + ')[^"]+)"', 'ig');

    /**
     * Get and return the JSON list of releases from the update server's REST API
     * 
     * @param {Function} callback The function to call with the data
     * @returns {String} A JSON string containing hierarchical release data
     */
    function getReleasesObject(callback) {
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
    function getLatestUpdates(callback) {
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
                    updatedReleases.push(releaseFile)
                }
                matchedRelease = regexpMatchGitHubReleases.exec(releases);
            }
            // We should now have a list of all candidate updates, and candidate channel update
            // Compare the channel-matched update wiht the update, and if they are same underlying version number, choose channel match
            if (updateTag && updateTag.replace(/^v?([\d.]+).*/, '$1') === channelMatchedTag.replace(/^v?([\d.]+).*/, '$1')) {
                updateTag = channelMatchedTag;
                updateUrl = channelMatchedUpdateUrl;
            }
            callback(updateTag, updateUrl, updatedReleases);
        });
    }


    /**
     * Functions and classes exposed by this module
     */
    return {
        getLatestUpdates: getLatestUpdates
    };
});