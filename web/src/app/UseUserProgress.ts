"use client"

import { useQuery } from "@tanstack/react-query"
import { useApi } from "@/lib/api/useApi"
import { queryKeys } from "@/lib/query/keys"
import { getTimezone } from "@/lib/push/register"
import type { CourseId } from "@/lib/catalog"

export function useUserProgress({ course }: { course?: CourseId } = {}) {
  const api = useApi()
  return useQuery({
    queryKey: queryKeys.userProgress({ course }),
    queryFn: async () => {
      // Mandamos la zona horaria del navegador para que el backend persista el
      // "día" del usuario y el gate de repasos no se adelante (ver user_today).
      const { data, error } = await api.GET("/user/progress", {
        params: {
          query: {
            tz: getTimezone(),
            ...(course ? { course } : {}),
          },
        },
      })
      if (error) throw error
      return data
    },
    // Always refetch on mount; the global default (30s staleTime) was hiding
    // post-session updates when navigating back from /session/.../summary.
    staleTime: 0,
  })
}
