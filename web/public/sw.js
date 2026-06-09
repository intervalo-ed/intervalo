// Push service worker for Intervalo daily reminders.
// The worker sends an encrypted payload { count } — render a localized message.

self.addEventListener("push", function (event) {
  let count = 0
  try {
    if (event.data) count = event.data.json().count ?? 0
  } catch (_) {}

  const body =
    count === 1
      ? "Tenés 1 tema pendiente para repasar hoy 📚"
      : count > 1
        ? `Tenés ${count} temas pendientes para repasar hoy 📚`
        : "Tenés repasos pendientes hoy 📚"

  event.waitUntil(
    self.registration.showNotification("Intervalo", {
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
