"use client"

import { useMutation } from "@tanstack/react-query"
import { useApi } from "@/lib/api/useApi"
import type { AnswerRequest } from "@/lib/api/types"

export type AnswerResponse = {
  correct: boolean
  quality: number
  feedback: string
  xp_earned: number
}

export function useAnswer() {
  const api = useApi()
  return useMutation({
    mutationFn: async (body: AnswerRequest): Promise<AnswerResponse> => {
      const { data, error } = await api.POST("/session/answer", { body })
      if (error) throw error
      return data as AnswerResponse
    },
  })
}
