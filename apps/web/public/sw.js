/*
 * Aura's service worker. It exists so Chrome offers to install Aura as an app:
 * the install prompt needs a worker that really handles fetches.
 *
 * It only steps in for page navigations, and only to show a small offline page
 * when the network is gone. Nothing else is cached, so the app, its data and
 * the sign-in flow behave exactly as they do without it.
 */

const CACHE = 'aura-offline-v1';
const OFFLINE_URL = '/offline.html';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.add(new Request(OFFLINE_URL, { cache: 'reload' })))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(names.filter((name) => name.startsWith('aura-') && name !== CACHE).map((name) => caches.delete(name)));
      // Start the page request while the worker boots, so pages are not slower for having one.
      if (self.registration.navigationPreload) await self.registration.navigationPreload.enable();
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || request.mode !== 'navigate') return;

  event.respondWith(
    (async () => {
      try {
        const preloaded = await event.preloadResponse;
        if (preloaded) return preloaded;
        return await fetch(request);
      } catch {
        const offline = await caches.match(OFFLINE_URL);
        return offline ?? Response.error();
      }
    })(),
  );
});
