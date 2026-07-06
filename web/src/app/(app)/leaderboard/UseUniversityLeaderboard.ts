"use client"

import { useQuery } from "@tanstack/react-query"
import { useApi } from "@/lib/api/useApi"
import { queryKeys } from "@/lib/query/keys"

// Ranking de universidades: agregado por universidad y carrera. No es paginado
// (son pocas universidades), así que un useQuery simple alcanza.
export function useUniversityLeaderboard() {
  const api = useApi()
  return useQuery({
    queryKey: queryKeys.universityLeaderboard(),
    queryFn: async () => {
      const { data, error } = await api.GET("/leaderboard/universities")
      if (error) throw error
      return data
    },
  })
}
