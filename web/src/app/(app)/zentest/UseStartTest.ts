"use client"

import { useMutation } from "@tanstack/react-query"
import { useApi } from "@/lib/api/useApi"
import { stashSession } from "@/lib/session/storage"
import type { SessionStartResponse } from "@/lib/api/types"

export type TestItem = {
  belt: string
  topic: string
  exercise_type: string
}

export function useStartTest() {
  const api = useApi()
  return useMutation({
    mutationFn: async ({ items }: { items: TestItem[] }) => {
      const { data, error } = await api.POST("/session/start-test", {
        body: { items },
      })
      if (error) throw error
      // OpenAPI types this response as `unknown`; the shape matches
      // SessionStartResponse, same as start-zen.
      const payload = data as SessionStartResponse
      stashSession({ id: payload.session_id, payload })
      return payload
    },
  })
}
