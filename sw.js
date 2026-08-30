/**
 * ============================================================================
 * PROYECTO: Encuentro Mundial Pa-Kua 2026 (50.º Aniversario) - San Pedro, Arg.
 * MÓDULO:   Service Worker (sw.js) - PWA y Modo Offline Completo
 * AUTOR:    Alfredo (Escuela Pakua Lincoln) & VAE AI Consulting
 * ============================================================================
 */

const CACHE_NAME = 'pakua-frases-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './portugues.html',
  './ingles.html',
  './aleman.html',
  './js/app.js',
  './stats.js',
  './data/phrases_pt.json',
  './data/phrases_en.json',
  './data/phrases_de.json',
  './data/phrases_pt.js',
  './data/phrases_en.js',
  './data/phrases_de.js',
  './Logo Pakua.png',
  './logo 50 aniversario Pakua.jpeg',
  './manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        fetch(event.request).then(networkResponse => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, networkResponse));
          }
        }).catch(() => {});
        return cachedResponse;
      }
      return fetch(event.request).then(networkResponse => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache);
        });
        return networkResponse;
      });
    }).catch(() => {
      if (event.request.headers.get('accept') && event.request.headers.get('accept').includes('text/html')) {
        return caches.match('./index.html');
      }
    })
  );
});
