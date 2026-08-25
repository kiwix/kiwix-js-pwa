#!/usr/bin/env node
/**
 * Checks Service Worker cache cleanup logic during activate in service-worker.js.
 *
 * Usage: npm test
 */

'use strict';

const fs = require('fs');
const path = require('path');

const SW_JS = path.join(__dirname, '..', 'service-worker.js');
const swSource = fs.readFileSync(SW_JS, 'utf8');

/**
 * Simulates the activate event handler cache cleanup in service-worker.js
 *
 * @param {Array<String>} initialCaches List of initial cache names in CacheStorage
 * @param {String} appVersion Current application version
 * @returns {Promise<Array<String>>} Remaining cache names after activate event processing
 */
function runActivateCleanup (initialCaches, appVersion) {
    return new Promise(function (resolve) {
        var currentCaches = new Set(initialCaches);
        var deletedCaches = [];

        var caches = { // eslint-disable-line no-unused-vars
            keys: function () {
                return Promise.resolve(Array.from(currentCaches));
            },
            delete: function (cacheName) {
                deletedCaches.push(cacheName);
                currentCaches.delete(cacheName);
                return Promise.resolve(true);
            }
        };

        var APP_CACHE = 'kiwix-appCache-' + appVersion; // eslint-disable-line no-unused-vars
        var appCachePrefix = APP_CACHE.replace(/^([^\d]+).+/, '$1'); // eslint-disable-line no-unused-vars
        // Extract the map callback or caches.keys block
        var filterMatch = swSource.match(/if\s*\(\s*cacheName\.startsWith\(appCachePrefix\)\s*&&\s*cacheName\s*!==\s*APP_CACHE\s*\)\s*\{[\s\S]*?return caches\.delete\(cacheName\);[\s\S]*?\}/);
        if (!filterMatch) {
            throw new Error('Could not find cache cleanup filter condition in service-worker.js');
        }

        // Execute cleanup logic using the exact condition from service-worker.js
        caches.keys().then(function (cacheNames) {
            return Promise.all(
                cacheNames.map(function (cacheName) {
                    // eslint-disable-next-line no-eval
                    if (eval('cacheName.startsWith(appCachePrefix) && cacheName !== APP_CACHE')) {
                        return caches.delete(cacheName);
                    }
                    return undefined;
                })
            );
        }).then(function () {
            resolve({ remaining: Array.from(currentCaches), deleted: deletedCaches });
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
    section('Obsolete app cache cleanup on update');
    const allCaches = [
        'kiwix-appCache-3.8.0',
        'kiwix-appCache-3.8.91',
        'kiwix-appCache-3.8.92-E',
        'kiwixjs-assetsCache',
        'third-party-workbox',
        'other-app-cache'
    ];

    const res = await runActivateCleanup(allCaches, '3.8.92-E');

    check('Deletes older kiwix-appCache-3.8.0', res.deleted.includes('kiwix-appCache-3.8.0'));
    check('Deletes older kiwix-appCache-3.8.91', res.deleted.includes('kiwix-appCache-3.8.91'));
    check('Preserves active kiwix-appCache-3.8.92-E', res.remaining.includes('kiwix-appCache-3.8.92-E') && !res.deleted.includes('kiwix-appCache-3.8.92-E'));

    section('Preservation of ASSETS_CACHE and origin caches');
    check('Preserves kiwixjs-assetsCache (ASSETS_CACHE)', res.remaining.includes('kiwixjs-assetsCache') && !res.deleted.includes('kiwixjs-assetsCache'));
    check('Preserves third-party-workbox cache', res.remaining.includes('third-party-workbox') && !res.deleted.includes('third-party-workbox'));
    check('Preserves other-app-cache on same origin', res.remaining.includes('other-app-cache') && !res.deleted.includes('other-app-cache'));
    check('Total deleted count is exactly the 2 obsolete app caches', res.deleted.length === 2);

    section('Idempotency on clean start');
    const cleanStartCaches = [
        'kiwix-appCache-3.8.92-E',
        'kiwixjs-assetsCache'
    ];
    const cleanRes = await runActivateCleanup(cleanStartCaches, '3.8.92-E');
    check('No caches deleted when only active app cache and assets cache exist', cleanRes.deleted.length === 0 && cleanRes.remaining.length === 2);

    if (failures > 0) {
        console.error('\n' + failures + ' of ' + total + ' checks failed.');
        process.exit(1);
    } else {
        console.log('\nAll ' + total + ' checks passed\n');
    }
}

runTests();
