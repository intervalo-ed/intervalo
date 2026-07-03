"use client"

import { useQuery } from "@tanstack/react-query"
import { useApi } from "@/lib/api/useApi"
import { queryKeys } from "@/lib/query/keys"

export function useEmojiState({ enabled = true }: { enabled?: boolean } = {}) {
  const api = useApi()
  return useQuery({
    queryKey: queryKeys.emojiState(),
    enabled,
    queryFn: async () => {
      const { data, error } = await api.GET("/user/emoji-tree")
      if (error) throw error
      return data
    },
  })
}
