// torrentDownloader.cjs: In-app BitTorrent downloader for ZIM archives.
// This module is shared between the Electron main process (via require from main.cjs) and,
// in future, the NWJS Node context. It must therefore remain CommonJS and framework-agnostic:
// all Electron- or NWJS-specific wiring (IPC, events) belongs in the caller.
// WebTorrent v3+ is an ES Module requiring Node 20+, so it is lazily imported on first use;
// runtimes with older Node (e.g. NWJS 0.14.7 for XP/Vista) must not call into this module.

'use strict';

const fs = require('fs');
const path = require('path');

let WebTorrent = null; // Lazily imported WebTorrent constructor
let TolerantStore = null; // Chunk-store class that fixes downloads to a drive root (see getClient)
let client = null; // Singleton WebTorrent client (created on first download)
let keepSeeding = true; // Whether to go on seeding a completed torrent until the app quits
const downloads = new Map(); // infoHash -> { torrent, progressTimer, callbacks, torrentUrl }

// Interval in ms between progress reports to the caller
const PROGRESS_INTERVAL = 1000;

let mkdirPatched = false;

/**
 * Corrects the callback form of fs.mkdir for Windows drive roots: Node's recursive mkdir
 * wrongly reports EPERM on a drive root such as 'W:\' even though the directory exists
 * (long-standing Node issue), and WebTorrent's storage layer (fs-chunk-store and
 * random-access-file) recursively mkdirs the containing directory of every download, so
 * saving an archive directly to the root of a drive always failed. The wrapper only
 * intervenes when a recursive call errors with EPERM/EACCES and the target does in fact
 * exist as a directory (i.e. cases where the documented behaviour is success); every other
 * call and error path is passed through unchanged.
 */
function patchMkdirForDriveRoots () {
    if (mkdirPatched) return;
    mkdirPatched = true;
    const realMkdir = fs.mkdir;
    fs.mkdir = function (target, options, callback) {
        if (typeof options === 'function' || !(options && options.recursive)) {
            return realMkdir.apply(fs, arguments);
        }
        return realMkdir.call(fs, target, options, function (err) {
            const args = arguments;
            if (err && (err.code === 'EPERM' || err.code === 'EACCES')) {
                return fs.stat(target, function (statErr, stats) {
                    if (!statErr && stats.isDirectory()) return callback(null);
                    callback(err);
                });
            }
            callback.apply(null, args);
        });
    };
}

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
        // Apply the drive-root mkdir correction before WebTorrent (and its storage
        // dependencies) are loaded, so that all of them see the corrected behaviour
        patchMkdirForDriveRoots();
        WebTorrent = (await import('webtorrent')).default;
        // fs-chunk-store and random-access-file are webtorrent's own dependencies (kept in step
        // with it by the lockfile); we need them to build a store that can save to a drive root
        const FSChunkStore = (await import('fs-chunk-store')).default;
        const RAF = (await import('random-access-file')).default;
        // DEV: fs-chunk-store unconditionally does a recursive mkdir of the directory containing
        // each file, but Node's recursive mkdir throws EPERM (instead of reporting success) on a
        // Windows drive root such as 'W:\', even though it exists (nodejs/node issue). This
        // subclass re-wraps each file's open function with one that tolerates a failed mkdir
        // whenever the directory does in fact exist, so that archives can be downloaded directly
        // to the root of a drive.
        TolerantStore = class extends FSChunkStore {
            constructor (chunkLength, opts) {
                super(chunkLength, opts);
                const self = this;
                // When true, file handles are (re)opened without write access: random-access-file
                // opens files read-write by default, and on Windows an open read-write handle
                // blocks any other opener that does not grant write sharing - including the app's
                // own File System Access reads of the completed archive, and tools like
                // Get-FileHash - so a torrent that is only seeding must hold read-only handles
                this.readOnly = false;
                this._handleClosers = [];
                this.files.forEach(function (file) {
                    let opened = null; // Memoized result; reset on failure so a retry is possible
                    let openedReadOnly = false; // The access mode of the memoized handle
                    const closeHandle = function () {
                        if (!opened) return;
                        const prev = opened;
                        opened = null;
                        // random-access-storage queues the close behind any reads in flight
                        prev.then(function (raf) { raf.close(function () {}); }, function () {});
                    };
                    self._handleClosers.push(closeHandle);
                    file.open = function (cb) {
                        // If the required access mode has changed, close and reopen the file
                        if (opened && openedReadOnly !== self.readOnly) closeHandle();
                        if (!opened) {
                            openedReadOnly = self.readOnly;
                            opened = new Promise(function (resolve, reject) {
                                if (self.closed) return reject(new Error('Storage is closed'));
                                const dir = path.dirname(file.path);
                                fs.promises.mkdir(dir, { recursive: true }).catch(function (err) {
                                    // Ignore the error if the directory already exists
                                    return fs.promises.stat(dir).then(function (stats) {
                                        if (!stats.isDirectory()) throw err;
                                    }, function () { throw err; });
                                }).then(function () {
                                    if (self.closed) throw new Error('Storage is closed');
                                    resolve(new RAF(file.path, { writable: !openedReadOnly }));
                                }).catch(reject);
                            });
                            opened.catch(function () { opened = null; });
                        }
                        opened.then(function (raf) { cb(null, raf); }, function (err) { cb(err); });
                    };
                });
            }

            // Closes all open file handles and reopens subsequent access read-only; call this
            // once the torrent is complete and verified, so that seeding does not keep the
            // archive locked against readers (see the readOnly comment above)
            setReadOnly () {
                this.readOnly = true;
                this._handleClosers.forEach(function (closeHandle) { closeHandle(); });
            }
        };
    }
    // Incoming peer connections are accepted (default), for better connectivity and effective
    // seeding: note that this causes a one-time firewall prompt on Windows
    client = new WebTorrent();
    client.on('error', function (err) {
        // Client-level errors are frequently benign on Windows (e.g. a UDP operation refused
        // by the firewall); they do not stop the torrents, so we log rather than surface them
        console.error('[torrentDownloader] Client error: ' + (err.message || err));
        if (err && err.stack) console.error(err.stack);
    });
    return client;
}

