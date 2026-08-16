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

// ---------------------------------------------------------------------------------------------------
// Checks
// ---------------------------------------------------------------------------------------------------

let failures = 0;
let total = 0;

function section (title) {
    console.log('\n' + title);
}

function check (description, passed) {
    total++;
    if (passed) {
        console.log('  ok    ' + description);
    } else {
        failures++;
        console.log('  FAIL  ' + description);
    }
}

// NB always test for own properties: 'toString' in {} is true through the prototype chain, which would
// make several of the checks below pass without testing anything
function stored (result, key) {
    return Object.prototype.hasOwnProperty.call(result.store, key);
}

let r;

section('Parameters that are never accepted from the querystring');
[['on the production origin', PRODUCTION], ['on a development origin', DEV_SERVER],
    ['on a self-hosted origin', SELF_HOSTED], ['in the Electron app', ELECTRON], ['in the UWP app', UWP],
    ['in NW.js, running from file:', NWJS]].forEach(function (pair) {
    r = run('?sourceVerification=false', pair[1]);
    check('sourceVerification is ignored ' + pair[0],
        !stored(r, 'sourceVerification') && r.params.sourceVerification === undefined);
});

section('Parameters restricted to a development context');
r = run('?noPrompts=true&PWAServer=https%3A%2F%2Fpwa.kiwix.org%2F', PRODUCTION);
check('noPrompts is ignored on the production origin', r.params.noPrompts === undefined);
check('PWAServer is ignored on the production origin, even with an allowed value',
    r.params.PWAServer === undefined && !stored(r, 'PWAServer'));
r = run('?noPrompts=true', ELECTRON);
check('noPrompts is ignored in the Electron app, which also runs on localhost',
    r.params.noPrompts === undefined);
r = run('?noPrompts=true&PWAServer=https%3A%2F%2Fkiwix.github.io%2Fkiwix-js-pwa%2Fdist%2F', DEV_SERVER);
check('noPrompts is honoured on a development origin', r.params.noPrompts === true);
check('PWAServer is honoured on a development origin when it matches the allowlist',
    r.params.PWAServer === 'https://kiwix.github.io/kiwix-js-pwa/dist/');
r = run('?PWAServer=https%3A%2F%2Fexample.com%2F', DEV_SERVER);
check('PWAServer is refused on a development origin when it does not match the allowlist',
    r.params.PWAServer === undefined);

section('Development server workflow');
r = run('?appCache=false', DEV_SERVER);
check('appCache is honoured and stored on the development server (vite opens the app with this)',
    r.store.appCache === 'false' && r.params.appCache === false);

section("Settings passed between the app's own contexts");
r = run('?allowInternetAccess=true&packagedFile=wikimed.zim&fileVersion=2024-01&lastSelectedArchive=my.zim',
    PRODUCTION);
check('allowInternetAccess is stored', r.store.allowInternetAccess === 'true' && r.params.allowInternetAccess === true);
check('packagedFile is stored', r.store.packagedFile === 'wikimed.zim');
check('fileVersion is stored', r.store.fileVersion === '2024-01');
check('lastSelectedArchive is stored under its own key', r.store.lastSelectedArchive === 'my.zim');
check('lastSelectedArchive is aliased to params.storedFile', r.params.storedFile === 'my.zim');
r = run('?contentInjectionMode=serviceworker&manipulateImages=false&allowHTMLExtraction=false', PRODUCTION);
check('contentInjectionMode is stored', r.store.contentInjectionMode === 'serviceworker');
check('manipulateImages is stored', r.store.manipulateImages === 'false' && r.params.manipulateImages === false);
check('allowHTMLExtraction is stored', r.store.allowHTMLExtraction === 'false');
r = run('?allowInternetAccess=false&contentInjectionMode=jquery', PRODUCTION);
check('contentInjectionMode accepts the app\'s other mode, used by the UWP handoff and resetApp',
    r.store.contentInjectionMode === 'jquery');
r = run('?lastPageVisit=A%2FSome_page', PRODUCTION);
check('lastPageVisit applies to the current page load', r.params.lastPageVisit === 'A/Some_page');
check('lastPageVisit is not stored, as init.js never reads it back under that key',
    !stored(r, 'lastPageVisit'));

