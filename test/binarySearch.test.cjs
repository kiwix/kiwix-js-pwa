#!/usr/bin/env node
/**
 * Checks util.binarySearch in www/js/lib/util.js (#1042).
 *
 * Validates that binarySearch:
 * - Always returns a Promise, even when end <= begin on initial call.
 * - Resolves to null when end <= begin and lowerBound is false.
 * - Resolves to begin when end <= begin and lowerBound is true.
 * - Correctly finds matching indices when decision is 0.
 * - Correctly locates lower-bound insertion indices when item is absent.
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
    it('always returns a Promise, even when end <= begin (#1042)', function () {
        const p1 = binarySearch(0, 0, function () { return Promise.resolve(0); });
        assert.ok(p1 && typeof p1.then === 'function', 'binarySearch must return a Promise when lowerBound is falsy');

        const p2 = binarySearch(0, 0, function () { return Promise.resolve(0); }, true);
        assert.ok(p2 && typeof p2.then === 'function', 'binarySearch must return a Promise when lowerBound is true');

        const p3 = binarySearch(5, 2, function () { return Promise.resolve(0); }, true);
        assert.ok(p3 && typeof p3.then === 'function', 'binarySearch must return a Promise when end < begin');
    });

    it('resolves to null when end <= begin without lowerBound', async function () {
        const res1 = await binarySearch(0, 0, function () { return Promise.resolve(0); });
        assert.equal(res1, null);

        const res2 = await binarySearch(5, 3, function () { return Promise.resolve(0); });
        assert.equal(res2, null);
    });

    it('resolves to begin when end <= begin with lowerBound', async function () {
        const res1 = await binarySearch(0, 0, function () { return Promise.resolve(0); }, true);
        assert.equal(res1, 0);

        const res2 = await binarySearch(7, 7, function () { return Promise.resolve(0); }, true);
        assert.equal(res2, 7);

        const res3 = await binarySearch(10, 4, function () { return Promise.resolve(0); }, true);
        assert.equal(res3, 10);
    });

    it('finds items across an array using binary search', async function () {
        const items = ['apple', 'banana', 'cherry', 'date', 'fig', 'grape'];

        function searchFor (target, lowerBound) {
            return binarySearch(0, items.length, function (mid) {
                if (target < items[mid]) return Promise.resolve(-1);
                if (target > items[mid]) return Promise.resolve(1);
                return Promise.resolve(0);
            }, lowerBound);
        }

        for (let i = 0; i < items.length; i++) {
            const foundIndex = await searchFor(items[i]);
            assert.equal(foundIndex, i, 'Found exact match for ' + items[i]);
        }

        const notFound = await searchFor('blueberry');
        assert.equal(notFound, null);

        const insertionIndex = await searchFor('blueberry', true);
        assert.equal(insertionIndex, 2); // between 'banana' and 'cherry'

        const insertAtStart = await searchFor('aardvark', true);
        assert.equal(insertAtStart, 0);

        const insertAtEnd = await searchFor('zebra', true);
        assert.equal(insertAtEnd, items.length);
    });
});
