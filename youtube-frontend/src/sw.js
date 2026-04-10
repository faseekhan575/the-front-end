import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching'

// Precache all assets injected by Vite PWA
precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()

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
      // If app already open — focus it and navigate
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          client.focus()
          client.navigate(urlToOpen)
          return
        }
      }
      // Otherwise open new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen)
      }
    })
  )
})