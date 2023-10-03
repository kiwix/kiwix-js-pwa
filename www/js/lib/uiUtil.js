/**
 * uiUtil.js : Utility functions for the User Interface
 *
 * Copyright 2013-2023 Mossroy, Jaifroid and contributors
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

/* eslint-disable no-global-assign, indent */
/* global webpMachine, , params, appstate, Windows */

import util from './util.js';

/**
 * Global variables
 */
var itemsCount = false;

/**
 * Creates either a blob: or data: URI from the given content
 * The given attribute of the DOM node (nodeAttribute) is then set to this URI
 *
 * This is used to inject images (and other dependencies) into the article DOM
 *
 * @param {Object} node The node to which the URI should be added
 * @param {String} nodeAttribute The attribute to set to the URI
 * @param {Uint8Array} content The binary content to convert to a URI
 * @param {String} mimeType The MIME type of the content
 * @param {Boolean} makeDataURI If true, make a data: URI instead of a blob URL
 * @param {Function} callback An optional function to call with the URI
 */
function feedNodeWithBlob (node, nodeAttribute, content, mimeType, makeDataURI, callback) {
    // Decode WebP data if the browser does not support WebP and the mimeType is webp
    if (webpMachine && /image\/webp/i.test(mimeType)) {
        // If we're dealing with a dataURI, first convert to Uint8Array (polyfill cannot read data URIs)
        if (/^data:/i.test(content)) {
            content = util.dataURItoUint8Array(content);
        }
        // DEV: Note that webpMachine is single threaded and will reject an image if it is busy
        // However, the prepareImagesJQuery() function in images.js is sequential (it waits for a callback
        // before processing another image) so we do not need to queue WebP images here
        webpMachine.decode(content).then(function (uri) {
            // DEV: WebpMachine.decode() returns a data: URI
            // We callback before the node is set so that we don't incur slow DOM rewrites before processing more images
            if (callback) callback(uri);
            node.setAttribute(nodeAttribute, uri);
        }).catch(function (err) {
            console.error('There was an error decoding image in WebpMachine', err);
            if (callback) callback();
        });
    } else {
        var blob = new Blob([content], { type: mimeType });
        var url;
        if (makeDataURI) {
            // Because btoa fails on utf8 strings (in SVGs, for example) we need to use FileReader method
            // See https://developer.mozilla.org/en-US/docs/Web/API/WindowBase64/Base64_encoding_and_decoding#The_Unicode_Problem
            // url = 'data:' + mimeType + ';base64,' + btoa(util.uintToString(content));
            var myReader = new FileReader();
            myReader.onloadend = function () {
                url = myReader.result;
                node.setAttribute(nodeAttribute, url);
                if (callback) callback(url);
            };
            myReader.readAsDataURL(blob);
        } else {
            blob = new Blob([content], {
                type: mimeType
            });
            // Establish the current window (avoids having to pass it to this function)
            var docWindow = node.ownerDocument.defaultView || node.ownerDocument.parentWindow || window;
            url = docWindow.URL.createObjectURL(blob);
            if (callback) callback(url);
            node.addEventListener('load', function () {
                URL.revokeObjectURL(url);
            });
            node.setAttribute(nodeAttribute, url);
        }
    }
}

/**
 * Removes parameters and anchors from a URL
 * @param {type} url The URL to be processed
 * @returns {String} The same URL without its parameters and anchors
 */
