// Stock2Table Service Worker for PWA functionality
const CACHE_NAME = 'stock2table-v3';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icon-192.svg',
  '/icon-512.svg'
];

// Install event - cache core assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching core assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache when offline, with network-first strategy for API calls
self.addEventListener('fetch', (event) => {
  // API calls - network first, cache fallback (only GET requests)
  if (event.request.url.includes('/api/') && event.request.method === 'GET') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Clone response for cache (only successful responses)
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Fallback to cache if network fails
          return caches.match(event.request);
        })
    );
  }
  // Static assets - cache first (only GET requests with successful responses)
  else if (event.request.method === 'GET') {
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          return response || fetch(event.request)
            .then((fetchResponse) => {
              // Only cache successful responses from same origin
              if (fetchResponse.ok && new URL(event.request.url).origin === location.origin) {
                const responseClone = fetchResponse.clone();
                caches.open(CACHE_NAME).then((cache) => {
                  cache.put(event.request, responseClone);
                });
              }
              return fetchResponse;
            });
        })
    );
  }
  // For non-GET requests, just fetch without caching
  else {
    event.respondWith(fetch(event.request));
  }
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('Service Worker: Background sync triggered');
    event.waitUntil(
      // Process any queued actions when back online
      processOfflineActions()
    );
  }
});

// Push notifications for meal reminders
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'Time to start cooking!',
    icon: '/icon-192.svg',
    badge: '/icon-192.svg',
    vibrate: [200, 100, 200],
    data: {
      url: '/'
    },
    actions: [
      {
        action: 'view',
        title: 'View Recipe',
        icon: '/icon-192.svg'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icon-192.svg'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Stock2Table', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow(event.notification.data.url || '/')
    );
  }
});

// Helper function to process offline actions
async function processOfflineActions() {
  // This would process any queued actions from when the user was offline
  // For example: syncing added ingredients, meal plans, or shopping lists
  console.log('Processing offline actions...');
}