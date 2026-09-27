"use client"

// Lo que dice la pantalla con la que arranca toda sesión.
//
// Endpoint propio y no un campo de `/me`: `/me` lo pide cada montaje y cada
// vuelta del poll, y esto son cinco agregaciones que solo hacen falta cuando la
// pantalla se dibuja. Ver `backend/game/router.py :: game_bienvenida`.
//
// `staleTime: Infinity` y sin reintentos: el endpoint MARCA que se mostró, así
// que pedirlo dos veces en la misma sesión devolvería la segunda vez una
// pantalla más pobre que la primera —lo ya contado no se cuenta de nuevo— y el
// usuario vería el contenido cambiar solo. Una vez por montaje y listo.

import { useQuery } from "@tanstack/react-query"
import { unwrap } from "@/lib/api/client"
import type { components } from "@/lib/api/schema"
import { useGameApi } from "./UseGameApi"

export type Bienvenida = components["schemas"]["GameBienvenidaOut"]
export type Novedad = components["schemas"]["GameNovedadOut"]

export const bienvenidaKey = ["game", "bienvenida"] as const

export function useBienvenida(enabled: boolean) {
  const api = useGameApi()
  return useQuery({
    queryKey: bienvenidaKey,
    queryFn: async (): Promise<Bienvenida> =>
      unwrap(await api.GET("/game/derivemos/bienvenida")),
    enabled,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    // Si falla, la puerta cae al texto de siempre. No hay nada que reintentar:
    // una pantalla de arranque que aparece tarde es peor que una que no cambió.
    retry: false,
  })
}
