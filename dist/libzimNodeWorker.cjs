// libzimNodeWorker.cjs: runs libzim for the Electron app in a Node.js worker thread of the main process.
// The renderer reads most archives with libzim in a Web Worker, through the File objects it was given. An archive
// the renderer knows only by its path (the archive of a packaged app such as WikiMed, one the app was launched with,
// a reopened stored path, or one picked through the native dialogue) has to be read through Node's fs instead, and
// the renderer's Web Workers have no Node.js. So main.cjs hands such archives to libzim here, over IPC.
// The worker thread runs the unmodified release build (libzim-wasm.js), with a small shim for the Web Worker API it
// expects. This file is both the worker thread's bootstrap and the main process's interface to it.

'use strict';

const { Worker, MessageChannel, isMainThread, parentPort, workerData } = require('worker_threads');
const fs = require('fs');
const path = require('path');

// The actions the libzim worker supports, as sent by zimArchive.js, popovers.js and app.js
const LIBZIM_ACTIONS = ['init', 'getEntryByPath', 'search', 'searchWithSnippets', 'suggest', 'getArticleCount'];

/**
 * Starts the libzim script in this worker thread. The script expects a Web Worker's global scope: it listens for
 * 'message' events on self, and replies on the MessagePort transferred with each message
 */
function runWorker () {
    const Module = require('module');
    const listeners = [];
    globalThis.self = globalThis;
    self.addEventListener = function (type, listener) {
        if (type === 'message') listeners.push(listener);
    };
    parentPort.on('message', function ({ data, port }) {
        try {
            listeners.forEach(function (listener) {
                listener({ data: data, ports: [port] });
            });
        } catch (err) {
            // A Web Worker survives an exception thrown by its message handler, but a worker thread would end, so we
            // report it on the port instead
            port.postMessage({ uncaughtError: String(err && err.message || err) });
        }
    });
    // Compile the script as CommonJS: if we loaded it with require(), the "type": "module" in package.json would make
    // Node treat it as an ES module, in which require() is not defined
    const script = workerData.script;
    const scriptModule = new Module(script, module);
    scriptModule.filename = script;
    scriptModule._compile(fs.readFileSync(script, 'utf8'), script);
}

/**
 * Finds the release WASM build of libzim. The bundled app (dist) has it in www/js, and the source tree in www/js/lib
 * @returns {String|null} The path of libzim-wasm.js, or null if it cannot be found
 */
function findLibzimScript () {
    const candidates = [
        path.join(__dirname, 'www', 'js', 'libzim-wasm.js'),
        path.join(__dirname, 'www', 'js', 'lib', 'libzim-wasm.js')
    ];
    return candidates.find(function (candidate) {
        return fs.existsSync(candidate);
    }) || null;
}

/**
 * Builds the file list for libzim's 'init' action from the paths the renderer sent. Each file must be a ZIM archive
 * (or part of a split archive) that the app has been given access to, and all the parts must be in the same folder
 *
 * @param {Array<Object>} files The renderer's file objects, of which only the path is used
 * @param {Function} isAllowedZimFile Tests whether the app may read the file at the given path
 * @returns {Array<Object>} The files as libzim expects them: name, path and readMode
 * @throws {Error} If any of the files is not allowed
 */
function libzimFilesFromPaths (files, isAllowedZimFile) {
    if (!Array.isArray(files) || !files.length) throw new Error('No archive was given to libzim');
    const paths = files.map(function (file) {
        return file && typeof file.path === 'string' && file.path ? path.resolve(file.path) : '';
    });
    const folder = path.dirname(paths[0]);
    paths.forEach(function (filePath, i) {
        if (!filePath || path.dirname(filePath) !== folder || !isAllowedZimFile(filePath)) {
            throw new Error('The app has not been given access to ' + (filePath || 'file ' + i) + '. Please pick the archive again.');
        }
    });
    return paths.map(function (filePath) {
        return { name: path.basename(filePath), path: filePath, readMode: 'electron' };
    });
}

