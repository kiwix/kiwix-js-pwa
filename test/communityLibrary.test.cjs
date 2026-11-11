#!/usr/bin/env node
/**
 * Checks how the in-app library recognizes the community library, in www/js/lib/kiwixServe.js.
 *
 * Archives in the community library are uploaded by third parties, so the app warns about them and records the ones
 * the user downloads, in order to go on treating them as untrusted when they are opened. Both depend on recognizing
 * a community URL (the catalogue itself, and a download from any mirror) and on matching a recorded filename exactly.
 *
 * Usage: npm test
 */

'use strict';
/* eslint-disable no-unused-vars */

const path = require('path');
const assert = require('node:assert/strict');
const { describe, it } = require('node:test');
const { loadModuleSource, createMockDocument } = require('./helpers.cjs');

const KIWIX_SERVE_JS = path.join(__dirname, '..', 'www', 'js', 'lib', 'kiwixServe.js');
const kiwixServeSource = loadModuleSource(KIWIX_SERVE_JS);

/**
 * Builds a sandbox holding the real kiwixServe source, with a Settings Store that keeps its items in memory
 *
 * @param {Object} options The values of params.packagedFile and params.showCommunityLibrary
 * @returns {Object} The sandbox, exposing the functions under test
 */
function createMockEnvironment (options) {
    options = options || {};
    const store = {};
    const mockParams = {
        appType: 'PWA',
        packagedFile: options.packagedFile || '',
        showCommunityLibrary: !!options.showCommunityLibrary,
        kiwixLibraryBrowser: 'https://browse.library.kiwix.org',
        kiwixCommunityLibraryBrowser: 'https://browse.community.library.kiwix.org'
    };
    const mockDocument = createMockDocument();

    /* eslint-disable no-eval */
    return eval(`(function () {
        var document = mockDocument;
        var params = mockParams;
        var window = {};
        var cache = {};
        var uiUtil = {};
        var settingsStore = {
            getItem: function (key) { return key in store ? store[key] : null; },
            setItem: function (key, value) { store[key] = String(value); }
        };
        var torrentClient = { isAvailable: function () { return false; } };
        ${kiwixServeSource}
        return {
            isCommunityLibraryShown: isCommunityLibraryShown,
            isCommunityUrl: isCommunityUrl,
            recordCommunityArchive: recordCommunityArchive,
            isCommunityArchive: isCommunityArchive,
            getPreviewUrl: getPreviewUrl
        };
    })()`);
    /* eslint-enable no-eval */
}

describe('isCommunityLibraryShown', function () {
    it('is off unless the user has turned it on', function () {
        assert.equal(createMockEnvironment().isCommunityLibraryShown(), false);
        assert.equal(createMockEnvironment({ showCommunityLibrary: true }).isCommunityLibraryShown(), true);
    });

    it('is never on in a packaged app with a scoped library', function () {
        const env = createMockEnvironment({ showCommunityLibrary: true, packagedFile: 'mdwiki_en_all_maxi_2025-11.zim' });
        assert.equal(env.isCommunityLibraryShown(), false);
    });
});

describe('isCommunityUrl', function () {
    const env = createMockEnvironment();

    it('recognizes the community catalogue and its downloads from any mirror', function () {
        [
            'https://opds.community.library.kiwix.org/catalog/v2/entries?count=-1',
            'https://lb.download.kiwix.org/zim/community/nethackwiki_en_all_2026-10.zim.meta4',
            'https://ftp.fau.de/kiwix/zim/community/nethackwiki_en_all_2026-10.zim',
            'https://lb.download.kiwix.org/zim/community/nethackwiki_en_all_2026-10.zim.torrent'
        ].forEach(function (url) {
            assert.equal(env.isCommunityUrl(url), true, url);
        });
    });

    it('does not recognize the main catalogue, its downloads, or lookalikes', function () {
        [
            '',
            'https://opds.library.kiwix.org/catalog/v2/entries?count=-1',
            'https://lb.download.kiwix.org/zim/wikipedia/wikipedia_en_all_maxi_2026-10.zim.meta4',
            'https://lb.download.kiwix.org/zim/other/community_en_all_2026-10.zim.meta4',
            'https://opds.library.kiwix.org/catalog/v2/entries?q=/zim/community/',
            'https://community.library.kiwix.org.example.com/catalog/v2/entries'
        ].forEach(function (url) {
            assert.equal(env.isCommunityUrl(url), false, url);
        });
    });
});

describe('the record of community downloads', function () {
    it('records the archive named by a descriptor URL, once, and matches it exactly', function () {
        const env = createMockEnvironment();
        assert.equal(env.isCommunityArchive('nethackwiki_en_all_2026-10.zim'), false);
        env.recordCommunityArchive('https://lb.download.kiwix.org/zim/community/nethackwiki_en_all_2026-10.zim.meta4');
        env.recordCommunityArchive('https://lb.download.kiwix.org/zim/community/nethackwiki_en_all_2026-10.zim.torrent');
        env.recordCommunityArchive('https://lb.download.kiwix.org/zim/community/hitchwiki.org_en_all_2026-09a.zim');
        assert.equal(env.isCommunityArchive('nethackwiki_en_all_2026-10.zim'), true);
        assert.equal(env.isCommunityArchive('hitchwiki.org_en_all_2026-09a.zim'), true);
        // Unlike the list of trusted archives, part of a recorded name must not match
        assert.equal(env.isCommunityArchive('wiki_en_all_2026-10.zim'), false);
        assert.equal(env.isCommunityArchive(''), false);
    });
});

describe('getPreviewUrl', function () {
    const env = createMockEnvironment();

    it('previews a community archive on the community browse host', function () {
        assert.equal(env.getPreviewUrl('https://lb.download.kiwix.org/zim/community/nethackwiki_en_all_2026-10.zim.meta4'),
            'https://browse.community.library.kiwix.org/content/nethackwiki_en_all_2026-10');
    });

    it('previews any other archive on the main browse host', function () {
        assert.equal(env.getPreviewUrl('https://lb.download.kiwix.org/zim/wikipedia/wikipedia_en_100_2026-10.zim.meta4'),
            'https://browse.library.kiwix.org/content/wikipedia_en_100_2026-10');
    });
});
