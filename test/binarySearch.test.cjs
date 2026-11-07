#!/usr/bin/env node
/**
 * Checks util.binarySearch in www/js/lib/util.js (#1042).
 *
 * Validates that binarySearch returns a Promise when end <= begin, resolving to
 * null, or to begin when lowerBound is true.
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

// eslint-disable-next-line no-eval
const binarySearch = eval('(function (document, params, appstate, window) {\n' + utilSource +
    '\nreturn binarySearch;\n})')({}, {}, {}, {});

describe('binarySearch (#1042)', function () {
    it('returns a Promise resolving to null or begin when end <= begin (#1042)', function () {
        const query = function () { return Promise.resolve(0); };
        return Promise.all([
            binarySearch(0, 0, query).then(function (r) { assert.equal(r, null); }),
            binarySearch(7, 7, query, true).then(function (r) { assert.equal(r, 7); }),
            binarySearch(10, 4, query, true).then(function (r) { assert.equal(r, 10); })
        ]);
    });
});
