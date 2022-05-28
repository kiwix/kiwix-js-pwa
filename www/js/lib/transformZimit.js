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
     * In the case of the landing page, an 'inspect' property is added to the dirEntry, so that we can discover
     * the underlying Zimit landing page below
     * @param {dirEntry} dirEntry The directory entry to modify or anull
     * @returns {dirEntry} The modified directory entry
     */
    function filterReplayFiles(dirEntry) {
        if (!(dirEntry && dirEntry.url)) return null;
        if (/(?:chunk\.js|\bload\.js|\bsw\.js|analytics.*\.js|remote.loader\.js|survey\.js|yuiloader\.js)(?:[?#]|$)/i.test(dirEntry.url)) {
            dirEntry.nullify = true;
        } else if (params.isLandingPage && /^index\.html(?:[?#]|$)/.test(dirEntry.url)) {
            dirEntry.inspect = true;
        }
        return dirEntry;
    }

    /**
     * Inspects the HTML of the ZIM archive's landing page to discover the Zimit landing page and
     * adds a custom redirect to the dirEntry
     * @param {dirEntry} dirEntry The directory entry of the landing page to process 
     * @param {String} data The decoded data which the dirEntry points to 
     * @returns {dirEntry} The modified directory entry
     */
    function getZimitLandingPage(dirEntry, data) {
        var zimitStartPage = data.match(/window\.mainUrl\s*=\s*(['"])https?:\/\/([^\/]+)(.+?)\1/);
        if (zimitStartPage && zimitStartPage[2] && zimitStartPage[3]) {
            params.zimitPrefix = zimitStartPage[2];
            params.zimitStartPage = dirEntry.namespace + '/' + params.zimitPrefix + zimitStartPage[3];
        } else {
            params.zimitStartPage = null;
        }
        dirEntry.zimitRedirect = params.zimitStartPage;
        return dirEntry;
    }

    function transformReplayUrls(dirEntry, data, mimetype, selectedArchive) {
        /**
         * Transform URL links in HTML files
         */
        if (/\bhtml\b/i.test(mimetype)) {
            var zimitPrefix = data.match(/link\s+rel=["']canonical["']\s+href=(['"])https?:\/\/([^\/]+)(.+?)\1/i);
            zimitPrefix = zimitPrefix ? zimitPrefix[2] : params.zimitPrefix;
            // Remove lazyimgage system and noscript tags that comment out images
            data = data.replace(/<noscript>\s*(<img\b[^>]+>)\s*<\/noscript>/ig, '$1');
            data = data.replace(/<span\b[^>]+lazy-image-placeholder[^<]+<\/span>\s*/ig, '');
            var regexpZimitHtmlLinks = /(<(?:a|img|script|link|track|meta)\b[^>]*?[\s;])(?:src|href|url)\s*(=\s*(["']))(?=\/|https?:\/\/)((?:[^>](?!\3|\?|#))+[^>])([^>]*>)/ig;
            // Get stem for constructing an absolute URL
            var indexRoot = window.location.pathname.replace(/[^\/]+$/, '') + encodeURI(selectedArchive._file.name);
            data = data.replace(regexpZimitHtmlLinks, function(match, blockStart, equals, quote, relAssetUrl, blockClose) {
                var newBlock = match;
                var assetUrl = relAssetUrl;
                // Remove google analytics and other analytics files that cause stall
                if (/google|analytics|typepad.*stats/i.test(assetUrl)) return '';
                // For Zimit assets that begin with https: or // the zimitPrefix is derived from the URL
                assetUrl = /^(?:https?:)?\/\//i.test(assetUrl) ? assetUrl.replace(/^(?:https?:)?\/\//i, '/' + dirEntry.namespace + '/') :
                // For root-relative links, we need to add the zimitPrefix
                /^\//.test(assetUrl) ? assetUrl.replace(/^\//, '/' + dirEntry.namespace + '/' + params.zimitPrefix + '/') : assetUrl; 
                // Deal with <meta http-equiv refresh...> directives
                if (/<meta\s+http-equiv[^>]+refresh\b/i.test(newBlock)) dirEntry.zimitRedirect = assetUrl.replace(/^\//, '');
                newBlock = newBlock.replace(relAssetUrl, indexRoot + assetUrl);
                return newBlock;
            });
            
            // Remove any <base href...> statements
            data = data.replace(/<base\b[^>]+href\b[^>]+>\s*/i, '');

            // Remove any residual analytics
            data = data.replace(/<script\b([^<]|<(?!\/script>))+?google.*?analytics([^<]|<(?!\/script>))+<\/script>\s*/i, '');
            
            // ZIM-specific overrides
            if (/(?:journals\.openedition\.org)/i.test(params.zimitPrefix)) {
                // Neutralize all inline scripts, excluding math blocks or react templates, as they cause a loop on loading article
                data = data.replace(/<(script\b(?![^>]+type\s*=\s*["'](?:math\/|text\/html|[^"']*?math))(?:[^<]|<(?!\/script>))+<\/script)>/ig, function (p0, p1) {
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

            // Remove shopping cart that attempts to post to server
            if (/passco/i.test(params.zimitPrefix)) {
                data = data.replace(/<script\b[^>]+cart-fragments(?:[^<]|<(?!\/script>))+<\/script>\s*/, '');
            }
            
        } // End of html transformations
        
        /**
         * Transform css-style links in stylesheet files and stylesheet blocks in HTML
         */
        if (/\b(css|html)\b/i.test(mimetype)) {
            var regexpZimitCssLinks = /url\s*\(['"\s]*([^)'"\s]+)['"\s]*\)/ig;
            data = data.replace(regexpZimitCssLinks, function (match, url) {
                var newBlock = match;
                var assetUrl = url;
                assetUrl = /^\/\//.test(assetUrl) ? assetUrl.replace(/^\/\//, dirEntry.namespace + '/') :
                // For root-relative links, we need to add the zimitPrefix
                /^\//.test(assetUrl) ? assetUrl.replace(/^\//, dirEntry.namespace + '/' + params.zimitPrefix + '/') :
                // Deal with absolute URLs
                /^https?:\/\//i.test(assetUrl) ? assetUrl.replace(/^https?:\/\//i, dirEntry.namespace + '/') : assetUrl; 
                newBlock = params.contentInjectionMode === 'serviceworker' ?
                    // If asset is relative, then just add the kiwix-display directive
                    assetUrl === url ? newBlock.replace(url, assetUrl + '?kiwix-display') :
                    newBlock.replace(url, '/' + selectedArchive._file.name + '/' + assetUrl + '?kiwix-display') :
                    // For jQuery mode, no change needed for relative links
                    assetUrl === url ? newBlock :
                    newBlock.replace(url, '/' + assetUrl);
                // console.debug('Transform: \n' + match + '\n -> ' + newBlock);
                return newBlock;
            });
        } // End of css transformations

        /**
         * Transform links in JavaScript files
         */
        if (/\b(javascript)\b/i.test(mimetype)) {
            var regexpZimitJavascriptLinks = /['"(]((?:https?:)?\/\/[^'"?#)]+)['"?#)]/ig;
            data = data.replace(regexpZimitJavascriptLinks, function (match, url) {
                var newBlock = match;
                var assetUrl = url;
                assetUrl = assetUrl.replace(/^\/\//, dirEntry.namespace + '/');
                assetUrl = assetUrl.replace(/^https?:\/\//i, dirEntry.namespace + '/'); 
                // Remove analytics
                assetUrl = /google|analytics|typepad.*stats/i.test(assetUrl) ? '' : assetUrl; 
                // if (assetUrl === url) return match; // If nothing was transformed, return
                newBlock = params.contentInjectionMode === 'serviceworker' ?
                    newBlock.replace(url, '/' + selectedArchive._file.name + '/' + assetUrl) :
                    newBlock.replace(url, '/' + assetUrl);
                // console.debug('Transform: \n' + match + '\n -> ' + newBlock);
                return newBlock;
            });
        } // End of JavaScript transformations

        return data;
    }

    return {
        setZimType: setZimType,
        filterReplayFiles: filterReplayFiles,
        getZimitLandingPage: getZimitLandingPage,
        transformReplayUrls: transformReplayUrls
    };
});
