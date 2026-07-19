/**
 * torrentClient.js: Renderer-side adapter for in-app BitTorrent downloads of ZIM archives.
 * Presents a single framework-neutral API to the UI, and internally selects the backend:
 * - Electron: calls the main process (torrentDownloader.cjs) over IPC via window.electronAPI
 * - NWJS (planned): will require torrentDownloader.cjs directly in the Node context, gated on
 *   a modern Node runtime (so that legacy NWJS builds for XP/Vista never see the feature)
 * - All other app types (PWA, UWP): feature is unavailable, and isAvailable() returns false
 *
 * Copyright 2026 Jaifroid and contributors
 * License GPL v3:
 *
 * This file is part of Kiwix.
 *
 * Kiwix is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

'use strict';

// The callbacks of the currently active download ({ onProgress, onDone, onError } or null).
// The UI only starts one torrent at a time, so a single set of callbacks is sufficient.
var activeCallbacks = null;

// Backend detection: 'electron' via the preload API; NWJS will be added here later
// (e.g. window.nw && parseInt(nw.process.versions.node) >= 20)
var backend = window.electronAPI && window.electronAPI.startTorrentDownload ? 'electron' : null;

if (backend === 'electron') {
    // Register the IPC event listeners once; they dispatch to whichever download is active
    window.electronAPI.on('torrent-progress', function (status) {
        if (activeCallbacks && activeCallbacks.onProgress) activeCallbacks.onProgress(status);
    });
    window.electronAPI.on('torrent-done', function (status) {
        if (activeCallbacks && activeCallbacks.onDone) activeCallbacks.onDone(status);
    });
    window.electronAPI.on('torrent-error', function (message) {
        if (activeCallbacks && activeCallbacks.onError) activeCallbacks.onError(message);
    });
}

/**
 * Reports whether in-app BitTorrent downloading is supported in this runtime
 * @returns {Boolean} True if a torrent backend is available
 */
function isAvailable () {
    return !!backend;
}

/**
 * Starts (or resumes) a torrent download; a partial file from an earlier attempt in the same
 * folder is verified and completed rather than restarted
 * @param {String} torrentUrl The URL of the .torrent file (Kiwix torrents include web seeds)
 * @param {String} savePath The absolute path of the directory to save the archive in
 * @param {Object} callbacks An object with optional keys onProgress, onDone (both receive a
 *   status object) and onError (receives an error message string)
 * @returns {Promise<Object>} A Promise for the initial torrent status ({ infoHash, name,
 *   total, ... }), rejected with an Error if the torrent could not be started
 */
function start (torrentUrl, savePath, callbacks) {
    activeCallbacks = callbacks || null;
    return window.electronAPI.startTorrentDownload({
        torrentUrl: torrentUrl,
        savePath: savePath
    }).then(function (result) {
        if (!result.ok) {
            activeCallbacks = null;
            throw new Error(result.error);
        }
        return result.status;
    });
}

/**
 * Stops a torrent: cancels a download in progress, or stops seeding a completed one
 * @param {String} infoHash The infoHash of the torrent (from the status object)
 * @param {Boolean} deletePartial Whether to delete the partial file (pass false to allow
 *   a later download of the same archive to resume from it)
 * @returns {Promise<Boolean>} A Promise resolving true if a torrent was found and stopped
 */
function stop (infoHash, deletePartial) {
    activeCallbacks = null;
    return window.electronAPI.stopTorrentDownload(infoHash, deletePartial);
}

/**
 * Gets the status of one torrent, or an array of statuses of all torrents if no infoHash given
 * @param {String} infoHash Optional infoHash of a specific torrent
 * @returns {Promise<Object|Array|null>} A Promise for the status
 */
function getStatus (infoHash) {
    return window.electronAPI.getTorrentStatus(infoHash);
}

/**
 * Sets whether completed torrents keep seeding until the app quits; turning this off also
 * stops any torrent that is currently seeding
 * @param {Boolean} value Whether to keep seeding completed torrents
 */
function setSeeding (value) {
    if (backend === 'electron') window.electronAPI.setTorrentSeeding(value);
}

export default {
    isAvailable: isAvailable,
    start: start,
    stop: stop,
    getStatus: getStatus,
    setSeeding: setSeeding
};
