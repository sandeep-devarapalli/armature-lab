/* armature PWA service worker.
   Static shell: stale-while-revalidate.
   Anything live (booking, availability, registration, APIs): network-first, never served stale. */
const VERSION = 'armature-v14';
const PRECACHE = ['./'];
const LIVE = [/\/api\//, /book/i, /availability/i, /register/i, /luma/i, /razorpay/i, /calendar/i];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return; // bookings, form posts: straight to network

  const url = new URL(req.url);
  const isLive = LIVE.some(p => p.test(url.pathname) || p.test(url.hostname));

  if (isLive) {
    // live data: network first, tiny cache fallback only if offline
    e.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(VERSION).then(c => c.put(req, copy));
        return res;
      }).catch(() => caches.match(req))
    );
    return;
  }

  // shell + assets (incl. fonts, cdnjs): stale-while-revalidate
  e.respondWith(
    caches.match(req).then(cached => {
      const fresh = fetch(req).then(res => {
        if (res && (res.status === 200 || res.type === 'opaque')) {
          const copy = res.clone();
          caches.open(VERSION).then(c => c.put(req, copy));
        }
        return res;
      }).catch(() => cached);
      return cached || fresh;
    })
  );
});
