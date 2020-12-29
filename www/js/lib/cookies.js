'use strict';
define([], function() {
/*\
|*|
|*|  :: cookies.js ::
|*|
|*|  A complete cookies reader/writer framework with full unicode support.
|*|
|*|  https://developer.mozilla.org/en-US/docs/DOM/document.cookie
|*|
|*|  This framework is released under the GNU Public License, version 3 or later.
|*|  http://www.gnu.org/licenses/gpl-3.0-standalone.html
|*|
|*|  Syntaxes:
|*|
|*|  * docCookies.setItem(name, value[, end[, path[, domain[, secure]]]])
|*|  * docCookies.getItem(name)
|*|  * docCookies.removeItem(name[, path])
|*|  * docCookies.hasItem(name)
|*|  * docCookies.keys()
|*|
\*/

// Test for cookie support
var storeType = 'cookie';
document.cookie = 'kiwixCookie=working;expires=Fri, 31 Dec 9999 23:59:59 GMT';
var kiwixCookie = /kiwixCookie=working/i.test(document.cookie);
if (kiwixCookie) {
    document.cookie = 'kiwixCookie=broken;expires=Fri, 31 Dec 9999 23:59:59 GMT';
    kiwixCookie = !/kiwixCookie=working/i.test(document.cookie);
}
document.cookie = 'kiwixCookie=;expires=Thu, 01 Jan 1970 00:00:00 GMT';
if (!kiwixCookie) {
    // Cookies appear to be blocked, so test for localStorage support
    var result = false;
    try {
        result = 'localStorage' in window && window['localStorage'] !== null;
    } catch (e) {
        console.log('LocalStorage is not supported!');
    }
    if (result) storeType = 'local_storage';
}
console.log('Test2: storeType: ' + storeType);

var docCookies = {
  getItem: function (sKey) {
    if (!sKey) {
      return null;
    }
    if (params.storeType !== 'local_storage') {
      return decodeURIComponent(document.cookie.replace(new RegExp("(?:(?:^|.*;)\\s*" + encodeURIComponent(sKey).replace(/[-.+*]/g, "\\$&") + "\\s*\\=\\s*([^;]*).*$)|^.*$"), "$1")) || null;
    } else {
      return localStorage.getItem(keyPrefix + sKey);
    }
  },
  setItem: function (sKey, sValue, vEnd, sPath, sDomain, bSecure) {
    if (params.storeType !== 'local_storage') {
      if (!sKey || /^(?:expires|max-age|path|domain|secure)$/i.test(sKey)) {
        return false;
      }
      var sExpires = "";
      if (vEnd) {
        switch (vEnd.constructor) {
          case Number:
            sExpires = vEnd === Infinity ? "; expires=Fri, 31 Dec 9999 23:59:59 GMT" : "; max-age=" + vEnd;
            break;
          case String:
            sExpires = "; expires=" + vEnd;
            break;
          case Date:
            sExpires = "; expires=" + vEnd.toUTCString();
            break;
        }
      }
      document.cookie = encodeURIComponent(sKey) + "=" + encodeURIComponent(sValue) + sExpires + (sDomain ? "; domain=" + sDomain : "") + (sPath ? "; path=" + sPath : "") + (bSecure ? "; secure" : "");
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
      document.cookie = encodeURIComponent(sKey) + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT" + (sDomain ? "; domain=" + sDomain : "") + (sPath ? "; path=" + sPath : "");
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
      return (new RegExp("(?:^|;\\s*)" + encodeURIComponent(sKey).replace(/[-.+*]/g, "\\$&") + "\\s*\\=")).test(document.cookie);
    } else {
      return localStorage.getItem(keyPrefix + sKey) === null ? false : true;
    }
  },
  _cookieKeys: function () {
    var aKeys = document.cookie.replace(/((?:^|\s*;)[^=]+)(?=;|$)|^\s*|\s*(?:=[^;]*)?(?:\1|$)/g, "").split(/\s*(?:=[^;]*)?;\s*/);
    for (var nLen = aKeys.length, nIdx = 0; nIdx < nLen; nIdx++) {
      aKeys[nIdx] = decodeURIComponent(aKeys[nIdx]);
    }
    return aKeys;
  }
};

  return {
    getItem: docCookies.getItem,
    setItem: docCookies.setItem,
    removeItem: docCookies.removeItem,
    hasItem: docCookies.hasItem
  };
});