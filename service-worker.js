// Service Worker for PWA
const CACHE_NAME = 'tutoring-pwa-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/css/style.css',
    '/js/db.js',
    '/js/app.js',
    '/manifest.json',
    '/icons/icon-192.png',
    '/icons/icon-512.png',
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css',
    'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css',
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js',
    'https://code.jquery.com/jquery-3.7.0.min.js',
    'https://cdn.jsdelivr.net/npm/chart.js'
];

// 安装
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
            .then(() => self.skipWaiting())
    );
});

// 激活
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// 拦截请求
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) return response;

                return fetch(event.request).then(fetchResponse => {
                    if (!fetchResponse || fetchResponse.status !== 200) {
                        return fetchResponse;
                    }

                    const responseToCache = fetchResponse.clone();
                    caches.open(CACHE_NAME)
                        .then(cache => cache.put(event.request, responseToCache));

                    return fetchResponse;
                });
            })
            .catch(() => {
                if (event.request.mode === 'navigate') {
                    return caches.match('/index.html');
                }
            })
    );
});
