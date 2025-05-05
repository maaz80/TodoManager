// swDev.js - Service Worker Registration
export default function swDev() {
  // Check if service workers are supported
  if ('serviceWorker' in navigator) {
    // Use a relative path that works in both local dev and production
    const swPath = './sw.js';
    
    // Wait for window load to avoid competing with important resources
    window.addEventListener('load', () => {
      navigator.serviceWorker.register(swPath)
        .then((registration) => {
          console.log('Service Worker registered successfully:', registration);
          
          // Check for updates
          registration.addEventListener('updatefound', () => {
            const installingWorker = registration.installing;
            console.log('New version installing...');
            
            installingWorker.addEventListener('statechange', () => {
              if (installingWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  // New version installed but waiting to activate
                  console.log("New version available. Refreshing...");
                  
                    window.location.reload();
                } else {
                  console.log("Content cached for offline use.");
                }
              }
            });
          });
          
          // Check for updates every 60 minutes (optional)
          setInterval(() => {
            registration.update();
            console.log('Checking for service worker updates...');
          }, 60 * 60 * 1000);
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });
    });
  } else {
    console.log('Service Workers not supported in this browser');
  }
}

// sw.js - Service Worker Script
const CACHE_NAME = 'taskmaster-v2'; // Increment cache version to trigger update
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon.png'
];

// Install event - Cache important files
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
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
  console.log('Service Worker activating...');
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            // Delete old caches
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Ensure the service worker takes control of all clients immediately
  self.clients.claim();
});

// Fetch event - Network first for API requests, Cache first for static assets
self.addEventListener('fetch', (event) => {
  // Ignore requests with unsupported schemes
  if (!event.request.url.startsWith('http')) {
    return;
  }
  
  // URL object to analyze the request
  const requestUrl = new URL(event.request.url);
  
  // For API requests or mutations (POST, PUT, DELETE) - use Network First
  if (event.request.method !== 'GET' || 
      requestUrl.pathname.includes('/api/') || 
      requestUrl.pathname.includes('/supabase/') ||
      requestUrl.hostname.includes('supabase.co')) {
    event.respondWith(
      fetch(event.request)
        .catch(error => {
          console.error('Fetch failed:', error);
          // Return a custom offline response for API requests
          return new Response(JSON.stringify({ error: 'You are offline' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
          });
        })
    );
    return;
  }
  
  // For static assets - use Cache First
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // Return cached response if found
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // Not in cache - fetch from network
        return fetch(event.request)
          .then((networkResponse) => {
            // Check if we received a valid response
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }
            
            // Clone the response as it's a one-time use stream
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
            return networkResponse;
          })
          .catch(() => {
            // If fetch fails (e.g., offline), try to return a fallback
            if (event.request.url.includes('/user') || event.request.url.includes('/todo')) {
              return caches.match('./index.html');
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