/**
 * util.js : Utility functions
 * 
 * Copyright 2013-2014 Mossroy and contributors
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

define(['q', 'filecache'], function(Q, FileCache) {

    /**
     * Utility function : return true if the given string ends with the suffix
     * @param {String} str
     * @param {String} suffix
     * @returns {Boolean}
     */
    function endsWith(str, suffix) {
        return str.indexOf(suffix, str.length - suffix.length) !== -1;
    }

    /**
     * Returns the same String with the first letter in upper-case
     * @param {String} string
     * @returns {String}
     */
    function ucFirstLetter(string) {
        if (string && string.length >= 1) {
            return string[0].toLocaleUpperCase() + string.slice(1);
        } else {
            return string;
        }
    }

    /**
     * Returns the same String with the first letter in lower-case
     * @param {String} string
     * @returns {String}
     */
    function lcFirstLetter(string) {
        if (string) {
            if (string.length >= 1) {
                return string.charAt(0).toLocaleLowerCase() + string.slice(1);
            } else {
                return string;
            }
        } else {
            return string;
        }
    }

    /**
     * Returns the same String with the first letter of every word in upper-case
     * @param {String} string
     * @returns {String}
     */
    function ucEveryFirstLetter(string) {
        if (string) {
            return string.replace(/\b\w/g, function (m) {
                return m.toLocaleUpperCase();
            });
        } else {
            return string;
        }
    }

    /**
     * Generates an array of DirEntry, where all duplicates (same title) have been removed
     * (it also sorts them on their title)
     * 
     * @param {Array.<DirEntry>} array of DirEntry
     * @returns {Array.<DirEntry>} same array of DirEntry, without duplicates
     */
    function removeDuplicateTitlesInDirEntryArray(array) {
        array.sort(function (dirEntryA, dirEntryB) {
            if (dirEntryA.title < dirEntryB.title) return -1;
            if (dirEntryA.title > dirEntryB.title) return 1;
            return 0;
        });
        for (var i = 1; i < array.length;) {
            if (array[i - 1].title === array[i].title) {
                array.splice(i, 1);
            } else {
                i++;
            }
        }
        return array;
    }

    /**
     * Generates an array of Strings, where all duplicates have been removed
     * (without changing the order)
     * It is optimized for small arrays.
     * Source : http://codereview.stackexchange.com/questions/60128/removing-duplicates-from-an-array-quickly
     * 
     * @param {Array} array of String
     * @returns {Array} same array of Strings, without duplicates
     */
    function removeDuplicateStringsInSmallArray(array) {
        var unique = [];
        for (var i = 0; i < array.length; i++) {
            var current = array[i];
            if (unique.indexOf(current) < 0)
                unique.push(current);
        }
        return unique;
    }

    /**
     * Read an integer encoded in 4 bytes, little endian
     * @param {Array} byteArray
     * @param {Integer} firstIndex
     * @returns {Integer}
     */
    function readIntegerFrom4Bytes(byteArray, firstIndex) {
        var dataView = new DataView(byteArray.buffer, firstIndex, 4);
        var integer = dataView.getUint32(0, true);
        return integer;
    }

    /**
     * Read an integer encoded in 2 bytes, little endian
     * @param {Array} byteArray
     * @param {Integer} firstIndex
     * @returns {Integer}
     */
    function readIntegerFrom2Bytes(byteArray, firstIndex) {
        var dataView = new DataView(byteArray.buffer, firstIndex, 2);
        var integer = dataView.getUint16(0, true);
        return integer;
    }

    /**
     * Read a float encoded in 2 bytes
     * @param {Array} byteArray
     * @param {Integer} firstIndex
     * @param {Boolean} littleEndian (optional)
     * @returns {Float}
     */
    function readFloatFrom4Bytes(byteArray, firstIndex, littleEndian) {
        var dataView = new DataView(byteArray.buffer, firstIndex, 4);
        var float = dataView.getFloat32(0, littleEndian);
        return float;
    }

    /**
     * Convert a Uint8Array to a lowercase hex string
     * @param {Array} byteArray
     * @returns {String}
     */
    function uint8ArrayToHex(byteArray) {
        var s = '';
        var hexDigits = '0123456789abcdef';
        for (var i = 0; i < byteArray.length; i++) {
            var v = byteArray[i];
            s += hexDigits[(v & 0xff) >> 4];
            s += hexDigits[v & 0xf];
        }
        return s;
    }

    /**
     * Convert a Uint8Array to base64
     * TODO : might be replaced by btoa() built-in function? https://developer.mozilla.org/en-US/docs/Web/API/window.btoa
     * @param {Array} byteArray
     * @returns {String}
     */
    function uint8ArrayToBase64(byteArray) {
        var b64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
        var bits, h1, h2, h3, h4, i = 0;
        var enc = "";

        for (var i = 0; i < byteArray.length;) {
            bits = byteArray[i++] << 16;
            bits |= byteArray[i++] << 8;
            bits |= byteArray[i++];

            h1 = bits >> 18 & 0x3f;
            h2 = bits >> 12 & 0x3f;
            h3 = bits >> 6 & 0x3f;
            h4 = bits & 0x3f;

            enc += b64[h1] + b64[h2] + b64[h3] + b64[h4];
        }

        var r = byteArray.length % 3;

        return (r > 0 ? enc.slice(0, r - 3) : enc) + '==='.slice(r || 3);
    }

    /**
     * Reads a Uint8Array from the given file starting at byte offset begin and
     * for given size.
     * @param {File} file The file to read
     * @param {Integer} begin The first byte in the file to read
     * @param {Integer} size The number of bytes to read
     * @returns {Promise} Promise
     */
    function readFileSlice(file, begin, size) {
        return FileCache.read(file, begin, begin + size);
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
    function binarySearch(begin, end, query, lowerBound) {
        if (end <= begin)
            return lowerBound ? begin : null;
        var mid = Math.floor((begin + end) / 2);
        return query(mid).then(function(decision)
        {
            if (decision < 0)
                return binarySearch(begin, mid, query, lowerBound);
            else if (decision > 0)
                return binarySearch(mid + 1, end, query, lowerBound);
            else
                return mid;
        });
    }

    /**
     * Converts a Base64 Content to a Blob
     * From https://stackoverflow.com/questions/16245767/creating-a-blob-from-a-base64-string-in-javascript
     * 
     * @param {String} b64Data Base64-encoded data
     * @param {String} contentType
     * @param {Integer} sliceSize
     * @returns {Blob}
     */
    function b64toBlob(b64Data, contentType, sliceSize) {
        contentType = contentType || '';
        sliceSize = sliceSize || 512;

        var byteCharacters = atob(b64Data);
        var byteArrays = [];

        for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
            var slice = byteCharacters.slice(offset, offset + sliceSize);

            var byteNumbers = new Array(slice.length);
            for (var i = 0; i < slice.length; i++) {
                byteNumbers[i] = slice.charCodeAt(i);
            }

            var byteArray = new Uint8Array(byteNumbers);

            byteArrays.push(byteArray);
        }

        var blob = new Blob(byteArrays, { type: contentType });
        return blob;
    }

    /**
     * Converts a UInt Array to a UTF-8 encoded string
     * source : http://michael-rushanan.blogspot.de/2014/03/javascript-uint8array-hacks-and-cheat.html
     * 
     * @param {UIntArray} uintArray
     * @returns {String}
     */
    function uintToString(uintArray) {
        var s = '';
        for (var i = 0; i < uintArray.length; i++) {
            s += String.fromCharCode(uintArray[i]);
        }
        return s;
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
    function leftShift(int, bits) {
        return int * Math.pow(2, bits);
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
     * @returns {Array} An array of matches.
     */
    function matchOuter(str, left, right, flags) {
        flags = flags || "";
        var f = flags.replace(/g/g, ""),
            g = flags.indexOf("g") > -1,
            l = new RegExp(left, f),
            //Creates a neutral middle value if left is a well-formed regex for an html tag with attributes
            mid = /^(<[^\\]+)\\/.test(left) ? left.replace(/^(<[^\\]+)[\S\s]+$/, "$1") + '\\b[^>]*>' : "",
            x = new RegExp((mid ? mid : left) + "|" + right, "g" + f),
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
    function matchInner(str, left, right, flags) {
        flags = flags || "";
        var x = new RegExp(left + '(?:(?=([^<]+))\\1|<(?!' + left.replace(/^</, "") + '))*?' + right, flags);
        return str.match(x);
    }

    // Defines an object and functions for searching and highlighting text in a node
    //
    // Original JavaScript code by Chirp Internet: www.chirp.com.au
    // Please acknowledge use of this code by including this header.
    // For documentation see: http://www.the-art-of-web.com/javascript/search-highlight/
    function Hilitor(node, tag) {
        var targetNode = node || document.body;
        var hiliteTag = tag || "EM";
        var skipTags = new RegExp("^(?:" + hiliteTag + "|SCRIPT|FORM)$");
        var colors = ["#ff6", "#a0ffff", "#9f9", "#f99", "#f6f"];
        var className = "hilitor";
        var wordColor = [];
        var colorIdx = 0;
        var matchRegex = "";
        //Add any symbols that may prefix a start string and don't match \b (word boundary)
        var leadingSymbols = "‘'\"“([«¿¡!*-";
        var openLeft = false;
        var openRight = false;

        this.setMatchType = function (type) {
            switch (type) {
                case "left":
                    this.openLeft = false;
                    this.openRight = true;
                    break;

                case "right":
                    this.openLeft = true;
                    this.openRight = false;
                    break;

                case "open":
                    this.openLeft = this.openRight = true;
                    break;

                default:
                    this.openLeft = this.openRight = false;

            }
        };

        function addAccents(input) {
            var retval = input;
            retval = retval.replace(/([ao])e/ig, "$1");
            retval = retval.replace(/\\u00[CE][0124]/ig, "a");
            retval = retval.replace(/\\u00E7/ig, "c");
            retval = retval.replace(/\\u00E[89AB]|\\u00C[9A]/ig, "e");
            retval = retval.replace(/\\u00[CE][DEF]/ig, "i");
            retval = retval.replace(/\\u00[DF]1/ig, "n");
            retval = retval.replace(/\\u00[FD][346]/ig, "o");
            retval = retval.replace(/\\u00F[9BC]/ig, "u");
            retval = retval.replace(/\\u00FF/ig, "y");
            retval = retval.replace(/\\u00DF/ig, "s");
            retval = retval.replace(/'/ig, "['’‘]");
            retval = retval.replace(/c/ig, "[cç]");
            retval = retval.replace(/e/ig, "[eèéêë]");
            retval = retval.replace(/a/ig, "([aàâäá]|ae)");
            retval = retval.replace(/i/ig, "[iîïíì]");
            retval = retval.replace(/n/ig, "[nñ]");
            retval = retval.replace(/o/ig, "([oôöó]|oe)");
            retval = retval.replace(/u/ig, "[uùûüú]");
            retval = retval.replace(/y/ig, "[yÿ]");
            retval = retval.replace(/s/ig, "(ss|[sß])");
            return retval;
        }

        this.setRegex = function (input) {
            input = input.replace(/\\([^u]|$)/g, "$1");
            // Replace any spaces with regex OR
            input = input.replace(/\s+/g, "|");
            // Remove leading and trailing
            input = input.replace(/^\||\|$/g, "");
            if (input) {
                var re = "(" + input + ")";
                if (!this.openLeft) re = "(?:^|[\\b\\s" + leadingSymbols + "])" + re;
                if (!this.openRight) re = re + "(?:[\\b\\s]|$)";
                matchRegex = new RegExp(re, "i");
                return true;
            }
            return false;
        };

        this.getRegex = function () {
            var retval = matchRegex.toString();
            retval = retval.replace(/(^\/|\(\?:[^\)]+\)|\/i$)/g, "");
            return retval;
        };

        this.countFullMatches = function (input) {
            if (node === undefined || !node) return;
            var strippedText = node.innerHTML.replace(/<title[^>]*>[\s\S]*<\/title>/i, "");
            strippedText = node.innerHTML.replace(/<[^>]*>\s*/g, " ");
            if (!strippedText) return 0;
            strippedText = strippedText.replace(/(?:&nbsp;|\r?\n|[.,;:?!¿¡-])+/g, " ");
            strippedText = strippedText.replace(/\s+/g, " ");
            if (!strippedText.length) return 0;
            input = input.replace(/[\s.,;:?!¿¡-]+/g, " ");
            var inputMatcher = new RegExp(input, "ig");
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

        this.lastScrollValue = "";

        this.scrollToFullMatch = function (input, scrollFrom) {
            if (node === undefined || !node) return;
            if (!input) return;
            //Normalize spaces
            input = input.replace(/\s+/g, " ");
            var inputWords = input.split(" ");
            var testInput = addAccents(input);
            testInput = new RegExp(testInput, "i");
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
                var nodeText = subNodes.join(" ");
                if (testInput.test(nodeText)) {
                    //hilitedNodes[start].scrollIntoView(true);
                    $("#articleContent").contents().scrollTop($(hilitedNodes[start]).offset().top - window.innerHeight / 3);
                    break;
                } else {
                    if (f == hilitedNodes.length && scrollFrom > 0) {
                        //Restart search from top of page
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
                    match.style.setProperty("background-color", wordColor[regs[1].toLowerCase()], "important");
                    match.style.fontStyle = "inherit";
                    match.style.color = "#000";
                    match.className = className;

                    var after;
                    // In case of leading whitespace or other symbols
                    var leadR = new RegExp("^[\\s" + leadingSymbols + "]");
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
            if (typeof node.innerHTML == "undefined") return;
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
            if (input === undefined || !(input = input.replace(/(^\s+|\s+$)/g, ""))) return;
            input = addAccents(input);
            input = convertCharStr2jEsc(input);
            if (this.setRegex(input)) {
                this.hiliteWords(targetNode);
            }
        };

        // added by Yanosh Kunsh to include utf-8 string comparison
        function dec2hex4(textString) {
            var hexequiv = new Array("0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "A", "B", "C", "D", "E", "F");
            return hexequiv[(textString >> 12) & 0xF] + hexequiv[(textString >> 8) & 0xF] + hexequiv[(textString >> 4) & 0xF] + hexequiv[textString & 0xF];
        }

        function convertCharStr2jEsc(str, cstyle) {
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
    function getClosestForward(el, fn) {
        return el && (fn(el) ? el : getClosestForward(el.nextElementSibling, fn)) ||
            el && (fn(el) ? el : getClosestForward(el.parentNode, fn));
    }

    // Does a reverse search for el back through previous siblings, or up the DOM tree then back
    // Returns if fn(el) is true, or else keeps searching to top of DOM
    function getClosestBack(el, fn) {
        return el && (fn(el) ? el : getClosestBack(el.previousElementSibling, fn)) ||
            el && (fn(el) ? el : getClosestBack(el.parentNode, fn));
    }


    /**
     * Functions and classes exposed by this module
     */
    return {
        endsWith: endsWith,
        ucFirstLetter: ucFirstLetter,
        lcFirstLetter: lcFirstLetter,
        ucEveryFirstLetter: ucEveryFirstLetter,
        removeDuplicateTitlesInDirEntryArray: removeDuplicateTitlesInDirEntryArray,
        removeDuplicateStringsInSmallArray: removeDuplicateStringsInSmallArray,
        readIntegerFrom4Bytes: readIntegerFrom4Bytes,
        readIntegerFrom2Bytes: readIntegerFrom2Bytes,
        readFloatFrom4Bytes: readFloatFrom4Bytes,
        uint8ArrayToHex: uint8ArrayToHex,
        uint8ArrayToBase64: uint8ArrayToBase64,
        readFileSlice: readFileSlice,
        binarySearch: binarySearch,
        b64toBlob: b64toBlob,
        uintToString: uintToString,
        leftShift: leftShift,
        matchOuter: matchOuter,
        matchInner: matchInner,
        Hilitor: Hilitor,
        getClosestForward: getClosestForward,
        getClosestBack: getClosestBack
    };
});
