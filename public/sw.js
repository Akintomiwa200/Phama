// PharmaConnect Service Worker v1.1
const CACHE_VERSION = 'pharmaconnect-v2';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const API_CACHE = `${CACHE_VERSION}-api`;

const STATIC_ASSETS = [
  '/consumer/home',
  '/consumer/body-map',
  '/consumer/scanner',
  '/auth/login',
  '/manifest.json',
];

const CACHED_API_ROUTES = [
  '/api/drugs',
  '/api/inventory',
];

// ─────────────────────────────────────────────
// Install — cache static assets
// ─────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// ─────────────────────────────────────────────
// Activate — clean old caches
// ─────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k.startsWith('pharmaconnect-') && k !== STATIC_CACHE && k !== API_CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// ─────────────────────────────────────────────
// Fetch — network-first for API, cache-first for static
// ─────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and cross-origin
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  // API routes: network-first with cache fallback
  if (url.pathname.startsWith('/api/')) {
    const shouldCache = CACHED_API_ROUTES.some(r => url.pathname.startsWith(r));
    if (shouldCache) {
      event.respondWith(networkFirstWithCache(request, API_CACHE, 300));
    }
    return;
  }

  // HTML/document navigations: network-first so new homepage deploys immediately
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(networkFirstDocument(request, STATIC_CACHE));
    return;
  }

  // Static assets: cache-first with network fallback
  event.respondWith(cacheFirstWithNetwork(request, STATIC_CACHE));
});

async function networkFirstDocument(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    return new Response('<h1>PharmaConnect — Offline</h1><p>Please reconnect to continue.</p>', {
      headers: { 'Content-Type': 'text/html' },
    });
  }
}

async function networkFirstWithCache(request, cacheName, ttlSeconds) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cloned = response.clone();
      // Add TTL header and cache
      const headers = new Headers(cloned.headers);
      headers.set('sw-cached-at', Date.now().toString());
      headers.set('sw-ttl', ttlSeconds.toString());
      const cachedResponse = new Response(await cloned.blob(), { status: cloned.status, headers });
      cache.put(request, cachedResponse);
    }
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) {
      const cachedAt = parseInt(cached.headers.get('sw-cached-at') || '0');
      const ttl = parseInt(cached.headers.get('sw-ttl') || '0');
      if (Date.now() - cachedAt < ttl * 1000) return cached;
    }
    return new Response(JSON.stringify({ success: false, error: 'Offline — no cached data', offline: true }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

async function cacheFirstWithNetwork(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('<h1>PharmaConnect — Offline</h1><p>Please reconnect to continue.</p>', {
      headers: { 'Content-Type': 'text/html' },
    });
  }
}

// ─────────────────────────────────────────────
// Background Sync — replay queued mutations
// ─────────────────────────────────────────────
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-offline-actions') {
    event.waitUntil(replayOfflineActions());
  }
});

async function replayOfflineActions() {
  try {
    const db = await openIndexedDB();
    const actions = await getAllFromStore(db, 'offline-queue');
    for (const action of actions) {
      try {
        const res = await fetch(action.url, {
          method: action.method,
          headers: { 'Content-Type': 'application/json' },
          body: action.body,
        });
        if (res.ok) {
          await deleteFromStore(db, 'offline-queue', action.id);
          console.log(`[SW Sync] Replayed action: ${action.description}`);
        }
      } catch { /* keep for next sync */ }
    }
  } catch (e) { console.error('[SW Sync] Error:', e); }
}

// ─────────────────────────────────────────────
// Push Notifications
// ─────────────────────────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return;
  const data = event.data.json();
  const { title, body, icon, badge, url, type } = data;

  const options = {
    body: body || '',
    icon: icon || '/icons/icon-192x192.png',
    badge: badge || '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: { url: url || '/', type },
    actions: getNotificationActions(type),
    requireInteraction: type === 'order' || type === 'prescription',
    tag: type || 'general',
    renotify: true,
  };

  event.waitUntil(self.registration.showNotification(title || 'PharmaConnect', options));
});

function getNotificationActions(type) {
  switch (type) {
    case 'order': return [{ action: 'track', title: '📦 Track Order' }, { action: 'dismiss', title: 'Dismiss' }];
    case 'prescription': return [{ action: 'view', title: '💊 View Rx' }, { action: 'dismiss', title: 'Dismiss' }];
    case 'low_stock': return [{ action: 'reorder', title: '🔄 Reorder Now' }, { action: 'dismiss', title: 'Dismiss' }];
    default: return [{ action: 'open', title: 'Open App' }];
  }
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(clientList => {
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});

// ─────────────────────────────────────────────
// IndexedDB helpers
// ─────────────────────────────────────────────
function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('pharmaconnect-cache', 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains('offline-queue')) {
        req.result.createObjectStore('offline-queue', { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function getAllFromStore(db, storeName) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const req = tx.objectStore(storeName).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

function deleteFromStore(db, storeName, key) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const req = tx.objectStore(storeName).delete(key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}
