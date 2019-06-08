﻿/**
 * service-worker.js : Service Worker implementation,
 * in order to capture the HTTP requests made by an article, and respond with the
 * corresponding content, coming from the archive
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

/**
 * A global Boolean that governs whether images are displayed
 * app.js can alter this variable via messaging
 */
var imageDisplay;

self.addEventListener('install', function(event) {
    event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', function(event) {
    // "Claiming" the ServiceWorker is necessary to make it work right away,
    // without the need to reload the page.
    // See https://developer.mozilla.org/en-US/docs/Web/API/Clients/claim
    event.waitUntil(self.clients.claim());
});

var regexpRemoveUrlParameters = new RegExp(/([^?#]+)[?#].*$/);

// This function is duplicated from uiUtil.js
// because using requirejs would force to add the 'fetch' event listener
// after the initial evaluation of this script, which is not supported any more
// in recent versions of the browsers.
// Cf https://bugzilla.mozilla.org/show_bug.cgi?id=1181127
// TODO : find a way to avoid this duplication

/**
 * Removes parameters and anchors from a URL
 * @param {type} url
 * @returns {String} same URL without its parameters and anchors
 */
function removeUrlParameters(url) {
    return url.replace(regexpRemoveUrlParameters, "$1");
}

var outgoingMessagePort = null;
var fetchCaptureEnabled = false;
self.addEventListener('fetch', fetchEventListener);

self.addEventListener('message', function (event) {
    if (event.data.action === 'init') {
        // On 'init' message, we initialize the outgoingMessagePort and enable the fetchEventListener
        outgoingMessagePort = event.ports[0];
        fetchCaptureEnabled = true;
    }
    if (event.data.action === 'disable') {
        // On 'disable' message, we delete the outgoingMessagePort and disable the fetchEventListener
        outgoingMessagePort = null;
        fetchCaptureEnabled = false;
    }
});

// Pattern for ZIM file namespace - see https://wiki.openzim.org/wiki/ZIM_file_format#Namespaces
var regexpZIMUrlWithNamespace = new RegExp(/(?:^|\/)([-ABIJMUVWX])\/(.+)/);

function fetchEventListener(event) {
    if (fetchCaptureEnabled) {
        if (regexpZIMUrlWithNamespace.test(event.request.url)) {
            // The ServiceWorker will handle this request

            // If the user has disabled the display of images, and the browser wants an image, respond with empty SVG
            // A URL with "?kiwix-display" query string acts as a passthrough so that the regex will not match and
            // the image will be fetched by app.js  
            // DEV: If you need to hide more image types, add them to regex below and also edit equivalent regex in app.js
            if (imageDisplay !== 'all' && /(^|\/)[IJ]\/.*\.(jpe?g|png|svg|gif)($|[?#])(?!kiwix-display)/i.test(event.request.url)) {
                var svgResponse;
                if (imageDisplay === 'manual') 
                    svgResponse = "<svg xmlns='http://www.w3.org/2000/svg' width='1' height='1'><rect width='1' height='1' style='fill:lightblue'/></svg>";
                else
                    svgResponse = "<svg xmlns='http://www.w3.org/2000/svg'/>";
                    event.respondWith(new Response(svgResponse, { headers: { 'Content-Type': 'image/svg+xml' } }));
                return;
            }

            // Let's ask app.js for that content
            event.respondWith(new Promise(function(resolve, reject) {
                var nameSpace;
                var title;
                var titleWithNameSpace;
                var regexpResult = regexpZIMUrlWithNamespace.exec(event.request.url);
                nameSpace = regexpResult[1];
                title = regexpResult[2];

                // We need to remove the potential parameters in the URL
                title = removeUrlParameters(decodeURIComponent(title));

                titleWithNameSpace = nameSpace + '/' + title;

                // Let's instanciate a new messageChannel, to allow app.s to give us the content
                var messageChannel = new MessageChannel();
                messageChannel.port1.onmessage = function(event) {
                    if (event.data.action === 'giveContent') {
                        // Content received from app.js
                        var contentLength = event.data.content ? event.data.content.byteLength : null;
                        var contentType = event.data.mimetype;
                        // Set the imageDisplay variable if it has been sent in the event data
                        imageDisplay = typeof event.data.imageDisplay !== 'undefined' ? 
                            event.data.imageDisplay : imageDisplay;
                        var headers = new Headers ();
                        if (contentLength) headers.set('Content-Length', contentLength);
                        if (contentType) headers.set('Content-Type', contentType);
                        // Test if the content is a video or audio file
                        // See kiwix-js #519 and openzim/zimwriterfs #113 for why we test for invalid types like "mp4" or "webm" (without "video/")
                        // The full list of types produced by zimwriterfs is in https://github.com/openzim/zimwriterfs/blob/master/src/tools.cpp
                        if (contentLength >= 1 && /^(video|audio)|(^|\/)(mp4|webm|og[gmv]|mpeg)$/i.test(contentType)) {
                            // In case of a video (at least), Chrome and Edge need these HTTP headers else seeking doesn't work
                            // (even if we always send all the video content, not the requested range, until the backend supports it)
                            headers.set('Accept-Ranges', 'bytes');
                            headers.set('Content-Range', 'bytes 0-' + (contentLength-1) + '/' + contentLength);
                        }
                        var responseInit = {
                            status: 200,
                            statusText: 'OK',
                            headers: headers
                        };

                        var httpResponse = new Response(event.data.content, responseInit);

                        // Let's send the content back from the ServiceWorker
                        resolve(httpResponse);
                    }
                    else if (event.data.action === 'sendRedirect') {
                        resolve(Response.redirect(event.data.redirectUrl));
                    }
                    else {
                        console.error('Invalid message received from app.js for ' + titleWithNameSpace, event.data);
                        reject(event.data);
                    }
                };
                outgoingMessagePort.postMessage({'action': 'askForContent', 'title': titleWithNameSpace}, [messageChannel.port2]);
            }));
        }
        // If event.respondWith() isn't called because this wasn't a request that we want to handle,
        // then the default request/response behavior will automatically be used.
    }
}
