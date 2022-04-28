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
        if (/(?:chunk\.js|\bload\.js|\bsw\.js)(?:[?#]|$)/.test(dirEntry.url)) {
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

        // Filter links in html files
        if (/\bhtml\b/.test(mimetype)) {
            var zimitPrefix = data.match(/link\s+rel=["']canonical["']\s+href=(['"])https?:\/\/([^\/]+)(.+?)\1/i);
            zimitPrefix = zimitPrefix ? zimitPrefix[2] : params.zimitPrefix;
            var regexpZimitHtmlLinks = /(<(?:a|img|script|link|track)\b[^>]*?\s)(?:src|href)(=(["']))(?=\/|https?:\/\/)([^>]+)(?=\3|\?|#)([^>]*>)/ig;
            data = data.replace(regexpZimitHtmlLinks, function(match, blockStart, equals, quote, relAssetUrl, blockClose) {
                var newBlock = match;
                var assetUrl = relAssetUrl;
                // For Zimit assets that begin with // the zimitPrefix is different and is given in the URL
                // assetUrl = assetUrl.replace(/^\/\//, dirEntry.namespace + '/');
                // For root-relative links, we need to add the zimitPrefix
                assetUrl = assetUrl.replace(/^\/\/?/, dirEntry.namespace + '/' + params.zimitPrefix + '/');
                assetUrl = assetUrl.replace(/^https?:\/\//i, dirEntry.namespace + '/'); 
                newBlock = params.contentInjectionMode === 'serviceworker' && !/^<a\s/i.test(match) ?
                    newBlock.replace(relAssetUrl, '/' + selectedArchive._file.name + '/' + assetUrl) :
                    newBlock.replace(relAssetUrl, '/' + assetUrl);
                console.debug('Transform: \n' + match + '\n -> ' + newBlock);
                return newBlock;
            });
            
            // Remove any <base href...> statements
            data = data.replace(/<base\b[^>]+href\b[^>]+>\s*/i, '');
            
            if (/journals\.openedition\.org/i.test(params.zimitPrefix)) {
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
        }
        
        if (/^text\/css\b/.test(mimetype)) {
            var regexpZimitCssLinks = /url\s*\(['"\s]*([^)'"]+\s*\))/ig;
            data = data.replace(regexpZimitCssLinks, function (match, url) {
                var newBlock = match;
                var assetUrl = url.replace(/^\//i, dirEntry.namespace + '/' + params.zimitPrefix + '/');
                assetUrl = assetUrl.replace(/^https?:\/\//i, dirEntry.namespace + '/'); 
                if (assetUrl === url) return match; // If nothing was transformed, return
                newBlock = params.contentInjectionMode === 'serviceworker' ?
                    newBlock.replace(url, '/' + selectedArchive._file.name + '/' + assetUrl) :
                    newBlock.replace(url, '/' + assetUrl);
                console.debug('Transform: \n' + match + '\n -> ' + newBlock);
                return newBlock;
            });
        }
        if (/\b(javascript)\b/.test(mimetype)) {
            var regexpZimitJavascriptLinks = /(https?:\/\/[^'"?#)]+)/ig;
            data = data.replace(regexpZimitJavascriptLinks, function (match, url) {
                var newBlock = match;
                // var assetUrl = url.replace(/^\//i, dirEntry.namespace + '/' + params.zimitPrefix + '/');
                var assetUrl = url.replace(/^https?:\/\//i, dirEntry.namespace + '/'); 
                // if (assetUrl === url) return match; // If nothing was transformed, return
                newBlock = params.contentInjectionMode === 'serviceworker' ?
                    newBlock.replace(url, '/' + selectedArchive._file.name + '/' + assetUrl) :
                    newBlock.replace(url, '/' + assetUrl);
                console.debug('Transform: \n' + match + '\n -> ' + newBlock);
                return newBlock;
            });
        }
        return data;
    }

    return {
        setZimType: setZimType,
        filterReplayFiles: filterReplayFiles,
        getZimitLandingPage: getZimitLandingPage,
        transformReplayUrls: transformReplayUrls
    };
});