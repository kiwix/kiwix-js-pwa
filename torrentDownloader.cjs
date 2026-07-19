// torrentDownloader.cjs: In-app BitTorrent downloader for ZIM archives.
// This module is shared between the Electron main process (via require from main.cjs) and,
// in future, the NWJS Node context. It must therefore remain CommonJS and framework-agnostic:
// all Electron- or NWJS-specific wiring (IPC, events) belongs in the caller.
// WebTorrent v3+ is an ES Module requiring Node 20+, so it is lazily imported on first use;
// runtimes with older Node (e.g. NWJS 0.14.7 for XP/Vista) must not call into this module.

'use strict';

let WebTorrent = null; // Lazily imported WebTorrent constructor
let client = null; // Singleton WebTorrent client (created on first download)
let keepSeeding = true; // Whether to go on seeding a completed torrent until the app quits
const downloads = new Map(); // infoHash -> { torrent, progressTimer, callbacks, torrentUrl }

// Interval in ms between progress reports to the caller
const PROGRESS_INTERVAL = 1000;

/**
 * Lazily imports WebTorrent and creates the singleton client
 * @returns {Promise<Object>} A Promise for the WebTorrent client
 */
async function getClient () {
    if (client) return client;
    const nodeMajor = parseInt(process.versions.node, 10);
    if (nodeMajor < 20) {
        throw new Error('In-app BitTorrent downloads require Node 20+, but this runtime has Node ' + process.versions.node);
    }
    if (!WebTorrent) {
        WebTorrent = (await import('webtorrent')).default;
    }
    // Incoming peer connections are accepted (default), for better connectivity and effective
    // seeding: note that this causes a one-time firewall prompt on Windows
    client = new WebTorrent();
    client.on('error', function (err) {
        console.error('[torrentDownloader] Client error: ' + (err.message || err));
    });
    return client;
}

/**
 * Builds a plain serializable status object for a torrent (safe to send over IPC)
 * @param {Object} torrent The WebTorrent torrent object
 * @returns {Object} The status of the torrent
 */
function makeStatus (torrent) {
    return {
        infoHash: torrent.infoHash,
        name: torrent.name,
        received: torrent.downloaded,
        total: torrent.length,
        progress: torrent.progress,
        downloadSpeed: torrent.downloadSpeed,
        uploadSpeed: torrent.uploadSpeed,
        uploaded: torrent.uploaded,
        numPeers: torrent.numPeers,
        done: torrent.done,
        seeding: !!(torrent.done && !torrent.destroyed)
    };
}

/**
 * Starts (or resumes) a torrent download. If a partial file from a previous attempt exists in
 * savePath, WebTorrent verifies the pieces already on disk and resumes from where it left off.
 * @param {Object} args An object with keys torrentUrl (URL of the .torrent file, which for Kiwix
 *   archives includes both trackers and mirror web seeds) and savePath (absolute directory path
 *   into which the archive will be saved under its torrent name)
 * @param {Object} callbacks An object with optional keys onProgress, onDone, onError; each
 *   receives a status object (onError receives an Error). onProgress fires about once a second,
 *   including while seeding after completion.
 * @returns {Promise<Object>} A Promise for the initial status of the added torrent
 */
