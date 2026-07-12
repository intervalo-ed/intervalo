"use client"

import { useInfiniteQuery } from "@tanstack/react-query"
import { useApi } from "@/lib/api/useApi"
import { queryKeys } from "@/lib/query/keys"

// Valor del filtro "sin universidad" y tamaño de cada página al scrollear.
export const ALL = "all"
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
