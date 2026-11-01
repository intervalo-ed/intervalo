"use client"

// Prender los recordatorios del juego: suscripción del aparato y preferencia
// guardada.
//
// Va contra `useGameApi()` y no contra el cliente de Clerk porque tiene que
// funcionar para un INVITADO —que es entre el 50% y el 95% de cada cohorte del
// juego—.
//
// Lo que depende de la plataforma entra por parámetro: `suscribir` (en la web,
// permiso + VAPID + `POST /push/subscribe`; en la app, permiso + token de Expo +
// `POST /push/expo`) y `zonaHoraria` (en la web sale de Intl; en la app, de
// expo-localization). La telemetría también: cada lado la manda desde
// `onSuccess`/`onError`.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { unwrap } from "../api/client"
import { useGameApi } from "./game-api-context"

export { DEFAULT_REMINDER_TIME, REMINDER_TIME_OPTIONS } from "./horarios-de-aviso"

export const avisosKey = ["game", "avisos"] as const

export type AvisosDelJuego = {
  enabled: boolean
  time?: string | null
  timezone?: string | null
}

export function useAvisosDelJuego({ activo }: { activo: boolean }) {
  const api = useGameApi()
  return useQuery({
    queryKey: avisosKey,
    queryFn: async () =>
      unwrap(await api.GET("/game/derivemos/notification-settings")) as AvisosDelJuego,
    enabled: activo,
    staleTime: 60_000,
  })
}

export function usePrenderAvisos({
  suscribir,
  zonaHoraria,
  onSuccess,
  onError,
}: {
  suscribir: () => Promise<void>
  zonaHoraria: () => string
  onSuccess?: () => void
  onError?: (error: unknown) => void
}) {
  const api = useGameApi()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (hora: string) => {
      // El orden importa: primero el permiso y la suscripción, y recién después
      // la preferencia. Al revés quedaría `notify_enabled = true` sin ningún
      // aparato al que mandarle, o sea alguien que cree que activó algo.
      await suscribir()
      unwrap(
        await api.PUT("/game/derivemos/notification-settings", {
          body: { enabled: true, time: hora, timezone: zonaHoraria() },
        }),
      )
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: avisosKey })
      onSuccess?.()
    },
    onError: (error) => {
      onError?.(error)
    },
  })
}

/** Cambio de horario con los avisos YA prendidos: no toca la suscripción. */
export function useCambiarHora({ zonaHoraria }: { zonaHoraria: () => string }) {
  const api = useGameApi()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (hora: string) => {
      unwrap(
        await api.PUT("/game/derivemos/notification-settings", {
          body: { enabled: true, time: hora, timezone: zonaHoraria() },
        }),
      )
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: avisosKey })
    },
  })
}
