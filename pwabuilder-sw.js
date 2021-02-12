// Service Worker with Cache-first network, with some code from pwabuilder.com 
'use strict';

// App version number - ENSURE IT MATCHES VALUE IN init.js
// DEV: Changing this will cause the browser to recognize that the Service Worker has changed, and it will download and
// install a new copy
const appVersion = '1.2.1';

// Kiwix ZIM Archive Download Server in regex form
// DEV: The server URL is defined in init.js, but is not available to us in SW
const regexpKiwixDownloadLinks = /download\.kiwix\.org/i;

// Pattern for ZIM file namespace - see https://wiki.openzim.org/wiki/ZIM_file_format#Namespaces
// In our case, there is also the ZIM file name, used as a prefix in the URL
const regexpZIMUrlWithNamespace = /(?:^|\/)([^\/]+\/)([-ABCIJMUVWX])\/(.+)/;

const CACHE = "kiwix-precache-" + appVersion;
const precacheFiles = [
  ".",
  "www",
  "www/",
  "manifest.json",
  "pwabuilder-sw.js",
  "www/-/style.css",
  "www/-/s/style.css",
  "www/-/s/style-dark.css",
  "www/-/s/style-dark-invert.css",
  "www/-/s/style-mobile.css",
  "www/-/s/vector.css",
  "www/-/s/css_modules/content.parsoid.css",
  "www/-/s/css_modules/ext.cite.a11y.css",
  "www/-/s/css_modules/ext.cite.styles.css",
  "www/-/s/css_modules/ext.cite.ux-enhancements.css",
  "www/-/s/css_modules/ext.inputBox.styles.css",
  "www/-/s/css_modules/ext.kartographer.frame.css",
  "www/-/s/css_modules/ext.kartographer.link.css",
  "www/-/s/css_modules/ext.kartographer.style.css",
  "www/-/s/css_modules/inserted_style.css",
  "www/-/s/css_modules/inserted_style_mobile.css",
  "www/-/s/css_modules/mobile.css",
  "www/-/s/css_modules/style.css",
  "www/I/s/Icon_External_Link.png",
  "www/css/app.css",
  "www/css/bootstrap.min.css",
  "www/fonts/glyphicons-halflings-regular.woff2",
  "www/img/icons/kiwix-256.png",
  "www/img/icons/kiwix-192.png",
  "www/img/icons/kiwix-32.png",
  "www/img/icons/kiwix-60.png",
  "www/img/icons/kiwix-blue-32.png",
  "www/img/icons/kiwix-midnightblue-90.png",
  "www/img/icons/wikimed-blue-32.png",
  "www/img/icons/wikimed-lightblue-32.png",
  "www/img/icons/wikivoyage-90-white.png",
  "www/img/icons/wikivoyage-black-32.png",
  "www/img/icons/wikivoyage-white-32.png",
  "www/img/icons/map_marker-18px.png",
  "www/img/spinner.gif",
  "www/index.html",
  "www/article.html",
  "www/js/app.js",
  "www/js/init.js",
  "www/js/lib/bootstrap.js",
  "www/js/lib/bootstrap.min.js",
  "www/js/lib/cache.js",
  "www/js/lib/filecache.js",
  "www/js/lib/images.js",
  "www/js/lib/jquery-3.2.1.slim.js",
  "www/js/lib/kiwixServe.js",
  "www/js/lib/q.js",
  "www/js/lib/require.js",
  "www/js/lib/settingsStore.js",
  "www/js/lib/transformStyles.js",
  "www/js/lib/uiUtil.js",
  "www/js/lib/utf8.js",
  "www/js/lib/util.js",
  "www/js/lib/xzdec.js",
  "www/js/lib/xzdec_wrapper.js",
  "www/js/lib/zstddec.js",
  "www/js/lib/zstddec_wrapper.js",
  "www/js/lib/zimArchive.js",
  "www/js/lib/zimArchiveLoader.js",
  "www/js/lib/zimDirEntry.js",
  "www/js/lib/zimfile.js",
  "www/js/katex/katex.min.js",
  "www/js/katex/katex.min.css",
  "www/js/katex/contrib/mathtex-script-type.min.js",
  "www/js/katex/fonts/KaTeX_AMS-Regular.woff2",
  "www/js/katex/fonts/KaTeX_Main-Bold.woff2",
  "www/js/katex/fonts/KaTeX_Main-Regular.woff2",
  "www/js/katex/fonts/KaTeX_Math-Italic.woff2",
  "www/js/katex/fonts/KaTeX_Size2-Regular.woff2",
  "www/js/katex/fonts/KaTeX_Size3-Regular.woff2",
  "www/js/katex/fonts/KaTeX_Size4-Regular.woff2"
];

