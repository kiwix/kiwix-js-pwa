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

import settingsStore from './settingsStore.js';

// The callbacks of each download ({ onProgress, onDone, onError }), keyed by the torrent's
// infoHash. A key holding null is a detached torrent (e.g. one left seeding after the UI has
// moved on to a new download): its events are deliberately dropped, so that they cannot
// interfere with the status reporting of the current download.
var downloadCallbacks = {};

// Events cannot be routed until start() resolves with the torrent's infoHash, but a torrent
// that is already complete on disk fires 'done' almost immediately, so events for an unknown
// infoHash are buffered while a start is in flight and flushed when it settles
var startInFlight = false;
var bufferedEvents = [];

// Backend detection: 'electron' via the preload API, but only where the runtime can actually
// run WebTorrent (Node 20+ and a non-ia32 arch, decided in preload.cjs as torrentSupported, so
// old/32-bit Electron builds never offer the feature); NWJS will be added here later
// (e.g. window.nw && parseInt(nw.process.versions.node) >= 20)
var backend = window.electronAPI && window.electronAPI.startTorrentDownload && window.electronAPI.torrentSupported ? 'electron' : null;

/**
 * Routes a torrent event to the callbacks of the torrent it belongs to
 * @param {String} type The callback name ('onProgress', 'onDone' or 'onError')
 * @param {String} infoHash The infoHash the event belongs to (may be null for some errors)
 * @param {Object|String} arg The argument to pass to the callback
 */
function dispatchEvent (type, infoHash, arg) {
    if (infoHash && infoHash in downloadCallbacks) {
        var callbacks = downloadCallbacks[infoHash];
        if (callbacks && callbacks[type]) callbacks[type](arg);
    } else if (startInFlight) {
        bufferedEvents.push({ type: type, infoHash: infoHash, arg: arg });
    } else if (!infoHash && type === 'onError') {
        // An error that could not be attributed to a torrent: report it to all downloads
        Object.keys(downloadCallbacks).forEach(function (hash) {
            var callbacks = downloadCallbacks[hash];
            if (callbacks && callbacks.onError) callbacks.onError(arg);
        });
    }
}

