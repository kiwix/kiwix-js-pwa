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
     * Detects whether the supplied archive is a Zimit-style archive or an OpenZIM archive and
     * sets an archive.type and file.type property accordingly; also returns the detected type
     * @param {Object} archive The archive to be tested
     * @returns {String} Either 'zimit' for a Zimit archive, or 'open' for an OpenZIM archive
     */
    function setZimType(archive) {
        archive.type = /warc-headers/i.test(Array.from(archive._file.mimeTypes)) ? 'zimit' : 'open';
        archive._file.type = archive.type;
        console.debug('Archive type set to: ' + archive.type);
        return archive.type;
    }

    /**
     * Filters out the Replay system files (since these cannot be loaded alongside a Service Worker without error)
     * In the case of the H namespace or the landing page, an 'inspect' property is added to the dirEntry, so that we can discover
     * the underlying Zimit landing page below
     * @param {dirEntry} dirEntry The directory entry to modify or anull
     * @returns {dirEntry} The modified directory entry
     */
    function filterReplayFiles(dirEntry) {
        if (!(dirEntry && dirEntry.url)) return null;
        if (dirEntry.namespace === 'H' || params.isLandingPage && /^index\.html(?:[?#]|$)/.test(dirEntry.url))
            dirEntry.inspect = true;
        if (/(?:\bload\.js|\bsw\.js|analytics.*\.js|remote.loader\.js|survey\.js|yuiloader\.js|developer\.mozilla\.org\/static\/js\/main\..+\.js)(?:[?#]|$)/i.test(dirEntry.url))
            dirEntry.nullify = true;
        // if (/(?:chunk\.js|\bload\.js|\bsw\.js|analytics.*\.js|remote.loader\.js|survey\.js|yuiloader\.js)(?:[?#]|$)/i.test(dirEntry.url)) {
        return dirEntry;
    }

    /**
     * Inspects the HTML of the ZIM archive's landing page or of the requested Header to discover the URL to redirect to
     * adds a custom redirect to the dirEntry
     * @param {dirEntry} dirEntry The directory entry of the landing page or H namespace header to process 
     * @param {String} data The decoded data which the dirEntry points to
     * @param {String} cns The Content Name Space of the ZIM (usually 'C' or 'A')
     * @returns {dirEntry} The modified directory entry
     */
    function getZimitRedirect(dirEntry, data, cns) {
        var redirect;
        if (dirEntry.namespace === 'H') {
            // We are dealing with a Header redirect, so we need to find the Location: field
            redirect = data.match(/^Location:\s*https?:\/\/([^\/]+)(.*)$/m);
            if (!redirect) redirect = data.match(/^WARC-Target-URI:\s*https?:\/\/([^/]+)(.*)$/m)
            if (redirect && redirect[1]) {
                params.zimitPrefix = redirect[1];
                dirEntry.zimitRedirect = cns + '/' + redirect[1] + redirect[2];
            } else {
                dirEntry.zimitRedirect = null;
            }    
        } else {
            redirect = data.match(/window\.mainUrl\s*=\s*(['"])https?:\/\/([^\/]+)(.+?)\1/);
            if (redirect && redirect[2] && redirect[3]) {
                params.zimitPrefix = redirect[2];
                params.zimitStartPage = dirEntry.namespace + '/' + redirect[2] + redirect[3];
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
    var regexpZimitHtmlLinks = /(<(?:a|img|script|link|track|meta)\b[^>]*?[\s;])(?:src\b|href|url)\s*(=\s*(["']))(?=[./]+|https?)((?:[^>](?!\3|\?|#))+[^>])([^>]*>)/ig;
    var regexpZimitJavascriptLinks = /['"(]((?:https?:)?\/\/[^'"?#)]+)['"?#)]/ig;
    var regexpZimitCssLinks = /\burl\s*\(['"\s]*([^)'"\s]+)['"\s]*\)/ig;
    var regexpGetZimitPrefix = /link\s+rel=["']canonical["']\s+href="https?:\/\/([^/"]+)/i;
    var regexpRemoveAnalytics1 = /<script\b([^<]|<(?!\/script>))+?(?:google.*?analytics|adsbygoogle)([^<]|<(?!\/script>))+<\/script>\s*/ig;
    var regexpRemoveAnalytics2 = /<ins\b(?:[^<]|<(?!\/ins>))+?adsbygoogle(?:[^<]|<(?!\/ins>))+<\/ins>\s*/ig;
    var regexpInlineScriptsNotMaths = /<(script\b(?![^>]+type\s*=\s*["'](?:math\/|text\/html|[^"']*?math))(?:[^<]|<(?!\/script>))+<\/script)>/ig;

    /**
     * The main function for transforming Zimit URLs into standard ZIM URLs.
     * @param {dirEntry} dirEntry The directory entry that points to the extracted data
     * @param {String} data The deocmpressed and extracted textual data that the dirEntry points to
     * @param {String} mimetype The reported mimetype of the data (this is also in the dirEntry)
     * @param {Object} selectedArchive The archive object (needed only for the standardized filename used as a prefix)
     * @returns {String} The data string with any URLs it contains transformed into ZIM URLs 
     */
    function transformReplayUrls(dirEntry, data, mimetype, selectedArchive) {
        /**
         * Transform URL links in HTML files
         * Note that some Zimit ZIMs have mimeteypes like 'text/html;raw=true', so we can't simply match 'text/html'
         * Other ZIMs have a mimetype like 'html' (with no 'text/'), so we have to match as generically as possible
         */
        var indexRoot = window.location.pathname.replace(/[^\/]+$/, '') + encodeURI(selectedArchive._file.name);
        if (/\bhtml\b/i.test(mimetype)) {
            var zimitPrefix = data.match(regexpGetZimitPrefix);
            // If the URL is the same as the URL with everything after the first / removed, then we are in the root directory
            // We use this to decide whether to remove any relative link prefixes like ../
            var rootDirectory = dirEntry.url === dirEntry.url.replace(/^([^/]+\/?).*/, '$1');
            params.zimitPrefix = zimitPrefix ? zimitPrefix[1] : params.zimitPrefix;
            // Remove lazyimgage system and noscript tags that comment out images
            // DEV: Check if this is still necessary
            data = data.replace(/<noscript>\s*(<img\b[^>]+>)\s*<\/noscript>/ig, '$1');
            data = data.replace(/<span\b[^>]+lazy-image-placeholder[^<]+<\/span>\s*/ig, '');
            // Remove meta http-equiv refresh
            data = data.replace(/<meta\s+http-equiv[^>]+refresh\b[^>]+>\/s*/i, '');
            // // Inject the helper script wombat.js
            // data = data.replace(/(<\/head>\s*)/i, '<script src="https://' + params.zimitPrefix + '/static/wombat.js"></script>\n');

            // Get stem for constructing an absolute URL
            data = data.replace(regexpZimitHtmlLinks, function(match, blockStart, equals, quote, relAssetUrl, blockClose) {
                var newBlock = match;
                var assetUrl = relAssetUrl;
                // Remove google analytics and other analytics files that cause stall
                if (/google|analytics|typepad.*stats/i.test(assetUrl)) return '';
                // For root-relative links, we need to add the zimitPrefix
                assetUrl = assetUrl.replace(/^\/(?!\/)/, indexRoot + '/' + dirEntry.namespace + '/' + params.zimitPrefix + '/');
                // For Zimit assets that begin with https: or // the zimitPrefix is derived from the URL
                assetUrl = assetUrl.replace(/^(?:https?:)?\/\//i, indexRoot + '/' + dirEntry.namespace + '/');
                // For fully relative links, we have to remove any '..' if we are in root directory
                if (rootDirectory) assetUrl = assetUrl.replace(/^(\.\.\/?)+/, indexRoot + '/' + dirEntry.namespace + '/' + params.zimitPrefix + '/'); 
                // Deal with <meta http-equiv refresh...> directives
                // if (/<meta\s+http-equiv[^>]+refresh\b/i.test(newBlock)) dirEntry.zimitRedirect = assetUrl.replace(/^\//, '');
                newBlock = newBlock.replace(relAssetUrl, '@kiwixtransformed@' + assetUrl);
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
                    srcsetArr[i] = srcsetArr[i].replace(/^(?:\s?https?:)?\/\//i, indexRoot + '/' + dirEntry.namespace + '/');
                    if (rootDirectory) srcsetArr[i] = srcsetArr[i].replace(/^(\.\.\/?)+/, indexRoot + '/' + dirEntry.namespace + '/' + params.zimitPrefix + '/');
                    srcsetArr[i] = '@kiwixtransformed@' + srcsetArr[i];
                }
                match = match.replace(srcset, srcsetArr.join(', '));
                return match;
            });

            // Deal with regex-style urls embedded in page
            data = data.replace(/https?:\\\/\\\/[^"']+/gi, function (assetUrl) {
                assetUrl = assetUrl.replace(/^https?:\\\/\\\//i, '\\/' + dirEntry.namespace + '\\/');
                assetUrl = indexRoot.replace(/\//g, '\\/') + assetUrl;
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
                // Neutralize all inline scripts, excluding math blocks or react templates, as they cause a loop on loading article
                data = data.replace(regexpInlineScriptsNotMaths, function (p0, p1) {
                    return '<!-- ' + p1 + ' --!>';
                });
            }

            // Collapse open menu bar
            if (/cheatography/i.test(params.zimitPrefix)) {
                data = data.replace(/(<div\s+id=['"]menubar['"])/i, '$1 hidden');
                data = data.replace(/(<div\s+class=['"]filterBar['"])/i, '$1 hidden');
                // Remove onclick events
                data = data.replace(/onclick="[^"]+"/ig, '');
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
                assetUrl = assetUrl.replace(/^\/(?!\/)/, dirEntry.namespace + '/' + params.zimitPrefix + '/');
                // Deal with absolute URLs
                assetUrl = assetUrl.replace(/^(https?:)?\/\//i, dirEntry.namespace + '/');
                if (rootDirectory) assetUrl = assetUrl.replace(/^(\.\.\/?)+/, '/' + dirEntry.namespace + '/' + params.zimitPrefix + '/'); 
                // Relative assets
                newBlock = assetUrl === url ? newBlock :
                    newBlock.replace(url, '@kiwixtransformed@' + '/' + selectedArchive._file.name + '/' + assetUrl);
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
                assetUrl = assetUrl.replace(/^\/(?!\/)/, dirEntry.namespace + '/' + params.zimitPrefix + '/');
                assetUrl = assetUrl.replace(/^\/\//, dirEntry.namespace + '/');
                assetUrl = assetUrl.replace(/^https?:\/\//i, dirEntry.namespace + '/'); 
                // Remove analytics
                assetUrl = /google|analytics|typepad.*stats/i.test(assetUrl) ? '' : assetUrl; 
                // Relative assets
                newBlock = newBlock.replace(url, '/' + selectedArchive._file.name + '/' + assetUrl);
                // console.debug('Transform: \n' + match + '\n -> ' + newBlock);
                return newBlock;
            });
            data = data.replace(/(['"])(?:\/?)((?:static|api)\/)/ig, '$1' + window.location.origin + indexRoot + '/' + dirEntry.namespace + '/' + params.zimitPrefix + '/$2');
        } // End of JavaScript transformations

        // Add a base href
        // data = data.replace(/(<head\b[^>]*>\s*)/i, '$1<base href="' + window.location.origin + indexRoot + '/' + '">');

        // Remove the placeholders used to prevent further matching
        data = data.replace(/@kiwixtransformed@/g, '');

        return data;
    }

    return {
        setZimType: setZimType,
        filterReplayFiles: filterReplayFiles,
        getZimitRedirect: getZimitRedirect,
        transformReplayUrls: transformReplayUrls
    };
});
