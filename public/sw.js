// TaskMaster Service Worker - Enhanced for reliable updates
const CACHE_VERSION = '1.0.1'; // Increment this when you make changes to trigger updates
const CACHE_NAME = `taskmaster-${CACHE_VERSION}`;

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon.png'
  // Add any other critical assets here
];

// Install event - Cache important files
self.addEventListener('install', (event) => {
  console.log(`[Service Worker] Installing new version: ${CACHE_VERSION}`);
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching app assets');
        return cache.addAll(ASSETS_TO_CACHE).catch(error => {
          console.error('[Service Worker] Cache addAll error:', error);
          // Continue even if some assets fail to cache
          return Promise.resolve();
        });
      })
  );
  
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

// Activate event - Clean up old caches
self.addEventListener('activate', (event) => {
  console.log(`[Service Worker] Activating new version: ${CACHE_VERSION}`);
  
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log(`[Service Worker] Deleting old cache: ${cacheName}`);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => {
      console.log('[Service Worker] Claiming clients');
      return self.clients.claim();
    })
  );
});

// Fetch event - Serve from cache first, then network
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  // Ignore requests with unsupported schemes
  if (!event.request.url.startsWith('http')) {
    console.log('[Service Worker] Ignoring non-http request:', event.request.url);
    return;
  }

  // For API requests - use network first, fallback to custom response
  if (event.request.url.includes('/api/') || 
      event.request.url.includes('/user') || 
      event.request.url.includes('/todo')) {
    
    event.respondWith(
      fetch(event.request.clone())
        .then((response) => {
          // Cache valid responses
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          // Try the cache first
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            
            // Custom fallbacks for specific routes
            if (event.request.url.includes('/user')) {
              return caches.match('./user');
            }
            
            if (event.request.url.includes('/todo')) {
              return caches.match('./todo');
            }
            
            // Return a basic offline page as fallback
            return new Response(
              "You are currently offline. Please check your connection.", {
                status: 503,
                headers: { 'Content-Type': 'text/plain' }
              }
            );
          });
        })
    );
    return;
  }

  // For static assets - cache first, network as fallback
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return the response
        if (response) {
          return response;
        }

        // Not in cache - get from network
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest)
          .then((response) => {
            // Check if we received a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            // Cache the fetched response
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // Fallback for HTML requests
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match('./index.html');
            }
            
            return new Response(
              "Resource unavailable offline", {
                status: 503,
                headers: { 'Content-Type': 'text/plain' }
              }
            );
          });
      })
  );
});

// Listen for messages from clients
self.addEventListener('message', (event) => {
  console.log('[Service Worker] Received message:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Log any errors
self.addEventListener('error', (event) => {
  console.error('[Service Worker] Error:', event.message, event.filename, event.lineno);
});