import { useEffect, useSyncExternalStore } from "react"
import { useAuth } from "@clerk/expo"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { unwrap } from "@intervalo/dx-core/api/client"
import { useGameApi } from "@intervalo/dx-core/juego/game-api-context"
import { gameKeys } from "@intervalo/dx-core/juego/game-keys"
import {
  getGameTokenSnapshot,
  saveGameToken,
  subscribeGameToken,
} from "@intervalo/dx-core/juego/game-storage"

// El par nativo de `web/src/app/derivadas/UseGamePlayer.ts`, sin lo que es de la
// web: ni atribución por URL, ni brazo de experimento, ni `?pwa`.

/** El token del invitado, como valor reactivo. */
export function useGameToken(): string | null {
  return useSyncExternalStore(subscribeGameToken, getGameTokenSnapshot)
}

// El alta corre UNA vez por arranque de la app, no una por componente montado:
// dos POST sin token crearían dos invitados. Se libera si falla, para que un
// error de red no deje al juego sin jugador hasta reabrir la app.
let bootstrapStarted = false

function husoHorario(): string | null {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || null
  } catch {
    return null
  }
}

// POST /player es idempotente: sin credenciales crea un invitado (y guardamos el
// token), con token devuelve el existente, y con sesión de Clerk crea/devuelve
// el jugador del usuario, linkeando al invitado si viajan los dos.
export function useGamePlayer() {
  const api = useGameApi()
  const queryClient = useQueryClient()
  const { isSignedIn, isLoaded } = useAuth()
  const token = useGameToken()

  const ensure = useMutation({
    mutationFn: async () =>
      unwrap(
        await api.POST("/game/derivemos/player", {
          body: { timezone: husoHorario() },
        }),
      ),
    onSuccess: (data) => {
      if (data.guest_token) saveGameToken(data.guest_token)
      queryClient.setQueryData(gameKeys.me, data.player)
    },
    onError: () => {
      bootstrapStarted = false
    },
  })

  const me = useQuery({
    queryKey: gameKeys.me,
    queryFn: async () => unwrap(await api.GET("/game/derivemos/me")),
    enabled: isLoaded && (isSignedIn || token !== null),
    staleTime: 30_000,
    retry: 1,
  })

  const ensureMutate = ensure.mutate
  useEffect(() => {
    if (!isLoaded || bootstrapStarted) return
    bootstrapStarted = true
    ensureMutate()
  }, [isLoaded, ensureMutate])

  return {
    player: me.data ?? ensure.data?.player ?? null,
    isSignedIn: isSignedIn ?? false,
    refetch: () => queryClient.refetchQueries({ queryKey: gameKeys.me }),
    ensurePlayer: ensureMutate,
    error: me.error ?? ensure.error ?? null,
  }
}
