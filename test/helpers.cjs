'use strict';

/**
 * Shared scaffolding for the test/*.test.cjs suites.
 *
 * The app's modules import each other and touch `document`/`localStorage` at load time, so they
 * can't be required directly in Node. Each suite instead reads the real source, strips the ES
 * module import/export lines, and evaluates what's left inside a sandbox of mocked globals - that
 * way the checks run against the actual code rather than a copy that can drift from it.
 *
 * This file only holds the parts of that scaffolding that are identical across suites. The mocks
 * that give each test its meaning (what a mocked function returns, how many times it was called,
 * etc.) stay in the individual test files.
 *
 * Requires Node 20+ to run (Node 21+ on Windows, since `npm test` passes `node --test` a glob that
 * only Node itself expands from Node 21 onwards - see CONTRIBUTING.md).
 */

const fs = require('fs');

/**
 * Strips ES module import/export lines from `source` so it can be evaluated in a CommonJS sandbox.
 *
 * @param {String} source The raw module source
 * @returns {String} The source with import/export-default lines removed
 */
function stripModuleSyntax (source) {
    return source
        .replace(/^\s*import\s+.*?;\s*$/gm, '')
        .replace(/^\s*export\s+default\s+[\s\S]*?;\s*$/gm, '');
}

/**
 * Reads `filePath` and strips its ES module import/export lines.
 *
 * @param {String} filePath Absolute path to the module source
 * @returns {String} The module source, ready to be evaluated in a sandbox
 */
function loadModuleSource (filePath) {
    return stripModuleSyntax(fs.readFileSync(filePath, 'utf8'));
}

/**
 * Returns a minimal mock `document`, with the stubs that are the same in every suite that needs
 * one. Pass `overrides` to add or replace properties for the behaviour a particular test cares
 * about (e.g. a custom `exitFullscreen`, or an `elements` map for `getElementById` to look up).
 *
 * @param {Object} [overrides] Properties to merge over the defaults
 * @returns {Object} A mock document object
 */
function createMockDocument (overrides) {
    return Object.assign({
        getElementById: function () {
            return { style: {}, offsetHeight: 0, classList: { toggle: function () {} } };
        },
        querySelector: function () {
            return null;
        },
        querySelectorAll: function () {
            return [];
        },
        createElement: function () {
            return { style: {}, setAttribute: function () {}, appendChild: function () {} };
        }
    }, overrides || {});
}

module.exports = { stripModuleSyntax, loadModuleSource, createMockDocument };
