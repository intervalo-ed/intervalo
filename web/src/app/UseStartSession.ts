"use client"

import { useMutation } from "@tanstack/react-query"
import { useApi } from "@/lib/api/useApi"
import { stashSession } from "@/lib/session/storage"

export function useStartSession() {
  const api = useApi()
  return useMutation({
    mutationFn: async ({
      userName,
      course,
    }: {
      userName: string
      course?: string
    }) => {
      const { data, error } = await api.POST("/session/start", {
        body: { user_name: userName, course },
      })
      if (error) throw error
      stashSession({ id: data.session_id, payload: data })
      return data
    },
  })
}