function removeUrlParameters (url) {
    // Remove any querystring
    var strippedUrl = url.replace(/\?[^?]*$/, '');
    // Remove any anchor parameters - note that we are deliberately excluding entity references, e.g. '&#39;'.
    strippedUrl = strippedUrl.replace(/#[^#;]*$/, '');
    return strippedUrl;
}

// Transforms an asset (script or link) element string into a usable element containing the given content or a BLOB
// reference to the content
function createNewAssetElement (assetElement, attribute, content) {
    var tag = assetElement.match(/^<([^\s]+)/)[1];
    var regexpMatchAttr = new RegExp(attribute + '=["\']\\s*([^"\'\\s]+)');
    var attrUri = assetElement.match(regexpMatchAttr);
    attrUri = attrUri ? attrUri[1] : '';
    var mimetype = /type=["']\s*([^"'\s]+)/.exec(assetElement);
    mimetype = mimetype ? mimetype[1] : '';
    var newAsset;
    if (tag === 'link') {
        // We use inline style replacements in this case for compatibility with FFOS
        // If FFOS is no longer supported, we could use the more generic BLOB replacement below
        mimetype = mimetype || 'text/css';
        newAsset = '<style data-kiwixsrc="' + attrUri + '" type="' + mimetype + '">' + content + '</style>';
    } else {
        mimetype = mimetype || (tag === 'script' ? 'text/javascript' : '');
        var assetBlob = new Blob([content], { type: mimetype });
        var assetUri = URL.createObjectURL(assetBlob);
        var refAttribute = tag === 'script' ? 'src' : 'href';
        newAsset = assetElement.replace(attribute, refAttribute);
        newAsset = newAsset.replace(attrUri, assetUri);
        newAsset = newAsset.replace(/>/, ' data-kiwixsrc="' + attrUri + '">');
    }
    return newAsset;
}

function TableOfContents (articleDoc) {
    this.doc = articleDoc;
    this.headings = this.doc.querySelectorAll('h1, h2, h3, h4, h5, h6');

    this.getHeadingObjects = function () {
        var headings = [];
        for (var i = 0; i < this.headings.length; i++) {
            var element = this.headings[i];
            var obj = {};
            obj.id = element.id;
            var objectId = element.innerHTML.match(/\bid\s*=\s*["']\s*([^"']+?)\s*["']/i);
            obj.id = obj.id ? obj.id : objectId && objectId.length > 1 ? objectId[1] : '';
            obj.index = i;
            obj.textContent = element.textContent;
            obj.tagName = element.tagName;
            headings.push(obj);
        }
        return headings;
    };
}

function makeReturnLink (title) {
    // Abbreviate title if necessary
    var shortTitle = title.substring(0, 25);
    shortTitle = shortTitle === title ? shortTitle : shortTitle + '...';
    var link = '<h4 style="font-size:' + ~~(params.relativeUIFontSize * 1.4 * 0.14) + 'px;"><a href="#">&lt;&lt; Return to ' + shortTitle + '</a></h4>';
    var returnDivs = document.getElementsByClassName('returntoArticle');
    for (var i = 0; i < returnDivs.length; i++) {
        returnDivs[i].innerHTML = link;
    }
}

/**
 * Starts the spinner, with an optional message and optional timeout interval. If no timeout is specified, the spinner
 * will run for 3s before being cleared. If the timeout is set to true, the spinner will run indefinitely or until pollSpinner
 * is called again.
 * @param {String} msg A message to display below the spinner
 * @param {Integer|Boolean} noTimeoutOrInterval A timeout value, or if true, the spinner will run indefinitely until pollSpinner is called again
 */
function pollSpinner (msg, noTimeoutOrInterval) {
    msg = msg || '';
    document.getElementById('searchingArticles').style.display = 'block';
    var cachingAssets = document.getElementById('cachingAssets');
    cachingAssets.innerHTML = msg;
    if (msg) cachingAssets.style.display = 'block';
    else cachingAssets.style.display = 'none';
    // Never allow spinner to run for more than 3s
    clearTimeout(clearSpinner);
    if (!noTimeoutOrInterval || noTimeoutOrInterval !== true) {
        var interval = noTimeoutOrInterval || 3000;
        setTimeout(clearSpinner, interval);
    }
}

function clearSpinner () {
    document.getElementById('searchingArticles').style.display = 'none';
    var cachingAssets = document.getElementById('cachingAssets');
    cachingAssets.innerHTML = '';
    cachingAssets.style.display = 'none';
}

function printCustomElements () {
    // var innerDocument = window.frames[0].frameElement.contentDocument;
    var innerDocument = document.getElementById('articleContent').contentDocument;
    // For now, adding a printing stylesheet to a zimit ZIM appears to diasble printing of any images!
    if (appstate.wikimediaZimLoaded) {
        // Add any missing classes
        innerDocument.body.innerHTML = innerDocument.body.innerHTML.replace(/(class\s*=\s*["'][^"']*vcard\b[^>]+>\s*<span)>/ig, '$1 class="map-pin">');
        // Remove encapsulated External Links
        innerDocument.body.innerHTML = innerDocument.body.innerHTML.replace(/(<details\b(?![^>]"externalLinks"))((?:[^<]|<(?!\/details>))+?['"]external_links['"])/i, '$1 class="externalLinks" $2');
        // This is the best we can do for removing External Links if its not encapsulated
        innerDocument.body.innerHTML = innerDocument.body.innerHTML.replace(/(<(?:h2|span)\b[^<]+external_links(?:[^<]|<(?!\/div>|\/details>))+?<ul\s*(?!class="externalLinks"))/i, '$1 class="externalLinks" ');
        // Further Reading
        innerDocument.body.innerHTML = innerDocument.body.innerHTML.replace(/(<details\b(?![^>]"furtherReading"))((?:[^<]|<(?!\/details>))+?['"]further_reading['"])/i, '$1 class="furtherReading" $2');
        innerDocument.body.innerHTML = innerDocument.body.innerHTML.replace(/(<(?:h2|span)\b[^<]+further_reading(?:[^<]|<(?!\/div>|\/details>))+?<ul\s*(?!class="furtherReading"))/i, '$1 class="furtherReading" ');
        // See Also
        innerDocument.body.innerHTML = innerDocument.body.innerHTML.replace(/(<details\b(?![^>]"seeAlso"))((?:[^<]|<(?!\/details>))+?['"]see_also['"])/i, '$1 class="seeAlso" $2');
        innerDocument.body.innerHTML = innerDocument.body.innerHTML.replace(/(<(?:h2|span)\b[^<]+see_also(?:[^<]|<(?!\/div>|\/details>))+?<ul\s*(?!class="seeAlso"))/i, '$1 class="seeAlso" ');
        // References (this is for details-summary ZIMs only: it gets rid of the title)
        innerDocument.body.innerHTML = innerDocument.body.innerHTML.replace(/(<details\b(?![^>]"zimReferences"))((?:[^<]|<(?!\/details>))+?['"]references['"])/i, '$1 class="zimReferences" $2');
        // Sources (this is for details-summary ZIMs only: it gets rid of the title)
        innerDocument.body.innerHTML = innerDocument.body.innerHTML.replace(/(<details\b(?![^>]"zimSources"))((?:[^<]|<(?!\/details>))+?['"]sources['"])/i, '$1 class="zimSources" $2');
        innerDocument.body.innerHTML = innerDocument.body.innerHTML.replace(/(<div\s+)([^>]+>\s+This article is issued from)/i, '$1class="copyLeft" $2');
        // Remove openInTab div (we can't do this using DOM methods because it aborts code spawned from onclick event)
        innerDocument.body.innerHTML = innerDocument.body.innerHTML.replace(/<div\s(?=[^<]+?openInTab)(?:[^<]|<(?!\/div>))+<\/div>\s*/, '');
        // Add an @media print conditional stylesheet
        var printOptions = innerDocument.getElementById('printOptions');
        // If there is no printOptions style block in the iframe, create it
        if (!printOptions) {
            var printStyle = innerDocument.createElement('style');
            printStyle.id = 'printOptions';
            innerDocument.head.appendChild(printStyle);
            printOptions = innerDocument.getElementById('printOptions');
        }
        var printStyleInnerHTML = '@media print { ';
        printStyleInnerHTML += document.getElementById('printNavBoxCheck').checked ? '' : '.navbox, .vertical-navbox { display: none; } ';
        printStyleInnerHTML += document.getElementById('printEndNoteCheck').checked ? '' : '.reflist, div[class*=references], .zimReferences, .zimSources { display: none; } ';
        printStyleInnerHTML += document.getElementById('externalLinkCheck').checked ? '' : '.externalLinks, .furtherReading { display: none; } ';
        printStyleInnerHTML += document.getElementById('seeAlsoLinkCheck').checked ? '' : '.seeAlso { display: none; } ';
        printStyleInnerHTML += document.getElementById('printInfoboxCheck').checked ? '' : '.mw-stack, .infobox, .infobox_v2, .infobox_v3, .qbRight, .qbRightDiv, .wv-quickbar, .wikitable { display: none; } ';
        // printStyleInnerHTML += document.getElementById("printImageCheck").checked ? "" : "img, .gallery { display: none; } ";
        printStyleInnerHTML += '.copyLeft { display: none } ';
        printStyleInnerHTML += '.map-pin { display: none } ';
        printStyleInnerHTML += '.external { padding-right: 0 !important } ';
    }
    // Using @media print on images doesn't get rid of them all, so use brute force
    if (!document.getElementById('printImageCheck').checked) {
        innerDocument.body.innerHTML = innerDocument.body.innerHTML.replace(/<img\b[^>]*>\s*/ig, '');
    } else {
        // Remove any breakout link
        innerDocument.body.innerHTML = innerDocument.body.innerHTML.replace(/<img\b[^>]+id="breakoutLink"[^>]*>\s*/, '');
    }
    var sliderVal = document.getElementById('documentZoomSlider').value;
    sliderVal = ~~sliderVal;
    sliderVal = Math.floor(sliderVal * (Math.max(window.screen.width, window.screen.height) / 1440));
    if (appstate.wikimediaZimLoaded) {
        printStyleInnerHTML += 'body { font-size: ' + sliderVal + '% !important; } ';
        printStyleInnerHTML += '}';
        printOptions.innerHTML = printStyleInnerHTML;
    } else {
        innerDocument.body.style.setProperty('font-size', sliderVal + '%', 'important');
    }
}

function downloadBlobUWP (blob, filename, message) {
    // Copy BLOB to downloads folder and launch from there in Edge
    // First create an empty file in the folder
    Windows.Storage.DownloadsFolder.createFileAsync(filename, Windows.Storage.CreationCollisionOption.generateUniqueName)
        .then(function (file) {
        // Open the returned dummy file in order to copy the data into it
            file.openAsync(Windows.Storage.FileAccessMode.readWrite).then(function (output) {
            // Get the InputStream stream from the blob object
                var input = blob.msDetachStream();
                // Copy the stream from the blob to the File stream
                Windows.Storage.Streams.RandomAccessStream.copyAsync(input, output).then(function () {
                    output.flushAsync().done(function () {
                        input.close();
                        output.close();
                        // Finally, tell the system to open the file if it's not a subtitle file
                        if (!/\.(?:ttml|ssa|ass|srt|idx|sub|vtt)$/i.test(filename)) Windows.System.Launcher.launchFileAsync(file);
                        if (file.isAvailable) {
                            var fileLink = file.path.replace(/\\/g, '/');
                            fileLink = fileLink.replace(/^([^:]+:\/(?:[^/]+\/)*)(.*)/, function (p0, p1, p2) {
                                return 'file:///' + p1 + encodeURIComponent(p2);
                            });
                            if (message) {
                                message.innerHTML = '<strong>Download:</strong> Your file was saved as <a href="' +
                                fileLink + '" target="_blank" class="alert-link">' + file.path + '</a>';
                            }
                        // window.open(fileLink, null, "msHideView=no");
                        }
                    });
                });
            });
        });
}

/**
 * Derives the URL.pathname from a relative or semi-relative URL using the given base ZIM URL
 *
 * @param {String} url The (URI-encoded) URL to convert (e.g. "Einstein", "../Einstein",
 *      "../../I/im%C3%A1gen.png", "-/s/style.css", "/A/Einstein.html", "../static/bootstrap/css/bootstrap.min.css")
 * @param {String} base The base ZIM URL of the currently loaded article (e.g. "A/", "A/subdir1/subdir2/", "C/Singapore/")
 * @returns {String} The derived ZIM URL in decoded form (e.g. "A/Einstein", "I/imágen.png", "C/")
 */
function deriveZimUrlFromRelativeUrl (url, base) {
    // We use a dummy domain because URL API requires a valid URI
    var dummy = 'http://d/';
    var deriveZimUrl = function (url, base) {
        if (typeof URL === 'function') return new URL(url, base);
        // IE11 lacks URL API: workaround adapted from https://stackoverflow.com/a/28183162/9727685
        var d = document.implementation.createHTMLDocument('t');
        // innerHTML required as string contains HTML tags
        d.head.innerHTML = '<base href="' + base + '">';
        var a = d.createElement('a');
        a.href = url;
        return { pathname: a.href.replace(dummy, '') };
    };
    var zimUrl = deriveZimUrl(url, dummy + base);
    return decodeURIComponent(zimUrl.pathname.replace(/^\//, ''));
}

/**
 * Walk up the DOM tree to find the closest element where the tagname matches the supplied regular expression
 *
 * @param {Element} el The starting DOM element
 * @param {RegExp} rgx A regular expression to match the element's tagname
 * @returns {Element|null} The matching element or null if no match was found
 */
function getClosestMatchForTagname (el, rgx) {
    do {
        if (rgx.test(el.tagName)) return el;
        el = el.parentElement || el.parentNode;
    } while (el !== null && el.nodeType === 1);
    return null;
}

/**
 * Displays a Bootstrap warning alert with information about how to access content in a ZIM with unsupported active UI
 * @param {String} type The ZIM archive type ('open', 'zimit', or 'legacy')
 */
function displayActiveContentWarning (type) {
    // We have to add the alert box in code, because Bootstrap removes it completely from the DOM when the user dismisses it
    var alertHTML = '';
    if (params.contentInjectionMode === 'jquery' && type === 'open') {
        alertHTML = '<div id="activeContent" class="alert alert-warning alert-dismissible fade in" style="margin-bottom: 0;">' +
            '<a href="#" id="activeContentClose" class="close" data-dismiss="alert" aria-label="close">&times;</a>' +
        '<strong>Unable to display active content:</strong> To use <b>Archive Index</b> type a <b><i>space</i></b>, or for <b>URL Index</b> type ' +
            '<b><i>space / </i></b>, or else <a id="swModeLink" href="#contentInjectionModeDiv" class="alert-link">switch to Service Worker mode</a> ' +
            'if your platform supports it. &nbsp;[<a id="stop" href="#expertSettingsDiv" class="alert-link">Permanently hide</a>]' +
        '</div>';
    } else if (params.contentInjectionMode === 'serviceworker' && type === 'legacy') {
        alertHTML = '<div id="activeContent" class="alert alert-warning alert-dismissible fade in" style="margin-bottom: 0;">' +
            '<a href="#" id="activeContentClose" class="close" data-dismiss="alert" aria-label="close">&times;</a>' +
        '<strong>Legacy ZIM type!</strong> To display content correctly from this historical ZIM, ' +
            'please <a id="jqModeLink" href="#contentInjectionModeDiv" class="alert-link">switch to the legacy JQuery mode</a>. ' +
            'You may need to increase font size with zoom buttons at bottom of screen.&nbsp;[<a id="stop" href="#expertSettingsDiv" class="alert-link">Permanently hide</a>]' +
        '</div>';
    } else if (params.contentInjectionMode === 'serviceworker' && (params.manipulateImages || params.displayHiddenBlockElements || params.allowHTMLExtraction)) {
        alertHTML =
        '<div id="activeContent" class="alert alert-warning alert-dismissible fade in" style="margin-bottom: 0;">' +
            '<a href="#" id="activeContentClose" class="close" data-dismiss="alert" aria-label="close">&times;</a>' +
            '<strong>Active content may not work correctly:</strong> Please ' + (params.displayHiddenBlockElements
            ? '<a id="hbeModeLink" href="#displayHiddenBlockElementsDiv" class="alert-link">disable Display hidden block elements</a> '
            : params.manipulateImages ? '<a id="imModeLink" href="#imageManipulationDiv" class="alert-link">disable Image manipulation</a> ' : '') +
            (params.allowHTMLExtraction ? (params.displayHiddenBlockElements || params.manipulateImages ? 'and ' : '') +
            'disable Breakout icon ' : '') + 'for this content to work properly. To use Archive Index type a <b><i>space</i></b> ' +
            'in the box above, or <b><i>space / </i></b> for URL Index.&nbsp;[<a id="stop" href="#expertSettingsDiv" class="alert-link">Permanently hide</a>]' +
        '</div>';
    }
    if (type === 'zimit') {
        alertHTML =
        '<div id="activeContent" class="alert alert-warning alert-dismissible fade in" style="margin-bottom: 0;">' +
            '<a href="#" id="activeContentClose" class="close" data-dismiss="alert" aria-label="close">&times;</a>' +
            // '<strong>' + (params.contentInjectionMode === 'jquery' ? 'Limited Zimit' : 'Experimental') + ' support:</strong> ' +
            (params.contentInjectionMode === 'jquery' ? '<b>Limited Zimit support!</b> Please <a id="swModeLink" href="#contentInjectionModeDiv" ' +
            'class="alert-link">switch to Service Worker mode</a> if your platform supports it. '
                : 'Support for <b>Zimit</b> archives is experimental. Some content (e.g. audio/video) may fail. ') +
            'You can search for content above' + (appstate.selectedArchive._file.fullTextIndex ? ' using full-text search if your app supports it, ' +
            'or s' : '. S') + 'tart your search with <b>.*</b> to match part of a title. Type a <b><i>space</i></b> for the ZIM Archive Index, or ' +
            '<b><i>space / </i></b> for the URL Index.&nbsp;[<a id="stop" href="#expertSettingsDiv" class="alert-link">Permanently hide</a>]' +
        '</div>';
    }
    const alertBoxHeader = document.getElementById('alertBoxHeader');
    alertBoxHeader.innerHTML = alertHTML;
    alertBoxHeader.style.display = 'block';
    document.getElementById('activeContentClose').addEventListener('click', function () {
        // Hide the alert box
        alertBoxHeader.style.display = 'none';
    });
    ['swModeLink', 'jqModeLink', 'imModeLink', 'hbeModeLink', 'stop'].forEach(function (id) {
        // Define event listeners for both hyperlinks in alert box: these take the user to the Config tab and highlight
        // the options that the user needs to select
        var modeLink = document.getElementById(id);
        if (modeLink) {
            modeLink.addEventListener('click', function () {
                var elementID = id === 'stop' ? 'hideActiveContentWarningCheck'
                    : id === 'swModeLink' ? 'serviceworkerModeRadio'
                        : id === 'jqModeLink' ? 'jQueryModeRadio'
                            : id === 'imModeLink' ? 'manipulateImagesCheck' : 'displayHiddenBlockElementsCheck';
                var thisLabel = document.getElementById(elementID).parentNode;
                thisLabel.style.borderColor = 'red';
                thisLabel.style.borderStyle = 'solid';
                // Make sure the container is visible
                var container = thisLabel.parentNode;
                if (!/panel-body/.test(container.className)) {
                    container = container.parentNode;
                }
                container.style.display = 'block';
                container.previousElementSibling.innerHTML = container.previousElementSibling.innerHTML.replace(/▶/, '▼');
                var btnHome = document.getElementById('btnHome');
                [thisLabel, btnHome].forEach(function (ele) {
                // Define event listeners to cancel the highlighting both on the highlighted element and on the Home tab
                    ele.addEventListener('mousedown', function () {
                        thisLabel.style.borderColor = '';
                        thisLabel.style.borderStyle = '';
                    });
                });
                alertBoxHeader.style.display = 'none';
                document.getElementById('btnConfigure').click();
            });
        }
    });
}

/**
 * Displays a Bootstrap alert box at the foot of the page to enable saving the content of the given title to the device's filesystem
 * and initiates download/save process if this is supported by the OS or Browser
 *
 * @param {String} title The path and filename to the file to be extracted
 * @param {Boolean|String} download A Bolean value that will trigger download of title, or the filename that should
 *     be used to save the file in local FS
 * @param {String} contentType The mimetype of the downloadable file, if known
 * @param {Uint8Array} content The binary-format content of the downloadable file
 * @param {Boolean} autoDismiss If true, dismiss the alert programmatically
 */
function displayFileDownloadAlert (title, download, contentType, content, autoDismiss) {
    // We have to create the alert box in code, because Bootstrap removes it completely from the DOM when the user dismisses it
    document.getElementById('alertBoxFooter').innerHTML =
        '<div id="downloadAlert" class="alert alert-info alert-dismissible">' +
        '    <a href="#" id="downloaAlertClose" class="close" data-dismiss="alert" aria-label="close">&times;</a>' +
        '    <span id="alertMessage"></span>' +
        '</div>';
    // Download code adapted from https://stackoverflow.com/a/19230668/9727685
    if (!contentType || /application.download/i.test(contentType)) {
        // DEV: Add more contentTypes here for downloadable files
        contentType =
            /\.epub([?#]|$)/i.test(title) ? 'application/epub+zip'
            : /\.pdf([?#]|$)/i.test(title) ? 'application/pdf'
            : /\.zip([?#]|$)/i.test(title) ? 'application/zip'
            : /\.png([?#]|$)/i.test(title) ? 'image/png'
            : /\.jpe?g([?#]|$)/i.test(title) ? 'image/jpeg'
            : /\.webp([?#]|$)/i.test(title) ? 'image/webp'
            : /\.svg([?#]|$)/i.test(title) ? 'image/svg+xml'
            : /\.gif([?#]|$)/i.test(title) ? 'image/gif'
            : /\.tiff([?#]|$)/i.test(title) ? 'image/tiff'
            : /\.mp4([?#]|$)/i.test(title) ? 'video/mp4'
            : /\.(webm)([?#]|$)/i.test(title) ? 'video/webm'
            : /\.mpeg([?#]|$)/i.test(title) ? 'video/mpeg'
            : /\.mp3([?#]|$)/i.test(title) ? 'audio/mpeg'
            // Default contentType if no match:
            : 'application/octet-stream';
    }
    var a = document.createElement('a');
    var blob = new Blob([content], { type: contentType });
    // If the filename to use for saving has not been specified, construct it from title
    var filename = download === true ? title.replace(/^.*\/([^\\/?#&]*).*$/, '$1') : download;
    // If not match was possible from the title, give it a generic name
    if (filename === title || !filename) filename = 'downloadfile';
    // Make filename safe
    filename = filename.replace(/[/\\:*?"<>|#&]/g, '_');
    // If the file doesn't have an extension, add one for compatibility with older browsers
    if (!/\.(epub|pdf|odt|zip|png|jpe?g|webp|svg|gif|tiff|mp4|webm|mpe?g|mp3)([?#]|$)/i.test(filename)) {
        var extension =
            /epub/i.test(contentType) ? '.epub'
            : /pdf/i.test(contentType) ? '.pdf'
            : /opendument/i.test(contentType) ? '.odt'
            : /\/zip$/i.test(contentType) ? '.zip'
            : /png/i.test(contentType) ? '.png'
            : /jpeg/i.test(contentType) ? '.jpeg'
            : /webp/i.test(contentType) ? '.webp'
            : /svg/i.test(contentType) ? '.svg'
            : /gif/i.test(contentType) ? '.gif'
            : /tiff/i.test(contentType) ? '.tiff'
            : /mp4/i.test(contentType) ? '.mp4'
            : /webm/i.test(contentType) ? '.webm'
            : /mpeg/i.test(contentType) ? '.mpeg'
            : /mp3/i.test(contentType) ? '.mp3' : '';
        filename = filename.replace(/^(.*?)([#?]|$)/, '$1' + extension);
    }
    a.href = window.URL.createObjectURL(blob);
    a.target = '_blank';
    a.type = contentType;
    a.download = filename;
    a.classList.add('alert-link');
    a.innerHTML = filename;
    var alertMessage = document.getElementById('alertMessage');
    alertMessage.innerHTML = '<strong>Download</strong> If the download does not start, please tap the following link: ';
    // We have to add the anchor to a UI element for Firefox to be able to click it programmatically: see https://stackoverflow.com/a/27280611/9727685
    alertMessage.appendChild(a);
    var downloadAlert = document.getElementById('downloadAlert');
    // For IE11 we need to force use of the saveBlob method with the onclick event
    if (window.navigator && window.navigator.msSaveBlob) {
        a.addEventListener('click', function (e) {
            window.navigator.msSaveBlob(blob, filename);
            e.preventDefault();
        });
    }
    document.getElementById('downloaAlertClose').addEventListener('click', function () {
        downloadAlert.style.display = 'none';
    });
    try {
        a.click();
        // Following line should run only if there was no error, leaving the alert showing in case of error
        if (autoDismiss && downloadAlert) downloadAlert.style.display = 'none';
        return;
    } catch (err) {
        // Edge will error out unless there is a download added but Chrome works better without the attribute
        a.download = filename;
    }
    try {
        a.click();
        // Following line should run only if there was no error, leaving the alert showing in case of error
        if (autoDismiss && downloadAlert) downloadAlert.style.display = 'none';
    } catch (err) {
        // And try to launch through UWP download
        if (typeof Windows !== 'undefined' && Windows.Storage) {
            downloadBlobUWP(blob, filename, alertMessage);
            if (autoDismiss && downloadAlert) downloadAlert.style.display = 'none';
        } else {
            // Last gasp attempt to open automatically
            window.open(a.href);
        }
    }
}

/**
 * Initiates XMLHttpRequest
 * Can be used for loading local files; CSP may restrict access to remote files due to CORS
 *
 * @param {URL} url The Uniform Resource Locator to be read
 * @param {String} responseType The response type to return (arraybuffer|blob|document|json|text);
 *     (passing an empty or null string defaults to text)
 * @param {Function} callback The function to call with the result: data, mimetype, and status or error code
 */
function XHR (url, responseType, callback) {
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function (e) {
        if (this.readyState == 4) {
            callback(this.response, this.response.type, this.status);
        }
    };
    var err = false;
    try {
        xhr.open('GET', url, true);
        if (responseType) xhr.responseType = responseType;
    } catch (e) {
        console.log('Exception during GET request: ' + e);
        err = true;
    }
    if (!err) {
        xhr.send();
    } else {
        callback('Error', null, 500);
    }
}

/**
 * Inserts a link to break the article out to a new browser tab
 *
 * @param {String} mode The app mode to use for the breakoutLink icon (light|dark)
 */
function insertBreakoutLink (mode) {
    var desc = 'Open article in new tab or window';
    var iframe = document.getElementById('articleContent').contentDocument;
    // This code provides an absolute link, removing the file and any query string from href (we need this because of SW mode)
    var prefix = (window.location.protocol + '//' + window.location.host + window.location.pathname).replace(/\/[^/]*$/, '');
    var div = document.createElement('div');
    div.style.cssText = 'top: 10px; right: 25px; position: relative; z-index: 2; float: right;';
    div.id = 'openInTab';
    div.innerHTML = '<a href="#"><img id="breakoutLink" src="' + prefix + '/img/icons/' + (mode == 'light' ? 'new_window.svg' : 'new_window_lb.svg') + '" width="30" height="30" alt="' + desc + '" title="' + desc + '"></a>';
    iframe.body.insertBefore(div, iframe.body.firstChild);
    var openInTab = iframe.getElementById('openInTab');
    openInTab.addEventListener('click', function (e) {
        e.preventDefault();
        itemsCount = false;
        params.preloadingAllImages = false;
        extractHTML();
    });
}

/**
 * Extracts self-contained HTML from the iframe DOM, transforming BLOB references to dataURIs
 */
function extractHTML () {
    if (params.preloadingAllImages !== true) {
        params.preloadAllImages();
        return;
    }
    var iframe = document.getElementById('articleContent').contentDocument;
    // Store the html for the head section, to restore later (in SW mode, stylesheets will be transformed to dataURI links,
    // which only work from file:/// URL, due to CORS, so they have to be restored)
    var headHtml = iframe.head.innerHTML;
    var title = iframe.title;
    if (itemsCount === false) {
        // Establish the source items that need to be extracted to self-contained URIs
        // DEV: Add any further sources to the querySelector below
        var items = iframe.querySelectorAll('img[src],link[href][rel="stylesheet"]');
        itemsCount = items.length;
        Array.prototype.slice.call(items).forEach(function (item) {
            // Extract the BLOB itself from the URL (even if it's a blob: URL)
            var itemUrl = item.href || item.src;
            XHR(itemUrl, 'blob', function (response, mimetype, status) {
                if (status == 500) {
                    itemsCount--;
                    return;
                }
                // Pure SVG images may be missing the mimetype
                if (!mimetype) mimetype = /\.svg$/i.test(itemUrl) ? 'image/svg+xml' : '';
                // Now read the data from the extracted blob
                var myReader = new FileReader();
                myReader.addEventListener('loadend', function () {
                    if (myReader.result) {
                        var dataURL = myReader.result.replace(/data:;/, 'data:' + mimetype + ';');
                        if (item.href) {
                            try { item.href = dataURL; } catch (err) { null; }
                        }
                        if (item.src) {
                            try { item.src = dataURL; } catch (err) { null; }
                        }
                    }
                    itemsCount--;
                    if (itemsCount === 0) extractHTML();
                });
                // Start the reading process.
                myReader.readAsDataURL(response);
            });
        });
    }
    if (itemsCount > 0) return; // Ensures function stops if we are still extracting images or css
    // Construct filename (forbidden characters will be removed in the download function)
    var filename = title.replace(/(\.html?)*$/i, '.html');
    var html = iframe.documentElement.outerHTML;
    // Remove openInTab div (we can't do this using DOM methods because it aborts code spawned from onclick event)
    html = html.replace(/<div\s(?=[^<]+?openInTab)(?:[^<]|<(?!\/div>))+<\/div>\s*/, '');
    var blob = new Blob([html], { type: 'text/html' });
    // We can't use window.open() because pop-up blockers block it, so use explicit BLOB download
    displayFileDownloadAlert(title, filename, 'text/html', blob, true);
    // Restore original head section (to restore any transformed stylesheets)
    iframe.head.innerHTML = headHtml;
    itemsCount = false;
    params.preloadingAllImages = false;
    clearSpinner();
}

/**
 * Displays a Bootstrap alert or confirm dialog box depending on the options provided
 *
 * @param {String} message The alert message(can be formatted using HTML) to display in the body of the modal.
 * @param {String} label The modal's label or title which appears in the header (optional, Default = "Confirmation" or "Message")
 * @param {Boolean} isConfirm If true, the modal will be a confirm dialog box, otherwise it will be a simple alert message
 * @param {String} declineConfirmLabel The text to display on the decline confirmation button (optional, Default = "Cancel")
 * @param {String} approveConfirmLabel  The text to display on the approve confirmation button (optional, Default = "Confirm")
 * @param {String} closeMessageLabel  The text to display on the close alert message button (optional, Default = "Okay")
 * @param {String} alertModal The modal to display (optional)
 * @returns {Promise<Boolean>} A promise which resolves to true if the user clicked Confirm, false if the user clicked Cancel/Okay, backdrop or the cross(x) button
 */
function systemAlert (message, label, isConfirm, declineConfirmLabel, approveConfirmLabel, closeMessageLabel, alertModal) {
    alertModal = alertModal || 'alertModal';
    var prfx = alertModal === 'myModal' ? 'my' : alertModal === 'printModal' ? 'print' : '';
    declineConfirmLabel = declineConfirmLabel || 'Cancel';
    approveConfirmLabel = approveConfirmLabel || 'Confirm';
    closeMessageLabel = closeMessageLabel || 'Okay';
    label = label || (isConfirm ? 'Confirmation' : 'Message');
    return util.PromiseQueue.enqueue(function () {
        return new Promise(function (resolve, reject) {
            if (!message) reject(new Error('Missing body message'));
            // Set the text to the modal and its buttons
            document.getElementById('approveConfirm').textContent = approveConfirmLabel;
            document.getElementById('declineConfirm').textContent = declineConfirmLabel;
            document.getElementById('closeMessage').textContent = closeMessageLabel;
            document.getElementById('modalLabel').textContent = label;
            // Using innerHTML to set the message to allow HTML formatting
            document.getElementById('modalText').innerHTML = message;
            // Display buttons acc to the type of alert
            document.getElementById('approveConfirm').style.display = isConfirm ? 'inline' : 'none';
            document.getElementById('declineConfirm').style.display = isConfirm ? 'inline' : 'none';
            document.getElementById('closeMessage').style.display = isConfirm ? 'none' : 'inline';
            // Display the modal
            const modal = document.getElementById(alertModal);
            const backdrop = document.createElement('div');
            backdrop.classList.add('modal-backdrop');
            backdrop.style.opacity = '0.3';
            document.body.appendChild(backdrop);

            // Show the modal
            document.body.classList.add('modal-open');
            modal.classList.add('show');
            modal.style.display = 'block';
            backdrop.classList.add('show');

            // Set the ARIA attributes for the modal
            modal.setAttribute('aria-hidden', 'false');
            modal.setAttribute('aria-modal', 'true');
            modal.setAttribute('role', 'dialog');

            // Get elements to which we will attach event listeners
            var modalCloseBtn = document.getElementById(prfx + 'modalCloseBtn')
            var declineConfirm = document.getElementById(prfx + 'declineConfirm');
            var closeMessage = document.getElementById(prfx + 'closeMessage');
            var approveConfirm = document.getElementById(prfx + 'approveConfirm');

            // Hide modal handlers
            var closeModalHandler = function () {
                document.body.classList.remove('modal-open');
                modal.classList.remove('show');
                modal.style.display = 'none';
                backdrop.classList.remove('show');
                if (Array.from(document.body.children).indexOf(backdrop) >= 0) {
                    document.body.removeChild(backdrop);
                }
                // remove event listeners
                if (modalCloseBtn) modalCloseBtn.removeEventListener('click', close);
                if (declineConfirm) declineConfirm.removeEventListener('click', close);
                if (closeMessage) closeMessage.removeEventListener('click', close);
                if (approveConfirm) approveConfirm.removeEventListener('click', closeConfirm);
                modal.removeEventListener('click', close);
                document.getElementsByClassName('modal-dialog')[0].removeEventListener('click', stopOutsideModalClick);
                modal.removeEventListener('keyup', keyHandler);
            };

            // function to call when modal is closed
            var close = function (e) {
                // If user clicked on the backdrop, close the modal
                if (e.target.id === alertModal || /close|decline/i.test(e.target.id)) {
                    closeModalHandler();
                    resolve(false);
                }
            };
            var closeConfirm = function () {
                closeModalHandler();
                resolve(true);
            };
            var stopOutsideModalClick = function (e) {
                e.stopPropagation();
            };
            var keyHandler = function (e) {
                if (/Enter/.test(e.key)) {
                    // We need to focus before clicking the button, because the handler above is based on document.activeElement
                    if (isConfirm) {
                        approveConfirm.focus();
                        approveConfirm.click();
                    } else {
                        closeMessage.focus();
                        closeMessage.click();
                    }
                } else if (/Esc/.test(e.key)) {
                    modalCloseBtn.focus();
                    modalCloseBtn.click();
                }
            };

            // When hide modal is called, resolve promise with true if hidden using approve button, false otherwise
            if (modalCloseBtn) modalCloseBtn.addEventListener('click', close);
            if (declineConfirm) declineConfirm.addEventListener('click', close);
            if (closeMessage) closeMessage.addEventListener('click', close);
            if (approveConfirm) approveConfirm.addEventListener('click', closeConfirm);
            modal.addEventListener('click', close);
            document.getElementsByClassName('modal-dialog')[0].addEventListener('click', stopOutsideModalClick);
            modal.addEventListener('keyup', keyHandler);
            // Set focus to the first focusable element inside the modal
            modal.focus();
        });
    }).catch(function (err) {
        console.warn(err);
    });
}

/**
 * Shows that an upgrade is ready to install
 * @param {String} ver The version of the upgrade
 * @param {String} type Either 'load', 'install' or 'download' according to the type of upgrade
 * @param {String} url An optional download URL
 */
function showUpgradeReady (ver, type, url) {
    const alertBoxPersistent = document.getElementById('alertBoxPersistent');
    alertBoxPersistent.innerHTML =
        '<div id="upgradeAlert" class="alert alert-info alert-dismissible">\n' +
        '    <a href="#" id="closeUpgradeAlert" class="close" data-dismiss="alert" aria-label="close">&times;</a>\n' +
        '    <span id="persistentMessage"></span>\n' +
        '</div>\n';
    document.getElementById('persistentMessage').innerHTML = 'Version ' + ver +
        (url ? ' is available to ' + type + '! Go to <a href="' + url + '" style="color:white;" target="_blank">' + url + '</a>'
            : ' is ready to ' + type + '! (Re-launch app to ' + type + '.)');
    document.getElementById('closeUpgradeAlert').addEventListener('click', function () {
        alertBoxPersistent.style.display = 'none';
    });
}

/**
 * Checks if a server is accessible by attempting to load a test image from the server
 *
 * @param {String} imageSrc The full URI of the image
 * @param {any} onSuccess A function to call if the image can be loaded
 * @param {any} onError A function to call if the image cannot be loaded
 */
function checkServerIsAccessible (imageSrc, onSuccess, onError) {
    var image = new Image();
    image.onload = onSuccess;
    image.onerror = onError;
    image.src = imageSrc;
}

/**
 * Checks whether an element is partially or fully inside the current viewport, and adds the rect.top value to element.top
 *
 * @param {Window} area The Window to check
 * @param {Element} el The DOM element for which to check visibility
 * @param {Boolean} fully If true, checks that the entire element is inside the viewport
 * @param {Integer} offset An additional bottom (+) or top (-) margin to include in the search window
 * @returns {Boolean} True if the element is fully or partially inside the current viewport
 */
function isElementInView (area, el, fully, offset) {
    offset = offset || 0;
    var rect = el.getBoundingClientRect();
    el.top = rect.top;
    // console.log(el.dataset.kiwixurl + ': ' + rect.top);
    if (fully) { return rect.top > 0 + (offset < 0 ? offset : 0) && rect.bottom < area.innerHeight + (offset > 0 ? offset : 0) && rect.left > 0 && rect.right < area.innerWidth; } else { return rect.top < area.innerHeight + (offset > 0 ? offset : 0) && rect.bottom > 0 + (offset < 0 ? offset : 0) && rect.left < area.innerWidth && rect.right > 0; }
}

/**
 * Initiates pointer touch events on the given element in order to set the zoom level
 *
 * @param {Element} element The element to which the pointer events should be attached
 * @param {Node} container The node to which the pointer events should be applied, if different
 */
function initTouchZoom (element, container) {
    container = container || element;
    // Global vars to cache event state
    appstate.evCache = new Array();
    appstate.prevDiff = -1;
    // Set initial element transforms
    var contentWin = element.ownerDocument.defaultView || element.ownerDocument.parentWindow;
    container.style.transformOrigin = 'left top'; // DEV: To support RTL languages, this should be 'right top'
    appstate.windowScale = 1;
    appstate.sessionScale = 1;
    appstate.startVector = null;
    // Install event handlers for the pointer target
    element.onpointerdown = pointerdown_handler;
    element.onpointermove = function (event) {
        pointermove_handler(event, container, contentWin);
    };
    // Use same handler for pointer{up,cancel,out,leave} events since
    // the semantics for these events - in this app - are the same.
    element.onpointerup = pointerup_handler;
    element.onpointercancel = pointerup_handler;
    element.onpointerout = pointerup_handler;
    element.onpointerleave = pointerup_handler;
}

function pointerdown_handler (ev) {
    // The pointerdown event signals the start of a touch interaction.
    // This event is cached to support 2-finger gestures
    appstate.evCache.push(ev);
    // console.debug('pointerDown', ev);
}

function pointermove_handler (ev, cont, win) {
    // This function implements a 2-pointer horizontal pinch/zoom gesture.
    // console.debug('pointerMove', ev);
    // Find this event in the cache and update its record with this event
    for (var i = 0; i < appstate.evCache.length; i++) {
        if (ev.pointerId == appstate.evCache[i].pointerId) {
            appstate.evCache[i] = ev;
            break;
        }
    }

    // If two pointers are down, check for pinch gestures
    if (appstate.evCache.length == 2) {
        ev.preventDefault();
        // Calculate the distance between the two pointers
        var x0 = appstate.evCache[0].clientX;
        var y0 = appstate.evCache[0].clientY;
        var x1 = appstate.evCache[1].clientX;
        var y1 = appstate.evCache[1].clientY;
        var curDiff = Math.abs(Math.sqrt(Math.pow(x1 - x0, 2) + Math.pow(y1 - y0, 2)));
        // console.debug('Current difference: ' + curDiff);
        if (appstate.prevDiff > 0) {
            if (appstate.startVector === null) {
                appstate.startVector = curDiff;
                appstate.scrollXStart = win.scrollX / appstate.windowScale;
                appstate.scrollYStart = win.scrollY / appstate.windowScale;
                // console.debug('scrollXStart: ' + appstate.scrollXStart);
            }
            appstate.windowScale = appstate.sessionScale * curDiff / appstate.startVector;
            // console.debug('winScrollY: ' + win.scrollY);
            // console.debug('winScrollX: ' + win.scrollX);
            // console.debug('x0x1 mean: ' + (x0 + x1)/2);
            // console.debug('y0y1 mean: ' + (y0 + y1)/2);
            cont.style.transform = 'scale(' + appstate.windowScale + ')';
            win.scrollTo(appstate.scrollXStart * appstate.windowScale, appstate.scrollYStart * appstate.windowScale);
        }

        // Cache the distance for the next move event
        appstate.prevDiff = curDiff;
    }
}

function pointerup_handler (ev) {
    // console.debug(ev.type, ev);
    // Remove this pointer from the cache
    remove_event(ev);

    // If the number of pointers down is less than two then reset diff tracker
    if (appstate.evCache.length < 2) {
        appstate.prevDiff = -1;
    }
}

function remove_event (ev) {
    // Remove this event from the target's cache
    for (var i = 0; i < appstate.evCache.length; i++) {
        if (appstate.evCache[i].pointerId == ev.pointerId) {
            appstate.evCache.splice(i, 1);
            break;
        }
    }
    appstate.startVector = null;
    appstate.sessionScale = appstate.windowScale;
}

// Reports an error in loading one of the ASM or WASM machines to the UI API Status Panel
// This can't be done in app.js because the error occurs after the API panel is first displayed
function reportAssemblerErrorToAPIStatusPanel (decoderType, error, assemblerMachineType) {
    console.error('Could not instantiate any ' + decoderType + ' decoder!', error);
    params.decompressorAPI.assemblerMachineType = assemblerMachineType;
    params.decompressorAPI.errorStatus = 'Error loading ' + decoderType + ' decompressor!';
    var decompAPI = document.getElementById('decompressorAPIStatus');
    decompAPI.textContent = 'Decompressor API: ' + params.decompressorAPI.errorStatus;
    decompAPI.className = 'apiBroken';
    document.getElementById('apiStatusDiv').className = 'panel panel-danger';
}

// Reports the search provider to the API Status Panel
function reportSearchProviderToAPIStatusPanel (provider) {
    var providerAPI = document.getElementById('searchProviderStatus');
    if (providerAPI) { // NB we need this so that tests don't fail
        providerAPI.textContent = 'Search Provider: ' + (/^fulltext/.test(provider) ? 'Title + Xapian [' + provider + ']'
            : /^title/.test(provider) ? 'Title only [' + provider + ']' : 'Not initialized');
        providerAPI.className = /^fulltext/.test(provider) ? 'apiAvailable' : !/ERROR/.test(provider) ? 'apiUnavailable' : 'apiBroken';
    }
}

/**
 * Warn the user that he/she clicked on an external link, and open it in a new tab
 *
 * @param {Event} event The click event (on an anchor) to handle (optional, but if not provided, clickedAnchor must be provided)
 * @param {Element} clickedAnchor The DOM anchor that has been clicked (optional, defaults to event.target)
 * @param {String} message The message to display to the user (optional, defaults to a generic message)
 */
function warnAndOpenExternalLinkInNewTab (event, clickedAnchor, message) {
    if (event) {
        // We have to prevent any blank target from firing on the original event
        event.target.removeAttribute('target');
        event.preventDefault();
        event.stopPropagation();
    }
    if (!clickedAnchor) clickedAnchor = event.target;
    var href = clickedAnchor.protocol ? clickedAnchor.href : 'http://' + clickedAnchor.href;
    clickedAnchor.type = clickedAnchor.type || (/https:\/\/www.openstreetmap.*?mlat/.test(href) ? 'map' : 'link');
    message = message || '<p>Click the link to open this external ' + clickedAnchor.type + ' (in a new ' + params.windowOpener + ')';
    var anchor = '<a id="kiwixExternalLink" href="' + href + '" style="word-break:break-all;">' + clickedAnchor.href + '</a>';
    message += ':</p>' + anchor;
    var opener = function (ev) {
        try {
            window.open(href,  params.windowOpener === 'tab' ? '_blank' : (ev ? ev.target.title : 'Download'),
                params.windowOpener === 'window' ? 'toolbar=0,location=0,menubar=0,width=800,height=600,resizable=1,scrollbars=1' : null);
            if (ev) ev.preventDefault();
        } catch (e) {
            if (!ev) systemAlert('We could not open this link programmatically! Please turn on "Warn before opening external links" in Configuration (under "Control of browsing data") and try again.');
            else ev.target.target = '_blank';
        }
    };
    if (params.openExternalLinksInNewTabs) {
        systemAlert(message, 'Opening external ' + clickedAnchor.type, false, null, null, 'Close');
        // Close dialog box if user clicks the link
        document.getElementById('kiwixExternalLink').addEventListener('click', function (e) {
            opener(e);
            document.getElementById('closeMessage').click();
        });
    } else {
        opener();
    }
}

/**
 * Set up toggles to make Configuration headings collapsible
 */
function setupConfigurationToggles () {
    var configHeadings = document.querySelectorAll('.panel-heading');
    Array.prototype.slice.call(configHeadings).forEach(function (panelHeading) {
        var headingText = panelHeading.innerHTML;
        var panelBody = panelHeading.nextElementSibling;
        var panelParent = panelHeading.parentElement;
        var panelPrevious = panelParent ? panelParent.previousElementSibling : null;
        if (panelPrevious && !/panel\s/.test(panelPrevious.className)) panelPrevious = null;
        var panelPreviousHeading = panelPrevious ? panelPrevious.querySelector('.panel-heading') : null;
        var panelNext = panelParent ? panelParent.nextElementSibling : null;
        if (panelNext && !/panel\s/.test(panelNext.className)) panelPrevious = null;
        var panelNextHeading = panelNext ? panelNext.querySelector('.panel-heading') : null;
        panelHeading.addEventListener('click', function () {
            if (/▶/.test(panelHeading.innerHTML)) {
                panelHeading.innerHTML = panelHeading.innerHTML.replace(/([▼▶]\s)?/, '▼ ');
                panelBody.style.display = 'block';
                // We're opening, so separate from previous and next
                if (panelPrevious) panelPrevious.style.marginBottom = null;
                if (panelParent) panelParent.style.marginBottom = panelNext ? null : 0;
                // Close all other panels
                Array.prototype.slice.call(configHeadings).forEach(function (head) {
                    var text = head.innerHTML;
                    if (/▶/.test(text)) return;
                    // Don't close panel for certain cases
                    if (panelHeading === head || /API\sStatus/.test(text + headingText)||
                        !params.appCache && /Troubleshooting/.test(text)) return;
                    head.click();
                });
            } else {
                panelHeading.innerHTML = panelHeading.innerHTML.replace(/([▼▶]\s)?/, '▶ ');
                panelBody.style.display = 'none';
                if (panelPrevious) panelPrevious.style.marginBottom = panelPreviousHeading && /▼/.test(panelPreviousHeading.innerHTML) ? null: 0;
                if (panelNext) panelParent.style.marginBottom = panelNextHeading && /▼/.test(panelNextHeading.innerHTML) ? null : 0;
            }
        });

        // Close each heading to begin with, except the first and specials
        var exceptionTest = function (testStr) {
            return /Display\ssize|API\sStatus/i.test(testStr) || /Troubleshooting/i.test(testStr) && !params.appCache;
        }
        if (panelNext) panelNextHeading.innerHTML = (exceptionTest(panelNextHeading.innerHTML) ? '&#9660; ' : '&#9654; ') + panelNextHeading.innerHTML;
        var icon = exceptionTest(headingText) ? '▼ ' : '▶ ';
        panelHeading.innerHTML = panelHeading.innerHTML.replace(/([▼▶]\s)?/, icon);
        if (panelBody && !exceptionTest(headingText)) panelBody.style.display = 'none';
        var marginBottom = 0;
        marginBottom = /▼/.test(panelHeading.innerHTML) ? null : marginBottom;
        if (panelNext) panelParent.style.marginBottom = /▼/.test(panelNextHeading.innerHTML) ? null : marginBottom;
        else panelParent.style.marginBottom = 0;
    });
    // Programme the button to toggle all settings
    document.getElementById('btnToggleSettings').addEventListener('mousedown', function (e) {
        e.preventDefault();
        var open = /Open/.test(e.target.innerHTML);
        Array.prototype.slice.call(configHeadings).forEach(function (panelHeading) {
            if (!open && /API\sStatus/.test(panelHeading.innerHTML)) return;
            if (!open && /▼\sTroubleshooting/.test(panelHeading.innerHTML)) {
                panelHeading.click();
                return;
            }
            var panelBody = panelHeading.nextElementSibling;
            panelHeading.innerHTML = open ? panelHeading.innerHTML.replace(/▶/, '▼') : panelHeading.innerHTML.replace(/▼/, '▶');
            panelBody.style.display = open ? 'block' : 'none';
            var panelParent = panelHeading.parentElement;
            if (panelParent) panelParent.style.marginBottom = open ? null: 0;
        });
        if (open) e.target.innerHTML = e.target.innerHTML.replace(/▶\sOpen/, '▼ Close');
        else e.target.innerHTML = e.target.innerHTML.replace(/▼\sClose/, '▶ Open');
    });
}

/**
 * A function to test whether the app is in full-screen mode
 * @returns {Boolean} True if the app is in full-screen mode, false otherwise
 */
function appIsFullScreen () {
    return !!(document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement || document.msFullscreenElement);
}

/**
 * Puts the requested element into full-screen mode, or cancels full-screen mode if no element is provided
 * @param {Element} el The element to put into full-screen mode. If not provided, the function will cancel any full-screen mode
 * @returns {Promise<Boolean>} A Promise that resolves to true if the element entered full-screen mode, false if full-screen mode cancelled
 */
function requestOrCancelFullScreen (el) {
    // Don't do anything if already in full-screen mode, and user has not requested to exit full-screen mode
    if (el && appIsFullScreen()) {
        console.debug('Display is already full screen');
        return Promise.resolve(true);
    }
    // Choose the correct method to request or cancel full-screen mode
    var rq = function (sel) {
        var fn = sel
            // Request full-screen mode
            ? sel.requestFullscreen ? sel.requestFullscreen()
            : sel.webkitRequestFullscreen ? sel.webkitRequestFullscreen()
            : sel.mozRequestFullScreen ? sel.mozRequestFullScreen()
            : sel.msRequestFullscreen ? sel.msRequestFullscreen() : Promise.reject('No full-screen mode API available')
            // Cancel full-screen mode
            : document.exitFullscreen ? document.exitFullscreen()
            : document.webkitExitFullscreen ? document.webkitExitFullscreen()
            : document.mozCancelFullScreen ? document.mozCancelFullScreen()
            : document.msExitFullscreen ? document.msExitFullscreen() : Promise.reject('No full-screen mode API available');
        return Promise.resolve(fn);
    };
    return rq(el).then(function () {
        console.log(el ? 'Full-screen mode enabled' : 'Full-screen mode disabled');
        return el ? true : false;
    }).catch(function (err) {
        console.log('Error enabling full-screen mode', err);
        throw err;
    });
}

/**
 * Attempts to put the app into full-screen mode and (if requested) lock the display orientation using the Screen Orientation Lock API
 * @param {string} val A valid value in the API, e.g. '', 'natural', 'portrait', 'landscape'
 * @returns {Promise<String>} A Promise that resolves to a string informing the result (which may be '')
 */
function lockDisplayOrientation (val) {
    if (val) {
        // Request setting the app to full-screen mode
        return requestOrCancelFullScreen(document.documentElement).then(function () {
            // If the app is now in full-screen mode, lock the display orientation);
            if (val !== 'fullscreen') {
                if (screen && screen.orientation && screen.orientation.lock) {
                    if (val) {
                        return screen.orientation.lock(val).then(function () {
                            console.log('Display orientation locked to ' + val);
                        }).catch(function (error) {
                            console.warn('Error locking display orientation (but in some contexts, it may have worked anyway)', error);
                            throw error;
                        });
                    } else {
                        screen.orientation.unlock(); // NB This doesn't return a Promise
                        // return Promise.resolve();
                    }
                } else {
                    console.warn('The screen.orientation.lock API is not supported on this device!');
                    var rtn = val ? 'unsupported' : '';
                    return rtn;
                    // return Promise.resolve(rtn);
                }
            } else {
                if (!document.documentElement.requestFullscreen && (document.documentElement.webkitRequestFullscreen || document.documentElement.msRequestFullscreen)) {
                    // We are in a Safari browser or IE11, and a click is required to enter full-screen mode
                    return 'click';
                }
            }
        }).catch(function (error) {
            throw error;
        });
    } else {
        // User wants to cancel full-screen mode and unlock the display orientation
        if (screen && screen.orientation && screen.orientation.unlock) {
            screen.orientation.unlock(); // NB This doesn't return a Promise
        }
        return requestOrCancelFullScreen();
    }
}


/**
 * Finds the closest <a> or <area> enclosing tag of an element.
 * Returns undefined if there isn't any.
 *
 * @param {Element} element The element to test
 * @returns {Element} closest enclosing anchor tag (if any)
 */
function closestAnchorEnclosingElement (element) {
    if (Element.prototype.closest) {
        // Recent browsers support that natively. See https://developer.mozilla.org/en-US/docs/Web/API/Element/closest
        return element.closest('a,area');
    } else {
        // For other browsers, notably IE, we do that by hand (we did not manage to make polyfills work on IE11)
        var currentElement = element;
        while (currentElement.tagName !== 'A' && currentElement.tagName !== 'AREA') {
            // If there is no parent Element, we did not find any enclosing A tag
            if (!currentElement.parentElement) {
                return;
            } else {
                // Else we try the next parent Element
                currentElement = currentElement.parentElement;
            }
        }
        // If we reach this line, it means the currentElement is the enclosing Anchor we're looking for
        return currentElement;
    }
}

/**
 * Functions and classes exposed by this module
 */
export default {
    systemAlert: systemAlert,
    showUpgradeReady: showUpgradeReady,
    feedNodeWithBlob: feedNodeWithBlob,
    deriveZimUrlFromRelativeUrl: deriveZimUrlFromRelativeUrl,
    getClosestMatchForTagname: getClosestMatchForTagname,
    removeUrlParameters: removeUrlParameters,
    ToC: TableOfContents,
    isElementInView: isElementInView,
    makeReturnLink: makeReturnLink,
    pollSpinner: pollSpinner,
    clearSpinner: clearSpinner,
    XHR: XHR,
    printCustomElements: printCustomElements,
    downloadBlobUWP: downloadBlobUWP,
    displayActiveContentWarning: displayActiveContentWarning,
    displayFileDownloadAlert: displayFileDownloadAlert,
    insertBreakoutLink: insertBreakoutLink,
    extractHTML: extractHTML,
    checkServerIsAccessible: checkServerIsAccessible,
    initTouchZoom: initTouchZoom,
    appIsFullScreen: appIsFullScreen,
    lockDisplayOrientation: lockDisplayOrientation,
    reportAssemblerErrorToAPIStatusPanel: reportAssemblerErrorToAPIStatusPanel,
    reportSearchProviderToAPIStatusPanel: reportSearchProviderToAPIStatusPanel,
    warnAndOpenExternalLinkInNewTab: warnAndOpenExternalLinkInNewTab,
    setupConfigurationToggles: setupConfigurationToggles,
    closestAnchorEnclosingElement: closestAnchorEnclosingElement
};
