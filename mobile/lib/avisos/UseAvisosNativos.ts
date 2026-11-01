import { getCalendars } from "expo-localization"
import { useGameApi } from "@intervalo/dx-core/juego/game-api-context"
import { usePrenderAvisos } from "@intervalo/dx-core/juego/UseAvisosDelJuego"
import { track } from "@/lib/analytics/track"
import { suscribirAvisosNativos } from "./registro-push"

function zonaHoraria(): string {
  return getCalendars()[0]?.timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone
}

// El `usePrenderAvisos` de la web (web/src/app/derivadas/UseAvisosDelJuego.ts),
// con la misma telemetría: los eventos salen de acá y no del slide.
export function usePrenderAvisosNativos({
  onSuccess,
  onError,
}: {
  onSuccess?: () => void
  onError?: (error: unknown) => void
} = {}) {
  const api = useGameApi()
  const mutacion = usePrenderAvisos({
    suscribir: () => suscribirAvisosNativos({ api }),
    zonaHoraria,
    onSuccess: () => {
      track("game_notify_enabled")
      onSuccess?.()
    },
    onError: (error) => {
      track("game_notify_enable_failed", { error: String(error) })
      onError?.(error)
    },
  })
  return {
    prender: (time: string) => mutacion.mutate(time),
    cargando: mutacion.isPending,
    fallo: mutacion.isError,
  }
}
