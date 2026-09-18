#!/usr/bin/env node
/**
 * Checks the querystring parameter handling in www/js/init.js.
 *
 * The app lets its own contexts pass settings to one another through the querystring (the UWP <-> PWA
 * handoffs, and the reload in resetApp.js), and lets a developer drive any setting the same way. Which
 * of those parameters may be written to the Settings Store, and which are accepted at all, is decided
 * by four lists in overrideParams(). Those lists are easy to extend without noticing what the extension
 * implies, so this file pins the intended behaviour of each one.
 *
 * init.js is a standalone script rather than a module - it is loaded with a plain <script src> and is
 * not bundled, because it must run before anything else and cannot depend on the module graph. It
 * therefore cannot be required. Instead we slice overrideParams() out of the source and evaluate it
 * against stubs, so these checks always run the real code rather than a copy that can drift from it.
 *
 * Usage: npm test
 */

'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('node:assert/strict');
const { describe, it } = require('node:test');

const INIT_JS = path.join(__dirname, '..', 'www', 'js', 'init.js');

// ---------------------------------------------------------------------------------------------------
// Extract the real overrideParams() from init.js
// ---------------------------------------------------------------------------------------------------

function extractOverrideParams (source) {
    const start = source.indexOf('(function overrideParams ()');
    const end = source.indexOf('\n})();', start);
    if (start < 0 || end < 0) {
        throw new Error('Could not locate overrideParams() in ' + INIT_JS + '. If it was renamed or ' +
            'restructured, update the markers in this file - do not delete the checks.');
    }
    const extracted = source.slice(start, end + '\n})();'.length);
    // Guard against silently testing a stale or partial slice: if any of these disappears, the checks
    // below could pass while exercising something quite different from what they describe
    ['persistableParams', 'neverFromQuerystring', 'devOnlyParams', 'validatedParams', 'forbiddenParams',
        'trustedContext'].forEach(function (name) {
        if (!extracted.includes(name)) {
            throw new Error('The extracted overrideParams() no longer mentions "' + name + '". Either it ' +
                'was renamed, or the extraction markers are catching the wrong part of the file.');
        }
    });
    return extracted;
}

const overrideParamsSource = extractOverrideParams(fs.readFileSync(INIT_JS, 'utf8'));

/**
 * Runs the real overrideParams() against a stubbed environment
 *
 * @param {String} search The querystring, including its leading '?'
 * @param {Object} context The app type and location to simulate
 * @returns {Object} The resulting params object, and the settings that were written to the Store
 */
function run (search, context) {
    const store = {};
    const params = { appType: context.appType };
    // These are the free variables the extracted code closes over in init.js. They are declared with var
    // so that the evaluated source, which is strict-mode, resolves them from this scope.
    var window = { location: { search: search, hostname: context.hostname, protocol: context.protocol } }; // eslint-disable-line no-unused-vars
    var setSetting = function (name, val) { store[name] = val; }; // eslint-disable-line no-unused-vars
    var console = { warn: function () {}, debug: function () {} }; // eslint-disable-line no-unused-vars
    // eslint-disable-next-line no-eval
    eval(overrideParamsSource);
    return { params: params, store: store };
}

// The contexts the app actually runs in. Note that the Electron app serves itself from http://localhost
// via its bundled Express server, and NW.js runs from file:, so neither can be told apart from a
// developer's machine by origin alone.
const PRODUCTION = { appType: 'HTML5|PWA|Windows', hostname: 'pwa.kiwix.org', protocol: 'https:' };
const DEV_SERVER = { appType: 'HTML5|PWA|Windows', hostname: 'localhost', protocol: 'http:' };
const SELF_HOSTED = { appType: 'HTML5|PWA|Linux', hostname: 'localhost', protocol: 'http:' };
const ELECTRON = { appType: 'Electron|PWA|Windows', hostname: 'localhost', protocol: 'http:' };
const UWP = { appType: 'UWP|PWA|Windows', hostname: '', protocol: 'ms-appx-web:' };
const NWJS = { appType: 'Electron|PWA|Windows', hostname: '', protocol: 'file:' };

// NB always test for own properties: 'toString' in {} is true through the prototype chain, which would
// make several of the checks below pass without testing anything
function stored (result, key) {
    return Object.prototype.hasOwnProperty.call(result.store, key);
}

// ---------------------------------------------------------------------------------------------------
// Checks
// ---------------------------------------------------------------------------------------------------

