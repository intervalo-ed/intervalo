"use client"

import { useInfiniteQuery } from "@tanstack/react-query"
import { useApi } from "@/lib/api/useApi"
import { queryKeys } from "@/lib/query/keys"

// Valor del filtro "sin universidad" y tamaño de página del scroll infinito.
export const ALL = "all"
export const PAGE_SIZE = 50

export function useLeaderboard({ university }: { university: string } = { university: ALL }) {
  const api = useApi()
  return useInfiniteQuery({
    queryKey: queryKeys.leaderboard({ university }),
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const { data, error } = await api.GET("/leaderboard", {
        params: {
          query: {
            university: university === ALL ? undefined : university,
            limit: PAGE_SIZE,
            offset: pageParam,
          },
        },
      })
      if (error) throw error
      return data
    },
    getNextPageParam: (lastPage, _allPages, lastPageParam) =>
      lastPage.has_more ? lastPageParam + PAGE_SIZE : undefined,
  })
}