/**
 * Builds a plain serializable status object for a torrent (safe to send over IPC)
 * @param {Object} torrent The WebTorrent torrent object
 * @returns {Object} The status of the torrent
 */
function makeStatus (torrent) {
    const record = downloads.get(torrent.infoHash);
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
        verifying: !!(record && record.verifying),
        seeding: !!(torrent.done && !torrent.destroyed && !(record && record.verifying))
    };
}

/**
 * Switches a completed torrent's chunk store to read-only file handles. Seeding only ever
 * reads, but the store's handles were opened read-write for the download, and on Windows an
 * open read-write handle blocks other openers of the archive (including the app itself
 * trying to load it); WebTorrent wraps the raw store in caching layers, so this walks down
 * the .store chain to find the TolerantStore and asks it to reopen its files read-only
 * @param {Object} torrent The completed torrent whose store should stop holding write access
 */
function releaseWriteHandles (torrent) {
    let store = torrent.store;
    while (store && store.store && !(TolerantStore && store instanceof TolerantStore)) {
        store = store.store;
    }
    if (TolerantStore && store instanceof TolerantStore) {
        store.setReadOnly();
        console.log('[torrentDownloader] Reopened ' + torrent.name + ' read-only for seeding');
    }
}

/**
 * Checks whether the drive containing savePath has enough free space for the part of the
 * torrent that remains to be downloaded (bytes already on disk and verified need no new space)
 * @param {Object} torrent The torrent, which must be ready (so that progress reflects any
 *   existing data on disk that has been verified)
 * @param {String} savePath The directory the torrent is downloading into
 * @returns {Promise<Number>} A Promise for the shortfall in bytes (zero or negative if there
 *   is enough space, or if free space cannot be determined on this platform)
 */
