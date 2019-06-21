/**
 * images.js : Functions for the processing of images
 * 
 * Copyright 2013-2019 Mossroy and contributors
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

define(['uiUtil'], function (uiUtil) {

    /**
     * The iframe
     */
    var iframe = document.getElementById('articleContent');

    /**
     * An array to hold all the images in the current document
     */
    var documentImages = [];

    /**
     * A variable to keep track of how many images are being extracted by the extractor
     */
    var extractorBusy = 0;

    /**
     * A variable to signal that the current image processing queue should be abandoned (e.g. because user scrolled)
     */
    var abandon = false;

    /**
     * Iterates over an array or collection of image nodes, extracting the image data from the ZIM
     * and inserting a BLOB URL to each image in the image's src attribute
     * 
     * @param {Object} images An array or collection of DOM image nodes
     * @param {Function} callback An optional function to call when all requested images have been loaded
     */
    function extractImages(images, callback) {
        var remaining = images.length;
        if (!remaining && callback) callback();
        Array.prototype.slice.call(images).forEach(function (image) {
            var imageUrl = image.getAttribute('data-kiwixurl');
            extractorBusy++;
            if (!imageUrl) { checkbatch(); return; }
            image.removeAttribute('data-kiwixurl');
            var title = decodeURIComponent(imageUrl);
            if (params.contentInjectionMode === 'serviceworker') {
                image.addEventListener('load', function () {
                    image.style.opacity = '1';
                });
                image.src = imageUrl + '?kiwix-display';
                // Timeout allows the loop to complete so we get an accurate busy count
                setTimeout(function () {
                    checkBatch();
                });
                return;
            }
            state.selectedArchive.getDirEntryByTitle(title).then(function (dirEntry) {
                return state.selectedArchive.readBinaryFile(dirEntry, function (fileDirEntry, content) {
                    image.style.background = '';
                    var mimetype = dirEntry.getMimetype();
                    uiUtil.feedNodeWithBlob(image, 'src', content, mimetype, params.allowHTMLExtraction, function () {
                        checkBatch();
                    });
                    image.style.opacity = '1';
                });
            }).fail(function (e) {
                console.error('Could not find DirEntry for image: ' + title, e);
                checkBatch();
            });
        });
        var checkBatch = function () {
            extractorBusy--;
            remaining--;
            if (!remaining) queueImages();
            if (!remaining && callback) callback();
        };
    }

    /**
     * Iterates over an array or collection of image nodes, preparing each node for manual image
     * extraction when user taps the indicated area
     * 
     */
    function prepareManualExtraction() {
        for (var i = 0, l = documentImages.length; i < l; i++) {
            var originalHeight = documentImages[i].getAttribute('height') || '';
            //Ensure 36px clickable image height so user can request images by tapping
            documentImages[i].height = '36';
            if (params.contentInjectionMode === 'jquery') {
                documentImages[i].src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'/%3E";
                documentImages[i].style.background = 'lightblue';
            }
            documentImages[i].dataset.kiwixheight = originalHeight;
            documentImages[i].addEventListener('click', function (e) {
                // If the image clicked on hasn't been extracted yet, cancel event bubbling, so that we don't navigate
                // away from the article if the image is hyperlinked
                // Line below ensures documentImages remains in scope
                var thisImage = e.currentTarget;
                if (thisImage.dataset.kiwixurl) {
                    e.preventDefault();
                    e.stopPropagation();
                }
                var visibleImages = queueImages('poll', 0, function() { extractImages(visibleImages); }).visible;
                visibleImages.forEach(function (image) { 
                    image.style.opacity = '0';
                    image.style.transition = 'opacity 0.5s ease-in';
                    if (image.dataset.kiwixheight) image.height = image.dataset.kiwixheight;
                    else image.removeAttribute('height');
                });
                // var leftover = queueImages('extract').remaining;
                // leftover.forEach(function (image) {
                //     image.height = '36';
                //     image.style.opacity = '1';
                // });
            });
        }
    }

    // Image store is a buffer for images that are waiting for the extractor to finish
    var imageStore = [];
    var maxImageBatch = 20;

    /**
     * Sorts an array or collection of image nodes, returning a list of those that are inside the visible viewport 
     * 
     * @param {String} action If null, imageStore only will be processed; if 'extract', documentImages in viewport will be 
*                  extracted; if 'poll', will just return the visible and remaining image arrays
     * @param {Number} margin An extra margin to add to the top (-) or bottom (+) of windows.innerHeight
     * @param {Function} callback Function to call when last image has been extracted (only called if <extract> is true)
     * @returns {Object} An object with two arrays of images, visible and remaining
     */
    function queueImages(action, margin, callback) {
        if (abandon) {
            for (var q = imageStore.length; q--;) {
                imageStore[q].queued = false;
            }
            console.log('User scrolled: abandoning image queue...')
            imageStore = [];
        }
        if (imageStore.length && !extractorBusy) {
            extractImages(imageStore.splice(0, imageStore.length < maxImageBatch ? imageStore.length : maxImageBatch));
        }
        if (!action || !documentImages.length) { if (callback) setTimeout(callback); return; }
        margin = margin || 0;
        var visible = [];
        var remaining = [];
        var batchCount = 0;
        console.log('Images requested...');
        for (var i = 0, l = documentImages.length; i < l; i++) {
            if (documentImages[i].queued || !documentImages[i].dataset.kiwixurl) continue;
            if (uiUtil.isElementInView(documentImages[i], null, margin)) {
                visible.push(documentImages[i]);
                if (action !== 'extract') continue;
                documentImages[i].queued = true;
                if (extractorBusy < maxImageBatch) {
                    batchCount++;
                    console.log('Extracting image #' + i);
                    extractImages([documentImages[i]], function () {
                        batchCount--;
                        if (callback && !batchCount) callback();
                    });
                } else {
                    console.log('Queueing image #' + i);
                    imageStore.push(documentImages[i]);
                }
            } else {
                remaining.push(documentImages[i]);
            } 
        }
        // Callback has to be run inside a timeout because receiving function will expect the visible and remaining arrays to
        // have been returned before running callback code; NB if images have been scheduled for extraction, callback will be
        // called above instead of here, but we still need this in case there are no immediately visible images
        if (callback && !batchCount) setTimeout(callback);
        return { 'visible': visible, 'remaining': remaining };
    }

    /**
     * Prepares an array or collection of image nodes that have been disabled in Service Worker for manual extraction
     */
    function prepareImagesServiceWorker () {
        var doc = iframe.contentDocument.documentElement;
        documentImages = doc.getElementsByTagName('img');
        if (!documentImages.length) return;
        for (var i = 0, l = documentImages.length; i < l; i++) {
            // DEV: make sure list of file types here is the same as the list in Service Worker code
            if (/(^|\/)[IJ]\/.*\.(jpe?g|png|svg|gif)($|[?#])/i.test(documentImages[i].src)) {
                documentImages[i].dataset.kiwixurl = documentImages[i].getAttribute('src');
                documentImages[i].style.transition = 'opacity 0.5s ease-in';
                if (params.imageDisplayMode === 'progressive') {
                    documentImages[i].style.opacity = '0';
                }
            }
        }
        if (params.imageDisplayMode === 'manual') {
            prepareManualExtraction();
        } else {
            lazyLoad();
        }
    }

    function prepareImagesJQuery (forPrinting) {
        loadMathJax();
        var doc = iframe.contentDocument.documentElement;
        documentImages = doc.querySelectorAll('img[data-kiwixurl]');
        if (!forPrinting && !documentImages.length) return;
        if (forPrinting) {
            extractImages(documentImages, params.preloadingAllImages ? params.preloadAllImages : params.printImagesLoaded);
            return;
        } else if (params.imageDisplayMode === 'progressive') {
            // Firefox squashes empty images, but we don't want to alter the vertical heights constantly as we scroll
            // so substitute empty images with a plain svg
            for (var i = documentImages.length; i--;) {
                documentImages[i].src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'/%3E";
                documentImages[i].style.opacity = '0';
                documentImages[i].style.transition = 'opacity 0.5s ease-in';
            }
            lazyLoad();
        } else {
            // User wishes to extract images manually
            prepareManualExtraction();
        }
        loadMathJax();
        //setTimeout(loadMathJax, 3000);

    }

    /**
     * Processes an array or collection of image nodes so that they will be lazy loaded (progressive extraction)
     * 
     * @param {Object} documentImages And array or collection of DOM image nodes which will be processed for 
     *        progressive image extraction 
     */
    function lazyLoad() {
        // The amount by which to offset the second reading of the viewport
        var offset = window.innerHeight * 4;
        // Perform an immediate extraction of visible images so as not to disconcert the user
        // We request images twice because frequently the position of all of them is not known at this stage in rendering
        queueImages('extract', 0, function () {
            queueImages('extract', offset);
        });
        if (!documentImages.length) return;
        // There are images remaining, so set up an event listener to load more images once user has stopped scrolling the iframe
        var iframeWindow = iframe.contentWindow;
        var scrollPos;
        // var rateLimiter = 0;
        var rate = 80; // DEV: Set the milliseconds to wait before allowing another iteration of the image stack
        var timeout;
        // NB we add the event listener this way so we can access it in app.js
        iframeWindow.onscroll = function () {
            abandon = true;
            clearTimeout(timeout);
            var velo = iframeWindow.pageYOffset - scrollPos;
            timeout = setTimeout(function() {
                // We have stopped scrolling
                console.log("Stopped scrolling; velo=" + velo);
                queueImages();
                abandon = false;
                queueImages('extract', 0, function() {
                    queueImages('extract', velo >= 0 ? offset : -offset);
                });
            }, rate);
            scrollPos = iframeWindow.pageYOffset;
        };
    }

    function loadMathJax() {
        if (params.useMathJax && (params.containsMathTexRaw || params.containsMathTex || params.containsMathSVG)) {
            var doc = iframe.contentDocument;
            var link = doc.createElement("link");
            link.rel = "stylesheet";
            link.href = "js/katex/katex.min.css";
            doc.head.appendChild(link);
            var script1 = doc.createElement("script");
            script1.type = "text/javascript";
            //script.src = "js/MathJax/MathJax.js?config=TeX-AMS_HTML-full";
            script1.src = "js/katex/katex.min.js";
            // var script2 = doc.createElement("script");
            // script2.type = "text/javascript";
            // script2.src = "js/katex/contrib/mathtex-script-type.min.js";
            var script3 = doc.createElement("script");
            script3.type = "text/javascript";
            script3.src = "js/katex/contrib/auto-render.min.js";
            script3.onload = function() {
                iframe.contentWindow.renderMathInElement(doc.body, { 
                    delimiters: [{
                        left: "$$",
                        right: "$$",
                        display: true
                    },
                    {
                        left: "$",
                        right: "$",
                        display: false
                    }]
                });
            };
            // script2.innerHTML = 'renderMathInElement\(document.body, { delimiters: \[' +
            //     '{left: "$$", right: "$$", display: true},' +
            //     '{left: "\\(", right: "\\)", display: false},' +
            //     '{left: "$", right: "$", display: false},' +
            //     '{left: "\\[", right: "\\]", display: true}' +
            // '\]}\);"';
            script1.onload = function () {
                doc.body.appendChild(script3);
            };
            doc.body.appendChild(script1);
            // if (params.containsMathTex || params.containsMathTexRaw) script.innerHTML = 'MathJax.Hub.Queue(["Typeset", MathJax.Hub]); \
            //     console.log("Typesetting maths with MathJax");';
            params.containsMathTexRaw = false; //Prevents doing a second Typeset run on the same document
            params.containsMathTex = false;
        }
    }

    /**
     * Functions and classes exposed by this module
     */
    return {
        extractImages: extractImages,
        setupManualImageExtraction: prepareManualExtraction,
        prepareImagesServiceWorker: prepareImagesServiceWorker,
        prepareImagesJQuery: prepareImagesJQuery,
        lazyLoad: lazyLoad,
        loadMathJax: loadMathJax
    };
});
