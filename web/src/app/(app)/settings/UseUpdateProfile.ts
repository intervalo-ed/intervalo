"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useApi } from "@/lib/api/useApi"
import { queryKeys } from "@/lib/query/keys"

type ProfilePatch = { username?: string; display_name?: string }

function messageFromError(error: unknown): string {
  const detail = (error as { detail?: unknown } | null)?.detail
  if (typeof detail === "string") return detail
  return "No se pudo guardar. Probá de nuevo."
}

export function useUpdateProfile() {
  const api = useApi()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: ProfilePatch) => {
      const { data, error } = await api.PATCH("/user/profile", { body })
      if (error) throw new Error(messageFromError(error))
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.authMe() })
      qc.invalidateQueries({ queryKey: queryKeys.leaderboard() })
    },
  })
}
