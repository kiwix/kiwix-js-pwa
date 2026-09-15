/**
 * reset.js : Provide utilities for resetting the app to a fresh state
 * Copyright 2024 Jaifroid and contributors
 * License GPL v3:
 *
 * This file is part of Kiwix.
 *
 * Kiwix is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Kiwix is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Kiwix (file LICENSE-GPLv3.txt).  If not, see <http://www.gnu.org/licenses/>
 */

'use strict';

/* global params, assetsCache */
/* eslint-disable indent */

import uiUtil from './uiUtil.js';

/**
 * Performs a full app reset, deleting all caches and settings
 * Or, if a parameter is supplied, deletes or disables the object
 * @param {String} object Optional name of the object to disable or delete ('cookie', 'localStorage', 'cacheAPI')
 */
function reset (object) {
    function performReset () {
        const promises = [];

        // 1. Clear localStorage
        if (!object || object === 'localStorage') {
            if (/localStorage/.test(assetsCache.capability)) {
                promises.push(new Promise(resolve => {
                    localStorage.clear();
                    console.debug('All Local Storage settings were deleted...');
                resolve();
                }));
            } else {
                console.debug('Local Storage is not available...');
            }
        }

        // 2. Clear sessionStorage
        if (!object || object === 'sessionStorage') {
            promises.push(new Promise(resolve => {
                sessionStorage.clear();
                console.debug('All Session Storage settings were deleted...');
                resolve();
            }));
        }

        // 3. Clear all IndexedDB databases on the origin
        // DEV: This deliberately deletes every database, not only those with a kiwix prefix, because a prefix filter
        // would silently miss any database renamed in a future version [kiwix-js #1413]. The old code here deleted
        // params.indexedDB, which is never set, so kiwix-assetsCache and the ReplayWorker's databases survived a reset
        if (!object || object === 'indexedDB') {
            if (/indexedDB/.test(assetsCache.capability)) {
                promises.push(getIndexedDBNames().then(function (dbNames) {
                    return Promise.all(dbNames.map(deleteIndexedDB));
                }).then(function () {
                    console.debug('All IndexedDB databases were deleted...');
                }).catch(function (err) {
                    console.error('Error deleting IndexedDB databases:', err);
                }));
            }
        }

        // 4. Clear all Cache API caches on the origin (no filter, for the same reason as above)
        // DEV: We read the names directly rather than asking the Service Worker, which only reports the current app and
        // assets caches, and cannot report anything at all when no Service Worker is controlling the page
        if (!object || object === 'cacheAPI') {
            if ('caches' in window) {
                promises.push(caches.keys().then(function (cacheNames) {
                    return Promise.all(cacheNames.map(function (cacheName) {
                        console.debug('Deleting cache ' + cacheName + '...');
                        return caches.delete(cacheName);
                    }));
                }).then(function () {
                    console.debug('All Cache API caches were deleted...');
                }).catch(function (err) {
                    console.error('Error deleting Cache API caches:', err);
                }));
            } else {
                console.debug('Cache API is not available.');
            }
        }

        // 5. Clear any Origin Private File System Archives
        // DEV: Method is currently behind a flag, so wait till fully implemented
        // if (!object || object === 'OPFS') {
        //     if (navigator && navigator.storage && 'getDirectory' in navigator.storage) {
        //         promises.push(new Promise((resolve) => {
        //             navigator.storage.getDirectory().then(function (handle) {
        //                 handle.remove({ recursive: true }).then(function () {
        //                     console.debug('All OPFS archives were deleted...');
        //                     resolve();
        //                 }).catch(function (err) {
        //                     console.error('Error removing OPFS archives:', err);
        //                     resolve();
        //                 });
        //             }).catch(function (err) {
        //                 console.error('Error accessing OPFS directory:', err);
        //                 resolve();
        //             });
        //         }));
        //     }
        // }

        return Promise.all(promises).then(function () {
            if (!object || params.appCache) {
                reloadApp();
            }
        });
    }

    // If no specific object was specified, ask for confirmation
    if (object) {
        return performReset();
    } else {
        return uiUtil.systemAlert(
            '<p><b>WARNING:</b> This will reset the app to a freshly installed state, deleting all app caches,' +
            ' and settings! (Archives stored in the OPFS will be preserved.)<b></p><p>Make sure you have an Internet connection</b>' +
            ' if this is an offline PWA, because it will be erased and reloaded.</p>',
            'Warning!',
            true
        ).then(function (confirm) {
            if (confirm) return performReset();
            console.debug('User cancelled');
            return Promise.resolve();
        });
    }
}

