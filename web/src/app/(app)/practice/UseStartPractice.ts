"use client"

import { useMutation } from "@tanstack/react-query"
import { useApi } from "@/lib/api/useApi"
import { stashSession } from "@/lib/session/storage"
import type { SessionStartResponse } from "@/lib/api/types"

export function useStartPractice() {
  const api = useApi()
  return useMutation({
    mutationFn: async ({
      userName,
      belt,
      topics,
      count,
      course,
    }: {
      userName: string
      belt: string
      topics: string[]
      count: number
      course?: string
    }) => {
      // El modo se renombró a "practice" en el front; el endpoint del back sigue
      // siendo /session/start-zen (sin cambios de API).
      const { data, error } = await api.POST("/session/start-zen", {
        body: { user_name: userName, belt, topics, count, course },
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
