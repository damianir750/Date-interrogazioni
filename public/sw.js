const CACHE_NAME = "portale-classe-v4";
const ASSETS = [
  "/",
  "/index.html",
  "/interrogazioni.html",
  "/calendar.html",
  "/archivio.html",
  "/style.css",
  "/js/theme.js",
  "/js/app.js",
  "/js/api.js",
  "/js/ui.js",
  "/js/utils.js",
  "/icon.png",
];

// Install: precache assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        // Try caching each asset individually to prevent failure if one is missing (e.g. hashed JS/CSS)
        return Promise.allSettled(
          ASSETS.map((url) =>
            cache.add(url).catch((err) => console.log(`Failed to cache ${url}:`, err)),
          ),
        );
      })
      .then(() => self.skipWaiting()),
  );
});

// Activate: clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME) return caches.delete(key);
          }),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

// Fetch: Stale-while-revalidate strategy
self.addEventListener("fetch", (event) => {
  // Only handle GET requests and skip API calls
  if (event.request.method !== "GET" || event.request.url.includes("/api/"))
    return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          // Cache the new response
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Offline fallback - could return a custom offline page
        });

      return cachedResponse || fetchPromise;
    }),
  );
});
