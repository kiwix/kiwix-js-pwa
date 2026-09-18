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

    /* eslint-disable no-eval */
    const sandbox = eval(`(function () {
        var document = mockDocument;
        var screen = mockScreen;
        var params = mockParams;
        var appstate = mockAppstate;
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
    const sandbox = createMockEnvironment({ isFullscreen: false });
    let result;
    let threw = false;

    it('resolves cleanly without throwing when cancelling while not in fullscreen', async function () {
        try {
            result = await sandbox.requestOrCancelFullScreen();
        } catch (err) {
            threw = true;
        }
        assert.equal(threw, false);
    });

    it('returns false when full-screen mode cancelled in windowed mode', function () {
        assert.equal(result, false);
    });

    it('does not call document.exitFullscreen() when already in windowed mode', function () {
        assert.equal(sandbox.getExitFullscreenCalled(), 0);
    });
});

describe('Resetting display orientation lock in windowed mode (#961)', function () {
    const sandbox = createMockEnvironment({ isFullscreen: false });
    let threw = false;

    it('lockDisplayOrientation("") resolves cleanly in windowed mode without throwing', async function () {
        try {
            await sandbox.lockDisplayOrientation('');
        } catch (err) {
            threw = true;
        }
        assert.equal(threw, false);
    });

    it('unlocks screen orientation', function () {
        assert.equal(sandbox.getOrientationUnlockCalled(), 1);
    });

    it('does not call document.exitFullscreen()', function () {
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
        const sandbox = createMockEnvironment({ isFullscreen: true, failExit: true });
        await assert.rejects(function () {
            return sandbox.requestOrCancelFullScreen();
        });
    });
});