describe('Parameters that are never accepted from the querystring', function () {
    [['on the production origin', PRODUCTION], ['on a development origin', DEV_SERVER],
        ['on a self-hosted origin', SELF_HOSTED], ['in the Electron app', ELECTRON], ['in the UWP app', UWP],
        ['in NW.js, running from file:', NWJS]].forEach(function (pair) {
        it('sourceVerification is ignored ' + pair[0], function () {
            const r = run('?sourceVerification=false', pair[1]);
            assert.ok(!stored(r, 'sourceVerification') && r.params.sourceVerification === undefined);
        });
    });
});

describe('Parameters restricted to a development context', function () {
    it('noPrompts is ignored on the production origin', function () {
        const r = run('?noPrompts=true&PWAServer=https%3A%2F%2Fpwa.kiwix.org%2F', PRODUCTION);
        assert.equal(r.params.noPrompts, undefined);
    });

    it('PWAServer is ignored on the production origin, even with an allowed value', function () {
        const r = run('?noPrompts=true&PWAServer=https%3A%2F%2Fpwa.kiwix.org%2F', PRODUCTION);
        assert.ok(r.params.PWAServer === undefined && !stored(r, 'PWAServer'));
    });

    it('noPrompts is ignored in the Electron app, which also runs on localhost', function () {
        const r = run('?noPrompts=true', ELECTRON);
        assert.equal(r.params.noPrompts, undefined);
    });

    it('noPrompts is honoured on a development origin', function () {
        const r = run('?noPrompts=true&PWAServer=https%3A%2F%2Fkiwix.github.io%2Fkiwix-js-pwa%2Fdist%2F', DEV_SERVER);
        assert.equal(r.params.noPrompts, true);
    });

    it('PWAServer is honoured on a development origin when it matches the allowlist', function () {
        const r = run('?noPrompts=true&PWAServer=https%3A%2F%2Fkiwix.github.io%2Fkiwix-js-pwa%2Fdist%2F', DEV_SERVER);
        assert.equal(r.params.PWAServer, 'https://kiwix.github.io/kiwix-js-pwa/dist/');
    });

    it('PWAServer is refused on a development origin when it does not match the allowlist', function () {
        const r = run('?PWAServer=https%3A%2F%2Fexample.com%2F', DEV_SERVER);
        assert.equal(r.params.PWAServer, undefined);
    });
});

describe('Development server workflow', function () {
    it('appCache is honoured and stored on the development server (vite opens the app with this)', function () {
        const r = run('?appCache=false', DEV_SERVER);
        assert.ok(r.store.appCache === 'false' && r.params.appCache === false);
    });
});

describe("Settings passed between the app's own contexts", function () {
    it('allowInternetAccess, packagedFile, fileVersion and lastSelectedArchive are stored', function () {
        const r = run('?allowInternetAccess=true&packagedFile=wikimed.zim&fileVersion=2024-01&lastSelectedArchive=my.zim',
            PRODUCTION);
        assert.ok(r.store.allowInternetAccess === 'true' && r.params.allowInternetAccess === true);
        assert.equal(r.store.packagedFile, 'wikimed.zim');
        assert.equal(r.store.fileVersion, '2024-01');
        assert.equal(r.store.lastSelectedArchive, 'my.zim');
        assert.equal(r.params.storedFile, 'my.zim');
    });

    it('contentInjectionMode, manipulateImages and allowHTMLExtraction are stored', function () {
        const r = run('?contentInjectionMode=serviceworker&manipulateImages=false&allowHTMLExtraction=false', PRODUCTION);
        assert.equal(r.store.contentInjectionMode, 'serviceworker');
        assert.ok(r.store.manipulateImages === 'false' && r.params.manipulateImages === false);
        assert.equal(r.store.allowHTMLExtraction, 'false');
    });

    it("contentInjectionMode accepts the app's other mode, used by the UWP handoff and resetApp", function () {
        const r = run('?allowInternetAccess=false&contentInjectionMode=jquery', PRODUCTION);
        assert.equal(r.store.contentInjectionMode, 'jquery');
    });

    it('lastPageVisit applies to the current page load but is not stored', function () {
        const r = run('?lastPageVisit=A%2FSome_page', PRODUCTION);
        assert.equal(r.params.lastPageVisit, 'A/Some_page');
        assert.ok(!stored(r, 'lastPageVisit'));
    });
});

