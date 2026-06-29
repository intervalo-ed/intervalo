"use client"

import { useMutation } from "@tanstack/react-query"
import { useApi } from "@/lib/api/useApi"
import type { FeedbackRequest } from "@/lib/api/types"

export function useFeedback() {
  const api = useApi()
  return useMutation({
    mutationFn: async (body: FeedbackRequest) => {
      const { data, error } = await api.POST("/feedback", { body })
      if (error) throw error
      return data
    },
  })
}
