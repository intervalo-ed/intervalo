// Push service worker for Intervalo daily reminders.
// The backend decides the copy (varied by category, see backend/notification_copy.py) and
// sends it already rendered: an encrypted payload { title, body }. This worker just shows it.

// Sin esto, una versión nueva del SW queda "esperando" hasta que el usuario
// cierre todas las pestañas/instancias de la PWA controladas por la vieja —
// en el peor caso, un push de días después de un deploy todavía se renderiza
// con el código viejo (nos pasó: pushes con payload {title, body} nuevo
// mostrados con el fallback del SW anterior, que esperaba {count}).
self.addEventListener("install", function (event) {
  self.skipWaiting()
})

self.addEventListener("activate", function (event) {
  event.waitUntil(self.clients.claim())
})

self.addEventListener("push", function (event) {
  let title = "Intervalo"
  let body = "Tenés repasos pendientes hoy 📚"
  try {
    if (event.data) {
      const data = event.data.json()
      if (data.title) title = data.title
      if (data.body) body = data.body
    }
  } catch (_) {}

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      data: { url: "/" },
    }),
  )
})

self.addEventListener("notificationclick", function (event) {
  event.notification.close()
  const url = event.notification.data?.url || "/"
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ("focus" in client) {
            client.navigate(url)
            return client.focus()
          }
        }
        return self.clients.openWindow(url)
      }),
  )
})
