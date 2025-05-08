// Updated Service Worker for both local and Netlify environments
const CACHE_NAME = 'taskmaster-v5';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon.png',
  './app.js',
];

// Install event - Cache important files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache opened');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .catch(error => {
        console.error('Cache installation failed:', error);
      })
  );
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

// Activate event - Clean up old caches
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            // Delete old caches
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Ensure the service worker takes control of all clients immediately
  self.clients.claim();
});

// Fetch event - Serve from cache first, then network
self.addEventListener('fetch', (event) => {
  // Ignore requests with unsupported schemes
  console.log('Intercepted request:', event.request.url);

  if (!event.request.url.startsWith('http')) {
    console.warn('Unsupported request scheme:', event.request.url);
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return the response from the cached version
        if (response) {
          return response;
        }

        // Not in cache - return the result from the live server
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest)
          .then((response) => {
            // Check if we received a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response as it's a one-time use stream
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // If fetch fails (e.g., offline), try to return a fallback
            if (event.request.url.indexOf('/user') !== -1) {
              return caches.match('./user');
            }

            if (event.request.url.indexOf('/todo') !== -1) {
              return caches.match('./todo');
            }

            // Return a basic offline page as fallback for other requests
            return new Response("You are currently offline. Please check your connection.", {
              status: 503,
              headers: { 'Content-Type': 'text/plain' }
            });
          });
      })
  );
});