#!/usr/bin/env node
/**
 * Checks GitHub release parsing and version comparison in www/js/lib/updater.js.
 *
 * Usage: npm test
 */

'use strict';

const fs = require('fs');
const path = require('path');

const UPDATER_JS = path.join(__dirname, '..', 'www', 'js', 'lib', 'updater.js');

function extractUpdaterFunctions (source) {
    // Strip ES module import and export to evaluate inside a CommonJS sandbox
    const transformed = source
        .replace(/^\s*import\s+.*?;\s*$/gm, '')
        .replace(/^\s*export\s+default\s+[\s\S]*?;\s*$/gm, '');

    return transformed;
}

const updaterSource = extractUpdaterFunctions(fs.readFileSync(UPDATER_JS, 'utf8'));

/**
 * Runs updater.getLatestUpdates() against a mocked environment
 *
 * @param {String|Object} mockResponse The API response text (or object) to simulate
 * @param {Object} context App configuration (appVersion, packagedFile, etc.)
 * @returns {Promise<Object>} The resulting { updateTag, updateUrl, updatedReleases }
 */
function run (mockResponse, context) {
    return new Promise(function (resolve) {
        var params = { // eslint-disable-line no-unused-vars
            appVersion: context.appVersion || '3.8.92-E',
            packagedFile: context.packagedFile || '',
            updateServer: { url: 'https://api.github.com/repos/kiwix/kiwix-js-pwa/', releases: 'releases' }
        };
        var uiUtil = { // eslint-disable-line no-unused-vars
            XHR: function (url, type, callback) {
                var text = typeof mockResponse === 'string' ? mockResponse : JSON.stringify(mockResponse);
                callback(text, 'application/json', 200);
            }
        };

        // Evaluate the extracted functions in sandbox scope
        // eslint-disable-next-line no-eval
        var getLatestUpdates = eval('(function () {\n' + updaterSource + '\nreturn getLatestUpdates;\n})()');

        getLatestUpdates(function (updateTag, updateUrl, updatedReleases) {
            resolve({
                updateTag: updateTag,
                updateUrl: updateUrl,
                updatedReleases: updatedReleases
            });
        });
    });
}

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

