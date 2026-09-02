import { useQuery } from "@tanstack/react-query"
import { unwrap } from "@/lib/api/client"
import { useApi } from "@/lib/api/useApi"

/** Los reclutas de esta persona en Intervalo: quiénes entraron por su link y
 *  cuánta XP le generaron.
 *
 *  Query key propia y no colgada del leaderboard: el ranking se invalida seguido
 *  —cada sesión lo mueve— y esto cambia mucho más lento. */
export function useRecruits({ enabled = true }: { enabled?: boolean } = {}) {
  const api = useApi()
  return useQuery({
    queryKey: ["recruits"],
    enabled,
    queryFn: async () => unwrap(await api.GET("/leaderboard/recruits", {})),
  })
}
