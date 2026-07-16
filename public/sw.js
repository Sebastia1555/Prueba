// Service worker de Buffett Daily.
// Habilita la instalación como PWA y el uso offline. Estrategia:
//  - Navegaciones: network-first con vuelta al index cacheado (app shell).
//  - Recursos same-origin: stale-while-revalidate (rápido y auto-actualizable).

const CACHE = 'buffett-daily-v1'

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      await self.clients.claim()
    })(),
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return

  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return

  // App shell para navegaciones.
  if (req.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(req)
          const cache = await caches.open(CACHE)
          cache.put('app-shell', fresh.clone())
          return fresh
        } catch {
          const cache = await caches.open(CACHE)
          const cached = await cache.match('app-shell')
          return cached || Response.error()
        }
      })(),
    )
    return
  }

  // Recursos estáticos: sirve de caché y refresca en segundo plano.
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE)
      const cached = await cache.match(req)
      const network = fetch(req)
        .then((resp) => {
          if (resp && resp.status === 200) cache.put(req, resp.clone())
          return resp
        })
        .catch(() => cached)
      return cached || network
    })(),
  )
})
