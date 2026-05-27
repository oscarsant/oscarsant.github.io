// Service worker for OAS portfolio
// Network-first strategy: always tries network first, falls back to cache.
// skipWaiting + clients.claim ensures a new SW activates immediately after deploy,
// so users always get the latest version automatically on next visit.

var CACHE = "oas-v2";
var PRECACHE = [
	"/",
	"/index.html",
	"/css/main.css",
	"/js/main.js",
	"/js/share.js",
	"/mylogo.svg",
	"/icons/icon-192.png",
	"/icons/icon-512.png",
];

self.addEventListener("install", function (e) {
	self.skipWaiting();
	e.waitUntil(
		caches.open(CACHE).then(function (cache) {
			return cache.addAll(PRECACHE);
		}),
	);
});

self.addEventListener("activate", function (e) {
	e.waitUntil(
		caches
			.keys()
			.then(function (keys) {
				return Promise.all(
					keys
						.filter(function (k) {
							return k !== CACHE;
						})
						.map(function (k) {
							return caches.delete(k);
						}),
				);
			})
			.then(function () {
				return self.clients.claim();
			}),
	);
});

self.addEventListener("fetch", function (e) {
	if (e.request.method !== "GET") return;
	if (!e.request.url.startsWith("http")) return;

	e.respondWith(
		fetch(e.request)
			.then(function (response) {
				// Only cache full responses (status 200); skip partial/range (206)
				if (response.status === 200) {
					var clone = response.clone();
					caches.open(CACHE).then(function (cache) {
						cache.put(e.request, clone);
					});
				}
				return response;
			})
			.catch(function () {
				return caches.match(e.request);
			}),
	);
});
