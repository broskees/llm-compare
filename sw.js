const CACHE = 'llm-compare-v1';
const SHELL = [
  '/llm-compare/',
  '/llm-compare/index.html',
  '/llm-compare/manifest.json',
  '/llm-compare/icon.svg',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Network-first for API calls and data files — always want fresh data
  if (url.hostname === 'api.zeroeval.com' || url.pathname.includes('/data/')) {
    e.respondWith(fetch(e.request));
    return;
  }

  // Cache-first for the app shell
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
