"use client"

import { useEffect, useRef } from "react"
import { useAuth } from "@clerk/nextjs"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { readAttribution } from "@/lib/analytics/attribution"
import { unwrap } from "@/lib/api/client"
import type { components } from "@/lib/api/schema"
import { readGameToken, saveGameToken } from "./game-storage"
import { useGameApi } from "./UseGameApi"

export type GamePlayer = components["schemas"]["GamePlayerOut"]

export const gameKeys = {
  me: ["game", "me"] as const,
  leaderboard: ["game", "leaderboard"] as const,
  // Raíz aparte a propósito: invalidar el ranking hace match por prefijo, y si
  // el pulso colgara de esa misma raíz se invalidaría a sí mismo en cada
  // refresco.
  pulse: ["game", "pulse"] as const,
  // Ídem el pulso: raíz propia para que invalidar el ranking no lo arrastre.
  events: ["game", "events"] as const,
}

/** El jugador que ya está en el caché, sin disparar ningún pedido.
 *
 * `enabled: false` es la clave: quien monte esto LEE lo que el bootstrap de
 * `useGamePlayer` ya dejó, sin sumar una request ni —peor— arrancar un segundo
 * alta. Es para los componentes que solo necesitan mirar el perfil, como el
 * botón de compartir, que arma su link con el @ y la universidad.
 */
export function useCachedPlayer(): GamePlayer | null {
  const api = useGameApi()
  const { data } = useQuery({
    queryKey: gameKeys.me,
    queryFn: async () => unwrap(await api.GET("/game/derivemos/me")),
    enabled: false,
  })
  return data ?? null
}

// Alta/bootstrap del jugador. POST /player es idempotente: sin credenciales
// crea un guest (y guardamos el token), con token devuelve el existente, y con
// sesión de Clerk crea/devuelve el jugador del usuario — linkeando al guest si
// ambos viajan juntos (el retorno del OAuth de Google).
export function useGamePlayer() {
  const api = useGameApi()
  const queryClient = useQueryClient()
  const { isSignedIn, isLoaded } = useAuth()
  const bootstrapped = useRef(false)

  const ensure = useMutation({
    mutationFn: async () => {
      const attribution = readAttribution()
      const result = await api.POST("/game/derivemos/player", {
        body: {
          group_id: attribution.groupId ?? null,
          utm_source: attribution.utmSource ?? null,
        },
      })
      return unwrap(result)
    },
    onSuccess: (data) => {
      if (data.guest_token) saveGameToken(data.guest_token)
      queryClient.setQueryData(gameKeys.me, data.player)
    },
  })

  const me = useQuery({
    queryKey: gameKeys.me,
    queryFn: async () => unwrap(await api.GET("/game/derivemos/me")),
    // Sin identidad no hay quien preguntar: el bootstrap la crea primero.
    enabled: isLoaded && (isSignedIn || readGameToken() !== null),
    staleTime: 30_000,
    retry: 1,
  })

  const ensureMutate = ensure.mutate
  useEffect(() => {
    if (!isLoaded || bootstrapped.current) return
    bootstrapped.current = true
    ensureMutate()
  }, [isLoaded, ensureMutate])

  return {
    player: me.data ?? ensure.data?.player ?? null,
    isSignedIn: isSignedIn ?? false,
    refetch: () => queryClient.invalidateQueries({ queryKey: gameKeys.me }),
    ensurePlayer: ensureMutate,
    error: me.error ?? ensure.error ?? null,
  }
}
