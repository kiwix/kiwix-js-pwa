#!/usr/bin/env node
/**
 * Checks full-screen mode entry and cancellation behavior in www/js/lib/uiUtil.js (#961).
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

function createMockEnvironment (options) {
    options = options || {};
    let isFullscreen = !!options.isFullscreen;
    let exitFullscreenCalled = 0;
    let requestFullscreenCalled = 0;
    let orientationUnlockCalled = 0;
    let orientationLockCalled = 0;

    const mockDocumentElement = {
        style: {},
        requestFullscreen: function () {
            requestFullscreenCalled++;
            if (options.failRequest) {
                return Promise.reject(new Error('Fullscreen request denied'));
            }
            isFullscreen = true;
            mockDocument.fullscreenElement = mockDocumentElement;
            return Promise.resolve();
        }
    };

    const mockDocument = createMockDocument({
        fullscreenElement: isFullscreen ? mockDocumentElement : null,
        documentElement: mockDocumentElement,
        exitFullscreen: function () {
            exitFullscreenCalled++;
            if (!isFullscreen || options.failExit) {
                return Promise.reject(new TypeError('Document not active (not in fullscreen)'));
            }
            isFullscreen = false;
            mockDocument.fullscreenElement = null;
            return Promise.resolve();
        }
    });

    const mockScreen = {
        orientation: {
            lock: function () {
                orientationLockCalled++;
                return Promise.resolve();
            },
            unlock: function () {
                orientationUnlockCalled++;
            }
        }
    };

    const mockParams = {
        lockDisplayOrientation: ''
    };

    const mockAppstate = {};

    // The code under test logs the failure path with console.warn. In the test that provokes that
    // failure deliberately, the warning is captured for assertion rather than printed, which keeps
    // the expected error and its stack out of the runner's output. Every other level, and every
    // warning a test has not opted to capture, still reaches the real console, so an unexpected
    // diagnostic is never silently swallowed.
    const warnings = [];
    const mockConsole = {
        log: function () { console.log.apply(console, arguments); },
        debug: function () { console.debug.apply(console, arguments); },
        error: function () { console.error.apply(console, arguments); },
        warn: function () {
            warnings.push(Array.prototype.slice.call(arguments));
            if (!options.captureWarnings) console.warn.apply(console, arguments);
        }
    };

    /* eslint-disable no-eval */
    const sandbox = eval(`(function () {
        var document = mockDocument;
        var screen = mockScreen;
        var params = mockParams;
        var appstate = mockAppstate;
        var console = mockConsole;
        var window = { innerHeight: 800 };
        function getComputedStyle () { return { height: '0px', marginTop: '0px', marginBottom: '0px' }; }
        ${uiUtilSource}
        return {
            appIsFullScreen: appIsFullScreen,
            requestOrCancelFullScreen: requestOrCancelFullScreen,
            lockDisplayOrientation: lockDisplayOrientation,
            getDocumentElement: function () { return mockDocumentElement; },
            getExitFullscreenCalled: function () { return exitFullscreenCalled; },
            getRequestFullscreenCalled: function () { return requestFullscreenCalled; },
            getOrientationUnlockCalled: function () { return orientationUnlockCalled; },
            getOrientationLockCalled: function () { return orientationLockCalled; },
            getWarnings: function () { return warnings; },
            setIsFullscreen: function (val) {
                isFullscreen = val;
                mockDocument.fullscreenElement = val ? mockDocumentElement : null;
            }
        };
    })()`);
    /* eslint-enable no-eval */

    return sandbox;
}

describe('Cancelling full-screen mode when already in windowed mode (#961)', function () {
    it('resolves cleanly, returns false, and does not call document.exitFullscreen()', async function () {
        const sandbox = createMockEnvironment({ isFullscreen: false });
        let result;
        let threw = false;
        try {
            result = await sandbox.requestOrCancelFullScreen();
        } catch (err) {
            threw = true;
        }
        assert.equal(threw, false);
        assert.equal(result, false);
        assert.equal(sandbox.getExitFullscreenCalled(), 0);
    });
});

describe('Resetting display orientation lock in windowed mode (#961)', function () {
    it('resolves cleanly, unlocks screen orientation, and does not call document.exitFullscreen()', async function () {
        const sandbox = createMockEnvironment({ isFullscreen: false });
        let threw = false;
        try {
            await sandbox.lockDisplayOrientation('');
        } catch (err) {
            threw = true;
        }
        assert.equal(threw, false);
        assert.equal(sandbox.getOrientationUnlockCalled(), 1);
        assert.equal(sandbox.getExitFullscreenCalled(), 0);
    });
});

describe('Entering and exiting full-screen mode normally', function () {
    const sandbox = createMockEnvironment({ isFullscreen: false });

    it('enters fullscreen mode successfully', async function () {
        const enterResult = await sandbox.requestOrCancelFullScreen(sandbox.getDocumentElement());
        assert.equal(enterResult, true);
        assert.equal(sandbox.getRequestFullscreenCalled(), 1);
        assert.equal(sandbox.appIsFullScreen(), true);
    });

    it('does not re-invoke requestFullscreen when re-requesting fullscreen while already fullscreen', async function () {
        const reEnterResult = await sandbox.requestOrCancelFullScreen(sandbox.getDocumentElement());
        assert.equal(reEnterResult, true);
        assert.equal(sandbox.getRequestFullscreenCalled(), 1);
    });

    it('exits fullscreen when in fullscreen', async function () {
        const exitResult = await sandbox.requestOrCancelFullScreen();
        assert.equal(exitResult, false);
        assert.equal(sandbox.getExitFullscreenCalled(), 1);
        assert.equal(sandbox.appIsFullScreen(), false);
    });
});

describe('Error handling when exitFullscreen fails in active fullscreen', function () {
    it('propagates rejection when document.exitFullscreen() fails in active fullscreen', async function () {
        const sandbox = createMockEnvironment({ isFullscreen: true, failExit: true, captureWarnings: true });
        await assert.rejects(function () {
            return sandbox.requestOrCancelFullScreen();
        });
        // Assert on the captured warning rather than just suppressing it, so that a change to what
        // the failure path reports fails the test instead of passing unnoticed
        const warnings = sandbox.getWarnings();
        assert.equal(warnings.length, 1);
        assert.equal(warnings[0][0], 'Error disabling full-screen mode');
        assert.ok(warnings[0][1] instanceof Error);
    });
});
