"use client"

import { useQuery } from "@tanstack/react-query"
import { useApi } from "@/lib/api/useApi"
import { queryKeys } from "@/lib/query/keys"

export function useLeaderboard() {
  const api = useApi()
  return useQuery({
    queryKey: queryKeys.leaderboard(),
    queryFn: async () => {
      const { data, error } = await api.GET("/leaderboard")
      if (error) throw error
      return data
    },
  })
}