if (backend === 'electron') {
    // Register the IPC event listeners once; each event is routed by infoHash
    window.electronAPI.on('torrent-progress', function (status) {
        dispatchEvent('onProgress', status.infoHash, status);
    });
    window.electronAPI.on('torrent-done', function (status) {
        dispatchEvent('onDone', status.infoHash, status);
    });
    window.electronAPI.on('torrent-error', function (payload) {
        // Errors are sent as { infoHash, message }; infoHash is null if the torrent failed
        // before it was registered
        var message = payload && payload.message ? payload.message : String(payload);
        dispatchEvent('onError', payload && payload.infoHash, message);
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
    if (backend !== 'electron') return Promise.reject(new Error('In-app BitTorrent downloading is not available in this runtime'));
    startInFlight = true;
    return window.electronAPI.startTorrentDownload({
        torrentUrl: torrentUrl,
        savePath: savePath
    }).then(function (result) {
        startInFlight = false;
        var buffered = bufferedEvents;
        bufferedEvents = [];
        if (!result.ok) throw new Error(result.error);
        downloadCallbacks[result.status.infoHash] = callbacks || null;
        // Deliver any events for this torrent that arrived before its infoHash was known
        buffered.forEach(function (event) {
            if (event.infoHash === result.status.infoHash || (!event.infoHash && event.type === 'onError')) {
                dispatchEvent(event.type, result.status.infoHash, event.arg);
            }
        });
        return result.status;
    }, function (err) {
        startInFlight = false;
        bufferedEvents = [];
        throw err;
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
    if (backend !== 'electron') return Promise.resolve(false);
    detach(infoHash);
    return window.electronAPI.stopTorrentDownload(infoHash, deletePartial);
}

/**
 * Detaches the callbacks of a torrent so that its further events are silently dropped;
 * the torrent itself is unaffected (used to leave a completed torrent seeding in the
 * background without it writing over the status reports of a newer download)
 * @param {String} infoHash The infoHash of the torrent to detach
 */
function detach (infoHash) {
    if (infoHash) downloadCallbacks[infoHash] = null;
}

/**
 * Gets the status of one torrent, or an array of statuses of all torrents if no infoHash given
 * @param {String} infoHash Optional infoHash of a specific torrent
 * @returns {Promise<Object|Array|null>} A Promise for the status
 */
function getStatus (infoHash) {
    if (backend !== 'electron') return Promise.resolve(null);
    return window.electronAPI.getTorrentStatus(infoHash);
}

/**
 * Deletes an abandoned partial download from disk (used when the user discards a download
 * that was left in progress when the app was last closed, rather than resuming it)
 * @param {String} savePath The directory the torrent was downloading into
 * @param {String} name The torrent's name (i.e. the downloaded file's name)
 * @returns {Promise<Boolean>} A Promise resolving true if a file was found and deleted
 */
function deletePartial (savePath, name) {
    if (backend !== 'electron') return Promise.resolve(false);
    return window.electronAPI.deletePartialTorrentFile(savePath, name).then(function (result) {
        if (!result.ok) throw new Error(result.error);
        return result.deleted;
    });
}

/**
 * Sets whether completed torrents keep seeding until the app quits; turning this off also
 * stops any torrent that is currently seeding
 * @param {Boolean} value Whether to keep seeding completed torrents
 */
function setSeeding (value) {
    if (backend === 'electron') window.electronAPI.setTorrentSeeding(value);
    console.log('[torrentClient] Seeding of completed torrents is now ' + (value ? 'enabled' : 'disabled'));
}

/**
 * Derives the real filesystem path of the folder to download into, so that the torrent
 * backend (which runs in the Node context) can write to the user's chosen folder without
 * the app having to leave the File System Access API pathway:
 * - if pickedFolder is already a path string (native Electron folder picking), it is used;
 * - if it is an FSA directory handle, no path can be read from it directly (Chromium/Electron
 *   deliberately do not expose real paths for FSA handles or the File objects they produce),
 *   but the app stores a folder path string whenever a folder is picked with the native
 *   dialogue, so if a file from the handle exists at that stored path, the stored path and
 *   the handle demonstrably refer to the same folder and the path can be used.
 * If neither works, null is returned and the caller should open the native folder picker
 * (whose result is stored, making this a once-only event per configuration reset).
 * @param {String|FileSystemDirectoryHandle} pickedFolder The current picked folder
 * @returns {Promise<String|null>} A Promise for the folder path, or null if it could not
 *   be derived
 */
function resolveSavePath (pickedFolder) {
    if (typeof pickedFolder === 'string' && pickedFolder) {
        return Promise.resolve(pickedFolder);
    }
    if (!pickedFolder || pickedFolder.kind !== 'directory' || !(window.fs && window.fs.stat)) {
        return Promise.resolve(null);
    }
    var stored = settingsStore.getItem('pickedFolder');
    if (!stored) return Promise.resolve(null);
    var candidate = stored.replace(/[\\/]+$/, '');
    // A bare drive letter ('W:') is drive-relative in Node, so ensure a root slash; other
    // paths are used without a trailing slash
    if (/^[A-Za-z]:$/.test(candidate)) candidate += '/';
    // Find the name of any file inside the handle (skipping subdirectories) with which to
    // verify the stored path
    var iterator = pickedFolder.values();
    var findFileName = function () {
        return iterator.next().then(function (result) {
            if (result.done) return null;
            return result.value.kind === 'file' ? result.value.name : findFileName();
        });
    };
    return findFileName().then(function (fileName) {
        // An empty folder cannot be verified against the stored path
        if (!fileName) return null;
        return new Promise(function (resolve) {
            window.fs.stat(candidate.replace(/\/$/, '') + '/' + fileName, function (err, stats) {
                if (!err && stats) {
                    console.debug('[torrentClient] Using stored folder path verified against the directory handle: ' + candidate);
                    resolve(candidate);
                } else {
                    resolve(null);
                }
            });
        });
    }).catch(function (err) {
        console.warn('[torrentClient] Could not derive a filesystem path from the directory handle', err);
        return null;
    });
}

export default {
    isAvailable: isAvailable,
    start: start,
    stop: stop,
    detach: detach,
    getStatus: getStatus,
    setSeeding: setSeeding,
    resolveSavePath: resolveSavePath,
    deletePartial: deletePartial
};
