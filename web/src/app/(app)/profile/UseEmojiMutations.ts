"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useApi } from "@/lib/api/useApi"
import { queryKeys } from "@/lib/query/keys"
import type { components } from "@/lib/api/schema"

type EmojiState = components["schemas"]["EmojiStateResponse"]

function messageFromError(error: unknown): string {
  const detail = (error as { detail?: unknown } | null)?.detail
  if (typeof detail === "string") return detail
  return "No se pudo guardar. Probá de nuevo."
}

// Al actualizar el estado, refrescamos su query y el ranking (el emoji vestido
// se muestra ahí), además de authMe por las dudas.
function useOnEmojiSuccess() {
  const qc = useQueryClient()
  return (data: EmojiState | undefined) => {
    if (data) qc.setQueryData(queryKeys.emojiState(), data)
    qc.invalidateQueries({ queryKey: queryKeys.authMe() })
    qc.invalidateQueries({ queryKey: queryKeys.leaderboard().slice(0, -1) })
  }
}

// Desbloquea el siguiente nodo del camino (irreversible).
export function useUnlockEmoji() {
  const api = useApi()
  const onSuccess = useOnEmojiSuccess()
  return useMutation({
    mutationFn: async (nodeId: string) => {
      const { data, error } = await api.POST("/user/emoji/unlock", {
        body: { node_id: nodeId },
      })
      if (error) throw new Error(messageFromError(error))
      return data
    },
    onSuccess,
  })
}

// Viste un emoji ya desbloqueado. null = raíz del bucket (default).
export function useSetWornEmoji() {
  const api = useApi()
  const onSuccess = useOnEmojiSuccess()
  return useMutation({
    mutationFn: async (nodeId: string | null) => {
      const { data, error } = await api.PUT("/user/emoji/worn", {
        body: { node_id: nodeId },
      })
      if (error) throw new Error(messageFromError(error))
      return data
    },
    onSuccess,
  })
}
