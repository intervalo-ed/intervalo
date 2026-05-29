"use client"

import { useQuery } from "@tanstack/react-query"
import { useApi } from "@/lib/api/useApi"
import { queryKeys } from "@/lib/query/keys"

export function useUserProgress() {
  const api = useApi()
  return useQuery({
    queryKey: queryKeys.userProgress(),
    queryFn: async () => {
      const { data, error } = await api.GET("/user/progress")
      if (error) throw error
      return data
    },
    // Always refetch on mount; the global default (30s staleTime) was hiding
    // post-session updates when navigating back from /session/.../summary.
    staleTime: 0,
  })
}
