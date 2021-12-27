// Self-destroying service-worker - see https://github.com/NekR/self-destroying-sw

// If you want new SW to activate immediately, use below
// self.addEventListener('install', function (e) {
//   self.skipWaiting();
// });

self.addEventListener('activate', function (e) {
  self.registration.unregister().then(function () {
    return self.clients.matchAll();
  }).then(function (clients) {
    clients.forEach(function (client) {
      return client.navigate(client.url);
    });
  });
});