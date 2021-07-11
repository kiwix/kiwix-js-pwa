/**
 * uiUtil.js : Utility functions for the User Interface
 * 
 * Copyright 2013-2020 Mossroy and contributors
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

// DEV: Put your RequireJS definition in the rqDef array below, and any function exports in the function parenthesis of the define statement
// We need to do it this way in order to load WebP polyfills conditionally. The WebP polyfills are only needed by a few old browsers, so loading them
// only if needed saves approximately 1MB of memory.
var rqDef = [];

// Add WebP polyfill only if webpHero was loaded in init.js
if (webpMachine) {
    rqDef.push('webpHeroBundle');
}

define(rqDef, function() {

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
    function feedNodeWithBlob(node, nodeAttribute, content, mimeType, makeDataURI, callback) {
        // Decode WebP data if the browser does not support WebP and the mimeType is webp 
        if (webpMachine && /image\/webp/i.test(mimeType)) {
            // DEV: Note that webpMachine is single threaded and will reject an image if it is busy
            // However, the loadImagesJQuery() function in app.js is sequential (it waits for a callback
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
        
    var regexpRemoveUrlParameters = new RegExp(/([^\?]+)\?.*$/);
    
    function removeUrlParameters(url) {
        if (regexpRemoveUrlParameters.test(url)) {
            return regexpRemoveUrlParameters.exec(url)[1];
        } else {
            return url;
        }
    }

    // Transforms an asset (script or link) element string into a usable element containing the given content or a BLOB
    // reference to the content
    function createNewAssetElement(assetElement, attribute, content) {
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
            mimetype = mimetype ? mimetype : 'text/css';
            newAsset = '<style data-kiwixsrc="' + attrUri + '" type="' + mimetype + '">' + content + '</style>';
        } else {
            mimetype = mimetype ? mimetype : tag === 'script' ? 'text/javascript' : '';
            var assetBlob = new Blob([content], { type: mimetype });
            var assetUri = URL.createObjectURL(assetBlob);
            var refAttribute = tag === 'script' ? 'src' : 'href';
            newAsset = assetElement.replace(attribute, refAttribute);
            newAsset = newAsset.replace(attrUri, assetUri);
            newAsset = newAsset.replace(/>/, ' data-kiwixsrc="' + attrUri + '">');
        }
        return newAsset;
    }

    function TableOfContents(articleDoc) {
        this.doc = articleDoc;
        this.headings = this.doc.querySelectorAll("h1, h2, h3, h4, h5, h6");

        this.getHeadingObjects = function () {
            var headings = [];
            for (var i = 0; i < this.headings.length; i++) {
                var element = this.headings[i];
                var obj = {};
                obj.id = element.id;
                var objectId = element.innerHTML.match(/\bid\s*=\s*["']\s*([^"']+?)\s*["']/i);
                obj.id = obj.id ? obj.id : objectId && objectId.length > 1 ? objectId[1] : "";
                obj.index = i;
                obj.textContent = element.textContent;
                obj.tagName = element.tagName;
                headings.push(obj);
            }
            return headings;
        };
    }

    function makeReturnLink(title) {
        //Abbreviate title if necessary
        var shortTitle = title.substring(0, 25);
        shortTitle = shortTitle == title ? shortTitle : shortTitle + "..."; 
        var link = '<h4 style="font-size:' + ~~(params.relativeUIFontSize * 1.4 * 0.14) + 'px;"><a href="#">&lt;&lt; Return to ' + shortTitle + '</a></h4>';
        var rtnFunction = "(function () { setTab(); \
            if (params.themeChanged) { \
                params.themeChanged = false; \
                if (history.state !== null) {  \
                    var thisURL = decodeURIComponent(history.state.title); \
                    goToArticle(thisURL); \
                } \
            } \
        })";
        var returnDivs = document.getElementsByClassName("returntoArticle");
        for (var i = 0; i < returnDivs.length; i++) {
            returnDivs[i].innerHTML = link;
        }
        return rtnFunction;
    }

    function poll(msg) {
        document.getElementById('searchingArticles').style.display = 'block';
        document.getElementById('cachingAssets').innerHTML = msg;
        document.getElementById('cachingAssets').style.display = 'block';
    }

    function clear() {
        document.getElementById('cachingAssets').innerHTML = '';
        document.getElementById('cachingAssets').style.display = 'none';
    }

    function printCustomElements() {
        //var innerDocument = window.frames[0].frameElement.contentDocument;
        var innerDocument = document.getElementById('articleContent').contentDocument;
        //Add any missing classes
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

        // Using @media print on images doesn't get rid of them all, so use brute force
        if (!document.getElementById("printImageCheck").checked)
            innerDocument.body.innerHTML = innerDocument.body.innerHTML.replace(/<img\b[^>]*>\s*/ig, '');
        var printOptions = innerDocument.getElementById("printOptions");
        //If there is no printOptions style block in the iframe, create it
        if (!printOptions) {
            var printStyle = innerDocument.createElement("style");
            printStyle.id = "printOptions";
            innerDocument.head.appendChild(printStyle);
            printOptions = innerDocument.getElementById("printOptions");
        }
        var printStyleInnerHTML = "@media print { ";
        printStyleInnerHTML += document.getElementById("printNavBoxCheck").checked ? "" : ".navbox, .vertical-navbox { display: none; } ";
        printStyleInnerHTML += document.getElementById("printEndNoteCheck").checked ? "" : ".reflist, div[class*=references], .zimReferences, .zimSources { display: none; } ";
        printStyleInnerHTML += document.getElementById("externalLinkCheck").checked ? "" : ".externalLinks, .furtherReading { display: none; } ";
        printStyleInnerHTML += document.getElementById("seeAlsoLinkCheck").checked ? "" : ".seeAlso { display: none; } ";
        printStyleInnerHTML += document.getElementById("printInfoboxCheck").checked ? "" : ".mw-stack, .infobox, .infobox_v2, .infobox_v3, .qbRight, .qbRightDiv, .wv-quickbar, .wikitable { display: none; } ";
        // printStyleInnerHTML += document.getElementById("printImageCheck").checked ? "" : "img, .gallery { display: none; } ";
        printStyleInnerHTML += ".copyLeft { display: none } ";
        printStyleInnerHTML += ".map-pin { display: none } ";
        printStyleInnerHTML += ".external { padding-right: 0 !important } ";
        var sliderVal = document.getElementById("documentZoomSlider").value;
        sliderVal = ~~sliderVal;
        sliderVal = Math.floor(sliderVal * (Math.max(window.screen.width, window.screen.height) / 1440));
        printStyleInnerHTML += "body { font-size: " + sliderVal + "% !important; } ";
        printStyleInnerHTML += "}";
        printOptions.innerHTML = printStyleInnerHTML;

    }

    function downloadBlobUWP(blob, filename, message) {
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
                            if (message) message.innerHTML = '<strong>Download:</strong> Your file was saved as <a href="' +
                                fileLink + '" target="_blank" class="alert-link">' + file.path + '</a>';
                            //window.open(fileLink, null, "msHideView=no");
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
     * @returns {String} The derived ZIM URL in decoded form (e.g. "A/Einstein", "I/imÃ¡gen.png", "C/")
     */
    function deriveZimUrlFromRelativeUrl(url, base) {
        // We use a dummy domain because URL API requires a valid URI
        var dummy = 'http://d/';
        var deriveZimUrl = function (url, base) {
            if (typeof URL === 'function') return new URL(url, base);
            // IE11 lacks URL API: workaround adapted from https://stackoverflow.com/a/28183162/9727685
            var d = document.implementation.createHTMLDocument('t');
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
    function getClosestMatchForTagname(el, rgx) {
        do {
            if (rgx.test(el.tagName)) return el;
            el = el.parentElement || el.parentNode;
        } while (el !== null && el.nodeType === 1);
        return null;
    }

    /**
     * Displays a Bootstrap warning alert with information about how to access content in a ZIM with unsupported active UI
     */
    function displayActiveContentWarning() {
        // We have to add the alert box in code, because Bootstrap removes it completely from the DOM when the user dismisses it
        var alertHTML =
            '<div id="activeContent" class="alert alert-warning alert-dismissible fade in" style="margin-bottom: 0;">' +
                '<a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a>' +
                '<strong>Unable to display active content:</strong> To use Archive Index <b><i>type a space</b></i> in the box above, or else ' +
                '<a id="swModeLink" href="#contentInjectionModeDiv" class="alert-link">switch to Service Worker mode</a> ' +
                'if your platform supports it. &nbsp;[<a id="stop" href="#displaySettingsDiv" class="alert-link">Permanently hide</a>]' +
            '</div>';
        var alertBoxHeader = document.getElementById('alertBoxHeader');
        alertBoxHeader.innerHTML = alertHTML;
        alertBoxHeader.style.display = 'block';
        ['swModeLink', 'stop'].forEach(function(id) {
            // Define event listeners for both hyperlinks in alert box: these take the user to the Config tab and highlight
            // the options that the user needs to select
            document.getElementById(id).addEventListener('click', function () {
                var elementID = id === 'stop' ? 'hideActiveContentWarningCheck' : 'serviceworkerModeRadio';
                var thisLabel = document.getElementById(elementID).parentNode;
                thisLabel.style.borderColor = 'red';
                thisLabel.style.borderStyle = 'solid';
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
    function displayFileDownloadAlert(title, download, contentType, content, autoDismiss) {
        // We have to create the alert box in code, because Bootstrap removes it completely from the DOM when the user dismisses it
            document.getElementById('alertBoxFooter').innerHTML =
                '<div id="downloadAlert" class="alert alert-info alert-dismissible">' +
                '    <a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a>' +
                '    <span id="alertMessage"></span>' +
                '</div>';
        // Download code adapted from https://stackoverflow.com/a/19230668/9727685 
        if (!contentType) {
            // DEV: Add more contentTypes here for downloadable files
            if (/\.epub$/.test(title)) contentType = 'application/epub+zip';
            if (/\.pdf$/.test(title)) contentType = 'application/pdf';
            if (/\.zip$/.test(title)) contentType = 'application/zip';
        }
        // Set default contentType if there has been no match
        if (!contentType) contentType = 'application/octet-stream';
        var a = document.createElement('a');
        var blob = new Blob([content], { 'type': contentType });
        // If the filename to use for saving has not been specified, construct it from title
        var filename = download === true ? title.replace(/^.*\/([^\/]+)$/, '$1') : download;
        // Make filename safe
        filename = filename.replace(/[\/\\:*?"<>|]/g, '_');
        a.href = window.URL.createObjectURL(blob);
        a.target = '_blank';
        a.type = contentType;
        // if (typeof window.fs === 'undefined') a.download = filename;
        a.classList.add('alert-link');
        a.innerHTML = filename;
        var alertMessage = document.getElementById('alertMessage');
        alertMessage.innerHTML = '<strong>Download</strong> If the download does not start, please tap the following link: ';
        // We have to add the anchor to a UI element for Firefox to be able to click it programmatically: see https://stackoverflow.com/a/27280611/9727685
        alertMessage.appendChild(a);
        try {
            a.click();
            // Following line should run only if there was no error, leaving the alert showing in case of error
            if (autoDismiss) $('#downloadAlert').alert('close');
            return;
        }
        catch (err) {
            // Edge will error out unless there is a download added but Chrome works better without the attribute
            a.download = filename;
        }
        try {
            a.click();
            // Following line should run only if there was no error, leaving the alert showing in case of error
            if (autoDismiss) $('#downloadAlert').alert('close');
        }
        catch (err) {
            // If the click fails, user may be able to download by manually clicking the link
            // But for IE11 we need to force use of the saveBlob method with the onclick event 
            if (window.navigator && window.navigator.msSaveBlob) {
                a.addEventListener('click', function (e) {
                    window.navigator.msSaveBlob(blob, filename);
                    e.preventDefault();
                });
            } else {
                // And try to launch through UWP download
                if (Windows && Windows.Storage) {
                    downloadBlobUWP(blob, filename, alertMessage);
                    if (autoDismiss) $('#downloadAlert').alert('close');
                } else {
                    // Last gasp attempt to open automatically
                    window.open(a.href);
                }
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
    function XHR(url, responseType, callback) {
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
        }
        catch (e) {
            console.log("Exception during GET request: " + e);
            err = true;
        }
        if (!err) {
            xhr.send();
        } else {
            callback("Error", null, 500);
        }
    }

    /**
     * Inserts a link to break the article out to a new browser tab
     * 
     * @param {String} mode The app mode to use for the breakoutLink icon (light|dark)
     */
    function insertBreakoutLink(mode) {
        var desc = "Open article in new tab or window";
        var iframe = document.getElementById('articleContent').contentDocument;
        // This code provides an absolute link, removing the file and any query string from href (we need this because of SW mode)
        var prefix = (window.location.protocol + '//' + window.location.host + window.location.pathname).replace(/\/[^/]*$/, '');
        var div = document.createElement('div');
        div.style.cssText = 'top: 10px; right: 25px; position: relative; z-index: 2; float: right;';
        div.id = "openInTab";
        div.innerHTML = '<a href="#"><img id="breakoutLink" src="' + prefix + '/img/icons/' + (mode == 'light' ? 'new_window.svg' : 'new_window_lb.svg') + '" width="30" height="30" alt="' + desc + '" title="' + desc + '"></a>';
        iframe.body.insertBefore(div, iframe.body.firstChild);
        var openInTab = iframe.getElementById('openInTab');
        // Have to use jQuery here becasue e.preventDefault is not working properly in some browsers
        $(openInTab).on('click', function() {
            itemsCount = false;
            params.preloadingAllImages = false;
            extractHTML();
            return false;
        });
    }
    
    /**
     * Extracts self-contained HTML from the iframe DOM, transforming BLOB references to dataURIs
     */
    function extractHTML() {
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
                    myReader.addEventListener("loadend", function () {
                        if (myReader.result) {
                            var dataURL = myReader.result.replace(/data:;/, 'data:' + mimetype + ';');
                            if (item.href) {
                                try { item.href = dataURL; }
                                catch (err) { null; }
                            }
                            if (item.src) {
                                try { item.src = dataURL; }
                                catch (err) { null; }
                            }
                        }
                        itemsCount--;
                        if (itemsCount === 0) extractHTML();
                    });
                    //Start the reading process.
                    myReader.readAsDataURL(response);
                });
            });
        }
        if (itemsCount > 0) return; //Ensures function stops if we are still extracting images or css
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
    }

    /** 
     * Provides system-specific alert function
     * 
     * @param {String} message The message to display
     * @param {String} title The message title
     * @param {String} btn1 An optional button to display
     * @param {Function} btn1Func An optional function to run when btn1 is selected
     * @param {String} btn2 An optional secondary button to display
     * @param {Function} btn2Func An optional function to run when btn2 is selected
     */
    function systemAlert(message, title, btn1, btn1Func, btn2, btn2Func) {
        // Test for UWP
        if (typeof Windows !== 'undefined' && typeof Windows.UI !== 'undefined' && typeof Windows.UI.Popups !== 'undefined') {
            var dialog = new Windows.UI.Popups.MessageDialog(message);
            if (btn1 && btn1Func) dialog.commands.append(new Windows.UI.Popups.UICommand(btn1, btn1Func));
            if (btn2 && btn2Func) dialog.commands.append(new Windows.UI.Popups.UICommand(btn2, btn2Func));
            dialog.showAsync();
        } else {
            alert(message);
        }
    }

    /**
     * Checks if a server is accessible by attempting to load a test image from the server
     * 
     * @param {String} imageSrc The full URI of the image
     * @param {any} onSuccess A function to call if the image can be loaded
     * @param {any} onError A function to call if the image cannot be loaded
     */
    function checkServerIsAccessible(imageSrc, onSuccess, onError) {
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
    function isElementInView(area, el, fully, offset) {
        offset = offset || 0;
        var rect = el.getBoundingClientRect();
        el.top = rect.top;
        //console.log(el.dataset.kiwixurl + ': ' + rect.top);
        if (fully)
            return rect.top > 0 + (offset < 0 ? offset : 0) && rect.bottom < area.innerHeight + (offset > 0 ? offset : 0) && rect.left > 0 && rect.right < area.innerWidth;
        else 
            return rect.top < area.innerHeight + (offset > 0 ? offset : 0) && rect.bottom > 0 + (offset < 0 ? offset : 0) && rect.left < area.innerWidth && rect.right > 0;
    }

    /**
     * Encodes the html escape characters in the string before using it as html class name,id etc.
     * 
     * @param {String} string The string in which html characters are to be escaped
     * 
     */
    function htmlEscapeChars(string) {
        var escapechars = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;',
            '/': '&#x2F;',
            '`': '&#x60;',
            '=': '&#x3D;'
        };
        string = String(string).replace(/[&<>"'`=/]/g, function (s) {
            return escapechars[s];
        });
        return string;
    }

    /**
     * Initiates pointer touch events on the given element in order to set the zoom level
     * 
     * @param {Element} element The element to which the pointer events should be attached 
     * @param {Node} container The node to which the pointer events should be applied, if different
     */
    function initTouchZoom(element, container) {
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
        element.onpointermove = function(event) {
            pointermove_handler(event, container, contentWin);
        };
        // Use same handler for pointer{up,cancel,out,leave} events since
        // the semantics for these events - in this app - are the same.
        element.onpointerup = pointerup_handler;
        element.onpointercancel = pointerup_handler;
        element.onpointerout = pointerup_handler;
        element.onpointerleave = pointerup_handler;
    }

    function pointerdown_handler(ev) {
        // The pointerdown event signals the start of a touch interaction.
        // This event is cached to support 2-finger gestures
        appstate.evCache.push(ev);
        // console.debug('pointerDown', ev);
    }

    function pointermove_handler(ev, cont, win) {
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

    function pointerup_handler(ev) {
        // console.debug(ev.type, ev);
        // Remove this pointer from the cache
        remove_event(ev);

        // If the number of pointers down is less than two then reset diff tracker
        if (appstate.evCache.length < 2) {
            appstate.prevDiff = -1;
        }
    }

    function remove_event(ev) {
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

    // If global variable webpMachine was defined, then we need to initialize the WebP Polyfill
    if (webpMachine) webpMachine = new webpHero.WebpMachine();

    /**
     * Functions and classes exposed by this module
     */
    return {
        feedNodeWithBlob: feedNodeWithBlob,
        deriveZimUrlFromRelativeUrl: deriveZimUrlFromRelativeUrl,
        getClosestMatchForTagname: getClosestMatchForTagname,
        removeUrlParameters: removeUrlParameters,
        toc: TableOfContents,
        isElementInView: isElementInView,
        makeReturnLink: makeReturnLink,
        poll: poll,
        clear: clear,
        XHR: XHR,
        printCustomElements: printCustomElements,
        downloadBlobUWP: downloadBlobUWP,
        displayActiveContentWarning: displayActiveContentWarning,
        displayFileDownloadAlert: displayFileDownloadAlert,
        insertBreakoutLink: insertBreakoutLink,
        extractHTML: extractHTML,
        systemAlert: systemAlert,
        checkServerIsAccessible: checkServerIsAccessible,
        htmlEscapeChars: htmlEscapeChars,
        initTouchZoom: initTouchZoom
    };
});
