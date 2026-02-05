const CACHE_NAME = 'portale-classe-v1';
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

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(ASSETS))
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => response || fetch(event.request))
    );
});
