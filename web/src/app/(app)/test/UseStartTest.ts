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

export type TestFilters = {
  has_math: boolean
  has_graph: boolean
}

export function useStartTest() {
  const api = useApi()
  return useMutation({
    mutationFn: async ({
      items,
      shuffle,
      filters,
      course,
    }: {
      items: TestItem[]
      shuffle: boolean
      filters: TestFilters
      course?: string
    }) => {
      const { data, error } = await api.POST("/session/start-test", {
        body: { items, shuffle, filters, course },
      })
      if (error) throw error
      const payload = data as SessionStartResponse
      stashSession({ id: payload.session_id, payload })
      return payload
    },
  })
}
