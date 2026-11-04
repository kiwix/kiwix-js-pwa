#!/usr/bin/env node
/**
 * Checks util.escapeHtml in www/js/lib/util.js, and uiUtil.isFileAccessError and uiUtil.fileAccessErrorMessage in
 * www/js/lib/uiUtil.js, which build the text shown in alert dialogs.
 *
 * Mirrors the equivalent checks in kiwix-js (tests/unit/spec/mocha.test.js).
 *
 * Usage: npm test
 */

'use strict';
/* eslint-disable no-unused-vars */

const path = require('path');
const assert = require('node:assert/strict');
const { describe, it } = require('node:test');
const { loadModuleSource, createMockDocument } = require('./helpers.cjs');

const UTIL_JS = path.join(__dirname, '..', 'www', 'js', 'lib', 'util.js');
const UI_UTIL_JS = path.join(__dirname, '..', 'www', 'js', 'lib', 'uiUtil.js');
const utilSource = loadModuleSource(UTIL_JS);
const uiUtilSource = loadModuleSource(UI_UTIL_JS);

/* eslint-disable no-eval */
const util = eval(`(function (document) {
    const params = {};
    const appstate = {};
    ${utilSource}
    return { escapeHtml: escapeHtml };
})`)(createMockDocument());

const uiUtil = (function (mockUtil, mockDocument) {
    return eval(`(function () {
        var util = mockUtil;
        var document = mockDocument;
        var params = { appType: 'PWA' };
        var appstate = {};
        var window = { innerHeight: 800 };
        function getComputedStyle () { return { height: '0px', marginTop: '0px', marginBottom: '0px' }; }
        ${uiUtilSource}
        return { isFileAccessError: isFileAccessError, fileAccessErrorMessage: fileAccessErrorMessage };
    })()`);
})(util, createMockDocument());
/* eslint-enable no-eval */

describe('escapeHtml', function () {
    it('escapes HTML-significant characters and handles empty input', function () {
        assert.equal(util.escapeHtml('Tom & Jerry <b>"quoted"</b> l\'amore'), 'Tom &amp; Jerry &lt;b&gt;&quot;quoted&quot;&lt;/b&gt; l&#39;amore');
        // An existing entity must be escaped once only, so it is displayed literally rather than garbled
        assert.equal(util.escapeHtml('&lt;'), '&amp;lt;');
        assert.equal(util.escapeHtml('A/Paris.html'), 'A/Paris.html');
        assert.equal(util.escapeHtml(404), '404');
        assert.equal(util.escapeHtml(null), '');
        assert.equal(util.escapeHtml(undefined), '');
    });
});

describe('isFileAccessError and fileAccessErrorMessage', function () {
    it('distinguishes file-access errors from other errors', function () {
        const accessErrors = [
            new DOMException('A requested file or directory could not be found', 'NotFoundError'),
            new DOMException('The requested file could not be read', 'NotReadableError'),
            new DOMException('The request is not allowed', 'NoModificationAllowedError'),
            Object.assign(new Error('no such file or directory'), { code: 'ENOENT' }),
            Object.assign(new Error('permission denied'), { code: 'EACCES' }),
            Object.assign(new Error('operation not permitted'), { code: 'EPERM' })
        ];
        accessErrors.forEach(function (err) {
            assert.equal(uiUtil.isFileAccessError(err), true, err.name + ' ' + (err.code || ''));
        });
        [new Error('Unexpected end of data'), new RangeError('Offset is outside the bounds of the DataView'),
            new DOMException('Aborted', 'AbortError'), 'some error', null, undefined].forEach(function (err) {
            assert.equal(uiUtil.isFileAccessError(err), false, String(err));
        });
    });

    it('points an OS denial of access to permissions, and asks for a missing file to be picked again', function () {
        const denied = uiUtil.fileAccessErrorMessage(new DOMException('The requested file could not be read', 'NotReadableError'));
        assert.match(denied, /refused access/);
        assert.doesNotMatch(denied, /could not find your archive/);
        const missing = uiUtil.fileAccessErrorMessage(new DOMException('A requested file or directory could not be found', 'NotFoundError'));
        assert.match(missing, /could not find your archive/);
        assert.doesNotMatch(missing, /refused access/);
    });

    it('includes the system error text, which may contain a file path, escaped', function () {
        const withPath = uiUtil.fileAccessErrorMessage(Object.assign(new Error("ENOENT: no such file, open 'C:\\Archives & <ZIMs>\\wiki.zim'"), { code: 'ENOENT' }));
        assert.ok(withPath.includes('C:\\Archives &amp; &lt;ZIMs&gt;\\wiki.zim'));
        assert.ok(!withPath.includes('<ZIMs>'));
    });
});
