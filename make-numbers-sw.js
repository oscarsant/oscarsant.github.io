// Service worker for Make Numbers PWA
// Network-first strategy: always tries the network, falls back to cache.
// skipWaiting + clients.claim ensures a new SW activates immediately on install,
// so pushing code changes takes effect as soon as the user reopens the app.

var CACHE = 'make-numbers-v1';
var PRECACHE = [
	'/make-numbers.html',
	'/css/make-numbers.css',
	'/css/main.css',
	'/js/make-numbers.js',
];

self.addEventListener('install', function (e) {
	self.skipWaiting();
	e.waitUntil(
		caches.open(CACHE).then(function (cache) {
			return cache.addAll(PRECACHE);
		}),
	);
});

self.addEventListener('activate', function (e) {
	e.waitUntil(
		caches.keys().then(function (keys) {
			return Promise.all(
				keys.filter(function (k) { return k !== CACHE; })
					.map(function (k) { return caches.delete(k); }),
			);
		}).then(function () {
			return self.clients.claim();
		}),
	);
});

self.addEventListener('fetch', function (e) {
	// Only handle GET requests for same-origin or the precached assets
	if (e.request.method !== 'GET') return;
	e.respondWith(
		fetch(e.request)
			.then(function (response) {
				// Cache a fresh copy on every successful network response
				var clone = response.clone();
				caches.open(CACHE).then(function (cache) {
					cache.put(e.request, clone);
				});
				return response;
			})
			.catch(function () {
				return caches.match(e.request);
			}),
	);
});
