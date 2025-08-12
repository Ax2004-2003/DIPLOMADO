const CACHE_NAME = 'pwa-cache-v1';
const URLS_TO_CACHE = [
  './',
  'index.html',
  'manifest.json',
  'service-worker.js',
  'https://cdn.tailwindcss.com'
];

// Instalación: guardar en caché los recursos iniciales
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Archivos cacheados');
      return cache.addAll(URLS_TO_CACHE);
    })
  );
});

// Activación: limpiar cachés viejas
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames =>
      Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      )
    )
  );
});

// Interceptar peticiones y responder desde caché
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      // Si está en caché, responde, si no, busca en la red
      return response || fetch(event.request);
    })
  );
});
