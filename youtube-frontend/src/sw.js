import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching'

// Precache all assets injected by Vite PWA (JS, CSS, HTML shell)
precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()

// ── FETCH HANDLER ──────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const url = event.request.url

  // ✅ Never intercept Cloudinary — browser handles video streaming natively
  if (url.includes('cloudinary.com')) return

  // ✅ Never cache API calls — always needs live internet
  if (url.includes('/api/')) return

  // ✅ App shell (HTML, JS, CSS, icons) — serve from cache when offline
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached
      return fetch(event.request).catch(() => {
        // If offline and no cache — return cached index.html so app shell loads
        if (event.request.destination === 'document') {
          return caches.match('/index.html')
        }
      })
    })
  )
})

// ── PUSH NOTIFICATION HANDLER ──────────────────────────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return

  const data = event.data.json()

  const options = {
    body: data.body,
    icon: data.icon || '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    data: { url: data.url || '/' },
    vibrate: [200, 100, 200],
    actions: [
      { action: 'open',    title: 'Open' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  }

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  )
})

// ── NOTIFICATION CLICK HANDLER ─────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action === 'dismiss') return

  const urlToOpen = event.notification.data?.url || '/'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          client.focus()
          client.navigate(urlToOpen)
          return
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen)
      }
    })
  )
})