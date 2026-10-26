#!/usr/bin/env node
/**
 * Checks that a folder dropped onto the app is read in full with the drag-and-drop FileSystem API (#1027).
 *
 * Browsers that do not support the File System Access API outside the OPFS (e.g. Firefox) never put a dropped
 * folder's contents in the DataTransfer, so the only way to read the folder is the entry returned by
 * webkitGetAsEntry(). uiUtil.readDroppedDirectory() walks that entry, and has to keep calling readEntries() until
 * it returns an empty array, because browsers deliver the entries in batches (Chromium returns at most 100 per
 * call), which is how a folder of split archive parts could otherwise be read only in part.
 *
 * Usage: npm test
 */

'use strict';

const path = require('path');
const assert = require('node:assert/strict');
const { describe, it } = require('node:test');
const { loadModuleSource, createMockDocument } = require('./helpers.cjs');

const UI_UTIL_JS = path.join(__dirname, '..', 'www', 'js', 'lib', 'uiUtil.js');
const uiUtilSource = loadModuleSource(UI_UTIL_JS);

// uiUtil.js only needs these globals at load time, so bare stubs will do
// eslint-disable-next-line no-eval
const readDroppedDirectory = eval('(function (document, params, appstate, window) {\n' + uiUtilSource +
    '\nreturn readDroppedDirectory;\n})')(createMockDocument(), {}, {}, {});

/**
 * Builds a mock of the FileSystemDirectoryEntry a browser hands us for a dropped folder
 *
 * @param {String[]} names The names of the entries in the folder, a trailing '/' marking a subdirectory
 * @param {Object} [options] Mock behaviour: `batchSize` (entries returned per readEntries call, default 100),
 *     `readEntriesError` (the reader fails with this), `fileError` (every entry's file() fails with this)
 * @returns {Object} A mock directory entry, with a `readEntriesCalls` count
 */
function mockDirEntry (names, options) {
    options = options || {};
    const batchSize = options.batchSize || 100;
    const entries = names.map(function (name) {
        const isDirectory = /\/$/.test(name);
        return {
            name: name.replace(/\/$/, ''),
            isFile: !isDirectory,
            isDirectory: isDirectory,
            // The real API delivers the File asynchronously, through callbacks
            file: function (onSuccess, onError) {
                setTimeout(function () {
                    if (options.fileError) onError(options.fileError);
                    else onSuccess({ name: name });
                }, 0);
            }
        };
    });
    let index = 0;
    const dirEntry = {
        name: 'archives',
        isFile: false,
        isDirectory: true,
        readEntriesCalls: 0,
        createReader: function () {
            return {
                readEntries: function (onSuccess, onError) {
                    dirEntry.readEntriesCalls++;
                    const batch = entries.slice(index, index + batchSize);
                    index += batch.length;
                    setTimeout(function () {
                        if (options.readEntriesError) onError(options.readEntriesError);
                        else onSuccess(batch);
                    }, 0);
                }
            };
        }
    };
    return dirEntry;
}

/**
 * Returns the names of the files read from the mocked folder
 *
 * @param {Object} dirEntry The mock directory entry
 * @returns {Promise<String[]>} The names, in the order they were read
 */
function namesRead (dirEntry) {
    return readDroppedDirectory(dirEntry).then(function (files) {
        return files.map(function (file) { return file.name; });
    });
}

describe('readDroppedDirectory (#1027)', function () {
    it('reads the files in a dropped folder', async function () {
        const dirEntry = mockDirEntry(['wikipedia_en.zim', 'wikivoyage_en.zim', 'notes.txt']);
        assert.deepEqual(await namesRead(dirEntry), ['wikipedia_en.zim', 'wikivoyage_en.zim', 'notes.txt']);
    });

    it('reads every part of a split archive that spans more than one batch of entries', async function () {
        const names = [];
        for (let i = 0; i < 250; i++) {
            names.push('wikipedia_en.zim' + String.fromCharCode(97 + Math.floor(i / 26)) + String.fromCharCode(97 + i % 26));
        }
        const dirEntry = mockDirEntry(names);
        assert.deepEqual(await namesRead(dirEntry), names);
        // Three batches of 100, 100 and 50, plus the empty one that ends the walk
        assert.equal(dirEntry.readEntriesCalls, 4);
    });

    it('ignores subdirectories, as the webkitdirectory picker does', async function () {
        const dirEntry = mockDirEntry(['wikipedia_en.zim', 'subfolder/', 'wikivoyage_en.zim']);
        assert.deepEqual(await namesRead(dirEntry), ['wikipedia_en.zim', 'wikivoyage_en.zim']);
    });

    it('resolves with no files for an empty folder', async function () {
        const dirEntry = mockDirEntry([]);
        assert.deepEqual(await namesRead(dirEntry), []);
    });

    it("rejects with the browser's error if the folder cannot be read", async function () {
        const error = new Error('NotAllowedError');
        const dirEntry = mockDirEntry(['wikipedia_en.zim'], { readEntriesError: error });
        await assert.rejects(readDroppedDirectory(dirEntry), error);
    });

    it("rejects with the browser's error if one of the files cannot be read", async function () {
        const error = new Error('NotFoundError');
        const dirEntry = mockDirEntry(['wikipedia_en.zim'], { fileError: error });
        await assert.rejects(readDroppedDirectory(dirEntry), error);
    });
});
