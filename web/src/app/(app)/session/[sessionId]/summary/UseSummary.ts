"use client"

import { useQuery } from "@tanstack/react-query"
import { useApi } from "@/lib/api/useApi"
import { queryKeys } from "@/lib/query/keys"

export function useSummary({ sessionId }: { sessionId: string }) {
  const api = useApi()
  return useQuery({
    queryKey: queryKeys.sessionSummary({ sessionId }),
    queryFn: async () => {
      const { data, error } = await api.GET("/session/{session_id}/summary", {
        params: { path: { session_id: sessionId } },
      })
      if (error) throw error
      return data
    },
  })
}
