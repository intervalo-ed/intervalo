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

// URL del backend, pasada como query string al registrar el SW (ver
// register.ts) — un service worker no puede leer process.env.
const API_BASE = new URL(self.location.href).searchParams.get("apiBase")

// Reporta al backend cuando el payload de un push no se pudo decodear, para
// poder ver la causa real la próxima vez que llegue el fallback genérico en
// vez de tener que adivinarla (nos pasó dos veces sin ninguna pista).
// Best-effort: si el fetch falla, no bloquea la notificación igual.
function reportDecodeFailure(error, rawPreview) {
  if (!API_BASE) return Promise.resolve()
  return self.registration.pushManager
    .getSubscription()
    .then((sub) =>
      fetch(`${API_BASE}/push/diagnostic`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          error: String(error),
          endpoint: sub ? sub.endpoint : null,
          raw_preview: rawPreview,
        }),
      }),
    )
    .catch(() => {})
}

self.addEventListener("push", function (event) {
  let title = "Intervalo"
  let body = "Tenés repasos pendientes hoy 📚"
  let raw = null
  let decodeError = null

  if (event.data) {
    try {
      raw = event.data.text()
    } catch (e) {
      decodeError = `text() failed: ${e}`
    }
    if (raw != null) {
      try {
        const data = JSON.parse(raw)
        if (data.title) title = data.title
        if (data.body) body = data.body
      } catch (e) {
        decodeError = `JSON.parse failed: ${e}`
      }
    }
  } else {
    decodeError = "push event sin event.data"
  }

  if (decodeError) {
    // DEBUG TEMPORAL: el reporte a /push/diagnostic nunca llegó al backend en
    // ningún intento, así que en vez de confiar en esa red mostramos el error
    // real directo en el cuerpo de la notificación — cero dependencias de
    // red, no se puede perder en el camino. Revertir apenas tengamos la causa.
    body = `[debug] ${decodeError} | raw=${raw != null ? JSON.stringify(raw).slice(0, 120) : "null"}`
    event.waitUntil(reportDecodeFailure(decodeError, raw ? raw.slice(0, 200) : null))
  }

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