async function runTests () {
    section('Minified JSON handling and multi-asset parsing');
    const minifiedPayload = JSON.stringify([
        {
            tag_name: 'v4.0.0-E',
            html_url: 'https://github.com/kiwix/kiwix-js-pwa/releases/tag/v4.0.0-E',
            assets: [
                { name: 'source.zip', browser_download_url: 'https://github.com/kiwix/kiwix-js-pwa/releases/download/v4.0.0-E/source.zip' },
                { name: 'kiwix-electron-4.0.0-E.exe', browser_download_url: 'https://github.com/kiwix/kiwix-js-pwa/releases/download/v4.0.0-E/kiwix-electron-4.0.0-E.exe' }
            ]
        },
        {
            tag_name: 'v3.9.0-E',
            html_url: 'https://github.com/kiwix/kiwix-js-pwa/releases/tag/v3.9.0-E',
            assets: [
                { name: 'kiwix-electron-3.9.0-E.exe', browser_download_url: 'https://github.com/kiwix/kiwix-js-pwa/releases/download/v3.9.0-E/kiwix-electron-3.9.0-E.exe' }
            ]
        }
    ]);

    let res = await run(minifiedPayload, { appVersion: '3.8.92-E' });
    check('Detects highest version v4.0.0-E on minified JSON', res.updateTag === 'v4.0.0-E');
    check('Download URL contains clean uncorrupted URL', res.updatedReleases[0] === 'https://github.com/kiwix/kiwix-js-pwa/releases/download/v4.0.0-E/kiwix-electron-4.0.0-E.exe');
    check('Collects all newer matching releases in updatedReleases list', res.updatedReleases.length === 2);

    section('Channel matching logic');
    const multiChannelPayload = [
        {
            tag_name: 'v3.9.5',
            html_url: 'https://github.com/kiwix/kiwix-js-pwa/releases/tag/v3.9.5',
            assets: [
                { name: 'kiwix-electron-3.9.5.exe', browser_download_url: 'https://github.com/kiwix/kiwix-js-pwa/releases/download/v3.9.5/kiwix-electron-3.9.5.exe' }
            ]
        },
        {
            tag_name: 'v3.9.5-E',
            html_url: 'https://github.com/kiwix/kiwix-js-pwa/releases/tag/v3.9.5-E',
            assets: [
                { name: 'kiwix-electron-3.9.5-E.exe', browser_download_url: 'https://github.com/kiwix/kiwix-js-pwa/releases/download/v3.9.5-E/kiwix-electron-3.9.5-E.exe' }
            ]
        }
    ];

    res = await run(multiChannelPayload, { appVersion: '3.8.92-E' });
    check('Prefers channel match (-E) when same underlying version exists', res.updateTag === 'v3.9.5-E');

    const nonChannelApp = await run(multiChannelPayload, { appVersion: '3.8.92' });
    check('Non-channel client matches non-channel release', nonChannelApp.updateTag === 'v3.9.5');

    section('BaseApp packaging filter');
    const packagedReleases = [
        {
            tag_name: 'v3.9.0',
            html_url: 'https://github.com/kiwix/kiwix-js-pwa/releases/tag/v3.9.0',
            assets: [
                { name: 'kiwix-electron-3.9.0.exe', browser_download_url: 'https://github.com/kiwix/kiwix-js-pwa/releases/download/v3.9.0/kiwix-electron-3.9.0.exe' },
                { name: 'wikivoyage-setup.exe', browser_download_url: 'https://github.com/kiwix/kiwix-js-pwa/releases/download/v3.9.0/wikivoyage-setup.exe' },
                { name: 'wikimed-setup.exe', browser_download_url: 'https://github.com/kiwix/kiwix-js-pwa/releases/download/v3.9.0/wikimed-setup.exe' }
            ]
        }
    ];

    const wikivoyageRes = await run(packagedReleases, { appVersion: '3.8.0', packagedFile: 'wikivoyage_en_all.zim' });
    check('Wikivoyage packaged app only captures wikivoyage asset', wikivoyageRes.updatedReleases.length === 1 && /wikivoyage/.test(wikivoyageRes.updatedReleases[0]));

    const wikimedRes = await run(packagedReleases, { appVersion: '3.8.0', packagedFile: 'wikimed_en_all.zim' });
    check('WikiMed packaged app only captures wikimed asset', wikimedRes.updatedReleases.length === 1 && /wikimed/.test(wikimedRes.updatedReleases[0]));

    section('Up to date and malformed response handling');
    const alreadyLatest = await run(packagedReleases, { appVersion: '3.9.0' });
    check('Returns undefined updateTag when already on latest version', alreadyLatest.updateTag === undefined);

    const malformedJson = await run('not valid json {[[', { appVersion: '3.8.0' });
    check('Handles malformed JSON gracefully without throwing', malformedJson.updateTag === undefined && malformedJson.updatedReleases.length === 0);

    const emptyResponse = await run('', { appVersion: '3.8.0' });
    check('Handles empty response gracefully', emptyResponse.updateTag === undefined && emptyResponse.updatedReleases.length === 0);

    section('Consecutive invocation idempotency');
    const firstCall = await run(minifiedPayload, { appVersion: '3.8.92-E' });
    const secondCall = await run(minifiedPayload, { appVersion: '3.8.92-E' });
    check('First call detects correct update', firstCall.updateTag === 'v4.0.0-E');
    check('Second call detects identical update without state leakage', secondCall.updateTag === 'v4.0.0-E');

    if (failures > 0) {
        console.error('\n' + failures + ' of ' + total + ' checks failed.');
        process.exit(1);
    } else {
        console.log('\nAll ' + total + ' checks passed\n');
    }
}

runTests();
