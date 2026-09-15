#!/usr/bin/env node
/**
 * Checks full-screen mode entry and cancellation behavior in www/js/lib/uiUtil.js (#961).
 *
 * Usage: npm test
 */

'use strict';
/* eslint-disable no-unused-vars */

const fs = require('fs');
const path = require('path');

const UI_UTIL_JS = path.join(__dirname, '..', 'www', 'js', 'lib', 'uiUtil.js');

function extractUiUtilFunctions (source) {
    return source
        .replace(/^\s*import\s+.*?;\s*$/gm, '')
        .replace(/^\s*export\s+default\s+[\s\S]*?;\s*$/gm, '');
}

const uiUtilSource = extractUiUtilFunctions(fs.readFileSync(UI_UTIL_JS, 'utf8'));

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

    const mockDocument = {
        fullscreenElement: isFullscreen ? mockDocumentElement : null,
        documentElement: mockDocumentElement,
        getElementById: function () {
            return { style: {}, offsetHeight: 0, classList: { toggle: function () {} } };
        },
        querySelector: function () {
            return null;
        },
        querySelectorAll: function () {
            return [];
        },
        exitFullscreen: function () {
            exitFullscreenCalled++;
            if (!isFullscreen || options.failExit) {
                return Promise.reject(new TypeError('Document not active (not in fullscreen)'));
            }
            isFullscreen = false;
            mockDocument.fullscreenElement = null;
            return Promise.resolve();
        }
    };

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

let passes = 0;
let failures = 0;

function assert (desc, ok) {
    if (ok) {
        console.log(`  ok    ${desc}`);
        passes++;
    } else {
        console.error(`  FAIL  ${desc}`);
        failures++;
    }
}

async function runTests () {
    console.log('Cancelling full-screen mode when already in windowed mode (#961)');
    {
        const sandbox = createMockEnvironment({ isFullscreen: false });
        let result;
        let threw = false;
        try {
            result = await sandbox.requestOrCancelFullScreen();
        } catch (err) {
            threw = true;
            console.error('    Error:', err.message);
        }

        assert('Resolves cleanly without throwing when cancelling while not in fullscreen', !threw);
        assert('Returns false when full-screen mode cancelled in windowed mode', result === false);
        assert('Does not call document.exitFullscreen() when already in windowed mode', sandbox.getExitFullscreenCalled() === 0);
    }

    console.log('\nResetting display orientation lock in windowed mode (#961)');
    {
        const sandbox = createMockEnvironment({ isFullscreen: false });
        let result;
        let threw = false;
        try {
            result = await sandbox.lockDisplayOrientation('');
        } catch (err) {
            threw = true;
            console.error('    Error:', err.message);
        }

        assert('lockDisplayOrientation("") resolves cleanly in windowed mode without throwing', !threw);
        assert('Unlocks screen orientation', sandbox.getOrientationUnlockCalled() === 1);
        assert('Does not call document.exitFullscreen()', sandbox.getExitFullscreenCalled() === 0);
    }

    console.log('\nEntering and exiting full-screen mode normally');
    {
        const sandbox = createMockEnvironment({ isFullscreen: false });
        const enterResult = await sandbox.requestOrCancelFullScreen(sandbox.getDocumentElement());
        assert('Enters fullscreen mode successfully', enterResult === true);
        assert('Invokes requestFullscreen on documentElement', sandbox.getRequestFullscreenCalled() === 1);
        assert('appIsFullScreen() reports true', sandbox.appIsFullScreen() === true);

        // Re-requesting fullscreen while already fullscreen
        const reEnterResult = await sandbox.requestOrCancelFullScreen(sandbox.getDocumentElement());
        assert('Re-requesting fullscreen when already fullscreen returns true immediately', reEnterResult === true);
        assert('Does not re-invoke requestFullscreen', sandbox.getRequestFullscreenCalled() === 1);

        // Exiting fullscreen while in fullscreen
        const exitResult = await sandbox.requestOrCancelFullScreen();
        assert('Exiting fullscreen when in fullscreen resolves to false', exitResult === false);
        assert('Invokes document.exitFullscreen()', sandbox.getExitFullscreenCalled() === 1);
        assert('appIsFullScreen() reports false after exit', sandbox.appIsFullScreen() === false);
    }

    console.log('\nError handling when exitFullscreen fails in active fullscreen');
    {
        const sandbox = createMockEnvironment({ isFullscreen: true, failExit: true });
        let threw = false;
        try {
            await sandbox.requestOrCancelFullScreen();
        } catch (err) {
            threw = true;
        }

        assert('Propagates rejection when document.exitFullscreen() fails in active fullscreen', threw);
    }

    if (failures > 0) {
        console.error(`\n${failures} check(s) failed out of ${passes + failures} total checks\n`);
        process.exit(1);
    } else {
        console.log(`\nAll ${passes} checks passed\n`);
    }
}

runTests().catch(function (err) {
    console.error('Test suite failed:', err);
    process.exit(1);
});
