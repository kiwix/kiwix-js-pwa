#!/usr/bin/env node
/**
 * Checks DirEntry.prototype.toStringId / DirEntry.fromStringId in www/js/lib/zimDirEntry.js (#966).
 *
 * toStringId() joins several DirEntry fields with "|" so the id can be stored as a single HTML
 * attribute (app.js wraps the result in encodeURIComponent() before writing it to the DOM, and
 * reverses that with decodeURIComponent() before calling fromStringId()). Because that outer pair
 * also encodes/decodes any literal "|" inside the id, it does not stop a "|" inside url or title
 * from being mistaken for the field separator when fromStringId() splits on "|" again.
 *
 * "|" in titles is common in real archives, e.g. inline LaTeX in Stack Exchange sites such as
 * hsm.stackexchange.com, or "<Page title> | <Site name>" titles produced by Zimit (e.g.
 * tonedear.com). The url is serialized before the title, so navigation still works; the visible
 * symptom is a title truncated at the first "|". The entries below mirror real ones from those
 * two archives, and the same tests run upstream in kiwix-js (kiwix/kiwix-js#1492).
 *
 * Usage: npm test
 */

'use strict';

const path = require('path');
const assert = require('node:assert/strict');
const { describe, it, mock } = require('node:test');
const { loadModuleSource } = require('./helpers.cjs');

const ZIM_DIRENTRY_JS = path.join(__dirname, '..', 'www', 'js', 'lib', 'zimDirEntry.js');
const zimDirEntrySource = loadModuleSource(ZIM_DIRENTRY_JS);

// eslint-disable-next-line no-eval
const DirEntry = eval('(function () {\n' + zimDirEntrySource + '\nreturn DirEntry;\n})()');

const fakeZimFile = {
    mimeTypes: new Map([[0, 'text/html'], [1, 'text/plain']])
};

// Simulates the app.js round trip: toStringId() -> encodeURIComponent() (stored in the DOM) ->
// decodeURIComponent() -> fromStringId()
function roundTripViaAppJsPipeline (entryData) {
    const original = new DirEntry(fakeZimFile, entryData);
    const storedInDom = encodeURIComponent(original.toStringId());
    return DirEntry.fromStringId(fakeZimFile, decodeURIComponent(storedInDom));
}

describe('DirEntry stringId round trip (real-world "|" titles)', function () {
    it('preserves a title with LaTeX absolute-value bars (hsm.stackexchange.com)', function () {
        const reconstructed = roundTripViaAppJsPipeline({
            offset: 12345,
            mimetypeInteger: 0,
            namespace: 'C',
            cluster: 10,
            blob: 2,
            url: 'questions/4956/did-bolzano-conclude-that-mathbb-r-ne-mathbb-n',
            title: 'Did Bolzano conclude that $| \\mathbb R | \\ne | \\mathbb N|$?',
            redirect: false,
            redirectTarget: undefined
        });

        assert.equal(reconstructed.url, 'questions/4956/did-bolzano-conclude-that-mathbb-r-ne-mathbb-n');
        assert.equal(reconstructed.title, 'Did Bolzano conclude that $| \\mathbb R | \\ne | \\mathbb N|$?');
    });

    it('preserves a "Page | Site" title produced by Zimit (tonedear.com)', function () {
        const reconstructed = roundTripViaAppJsPipeline({
            offset: 999,
            mimetypeInteger: 0,
            namespace: 'C',
            cluster: 1,
            blob: 0,
            url: 'tonedear.com/contact',
            title: 'Contact | Ear Training',
            redirect: false,
            redirectTarget: undefined
        });

        assert.equal(reconstructed.url, 'tonedear.com/contact');
        assert.equal(reconstructed.title, 'Contact | Ear Training');
    });

    it('preserves multiple pipes in both url and title, and a redirect target', function () {
        const reconstructed = roundTripViaAppJsPipeline({
            offset: 5678,
            mimetypeInteger: 1,
            namespace: 'A',
            cluster: 100,
            blob: 3,
            url: 'regex|pattern|match',
            title: 'Title | with | multiple | pipes',
            redirect: true,
            redirectTarget: 42
        });

        assert.equal(reconstructed.url, 'regex|pattern|match');
        assert.equal(reconstructed.title, 'Title | with | multiple | pipes');
        assert.equal(reconstructed.redirect, true);
        assert.equal(reconstructed.isRedirect(), true);
        assert.equal(reconstructed.redirectTarget, '42');
    });

    it('falls back to the url via getTitleOrUrl() when title is empty', function () {
        const reconstructed = roundTripViaAppJsPipeline({
            offset: 1,
            mimetypeInteger: 0,
            namespace: 'C',
            cluster: 0,
            blob: 0,
            url: 'Main_Page',
            title: '',
            redirect: false,
            redirectTarget: undefined
        });

        assert.equal(reconstructed.getTitleOrUrl(), 'Main_Page');
    });

    it('does not throw on a malformed percent-encoded sequence and falls back to the raw text', function () {
        const warn = mock.method(console, 'warn', function () {});
        try {
            const malformedStringId = '100|0|C|10|1|%ZZmalformed|plain title|false|undefined';
            let parsed;
            assert.doesNotThrow(function () { parsed = DirEntry.fromStringId(fakeZimFile, malformedStringId); });
            assert.equal(parsed.url, '%ZZmalformed');
            assert.equal(warn.mock.callCount(), 1);
        } finally {
            warn.mock.restore();
        }
    });
});
