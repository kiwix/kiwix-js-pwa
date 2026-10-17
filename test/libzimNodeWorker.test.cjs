#!/usr/bin/env node
/**
 * Checks the validation of renderer requests in libzimNodeWorker.cjs, which runs libzim in the Electron main process for
 * archives the renderer knows only by their path: only the expected fields may reach libzim, and only for archives in a
 * folder the app has been given access to.
 *
 * Usage: npm test
 */

'use strict';

const path = require('path');
const assert = require('node:assert/strict');
const { describe, it } = require('node:test');
const { createLibzimHost, sanitizeLibzimRequest } = require('../libzimNodeWorker.cjs');

const ALLOWED_FOLDER = path.resolve('/archives');
const OTHER_FOLDER = path.resolve('/elsewhere');

// Mirrors main.cjs: a ZIM archive (or part of a split archive) in an allowed folder
function isAllowedZimFile (filePath) {
    return /\.zim(?:\w\w)?$/i.test(path.basename(filePath)) && path.dirname(path.resolve(filePath)) === ALLOWED_FOLDER;
}

function sanitize (data) {
    return sanitizeLibzimRequest(data, isAllowedZimFile);
}

describe('sanitizeLibzimRequest', function () {
    it('rejects unknown actions and malformed requests', function () {
        assert.throws(() => sanitize({ action: 'readFile', path: '/etc/passwd' }), /Unsupported libzim action/);
        assert.throws(() => sanitize({ action: 'constructor' }), /Unsupported libzim action/);
        assert.throws(() => sanitize(null), /Unsupported libzim action/);
        assert.throws(() => sanitize('init'), /Unsupported libzim action/);
    });

    it('builds the init file list from the paths alone', function () {
        const zim = path.join(ALLOWED_FOLDER, 'wikipedia_en_100.zim');
        const message = sanitize({ action: 'init', files: [{ name: 'other.zim', path: zim, readMode: 'file', size: 1, extra: 'x' }], assemblerType: 'x' });
        assert.deepEqual(message, { action: 'init', files: [{ name: 'wikipedia_en_100.zim', path: zim, readMode: 'electron' }] });
    });

    it('accepts all the parts of a split archive in one folder', function () {
        const files = ['big.zimaa', 'big.zimab'].map(name => ({ path: path.join(ALLOWED_FOLDER, name) }));
        assert.deepEqual(sanitize({ action: 'init', files: files }).files.map(file => file.name), ['big.zimaa', 'big.zimab']);
    });

    it('refuses archives outside the allowed folders, and files that are not ZIM archives', function () {
        const refused = [
            [],
            [{}],
            [{ path: '' }],
            [{ path: path.join(OTHER_FOLDER, 'wikipedia.zim') }],
            [{ path: path.join(ALLOWED_FOLDER, 'notes.txt') }],
            [{ path: path.join(ALLOWED_FOLDER, '..', 'elsewhere', 'wikipedia.zim') }],
            // A later part may not come from another folder
            [{ path: path.join(ALLOWED_FOLDER, 'big.zimaa') }, { path: path.join(OTHER_FOLDER, 'big.zimab') }]
        ];
        refused.forEach(function (files) {
            assert.throws(() => sanitize({ action: 'init', files: files }), /No archive|not been given access/, JSON.stringify(files));
        });
        assert.throws(() => sanitize({ action: 'init' }), /No archive/);
    });

    it('copies only the fields each action reads', function () {
        assert.deepEqual(sanitize({ action: 'getEntryByPath', path: 'A/London', follow: 1, files: [] }), { action: 'getEntryByPath', path: 'A/London', follow: true });
        assert.deepEqual(sanitize({ action: 'search', text: 'london', numResults: 20, path: 'x' }), { action: 'search', text: 'london', numResults: 20 });
        assert.deepEqual(sanitize({ action: 'suggest', text: 'lon' }), { action: 'suggest', text: 'lon' });
        assert.deepEqual(sanitize({ action: 'searchWithSnippets', text: 'lon', numResults: -1 }), { action: 'searchWithSnippets', text: 'lon' });
        assert.deepEqual(sanitize({ action: 'getArticleCount', text: 'x' }), { action: 'getArticleCount' });
    });

    it('requires a string path or search text', function () {
        assert.throws(() => sanitize({ action: 'getEntryByPath', path: { toString: () => 'A/London' } }), /needs a path/);
        assert.throws(() => sanitize({ action: 'search' }), /needs a search text/);
    });
});

describe('createLibzimHost', function () {
    it('refuses calls before an archive has been opened, and a refused init starts nothing', async function () {
        const host = createLibzimHost({ isAllowedZimFile: isAllowedZimFile });
        await assert.rejects(host.call({ action: 'search', text: 'london' }), /not been initialized/);
        await assert.rejects(host.call({ action: 'init', files: [{ path: path.join(OTHER_FOLDER, 'wikipedia.zim') }] }), /not been given access/);
        await assert.rejects(host.call({ action: 'getArticleCount' }), /not been initialized/);
        await assert.rejects(host.call({ action: 'eval' }), /Unsupported libzim action/);
        host.terminate();
    });
});
