#!/usr/bin/env node
/**
 * Checks util.dataURItoUint8Array in www/js/lib/util.js (#1010).
 *
 * Validates that dataURItoUint8Array:
 * - Safely returns an empty Uint8Array on empty, malformed, or non-string inputs.
 * - Accurately converts base64 data URIs to Uint8Array.
 * - Correctly decodes percent-encoded octets directly to byte values (such as %C3%A9, %C3%A9%FF, and %2C).
 * - Does not throw on malformed percent sequences.
 *
 * Usage: npm test
 */

'use strict';

const path = require('path');
const assert = require('node:assert/strict');
const { describe, it } = require('node:test');
const { loadModuleSource, createMockDocument } = require('./helpers.cjs');

const UTIL_JS = path.join(__dirname, '..', 'www', 'js', 'lib', 'util.js');
const utilSource = loadModuleSource(UTIL_JS);

// eslint-disable-next-line no-eval
const util = eval('(function (document) {\n' +
    'const params = {};\n' +
    'const appstate = {};\n' +
    utilSource + '\n' +
    'return {\n' +
    '    dataURItoUint8Array: dataURItoUint8Array\n' +
    '};\n' +
'})')(createMockDocument());

describe('dataURItoUint8Array (#1010)', function () {
    it('converts base64 data URIs to Uint8Array', function () {
        const b64DataURI = 'data:text/plain;base64,SGVsbG8sIHdvcmxkIQ==';
        const b64Arr = util.dataURItoUint8Array(b64DataURI);
        assert.ok(b64Arr instanceof Uint8Array);
        const b64Str = String.fromCharCode.apply(null, b64Arr);
        assert.equal(b64Str, 'Hello, world!');
    });

    it('decodes percent-encoded data URIs with reserved delimiters (%2C, %20)', function () {
        const percentDataURI = 'data:text/plain,hello%2C%20world';
        const percentArr = util.dataURItoUint8Array(percentDataURI);
        assert.ok(percentArr instanceof Uint8Array);
        const percentStr = String.fromCharCode.apply(null, percentArr);
        assert.equal(percentStr, 'hello, world');
        assert.equal(percentArr.length, 12);
    });

    it('decodes percent escapes directly to raw bytes without UTF-8 character conversion', function () {
        const octetURI1 = 'data:application/octet-stream,%C3%A9';
        const octetArr1 = util.dataURItoUint8Array(octetURI1);
        assert.deepEqual(Array.from(octetArr1), [195, 169]);

        const octetURI2 = 'data:application/octet-stream,%C3%A9%FF';
        const octetArr2 = util.dataURItoUint8Array(octetURI2);
        assert.deepEqual(Array.from(octetArr2), [195, 169, 255]);
    });

    it('safely handles empty, invalid, or non-string inputs without throwing', function () {
        assert.ok(util.dataURItoUint8Array('') instanceof Uint8Array);
        assert.equal(util.dataURItoUint8Array('').length, 0);
        assert.equal(util.dataURItoUint8Array('not-a-data-uri').length, 0);
        assert.equal(util.dataURItoUint8Array(null).length, 0);
        assert.equal(util.dataURItoUint8Array(undefined).length, 0);
        assert.equal(util.dataURItoUint8Array(12345).length, 0);
        assert.equal(util.dataURItoUint8Array({}).length, 0);
    });

    it('handles malformed percent encoding without throwing', function () {
        assert.doesNotThrow(() => util.dataURItoUint8Array('data:text/plain,%E0%A4'));
        const arr = util.dataURItoUint8Array('data:text/plain,%E0%A4');
        assert.ok(arr instanceof Uint8Array);
    });
});
