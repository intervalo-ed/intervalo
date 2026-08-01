"use client"

import { useMutation } from "@tanstack/react-query"
import { useApi } from "@/lib/api/useApi"
import type { SessionFeedbackRequest, SessionFeedbackResponse } from "@/lib/api/types"

export function useSessionFeedback() {
  const api = useApi()
  return useMutation({
    mutationFn: async (
      body: SessionFeedbackRequest,
    ): Promise<SessionFeedbackResponse> => {
      const { data, error } = await api.POST("/session/feedback", { body })
      if (error) throw error
      return data as SessionFeedbackResponse
    },
  })
}
