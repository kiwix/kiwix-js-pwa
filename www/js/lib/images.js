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
     * A variable to keep track of how many images are being extracted by the extractor
     */
    var extractorBusy = 0;

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
     * @param {Object} images An array or collection of DOM image nodes
     */
    function prepareManualExtraction(images) {
        Array.prototype.slice.call(images).forEach(function (image) {
            var originalHeight = image.getAttribute('height') || '';
            //Ensure 36px clickable image height so user can request images by tapping
            image.height = '36';
            if (params.contentInjectionMode === 'jquery') {
                image.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'/%3E";
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
                var visibleImages = queueImages(images).visible;
                visibleImages.forEach(function (image) {
                    if (image.dataset.kiwixheight) image.height = image.dataset.kiwixheight;
                    else image.removeAttribute('height');
                    image.style.opacity = '0';
                    image.style.transition = 'opacity 0.5s ease-in';
                });
                var leftover = queueImages(visibleImages, true).remaining;
                leftover.forEach(function (image) {
                    //image.style.background = 'lightblue';
                    image.height = '36';
                    image.style.opacity = '1';
                });
            });
        });
    }

    // Image store is a buffer for images that are waiting for the extractor to finish
    var imageStore = [];
    var maxImageBatch = 20;

    /**
     * Sorts an array or collection of image nodes, returning a list of those that are inside the visible viewport 
     * 
     * @param {Object} images An array or collection of DOM image nodes
     * @param {Boolean} extract If true, extract images immediately, otherwise sort images into arrays
     * @param {Number} offset The offset, if any, from windows.innerHeight
     * @param {Function} callback Function to call when last image has been extracted (only called if <extract> is true)
     * @returns {Array} The array of remaining (unprocessed) image nodes
     */
    function queueImages(images, extract, offset, callback) {
        if (imageStore.length && !extractorBusy) {
            extractImages(imageStore.splice(0, imageStore.length < maxImageBatch ? imageStore.length : maxImageBatch));
        }
        if (!images) return;
        if (!images.length) { if (callback) callback(); return; }
        offset = offset || 0;
        var visible = [];
        var remaining = [];
        var batchCount = 0;
        for (var i = 0, l = images.length; i < l; i++) {
            if (images[i].queued || !images[i].dataset.kiwixurl) continue;
            if (uiUtil.isElementInView(images[i], null, offset)) {
                visible.push(images[i]);
                if (!extract) continue;
                images[i].queued = true;
                if (extractorBusy < maxImageBatch) {
                    batchCount++;
                    extractImages([images[i]], function () {
                        batchCount--;
                        if (callback && !batchCount) callback();
                    });
                } else {
                    imageStore.push(images[i]);
                }
            } else {
                remaining.push(images[i]);
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
                images[i].style.transition = 'opacity 0.5s ease-in';
                if (displayType === 'progressive') {
                    images[i].style.opacity = '0';
                }
                zimImages.push(images[i]);
            }
        }
        if (displayType === 'manual') {
            prepareManualExtraction(zimImages);
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
        // The amount by which to offset the second reading of the viewport
        var offset = window.innerHeight;
        // Perform an immediate extraction of visible images so as not to disconcert the user
        // We request images twice because frequently the position of all of them is not known at this stage in rendering
        images = queueImages(images, true, 0, function () {
            images = queueImages(images, true, window.innerHeight).remaining;
        }).remaining;
        if (!images.length) return;
        // There are images remaining, so set up an event listener to load more images once user has stopped scrolling the iframe
        var iframe = document.getElementById('articleContent');
        var iframeWindow = iframe.contentWindow;
        var scrollPos;
        var rateLimiter = 0;
        // NB we add the event listener this way so we can access it in app.js
        iframeWindow.onscroll = function () {
            if (!images.length) return;
            var velo = iframeWindow.pageYOffset - scrollPos;
            if (velo < 15 && velo > -15) {
                // Scroll is now quite slow, so start getting images in viewport
                images = queueImages(images, true, 0, function () {
                    if (!rateLimiter) {
                        rateLimiter = 1;
                        images = queueImages(images, true, velo >= 0 ? offset : -offset, function () {
                            rateLimiter = 0;
                        }).remaining;
                    }
                }).remaining;
            }
            scrollPos = iframeWindow.pageYOffset;
        };
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
     * Functions and classes exposed by this module
     */
    return {
        extractImages: extractImages,
        setupManualImageExtraction: prepareManualExtraction,
        prepareImagesServiceWorker: prepareImagesServiceWorker,
        lazyLoad: lazyLoad,
        loadMathJax: loadMathJax
    };
});
