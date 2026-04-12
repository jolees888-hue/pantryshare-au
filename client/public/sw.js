// PantryShare AU — Service Worker
const CACHE_NAME = 'pantryshare-v1';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

// Install — cache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — network first, fall back to cache for navigation
self.addEventListener('fetch', event => {
  const { request } = event;
  
  // API calls — network only, no caching
  if (request.url.includes('/api/')) {
    return;
  }
  
  // Navigation requests — network first, cache fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/'))
    );
    return;
  }

  // Static assets — cache first
  event.respondWith(
    caches.match(request).then(cached => cached || fetch(request))
  );
});
