// Cómo se muestra un aviso con la app abierta, y el tap como «apertura»: el
// mismo beacon que `notificationclick` en web/public/sw.js, que marca el envío
// como abierto en `game_notification_sends`.

import { useEffect } from "react"
import * as Notifications from "expo-notifications"
import { env } from "@/lib/env"
import { tokenDeAvisosGuardado } from "./registro-push"

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
})

// El tap del arranque en frío llega por `getLastNotificationResponse()` y
// puede volver a llegar por el listener: se reporta una vez por aviso.
const reportados = new Set<string>()

function reportarTap(respuesta: Notifications.NotificationResponse) {
  if (respuesta.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return
  const { identifier, content } = respuesta.notification.request
  if (reportados.has(identifier)) return
  reportados.add(identifier)
  const id = content.data?.id
  if (id == null || !env.apiUrl) return
  const qs = new URLSearchParams({
    event: "click",
    notification_id: String(id),
    // La app solo recibe avisos del juego; sin `app`, el backend marcaría la
    // tabla de Intervalo.
    app: typeof content.data?.app === "string" ? content.data.app : "dx",
    endpoint: tokenDeAvisosGuardado() ?? "",
  }).toString()
  void fetch(`${env.apiUrl}/push/diagnostic?${qs}`).catch(() => {})
}

export function useTapDeAviso() {
  useEffect(() => {
    const ultima = Notifications.getLastNotificationResponse()
    if (ultima) reportarTap(ultima)
    const sub = Notifications.addNotificationResponseReceivedListener(reportarTap)
    return () => sub.remove()
  }, [])
}
