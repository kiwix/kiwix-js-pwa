#!/usr/bin/env node
/**
 * Checks the decision to divert a ZIM entry away from the sandboxed article iframe and into a new
 * top-level window, in www/js/lib/uiUtil.js (#980).
 *
 * In pureMode the Service Worker is a transparent passthrough, so readArticle would hand the entry to
 * the iframe whatever its mimetype. Chromium will not instantiate its PDF viewer in a sandboxed nested
 * frame, so a PDF left the app stuck on the browser's block page. These checks pin down exactly which
 * entries are diverted, because each exclusion guards a path that is easy to break by accident: a
 * redirect has no usable mimetype at this point, and legacy EdgeHTML UWP mirrors an exclusion carried
 * by the equivalent PDF branch in filterClickEvent.
 *
 * Usage: npm test
 */

'use strict';
/* eslint-disable no-unused-vars */

const path = require('path');
const assert = require('node:assert/strict');
const { describe, it } = require('node:test');
const { loadModuleSource, createMockDocument } = require('./helpers.cjs');

const UI_UTIL_JS = path.join(__dirname, '..', 'www', 'js', 'lib', 'uiUtil.js');
const uiUtilSource = loadModuleSource(UI_UTIL_JS);

/**
 * Builds a sandbox holding the real uiUtil source, with the globals the function under test reads.
 *
 * @param {Object} [options] pureMode, target and appType override the defaults
 * @returns {Object} The sandbox, exposing entryRequiresNewContainer
 */
function createMockEnvironment (options) {
    options = options || {};

    const mockParams = {
        appType: 'appType' in options ? options.appType : 'PWA'
    };

    const mockAppstate = {
        pureMode: 'pureMode' in options ? options.pureMode : true,
        target: 'target' in options ? options.target : 'iframe'
    };

    const mockDocument = createMockDocument();

    /* eslint-disable no-eval */
    return eval(`(function () {
        var document = mockDocument;
        var params = mockParams;
        var appstate = mockAppstate;
        var window = { innerHeight: 800 };
        function getComputedStyle () { return { height: '0px', marginTop: '0px', marginBottom: '0px' }; }
        ${uiUtilSource}
        return { entryRequiresNewContainer: entryRequiresNewContainer };
    })()`);
    /* eslint-enable no-eval */
}

/**
 * A stand-in for a DirEntry, which the function under test only ever asks whether it is a redirect.
 *
 * @param {Boolean} [isRedirect] Whether this entry is a redirect
 * @returns {Object} The mock dirEntry
 */
function mockDirEntry (isRedirect) {
    return {
        isRedirect: function () {
            return !!isRedirect;
        }
    };
}

describe('Entries diverted out of the sandboxed iframe in pureMode (#980)', function () {
    // The reported case: Chromium refuses to render this one in a sandboxed nested frame
    it('diverts a PDF', function () {
        const sandbox = createMockEnvironment();
        assert.equal(sandbox.entryRequiresNewContainer(mockDirEntry(), 'application/pdf'), true);
    });

    // The diversion is deliberately not PDF-only: it matches what the non-pureMode path already does,
    // and covers any other type a browser may decline to render in a sandboxed frame
    const otherNonHtmlTypes = [
        'application/epub+zip',
        'image/jpeg',
        'video/mp4',
        'application/octet-stream',
        'text/plain'
    ];
    otherNonHtmlTypes.forEach(function (mimeType) {
        it('diverts ' + mimeType, function () {
            const sandbox = createMockEnvironment();
            assert.equal(sandbox.entryRequiresNewContainer(mockDirEntry(), mimeType), true);
        });
    });
});

describe('Entries left in the iframe in pureMode (#980)', function () {
    // HTML is what the iframe is for. The charset case matters because real ZIM mimetypes carry one,
    // and the xhtml case because the word-boundary test has to accept the 'x' prefix
    const htmlTypes = [
        'text/html',
        'text/html; charset=utf-8',
        'application/xhtml+xml'
    ];
    htmlTypes.forEach(function (mimeType) {
        it('leaves ' + mimeType + ' in the iframe', function () {
            const sandbox = createMockEnvironment();
            assert.equal(sandbox.entryRequiresNewContainer(mockDirEntry(), mimeType), false);
        });
    });

    // A redirect's mimetype field holds its target, not a type, so getMimetype() gives nothing usable.
    // Without this guard every redirect would test as non-HTML and open in a window of its own
    it('leaves a redirect in the iframe, even when its mimetype reads as non-HTML', function () {
        const sandbox = createMockEnvironment();
        assert.equal(sandbox.entryRequiresNewContainer(mockDirEntry(true), 'application/pdf'), false);
    });

    // getMimetype() returns undefined when the type is not in the ZIM's mimetype list. Note that
    // /\bx?html\b/i.test(undefined) tests the string 'undefined', which reads as non-HTML, so an
    // explicit check is the only thing keeping these out of a new window
    const missingTypes = [undefined, null, ''];
    missingTypes.forEach(function (mimeType) {
        it('leaves an entry with a mimetype of ' + JSON.stringify(mimeType) + ' in the iframe', function () {
            const sandbox = createMockEnvironment();
            assert.equal(sandbox.entryRequiresNewContainer(mockDirEntry(), mimeType), false);
        });
    });
});

describe('Contexts in which no entry is diverted (#980)', function () {
    // Outside pureMode the content is transformed and non-HTML is already routed elsewhere in readArticle.
    // Replay-backed Zimit archives are covered by this too, as they never set pureMode
    it('does not divert when pureMode is off', function () {
        const sandbox = createMockEnvironment({ pureMode: false });
        assert.equal(sandbox.entryRequiresNewContainer(mockDirEntry(), 'application/pdf'), false);
    });

    // The output is already going to a top-level window, which has no nested-frame restriction
    it('does not divert when the target is already a window', function () {
        const sandbox = createMockEnvironment({ target: 'window' });
        assert.equal(sandbox.entryRequiresNewContainer(mockDirEntry(), 'application/pdf'), false);
    });

    // historyPop assigns appstate.target from a window's kiwixType property, which can be undefined.
    // Diverting is the safe reading of an unknown target, since it never wedges the iframe
    it('diverts when the target is unknown, rather than assuming a window', function () {
        const sandbox = createMockEnvironment({ target: undefined });
        assert.equal(sandbox.entryRequiresNewContainer(mockDirEntry(), 'application/pdf'), true);
    });

    // Mirrors the exclusion the filterClickEvent PDF branch has always carried
    it('does not divert in the legacy EdgeHTML UWP app', function () {
        const sandbox = createMockEnvironment({ appType: 'UWP' });
        assert.equal(sandbox.entryRequiresNewContainer(mockDirEntry(), 'application/pdf'), false);
    });

    // The appType string is matched, not compared, so a compound type must still be excluded
    it('does not divert when UWP appears in a compound appType', function () {
        const sandbox = createMockEnvironment({ appType: 'UWP|PWA' });
        assert.equal(sandbox.entryRequiresNewContainer(mockDirEntry(), 'application/pdf'), false);
    });
});
