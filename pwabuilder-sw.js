// Self-destroying service-worker - see https://github.com/NekR/self-destroying-sw

// We activate SW immediately in order to avoid a three-stage upgrade process
self.addEventListener('install', function (e) {
  self.skipWaiting();
});

self.addEventListener('activate', function (e) {
  self.registration.unregister().then(function () {
    return self.clients.matchAll();
  }).then(function (clients) {
    clients.forEach(function (client) {
      return client.navigate(client.url);
    });
  });
});