describe('Endpoint parameters restricted to Kiwix hosts', function () {
    [['kiwixDownloadServer', 'https://staging.download.kiwix.org/zim/'],
        ['kiwixCatalogEntries', 'https://opds.library.kiwix.org/catalog/v2/entries?count=-1'],
        ['kiwixMirrorServer', 'https://mirror.download.kiwix.org'],
        ['kiwixLibraryBrowser', 'https://browse.library.kiwix.org']].forEach(function (pair) {
        it(pair[0] + ' accepts ' + pair[1], function () {
            const r = run('?' + pair[0] + '=' + encodeURIComponent(pair[1]), PRODUCTION);
            assert.equal(r.store[pair[0]], pair[1]);
        });
    });

    ['https://example.com/zim/', 'https://kiwix.org.example.com/', 'https://notkiwix.org/',
        'https://kiwix.github.io.example.com/', 'http://opds.library.kiwix.org/'].forEach(function (url) {
        it('kiwixDownloadServer refuses ' + url, function () {
            const r = run('?kiwixDownloadServer=' + encodeURIComponent(url), PRODUCTION);
            assert.ok(!stored(r, 'kiwixDownloadServer') && r.params.kiwixDownloadServer === undefined);
        });
    });
});

describe('The content injection mode is restricted to the modes the app implements', function () {
    // setContentInjectionMode() in app.js branches on 'jquery' and 'serviceworker' only, and the radio buttons in
    // index.html carry those same two values, so any other mode name leaves the app in a state it cannot show the
    // user: no radio button is selected, and the mode matches neither branch at the call sites that switch on it
    ['serviceworkerlocal', 'jQuery', 'serviceworker ', 'anything'].forEach(function (mode) {
        it('contentInjectionMode refuses "' + mode + '"', function () {
            const r = run('?contentInjectionMode=' + encodeURIComponent(mode), PRODUCTION);
            assert.ok(!stored(r, 'contentInjectionMode') && r.params.contentInjectionMode === undefined);
        });
    });
});

describe('Keys that could alter the params prototype', function () {
    it('an inherited property name does not throw, and is not stored', function () {
        const r = run('?toString=x', PRODUCTION);
        assert.ok(!stored(r, 'toString'));
    });

    it('__proto__, constructor and prototype are skipped, and the params prototype is intact', function () {
        const r = run('?__proto__=x&constructor=y&prototype=z', PRODUCTION);
        assert.ok(!stored(r, '__proto__') && !stored(r, 'constructor') && !stored(r, 'prototype'));
        assert.equal(Object.getPrototypeOf(r.params), Object.prototype);
    });
});

describe('Unlisted parameters apply to the current page load only', function () {
    it('an unlisted parameter is applied but not stored', function () {
        const r = run('?debugLibzimASM=wasm&useLibzim=true', PRODUCTION);
        assert.equal(r.params.debugLibzimASM, 'wasm');
        assert.ok(!stored(r, 'debugLibzimASM'));
    });

    it('an unlisted Boolean is converted but not stored', function () {
        const r = run('?debugLibzimASM=wasm&useLibzim=true', PRODUCTION);
        assert.equal(r.params.useLibzim, true);
        assert.ok(!stored(r, 'useLibzim'));
    });
});

describe('Empty values clear a setting rather than being skipped', function () {
    it('an empty value is parsed and clears the setting, without disturbing its neighbours', function () {
        const r = run('?allowInternetAccess=true&lastSelectedArchivePath=&lastSelectedArchive=my.zim', PRODUCTION);
        assert.ok(stored(r, 'lastSelectedArchivePath') && r.store.lastSelectedArchivePath === '');
        assert.equal(r.store.allowInternetAccess, 'true');
        assert.equal(r.store.lastSelectedArchive, 'my.zim');
    });

    it('an empty value does not satisfy an endpoint pattern', function () {
        const r = run('?kiwixDownloadServer=', PRODUCTION);
        assert.ok(!stored(r, 'kiwixDownloadServer'));
    });

    it('an empty value does not bypass a never-accepted parameter', function () {
        const r = run('?sourceVerification=', DEV_SERVER);
        assert.ok(!stored(r, 'sourceVerification'));
    });
});

describe('The title parameter is reserved for the router', function () {
    it('title is neither stored nor applied', function () {
        const r = run('?title=A%2FSome_article', PRODUCTION);
        assert.ok(!stored(r, 'title') && r.params.title === undefined);
    });
});