/**
 * Validates a request from the renderer, and copies only the fields that libzim reads for its action
 *
 * @param {Object} data The request, e.g. { action: 'search', text: 'London', numResults: 20 }
 * @param {Function} isAllowedZimFile Tests whether the app may read the file at the given path (see libzimFilesFromPaths)
 * @returns {Object} The message to send to the worker
 * @throws {Error} If the request is not valid
 */
function sanitizeLibzimRequest (data, isAllowedZimFile) {
    if (!data || typeof data !== 'object' || !LIBZIM_ACTIONS.includes(data.action)) {
        throw new Error('Unsupported libzim action: ' + (data && data.action));
    }
    const action = data.action;
    if (action === 'init') {
        return { action: action, files: libzimFilesFromPaths(data.files, isAllowedZimFile) };
    }
    if (action === 'getEntryByPath') {
        if (typeof data.path !== 'string') throw new Error('libzim needs a path for ' + action);
        return { action: action, path: data.path, follow: !!data.follow };
    }
    if (action === 'getArticleCount') return { action: action };
    // The search actions
    if (typeof data.text !== 'string') throw new Error('libzim needs a search text for ' + action);
    const message = { action: action, text: data.text };
    if (Number.isInteger(data.numResults) && data.numResults > 0) message.numResults = data.numResults;
    return message;
}

/**
 * Creates the main process's interface to libzim. The worker thread is started by each 'init' request (replacing any
 * previous one), so it costs nothing until the renderer opens an archive by its path
 *
 * @param {Object} options
 * @param {Function} options.isAllowedZimFile Tests whether the app may read the file at the given path
 * @returns {{call: Function, terminate: Function}} call(data) returns a Promise for libzim's reply to the request;
 *     terminate() stops the worker thread
 */
function createLibzimHost (options) {
    let worker = null;
    // The ports of the calls awaiting a reply, with the function that fails each call
    const pending = new Map();

    // Like a terminated Web Worker, a worker that we stop leaves its outstanding calls unanswered
    const terminate = function () {
        if (!worker) return;
        const stopping = worker;
        worker = null;
        pending.forEach(function (reject, port) {
            port.close();
        });
        pending.clear();
        stopping.terminate();
    };

    // A worker that fails, on the other hand, fails its outstanding calls
    const fail = function (failed, err) {
        if (worker !== failed) return;
        worker = null;
        pending.forEach(function (reject, port) {
            port.close();
            reject(err);
        });
        pending.clear();
    };

    const start = function () {
        const script = findLibzimScript();
        if (!script) throw new Error('The libzim WASM build could not be found');
        const started = new Worker(__filename, { workerData: { script: script } });
        started.on('error', function (err) {
            console.error('The libzim worker failed:', err);
            fail(started, err);
        });
        started.on('exit', function (code) {
            fail(started, new Error('The libzim worker stopped (exit code ' + code + ')'));
        });
        worker = started;
    };

    const post = function (message) {
        return new Promise(function (resolve, reject) {
            const { port1, port2 } = new MessageChannel();
            pending.set(port1, reject);
            port1.once('message', function (reply) {
                pending.delete(port1);
                port1.close();
                if (reply && reply.uncaughtError) reject(new Error(reply.uncaughtError));
                else resolve(reply);
            });
            worker.postMessage({ data: message, port: port2 }, [port2]);
        });
    };

    const call = function (data) {
        try {
            const message = sanitizeLibzimRequest(data, options.isAllowedZimFile);
            if (message.action === 'init') {
                terminate();
                start();
            } else if (!worker) {
                throw new Error('libzim has not been initialized with an archive');
            }
            return post(message);
        } catch (err) {
            return Promise.reject(err);
        }
    };

    return { call: call, terminate: terminate };
}

if (!isMainThread) runWorker();

module.exports = {
    createLibzimHost: createLibzimHost,
    sanitizeLibzimRequest: sanitizeLibzimRequest
};