section('Endpoint parameters restricted to Kiwix hosts');
[['kiwixDownloadServer', 'https://staging.download.kiwix.org/zim/'],
    ['kiwixCatalogEntries', 'https://opds.library.kiwix.org/catalog/v2/entries?count=-1'],
    ['kiwixMirrorServer', 'https://mirror.download.kiwix.org'],
    ['kiwixLibraryBrowser', 'https://browse.library.kiwix.org']].forEach(function (pair) {
    r = run('?' + pair[0] + '=' + encodeURIComponent(pair[1]), PRODUCTION);
    check(pair[0] + ' accepts ' + pair[1], r.store[pair[0]] === pair[1]);
});
['https://example.com/zim/', 'https://kiwix.org.example.com/', 'https://notkiwix.org/',
    'https://kiwix.github.io.example.com/', 'http://opds.library.kiwix.org/'].forEach(function (url) {
    r = run('?kiwixDownloadServer=' + encodeURIComponent(url), PRODUCTION);
    check('kiwixDownloadServer refuses ' + url,
        !stored(r, 'kiwixDownloadServer') && r.params.kiwixDownloadServer === undefined);
});

section('The content injection mode is restricted to the modes the app implements');
// setContentInjectionMode() in app.js branches on 'jquery' and 'serviceworker' only, and the radio buttons in
// index.html carry those same two values, so any other mode name leaves the app in a state it cannot show the
// user: no radio button is selected, and the mode matches neither branch at the call sites that switch on it
['serviceworkerlocal', 'jQuery', 'serviceworker ', 'anything'].forEach(function (mode) {
    r = run('?contentInjectionMode=' + encodeURIComponent(mode), PRODUCTION);
    check('contentInjectionMode refuses "' + mode + '"',
        !stored(r, 'contentInjectionMode') && r.params.contentInjectionMode === undefined);
});

section('Keys that could alter the params prototype');
r = run('?toString=x', PRODUCTION);
check('an inherited property name does not throw, and is not stored', !stored(r, 'toString'));
r = run('?__proto__=x&constructor=y&prototype=z', PRODUCTION);
check('__proto__, constructor and prototype are skipped',
    !stored(r, '__proto__') && !stored(r, 'constructor') && !stored(r, 'prototype'));
check('the params prototype is intact', Object.getPrototypeOf(r.params) === Object.prototype);

section('Unlisted parameters apply to the current page load only');
r = run('?debugLibzimASM=wasm&useLibzim=true', PRODUCTION);
check('an unlisted parameter is applied', r.params.debugLibzimASM === 'wasm');
check('an unlisted parameter is not stored', !stored(r, 'debugLibzimASM'));
check('an unlisted Boolean is converted', r.params.useLibzim === true);
check('an unlisted Boolean is not stored', !stored(r, 'useLibzim'));

section('Empty values clear a setting rather than being skipped');
r = run('?allowInternetAccess=true&lastSelectedArchivePath=&lastSelectedArchive=my.zim', PRODUCTION);
check('an empty value is parsed and clears the setting',
    stored(r, 'lastSelectedArchivePath') && r.store.lastSelectedArchivePath === '');
check('the parameter before an empty one is still parsed', r.store.allowInternetAccess === 'true');
check('the parameter after an empty one is still parsed', r.store.lastSelectedArchive === 'my.zim');
r = run('?kiwixDownloadServer=', PRODUCTION);
check('an empty value does not satisfy an endpoint pattern', !stored(r, 'kiwixDownloadServer'));
r = run('?sourceVerification=', DEV_SERVER);
check('an empty value does not bypass a never-accepted parameter', !stored(r, 'sourceVerification'));

section('The title parameter is reserved for the router');
r = run('?title=A%2FSome_article', PRODUCTION);
check('title is neither stored nor applied', !stored(r, 'title') && r.params.title === undefined);

// ---------------------------------------------------------------------------------------------------

console.log('\n' + (failures ? failures + ' of ' + total + ' checks FAILED' : 'All ' + total + ' checks passed') + '\n');
process.exit(failures ? 1 : 0);
