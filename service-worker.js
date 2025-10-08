const CACHE_NAME = 'ultimate-clock-cache-v1';
const urlsToCache = [
    '/UltimateClockPWA/',
    '/UltimateClockPWA/index.html',
    '/UltimateClockPWA/style.css',
    '/UltimateClockPWA/script.js',
    '/UltimateClockPWA/manifest.json',
    // Add paths to your icons here when you create them
    // '/UltimateClockPWA/icon-192.png',
    // '/UltimateClockPWA/icon-512.png'
];

self.addEventListener('install', event => {
    // Perform install steps
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Cache hit - return response
                if (response) {
                    return response;
                }
                // No cache hit - fetch from network
                return fetch(event.request);
            })
    );
});

// Optional: Clear old caches when a new version is installed
self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
