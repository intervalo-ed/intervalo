"use client"

import { useQuery } from "@tanstack/react-query"
import { useApi } from "@/lib/api/useApi"
import { queryKeys } from "@/lib/query/keys"

// Snapshot público (sin auth) de universidades top por estudiantes y por XP,
// para las secciones de ranking de la landing (marketing-home.tsx). Un
// visitante sin cuenta no tiene sesión para pegarle a /leaderboard/universities.
export function usePublicUniversityLeaderboard() {
  const api = useApi()
  return useQuery({
    queryKey: queryKeys.publicUniversityLeaderboard(),
    queryFn: async () => {
      const { data, error } = await api.GET("/public/university-leaderboard")
      if (error) throw error
      return data
    },
    staleTime: 5 * 60 * 1000,
  })
}
