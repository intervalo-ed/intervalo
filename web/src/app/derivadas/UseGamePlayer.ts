"use client"

import { useEffect, useSyncExternalStore } from "react"
import { useAuth } from "@clerk/nextjs"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { readAttribution } from "@/lib/analytics/attribution"
import { unwrap } from "@/lib/api/client"
import type { components } from "@/lib/api/schema"
import {
  getGameTokenServerSnapshot,
  getGameTokenSnapshot,
  saveGameToken,
  subscribeGameToken,
} from "./game-storage"
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
  // Raíz propia: se consulta solo al volver de Cafecito y no tiene nada que ver
  // con el ranking, así que invalidar el ranking no debe arrastrarlo.
  cafecitoStatus: ["game", "cafecito-status"] as const,
  // Los reclutas también van aparte, aunque se dibujen adentro del ranking.
  //
  // Colgados de la raíz del ranking, el latido —que invalida por prefijo cada
  // diez segundos, o sea cada vez que CUALQUIERA responde algo en el juego— los
  // volvía a pedir todo el tiempo. Una lista que cambia cuando llega un recluta
  // nuevo no tiene por qué recargarse al ritmo de la actividad de desconocidos,
  // y con la lista de ejemplo en pantalla eso es puro parpadeo por nada.
  recruits: ["game", "recruits"] as const,
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

/** El token del invitado, como valor REACTIVO.
 *
 * Leerlo con `readGameToken()` directamente en el cuerpo de un componente no
 * sirve: es una lectura no reactiva y el compilador la memoiza (ver el comentario
 * largo en game-storage.ts). Acá el token entra por `useSyncExternalStore`, así
 * que crear al invitado vuelve a renderizar a quien lo esté esperando. */
export function useGameToken(): string | null {
  return useSyncExternalStore(
    subscribeGameToken,
    getGameTokenSnapshot,
    getGameTokenServerSnapshot,
  )
}

// El alta corre UNA vez por carga de página, no una por componente montado.
//
// `useGamePlayer` se monta dos veces —GameRoot y, apenas `usePlatform` resuelve,
// el layout que eligió— y con una guarda por instancia las dos disparaban el
// POST. En una primera visita ninguna de las dos lleva token todavía, así que el
// server creaba DOS invitados y uno quedaba huérfano (con su fila en el ranking).
// En 3G, donde la primera respuesta no llega antes de que salga la segunda, era
// el caso normal y no el raro.
//
// Se libera si el alta falla, para que un error de red no deje al juego sin
// jugador para siempre.
let bootstrapStarted = false

// Alta/bootstrap del jugador. POST /player es idempotente: sin credenciales
// crea un guest (y guardamos el token), con token devuelve el existente, y con
// sesión de Clerk crea/devuelve el jugador del usuario — linkeando al guest si
// ambos viajan juntos (el retorno del OAuth de Google).
export function useGamePlayer() {
  const api = useGameApi()
  const queryClient = useQueryClient()
  const { isSignedIn, isLoaded } = useAuth()
  const token = useGameToken()

  const ensure = useMutation({
    mutationFn: async () => {
      const attribution = readAttribution()
      const result = await api.POST("/game/derivemos/player", {
        body: {
          group_id: attribution.groupId ?? null,
          utm_source: attribution.utmSource ?? null,
          // El @ de quien compartió el link. El server lo mira SOLO si esta
          // llamada termina creando la fila: quien ya venía jugando no adopta
          // reclutador por abrir un `?r=` (ver backend/game/referrals.py).
          referrer_alias: attribution.referrer ?? null,
        },
      })
      return unwrap(result)
    },
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
    // Sin identidad no hay quien preguntar: el bootstrap la crea primero. El
    // token viene del store reactivo, así que en cuanto el alta lo guarda esta
    // query se activa sola.
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
    // `refetchQueries` y no `invalidateQueries`: quien llama a esto acaba de
    // cambiar el @ o la universidad y necesita el valor nuevo YA, no marcado
    // como viejo para la próxima.
    refetch: () => queryClient.refetchQueries({ queryKey: gameKeys.me }),
    ensurePlayer: ensureMutate,
    error: me.error ?? ensure.error ?? null,
  }
}
