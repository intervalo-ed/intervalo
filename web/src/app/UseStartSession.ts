"use client"

import { useMutation } from "@tanstack/react-query"
import { useApi } from "@/lib/api/UseApi"
import { stashSession } from "@/lib/session/storage"

export function useStartSession() {
  const api = useApi()
  return useMutation({
    mutationFn: async ({ userName }: { userName: string }) => {
      const { data, error } = await api.POST("/session/start", {
        body: { user_name: userName },
      })
      if (error) throw error
      stashSession({ id: data.session_id, payload: data })
      return data
    },
  })
}
