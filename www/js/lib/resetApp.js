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
            promises.push(new Promise(resolve => {
                localStorage.clear();
                console.debug('All Local Storage settings were deleted...');
                resolve();
            }));
        }

        // 2. Clear sessionStorage
        if (!object || object === 'sessionStorage') {
            promises.push(new Promise(resolve => {
                sessionStorage.clear();
                console.debug('All Session Storage settings were deleted...');
                resolve();
            }));
        }

        // 3. Clear IndexedDB
        if (!object || object === 'indexedDB') {
            if (/indexedDB/.test(assetsCache.capability)) {
                promises.push(new Promise(resolve => {
                    window.indexedDB.deleteDatabase(params.indexedDB);
                    console.debug('All IndexedDB entries were deleted...');
                    resolve();
                }));
            }
        }

        // 4. Clear Cache API caches
        if (!object || object === 'cacheAPI') {
            promises.push(new Promise((resolve) => {
                getCacheNames(function (cacheNames) {
                    if (cacheNames && !cacheNames.error) {
                        Promise.all(
                            Object.values(cacheNames).map(cacheName =>
                                caches.delete(cacheName)
                                    .catch(err => console.error(`Failed to delete cache ${cacheName}:`, err))
                            )
                        ).then(function () {
                            console.debug('All Cache API caches were deleted...');
                            resolve();
                        }).catch(function (err) {
                            console.error('Error clearing caches:', err);
                            resolve();
                        });
                    } else {
                        console.debug('No Cache API caches were in use.');
                        resolve();
                    }
                });
            }));
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
        navigator.serviceWorker.controller.postMessage({ action: 'skipWaiting' });
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
}
