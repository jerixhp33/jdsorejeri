const CACHE_NAME = 'jd-store-offline-v2';
const OFFLINE_URL = '/offline.html';

// Install event - Cache the offline page
self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll([OFFLINE_URL]);
    })
  );
  self.skipWaiting();
});

// Activate event - Clean up old caches
self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (cacheNames) {
      return Promise.all(
        cacheNames.map(function (cacheName) {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - Serve offline fallback page on connection failure
self.addEventListener('fetch', function (event) {
  // Only intercept document/navigation page requests
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(function () {
        return caches.open(CACHE_NAME).then(function (cache) {
          return cache.match(OFFLINE_URL);
        });
      })
    );
  }
});

// Push notification event listener
self.addEventListener('push', function (event) {
  if (event.data) {
    try {
      const data = event.data.json();
      const options = {
        body: data.body,
        icon: data.icon || '/icon-192x192.png',
        badge: '/badge-96x96.png',
        image: data.image,
        vibrate: [200, 100, 200, 100, 200, 100, 200],
        requireInteraction: true, // Keep it visible until the user interacts
        data: {
          url: data.url || '/'
        },
        actions: [
          { action: 'open', title: 'View Details' },
          { action: 'close', title: 'Dismiss' }
        ]
      };
      event.waitUntil(self.registration.showNotification(data.title, options));
    } catch (e) {
      console.error('Error parsing push message data:', e);
    }
  }
});

// Notification click event listener
self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(windowClients => {
      for (var i = 0; i < windowClients.length; i++) {
        var client = windowClients[i];
        if (client.url === event.notification.data.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(event.notification.data.url);
      }
    })
  );
});
