// BoilerFuel Service Worker — offline caching
// Bump CACHE_VERSION when deploying significant changes to force a fresh cache
const CACHE_VERSION = 'v2';
const STATIC_CACHE = `boilerfuel-static-${CACHE_VERSION}`;
const API_CACHE = `boilerfuel-api-${CACHE_VERSION}`;

// App shell files to precache
const PRECACHE_URLS = [
  '/',
  '/profile',
  '/stats',
  '/about',
  '/manifest.json',
  '/favicon.svg',
];

// Install: precache app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    }).then(() => self.skipWaiting())
  );
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((k) => k !== STATIC_CACHE && k !== API_CACHE)
          .map((k) => caches.delete(k))
      );
    }).then(() => self.clients.claim())
  );
});

// Message: allow pages to trigger skipWaiting for seamless updates
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Fetch: network-first for API, cache-first for static assets
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // API requests: network-first with cache fallback
  if (url.pathname.startsWith('/api/foods') || url.pathname.startsWith('/api/dining-courts')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Clone and cache the fresh response
          const clone = response.clone();
          caches.open(API_CACHE).then((cache) => {
            cache.put(event.request, clone);
          });
          return response;
        })
        .catch(() => {
          // Network failed — serve from cache
          return caches.match(event.request);
        })
    );
    return;
  }

  // Static assets & pages: cache-first with network fallback
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) {
          // Return cached version immediately, update in background
          fetch(event.request).then((response) => {
            caches.open(STATIC_CACHE).then((cache) => {
              cache.put(event.request, response);
            });
          }).catch(() => {});
          return cached;
        }
        // Not cached — fetch from network and cache it
        return fetch(event.request).then((response) => {
          // Only cache successful responses for same-origin
          if (response.ok && url.origin === self.location.origin) {
            const clone = response.clone();
            caches.open(STATIC_CACHE).then((cache) => {
              cache.put(event.request, clone);
            });
          }
          return response;
        });
      })
    );
    return;
  }
});
