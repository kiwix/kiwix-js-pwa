/**
 * zimArchive.js: Support for archives in ZIM format.
 *
 * Copyright 2015 Mossroy and contributors
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
define(['zimfile', 'zimDirEntry', 'transformZimit', 'util', 'utf8'],
    function(zimfile, zimDirEntry, transformZimit, util, utf8) {
    
    /**
     * ZIM Archive
     * 
     * 
     * @typedef ZIMArchive
     * @property {ZIMFile} _file The ZIM file (instance of ZIMFile, that might physically be split into several actual files)
     * @property {String} _language Language of the content
     */
    
    /**
     * @callback callbackZIMArchive
     * @param {ZIMArchive} zimArchive Ready-to-use ZIMArchive
     */
    
    /**
     * @callback callbackMetadata
     * @param {String} data metadata string
     */
    
    /**
     * Creates a ZIM archive object to access the ZIM file at the given path in the given storage.
     * This constructor can also be used with a single File parameter.
     * 
     * @param {StorageFirefoxOS|Array<Blob>} storage Storage (in this case, the path must be given) or Array of Files (path parameter must be omitted)
     * @param {String} path The Storage path for an OS that requires this to be specified
     * @param {callbackZIMArchive} callbackReady The function to call when the archive is ready to use
     * @param {callbackZIMArchive} callbackError The function to call when an error occurs
     */
    function ZIMArchive(storage, path, callbackReady, callbackError) {
        var that = this;
        that._file = null;
        that._language = ""; //@TODO
        var createZimfile = function(fileArray) {
            zimfile.fromFileArray(fileArray).then(function(file) {
                that._file = file;
                // File has been created, but we need to add any Listings which extend the archive metadata
                that._file.setListings([
                    // Provide here any Listings for which we need to extract metadata as key:value obects to be added to the file
                    // 'ptrName' and 'countName' contain the key names to be set in the archive file object
                    {
                        // This defines the standard v0 (legacy) title index that contains listings for every entry in the ZIM (not just articles)
                        // It represents the same index that is referenced in the ZIM archive header
                        path: 'X/listing/titleOrdered/v0',
                        ptrName: 'titlePtrPos',
                        countName: 'entryCount'
                    },
                    {
                        // This defines a new version 1 index that is present in no-namespace ZIMs, and contains a title-ordered list of articles
                        path: 'X/listing/titleOrdered/v1',
                        ptrName: 'articlePtrPos',
                        countName: 'articleCount'
                    }
                ]);

                // Set the ZIM type ('zimit' or 'open')
                params.zimType = transformZimit.setZimType(that);

                // DEV: Currently, extended listings are only used for title (=article) listings when the user searches
                // for an article or uses the Random button, by which time the listings will have been extracted.
                // If, in the future, listings are used in a more time-critical manner, consider forcing a wait before
                // declaring the archive to be ready, by chaining the following callback in a .then() function of setListings.
                callbackReady(that);
            });
        };
        if (storage && !path) {
            var fileList = storage;
            // We need to convert the FileList into an Array
            var fileArray = [].slice.call(fileList);
            // The constructor has been called with an array of File/Blob parameter
            createZimfile(fileArray);
        } else {
            if (/.*zim..$/.test(path)) {
                // split archive
                that._searchArchiveParts(storage, path.slice(0, -2)).then(function(fileArray) {
                    createZimfile(fileArray);
                }).catch(function (error) {
                    callbackError("Error reading files in split archive " + path + ": " + error, "Error reading archive files");
                });
            } else {
                storage.get(path).then(function(file) {
                    createZimfile([file]);
                }).catch(function (error) {
                    callbackError("Error reading ZIM file " + path + " : " + error, "Error reading archive file");
                });
            }
        }
    }

    /**
     * Searches the directory for all parts of a split archive.
     * @param {Storage} storage storage interface
     * @param {String} prefixPath path to the split files, missing the "aa" / "ab" / ... suffix.
     * @returns {Promise} that resolves to the array of file objects found.
     */
    ZIMArchive.prototype._searchArchiveParts = function(storage, prefixPath) {
        var fileArray = [];
        var nextFile = function(part) {
            var suffix = String.fromCharCode(0x61 + Math.floor(part / 26)) + String.fromCharCode(0x61 + part % 26);
            return storage.get(prefixPath + suffix)
                .then(function(file) {
                    fileArray.push(file);
                    return nextFile(part + 1);
                }, function(error) {
                    return fileArray;
                });
        };
        return nextFile(0);
    };

    /**
     * 
     * @returns {Boolean}
     */
    ZIMArchive.prototype.isReady = function() {
        return this._file !== null;
    };
    
    /**
     * Looks for the DirEntry of the main page
     * @param {callbackDirEntry} callback
     */
    ZIMArchive.prototype.getMainPageDirEntry = function(callback) {
        if (this.isReady()) {
            var mainPageUrlIndex = this._file.mainPage;
            var that = this;
            this._file.dirEntryByUrlIndex(mainPageUrlIndex).then(function (dirEntry) {
                // Filter out Zimit files that we cannot handle without error
                if (that.type === 'zimit') dirEntry = transformZimit.filterReplayFiles(dirEntry);
                callback(dirEntry);
            });
        }
    };

    /**
     * 
     * @param {String} dirEntryId
     * @returns {DirEntry}
     */
    ZIMArchive.prototype.parseDirEntryId = function(dirEntryId) {
        return zimDirEntry.DirEntry.fromStringId(this._file, dirEntryId);
    };
    
    /**
     * @callback callbackDirEntryList
     * @param {Array.<DirEntry>} dirEntryArray Array of DirEntries found
     */

    /**
     * Look for DirEntries with title starting with the prefix of the current search object.
     * For now, ZIM titles are case sensitive.
     * So, as workaround, we try several variants of the prefix to find more results.
     * This should be enhanced when the ZIM format will be modified to store normalized titles
     * See https://phabricator.wikimedia.org/T108536
     * 
     * @param {Object} search The current appstate.search object
     * @param {callbackDirEntryList} callback The function to call with the result
     * @param {Boolean} noInterim A flag to prevent callback until all results are ready (used in testing)
     */
    ZIMArchive.prototype.findDirEntriesWithPrefix = function (search, callback, noInterim) {
        var that = this;
        // Establish array of initial values that must be searched first. All of these patterns are generated by the full
        // search type, and some by basic, but we need the most common patterns to be searched first, as it returns search
        // results much more quickly if we do this (and the user can click on a result before the rarer patterns complete)
        // NB duplicates are removed before processing search array
        var startArray = [];
        // Check if user prefixed search with a namespace-like pattern. If so, do a search for namespace + url
        if (/^[-ABCHIJMUVWX]\//.test(search.prefix)) search.searchUrlIndex = true;
        // Regex below breaks the string into the pattern: group 1: alphanumericsearch; group 2: regex beginning with .* or .+, or contained in (?:regex)
        var isPrefixRegExp = search.prefix.match(/^((?:[^(.]|\((?!\?:)|\.(?![*+]))*)(\(\?:.*\)|\.[*+].*)$/);
        search.rgxPrefix = null;
        var prefix = search.prefix;
        if (isPrefixRegExp) {
            // User has initiated a regular expression search - note the only regexp special character allowed in the alphanumeric part is \s
            prefix = isPrefixRegExp[1].replace(/\\s/g, ' ');
            var regexCorrect = true;
            try {
                search.rgxPrefix = new RegExp(isPrefixRegExp[2], 'i');
            } catch (err) {
                // User has incorrect regular expression syntax
                regexCorrect = false;
            }
            if (!regexCorrect) {
                search.status = 'error';
                callback([], search);
                return;
            }
        } 
        // Ensure a search is done on the string exactly as typed
        startArray.push(prefix);
        // Normalize any spacing and make string all lowercase
        prefix = prefix.replace(/\s+/g, ' ').toLocaleLowerCase();
        // Add lowercase string with initial uppercase (this is a very common pattern)
        startArray.push(prefix.replace(/^./, function (m) {
            return m.toLocaleUpperCase();
        }));
        // Get the full array of combinations to check number of combinations
        var fullCombos = util.removeDuplicateStringsInSmallArray(util.allCaseFirstLetters(prefix, 'full'));
        // Put cap on exponential number of combinations (five words = 3^5 = 243 combinations)
        search.type = fullCombos.length < 300 ? 'full' : 'basic';
        // We have to remove duplicate string combinations because util.allCaseFirstLetters() can return some combinations
        // where uppercase and lowercase combinations are exactly the same, e.g. where prefix begins with punctuation
        // or currency signs, for languages without case, or where user-entered case duplicates calculated case
        var prefixVariants = util.removeDuplicateStringsInSmallArray(
            startArray.concat(
                // Get basic combinations first for speed of returning results
                util.allCaseFirstLetters(prefix).concat(
                    search.type === 'full' ? fullCombos : []
                )
            )
        );
        var dirEntries = [];
        search.scanCount = 0;

        function searchNextVariant() {
            // If user has initiated a new search, cancel this one
            if (search.status === 'cancelled') return callback([], search);
            if (prefixVariants.length === 0 || dirEntries.length >= search.size) {
                search.status = 'complete';
                return callback(dirEntries, search);
            }
            // Dynamically populate list of articles
            search.status = 'interim';
            if (!noInterim) callback(dirEntries, search);
            search.found = dirEntries.length;
            var prefix = prefixVariants[0];
            // console.debug('Searching for: ' + prefixVariants[0]);
            prefixVariants = prefixVariants.slice(1);
            // Search window sets an upper limit on how many matching dirEntries will be scanned in a full index search
            search.window = search.rgxPrefix ? 10000 * search.size : search.size;
            that.findDirEntriesWithPrefixCaseSensitive(prefix, search,
                function (newDirEntries, countReport, interim) {
                    search.countReport = countReport;
                    if (search.status === 'cancelled') return callback([], search);
                    if (!noInterim && countReport === true) return callback(dirEntries, search);
                    if (interim) {// Only push interim results (else results will be pushed again at end of variant loop)                    
                        [].push.apply(dirEntries, newDirEntries);
                        search.found = dirEntries.length;
                        if (!noInterim && newDirEntries.length) return callback(dirEntries, search);
                    } else return searchNextVariant();
                }
            );
        }
        searchNextVariant();
    };
    
    /**
     * A method to return the namespace in the ZIM file that contains the primary user content. In old-format ZIM files (minor
     * version 0) there are a number of content namespaces, but the primary one in which to search for titles is 'A'. In new-format
     * ZIMs (minor version 1) there is a single content namespace 'C'. See https://openzim.org/wiki/ZIM_file_format. This method
     * throws an error if it cannot determine the namespace or if the ZIM is not ready.
     * @returns {String} The content namespace for the ZIM archive 
     */
    ZIMArchive.prototype.getContentNamespace = function () {
        var errorText;
        if (this.isReady()) {
            var ver = this._file.minorVersion;
            // DEV: There are currently only two defined values for minorVersion in the OpenZIM specification
            // If this changes, adapt the error checking and return values 
            if (ver > 1) {
                errorText = 'Unknown ZIM minor version!';
            } else {
                return ver === 0 ? 'A' : 'C';
            }
        } else {
            errorText = 'We could not determine the content namespace because the ZIM file is not ready!';
        }
        throw new Error(errorText);
    };
    
    /**
     * Look for dirEntries with title starting with the given prefix (case-sensitive)
     * 
     * @param {String} prefix The case-sensitive value against which dirEntry titles (or url) will be compared
     * @param {Object} search The appstate.search object (for comparison, so that we can cancel long binary searches)
     * @param {callbackDirEntryList} callback The function to call with the array of dirEntries with titles that begin with prefix
     * @param {Integer} startIndex The index number with which to commence the search, or null
     */
    ZIMArchive.prototype.findDirEntriesWithPrefixCaseSensitive = function(prefix, search, callback, startIndex) {
        // Save the value of startIndex because value of null has a special meaning in combination with prefix: 
        // produces a list of matches starting with first match and then next x dirEntries thereafter
        var saveStartIndex = startIndex;
        startIndex = startIndex || 0;
        prefix = prefix || '';
        var cns = this.getContentNamespace();
        // Search v1 article listing if available, otherwise fallback to v0
        var articleCount = this._file.articleCount || this._file.entryCount;
        var searchFunction = appstate.selectedArchive._file.dirEntryByTitleIndex;
        if (search.searchUrlIndex) {
            articleCount = this._file.entryCount;
            searchFunction = appstate.selectedArchive._file.dirEntryByUrlIndex;
        }
        util.binarySearch(startIndex, articleCount, function(i) {
            return searchFunction(i).then(function(dirEntry) {
                if (search.status === 'cancelled') return 0;
                var ns = dirEntry.namespace;
                var ti = search.searchUrlIndex ? dirEntry.url : dirEntry.getTitleOrUrl();
                if (!search.searchUrlIndex) {
                    // DEV: This search is redundant if we managed to populate articlePtrLst and articleCount, but it only takes two instructions and
                    // provides maximum compatibility with rare ZIMs where attempts to find first and last article (in zimArchive.js) may have failed
                    if (ns < cns) return 1;
                    if (ns > cns) return -1;
                    // We should now be in namespace A (old format ZIM) or C (new format ZIM)
                    return prefix <= dirEntry.getTitleOrUrl() ? -1 : 1;
                } else {
                    return prefix <= ns + '/' + ti ? -1 : 1;
                }
            });
        }, true).then(function(firstIndex) {
            var vDirEntries = [];
            var addDirEntries = function(index, lastTitle) {
                if (search.status === 'cancelled' || search.found >= search.size || index >= articleCount
                || lastTitle && !~lastTitle.indexOf(prefix) || index - firstIndex >= search.window) {
                    // DEV: Diagnostics to be removed before merge
                    if (vDirEntries.length) console.debug('Scanned ' + (index - firstIndex) + ' titles for "' + prefix + 
                        '" (found ' + vDirEntries.length + ' match' + (vDirEntries.length === 1 ? ')' : 'es)'));
                    return {
                        'dirEntries': vDirEntries,
                        'nextStart': index
                    };
                }
                return searchFunction(index).then(function(dirEntry) {
                    search.scanCount++;
                    var title = dirEntry.getTitleOrUrl();
                    // If we are searching by URL, display namespace also
                    if (search.searchUrlIndex) title = dirEntry.namespace + '/' + dirEntry.url;
                    // Only return dirEntries with titles that actually begin with prefix
                    if (saveStartIndex === null || (search.searchUrlIndex || dirEntry.namespace === cns) && title.indexOf(prefix) === 0) {
                        if (!search.rgxPrefix || search.rgxPrefix && search.rgxPrefix.test(title.replace(prefix, ''))) { 
                            vDirEntries.push(dirEntry);
                            // Report interim result
                            if (typeof saveStartIndex === 'undefined') callback([dirEntry], false, true);
                        }
                    }
                    // Report number of titles scanned every 5000 titles
                    if (!(search.scanCount % 5000) && typeof saveStartIndex === 'undefined') callback([], true, true);
                    return addDirEntries(index + 1, title);
                });
            };
            return addDirEntries(firstIndex);
        }).then(function(objWithIndex) {
            return callback(objWithIndex.dirEntries, objWithIndex.nextStart);
        });
    };
    
    /**
     * @callback callbackDirEntry
     * @param {DirEntry} dirEntry The DirEntry found
     */

    /**
     * 
     * @param {DirEntry} dirEntry
     * @param {callbackDirEntry} callback
     */
    ZIMArchive.prototype.resolveRedirect = function(dirEntry, callback) {
        var that = this;
        this._file.dirEntryByUrlIndex(dirEntry.redirectTarget).then(function (resolvedDirEntry) {
            if (that.type === 'zimit') resolvedDirEntry = transformZimit.filterReplayFiles(resolvedDirEntry);
            callback(resolvedDirEntry);
        });
    };
    
    /**
     * @callback callbackStringContent
     * @param {String} content String content
     */
    
    /**
     * 
     * @param {DirEntry} dirEntry
     * @param {callbackStringContent} callback
     */
    ZIMArchive.prototype.readUtf8File = function(dirEntry, callback) {
        var that = this;
        return dirEntry.readData().then(function(data) {
            var mimetype = dirEntry.getMimetype();
            if (window.TextDecoder) {
                data = new TextDecoder('utf-8').decode(data);    
            } else {
                // Support for IE11 and Edge Legacy - only support UTF-8 decoding
                data = utf8.parse(data);
            }
            if (/\bhtml\b/i.test(mimetype)) {
                // If the data were encoded with a differen mimtype, here is how to change it
                // var encoding = decData.match(/<meta\b[^>]+?Content-Type[^>]+?charset=([^'"\s]+)/i);
                // encoding = encoding ? encoding[1] : '';
                // if (encoding && !/utf-8/i.test(encoding)) decData = new TextDecoder(encoding).decode(data);
                
                // Some Zimit archives have an incorrect meta charset tag. See https://github.com/openzim/warc2zim/issues/88.
                // So we remove it!
                data = data.replace(/<meta\b[^>]+?Content-Type[^>]+?charset=([^'"\s]+)[^>]+>\s*/i, function (m0, m1) {
                    if (!/utf-8/i.test(m1)) {
                        return '';
                    }
                    return m0;
                });
            }
            if (dirEntry.inspect) {
                dirEntry = transformZimit.getZimitRedirect(dirEntry, data, that.getContentNamespace());
                if (dirEntry.zimitRedirect) {
                    return that.getDirEntryByPath(dirEntry.zimitRedirect).then(function (rd) {
                        return that.readUtf8File(rd, callback);
                    });
                }
           } else {
                // DEV: Note that we cannot terminate regex below with $ because there is a (rogue?) mimetype
                // of 'text/html;raw=true'
                if (params.zimType === 'zimit' && /\/(?:html|css|javascript)\b/i.test(mimetype)) {
                    data = transformZimit.transformReplayUrls(dirEntry, data, mimetype, appstate.selectedArchive);
                }
                callback(dirEntry, data);
            }
        });
    };

    /**
     * @callback callbackBinaryContent
     * @param {Uint8Array} content binary content
     */

    /**
     * Read a binary file.
     * @param {DirEntry} dirEntry
     * @param {callbackBinaryContent} callback
     */
    ZIMArchive.prototype.readBinaryFile = function(dirEntry, callback) {
        var that = this;
        return dirEntry.readData().then(function(data) {
            var mimetype = dirEntry.getMimetype();
            if (dirEntry.inspect) {
                dirEntry = transformZimit.getZimitRedirect(dirEntry, utf8.parse(data), appstate.selectedArchive.getContentNamespace());
                if (dirEntry.zimitRedirect) {
                    return appstate.selectedArchive.getDirEntryByPath(dirEntry.zimitRedirect).then(function (rd) {
                        return appstate.selectedArchive.readBinaryFile(rd, callback);
                    })
                }
            } else {
                // DEV: Note that we cannot terminate regex below with $ because there is a (rogue?) mimetype
                // of 'text/html;raw=true'
                if (params.zimType === 'zimit' && /^text\/(?:html|css|javascript)\b/i.test(mimetype)) {
                    data = transformZimit.transformReplayUrls(dirEntry, utf8.parse(data), mimetype, that);
                }
            }
            callback(dirEntry, data);
        });
    };
    
    /**
     * Searches the URL pointer list of Directory Entries by pathname
     * @param {String} path The pathname of the DirEntry that is required (namespace + filename)
     * @param {Boolean} zimitResolving A flag to indicate that the a Zimit path is in a lookup loop
     * @return {Promise<DirEntry>} A Promise that resolves to a Directory Entry, or null if not found.
     */
    ZIMArchive.prototype.getDirEntryByPath = function(path, zimitResolving) {
        var that = this;
        path = path.replace(/\?kiwix-display/, '');
        return util.binarySearch(0, this._file.entryCount, function(i) {
            return that._file.dirEntryByUrlIndex(i).then(function(dirEntry) {
                var url = dirEntry.namespace + "/" + dirEntry.url;
                if (path < url)
                    return -1;
                else if (path > url)
                    return 1;
                else
                    return 0;
            });
        }).then(function(index) {
            if (index === null) return null;
            return that._file.dirEntryByUrlIndex(index);
        }).then(function(dirEntry) {
            // Filter Zimit dirEntries and do somee initial transforms
            if (that.type === 'zimit')
                dirEntry = transformZimit.filterReplayFiles(dirEntry);
            if (!dirEntry) {
                // We couldn't get the dirEntry, so look it up the Zimit header
                if (!zimitResolving && that.type === 'zimit' && !/^(H|C\/H)\//.test(path)) {
                    // We need to look the file up in the Header namespace (double replacement ensures both types of ZIM are supported)
                    path = path.replace(/^A\//, 'H/').replace(/^(C\/)A\//, '$1H/');
                    console.debug('DirEntry not found, looking up header: ' + path);
                    return that.getDirEntryByPath(path, true);
                }
                var newpath = path.replace(/^((?:A|C\/A)\/)[^/]+\/(.+)$/, '$1$2');
                if (newpath === path) return null; // No further paths to explore!
                console.log("Article " + path + " not available, but moving up one directory to compensate for ZIM coding error...");
                return that.getDirEntryByPath(newpath);
            } else {
                if (dirEntry) console.log('Found ' + path);
                return dirEntry;
            }
        });
    };

    /**
     * 
     * @param {callbackDirEntry} callback
     */
    ZIMArchive.prototype.getRandomDirEntry = function(callback) {
        // Prefer an article-only (v1) title pointer list, if available
        var articleCount = this._file.articleCount || this._file.entryCount;
        var index = Math.floor(Math.random() * articleCount);
        this._file.dirEntryByTitleIndex(index).then(callback);
    };

    /**
     * Read a Metadata string inside the ZIM file.
     * @param {String} key
     * @param {callbackMetadata} callback
     */
    ZIMArchive.prototype.getMetadata = function (key, callback) {
        var that = this;
        this.getDirEntryByPath("M/" + key).then(function (dirEntry) {
            if (dirEntry === null || dirEntry === undefined) {
                console.warn("Title M/" + key + " not found in the archive");
                callback();
            } else {
                that.readUtf8File(dirEntry, function (dirEntryRead, data) {
                    callback(data);
                });
            }
        }).catch(function (e) {
            console.warn("Metadata with key " + key + " not found in the archive", e);
            callback();
        });
    };

    /**
     * Functions and classes exposed by this module
     */
    return {
        ZIMArchive: ZIMArchive
    };
});
