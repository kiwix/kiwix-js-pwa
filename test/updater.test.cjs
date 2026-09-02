#!/usr/bin/env node
/**
 * Checks GitHub release parsing and version comparison in www/js/lib/updater.js.
 *
 * Usage: npm test
 */

'use strict';

const fs = require('fs');
const path = require('path');
const https = require('https');

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

/**
 * Fetches the real releases list from the GitHub API, to check the code against the actual
 * response shape rather than only hand-written fixtures. Resolves to null (rather than
 * rejecting) if the API can't be reached, so a lack of network access skips the check instead
 * of failing the suite.
 *
 * GitHub varies the JSON formatting on the Accept header (note `Vary: Accept` on the response):
 * send one and you get pretty-printed JSON, one field per line; omit it and you get everything
 * minified onto a single line. https.get sends no Accept header by default, so with
 * withAcceptHeader left false this exercises the minified path - the shape that actually breaks
 * the old greedy-wildcard regex. Pass withAcceptHeader: true to fetch the pretty-printed shape
 * instead, which is what the app itself receives (uiUtil.XHR uses XMLHttpRequest, and browsers
 * add an `Accept: * / *` wildcard header to every request automatically).
 *
 * @param {Boolean} [withAcceptHeader] Send an explicit Accept header to request the pretty-printed shape
 * @returns {Promise<String|null>} The raw response text, or null if it could not be fetched
 */
function fetchLiveReleases (withAcceptHeader) {
    return new Promise(function (resolve) {
        var headers = { 'User-Agent': 'kiwix-js-pwa-updater-test' };
        if (withAcceptHeader) headers.Accept = '*/*';
        var req = https.get('https://api.github.com/repos/kiwix/kiwix-js-pwa/releases', {
            headers: headers,
            timeout: 5000
        }, function (res) {
            if (res.statusCode !== 200) {
                res.resume();
                resolve(null);
                return;
            }
            res.setEncoding('utf8'); // Buffers multi-byte UTF-8 sequences split across TCP chunks
            var data = '';
            res.on('data', function (chunk) { data += chunk; });
            res.on('end', function () { resolve(data); });
        });
        req.on('timeout', function () { req.destroy(); resolve(null); });
        req.on('error', function () { resolve(null); });
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

    section('Real API response shape (pretty-printed, one field per line)');
    // GitHub's REST API pretty-prints its JSON with one field per line when the request carries
    // an Accept header - which is what actually reaches this code in production, since uiUtil.XHR
    // goes through XMLHttpRequest and browsers add `Accept: */*` to every request automatically.
    const prettyPrintedPayload = fs.readFileSync(path.join(__dirname, 'fixtures', 'github-releases-sample.json'), 'utf8');
    const prettyRes = await run(prettyPrintedPayload, { appVersion: '3.8.92-E' });
    check('Detects highest version on a realistically pretty-printed response', prettyRes.updateTag === 'v4.0.0-E');
    check('Download URL is not corrupted with JSON punctuation from neighbouring fields', /^https:\/\/[^\s"{}[\]]+$/.test(prettyRes.updatedReleases[0] || ''));

    section('Live GitHub API (skipped if offline)');
    const liveReleasesText = await fetchLiveReleases();
    if (liveReleasesText === null) {
        console.log('  skip  Could not reach the GitHub releases API - skipping live comparison');
    } else {
        let liveRes;
        let threw = false;
        try {
            liveRes = await run(liveReleasesText, { appVersion: '0.0.1' });
        } catch (e) {
            threw = true;
        }
        check('Parses the live API response without throwing', !threw);
        check('Every matched download URL is well-formed and unquoted', !threw && liveRes.updatedReleases.every(function (url) {
            return /^https:\/\/[^\s"{}[\]]+$/.test(url);
        }));

        // Assert the detected tag against the newest matching release from the parsed payload
        // itself, so this checks the answer and not just that the output happens to look well-formed
        if (!threw) {
            const baseAppPattern = /windows|electron|kiwixwebapp_/i;
            const liveReleasesJson = JSON.parse(liveReleasesText);
            const expectedRelease = liveReleasesJson.find(function (release) {
                return (release.assets || []).some(function (asset) {
                    return baseAppPattern.test(asset.browser_download_url || '');
                });
            });
            check('Detected tag matches the newest matching release in the parsed payload',
                !!expectedRelease && liveRes.updateTag === expectedRelease.tag_name);
        }

        // The Accept-header behaviour documented on fetchLiveReleases is exactly the assumption
        // this fix rests on: assert the minified and pretty-printed shapes of the same live data
        // produce identical results, as a direct test of that invariant
        const liveReleasesTextWithAccept = await fetchLiveReleases(true);
        if (liveReleasesTextWithAccept !== null) {
            const liveResWithAccept = await run(liveReleasesTextWithAccept, { appVersion: '0.0.1' });
            check('Minified (no Accept header) and pretty-printed (Accept: */*) responses agree',
                liveResWithAccept.updateTag === liveRes.updateTag &&
                JSON.stringify(liveResWithAccept.updatedReleases) === JSON.stringify(liveRes.updatedReleases));
        }
    }

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
