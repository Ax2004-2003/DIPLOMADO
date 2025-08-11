// service-worker.js
const CACHE_NAME = 'ai-risk-site-v1';
const ASSETS_TO_CACHE = [
  '/',                // si tu archivo principal se sirve como index.html
  '/dark.html',       // tu página HTML (ajusta si la nombras distinto)
  '/manifest.json',
  '/service-worker.js',
  // iconos (ponlos en /icons/)
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

// Install: precache assets
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS_TO_CACHE))
      .catch((err) => console.warn('Precaching falló:', err))
  );
});

// Activate: limpiar caches antiguos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch: estrategia híbrida
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Para navegación (HTML) usamos network-first con fallback a cache
  if (req.mode === 'navigate' || (req.method === 'GET' && req.headers.get('accept')?.includes('text/html'))) {
    event.respondWith(
      fetch(req)
        .then((networkResp) => {
          // actualizar cache con la última versión de la página
          caches.open(CACHE_NAME).then((cache) => cache.put(req, networkResp.clone()));
          return networkResp;
        })
        .catch(() => caches.match(req).then((cached) => cached || caches.match('/dark.html') || new Response(
          `<html><body><h1>Sin conexión</h1><p>Parece que estás sin conexión y la página no está cacheada.</p></body></html>`,
          { headers: { 'Content-Type': 'text/html' } }
        )))
    );
    return;
  }

  // Para requests estáticos (CSS/JS/imagenes): cache-first, conexion fallback
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((networkResp) => {
          // opcional: cachear respuestas ok (status 200) para futuras visitas
          if (networkResp && networkResp.status === 200 && req.method === 'GET') {
            caches.open(CACHE_NAME).then((cache) => {
              // evita cachear respuestas cross-origin innecesarias (opcional)
              try { cache.put(req, networkResp.clone()); } catch (e) { /* ioe */ }
            });
          }
          return networkResp.clone ? networkResp : networkResp;
        })
        .catch(() => {
          // fallback para imágenes -> puedes poner '/icons/fallback.png' si quieres
          if (req.destination === 'image') {
            return new Response('', { status: 404, statusText: 'Imagen no disponible' });
          }
          return new Response('Recurso no disponible', { status: 503 });
        });
    })
  );
});

// Opción: escucha mensajes desde la página para activar actualización inmediata
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
