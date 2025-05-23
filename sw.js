// Service Worker para Shinchaneros
const CACHE_NAME = 'shinchaneros-v1';
const urlsToCache = [
    '/',
    '/css/style.css',
    '/css/shinchaneros-style.css',
    '/js/script.js',
    '/js/notifications.js',
    '/img/logo.png',
    '/img/shin-chan-face.png'
];

// Install event
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
    );
});

// Fetch event
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                return response || fetch(event.request);
            })
    );
});

// Push event for notifications
self.addEventListener('push', event => {
    const options = {
        body: event.data ? event.data.text() : '¡Nuevo episodio disponible!',
        icon: '/img/shin-chan-face.png',
        badge: '/img/favicon.ico',
        vibrate: [200, 100, 200],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'explore',
                title: '¡Ver episodio!',
                icon: '/img/play-icon.png'
            },
            {
                action: 'close',
                title: 'Cerrar',
                icon: '/img/close-icon.png'
            }
        ]
    };

    event.waitUntil(
        self.registration.showNotification('🎭 Shinchaneros.com', options)
    );
});

// Notification click event
self.addEventListener('notificationclick', event => {
    event.notification.close();

    if (event.action === 'explore') {
        event.waitUntil(
            clients.openWindow('/episodios.html')
        );
    }
});