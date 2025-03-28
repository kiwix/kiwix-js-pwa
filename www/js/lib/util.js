﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿/**
 * util.js : Utility functions
 *
 * Copyright 2013-2023 Mossroy, Jaifroid and contributors
 * Licence GPL v3:
 *
 * This file is part of Kiwix.
 *
 * Kiwix is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public Licence as published by
 * the Free Software Foundation, either version 3 of the Licence, or
 * (at your option) any later version.
 *
 * Kiwix is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public Licence for more details.
 *
 * You should have received a copy of the GNU General Public Licence
 * along with Kiwix (file LICENSE-GPLv3.txt).  If not, see <http://www.gnu.org/licenses/>
 */

/* global fs, params, appstate */

'use strict';

var regExpFindStringParts = /(?:^|.+?)(?:[\s$£€\uFFE5^+=`~<>{}[\]|\u3000-\u303F!-#%-\x2A,-/:;\x3F@\x5B-\x5D_\x7B}\u00A1\u00A7\u00AB\u00B6\u00B7\u00BB\u00BF\u037E\u0387\u055A-\u055F\u0589\u058A\u05BE\u05C0\u05C3\u05C6\u05F3\u05F4\u0609\u060A\u060C\u060D\u061B\u061E\u061F\u066A-\u066D\u06D4\u0700-\u070D\u07F7-\u07F9\u0830-\u083E\u085E\u0964\u0965\u0970\u0AF0\u0DF4\u0E4F\u0E5A\u0E5B\u0F04-\u0F12\u0F14\u0F3A-\u0F3D\u0F85\u0FD0-\u0FD4\u0FD9\u0FDA\u104A-\u104F\u10FB\u1360-\u1368\u1400\u166D\u166E\u169B\u169C\u16EB-\u16ED\u1735\u1736\u17D4-\u17D6\u17D8-\u17DA\u1800-\u180A\u1944\u1945\u1A1E\u1A1F\u1AA0-\u1AA6\u1AA8-\u1AAD\u1B5A-\u1B60\u1BFC-\u1BFF\u1C3B-\u1C3F\u1C7E\u1C7F\u1CC0-\u1CC7\u1CD3\u2010-\u2027\u2030-\u2043\u2045-\u2051\u2053-\u205E\u207D\u207E\u208D\u208E\u2329\u232A\u2768-\u2775\u27C5\u27C6\u27E6-\u27EF\u2983-\u2998\u29D8-\u29DB\u29FC\u29FD\u2CF9-\u2CFC\u2CFE\u2CFF\u2D70\u2E00-\u2E2E\u2E30-\u2E3B\u3001-\u3003\u3008-\u3011\u3014-\u301F\u3030\u303D\u30A0\u30FB\uA4FE\uA4FF\uA60D-\uA60F\uA673\uA67E\uA6F2-\uA6F7\uA874-\uA877\uA8CE\uA8CF\uA8F8-\uA8FA\uA92E\uA92F\uA95F\uA9C1-\uA9CD\uA9DE\uA9DF\uAA5C-\uAA5F\uAADE\uAADF\uAAF0\uAAF1\uABEB\uFD3E\uFD3F\uFE10-\uFE19\uFE30-\uFE52\uFE54-\uFE61\uFE63\uFE68\uFE6A\uFE6B\uFF01-\uFF03\uFF05-\uFF0A\uFF0C-\uFF0F\uFF1A\uFF1B\uFF1F\uFF20\uFF3B-\uFF3D\uFF3F\uFF5B\uFF5D\uFF5F-\uFF65]+|$)/g;

/**
 * Generates an array of strings with all possible combinations of first-letter or all-letter case transformations
 * If caseMatchType is not 'full', then only combinations of first-letter cases for each word are calculated
 * If caseMatchType is 'full', then all-uppercase combinations of each word are added to the variations array
 * NB may produce duplicate strings if string begins with punctuation or if it is in a language with no case
 * @param {String} string The string to be converted
 * @param {String} caseMatchType ('basic'|'full') The type (complexity) of case variations to calculate
 * @return {Array} An array containing strings with all possible combinations of case types
 */
function allCaseFirstLetters (string, caseMatchType) {
    if (string) {
        var comboArray = [];
        // Split string into parts beginning with first word letters
        var strParts = string.match(regExpFindStringParts);
        // Prevent a full search if we have more than 6 string parts
        if (strParts.length > 6) caseMatchType = 'basic';
        // Set the base (binary or ternary) according to the complexity of the search
        var base = caseMatchType === 'full' ? 3 : 2;
        // If n = strParts.length, then the number of possible case combinations (numCombos) is base ^ n
        // For *basic* case calculation: think of numCombos as a binary number of n bits, with each bit representing lcase (0) or ucase (1)
        // For *full* case calculation: think of numCombos as a tertiary base number, e.g. 000, 111, 222,
        // with each bit representing all-lowercase (0), First-Letter-Uppercase (1) or ALL-UPPERCASE (2)
        var numCombos = Math.pow(base, strParts.length);
        // Prevent more than 1024 combinations (2^10) being calculated
        if (numCombos > 1024) numCombos = 1024;
        var typeCase, mixedTypeCaseStr, bitmask, caseBit;
        // Iterate through every possible combination, starting with (base ^ n) - 1 and decreasing; we go from high to low,
        // because title case (e.g. binary 1111) is more common than all lowercase (0000) so will be found first
        for (var i = numCombos; i--;) {
            mixedTypeCaseStr = '';
            bitmask = 1;
            for (var j = 0; j < strParts.length; j++) {
                // Get modulus of division (this is equivalent to bitwise AND for different bases)
                // caseBit will be 0, 1 or 2 (latter only for 'full' case calcualation)
                caseBit = ~~(i / bitmask % base);
                if (caseBit === 2) {
                    // All uppercase
                    typeCase = strParts[j].toLocaleUpperCase();
                } else {
                    // Modify only first letter
                    typeCase = strParts[j].replace(/^./, function (m) {
                        // 1 = uppercase, 0 = lowercase
                        return caseBit ? m.toLocaleUpperCase() : m.toLocaleLowerCase();
                    });
                }
                mixedTypeCaseStr += typeCase;
                // Shift bitmask to the next higher bit
                bitmask *= base;
            }
            comboArray.push(mixedTypeCaseStr);
        }
        return comboArray;
    } else {
        return [string];
    }
}

/**
 * Generates an array of Strings, where all duplicates have been removed
 * (without changing the order)
 * It is optimized for small arrays.
 * Source : http://codereview.stackexchange.com/questions/60128/removing-duplicates-from-an-array-quickly
 * @param {Array} array of String
 * @returns {Array} same array of Strings, without duplicates
 */
function removeDuplicateStringsInSmallArray (array) {
    var unique = [];
    for (var i = 0; i < array.length; i++) {
        var current = array[i];
        if (unique.indexOf(current) < 0) {
            unique.push(current);
        }
    }
    return unique;
}

/**
 * Utility function : return true if the given string ends with the suffix
 * @param {String} str
 * @param {String} suffix
 * @returns {Boolean}
 */
function endsWith (str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
}

/**
 * Read a float encoded in 2 bytes
 * @param {Array} byteArray
 * @param {Integer} firstIndex
 * @param {Boolean} littleEndian (optional)
 * @returns {Float}
 */
function readFloatFrom4Bytes (byteArray, firstIndex, littleEndian) {
    var dataView = new DataView(byteArray.buffer, firstIndex, 4);
    var float = dataView.getFloat32(0, littleEndian);
    return float;
}

/**
 * Reads a Uint8Array from the given file starting at byte offset begin until end
 * @param {File} file The file object to be read
 * @param {Integer} begin The offset in <File> at which to begin reading
 * @param {Integer} end The byte at whcih to stop reading (reads up to and including end - 1)
 * @returns {Promise<Uint8Array>} A Promise for an array buffer with the read data
 */
function readFileSlice (file, begin, end) {
    if (file.slice && 'arrayBuffer' in Blob.prototype) {
        // DEV: This method uses the native arrayBuffer method of Blob, if available, as it eliminates
        // the need to use FileReader and set up event listeners; it also uses the method's native Promise
        // rather than setting up potentially hundreds of new Q promises for small byte range reads
        // Also uses Native FS handle
        return file.slice(begin, end).arrayBuffer().then(function (buffer) {
            return new Uint8Array(buffer);
        });
    } else {
        return new Promise(function (resolve, reject) {
            if (file.readMode === 'electron') {
                // We are reading a packaged file and have to use Electron fs.read (so we don't have to pick the file)
                fs.open(file.path, 'r', function (err, fd) {
                    if (err) {
                        reject(err);
                    } else {
                        var size = end - begin;
                        var arr = typeof Buffer !== 'undefined' && Buffer.alloc(size) || new Uint8Array(size);
                        fs.read(fd, arr, 0, size, begin, function (err, bytesRead, data) {
                            if (err) reject(err);
                            fs.close(fd, function (err) {
                                if (err) reject(err);
                                else return resolve(data);
                            });
                        });
                    }
                });
            } else {
                var reader = new FileReader();
                reader.readAsArrayBuffer(file.slice(begin, end));
                reader.addEventListener('load', function (e) {
                    resolve(new Uint8Array(e.target.result));
                });
                reader.addEventListener('error', reject);
                reader.addEventListener('abort', reject);
            }
        });
    }
}

/**
 * Performs a binary search on indices begin <= i < end, utilizing query(i) to return where to
 * continue the search.
 * If lowerBound is not set, returns only indices where query returns 0 and null otherwise.
 * If lowerBound is set, returns the smallest index where query does not return > 0.
 * @param {Integer} begin The beginning of the search window
 * @param {Integer} end The end of the search window
 * @param {Function} query The query to run to test the current point in the window
 * @param {Boolean} lowerBound Determines the type of search
 * @returns {Promise} Promise for the lowest dirEntry that fulfils (or fails to fulfil) the query
 */
function binarySearch (begin, end, query, lowerBound) {
    if (end <= begin) {
        return lowerBound ? begin : null;
    }
    var mid = Math.floor((begin + end) / 2);
    return query(mid).then(function (decision) {
        if (decision < 0) {
            return binarySearch(begin, mid, query, lowerBound);
        } else if (decision > 0) {
            return binarySearch(mid + 1, end, query, lowerBound);
        } else {
            return mid;
        }
    });
}

/**
 * Does a "left shift" on an integer.
 * It is equivalent to int << bits (which works only on 32-bit integers),
 * but compatible with 64-bit integers.
 *
 * @param {Integer} int
 * @param {Integer} bits
 * @returns {Integer}
 */
function leftShift (int, bits) {
    return int * Math.pow(2, bits);
}

/**
 * Converts base 64 code to Uint6
 * From https://developer.mozilla.org/en-US/docs/Glossary/Base64
 * @param {Integer} nChr Numerical character code
 * @returns {Integer} Converted character code
 */
function b64ToUint6 (nChr) {
    return nChr > 64 && nChr < 91
        ? nChr - 65
        : nChr > 96 && nChr < 123
        ? nChr - 71
        : nChr > 47 && nChr < 58
        ? nChr + 4
        : nChr === 43
        ? 62
        : nChr === 47
        ? 63
        : 0;
}

/**
 * Recommended rewrite of the faulty .btoa() function in JavaScript because of the problem with UTF-8-encoded data
 * From https://developer.mozilla.org/en-US/docs/Glossary/Base64
 * @param {String} sBase64 Base 64 encoded string
 * @param {Integer} nBlocksSize Optional block size
 * @returns {Uint8Array} A Uint8Array containing the converted data
 */
function base64DecToArr (sBase64, nBlocksSize) {
    var sB64Enc = sBase64.replace(/[^A-Za-z0-9+/]/g, ''),
        nInLen = sB64Enc.length,
        nOutLen = nBlocksSize ? Math.ceil((nInLen * 3 + 1 >> 2) / nBlocksSize) * nBlocksSize : nInLen * 3 + 1 >> 2,
        taBytes = new Uint8Array(nOutLen);
    for (var nMod3, nMod4, nUint24 = 0, nOutIdx = 0, nInIdx = 0; nInIdx < nInLen; nInIdx++) {
        nMod4 = nInIdx & 3;
        nUint24 |= b64ToUint6(sB64Enc.charCodeAt(nInIdx)) << 6 * (3 - nMod4);
        if (nMod4 === 3 || nInLen - nInIdx === 1) {
            for (nMod3 = 0; nMod3 < 3 && nOutIdx < nOutLen; nMod3++, nOutIdx++) {
                taBytes[nOutIdx] = nUint24 >>> (16 >>> nMod3 & 24) & 255;
            }
            nUint24 = 0;
        }
    }
    return taBytes;
}

/**
 Converts a dataURI to Uint8Array
 * @param {String} dataURI The data URI to convert
 * @returns {Uint8Array} A Uint8Array with the converted buffer
 */
function dataURItoUint8Array (dataURI) {
    var parsedString = dataURI.match(/^data:([^,]*),(.*)/i);
    if (parsedString && /base64/i.test(parsedString[1])) {
        return base64DecToArr(parsedString[2]);
    } else {
        var byteString = decodeURI(parsedString[2]);
        var ab = [];
        for (var i = 0; i < byteString.length; i++) {
            ab[i] = byteString.charCodeAt(i);
        }
        return new Uint8Array(ab);
    }
}

/**
 * Detect whether the browser supports the webkitdirectory attribute on input elements
 * @returns {Boolean} True if the webkitdirectory attribute is supported, false otherwise
 */
function webkitdirectorySupported () {
    return 'webkitdirectory' in document.createElement('input') && !/iOS|Android/.test(params.appType);
}

/**
 * Matches the outermost balanced constructs and their contents
 * even if they have nested balanced constructs within them
 * e.g., outer HTML of a pair of opening and closing tags.
 * Left and right constructs must not be equal. Backreferences in right are not supported.
 * Double backslash (\\) any backslash characters, e.g. '\\b'.
 * If you do not set the global flag ('g'), then only contents of first construct will be returned.
 * Adapted from http://blog.stevenlevithan.com/archives/javascript-match-recursive-regexp
 * (c) 2007 Steven Levithan - MIT Licence https://opensource.org/licenses/MIT
 *
 * @param {string} str - String to be searched.
 * @param {string} left - Regex string of opening pattern to match, e.g. '<table\\b[^>]*>' matches <table> or <table ...>.
 * @param {string} right - Regex string of closing pattern to match, e.g. '</table>'. Must not be equal to left.
 * @param {string} flags - Regex flags, if any, such as 'gi' (= match globally and case insensitive).
 * @param {string} prefix - An optional Regex string that must be present before <left> for the regex to match
 * @returns {Array} An array of matches.
 */
function matchOuter (str, left, right, flags, prefix) {
    flags = flags || '';
    var f = flags.replace(/g/g, ''),
        g = flags.indexOf('g') > -1,
        l = new RegExp(left, f),
        // Creates a neutral middle value if left is a well-formed regex for an html tag with attributes
        mid = /^(<[^\\]+)\\/.test(left) ? left.replace(/^(<[^\\]+)[\S\s]+$/, '$1') + '\\b[^>]*>' : '',
        x = new RegExp((prefix ? prefix : '') + (mid ? mid : left) + '|' + right, 'g' + f),
        a = [],
        t, s, m;
    mid = mid ? new RegExp(mid, f) : l;

    do {
        t = 0;
        while (m = x.exec(str)) {
            if ((t ? mid : l).test(m[0])) {
                if (!t++) s = m.index;
            } else if (t) {
                if (!--t) {
                    a.push(str.slice(s, x.lastIndex));
                    if (!g) return a;
                }
            }
        }
    } while (t && (x.lastIndex = s));

    return a;
}

/**
 * Matches the contents of innermost HTML elements even if they are nested inside other elements.
 * Left and right strings must be opening and closing HTML or XML elements. Backreferences are not supported.
 * If you do not set the global flag ('g'), then only contents of first match will be returned.
 * Double backslash (\\) any backslash characters, e.g. '\\b'.
 * Adapted from http://blog.stevenlevithan.com/archives/match-innermost-html-element
 *
 * @param {string} str - String to be searched.
 * @param {string} left - Regex string of opening element to match, e.g. '<table\\b[^>]*>', must include '<' and '>'.
 * @param {string} right - Regex string of closing element to match, e.g. '</table>'.
 * @param {string} flags - Regex flags, if any, such as 'gi' (= match globally and case insensitive).
 * @returns {Array} A RegExp array of matches.
 */
function matchInner (str, left, right, flags) {
    flags = flags || '';
    var x = new RegExp(left + '(?:(?=([^<]+))\\1|<(?!' + left.replace(/^</, '') + '))*?' + right, flags);
    return str.match(x);
}

// Defines an object and functions for searching and highlighting text in a node
//
// Original JavaScript code by Chirp Internet: www.chirp.com.au
// Please acknowledge use of this code by including this header.
// For documentation see: http://www.the-art-of-web.com/javascript/search-highlight/
function Hilitor (node, tag) {
    var targetNode = node || document.body;
    var hiliteTag = tag || 'EM';
    var skipTags = new RegExp('^(?:' + hiliteTag + '|SCRIPT|FORM)$');
    var colors = ['#ff6', '#a0ffff', '#9f9', '#f99', '#f6f'];
    var className = 'hilitor';
    var wordColor = [];
    var colorIdx = 0;
    var matchRegex = '';
    // Add any symbols that may prefix a start string and don't match \b (word boundary)
    var leadingSymbols = "‘'\"“([«¿¡!*-";
    var openLeft = false;
    var openRight = false;

    this.setMatchType = function (type) {
        switch (type) {
        case 'left':
            this.openLeft = false;
            this.openRight = true;
            break;

        case 'right':
            this.openLeft = true;
            this.openRight = false;
            break;

        case 'open':
            this.openLeft = this.openRight = true;
            break;

        default:
            this.openLeft = this.openRight = false;
        }
    };

    function addAccents (input) {
        var retval = input;
        retval = retval.replace(/([ao])e/ig, '$1');
        retval = retval.replace(/\\u00[CE][0124]/ig, 'a');
        retval = retval.replace(/\\u00E7/ig, 'c');
        retval = retval.replace(/\\u00E[89AB]|\\u00C[9A]/ig, 'e');
        retval = retval.replace(/\\u00[CE][DEF]/ig, 'i');
        retval = retval.replace(/\\u00[DF]1/ig, 'n');
        retval = retval.replace(/\\u00[FD][346]/ig, 'o');
        retval = retval.replace(/\\u00F[9BC]/ig, 'u');
        retval = retval.replace(/\\u00FF/ig, 'y');
        retval = retval.replace(/\\u00DF/ig, 's');
        retval = retval.replace(/'/ig, "['’‘]");
        retval = retval.replace(/c/ig, '[cç]');
        retval = retval.replace(/e/ig, '[eèéêë]');
        retval = retval.replace(/a/ig, '([aàâäá]|ae)');
        retval = retval.replace(/i/ig, '[iîïíì]');
        retval = retval.replace(/n/ig, '[nñ]');
        retval = retval.replace(/o/ig, '([oôöó]|oe)');
        retval = retval.replace(/u/ig, '[uùûüú]');
        retval = retval.replace(/y/ig, '[yÿ]');
        retval = retval.replace(/s/ig, '(ss|[sß])');
        return retval;
    }

    this.setRegex = function (input) {
        input = input.replace(/\\([^u]|$)/g, '$1');
        // Replace any spaces with regex OR
        input = input.replace(/\s+/g, '|');
        // Remove leading and trailing
        input = input.replace(/^\||\|$/g, '');
        if (input) {
            var re = '(' + input + ')';
            if (!this.openLeft) re = '(?:^|[\\b\\s' + leadingSymbols + '])' + re;
            if (!this.openRight) re = re + '(?:[\\b\\s]|$)';
            matchRegex = new RegExp(re, 'i');
            return true;
        }
        return false;
    };

    this.getRegex = function () {
        var retval = matchRegex.toString();
        retval = retval.replace(/(^\/|\(\?:[^\)]+\)|\/i$)/g, '');
        return retval;
    };

    this.countFullMatches = function (input) {
        if (node === undefined || !node) return;
        var strippedText = node.innerHTML.replace(/<title[^>]*>[\s\S]*<\/title>/i, '');
        strippedText = node.innerHTML.replace(/<[^>]*>\s*/g, ' ');
        if (!strippedText) return 0;
        strippedText = strippedText.replace(/(?:&nbsp;|\r?\n|[.,;:?!¿¡-])+/g, ' ');
        strippedText = strippedText.replace(/\s+/g, ' ');
        if (!strippedText.length) return 0;
        input = input.replace(/[\s.,;:?!¿¡-]+/g, ' ');
        var inputMatcher = new RegExp(input, 'ig');
        var matches = strippedText.match(inputMatcher);
        if (matches) return matches.length;
        else return 0;
    };

    this.countPartialMatches = function () {
        if (node === undefined || !node) return;
        var matches = matchInner(node.innerHTML, '<' + hiliteTag + '\\b[^>]*class="hilitor"[^>]*>', '</' + hiliteTag + '>', 'gi');
        if (matches) return matches.length
        else return 0;
    };

    this.scrollFrom = 0;

    this.lastScrollValue = '';

    this.scrollToFullMatch = function (input, scrollFrom) {
        if (node === undefined || !node) return;
        if (!input) return;
        // Normalize spaces
        input = input.replace(/\s+/g, ' ');
        var inputWords = input.split(' ');
        var testInput = addAccents(input);
        testInput = new RegExp(testInput, 'i');
        var hilitedNodes = node.getElementsByClassName(className);
        var subNodes = [];
        var start = scrollFrom || 0;
        start = start >= hilitedNodes.length ? 0 : start;
        var end = start + inputWords.length;
        for (start; start < hilitedNodes.length; start++) {
            for (var f = start; f < end; f++) {
                if (f == hilitedNodes.length) break;
                subNodes.push(hilitedNodes[f].innerHTML);
            }
            var nodeText = subNodes.join(' ');
            if (testInput.test(nodeText)) {
                var iframeWindow = document.getElementById('articleContent').contentWindow;
                if (appstate.isReplayWorkerAvailable) {
                    iframeWindow = document.getElementById('articleContent').contentDocument.getElementById('replay_iframe').contentWindow;
                }
                var root = iframeWindow.document.documentElement;
                var zoomFactor = 'zoom' in root.style && params.relativeFontSize && !window.MSBlobBuilder
                    ? params.relativeFontSize / 100 : 1;
                // Convert both the element position and viewport height to zoomed coordinates
                var elementPosition = hilitedNodes[start].offsetTop * zoomFactor;
                var viewportOffset = window.innerHeight / 4;
                var scrollOffset = elementPosition - viewportOffset;
                if ('scrollBehavior' in document.documentElement.style) {
                    iframeWindow.scrollTo({
                        top: scrollOffset,
                        behavior: 'smooth'
                    });
                } else {
                    iframeWindow.scrollTo(0, scrollOffset);
                }
                break;
            } else {
                if (f == hilitedNodes.length && scrollFrom > 0) {
                    // Restart search from top of page
                    scrollFrom = 0;
                    start = 0;
                }
            }
            subNodes = [];
            end++;
        }
        return start + inputWords.length;
    }

    // recursively apply word highlighting
    this.hiliteWords = function (node) {
        if (node === undefined || !node) return;
        if (!matchRegex) return;
        if (skipTags.test(node.nodeName)) return;

        if (node.hasChildNodes()) {
            for (var i = 0; i < node.childNodes.length; i++)
                this.hiliteWords(node.childNodes[i]);
        }
        if (node.nodeType == 3) { // NODE_TEXT
            var nv, regs;
            if ((nv = node.nodeValue) && (regs = matchRegex.exec(nv))) {
                if (!wordColor[regs[1].toLowerCase()]) {
                    wordColor[regs[1].toLowerCase()] = colors[colorIdx++ % colors.length];
                }

                var match = document.createElement(hiliteTag);
                match.appendChild(document.createTextNode(regs[1]));
                match.style.setProperty('background-color', wordColor[regs[1].toLowerCase()], 'important');
                match.style.fontStyle = 'inherit';
                match.style.color = '#000';
                match.className = className;

                var after;
                // In case of leading whitespace or other symbols
                var leadR = new RegExp('^[\\s' + leadingSymbols + ']');
                if (leadR.test(regs[0])) {
                    after = node.splitText(regs.index + 1);
                } else {
                    after = node.splitText(regs.index);
                }
                after.nodeValue = after.nodeValue.substring(regs[1].length);
                node.parentNode.insertBefore(match, after);
            }
        };
    };

    // remove highlighting
    this.remove = function () {
        if (typeof node.innerHTML == 'undefined') return;
        var arr = node.getElementsByClassName(className), el;
        while (arr.length && (el = arr[0])) {
            var parent = el.parentNode;
            parent.replaceChild(el.firstChild, el);
            parent.normalize();
        }
    };

    // start highlighting at target node
    this.apply = function (input) {
        this.remove();
        if (input === undefined || !(input = input.replace(/(^\s+|\s+$)/g, ''))) return;
        input = addAccents(input);
        input = convertCharStr2jEsc(input);
        if (this.setRegex(input)) {
            this.hiliteWords(targetNode);
        }
    };

    // added by Yanosh Kunsh to include utf-8 string comparison
    function dec2hex4 (textString) {
        var hexequiv = new Array('0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F');
        return hexequiv[(textString >> 12) & 0xF] + hexequiv[(textString >> 8) & 0xF] + hexequiv[(textString >> 4) & 0xF] + hexequiv[textString & 0xF];
    }

    function convertCharStr2jEsc (str, cstyle) {
        // Converts a string of characters to JavaScript escapes
        // str: sequence of Unicode characters
        var highsurrogate = 0;
        var suppCP;
        var pad;
        var n = 0;
        var outputString = '';
        for (var i = 0; i < str.length; i++) {
            var cc = str.charCodeAt(i);
            if (cc < 0 || cc > 0xFFFF) {
                outputString += '!Error in convertCharStr2UTF16: unexpected charCodeAt result, cc=' + cc + '!';
            }
            if (highsurrogate != 0) { // this is a supp char, and cc contains the low surrogate
                if (0xDC00 <= cc && cc <= 0xDFFF) {
                    suppCP = 0x10000 + ((highsurrogate - 0xD800) << 10) + (cc - 0xDC00);
                    if (cstyle) {
                        pad = suppCP.toString(16);
                        while (pad.length < 8) {
                            pad = '0' + pad;
                        }
                        outputString += '\\U' + pad;
                    } else {
                        suppCP -= 0x10000;
                        outputString += '\\u' + dec2hex4(0xD800 | (suppCP >> 10)) + '\\u' + dec2hex4(0xDC00 | (suppCP & 0x3FF));
                    }
                    highsurrogate = 0;
                    continue;
                } else {
                    outputString += 'Error in convertCharStr2UTF16: low surrogate expected, cc=' + cc + '!';
                    highsurrogate = 0;
                }
            }
            if (0xD800 <= cc && cc <= 0xDBFF) { // start of supplementary character
                highsurrogate = cc;
            } else { // this is a BMP character
                switch (cc) {
                case 0:
                    outputString += '\\0';
                    break;
                case 8:
                    outputString += '\\b';
                    break;
                case 9:
                    outputString += '\\t';
                    break;
                case 10:
                    outputString += '\\n';
                    break;
                case 13:
                    outputString += '\\r';
                    break;
                case 11:
                    outputString += '\\v';
                    break;
                case 12:
                    outputString += '\\f';
                    break;
                case 34:
                    outputString += '\\\"';
                    break;
                case 39:
                    outputString += '\\\'';
                    break;
                case 92:
                    outputString += '\\\\';
                    break;
                default:
                    if (cc > 0x1f && cc < 0x7F) {
                        outputString += String.fromCharCode(cc);
                    } else {
                        pad = cc.toString(16).toUpperCase();
                        while (pad.length < 4) {
                            pad = '0' + pad;
                        }
                        outputString += '\\u' + pad;
                    }
                }
            }
        }
        return outputString;
    }
}

// Does a forward search for el forward through next siblings, or up the DOM tree then forward
// Returns if fn(el) is true, or else keeps searching to end of DOM
function getClosestForward (el, fn) {
    return el && (fn(el) ? el : getClosestForward(el.nextElementSibling, fn)) ||
        el && (fn(el) ? el : getClosestForward(el.parentNode, fn));
}

// Does a reverse search for el back through previous siblings, or up the DOM tree then back
// Returns if fn(el) is true, or else keeps searching to top of DOM
function getClosestBack (el, fn) {
    return el && (fn(el) ? el : getClosestBack(el.previousElementSibling, fn)) ||
        el && (fn(el) ? el : getClosestBack(el.parentNode, fn));
}

// Create a closest function alternative because IE11 and others do not support closest
function closest (ele, s) {
    var cele = ele;
    var cmatches = Element.prototype.matches || Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector;
    do {
        if (cmatches.call(cele, s)) return cele;
        cele = cele.parentElement || cele.parentNode;
    } while (cele !== null && cele.nodeType === 1);
    return null;
}

/**
 * Queues Promise Factories* to be resolved or rejected sequentially. This helps to avoid overlapping Promise functions.
 * Primarily used by uiUtil.systemAlert, to prevent alerts showing while others are being displayed.
 *
 *   *A Promise Factory is merely a Promise wrapped in a function to prevent it from executing immediately. E.g. to use
 *   this function with a Promise, call it like this (or, more likely, use your own pre-wrapped Promise):
 *
 *      return util.PromiseQueue.enqueue(function () {
 *          return new Promise(function (resolve, reject) { ... });
 *      });
 *
 * Adapted from https://medium.com/@karenmarkosyan/how-to-manage-promises-into-dynamic-queue-with-vanilla-javascript-9d0d1f8d4df5
 *
 * @type {Object} PromiseQueue
 * @property {Function} enqueue Queues a Promise Factory. Call this function repeatedly to queue Promises sequentially
 * @param {Function<Promise>} promiseFactory A Promise wrapped in an ordinary function
 * @returns {Promise} A Promise that resolves or rejects with the resolved/rejected value of the Promise Factory
 */
var PromiseQueue = {
    _queue: [],
    _working: false,
    enqueue: function (promiseFactory) {
        var that = this;
        return new Promise(function (resolve, reject) {
            // Don't allow more than four dialogues to queue up
            if (that._queue.length >= 4) reject(new Error('PromiseQueue: queue length exceeded'));
            else that._queue.push({ promise: promiseFactory, resolve: resolve, reject: reject });
            if (!that._working) that._dequeue();
        });
    },
    _dequeue: function () {
        this._working = true;
        var deferred = this._queue.shift();
        if (!deferred) {
            this._working = false;
            return false;
        }
        var that = this;
        return deferred.promise().then(function (val) {
            deferred.resolve(val);
            return that._dequeue();
        }).catch(function (err) {
            deferred.reject(err);
            return that._dequeue();
        });
    }
};

export default {
    allCaseFirstLetters: allCaseFirstLetters,
    removeDuplicateStringsInSmallArray: removeDuplicateStringsInSmallArray,
    endsWith: endsWith,
    readFloatFrom4Bytes: readFloatFrom4Bytes,
    readFileSlice: readFileSlice,
    binarySearch: binarySearch,
    dataURItoUint8Array: dataURItoUint8Array,
    leftShift: leftShift,
    matchOuter: matchOuter,
    matchInner: matchInner,
    webkitdirectorySupported: webkitdirectorySupported,
    Hilitor: Hilitor,
    getClosestForward: getClosestForward,
    getClosestBack: getClosestBack,
    closest: closest,
    PromiseQueue: PromiseQueue
};
