// Service Worker with Cache-first network, with some code from pwabuilder.com 

const CACHE = "sw-precache";
const precacheFiles = [
  "manifest.json",
  "www/I/s/Icon_External_Link.png",
  "www/css/app.css",
  "www/css/bootstrap.min.css",
  "www/fonts/glyphicons-halflings-regular.woff2",
  "www/img/icons/kiwix-256.png",
  "www/img/icons/kiwix-32.png",
  "www/img/icons/kiwix-60.png",
  "www/img/icons/kiwix-blue-32.png",
  "www/img/icons/kiwix-midnightblue-90.png",
  "www/img/icons/map_marker-18px.png",
  "www/img/icons/wikimed-blue-32.png",
  "www/img/spinner.gif",
  "www/index.html",
  "www/js/app.js",
  "www/js/init.js",
  "www/js/lib/bootstrap.js",
  "www/js/lib/bootstrap.min.js",
  "www/js/lib/cookies.js",
  "www/js/lib/images.js",
  "www/js/lib/jquery-3.2.1.slim.js",
  "www/js/lib/kiwixServe.js",
  "www/js/lib/q.js",
  "www/js/lib/require.js",
  "www/js/lib/transformStyles.js",
  "www/js/lib/uiUtil.js",
  "www/js/lib/utf8.js",
  "www/js/lib/util.js",
  "www/js/lib/xzdec.js",
  "www/js/lib/xzdec_wrapper.js",
  "www/js/lib/zimArchive.js",
  "www/js/lib/zimArchiveLoader.js",
  "www/js/lib/zimDirEntry.js",
  "www/js/lib/zimfile.js"
];

self.addEventListener("install", function (event) {
  console.log("[SW] Install Event processing");

  console.log("[SW] Skip waiting on install");
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE).then(function (cache) {
      console.log("[SW] Caching pages during install");
      return cache.addAll(precacheFiles);
    })
  );
});

// Allow sw to control of current page
self.addEventListener("activate", function (event) {
  console.log("[SW] Claiming clients for current page");
  event.waitUntil(self.clients.claim());
});

// If any fetch fails, it will look for the request in the cache and serve it from there first
self.addEventListener("fetch", function (event) { 
  console.log('[SW] Service Worker ' + (event.request.method === "GET" ? 'intercepted ' : 'noted ') + event.request.url, event.request.method);
  if (event.request.method !== "GET") return;
  event.respondWith(
    fromCache(event.request).then(
      function (response) {
        // The response was found in the cache so we responde with it and update the entry

        // This is where we call the server to get the newest version of the
        // file to use the next time we show view
        event.waitUntil(
          fetch(event.request).then(function (response) {
            console.log('[SW] Refreshing CACHE from server...');
            return updateCache(event.request, response);
          })
        );
        console.log('[SW] Supplying ' + event.request.url + ' from CACHE...');
        return response;
      },
      function () {
        // The response was not found in the cache so we look for it on the server
        return fetch(event.request)
          .then(function (response) {
            // If request was success, add or update it in the cache
            event.waitUntil(updateCache(event.request, response.clone()));

            return response;
          })
          .catch(function (error) {
            console.log("[SW] Network request failed and no cache.", error);
          });
      }
    )
  );
});

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
  return caches.open(CACHE).then(function (cache) {
    return cache.put(request, response);
  });
}
