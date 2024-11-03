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
    var performReset = function () {
        // 1. Clear any cookie entries
        if (!object || object === 'cookie') {
            var regexpCookieKeys = /(?:^|;)\s*([^=]+)=([^;]*)/ig;
            var currentCookie = document.cookie;
            var foundCrumb = false;
            var cookieCrumb = regexpCookieKeys.exec(currentCookie);
            while (cookieCrumb !== null) {
                // DEV: Note that we don't use the keyPrefix in legacy cookie support
                foundCrumb = true;
                // This expiry date will cause the browser to delete the cookie crumb on next page refresh
                document.cookie = cookieCrumb[1] + '=;expires=Thu, 21 Sep 1979 00:00:01 UTC;';
                cookieCrumb = regexpCookieKeys.exec(currentCookie);
            }
            if (foundCrumb) console.debug('All cookie keys were expired...');
        }

        // 2. Clear any localStorage settings
        if (!object || object === 'localStorage') {
            if (/localStorage/.test(assetsCache.capability)) {
                localStorage.clear();
                console.debug('All Local Storage settings were deleted...');
            }
        }

        // 3. Clear any IndexedDB entries
        if (!object || object === 'indexedDB') {
            if (/indexedDB/.test(assetsCache.capability)) {
                window.indexedDB.deleteDatabase(params.indexedDB);
                console.debug('All IndexedDB entries were deleted...');
            }
        }

        // 4. Clear any (remaining) Cache API caches
        if (!object || object === 'cacheAPI') {
            getCacheNames(function (cacheNames) {
                if (cacheNames && !cacheNames.error) {
                    var cnt = 0;
                    for (var cacheName in cacheNames) {
                        cnt++;
                        caches.delete(cacheNames[cacheName]).then(function () {
                            cnt--;
                            if (!cnt) {
                                // All caches deleted
                                console.debug('All Cache API caches were deleted...');
                                // Reload if user performed full reset or if appCache is needed
                                if (!object || params.appCache) reloadApp();
                            }
                        });
                    }
                } else {
                    console.debug('No Cache API caches were in use (or we do not have access to the names).');
                    // All operations complete, reload if user performed full reset or if appCache is needed
                    if (!object || params.appCache) reloadApp();
                }
            });
        }

        // 5. Clear any Origin Private File System Archives
        // DEV: Method is currently behind a flag, so wait till fully implemented
        // if (!object || object === 'OPFS') {
        //   if (navigator && navigator.storage && 'getDirectory' in navigator.storage) {
        //     navigator.storage.getDirectory().then(function (handle) {
        //       handle.remove({ recursive: true }).then(function () {
        //         console.debug('All OPFS archives were deleted...');
        //       });
        //     });
        //   }
        // }
    };
    // If no specific object was specified, we are doing a general reset, so ask user for confirmation
    if (object) performReset();
    else {
        uiUtil.systemAlert('<p><b>WARNING:</b> This will reset the app to a freshly installed state, deleting all app caches,' +
      // ' <b>Archives stored in the Private File System</b>,' +
      ' and settings! (Archives stored in the OPFS will be preserved.)<b></p><p>Make sure you have an Internet connection</b>' +
      ' if this is an offline PWA, because it will be erased and reloaded.</p>', 'Warning!', true).then(function (confirm) {
            if (confirm) performReset();
            else console.debug('User cancelled');
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
        // Force reload from server, bypassing cache
        console.debug('Performing hard reload...');
        window.location.href = location.origin + location.pathname + uriParams +
            (uriParams ? '&' : '?') + 'cache=' + Date.now();
    };
    if (navigator && navigator.serviceWorker) {
        console.debug('Deregistering Service Workers...');
        navigator.serviceWorker.getRegistrations().then(function (registrations) {
            if (!registrations.length) {
                reboot();
                return;
            }
            // Wait for all service workers to unregister
            return Promise.all(
                registrations.map(registration => registration.unregister())
            ).then(function () {
                console.debug('All Service Workers unregistered');
                // Small delay to ensure cleanup
                setTimeout(reboot, 100);
            });
        }).catch(function (err) {
            console.error('SW deregistration failed:', err);
            reboot();
        });
    } else {
        reboot();
    }
}
export default {
    reset: reset,
    reloadApp: reloadApp,
    getCacheNames: getCacheNames
}
