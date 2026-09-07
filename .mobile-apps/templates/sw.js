'use strict';
const REVISION = __REVISION__;
const ASSETS = __ASSETS__;
const PREFIX = `mobile-app:${self.registration.scope}:`;
const CACHE = PREFIX + REVISION;
const urls = new Map(Object.entries(ASSETS).map(([path, hash]) => [new URL(path, self.registration.scope).href, hash]));
const digest = async bytes => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), x => x.toString(16).padStart(2, '0')).join('');
self.addEventListener('install', event => event.waitUntil((async () => {
  const cache = await caches.open(CACHE);
  try {
    // Complete and verify a whole release before the worker can activate.
    for (const [url, hash] of urls) {
      const request = new URL(url); request.searchParams.set('v', hash);
      const response = await fetch(request, { cache: 'reload', credentials: 'same-origin' });
      if (!response.ok || response.redirected || await digest(await response.clone().arrayBuffer()) !== hash) throw new Error(`Incomplete release: ${url}`);
      await cache.put(url, response);
    }
  } catch (error) { await caches.delete(CACHE); throw error; }
})()));
self.addEventListener('activate', event => event.waitUntil((async () => {
  // Each app owns only its scope's caches; browser data is never cleared.
  for (const key of await caches.keys()) if (key.startsWith(PREFIX) && key !== CACHE) await caches.delete(key);
  await self.clients.claim();
})()));
self.addEventListener('message', event => {
  if (event.data?.type === 'ACTIVATE') event.waitUntil(self.skipWaiting());
  if (event.data?.type === 'STATUS') event.source?.postMessage({ type: 'STATUS', revision: REVISION });
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url); url.search = ''; url.hash = '';
  if (url.href === self.registration.scope) url.pathname += 'index.html';
  if (!urls.has(url.href)) return;
  event.respondWith((async () => (await (await caches.open(CACHE)).match(url.href)) || fetch(event.request))());
});