// DEV: add any URL schemata that should be excluded from caching with the Cache API to the regex below
// As of 08-2019 the chrome-extension: schema is incompatible with the Cache API
// 'example-extension' is included to show how to add another schema if necessary
var excludedURLSchema = /^(?:file|chrome-extension|example-extension):/i;

self.addEventListener("install", function (event) {
  console.log("[SW] Install Event processing");
  // DEV: We can't skip waiting because too many params are loaded at an early stage from the old file before the new one can activate...
  // self.skipWaiting();
  var requests = precacheFiles.map(function(url) {
    return new Request(url + '?v' + appVersion, { cache: 'no-cache' });
  });
  if (!excludedURLSchema.test(requests[0].url)) event.waitUntil(
    caches.open(CACHE).then(function (cache) {
      return Promise.all(
        requests.map(function (request) {
          return fetch(request).then(function (response) {
            // Fail on 404, 500 etc
            if (!response.ok) throw Error('Could not fetch ' + request.url);
            return cache.put(request.url.replace(/\?v[^?/]+$/, ''), response);
          }).catch(function (err) {
            console.error("There was an error pre-caching files", err);
          });
        })
      );
    })
  );
});

// Allow sw to control current page
self.addEventListener("activate", function (event) {
  console.log("[SW] Claiming clients for current page");
  event.waitUntil(
    caches.keys().then(function (keyList) {
        return Promise.all(keyList.map(function (key) {
          console.log('[SW] Current cache key is ' + key);
          if (key !== CACHE) {
            console.log("[SW] App updated to version " + appVersion + ": deleting old cache")
            return caches.delete(key);
          }
      }));
    })
  );
});

/**
 * A Boolean that governs whether images are displayed
 * app.js can alter this variable via messaging
 */
let imageDisplay;

let outgoingMessagePort = null;
let fetchCaptureEnabled = false;

/**
 * Handle custom commands 'init' and 'disable' from app.js
 */
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
    self.removeEventListener('fetch', intercept);
  }
});

self.addEventListener('fetch', intercept);

