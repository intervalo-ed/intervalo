"use client"

import { useQuery } from "@tanstack/react-query"
import { useApi } from "@/lib/api/useApi"
import { queryKeys } from "@/lib/query/keys"

// Números generales (globales) de la cabecera: estudiantes registrados,
// ejercicios acumulados y universidades presentes. No dependen de filtros.
export function useLeaderboardSummary() {
  const api = useApi()
  return useQuery({
    queryKey: queryKeys.leaderboardSummary(),
    queryFn: async () => {
      const { data, error } = await api.GET("/leaderboard/summary")
      if (error) throw error
      return data
    },
  })
}
