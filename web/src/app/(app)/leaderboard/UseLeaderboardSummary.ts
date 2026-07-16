"use client"

import { useQuery } from "@tanstack/react-query"
import { useApi } from "@/lib/api/useApi"
import { queryKeys } from "@/lib/query/keys"
import { ALL } from "./UseLeaderboard"

// Números de la cabecera: estudiantes registrados y ejercicios completados.
// `universities` siempre lista el set completo (para poblar el filtro), pero
// los totales reaccionan a `career`/`university` igual que el resto del
// leaderboard.
export function useLeaderboardSummary(
  { university, career }: { university: string; career: string } = {
    university: ALL,
    career: ALL,
  },
) {
  const api = useApi()
  return useQuery({
    queryKey: queryKeys.leaderboardSummary({ university, career }),
    queryFn: async () => {
      const { data, error } = await api.GET("/leaderboard/summary", {
        params: {
          query: {
            university: university === ALL ? undefined : university,
            career: career === ALL ? undefined : career,
          },
        },
      })
      if (error) throw error
      return data
    },
  })
}
