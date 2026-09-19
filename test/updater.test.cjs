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
const assert = require('node:assert/strict');
const { describe, it } = require('node:test');
const { loadModuleSource } = require('./helpers.cjs');

const UPDATER_JS = path.join(__dirname, '..', 'www', 'js', 'lib', 'updater.js');
const updaterSource = loadModuleSource(UPDATER_JS);

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
 * GitHub serves both a pretty-printed (one field per line) and a fully minified shape of the
 * identical content, unpredictably, for identical requests a few minutes apart - it is not
 * selected by the Accept header, HTTP version or User-Agent. So this fetches once and the
 * caller derives the other shape locally with JSON.parse/JSON.stringify rather than relying on
 * two live fetches to land on different shapes.
 *
 * @returns {Promise<String|null>} The raw response text, or null if it could not be fetched
 */
function fetchLiveReleases () {
    return new Promise(function (resolve) {
        var headers = { 'User-Agent': 'kiwix-js-pwa-updater-test' };
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

describe('Minified JSON handling and multi-asset parsing', function () {
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

    it('detects highest version v4.0.0-E on minified JSON', async function () {
        const res = await run(minifiedPayload, { appVersion: '3.8.92-E' });
        assert.equal(res.updateTag, 'v4.0.0-E');
        assert.equal(res.updatedReleases[0], 'https://github.com/kiwix/kiwix-js-pwa/releases/download/v4.0.0-E/kiwix-electron-4.0.0-E.exe');
        assert.equal(res.updatedReleases.length, 2);
    });
});

describe('Channel matching logic', function () {
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

    it('prefers channel match (-E) when same underlying version exists', async function () {
        const res = await run(multiChannelPayload, { appVersion: '3.8.92-E' });
        assert.equal(res.updateTag, 'v3.9.5-E');
    });

    it('matches a non-channel client to the non-channel release', async function () {
        const res = await run(multiChannelPayload, { appVersion: '3.8.92' });
        assert.equal(res.updateTag, 'v3.9.5');
    });
});

describe('BaseApp packaging filter', function () {
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

    it('captures only the wikivoyage asset for the wikivoyage packaged app', async function () {
        const res = await run(packagedReleases, { appVersion: '3.8.0', packagedFile: 'wikivoyage_en_all.zim' });
        assert.equal(res.updatedReleases.length, 1);
        assert.match(res.updatedReleases[0], /wikivoyage/);
    });

    it('captures only the wikimed asset for the WikiMed packaged app', async function () {
        const res = await run(packagedReleases, { appVersion: '3.8.0', packagedFile: 'wikimed_en_all.zim' });
        assert.equal(res.updatedReleases.length, 1);
        assert.match(res.updatedReleases[0], /wikimed/);
    });

    it('returns undefined updateTag when already on latest version', async function () {
        const res = await run(packagedReleases, { appVersion: '3.9.0' });
        assert.equal(res.updateTag, undefined);
    });
});

describe('Malformed response handling', function () {
    it('handles malformed JSON gracefully without throwing', async function () {
        const res = await run('not valid json {[[', { appVersion: '3.8.0' });
        assert.equal(res.updateTag, undefined);
        assert.equal(res.updatedReleases.length, 0);
    });

    it('handles an empty response gracefully', async function () {
        const res = await run('', { appVersion: '3.8.0' });
        assert.equal(res.updateTag, undefined);
        assert.equal(res.updatedReleases.length, 0);
    });
});

describe('Real API response shape (pretty-printed, one field per line)', function () {
    // GitHub's REST API pretty-prints its JSON with one field per line when the request carries
    // an Accept header - which is what actually reaches this code in production, since uiUtil.XHR
    // goes through XMLHttpRequest and browsers add `Accept: */*` to every request automatically.
    const prettyPrintedPayload = fs.readFileSync(path.join(__dirname, 'fixtures', 'github-releases-sample.json'), 'utf8');

    it('detects the highest version on a realistically pretty-printed response', async function () {
        const res = await run(prettyPrintedPayload, { appVersion: '3.8.92-E' });
        assert.equal(res.updateTag, 'v4.0.0-E');
        assert.match(res.updatedReleases[0] || '', /^https:\/\/[^\s"{}[\]]+$/);
    });

    it('does not corrupt the download URL with JSON punctuation from neighbouring fields', async function () {
        const res = await run(prettyPrintedPayload, { appVersion: '3.8.92-E' });
        assert.match(res.updatedReleases[0] || '', /^https:\/\/[^\s"{}[\]]+$/);
    });

    // Real flavour assets (e.g. kiwix-js-wikivoyage-3.8.2-E-arm64.nsis.7z) don't contain
    // "electron"/"windows"/"kiwixwebapp_", so they must not be picked up by a default-build
    // check, and a flavour check must only pick up its own flavour's asset.
    it('captures only the wikivoyage asset from the fixture for the wikivoyage packagedFile', async function () {
        const res = await run(prettyPrintedPayload, { appVersion: '3.8.92-E', packagedFile: 'wikivoyage_en_all_maxi.zim' });
        assert.equal(res.updatedReleases.length, 1);
        assert.match(res.updatedReleases[0], /wikivoyage/);
    });

    it('captures only the wikimed asset from the fixture for the WikiMed packagedFile', async function () {
        const res = await run(prettyPrintedPayload, { appVersion: '3.8.92-E', packagedFile: 'wikimed_en_all_maxi.zim' });
        assert.equal(res.updatedReleases.length, 1);
        assert.match(res.updatedReleases[0], /wikimed/);
    });

    it('does not pick up flavour assets on a default (non-flavour) check of the fixture', async function () {
        const res = await run(prettyPrintedPayload, { appVersion: '3.8.92-E' });
        assert.ok(res.updatedReleases.every(function (url) { return !/wikivoyage|wikimed/.test(url); }));
    });
});

describe('Minified/pretty-printed equivalence (fixture, always runs offline)', function () {
    // Derive both JSON shapes locally from the same parsed data, rather than depending on the
    // network to hand back both shapes for the same content (see the live section below for why).
    const prettyPrintedPayload = fs.readFileSync(path.join(__dirname, 'fixtures', 'github-releases-sample.json'), 'utf8');
    const fixtureParsed = JSON.parse(prettyPrintedPayload);
    const fixtureAsMinified = JSON.stringify(fixtureParsed);
    const fixtureAsPretty = JSON.stringify(fixtureParsed, null, 2) + '\n';

    it('derives a single-line minified fixture shape', function () {
        assert.equal(fixtureAsMinified.split('\n').length, 1);
    });

    it('derives a multi-line pretty-printed fixture shape', function () {
        assert.ok(fixtureAsPretty.split('\n').length > 10);
    });

    it('agrees between minified and pretty-printed fixture shapes', async function () {
        const fixtureMinRes = await run(fixtureAsMinified, { appVersion: '3.8.92-E' });
        const fixturePrettyRes = await run(fixtureAsPretty, { appVersion: '3.8.92-E' });
        assert.equal(fixtureMinRes.updateTag, fixturePrettyRes.updateTag);
        assert.equal(JSON.stringify(fixtureMinRes.updatedReleases), JSON.stringify(fixturePrettyRes.updatedReleases));
    });
});

describe('Live GitHub API (skipped if offline)', function () {
    it('parses the live API response without throwing, and agrees across JSON shapes', async function (t) {
        const liveReleasesText = await fetchLiveReleases();
        if (liveReleasesText === null) {
            t.skip('Could not reach the GitHub releases API');
            return;
        }

        const liveRes = await run(liveReleasesText, { appVersion: '0.0.1' });
        assert.ok(liveRes.updatedReleases.every(function (url) {
            return /^https:\/\/[^\s"{}[\]]+$/.test(url);
        }));

        // Assert the detected tag against the newest matching release from the parsed payload
        // itself, so this checks the answer and not just that the output happens to look well-formed
        const baseAppPattern = /windows|electron|kiwixwebapp_/i;
        const liveReleasesJson = JSON.parse(liveReleasesText);
        const expectedRelease = liveReleasesJson.find(function (release) {
            return (release.assets || []).some(function (asset) {
                return baseAppPattern.test(asset.browser_download_url || '');
            });
        });
        assert.ok(expectedRelease);
        assert.equal(liveRes.updateTag, expectedRelease.tag_name);

        // Derive both JSON shapes locally from this single fetch instead of relying on a
        // second live fetch to happen to land on a different shape (see fetchLiveReleases doc)
        const liveAsMinified = JSON.stringify(liveReleasesJson);
        const liveAsPretty = JSON.stringify(liveReleasesJson, null, 2) + '\n';
        assert.equal(liveAsMinified.split('\n').length, 1);
        assert.ok(liveAsPretty.split('\n').length > 10);

        const liveMinRes = await run(liveAsMinified, { appVersion: '0.0.1' });
        const livePrettyRes = await run(liveAsPretty, { appVersion: '0.0.1' });
        assert.equal(liveMinRes.updateTag, livePrettyRes.updateTag);
        assert.equal(JSON.stringify(liveMinRes.updatedReleases), JSON.stringify(livePrettyRes.updatedReleases));
    });
});

describe('Consecutive invocation idempotency', function () {
    it('detects an identical update on a second call without state leakage', async function () {
        const minifiedPayload = JSON.stringify([
            {
                tag_name: 'v4.0.0-E',
                html_url: 'https://github.com/kiwix/kiwix-js-pwa/releases/tag/v4.0.0-E',
                assets: [
                    { name: 'kiwix-electron-4.0.0-E.exe', browser_download_url: 'https://github.com/kiwix/kiwix-js-pwa/releases/download/v4.0.0-E/kiwix-electron-4.0.0-E.exe' }
                ]
            }
        ]);
        const firstCall = await run(minifiedPayload, { appVersion: '3.8.92-E' });
        const secondCall = await run(minifiedPayload, { appVersion: '3.8.92-E' });
        assert.equal(firstCall.updateTag, 'v4.0.0-E');
        assert.equal(secondCall.updateTag, 'v4.0.0-E');
    });
});