// Look up fetch in cache, and if it does not exist, try to get it from the network
function intercept(event) {
  // Test if we're in an Electron app
  // DEV: Electron uses the file:// protocol and hacks it to work with SW, but it has CORS issues when using the Fetch API to fetch local files,
  // so we must bypass it here if we're fetching a local file
  if (/^file:/i.test(event.request.url) && ! (regexpZIMUrlWithNamespace.test(event.request.url) && /\.zim\w{0,2}\//i.test(event.request.url))) return;
  console.log('[SW] Service Worker ' + (event.request.method === "GET" ? 'intercepted ' : 'noted ') + event.request.url, event.request.method);
  if (event.request.method !== "GET") return;
  event.respondWith(
    fromCache(event.request).then(function (response) {
        console.log('[SW] Supplying ' + event.request.url + ' from CACHE...');
        return response;
      },
      function () {
        // The response was not found in the cache so we look for it on the server
        if (/\.zim\w{0,2}\//i.test(event.request.url) && regexpZIMUrlWithNamespace.test(event.request.url)) {
          if (imageDisplay !== 'all' && /(^|\/)[IJ]\/.*\.(jpe?g|png|svg|gif|webp)($|[?#])(?!kiwix-display)/i.test(event.request.url)) {
            // If the user has disabled the display of images, and the browser wants an image, respond with empty SVG
            // A URL with "?kiwix-display" query string acts as a passthrough so that the regex will not match and
            // the image will be fetched by app.js  
            // DEV: If you need to hide more image types, add them to regex below and also edit equivalent regex in app.js
            var svgResponse;
            if (imageDisplay === 'manual')
              svgResponse = "<svg xmlns='http://www.w3.org/2000/svg' width='1' height='1'><rect width='1' height='1' style='fill:lightblue'/></svg>";
            else
              svgResponse = "<svg xmlns='http://www.w3.org/2000/svg'/>";
            return new Response(svgResponse, {
              headers: {
                'Content-Type': 'image/svg+xml'
              }
            });
          }

          // Let's ask app.js for that content
          return new Promise(function (resolve, reject) {
            var nameSpace;
            var title;
            var titleWithNameSpace;
            var regexpResult = regexpZIMUrlWithNamespace.exec(event.request.url);
            var prefix = regexpResult[1];
            nameSpace = regexpResult[2];
            title = regexpResult[3];

            // We need to remove the potential parameters in the URL
            title = removeUrlParameters(decodeURIComponent(title));

            titleWithNameSpace = nameSpace + '/' + title;

            // Let's instantiate a new messageChannel, to allow app.js to give us the content
            var messageChannel = new MessageChannel();
            messageChannel.port1.onmessage = function (msgEvent) {
              if (msgEvent.data.action === 'giveContent') {
                // Content received from app.js
                var contentLength = msgEvent.data.content ? msgEvent.data.content.byteLength : null;
                var contentType = msgEvent.data.mimetype;
                // Set the imageDisplay variable if it has been sent in the event data
                imageDisplay = typeof msgEvent.data.imageDisplay !== 'undefined' ?
                  msgEvent.data.imageDisplay : imageDisplay;
                var headers = new Headers();
                if (contentLength) headers.set('Content-Length', contentLength);
                // Prevent CORS issues in PWAs
                if (contentLength) headers.set('Access-Control-Allow-Origin', '*');
                if (contentType) headers.set('Content-Type', contentType);
                // Test if the content is a video or audio file
                // See kiwix-js #519 and openzim/zimwriterfs #113 for why we test for invalid types like "mp4" or "webm" (without "video/")
                // The full list of types produced by zimwriterfs is in https://github.com/openzim/zimwriterfs/blob/master/src/tools.cpp
                if (contentLength >= 1 && /^(video|audio)|(^|\/)(mp4|webm|og[gmv]|mpeg)$/i.test(contentType)) {
                  // In case of a video (at least), Chrome and Edge need these HTTP headers else seeking doesn't work
                  // (even if we always send all the video content, not the requested range, until the backend supports it)
                  headers.set('Accept-Ranges', 'bytes');
                  headers.set('Content-Range', 'bytes 0-' + (contentLength - 1) + '/' + contentLength);
                }
                var responseInit = {
                  status: 200,
                  statusText: 'OK',
                  headers: headers
                };

                var httpResponse = new Response(msgEvent.data.content, responseInit);

                // Add or update css or javascript assets to the cache
                if (!excludedURLSchema.test(event.request.url) && /(text|application)\/(css|javascript)/i.test(contentType)) {
                  updateCache(event.request, httpResponse.clone());
                }

                // Let's send the content back from the ServiceWorker
                resolve(httpResponse);
              } else if (msgEvent.data.action === 'sendRedirect') {
                resolve(Response.redirect(prefix + msgEvent.data.redirectUrl));
              } else {
                console.error('Invalid message received from app.js for ' + titleWithNameSpace, msgEvent.data);
                reject(msgEvent.data);
              }
            };
            outgoingMessagePort.postMessage({
              'action': 'askForContent',
              'title': titleWithNameSpace
            }, [messageChannel.port2]);
          });
        } else {
          // It's not a ZIM URL
          return fetch(event.request).then(function (response) {
            // If request was success, add or update it in the cache
            if (!excludedURLSchema.test(event.request.url) && !/\.zim\w{0,2}$/i.test(event.request.url)) {
              event.waitUntil(updateCache(event.request, response.clone()));
            }
            return response;
          }).catch(function (error) {
            console.log("[SW] Network request failed and no cache.", error);
          });
        }
      }
    )
  );
}

function fromCache(request) {
  // Check to see if you have it in the cache
  // Return response
  // If not in the cache, then return
  return caches.open(CACHE).then(function (cache) {
    return cache.match(request).then(function (matching) {
      if (!matching || matching.status === 404) {
        return Promise.reject("no-match");
      }
      return matching;
    });
  });
}

function updateCache(request, response) {
  if (!excludedURLSchema.test(request.url)) {
    return caches.open(CACHE).then(function (cache) {
      return cache.put(request, response);
    });
  }
}

// Removes parameters and anchors from a URL
function removeUrlParameters(url) {
  return url.replace(/([^?#]+)[?#].*$/, "$1");
}