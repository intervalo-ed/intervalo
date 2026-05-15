"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useApi } from "@/lib/api/UseApi"
import { queryKeys } from "@/lib/query/keys"

export function useEnrollMutation() {
  const api = useApi()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      university,
      career,
      name,
    }: {
      university: string
      career: string
      name?: string | null
    }) => {
      const { data, error } = await api.POST("/user/enroll", {
        body: { university, career, name },
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