async function startDownload (args, callbacks) {
    callbacks = callbacks || {};
    // Prevent a duplicate add of a torrent that is already in progress
    for (const record of downloads.values()) {
        if (record.torrentUrl === args.torrentUrl) {
            throw new Error('This torrent is already being downloaded');
        }
    }
    const cl = await getClient();
    const response = await fetch(args.torrentUrl);
    if (!response.ok) {
        throw new Error('Could not fetch torrent file (HTTP ' + response.status + ') from ' + args.torrentUrl);
    }
    const torrentBuffer = Buffer.from(await response.arrayBuffer());
    return new Promise(function (resolve, reject) {
        let settled = false;
        const torrent = cl.add(torrentBuffer, { path: args.savePath });
        torrent.on('error', function (err) {
            console.error('[torrentDownloader] Torrent error: ' + (err.message || err));
            removeRecord(torrent.infoHash);
            if (!settled) {
                settled = true;
                reject(err instanceof Error ? err : new Error(String(err)));
            } else if (callbacks.onError) {
                callbacks.onError(err instanceof Error ? err : new Error(String(err)));
            }
        });
        torrent.on('ready', function () {
            const record = {
                torrent: torrent,
                torrentUrl: args.torrentUrl,
                callbacks: callbacks,
                progressTimer: setInterval(function () {
                    if (callbacks.onProgress) callbacks.onProgress(makeStatus(torrent));
                }, PROGRESS_INTERVAL)
            };
            downloads.set(torrent.infoHash, record);
            console.log('[torrentDownloader] Added torrent ' + torrent.name + ' (' + torrent.infoHash + '), saving to ' + args.savePath);
            if (!settled) {
                settled = true;
                resolve(makeStatus(torrent));
            }
        });
        torrent.on('done', function () {
            console.log('[torrentDownloader] Download complete: ' + torrent.name);
            const status = makeStatus(torrent);
            if (!keepSeeding) {
                // Destroy the torrent but keep the completed file on disk
                stopTorrent(torrent.infoHash, false);
                status.seeding = false;
            }
            if (callbacks.onDone) callbacks.onDone(status);
        });
    });
}

/**
 * Clears the progress timer for a download and forgets it
 * @param {String} infoHash The infoHash of the torrent to forget
 */
function removeRecord (infoHash) {
    const record = downloads.get(infoHash);
    if (record) {
        clearInterval(record.progressTimer);
        downloads.delete(infoHash);
    }
}

/**
 * Stops a torrent (cancels a download in progress, or stops seeding a completed one)
 * @param {String} infoHash The infoHash of the torrent to stop
 * @param {Boolean} deletePartial Whether to delete the (partial) file from disk as well:
 *   pass false to keep it, so that a future download of the same torrent resumes from it
 * @returns {Promise<Boolean>} A Promise that resolves true if a torrent was found and stopped
 */
function stopTorrent (infoHash, deletePartial) {
    const record = downloads.get(infoHash);
    if (!record) return Promise.resolve(false);
    removeRecord(infoHash);
    return new Promise(function (resolve) {
        record.torrent.destroy({ destroyStore: !!deletePartial }, function () {
            console.log('[torrentDownloader] Stopped torrent ' + infoHash + (deletePartial ? ' and deleted its data' : ''));
            resolve(true);
        });
    });
}

/**
 * Gets the status of one download, or of all downloads if no infoHash is given
 * @param {String} infoHash Optional infoHash of a specific torrent
 * @returns {Object|Array|null} A status object (or null if not found), or an array of statuses
 */
function getStatus (infoHash) {
    if (infoHash) {
        const record = downloads.get(infoHash);
        return record ? makeStatus(record.torrent) : null;
    }
    const statuses = [];
    downloads.forEach(function (record) {
        statuses.push(makeStatus(record.torrent));
    });
    return statuses;
}

/**
 * Sets whether completed torrents go on seeding until app quit; turning this off stops
 * any torrent that is currently seeding (downloads in progress are unaffected)
 * @param {Boolean} value Whether to keep seeding completed torrents
 */
function setKeepSeeding (value) {
    keepSeeding = !!value;
    if (!keepSeeding) {
        downloads.forEach(function (record, infoHash) {
            if (record.torrent.done) stopTorrent(infoHash, false);
        });
    }
}

/**
 * Destroys the client and all torrents (partial files are kept for later resume);
 * call this when the app is quitting
 * @returns {Promise<void>} A Promise that resolves when the client has been destroyed
 */
function destroyAll () {
    downloads.forEach(function (record) {
        clearInterval(record.progressTimer);
    });
    downloads.clear();
    if (!client) return Promise.resolve();
    const cl = client;
    client = null;
    return new Promise(function (resolve) {
        cl.destroy(function () {
            resolve();
        });
    });
}

module.exports = {
    startDownload: startDownload,
    stopTorrent: stopTorrent,
    getStatus: getStatus,
    setKeepSeeding: setKeepSeeding,
    destroyAll: destroyAll
};
