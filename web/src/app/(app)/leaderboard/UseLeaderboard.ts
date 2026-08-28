"use client"

import { useInfiniteQuery } from "@tanstack/react-query"
import { useApi } from "@/lib/api/useApi"
import { ALL_SCOPE } from "@/components/leaderboard-chrome"
import { queryKeys } from "@/lib/query/keys"
import { setLastKnownRank } from "@/lib/nav/ranking-rank"

// Valor del filtro "sin acotar" y tamaño de cada página al scrollear. El valor
// lo define el selector compartido: si acá y allá difirieran, el filtro "Todas"
// se mandaría al backend como si fuera una universidad.
export const ALL = ALL_SCOPE
export const PAGE_SIZE = 30

// La primera página pide la ventana centrada en el usuario (`around_me`); las
// siguientes piden por offset hacia arriba o hacia abajo. Cada entry trae su
// `rank` absoluto, así calculamos los bordes de lo ya cargado.
type PageParam =
  | { around: true }
  | { around: false; offset: number; limit: number }

export function useLeaderboard(
  { university, career }: { university: string; career: string } = {
    university: ALL,
    career: ALL,
  },
) {
  const api = useApi()
  return useInfiniteQuery({
    queryKey: queryKeys.leaderboard({ university, career }),
    initialPageParam: { around: true } as PageParam,
    queryFn: async ({ pageParam }) => {
      const { data, error } = await api.GET("/leaderboard", {
        params: {
          query: {
            university: university === ALL ? undefined : university,
            career: career === ALL ? undefined : career,
            ...(pageParam.around
              ? { around_me: true }
              : { offset: pageParam.offset, limit: pageParam.limit }),
          },
        },
      })
      if (error) throw error
      // Guarda el rank global (sin filtros) como base para detectar, al
      // terminar la próxima sesión, si el usuario avanzó lugares.
      if (university === ALL && career === ALL && typeof data.me.rank === "number") {
        setLastKnownRank(data.me.rank)
      }
      return data
    },
    // Hacia abajo: desde el rank (1-based) de la última fila cargada, que es el
    // offset (0-based) de la siguiente.
    getNextPageParam: (lastPage): PageParam | undefined => {
      const last = lastPage.entries.at(-1)
      if (!last) return undefined
      const nextOffset = last.rank
      if (nextOffset >= lastPage.total_count) return undefined
      return { around: false, offset: nextOffset, limit: PAGE_SIZE }
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
  })
}
