const CACHE_NAME = 'portale-classe-v4';
const ASSETS = [
    '/',
    '/index.html',
    '/interrogazioni.html',
    '/calendar.html',
    '/archivio.html',
    '/style.css',
    '/js/theme.js',
    '/js/app.js',
    '/js/api.js',
    '/js/ui.js',
    '/js/utils.js',
    '/public/icon.png'
];

// Install: precache assets
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(ASSETS))
            .then(() => self.skipWaiting())
    );
});

// Activate: clean up old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => Promise.all(
            keys.map(key => {
                if (key !== CACHE_NAME) return caches.delete(key);
            })
        )).then(() => self.clients.claim())
    );
});

// Fetch: Stale-while-revalidate strategy
self.addEventListener('fetch', event => {
    // Only handle GET requests
    if (event.request.method !== 'GET') return;

    event.respondWith(
        caches.match(event.request).then(cachedResponse => {
            const fetchPromise = fetch(event.request).then(networkResponse => {
                // Cache the new response
                if (networkResponse && networkResponse.status === 200) {
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, responseToCache);
                    });
                }
                return networkResponse;
            }).catch(() => {
                // Offline fallback - could return a custom offline page
            });

            return cachedResponse || fetchPromise;
        })
    );
});
