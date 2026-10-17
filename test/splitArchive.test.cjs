#!/usr/bin/env node
/**
 * Checks that the parts of a split ZIM archive are matched by literal name comparison (#983).
 *
 * The three places in www/js/app.js that gather the parts of a split archive (the UWP branch of the archive
 * loader, processDirectoryOfFiles() and readNodeDirectoryAndCreateNodeFileObjects()) used to build a RegExp from
 * the picked file name. A name with a character that is special in a regular expression made that throw
 * (c++_en.zimaa) or never match (notes (1).zimaa), the "." was a wildcard, and the pattern was not anchored,
 * so an unrelated file that merely ended with the same text was also picked up. They now all use
 * util.isPartOfArchive().
 *
 * Usage: npm test
 */

'use strict';

const path = require('path');
const assert = require('node:assert/strict');
const { describe, it } = require('node:test');
const { loadModuleSource } = require('./helpers.cjs');

const UTIL_JS = path.join(__dirname, '..', 'www', 'js', 'lib', 'util.js');
const utilSource = loadModuleSource(UTIL_JS);

// util.js only needs these globals at load time, so bare stubs will do
// eslint-disable-next-line no-eval
const isPartOfArchive = eval('(function (document, params, appstate, window) {\n' + utilSource +
    '\nreturn isPartOfArchive;\n})')({}, {}, {}, {});

/**
 * Returns the names in `folder` that belong to the archive that was picked, as app.js does
 *
 * @param {String} picked The name of the picked file
 * @param {String[]} folder The names of the files in the folder
 * @returns {String[]} The names of the parts
 */
function partsOf (picked, folder) {
    return folder.filter(function (name) { return isPartOfArchive(picked, name); });
}

describe('isPartOfArchive (#983)', function () {
    it('gathers all the parts of a split archive, in folder order', function () {
        const folder = ['wikipedia_en.zimaa', 'wikipedia_en.zimab', 'wikipedia_en.zimac'];
        assert.deepEqual(partsOf('wikipedia_en.zimaa', folder), folder);
    });

    it('does not throw, and finds every part, when the name has a "+"', function () {
        const folder = ['c++_en.zimaa', 'c++_en.zimab'];
        assert.deepEqual(partsOf('c++_en.zimaa', folder), folder);
    });

    it('finds the parts of a name with parentheses, as added by a browser to a duplicate download', function () {
        const folder = ['notes (1).zimaa', 'notes (1).zimab', 'notes 1.zimab'];
        assert.deepEqual(partsOf('notes (1).zimaa', folder), ['notes (1).zimaa', 'notes (1).zimab']);
    });

    it('finds the parts of a name with square brackets', function () {
        const folder = ['wiki[1].zimaa', 'wiki[1].zimab', 'wiki1.zimab'];
        assert.deepEqual(partsOf('wiki[1].zimaa', folder), ['wiki[1].zimaa', 'wiki[1].zimab']);
    });

    it('finds the parts of a name with other regular expression characters', function () {
        const folder = ['a$b^c{2}|d\\e.zimaa', 'a$b^c{2}|d\\e.zimab'];
        assert.deepEqual(partsOf('a$b^c{2}|d\\e.zimaa', folder), folder);
    });

    it('treats a "." in the name as a literal dot, not as a wildcard', function () {
        const folder = ['my.zim_en.zimaa', 'my.zim_en.zimab', 'myXzim_en.zimab', 'my_zim_en.zimab'];
        assert.deepEqual(partsOf('my.zim_en.zimaa', folder), ['my.zim_en.zimaa', 'my.zim_en.zimab']);
    });

    it('does not pick up a file whose name merely ends with the same text', function () {
        const folder = ['wikipedia_en.zimaa', 'wikipedia_en.zimab', 'old_wikipedia_en.zimab', 'xwikipedia_en.zimaa'];
        assert.deepEqual(partsOf('wikipedia_en.zimaa', folder), ['wikipedia_en.zimaa', 'wikipedia_en.zimab']);
    });

    it('does not pick up parts of a different archive, or of the same name with an unfinished suffix', function () {
        const folder = ['wikipedia_en.zimaa', 'wikipedia_fr.zimab', 'wikipedia_en.zim', 'wikipedia_en.zima',
            'wikipedia_en.zimabc'];
        assert.deepEqual(partsOf('wikipedia_en.zimaa', folder), ['wikipedia_en.zimaa']);
    });

    it('accepts a part picked in any position, not just the first', function () {
        const folder = ['wikipedia_en.zimaa', 'wikipedia_en.zimab'];
        assert.deepEqual(partsOf('wikipedia_en.zimab', folder), folder);
    });

    it('matches the .zim extension of the picked file in any case, as the split check always did', function () {
        const folder = ['WIKI.ZIMAA', 'WIKI.ZIMAB', 'WIKI.zimab'];
        assert.deepEqual(partsOf('WIKI.ZIMAA', folder), ['WIKI.ZIMAA', 'WIKI.ZIMAB']);
    });

    it('matches only the picked file itself when it is not split', function () {
        const folder = ['wikipedia_en.zim', 'wikipedia_en.zim.bak', 'old_wikipedia_en.zim', 'wikipedia_en.zimaa',
            'wikipediaXen.zim'];
        assert.deepEqual(partsOf('wikipedia_en.zim', folder), ['wikipedia_en.zim']);
    });

    it('matches a single file whose name has regular expression characters', function () {
        assert.equal(isPartOfArchive('c++_en.zim', 'c++_en.zim'), true);
        assert.equal(isPartOfArchive('c++_en.zim', 'cc_en.zim'), false);
        assert.equal(isPartOfArchive('notes (1).zim', 'notes (1).zim'), true);
    });
});
