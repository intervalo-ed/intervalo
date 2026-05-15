"use client"

import { useMutation } from "@tanstack/react-query"
import { useApi } from "@/lib/api/UseApi"
import { stashSession } from "@/lib/session/storage"
import type { SessionStartResponse } from "@/lib/api/types"

export function useStartZen() {
  const api = useApi()
  return useMutation({
    mutationFn: async ({
      userName,
      belts,
      count,
    }: {
      userName: string
      belts: string[]
      count: number
    }) => {
      const { data, error } = await api.POST("/session/start-zen", {
        body: { user_name: userName, belts, count },
      })
      if (error) throw error
      // OpenAPI spec types this response as `unknown`; the actual shape matches
      // SessionStartResponse (gap #7 in backend-gaps).
      const payload = data as SessionStartResponse
      stashSession({ id: payload.session_id, payload })
      return payload
    },
  })
}
