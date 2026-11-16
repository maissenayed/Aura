/*
 * Aura's service worker: keeps the app on the phone so it opens and works with
 * no signal. Progress itself is already offline-first (protocolStore saves every
 * tick on the device and syncs it later); this worker makes sure the screens
 * and the code that draws them are there too.
 *
 * - Screens: network first, so online you always get the latest. With no signal,
 *   or a signal too weak to answer within a few seconds, the copy stored on the
 *   phone opens instead.
 * - Build files (`/_next/static`, icons): stored once, read from the phone.
 * - The API, Next's page data and anything else: straight to the network, as
 *   without a worker.
 *
 * Installing stores every main screen with the files it loads. The app also
 * names the boss pages of the player's plan, so those are stored as well.
 * Each deploy registers this file under a new `?v=`, which reinstalls it and
 * clears the previous deploy's copies.
 */

const VERSION = new URL(self.location.href).searchParams.get('v') || 'dev';
const PAGES_CACHE = `aura-pages-${VERSION}`;
const FILES_CACHE = `aura-files-${VERSION}`;
const OFFLINE_URL = '/offline.html';

/** The screens stored at install: the bottom bar, the sidebar's extras and the home-screen shortcuts. */
const PAGES = ['/camp', '/', '/quest', '/bosses', '/hero', '/map', '/forge', '/anatomy'];
const EXTRA_FILES = ['/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png'];

/** How long a screen may take from the network before the stored copy opens instead. */
const PAGE_TIMEOUT_MS = 3500;
/** Most extra screens the app may ask to keep at once. */
const MAX_EXTRA_PAGES = 60;

/** Same-origin files a page loads that never change under the same URL. */
const FILE_PATTERN = /\/(?:_next\/static\/[^"'\\\s<>()?]+|icons\/[\w.-]+|(?:apple-)?icon\.png)(?:\?[^"'\\\s<>()]*)?/g;

const isFile = (url) =>
  url.pathname.startsWith('/_next/static/') ||
  url.pathname.startsWith('/icons/') ||
  url.pathname === '/icon.png' ||
  url.pathname === '/apple-icon.png' ||
  url.pathname === '/manifest.webmanifest';

/** A screen worth storing: a plain 200 page from this site, not an API answer or a redirect. */
const isStorablePage = (response, url) =>
  response.status === 200 && response.type === 'basic' && !response.redirected && !url.pathname.startsWith('/api/');

/** Screens are stored by path alone: their HTML does not depend on the query. */
const pageKey = (url) => url.origin + url.pathname;

/* ------------------------------------------------------------------ */
/* Install and update                                                  */
/* ------------------------------------------------------------------ */

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const pages = await caches.open(PAGES_CACHE);
      await pages.add(new Request(OFFLINE_URL, { cache: 'reload' }));
      // Best effort: a screen that fails to store now is stored the next time it opens online.
      await storePages(PAGES, EXTRA_FILES);
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keep = new Set([PAGES_CACHE, FILES_CACHE]);
      const names = await caches.keys();
      await Promise.all(names.filter((name) => name.startsWith('aura-') && !keep.has(name)).map((name) => caches.delete(name)));
      // Start the page request while the worker boots, so pages are not slower for having one.
      if (self.registration.navigationPreload) await self.registration.navigationPreload.enable();
      await self.clients.claim();
    })(),
  );
});

/** The app names more screens to keep, e.g. the boss pages of the player's plan. */
self.addEventListener('message', (event) => {
  const data = event.data;
  if (!data || data.type !== 'aura:keep-pages' || !Array.isArray(data.paths)) return;
  const paths = data.paths
    .filter((path) => typeof path === 'string' && path.startsWith('/') && !path.startsWith('//') && !path.startsWith('/api/'))
    .slice(0, MAX_EXTRA_PAGES);
  event.waitUntil(storeMissingPages(paths));
});

/** Fetches screens and every build file their HTML names, and stores them. */
async function storePages(paths, extraFiles = []) {
  const pages = await caches.open(PAGES_CACHE);
  const files = new Set(extraFiles);

  await Promise.allSettled(
    paths.map(async (path) => {
      const url = new URL(path, self.location.origin);
      const response = await fetch(url, { cache: 'reload' });
      if (!isStorablePage(response, url)) return;
      const html = await response.clone().text();
      await pages.put(pageKey(url), response);
      for (const match of html.matchAll(FILE_PATTERN)) files.add(match[0]);
    }),
  );

  const store = await caches.open(FILES_CACHE);
  await Promise.allSettled(
    [...files].map(async (path) => {
      if (await store.match(path)) return;
      // Most build files carry over between deploys under the same name: reuse the stored copy.
      const response = (await caches.match(path)) || (await fetch(path));
      if (response.ok) await store.put(path, response);
    }),
  );
}

async function storeMissingPages(paths) {
  const pages = await caches.open(PAGES_CACHE);
  const missing = [];
  for (const path of paths) {
    if (!(await pages.match(pageKey(new URL(path, self.location.origin)), { ignoreVary: true }))) missing.push(path);
  }
  if (missing.length) await storePages(missing);
}

/* ------------------------------------------------------------------ */
/* Requests                                                            */
/* ------------------------------------------------------------------ */

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') return openPage(event, url);
  if (isFile(url)) event.respondWith(fromFiles(event, request));
  // Page data for client-side navigation (RSC), the API and everything else: network only.
});

/** A screen: the network's copy when it answers in time, otherwise the stored one. */
function openPage(event, url) {
  const key = pageKey(url);
  let stored = Promise.resolve();

  const network = Promise.resolve(event.preloadResponse)
    .then((preloaded) => preloaded || fetch(event.request))
    .then((response) => {
      if (isStorablePage(response, url)) {
        const copy = response.clone();
        stored = caches.open(PAGES_CACHE).then((pages) => pages.put(key, copy));
      }
      return response;
    });

  // Keep the worker alive until a fresh copy is stored, even if the stored one already answered.
  event.waitUntil(network.then(() => stored).catch(() => undefined));
  event.respondWith(answerPage(network, key));
}

async function answerPage(network, key) {
  const pages = await caches.open(PAGES_CACHE);
  const cached = await pages.match(key, { ignoreVary: true });
  try {
    if (!cached) return await network;
    return await Promise.race([
      network,
      new Promise((_, reject) => setTimeout(() => reject(new Error('slow network')), PAGE_TIMEOUT_MS)),
    ]);
  } catch {
    return cached || (await pages.match(OFFLINE_URL)) || Response.error();
  }
}

/** A build file or icon: from the phone when stored, otherwise fetched and stored. */
async function fromFiles(event, request) {
  const cached = await caches.match(request, { ignoreVary: true });
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok && response.type === 'basic') {
    const copy = response.clone();
    event.waitUntil(caches.open(FILES_CACHE).then((files) => files.put(request, copy)));
  }
  return response;
}
