self.addEventListener('install', event => {
  event.waitUntil(
    caches.open('mi-pwa-cache').then(cache => {
      return cache.addAll([
        '/',
        'dark.html',
        'manifest.json',
        'icon-192x192.png',
        'icon-512x512.png'
      ]);
    })
  );
  console.log('Service Worker instalado');
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