// Gets the names of all IndexedDB databases on the origin. indexedDB.databases() is not available in older browsers
// (e.g. Firefox before 126), so there we fall back to the names we know about: our own assets cache, and the database in
// which the ReplayWorker keeps its list of Zimit collections (each collection's own database will be missed)
function getIndexedDBNames () {
    if (window.indexedDB.databases) {
        return window.indexedDB.databases().then(function (dbs) {
            return dbs.map(function (db) { return db.name; }).filter(Boolean);
        });
    }
    return Promise.resolve([params.cacheIDB, 'collDB']);
}

// Deletes a single IndexedDB database, returning a Promise that always resolves, so that one failure cannot hold up the
// reset. NB if another connection to the database is still open, the deletion is blocked, but it stays queued and
// completes as soon as that connection closes. A page reload closes the page's own connections, but not one held by the
// Service Worker, which is why the Service Worker closes its connection to collDB on versionchange [kiwix-js-pwa #957]
function deleteIndexedDB (dbName) {
    return new Promise(function (resolve) {
        console.debug('Deleting IndexedDB database ' + dbName + '...');
        var request = window.indexedDB.deleteDatabase(dbName);
        request.onsuccess = function () {
            resolve();
        };
        request.onerror = function (err) {
            console.error('Error deleting IndexedDB database ' + dbName + ':', err);
            resolve();
        };
        request.onblocked = function () {
            console.warn('Deletion of IndexedDB database ' + dbName + ' is blocked by an open connection, and will complete on reload');
            resolve();
        };
    });
}

// Gets cache names from Service Worker, as we cannot rely on having them in params.cacheNames
function getCacheNames (callback) {
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
        var channel = new MessageChannel();
        channel.port1.onmessage = function (event) {
            var names = event.data;
            callback(names);
        };
        navigator.serviceWorker.controller.postMessage({
            action: 'getCacheNames'
        }, [channel.port2]);
    } else {
        callback(null);
    }
}

// Deregisters all Service Workers and reboots the app
function reloadApp () {
    // Store params for reload
    var uriParams = '';
    if (~window.location.href.indexOf(params.PWAServer) && params.referrerExtensionURL) {
        uriParams = '?allowInternetAccess=true&contentInjectionMode=serviceworker';
        uriParams += '&referrerExtensionURL=' + encodeURIComponent(params.referrerExtensionURL);
    }
    // Function to perform the actual reload
    var reboot = function () {
        // Disable beforeunload interceptor
        params.interceptBeforeUnload = false;
        // The page may have no Service Worker controlling it: there is none registered yet on a first launch or in
        // Restricted mode, and the registrations were in any case just unregistered above. Without this test the
        // throw was caught below, which called reboot() a second time, throwing again uncaught and leaving the app
        // sitting there unreset. Nothing is waiting to skip in that state anyway, so go straight to the reload.
        if (navigator.serviceWorker && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({ action: 'skipWaiting' });
        }
        // Force reload from server, bypassing cache
        console.debug('Performing hard reload...');
        window.location.href = location.origin + location.pathname + uriParams;
    };
    if (navigator && navigator.serviceWorker) {
        console.debug('Deregistering Service Workers...');
        return navigator.serviceWorker.getRegistrations().then(function (registrations) {
                if (!registrations.length) {
                    return Promise.resolve();
                }
                return Promise.all(
                    registrations.map(registration => registration.unregister())
                );
            }).then(function () {
                console.debug('Service Workers cleanup complete');
                // Adding a small delay before reboot to ensure cleanup
                return new Promise(resolve => setTimeout(resolve, 200));
            }).then(reboot).catch(function (err) {
                console.error('SW deregistration failed:', err);
                reboot();
            });
    }

    return Promise.resolve().then(reboot);
}

export default {
    reset: reset,
    reloadApp: reloadApp,
    getCacheNames: getCacheNames
};
