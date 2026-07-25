"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useApi } from "@/lib/api/useApi"
import { queryKeys } from "@/lib/query/keys"

export function useEnrollMutation() {
  const api = useApi()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      university,
      career,
      name,
      course,
      motivation,
      introItemCorrect,
    }: {
      university: string
      career: string
      name?: string | null
      course?: string
      motivation?: string
      introItemCorrect?: boolean
    }) => {
      const { data, error } = await api.POST("/user/enroll", {
        body: {
          university,
          career,
          name,
          course: course ?? null,
          motivation: motivation ?? null,
          intro_item_correct: introItemCorrect ?? null,
        },
      })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.userProgress() })
      qc.invalidateQueries({ queryKey: queryKeys.authMe() })
    },
  })
}