function checkFreeSpace (torrent, savePath) {
    if (!fs.promises.statfs) return Promise.resolve(0);
    return fs.promises.statfs(savePath).then(function (stats) {
        const free = stats.bsize * stats.bavail;
        const needed = Math.round(torrent.length * (1 - torrent.progress));
        return needed - free;
    }, function () {
        // If free space cannot be determined, do not block the download
        return 0;
    });
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
    // If the same torrent has already finished downloading and is merely seeding, stop it
    // (keeping the file) so that the fresh add below hash-checks the file on disk and repairs
    // it if needed; a torrent that is still downloading or verifying is a genuine duplicate
    for (const [infoHash, record] of downloads) {
        if (record.torrentUrl === args.torrentUrl) {
            if (record.torrent.done && !record.verifying) {
                await stopTorrent(infoHash, false);
            } else {
                throw new Error('This torrent is already being downloaded');
            }
            break;
        }
    }
    // Check that the download folder exists before we start (clearer error than the store's)
    let savePathStats = null;
    try {
        savePathStats = await fs.promises.stat(args.savePath);
    } catch (err) {
        throw new Error('The download folder does not exist or cannot be accessed: ' + args.savePath);
    }
    if (!savePathStats.isDirectory()) {
        throw new Error('The download location is not a folder: ' + args.savePath);
    }
    const cl = await getClient();
    const response = await fetch(args.torrentUrl);
    if (!response.ok) {
        throw new Error('Could not fetch torrent file (HTTP ' + response.status + ') from ' + args.torrentUrl);
    }
    const torrentBuffer = Buffer.from(await response.arrayBuffer());
    return new Promise(function (resolve, reject) {
        let settled = false;
        let record = null;
        // The torrent is added in up to two phases. The 'download' phase gets the data; on
        // completion, the torrent is removed (keeping the file) and re-added in a 'verify'
        // phase, which forces WebTorrent to hash-check the data actually written to disk:
        // pieces are verified in memory as they are received, but writes are never read back,
        // so a failing or full disk can corrupt a download without WebTorrent noticing. Any
        // pieces that fail the check are automatically downloaded again.
        addTorrent('download');
        function addTorrent (phase) {
            const torrent = cl.add(torrentBuffer, { path: args.savePath, store: TolerantStore });
            // In the verify phase the record already exists: point it at the re-added torrent
            // straight away, so that progress reports and stop requests track the hash check
            if (phase === 'verify' && record) record.torrent = torrent;
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
                if (phase === 'verify') return;
                record = {
                    torrent: torrent,
                    torrentUrl: args.torrentUrl,
                    callbacks: callbacks,
                    verifying: false,
                    progressTimer: setInterval(function () {
                        if (callbacks.onProgress && !record.torrent.destroyed) {
                            callbacks.onProgress(makeStatus(record.torrent));
                        }
                    }, PROGRESS_INTERVAL)
                };
                downloads.set(torrent.infoHash, record);
                console.log('[torrentDownloader] Added torrent ' + torrent.name + ' (' + torrent.infoHash + '), saving to ' + args.savePath);
                // 'ready' fires after any existing on-disk data has been verified, so
                // torrent.progress now tells us how much remains to be downloaded
                checkFreeSpace(torrent, args.savePath).then(function (shortfall) {
                    if (shortfall > 0 && downloads.has(torrent.infoHash)) {
                        const err = new Error('There is not enough free space on the destination drive: the download needs about ' +
                            Math.ceil(shortfall / 1048576) + ' MB more than is available. Free up some space and try again.');
                        console.error('[torrentDownloader] ' + err.message);
                        stopTorrent(torrent.infoHash, false);
                        if (!settled) {
                            settled = true;
                            reject(err);
                        } else if (callbacks.onError) {
                            callbacks.onError(err);
                        }
                    } else if (!settled) {
                        settled = true;
                        resolve(makeStatus(torrent));
                    }
                });
            });
            torrent.on('done', function () {
                const infoHash = torrent.infoHash;
                const rec = downloads.get(infoHash);
                if (!rec || rec.torrent !== torrent) return; // Stopped or superseded meanwhile
                if (phase === 'download' && torrent.downloaded > 0) {
                    // Data was received in this session, so the file on disk needs checking
                    // (when nothing was downloaded, everything on disk was already verified
                    // during the add and a second check would be redundant)
                    console.log('[torrentDownloader] Download complete; verifying on-disk data: ' + torrent.name);
                    rec.verifying = true;
                    torrent.destroy({ destroyStore: false }, function () {
                        if (!downloads.has(infoHash)) return; // Stopped during the destroy
                        addTorrent('verify');
                    });
                    return;
                }
                rec.verifying = false;
                console.log('[torrentDownloader] Download complete' + (phase === 'verify' ? ' and verified: ' : ': ') + torrent.name);
                const status = makeStatus(torrent);
                // Either every piece passed the verify phase's hash check, or (if nothing was
                // downloaded this session) the whole file was verified when the torrent was added
                status.verified = true;
                if (!keepSeeding) {
                    // Destroy the torrent but keep the completed file on disk
                    stopTorrent(infoHash, false);
                    status.seeding = false;
                } else {
                    // Give up write access to the archive so the app (and anything else) can
                    // open it while it goes on seeding
                    releaseWriteHandles(torrent);
                }
                if (callbacks.onDone) callbacks.onDone(status);
            });
        }
    });
}

/**
 * Deletes an abandoned partial (or completed) download from disk by its save path and name,
 * without needing to add the torrent back to the client first: this is used to discard a
 * download that was left in progress when the app was previously closed, so no WebTorrent
 * instance for it exists in this session yet. ZIM archives are always single-file torrents, so
 * the on-disk data is a single file directly inside savePath, named after the torrent.
 * @param {String} savePath The directory the torrent was downloading into
 * @param {String} name The torrent's name (i.e. the downloaded file's name)
 * @returns {Promise<Boolean>} A Promise resolving true if a file was found and deleted, or
 *   false if there was nothing to delete
 */
async function deletePartialFile (savePath, name) {
    if (!savePath || !name) return false;
    const target = path.join(savePath, name);
    try {
        await fs.promises.unlink(target);
        console.log('[torrentDownloader] Deleted discarded partial download: ' + target);
        return true;
    } catch (err) {
        if (err.code === 'ENOENT') return false;
        throw err;
    }
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
    deletePartialFile: deletePartialFile,
    getStatus: getStatus,
    setKeepSeeding: setKeepSeeding,
    destroyAll: destroyAll
};
