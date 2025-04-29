let cacheData = 'appV1';

this.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(cacheData).then((cache) => {
      return cache.addAll([
        '/user',
        '/todo',
        '/',
        '/manifest.json', // manifest bhi cache me daal de
        '/icon.png',
      ]);
    })
  );
});

this.addEventListener('fetch', (event) => {
  if (!navigator.onLine) {
    event.respondWith(
      caches.match(event.request).then((resp) => {
        if (resp) {
          return resp;
        }
        // agar cache me nahi mila to network se laakar return karo
        let requestUrl = event.request.clone();
        return fetch(requestUrl).catch(() => {
          return new Response("Network error occurred", {
            status: 404,
            headers: { 'Content-Type': 'text/plain' }
          });
        });
      })
    );
  }
});
