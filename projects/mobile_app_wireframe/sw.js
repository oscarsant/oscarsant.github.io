const BUILD_ID = "20260109-161226"; // injected automatically by version-inject.js
const CACHE_NAME = `app-cache-${BUILD_ID}`;
const OFFLINE_FALLBACK_PAGE = `index.html?v=${BUILD_ID}`;

const CORE_ASSETS = [
  // HTML/CSS/JS with cache-busting
  `index.html?v=${BUILD_ID}`,
  `styles.css?v=${BUILD_ID}`,
  `css/newsletters.css?v=${BUILD_ID}`,
  `css/log-meeting.css?v=${BUILD_ID}`,
  `script.js?v=${BUILD_ID}`,
  `js/newsletters.js?v=${BUILD_ID}`,
  `js/news-content.js?v=${BUILD_ID}`,
  `js/prototype.js?v=${BUILD_ID}`,
  `js/log-meeting.js?v=${BUILD_ID}`,
  `manifest.json?v=${BUILD_ID}`,
  // Static assets (rarely change, can be unversioned)
  "img/politico-logo_2024_monogram.svg",
  "img/pro-logo_2024_monogram.svg",
  "img/politico-logo_legacy.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
      .then(async () => {
        // The controllerchange event in the client will handle the reload.
        // No need to post a message.
      })
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return; // bypass non-GET

  // Navigation requests: network-first with offline fallback to versioned index.html
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match(OFFLINE_FALLBACK_PAGE))
    );
    return;
  }

  // Static assets: cache-first, then network and cache the result
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((response) => {
          // Cache successful same-origin responses
          const copy = response.clone();
          if (response.ok && request.url.startsWith(self.location.origin)) {
            caches
              .open(CACHE_NAME)
              .then((cache) => cache.put(request, copy))
              .catch(() => {});
          }
          return response;
        })
        .catch(() => undefined);
    })
  );
});
