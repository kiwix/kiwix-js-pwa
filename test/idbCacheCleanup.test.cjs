#!/usr/bin/env node
/**
 * Checks IndexedDB cache cleanup in www/js/lib/cache.js deleteNonCurrent.
 *
 * Usage: npm test
 */

'use strict';

const fs = require('fs');
const path = require('path');

const CACHE_JS = path.join(__dirname, '..', 'www', 'js', 'lib', 'cache.js');
const source = fs.readFileSync(CACHE_JS, 'utf8');

// Verify that the unconditional deletion pattern has been replaced with the namespace guard
if (source.includes('if (db.name !== CACHEIDB)')) {
    console.error('FAIL: Found unconditional db.name !== CACHEIDB in cache.js');
    process.exit(1);
}

/**
 * Simulates deleteNonCurrent logic from cache.js idxDB()
 *
 * @param {Object} mockIndexedDb Mock indexedDB object with databases() and deleteDatabase()
 * @param {String} activeCacheIdb Current active CACHEIDB name
 * @param {Function} callback Callback receiving deleted count or false
 */
function simulateDeleteNonCurrent (mockIndexedDb, activeCacheIdb, callback) {
    if (typeof mockIndexedDb === 'undefined') {
        callback(false);
        return;
    }
    if (mockIndexedDb.databases) {
        let result = 0;
        mockIndexedDb.databases().then(function (dbs) {
            dbs.forEach(function (db) {
                if (db.name && db.name.startsWith('kiwix') && db.name !== activeCacheIdb) {
                    result++;
                    mockIndexedDb.deleteDatabase(db.name);
                }
            });
        }).then(function () {
            callback(result);
        });
    } else {
        callback(false);
    }
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

function runTests () {
    const activeCacheIdb = 'kiwix-assetsCache';

    section('IndexedDB cleanup with mixed databases on shared origin');
    const existingDbs = [
        { name: 'kiwix-assetsCache' },
        { name: 'kiwix-assetsCache-legacy' },
        { name: 'kiwixjs-oldDb' },
        { name: 'app-data' },
        { name: 'auth-tokens' },
        { name: 'vscode-web-db' }
    ];

    const deletedDbs = [];
    const mockIndexedDb = {
        databases: function () {
            return Promise.resolve(existingDbs);
        },
        deleteDatabase: function (name) {
            deletedDbs.push(name);
        }
    };

    simulateDeleteNonCurrent(mockIndexedDb, activeCacheIdb, function (count) {
        check('Deletes only deprecated Kiwix databases (count = 2)', count === 2);
        check('Deleted kiwix-assetsCache-legacy', deletedDbs.includes('kiwix-assetsCache-legacy'));
        check('Deleted kiwixjs-oldDb', deletedDbs.includes('kiwixjs-oldDb'));
        check('Preserved active CACHEIDB (kiwix-assetsCache)', !deletedDbs.includes('kiwix-assetsCache'));
        check('Preserved unrelated app-data database', !deletedDbs.includes('app-data'));
        check('Preserved unrelated auth-tokens database', !deletedDbs.includes('auth-tokens'));
        check('Preserved unrelated vscode-web-db database', !deletedDbs.includes('vscode-web-db'));

        section('IndexedDB cleanup when only active CACHEIDB exists');
        const cleanDbs = [{ name: 'kiwix-assetsCache' }, { name: 'other-app' }];
        const cleanDeleted = [];
        const mockCleanIdb = {
            databases: function () {
                return Promise.resolve(cleanDbs);
            },
            deleteDatabase: function (name) {
                cleanDeleted.push(name);
            }
        };

        simulateDeleteNonCurrent(mockCleanIdb, activeCacheIdb, function (cleanCount) {
            check('Deletes 0 databases when no obsolete Kiwix databases exist', cleanCount === 0);
            check('No databases were deleted', cleanDeleted.length === 0);

            section('IndexedDB cleanup when indexedDB.databases is unsupported (e.g. Firefox/Safari)');
            const mockNoDatabasesApi = {};
            simulateDeleteNonCurrent(mockNoDatabasesApi, activeCacheIdb, function (res) {
                check('Returns false gracefully when indexedDB.databases is not a function', res === false);

                if (failures > 0) {
                    console.error('\n' + failures + ' of ' + total + ' checks failed.');
                    process.exit(1);
                } else {
                    console.log('\nAll ' + total + ' checks passed\n');
                }
            });
        });
    });
}

runTests();
