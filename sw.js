// Mask Drill offline cache. Generated at build time by scripts/build-sw.mjs:
// VERSION changes whenever any built file changes, FILES lists everything in dist/.
const VERSION = 'mask-drill-af4a58af8dc1';
const FILES = ["./","./assets/index-BcDfbXcc.css","./assets/index-DgduxOWU.js","./icon-192.png","./icon-512.png","./icon.svg","./index.html","./manifest.json"];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(VERSION)
      .then((cache) => cache.addAll(FILES))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// Cache first: the whole app is precached, so it opens instantly and offline.
// A new build installs a new cache and is used from the next visit.
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith(
    caches.match(request, { ignoreSearch: true, ignoreVary: true }).then(
      (hit) =>
        hit ||
        fetch(request).catch(() =>
          request.mode === 'navigate' ? caches.match('./index.html') : Response.error(),
        ),
    ),
  );
});
