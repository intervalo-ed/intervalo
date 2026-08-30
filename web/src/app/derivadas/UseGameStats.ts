"use client"

import { useQuery } from "@tanstack/react-query"
import { unwrap } from "@/lib/api/client"
import type { components } from "@/lib/api/schema"
import { gameKeys } from "./UseGamePlayer"
import { useGameApi } from "./UseGameApi"

export type GameStats = components["schemas"]["GameStatsOut"]
export type GameStatsRow = components["schemas"]["GameStatsRow"]

/** Las estadísticas del panel que abre la tecla `j`.
 *
 * `enabled` tiene que venir en `false` hasta que el panel se abre de verdad
 * (statsOpen): pedirlas apenas el jugador cruza la derivada 10, aunque nunca
 * toque `p`, sería trabajo del servidor —una agregación sobre TODOS los
 * jugadores calificados— por una tecla que quizás nadie use.
 *
 * `staleTime` corto y no cero: mientras el jugador tiene el panel abierto y
 * sigue resolviendo (puede cerrar, contestar, volver a abrir) no hace falta
 * recalcular en cada toggle — el histograma y las 14 filas no cambian con una
 * sola respuesta más de este mismo jugador de forma perceptible.
 */
export function useGameStats(enabled: boolean) {
  const api = useGameApi()
  return useQuery({
    queryKey: gameKeys.stats,
    queryFn: async () => unwrap(await api.GET("/game/derivemos/stats")),
    enabled,
    staleTime: 30_000,
    retry: 1,
  })
}
