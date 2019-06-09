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
define(['uiUtil', 'cookies'], function(uiUtil, cookies) {

    /**
     * Declare a module-specific variable defining the contentInjectionMode. Its value may be 
     * changed in setContentInjectionMode() 
     */
    var contentInjectionMode = cookies.getItem('lastContentInjectionMode');

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
            if (!imageUrl) return;
            image.removeAttribute('data-kiwixurl');
            var title = decodeURIComponent(imageUrl);
            if (contentInjectionMode === 'serviceworker') {
                image.src = imageUrl + '?kiwix-display';
            } else {
                state.selectedArchive.getDirEntryByTitle(title).then(function (dirEntry) {
                    return state.selectedArchive.readBinaryFile(dirEntry, function (fileDirEntry, content) {
                        image.style.background = '';
                        var mimetype = dirEntry.getMimetype();
                        uiUtil.feedNodeWithBlob(image, 'src', content, mimetype, params.allowHTMLExtraction, function () {
                            checkBatch();
                        });
                    });
                }).fail(function (e) {
                    console.error('Could not find DirEntry for image: ' + title, e);
                    checkBatch();
                });
            }
        });
        var checkBatch = function () {
            remaining--;
            if (!remaining && callback) callback();
        };
    }

    /**
     * Iterates over an array or collection of image nodes, preparing each node for manual image
     * extraction when user taps the indicated area
     * 
     * @param {Object} images An array or collection of DOM image nodes
     */
    function setupManualImageExtraction(images) {
        Array.prototype.slice.call(images).forEach(function (image) {
            var originalHeight = image.getAttribute('height') || '';
            //Ensure 36px clickable image height so user can request images by tapping
            image.height = '36';
            if (contentInjectionMode ==='jquery') {
                image.src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'/%3E";
                image.style.background = 'lightblue';
            }
            image.dataset.kiwixheight = originalHeight;
            image.addEventListener('click', function (e) {
                // If the image clicked on hasn't been extracted yet, cancel event bubbling, so that we don't navigate
                // away from the article if the image is hyperlinked
                if (image.dataset.kiwixurl) {
                    e.preventDefault();
                    e.stopPropagation();
                }
                var visibleImages = queueImages(images);
                visibleImages.forEach(function (image) {
                    if (image.dataset.kiwixheight) image.height = image.dataset.kiwixheight;
                    else image.removeAttribute('height');
                    // Line below provides a visual indication to users of slow browsers that their click has been registered and
                    // images are being fetched; this is not necessary in SW mode because SW is only supported by faster browsers
                    if (contentInjectionMode ==='jquery') image.style.background = 'lightgray';
                });
                extractImages(visibleImages);
            });
        });
    }

    /**
     * Sorts an array or collection of image nodes, returning a list of those that are inside the visible viewport 
     * 
     * @param {Object} images An array or collection of DOM image nodes
     * @param {Boolean} visibleOnly If true, only processes visible images
     * @returns {Array} An array of image nodes that are within the visible viewport 
     */
    function queueImages(images, visibleOnly) {
        var numPrefetchImages = 10;
        var queue = {};
        queue.visibleImages = [];
        queue.prefetchImages = [];
        for (var i = 0, l = images.length; i < l; i++) {
            if (!images[i].dataset.kiwixurl || images[i].queued) continue;
            if (uiUtil.isElementInView(images[i])) {
                queue.visibleImages.push(images[i]);
                images[i].queued = true;
            } else {
                if (visibleOnly) continue;
                if (queue.prefetchImages.length < numPrefetchImages && images[i].top > window.innerHeight) {
                    queue.prefetchImages.push(images[i]);
                    images[i].queued = true;
                }
            }
        }
        return queue;
    }

    /**
     * Prepares an array or collection of image nodes that have been disabled in Service Worker for manual extraction
     * 
     * @param {Object} images An array or collection of DOM image nodes
     * @param {String} displayType If 'progressive', lazyLoad will be used; if 'manual', setupManualImageExtraction will be used
     */
    function prepareImagesServiceWorker (images, displayType) {
        var zimImages = [];
        for (var i = 0, l = images.length; i < l; i++) {
            // DEV: make sure list of file types here is the same as the list in Service Worker code
            if (/(^|\/)[IJ]\/.*\.(jpe?g|png|svg|gif)($|[?#])/i.test(images[i].src)) {
                images[i].dataset.kiwixurl = images[i].getAttribute('src');
                zimImages.push(images[i]);
            }
        }
        if (displayType === 'manual') {
            setupManualImageExtraction(zimImages);
        } else {
            lazyLoad(zimImages);
        }
    }

    /**
     * Processes an array or collection of image nodes so that they will be lazy loaded (progressive extraction)
     * 
     * @param {Object} images And array or collection of DOM image nodes which will be processed for 
     *        progressive image extraction 
     */
    function lazyLoad(images) {
        var queue;
        var getImages = function(visibleOnly) {
            queue = queueImages(images, visibleOnly);
            extractImages(queue.visibleImages, function () {
                extractImages(queue.prefetchImages);
            });
        };
        getImages();
        // Sometimes the page hasn't been rendered when getImages() is run, especially in Firefox, so run again after delay
        //setTimeout(function () {
        //    getImages(true);
        //}, 700);
        if (queue.visibleImages.length + queue.prefetchImages.length === images.length) return;
        // There are images remaining, so set up an event listener to load more images once user has stopped scrolling the iframe
        var iframe = document.getElementById('articleContent');
        var iframeWindow = iframe.contentWindow;
        var timer;
        var scrollPos;
        iframeWindow.addEventListener('scroll', function() {
            clearTimeout(timer);
            if (Math.abs(iframeWindow.pageYOffset - scrollPos) < 30) {
                // Scroll is very slow, so start getting images in viewport
                getImages(true);
            }
            // Timer will go off only when we have come to a standstill, and only then will prefetch images be processed
            timer = setTimeout(getImages, 250);
            scrollPos = iframeWindow.pageYOffset;
        });
    }

    function loadMathJax() {
        //Load MathJax if required and if not already loaded
        if (params.useMathJax) {
            if (!window.frames[0].MathJax && (params.containsMathTexRaw || params.containsMathTex || params.containsMathSVG)) {
                var doc = document.getElementById('articleContent').contentDocument;
                var script = doc.createElement("script");
                script.type = "text/javascript";
                script.src = "js/MathJax/MathJax.js?config=TeX-AMS_HTML-full";
                if (params.containsMathTex || params.containsMathTexRaw) script.innerHTML = 'MathJax.Hub.Queue(["Typeset", MathJax.Hub]); \
                    console.log("Typesetting maths with MathJax");';
                params.containsMathTexRaw = false; //Prevents doing a second Typeset run on the same document
                params.containsMathTex = false;
                doc.head.appendChild(script);
            } else if (window.frames[0].MathJax && (params.containsMathTexRaw || params.containsMathTex || params.containsMathSVG)) {
                window.frames[0].MathJax.Hub.Queue(["Typeset", window.frames[0].MathJax.Hub]);
                console.log("Typesetting maths with MathJax");
                params.containsMathTexRaw = false; //Prevents doing a second Typeset run on the same document
            }
        }
    }

    /**
     * A utility to set the contentInjectionmode in this module
     * It should be called when the user changes the contentInjectionMode
     * 
     * @param {String} injectionMode The contentInjectionMode selected by the user
     */
    function setContentInjectionMode(injectionMode) {
        contentInjectionMode = injectionMode;
    }

    /**
     * Functions and classes exposed by this module
     */
    return {
        extractImages: extractImages,
        setupManualImageExtraction: setupManualImageExtraction,
        prepareImagesServiceWorker: prepareImagesServiceWorker,
        lazyLoad: lazyLoad,
        loadMathJax: loadMathJax,
        setContentInjectionMode: setContentInjectionMode
    };
});
