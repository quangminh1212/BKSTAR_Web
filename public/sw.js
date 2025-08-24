const CACHE_NAME = 'bkstar-cache-v3';
const ASSETS = [
  'index.html',
  'snapshot/index-snapshot.html',
  'data.json',
  'images/logo.jpg',
  'images/slide1.webp',
  'images/slide2.webp',
  'images/slide3.webp',
  'images/slide4.webp',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : null))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  // Network-first with timeout for WordPress API requests
  if (request.url.includes('/wp-json/wp/v2/')) {
    event.respondWith(
      (async () => {
        const withTimeout = (promise, ms) => {
          let t;
          const timeout = new Promise((_, reject) => {
            t = setTimeout(() => reject(new Error('timeout')), ms);
          });
          return Promise.race([promise, timeout]).finally(() => clearTimeout(t));
        };
        try {
          const networkResponse = await withTimeout(fetch(request), 6000);
          const clone = networkResponse.clone();
          const cache = await caches.open(CACHE_NAME);
          cache.put(request, clone);
          return networkResponse;
        } catch {
          const cached = await caches.match(request);
          if (cached) return cached;
          // Fallback: generic offline JSON if available
          const fallback = await caches.match('data.json');
          if (fallback) return fallback;
          return new Response(JSON.stringify({ error: 'offline' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      })()
    );
    return;
  }

  // Cache-first for images (good for performance)
  if (request.destination === 'image') {
    event.respondWith(
      caches.match(request).then((cached) => {
        const networkFetch = fetch(request)
          .then((response) => {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            return response;
          })
          .catch(() => cached);
        return cached || networkFetch;
      })
    );
    return;
  }

  // Stale-while-revalidate for other GET requests
  event.respondWith(
    caches.match(request).then((cached) => {
      const fetchPromise = fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => cached);
      // TTL policy for data.json: prefer fresh if older than 10 minutes
      if (request.url.endsWith('/data.json') && cached) {
        const dateHeader = cached.headers.get('date');
        const ageMs = dateHeader ? Date.now() - new Date(dateHeader).getTime() : 0;
        if (ageMs > 10 * 60 * 1000) {
          return fetchPromise;
        }
      }
      return cached || fetchPromise;
    })
  );
});
