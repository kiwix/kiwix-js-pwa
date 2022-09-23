/**
 * transformZimit.js: Functions to enable reading of Zimit ZIM format.
 *
 * Copyright 2022 Jaifroid, Mossroy and contributors.
 * Licence: GPL v3.
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
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public Licence for more details.
 *
 * You should have received a copy of the GNU General Public Licence
 * along with Kiwix (file LICENSE-GPLv3.txt). If not, see <http://www.gnu.org/licenses/>.
 */
'use strict';

define([], function () {

    /**
     * Filters out the Replay system files (since these cannot be loaded alongside a Service Worker without error)
     * In the case of the H prefix or the landing page, an 'inspect' property is added to the dirEntry, so that we can discover
     * the underlying Zimit landing page below
     * @param {dirEntry} dirEntry The directory entry to modify or anull
     * @returns {dirEntry} The modified directory entry
     */
    function filterReplayFiles(dirEntry) {
        if (!(dirEntry && dirEntry.url)) return null;
        if (dirEntry.namespace === 'H' || dirEntry.namespace === 'C' && /^H\//.test(dirEntry.url) 
            || params.isLandingPage && /^(A\/)?index\.html(?:[?#]|$)/.test(dirEntry.url))
            dirEntry.inspect = true;
        if (/(?:\bload\.js|\bsw\.js|analytics.*\.js|update\.googleapis|survey\.js|yuiloader\.js|developer\.mozilla\.org\/static\/js\/main\..+\.js)(?:[?#]|$)/i.test(dirEntry.url))
            dirEntry.nullify = true;
        return dirEntry;
    }

    /**
     * Inspects the HTML of the ZIM archive's landing page or of the requested Header to discover the URL to redirect to
     * adds a custom redirect to the dirEntry
     * @param {dirEntry} dirEntry The directory entry of the landing page or H-prefixed header to process 
     * @param {String} data The decoded data which the dirEntry points to
     * @param {String} cns The Content Name Space of the ZIM (usually 'C' or 'A')
     * @returns {dirEntry} The modified directory entry
     */
    function getZimitRedirect(dirEntry, data, cns) {
        var redirect;
        // Type 1 ZIMs don't use the H namespace, and instead use H as prefix to the URL
        if (dirEntry.namespace === 'H' || cns === 'C' && /^H\//.test(dirEntry.url)) {
            // We are dealing with a Header redirect, so we need to find the Location: field
            redirect = data.match(/^Location:\s*https?:\/\/([^\/]+)(.*)$/m);
            if (!redirect) redirect = data.match(/^WARC-Target-URI:\s*https?:\/\/([^/]+)(.*)$/m)
            if (redirect && redirect[1]) {
                // Type 1 Zimit ZIMs need intermediary 'A' prefix, since there is no longer any A namespace
                params.zimitPrefix = (cns === 'C' ? 'A/' : '') + redirect[1];
                dirEntry.zimitRedirect =  cns + '/' + params.zimitPrefix + redirect[2];
            } else {
                dirEntry.zimitRedirect = null;
            }    
        } else if (/301\s*moved\s+permanently/i.test(data)) {
            redirect = data.match(/moved\s+permanently(?:[^<]|<(?!a\s))+<a\s[^"']+["'](?:https?:)?\/?\/?([^"']+)/i);
            if (redirect && redirect[1]) {
                dirEntry.zimitRedirect = cns + '/' + (cns === 'C' ? 'A/' : '') + redirect[1];
            }
            console.debug('*** Asset moved permanently! Redirecting to: ' + dirEntry.zimitRedirect + ' ***');
        } else {
            redirect = data.match(/window\.mainUrl\s*=\s*(['"])https?:\/\/([^\/]+)(.+?)\1/);
            if (redirect && redirect[2] && redirect[3]) {
                // Logic added for Type 1 Zimit ZIMs
                params.zimitPrefix = (dirEntry.namespace === 'C' ? 'A/' : '') + redirect[2];
                params.zimitStartPage =  dirEntry.namespace + '/' + params.zimitPrefix + redirect[3];
            } else {
                params.zimitStartPage = null;
            }
            dirEntry.zimitRedirect = params.zimitStartPage;
        }
        return dirEntry;
    }

    /**
     * Establish some Regular Expressions used by the transformReplayUrls function
     */
    var regexpZimitHtmlLinks = /(<(?:a|img|script|link|track|meta|iframe)\b[^>]*?[\s;])(?:src\b|href|url)\s*(=\s*(["']))(?=[./]+|https?)((?:[^>](?!\3|\?|#))+[^>])([^>]*>)/ig;
    var regexpZimitJavascriptLinks = /['"(]((?:https?:)?\/\/[^'"?#)]*)['"?#)]/ig;
    var regexpZimitCssLinks = /\burl\s*\(['"\s]*([^)'"\s]+)['"\s]*\)/ig;
    var regexpGetZimitPrefix = /link\s+rel=["']canonical["']\s+href="https?:\/\/([^/"]+)/i;
    var regexpRemoveAnalytics1 = /<script\b([^<]|<(?!\/script>))+?(?:google.*?analytics|adsbygoogle|goggleads|doubleclick)([^<]|<(?!\/script>))+<\/script>\s*/ig;
    var regexpRemoveAnalytics2 = /<ins\b(?:[^<]|<(?!\/ins>))+?adsbygoogle(?:[^<]|<(?!\/ins>))+<\/ins>\s*/ig;
    var regexpInlineScriptsNotMaths = /<(script\b(?![^>]+type\s*=\s*["'](?:math\/|text\/html|[^"']*?math))(?:[^<]|<(?!\/script>))+<\/script)>/ig;

    /**
     * The main function for transforming Zimit URLs into standard ZIM URLs.
     * @param {dirEntry} dirEntry The directory entry that points to the extracted data
     * @param {String} data The deocmpressed and extracted textual data that the dirEntry points to
     * @param {String} mimetype The reported mimetype of the data (this is also in the dirEntry)
     * @returns {String} The transformed data string
     */
    function transformReplayUrls(dirEntry, data, mimetype, callback) {
        /**
         * Transform URL links in HTML files
         * Note that some Zimit ZIMs have mimeteypes like 'text/html;raw=true', so we can't simply match 'text/html'
         * Other ZIMs have a mimetype like 'html' (with no 'text/'), so we have to match as generically as possible
         */
        var indexRoot = window.location.pathname.replace(/[^\/]+$/, '') + encodeURI(appstate.selectedArchive._file.name);
        if (/\bx?html\b/i.test(mimetype)) {
            var zimitPrefix = data.match(regexpGetZimitPrefix);
            // If the URL is the same as the URL with everything after the first / removed, then we are in the root directory
            // We use this to decide whether to remove any relative link prefixes like ../
            var rootDirectory = dirEntry.url === dirEntry.url.replace(/^((?:A\/)?[^/]+\/?).*/, '$1');
            params.zimitPrefix = zimitPrefix ? (dirEntry.namespace === 'C' ? 'A/' : '') + zimitPrefix[1] : params.zimitPrefix;
            // Remove lazyimgage system and noscript tags that comment out images
            // DEV: Check if this is still necessary
            data = data.replace(/<noscript>\s*(<img\b[^>]+>)\s*<\/noscript>/ig, '$1');
            data = data.replace(/<span\b[^>]+lazy-image-placeholder[^<]+<\/span>\s*/ig, '');
            // Remove meta http-equiv refresh from assets
            if (dirEntry.isAsset) data = data.replace(/<meta\s+http-equiv[^>]+refresh\b[^>]+>\s*/i, '');
            // // Inject the helper script wombat.js
            // data = data.replace(/(<\/head>\s*)/i, '<script src="https://' + params.zimitPrefix + '/static/wombat.js"></script>\n');

            // Get stem for constructing an absolute URL
            data = data.replace(regexpZimitHtmlLinks, function(match, blockStart, equals, quote, relAssetUrl, blockClose) {
                var newBlock = match;
                var assetUrl = relAssetUrl;
                    // DEBUG:
                    console.log('Asset URL: ' + assetUrl);
                // Remove google analytics and other analytics files that cause stall
                if (/analytics|typepad.*stats|googleads|doubleclick/i.test(assetUrl)) return '';
                // For root-relative links, we need to add the zimitPrefix
                assetUrl = assetUrl.replace(/^\/(?!\/)/, indexRoot + '/' + dirEntry.namespace + '/' + params.zimitPrefix + '/');
                // For Zimit assets that begin with https: or // the zimitPrefix is derived from the URL
                assetUrl = assetUrl.replace(/^(?:https?:)?\/\//i, indexRoot + '/' + dirEntry.namespace + '/' + (dirEntry.namespace === 'C' ? 'A/' : ''));
                // For fully relative links, we have to remove any '..' if we are in root directory
                if (rootDirectory) assetUrl = assetUrl.replace(/^(\.\.\/?)+/, indexRoot + '/' + dirEntry.namespace + '/' + params.zimitPrefix + '/'); 
                // Add placeholder to prevent further transformations
                if (/^<a\s/i.test(newBlock)) newBlock = newBlock.replace(relAssetUrl, '@kiwixtrans@' + assetUrl);
                // But for non-anchor URLs, We have to mark potential assets that are not easily identified as assets, due to so many html mimetypes being returned for them
                else newBlock = newBlock.replace(relAssetUrl, '@kiwixtransformed@' + assetUrl + (params.contentInjectionMode === 'serviceworker' ? '?isKiwixAsset' : ''));
                console.debug('Transform: \n' + match + '\n -> ' + newBlock);
                return newBlock;
            });

            // Deal with image srcsets
            data = data.replace(/<img\b[^>]+\ssrcset=["']([^"']+)/ig, function (match, srcset) {
                var srcsetArr = srcset.split(',');
                for (var i=0; i < srcsetArr.length; i++) {
                    // For root-relative links, we need to add the zimitPrefix
                    srcsetArr[i] = srcsetArr[i].replace(/^\s?\/(?!\/)/, indexRoot + '/' + dirEntry.namespace + '/' + params.zimitPrefix + '/');
                    // Zimit prefix is in the URL for absolute URLs
                    srcsetArr[i] = srcsetArr[i].replace(/^(?:\s?https?:)?\/\//i, indexRoot + '/' + dirEntry.namespace + '/' + (dirEntry.namespace === 'C' ? 'A/' : ''));
                    if (rootDirectory) srcsetArr[i] = srcsetArr[i].replace(/^(\.\.\/?)+/, indexRoot + '/' + dirEntry.namespace + '/' + params.zimitPrefix + '/');
                    srcsetArr[i] = '@kiwixtransformed@' + srcsetArr[i];
                }
                match = match.replace(srcset, srcsetArr.join(', '));
                return match;
            });

            // Deal with regex-style urls embedded in page
            data = data.replace(/https?:\\\/\\\/[^"']+/gi, function (assetUrl) {
                assetUrl = assetUrl.replace(/^https?:\\\/\\\//i, '\\/' + dirEntry.namespace + '\\/' + (dirEntry.namespace === 'C' ? 'A\\/' : ''));
                assetUrl = (window.location.origin + indexRoot).replace(/\\/g, '\\\\').replace(/\//g, '\\/') + assetUrl;
                return assetUrl;
            });

            // Remove any <base href...> statements
            // DEV: You should probably deal with this more intelligently, changing absolute links rather than just removing,
            // but so far, removing it seems to do the job
            data = data.replace(/<base\b[^>]+href\b[^>]+>\s*/i, '');

            // Remove any residual analytics and ads
            data = data.replace(regexpRemoveAnalytics1, '');
            data = data.replace(regexpRemoveAnalytics2, '');

            // ZIM-specific overrides
            if (/(?:journals\.openedition\.org)/i.test(params.zimitPrefix)) {
                // DEV: Checked still necessary as of 8-6-2022
                // Neutralize all inline scripts, excluding math blocks or react templates, as they cause a loop on loading article
                data = data.replace(regexpInlineScriptsNotMaths, function (p0, p1) {
                    return '<!-- ' + p1 + ' --!>';
                });
                // data = data.replace(/<script\b[^>]+tarteaucitron[^"']*?\.js(?:[^<]|<(?!\/script>))+<\/script>\s*/i, '');
            }

            // Remove shopping cart that attempts to post to server or scripts that take a very long time to fail and block page
            if (/passco/i.test(params.zimitPrefix)) {
                data = data.replace(/<script\b[^>]+(?:cart-fragments|lp-global\.min\.js)(?:[^<]|<(?!\/script>))+<\/script>\s*/, '');
            }
            
        } // End of html transformations
        
        /**
         * Transform css-style links in stylesheet files and stylesheet blocks in HTML
         */
        if (/\b(css|html)\b/i.test(mimetype)) {
            data = data.replace(regexpZimitCssLinks, function (match, url) {
                var newBlock = match;
                var assetUrl = url;
                // For root-relative links, we need to add the zimitPrefix
                assetUrl = assetUrl.replace(/^\/(?!\/)/, indexRoot + '/' + dirEntry.namespace + '/' + params.zimitPrefix + '/');
                // Deal with absolute URLs
                assetUrl = assetUrl.replace(/^(https?:)?\/\//i, indexRoot + '/' + dirEntry.namespace + '/' + (dirEntry.namespace === 'C' ? 'A/' : ''));
                if (rootDirectory) assetUrl = assetUrl.replace(/^(\.\.\/?)+/, indexRoot + '/' + dirEntry.namespace + '/' + params.zimitPrefix + '/'); 
                // Relative assets
                newBlock = assetUrl === url ? newBlock :
                    newBlock.replace(url, '@kiwixtransformed@' + assetUrl);
                console.debug('Transform: \n' + match + '\n -> ' + newBlock);
                return newBlock;
            });
        } // End of css transformations

        /**
         * Transform links in JavaScript files or script blocks in the html
         */
        if (/\b(javascript|html)\b/i.test(mimetype)) {
            data = data.replace(regexpZimitJavascriptLinks, function (match, url) {
                if (/www\.w3\.org\/XML\//i.test(url)) return match;
                var newBlock = match;
                var assetUrl = url;
                assetUrl = assetUrl.replace(/^\/(?!\/)/, indexRoot + '/' + dirEntry.namespace + '/' + params.zimitPrefix + '/');
                assetUrl = assetUrl.replace(/^\/\//, indexRoot + '/' + dirEntry.namespace + '/' + (dirEntry.namespace === 'C' ? 'A/' : ''));
                assetUrl = assetUrl.replace(/^https?:\/\//i, indexRoot + '/' + dirEntry.namespace + '/' + (dirEntry.namespace === 'C' ? 'A/' : '')); 
                // Remove analytics
                assetUrl = /analytics|typepad.*stats/i.test(assetUrl) ? '' : assetUrl; 
                // Relative assets
                newBlock = newBlock.replace(url, '@kiwixtransformed@' + assetUrl);
                console.debug('Transform: \n' + match + '\n -> ' + newBlock);
                return newBlock;
            });
            data = data.replace(/(['"])(?:\/?)((?:static|api)\/)/ig, '$1' + window.location.origin + indexRoot + '/' + dirEntry.namespace + '/' + params.zimitPrefix + '/$2');
        } // End of JavaScript transformations

        // Remove the placeholders used to prevent further matching
        data = data.replace(/@kiwixtransformed@/g, params.contentInjectionMode === 'serviceworker' ? window.location.origin : '');
        data = data.replace(/@kiwixtrans@/g, '');

        return data;    
    }

    /**
     * Transform video URL through fuzzy matching
     * Rules adapted from https://github.com/webrecorder/wabac.js/blob/main/src/fuzzymatcher.js
     * @param {String} url The URL to transform through fuzzy matching
     * @param {Function} callback The function to call with the transformed url
     */
    function transformVideoUrl(url, callback) {
        if (/youtu(?:be(?:-nocookie)?\.com|\.be)/i.test(url)) {
            var cns = appstate.selectedArchive.getContentNamespace();
            var rgxTrimUrl = new RegExp('(?:[^/]|\\/(?!' + cns + '\\/))+\\/');
            var pureUrl = url.replace(rgxTrimUrl, '');
            // See https://webapps.stackexchange.com/questions/54443/format-for-id-of-youtube-video for explanation of format
            var videoId = pureUrl.match(/(?:videoid=|watch\?v=|embed\/|\/)([a-zA-Z0-9_-]{10}[048AEIMQUYcgkosw](?:&|\?|\s*$))/i);
            videoId = videoId ? videoId[1] : null;
            if (!videoId) {
                callback(url);
                return
            };
            var cns = appstate.selectedArchive.getContentNamespace();
            var prefix = (cns === 'C' ? cns + '/' : '') + 'H/www.youtube.com/ptracking';
            // Set up regular expression search of URL index (aka fuzzy search)
            var search = {
                rgxPrefix: new RegExp('.*' + videoId, 'i'),
                searchUrlIndex: true,
                size: 1
            }
            appstate.selectedArchive.findDirEntriesWithPrefixCaseSensitive(prefix, search, function (dirEntry) {
                if (dirEntry && dirEntry[0] && dirEntry[0].url) {
                    dirEntry = dirEntry[0];
                    var cpn = dirEntry.url.match(/cpn=([^&]+)/i);
                    cpn = cpn ? cpn[1] : null;
                    var ei = dirEntry.url.match(/ei=([^&]+)/i);
                    ei = ei ? ei[1] : null;
                    if (cpn||ei) {
                        prefix = (cns === 'C' ? cns + '/' : '') + 'A/rr';
                        search = {
                            rgxPrefix: new RegExp('.*' + (ei ? 'ei=' + ei : '') + (cpn ? '.*cpn=' + cpn : ''), 'i'),
                            searchUrlIndex: true,
                            size: 1
                        }
                        appstate.selectedArchive.findDirEntriesWithPrefixCaseSensitive(prefix, search, function (dirEntry) {
                            if (dirEntry && dirEntry[0] && dirEntry[0].url && !search.found) {
                                dirEntry = dirEntry[0];
                                search.found = true;
                                var transUrl = url.replace(pureUrl, dirEntry.namespace + '/' + dirEntry.url);
                                console.debug('TRANSFORMED VIDEO URL ' + pureUrl + ' --> \n' + transUrl);
                                callback(transUrl);
                            }
                        });
                    } else {
                        callback(url);
                    }
                } else {
                    callback(url);
                }
            });
        } else {
            callback(url);
        }
    }

    return {
        filterReplayFiles: filterReplayFiles,
        getZimitRedirect: getZimitRedirect,
        transformReplayUrls: transformReplayUrls,
        transformVideoUrl: transformVideoUrl
    };
});
