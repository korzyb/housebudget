// Service worker: app-shell cache. Bumpnij wersję przy każdym deploy.

const VERSION = 'v1';
const SHELL_CACHE = `hb-shell-${VERSION}`;

const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon.svg',
  './styles/tokens.css',
  './styles/base.css',
  './styles/components.css',
  './styles/views.css',
  './src/main.js',
  './src/router.js',
  './src/store.js',
  './src/dom.js',
  './src/format.js',
  './src/icons.js',
  './src/categories.js',
  './src/supabase.js',
  './src/gemini.js',
  './src/views/login.js',
  './src/views/register.js',
  './src/views/dashboard.js',
  './src/views/receipts.js',
  './src/views/receipt-detail.js',
  './src/views/calendar.js',
  './src/views/settings.js',
  './src/views/camera.js',
  './src/components/bottom-nav.js',
  './src/components/add-sheet.js',
  './src/components/budget-ring.js',
  './src/components/bar-chart.js',
  './src/components/calendar-grid.js',
  './src/components/category-chip.js',
  './src/components/receipt-row.js',
  './src/components/stat-card.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL_CACHE);
    // Cachuj po jednym — jeden 404 nie wywali instalacji
    await Promise.allSettled(SHELL.map(url => cache.add(url)));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== SHELL_CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  // Pomijamy zewnętrzne API i fonts CDN — niech idą normalnie
  if (url.origin !== self.location.origin) return;

  event.respondWith((async () => {
    const cache = await caches.open(SHELL_CACHE);
    const cached = await cache.match(req);
    if (cached) {
      // Stale-while-revalidate
      fetch(req).then(res => { if (res.ok) cache.put(req, res.clone()); }).catch(() => {});
      return cached;
    }
    try {
      const res = await fetch(req);
      if (res.ok) cache.put(req, res.clone());
      return res;
    } catch {
      // Offline fallback dla nawigacji
      if (req.mode === 'navigate') {
        const fallback = await cache.match('./index.html');
        if (fallback) return fallback;
      }
      return new Response('Offline', { status: 503 });
    }
  })());
});
