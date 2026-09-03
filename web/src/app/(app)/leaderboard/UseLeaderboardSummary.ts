"use client"

import { useQuery } from "@tanstack/react-query"
import { useApi } from "@/lib/api/useApi"
import { queryKeys } from "@/lib/query/keys"
import { ALL } from "./UseLeaderboard"

// Números de la cabecera: estudiantes registrados y ejercicios completados.
// `universities` siempre lista el set completo (para poblar el filtro), pero
// los totales reaccionan a `career`/`university` igual que el resto del
// leaderboard.
//
// Desde que la respuesta trae los EMPUJES de cafecito, esta consulta dejó de ser
// solo un puñado de totales: los chips llevan una cuenta regresiva, y sin
// refetch el reloj arrancaba una sola vez al montar y contaba solo el resto de
// la sesión. Los defaults globales son `staleTime: 30_000` y
// `refetchOnWindowFocus: false` (providers.tsx), o sea que nadie lo volvía a
// pedir. El chip del ranking del juego no tenía el problema porque se remonta
// con el pulso cada 10 s.
//
// Un minuto es suficiente: la cuenta regresiva descuenta sola contra un
// vencimiento absoluto (`useCountdown`), así que el refetch no está para mover
// el reloj sino para enterarse de un empuje NUEVO y para corregir la deriva.
const REFETCH_MS = 60_000

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
    refetchInterval: REFETCH_MS,
    // Volver a la pestaña también resincroniza: es justo cuando el reloj local
    // pudo haberse quedado atrás por el estrangulamiento de timers.
    refetchOnWindowFocus: true,
  })
}
