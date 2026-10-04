#!/usr/bin/env node
/**
 * Checks which keydown events count as Back/Forward shortcuts, in www/js/lib/uiUtil.js (#1003).
 *
 * In Restricted mode the article iframe cannot traverse the top-level history, so app.js clicks the
 * in-app Back and Forward buttons instead. This function decides when that happens.
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
 * Builds a sandbox holding the real uiUtil source.
 *
 * @returns {Object} The sandbox, exposing getHistoryNavigationDirection
 */
function createMockEnvironment () {
    const mockDocument = createMockDocument();

    /* eslint-disable no-eval */
    return eval(`(function () {
        var document = mockDocument;
        var params = {};
        var appstate = {};
        var window = { innerHeight: 800 };
        ${uiUtilSource}
        return { getHistoryNavigationDirection: getHistoryNavigationDirection };
    })()`);
    /* eslint-enable no-eval */
}

const sandbox = createMockEnvironment();

describe('Back/Forward keyboard shortcuts (#1003)', function () {
    it('treats Alt+Left as Back and Alt+Right as Forward', function () {
        assert.equal(sandbox.getHistoryNavigationDirection({ key: 'ArrowLeft', altKey: true }), -1);
        assert.equal(sandbox.getHistoryNavigationDirection({ key: 'ArrowRight', altKey: true }), 1);
    });

    it('accepts Ctrl and Cmd as well as the short key names', function () {
        assert.equal(sandbox.getHistoryNavigationDirection({ key: 'Left', ctrlKey: true }), -1);
        assert.equal(sandbox.getHistoryNavigationDirection({ key: 'Right', metaKey: true }), 1);
    });

    it('ignores arrows without a modifier and other keys', function () {
        assert.equal(sandbox.getHistoryNavigationDirection({ key: 'ArrowLeft' }), 0);
        assert.equal(sandbox.getHistoryNavigationDirection({ key: 'a', altKey: true }), 0);
    });

    it('leaves Ctrl+Left alone in a text field, but not Alt+Left', function () {
        const input = { tagName: 'INPUT' };
        assert.equal(sandbox.getHistoryNavigationDirection({ key: 'ArrowLeft', ctrlKey: true, target: input }), 0);
        assert.equal(sandbox.getHistoryNavigationDirection({ key: 'ArrowLeft', altKey: true, target: input }), -1);
    });
});
