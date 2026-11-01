"use client"

// Los recordatorios del juego en la web: la lógica vive en
// `@intervalo/dx-core/juego/UseAvisosDelJuego` (compartida con la app nativa) y
// acá queda lo que es del navegador —la suscripción VAPID, la zona horaria de
// Intl, PostHog y `puedeOfrecerNotificaciones`—.
//
// Lo que SÍ se reusa de Intervalo es la parte que no depende de quién sos:
// `subscribeToPush` (permiso + `pushManager.subscribe` + VAPID), `getTimezone` y
// la lista de horarios. Reescribir eso sería tener dos formas de pedir el mismo
// permiso, y una envejecería.

import posthog from "posthog-js"

import { unwrap } from "@/lib/api/client"
import { getTimezone, isPushSupported, subscribeToPush } from "@/lib/push/register"
import { isStandalone } from "@/lib/platform/detect"

import { useGameApi } from "@intervalo/dx-core/juego/game-api-context"
import {
  useAvisosDelJuego as useAvisosDelJuegoCore,
  useCambiarHora as useCambiarHoraCore,
  usePrenderAvisos as usePrenderAvisosCore,
} from "@intervalo/dx-core/juego/UseAvisosDelJuego"

export { DEFAULT_REMINDER_TIME, REMINDER_TIME_OPTIONS } from "@intervalo/dx-core/juego/horarios-de-aviso"
export type { AvisosDelJuego } from "@intervalo/dx-core/juego/UseAvisosDelJuego"

/** ¿Tiene sentido ofrecer los recordatorios en este aparato?
 *
 * Solo dentro de la app instalada, y las dos razones importan:
 *
 *   · en iOS el push web NO EXISTE fuera de la pantalla de inicio, así que el
 *     pedido no tendría nada que ofrecer justo en la mitad del tráfico;
 *   · en Android sí funciona en el navegador, pero el permiso se quema para
 *     siempre si dicen que no, y quemarlo en una pestaña que la persona abrió
 *     hace tres minutos desde WhatsApp es tirar el único canal de retención que
 *     tiene el juego.
 *
 * No es un hook porque lo llama el ladder, que corre dentro de un callback. */
export function puedeOfrecerNotificaciones(): boolean {
  if (typeof window === "undefined") return false
  if (!isStandalone() || !isPushSupported()) return false
  // Ya lo decidió: ni insistir ni volver a preguntar. `denied` es definitivo del
  // lado del navegador —no se puede volver a pedir— y `granted` significa que ya
  // está, así que el pedido solo tiene sentido en `default`.
  return Notification.permission === "default"
}

export function useAvisosDelJuego(activo: boolean) {
  return useAvisosDelJuegoCore({ activo })
}

export function usePrenderAvisos({ onSuccess }: { onSuccess?: () => void } = {}) {
  const api = useGameApi()
  return usePrenderAvisosCore({
    suscribir: async () => {
      const sub = await subscribeToPush()
      unwrap(await api.POST("/game/derivemos/push/subscribe", { body: sub }))
    },
    zonaHoraria: getTimezone,
    onSuccess: () => {
      posthog.capture("game_notify_enabled")
      onSuccess?.()
    },
    onError: (error) => {
      posthog.capture("game_notify_enable_failed", { error: String(error) })
    },
  })
}

export function useCambiarHora() {
  return useCambiarHoraCore({ zonaHoraria: getTimezone })
}
