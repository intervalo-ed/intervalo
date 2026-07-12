"use client"

import { useQuery } from "@tanstack/react-query"
import { useApi } from "@/lib/api/useApi"
import { queryKeys } from "@/lib/query/keys"
import { ALL } from "./UseLeaderboard"

// Ranking de universidades: agregado por universidad y carrera. No es paginado
// (son pocas universidades), así que un useQuery simple alcanza. `career` cuenta
// solo estudiantes de esa carrera; `university` aísla una universidad.
export function useUniversityLeaderboard(
  { university, career }: { university: string; career: string } = {
    university: ALL,
    career: ALL,
  },
) {
  const api = useApi()
  return useQuery({
    queryKey: queryKeys.universityLeaderboard({ university, career }),
    queryFn: async () => {
      const { data, error } = await api.GET("/leaderboard/universities", {
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
