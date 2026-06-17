const CACHE_NAME = 'colon-v@1781738061385';
const PRE_CACHE = [
  "./index.html",
  "./img/icon-512.svg",
  "./img/icon-192.svg",
  "./assets/tripulantes-DRN_4sOz.jpg",
  "./assets/start-screen-bg-DzTOrHyB.jpg",
  "./assets/index-C6kHC3Fg.js",
  "./assets/index-C1QREvOw.css",
  "./assets/d3-C3JoYz7k.js",
  "./assets/cristobal_colon-CH7JhTIn.jpg"
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      Promise.allSettled(PRE_CACHE.map(url => cache.add(url).catch(() => {})))
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  if (event.request.mode === 'navigate') {
    event.respondWith(networkFirst(event.request));
    return;
  }
  event.respondWith(cacheFirst(event.request));
});

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response && (response.status === 200 || response.status === 0)) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone()).catch(() => {});
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || new Response(
      '<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Sin conexión</title><style>body{font-family:serif;background:#f5e6c8;color:#3d1f08;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:20px;text-align:center}h1{font-size:2rem;margin-bottom:10px}p{font-size:1.1rem;color:#6b3a10}.offline-icon{font-size:4rem;margin-bottom:16px}</style></head><body><div><div class="offline-icon">⚓</div><h1>Sin conexión</h1><p>Necesitás internet para la primera carga.<br>Una vez cargada, la app funciona offline.</p></div></body></html>',
      { status: 408, headers: { 'Content-Type': 'text/html;charset=UTF-8' } }
    );
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response && (response.status === 200 || response.type === 'opaque')) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone()).catch(() => {});
    }
    return response;
  } catch {
    return new Response('', { status: 408 });
  }
}
