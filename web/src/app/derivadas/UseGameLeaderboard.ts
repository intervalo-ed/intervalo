"use client"

import { useEffect, useRef } from "react"
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query"
import { unwrap } from "@/lib/api/client"
import { ALL_SCOPE } from "@/components/leaderboard-chrome"
import type { components } from "@/lib/api/schema"
import { gameKeys } from "./UseGamePlayer"
import { useGameApi } from "./UseGameApi"

export type GameLeaderboard = components["schemas"]["GameLeaderboardResponse"]
export type GameLeaderboardEntry = components["schemas"]["GameLeaderboardEntry"]
export type GameUniversityRow = components["schemas"]["GameUniversityRow"]

export type Scope = { university: string; career: string }

export const PAGE_SIZE = 30

// Cada cuánto se pregunta si el ranking cambió. Coincide con el intervalo del
// tick de simulación del servidor (game/simulation.py :: TICK_SECONDS).
const PULSE_INTERVAL_MS = 10_000

// "all" es el valor del selector, no un filtro: se omite del query string.
function scopeQuery({ university, career }: Scope) {
  return {
    ...(university === ALL_SCOPE ? {} : { university }),
    ...(career === ALL_SCOPE ? {} : { career }),
  }
}

const scopeKey = (scope: Scope) => [scope.university, scope.career] as const

// La primera página pide la ventana centrada en el jugador (`around_me`); las
// siguientes piden por offset hacia arriba o hacia abajo. Cada fila trae su
// `rank` absoluto, así se calculan los bordes de lo ya cargado. Misma mecánica
// que el leaderboard de Intervalo (app/(app)/leaderboard/UseLeaderboard.ts).
type PageParam = { around: true } | { around: false; offset: number; limit: number }

export function useGameLeaderboard(scope: Scope, enabled: boolean) {
  const api = useGameApi()
  return useInfiniteQuery({
    queryKey: [...gameKeys.leaderboard, ...scopeKey(scope)],
    initialPageParam: { around: true } as PageParam,
    queryFn: async ({ pageParam }) =>
      unwrap(
        await api.GET("/game/derivadas/leaderboard", {
          params: {
            query: {
              ...scopeQuery(scope),
              ...(pageParam.around
                ? { around_me: true }
                : { offset: pageParam.offset, limit: pageParam.limit }),
            },
          },
        }),
      ),
    // Hacia abajo: desde el rank (1-based) de la última fila cargada, que es el
    // offset (0-based) de la siguiente.
    getNextPageParam: (lastPage): PageParam | undefined => {
      const last = lastPage.entries.at(-1)
      if (!last) return undefined
      if (last.rank >= lastPage.total_count) return undefined
      return { around: false, offset: last.rank, limit: PAGE_SIZE }
    },
    // Hacia arriba: hasta el offset (0-based) de la primera fila cargada.
    getPreviousPageParam: (firstPage): PageParam | undefined => {
      const first = firstPage.entries[0]
      if (!first) return undefined
      const topOffset = first.rank - 1
      if (topOffset <= 0) return undefined
      const limit = Math.min(PAGE_SIZE, topOffset)
      return { around: false, offset: topOffset - limit, limit }
    },
    enabled,
    staleTime: 10_000,
    // Quien decide cuándo se actualiza el ranking es el festejo, no el montaje:
    // en el teléfono la lista aparece recién en la slide del ranking, y si se
    // refrescara al montar la fila propia ya estrenaría puesto y XP antes de
    // que caiga la primera bolita. Se refresca con la invalidación explícita de
    // xp-burst (onComplete) y al cambiar de scope, que es otra queryKey.
    refetchOnMount: false,
  })
}

// Latido del ranking. Se consulta cada 10 s y la lista se refresca SOLO si el
// número cambió, o sea si alguien respondió algo. Ese mismo pedido es además lo
// que hace avanzar la actividad simulada en el servidor: si nadie mira, nada se
// mueve, que es exactamente lo que se quiere.
//
// `paused` corta el latido mientras cae el confeti: refrescar ahí adelantaría el
// puesto nuevo antes de que termine el festejo.
export function useGamePulse({
  enabled,
  paused,
}: {
  enabled: boolean
  paused: boolean
}) {
  const api = useGameApi()
  const queryClient = useQueryClient()
  const seen = useRef<number | null>(null)
  const pending = useRef(false)

  const pulse = useQuery({
    queryKey: gameKeys.pulse,
    queryFn: async () => unwrap(await api.GET("/game/derivadas/leaderboard/pulse")),
    enabled,
    refetchInterval: PULSE_INTERVAL_MS,
    // En segundo plano se detiene: este pedido es lo que hace avanzar la
    // simulación, y una pestaña olvidada no tiene por qué mover el ranking de
    // los demás. Al volver, el primer latido lo pone al día.
    refetchIntervalInBackground: false,
    staleTime: 0,
    gcTime: 0,
  })

  const version = pulse.data?.version ?? null
  useEffect(() => {
    if (version === null) return
    if (seen.current === null) {
      seen.current = version
      return
    }
    if (version === seen.current && !pending.current) return
    if (paused) {
      // Se anota que hay algo nuevo y se aplica cuando termine el festejo.
      pending.current = true
      return
    }
    seen.current = version
    pending.current = false
    queryClient.invalidateQueries({ queryKey: gameKeys.leaderboard })
  }, [version, paused, queryClient])

  return pulse
}

export function useGameLeaderboardSummary(scope: Scope, enabled: boolean) {
  const api = useGameApi()
  return useQuery({
    queryKey: [...gameKeys.leaderboard, "summary", ...scopeKey(scope)],
    queryFn: async () =>
      unwrap(
        await api.GET("/game/derivadas/leaderboard/summary", {
          params: { query: scopeQuery(scope) },
        }),
      ),
    enabled,
    staleTime: 30_000,
  })
}

export function useGameUniversityLeaderboard(scope: Scope, enabled: boolean) {
  const api = useGameApi()
  return useQuery({
    queryKey: [...gameKeys.leaderboard, "universities", ...scopeKey(scope)],
    queryFn: async () =>
      unwrap(
        await api.GET("/game/derivadas/leaderboard/universities", {
          params: { query: scopeQuery(scope) },
        }),
      ),
    enabled,
    staleTime: 30_000,
  })
}
