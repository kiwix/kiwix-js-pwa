#!/usr/bin/env node
/**
 * Checks uiUtil.getHistoryShortcut in www/js/lib/uiUtil.js, which decides whether a keydown is one of the
 * app's history shortcuts (Alt, Ctrl or Cmd with Left or Right) (#1003).
 *
 * The same keys move the caret by a word in text fields: Ctrl on Windows and Linux, Option or Cmd on Apple
 * platforms. These checks pin down that the search box keeps that behaviour, while Alt+Left/Right still
 * navigate from a field on Windows and Linux, where they have no editing meaning.
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

const mockDocument = createMockDocument();

/* eslint-disable no-eval */
const { getHistoryShortcut } = eval(`(function () {
    var document = mockDocument;
    var params = { appType: 'PWA' };
    var appstate = {};
    var window = { innerHeight: 800 };
    function getComputedStyle () { return { height: '0px', marginTop: '0px', marginBottom: '0px' }; }
    ${uiUtilSource}
    return { getHistoryShortcut: getHistoryShortcut };
})()`);
/* eslint-enable no-eval */

/**
 * Builds a minimal element of the kind a keydown target can be.
 *
 * @param {String} tagName The element's tag name
 * @param {Object} [options] isContentEditable and role
 * @returns {Object} An object with the properties getHistoryShortcut reads
 */
function element (tagName, options) {
    options = options || {};
    return {
        tagName: tagName,
        isContentEditable: !!options.isContentEditable,
        getAttribute: function (name) { return name === 'role' && options.role ? options.role : null; }
    };
}

/**
 * Builds a keydown event.
 *
 * @param {String} key The event's key, such as 'ArrowLeft'
 * @param {String} modifier 'alt', 'ctrl', 'meta' or '' for none
 * @param {Object} target The event target
 * @returns {Object} An object with the properties getHistoryShortcut reads
 */
function keydown (key, modifier, target) {
    return {
        key: key,
        altKey: modifier === 'alt',
        ctrlKey: modifier === 'ctrl',
        metaKey: modifier === 'meta',
        target: target
    };
}

const body = element('BODY');
const searchBox = element('INPUT');

describe('getHistoryShortcut', function () {
    describe('outside a text field', function () {
        ['alt', 'ctrl', 'meta'].forEach(function (modifier) {
            it(modifier + '+Left is Back and ' + modifier + '+Right is Forward, on any platform', function () {
                [false, true].forEach(function (isApple) {
                    assert.equal(getHistoryShortcut(keydown('ArrowLeft', modifier, body), isApple), 'back');
                    assert.equal(getHistoryShortcut(keydown('ArrowRight', modifier, body), isApple), 'forward');
                });
            });
        });

        it('accepts the legacy key names Left and Right', function () {
            assert.equal(getHistoryShortcut(keydown('Left', 'alt', body), false), 'back');
            assert.equal(getHistoryShortcut(keydown('Right', 'alt', body), false), 'forward');
        });

        it('ignores arrows without a modifier, and other keys with one', function () {
            assert.equal(getHistoryShortcut(keydown('ArrowLeft', '', body), false), null);
            assert.equal(getHistoryShortcut(keydown('ArrowRight', '', body), false), null);
            assert.equal(getHistoryShortcut(keydown('ArrowUp', 'alt', body), false), null);
            assert.equal(getHistoryShortcut(keydown('f', 'ctrl', body), false), null);
        });

        it('copes with an event that has no target', function () {
            assert.equal(getHistoryShortcut(keydown('ArrowLeft', 'alt', null), false), 'back');
        });
    });

    describe('in a text field', function () {
        const fields = {
            'an input': searchBox,
            'a textarea': element('TEXTAREA'),
            'a contenteditable element': element('DIV', { isContentEditable: true }),
            'an element with role="textbox"': element('DIV', { role: 'textbox' })
        };

        Object.keys(fields).forEach(function (name) {
            it('leaves Ctrl and Cmd+Left/Right to ' + name + ' on any platform', function () {
                [false, true].forEach(function (isApple) {
                    ['ctrl', 'meta'].forEach(function (modifier) {
                        assert.equal(getHistoryShortcut(keydown('ArrowLeft', modifier, fields[name]), isApple), null);
                        assert.equal(getHistoryShortcut(keydown('ArrowRight', modifier, fields[name]), isApple), null);
                    });
                });
            });
        });

        it('leaves Option+Left/Right to the field on Apple platforms, where they move the caret by a word', function () {
            assert.equal(getHistoryShortcut(keydown('ArrowLeft', 'alt', searchBox), true), null);
            assert.equal(getHistoryShortcut(keydown('ArrowRight', 'alt', searchBox), true), null);
        });

        it('still treats Alt+Left/Right as Back and Forward on Windows and Linux', function () {
            assert.equal(getHistoryShortcut(keydown('ArrowLeft', 'alt', searchBox), false), 'back');
            assert.equal(getHistoryShortcut(keydown('ArrowRight', 'alt', searchBox), false), 'forward');
        });
    });
});
