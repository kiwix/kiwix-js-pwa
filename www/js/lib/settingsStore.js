﻿'use strict';

/* global params */
/* eslint-disable indent */

var regexpCookieKeysToMigrate = new RegExp([
  'contentInjectionMode', 'lastSelectedArchive', 'lastSelectedArchivePath',
  'imageDisplay', 'useMathJax', 'appVersion',
  'listOfArchives', 'lastPageVisit', 'cssCache', 'cssUITheme',
  'cssTheme', 'cssSource', 'removePageMaxWidth', 'hideActiveContentWarning',
  'hideToolbars', 'allowHTMLExtraction', 'openAllSections', 'PWAInstalled',
  'lastPageLoad', 'showFileSelectors'
].join('|'));

/**
 * A list of deprecated keys that should be removed. Add any further keys to the list of strings separated by a comma.
 * @type {Array}
 */
var deprecatedKeys = [
  'lastContentInjectionMode', 'lastPageHTML', 'lastPageVisit', 'version', 'useCache'
];

/**
 * The prefix that will be added to keys when stored in localStorage: this is used to prevent
 * potential collision of key names with localStorage keys used by code inside ZIM archives
 * It is set in init.js because it is needed early in app loading
 * @type {String}
 */
var keyPrefix = params.keyPrefix;

// Tests for available Storage APIs (document.cookie or localStorage) and returns the best available of these
function getBestAvailableStorageAPI () {
  // DEV: In FF extensions, cookies are blocked since at least FF 68.6 but possibly since FF 55 [kiwix-js #612]
  var type = 'none';
  // First test for localStorage API support
  var localStorageTest;
  try {
    localStorageTest = 'localStorage' in window && window['localStorage'] !== null;
    // DEV: Above test returns true in IE11 running from file:// protocol, but attempting to write a key to
    // localStorage causes an exception; so to test fully, we must now attempt to write and remove a test key
    if (localStorageTest) {
      localStorage.setItem('tempKiwixStorageTest', '');
      localStorage.removeItem('tempKiwixStorageTest');
    }
  } catch (e) {
    localStorageTest = false;
  }
  // Now test for document.cookie API support
  document.cookie = 'tempKiwixCookieTest=working; expires=Fri, 31 Dec 9999 23:59:59 GMT; SameSite=Strict';
  var kiwixCookieTest = /tempKiwixCookieTest=working/.test(document.cookie);
  // Remove test value by expiring the key
  document.cookie = 'tempKiwixCookieTest=; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict';
  if (kiwixCookieTest) type = 'cookie';
  // Prefer localStorage if supported due to some platforms removing cookies once the session ends in some contexts
  if (localStorageTest) type = 'local_storage';
  // If both cookies and localStorage are supported, and document.cookie contains keys to migrate,
  // migrate settings to use localStorage
  if (kiwixCookieTest && localStorageTest && regexpCookieKeysToMigrate.test(document.cookie)) _migrateStorageSettings();
  // Remove any deprecated keys
  deprecatedKeys.forEach(function (key) {
    if (localStorageTest) localStorage.removeItem(keyPrefix + key);
    settingsStore.removeItem(key); // Because this runs before we have returned a store type, this will remove from cookie too
  });
  // Note that if this function returns 'none', the cookie implementations below will run anyway. This is because storing a cookie
  // does not cause an exception even if cookies are blocked in some contexts, whereas accessing localStorage may cause an exception
  return type;
}

var settingsStore = {
  getItem: function (sKey) {
    if (!sKey) {
      return null;
    }
    if (params.storeType !== 'local_storage') {
      return decodeURIComponent(document.cookie.replace(new RegExp('(?:(?:^|.*;)\\s*' + encodeURIComponent(sKey).replace(/[-.+*]/g, '\\$&') + '\\s*\\=\\s*([^;]*).*$)|^.*$'), '$1')) || null;
    } else {
      return localStorage.getItem(keyPrefix + sKey);
    }
  },
  setItem: function (sKey, sValue, vEnd, sPath, sDomain, bSecure) {
    if (params.storeType !== 'local_storage') {
      if (!sKey || /^(?:expires|max-age|path|domain|secure)$/i.test(sKey)) {
        return false;
      }
      var sExpires = '';
      if (vEnd) {
        switch (vEnd.constructor) {
          case Number:
            sExpires = vEnd === Infinity ? '; expires=Fri, 31 Dec 9999 23:59:59 GMT' : '; max-age=' + vEnd;
            break;
          case String:
            sExpires = '; expires=' + vEnd;
            break;
          case Date:
            sExpires = '; expires=' + vEnd.toUTCString();
            break;
        }
      }
      document.cookie = encodeURIComponent(sKey) + '=' + encodeURIComponent(sValue) + sExpires + (sDomain ? '; domain=' + sDomain : '') + (sPath ? '; path=' + sPath : '') + (bSecure ? '; secure' : '');
    } else {
      localStorage.setItem(keyPrefix + sKey, sValue);
    }
    return true;
  },
  removeItem: function (sKey, sPath, sDomain) {
    if (!this.hasItem(sKey)) {
      return false;
    }
    if (params.storeType !== 'local_storage') {
      document.cookie = encodeURIComponent(sKey) + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT' + (sDomain ? '; domain=' + sDomain : '') + (sPath ? '; path=' + sPath : '');
    } else {
      localStorage.removeItem(keyPrefix + sKey);
    }
    return true;
  },
  hasItem: function (sKey) {
    if (!sKey) {
      return false;
    }
    if (params.storeType !== 'local_storage') {
      return (new RegExp('(?:^|;\\s*)' + encodeURIComponent(sKey).replace(/[-.+*]/g, '\\$&') + '\\s*\\=')).test(document.cookie);
    } else {
      return localStorage.getItem(keyPrefix + sKey) !== null;
    }
  },
  _cookieKeys: function () {
    // Disabling linter check because this is library code
    // eslint-disable-next-line no-useless-backreference
    var aKeys = document.cookie.replace(/((?:^|\s*;)[^=]+)(?=;|$)|^\s*|\s*(?:=[^;]*)?(?:\1|$)/g, '').split(/\s*(?:=[^;]*)?;\s*/);
    for (var nLen = aKeys.length, nIdx = 0; nIdx < nLen; nIdx++) {
      aKeys[nIdx] = decodeURIComponent(aKeys[nIdx]);
    }
    return aKeys;
  }
};

// One-off migration of storage settings from cookies to localStorage
function _migrateStorageSettings () {
  console.log('Migrating Settings Store from cookies to localStorage...');
  var cookieKeys = settingsStore._cookieKeys();
  // Note that because migration occurs before setting params.storeType, settingsStore.getItem() will get the item from
  // document.cookie instead of localStorage, which is the intended behaviour
  for (var i = 0; i < cookieKeys.length; i++) {
    if (regexpCookieKeysToMigrate.test(cookieKeys[i])) {
      var migratedKey = keyPrefix + cookieKeys[i];
      localStorage.setItem(migratedKey, settingsStore.getItem(cookieKeys[i]));
      settingsStore.removeItem(cookieKeys[i]);
      console.log('- ' + migratedKey);
    }
  }
  console.log('Migration done.');
}

export default {
  getItem: settingsStore.getItem,
  setItem: settingsStore.setItem,
  removeItem: settingsStore.removeItem,
  hasItem: settingsStore.hasItem,
  getBestAvailableStorageAPI: getBestAvailableStorageAPI
};
