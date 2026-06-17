// Plugin de Vite que genera un Service Worker con precache + manifest.webmanifest
import { writeFileSync } from 'fs';
import { globSync } from 'glob';

const __SW_TEMPLATE = `
const CACHE_NAME = 'colon-v@{TIMESTAMP}';
const PRE_CACHE = {PRECACHE_MANIFEST};

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
`.trimStart();

const MANIFEST = {
    name: 'La Era de los Descubrimientos',
    short_name: 'Era Descubrimientos',
    description: 'Simulador educativo del viaje de Cristóbal Colón (1492)',
    start_url: './index.html',
    scope: './',
    display: 'standalone',
    orientation: 'portrait',
    theme_color: '#1a3d5f',
    background_color: '#0d1f2e',
    categories: ['education', 'history', 'game'],
    lang: 'es-AR',
    icons: [
        { src: './img/icon-192.svg', sizes: '192x192', type: 'image/svg+xml', purpose: 'any' },
        { src: './img/icon-512.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'any maskable' },
    ],
};

let _outDir = 'dist';

export default function generateSWPlugin() {
    return {
        name: 'generate-sw',
        enforce: 'post',
        configResolved(config) {
            _outDir = config.build.outDir || 'dist';
        },
        closeBundle() {
            const assets = globSync('**/*.{js,css,html,jpg,webp,png,svg,ico,json}', { cwd: _outDir });
            const precacheList = assets.map(f => './' + f.replace(/\\/g, '/'));
            const timestamp = Date.now();
            const swContent = __SW_TEMPLATE
                .replace(/\{TIMESTAMP\}/g, String(timestamp))
                .replace(/\{PRECACHE_MANIFEST\}/g, JSON.stringify(precacheList, null, 2));
            writeFileSync(_outDir + '/sw.js', swContent, 'utf-8');
            // Generar manifest.webmanifest
            writeFileSync(_outDir + '/manifest.webmanifest', JSON.stringify(MANIFEST, null, 2), 'utf-8');
            console.log('[generate-sw] SW generado con ' + precacheList.length + ' assets precacheados.');
            console.log('[generate-sw] manifest.webmanifest generado con iconos SVG.');
        },
    };
}
