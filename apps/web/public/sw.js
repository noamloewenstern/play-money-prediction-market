/**
 * Play Money — Service Worker
 *
 * Strategies:
 *  - Static assets (/_next/static/, /icons/, /images/): Cache-first
 *  - Navigation requests (HTML pages): Network-first, fallback to /offline.html
 *  - API requests (/api/): Network-only (never cache)
 */

const CACHE_VERSION = 'v1'
const STATIC_CACHE = `pm-static-${CACHE_VERSION}`
const PAGES_CACHE = `pm-pages-${CACHE_VERSION}`

const STATIC_PATTERNS = [/\/_next\/static\//, /\/icons\//, /\/images\//]

const PRECACHE_URLS = ['/offline.html', '/manifest.json']

// ── Install ──────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  )
})

// ── Activate ─────────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  const currentCaches = [STATIC_CACHE, PAGES_CACHE]
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames.filter((name) => !currentCaches.includes(name)).map((name) => caches.delete(name)),
        ),
      )
      .then(() => self.clients.claim()),
  )
})

// ── Fetch ─────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Only handle same-origin requests
  if (url.origin !== self.location.origin) return

  // Never cache API routes
  if (url.pathname.startsWith('/api/')) return

  // Static assets: cache-first
  if (STATIC_PATTERNS.some((pattern) => pattern.test(url.pathname))) {
    event.respondWith(cacheFirst(request, STATIC_CACHE))
    return
  }

  // Navigation requests: network-first with offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstWithOfflineFallback(request))
    return
  }
})

// ── Strategies ────────────────────────────────────────────────────────────────

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request)
  if (cached) return cached

  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(cacheName)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    return new Response('Resource unavailable offline', { status: 503 })
  }
}

// ── Push Notifications ────────────────────────────────────────────────────────

self.addEventListener('push', (event) => {
  if (!event.data) return

  let data = {}
  try {
    data = event.data.json()
  } catch {
    data = { title: 'Play Money', body: event.data.text() }
  }

  const { title = 'Play Money', body = '', url = '/', icon = '/icons/icon-192.png' } = data

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon,
      badge: '/icons/icon-192.png',
      data: { url },
      requireInteraction: false,
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const url = event.notification.data?.url || '/'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) {
          return client.focus()
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url)
      }
    }),
  )
})

async function networkFirstWithOfflineFallback(request) {
  try {
    const response = await fetch(request)

    // Cache successful navigation responses for offline use
    if (response.ok && response.status === 200) {
      const cache = await caches.open(PAGES_CACHE)
      cache.put(request, response.clone())
    }

    return response
  } catch {
    // Network failed — try cache
    const cached = await caches.match(request)
    if (cached) return cached

    // Final fallback: offline page
    const offlinePage = await caches.match('/offline.html')
    if (offlinePage) return offlinePage

    return new Response('You are offline', {
      status: 503,
      headers: { 'Content-Type': 'text/plain' },
    })
  }
}
