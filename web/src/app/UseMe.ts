"use client"

import { useQuery } from "@tanstack/react-query"
import { useApi } from "@/lib/api/useApi"
import { queryKeys } from "@/lib/query/keys"

export function useMe() {
  const api = useApi()
  return useQuery({
    queryKey: queryKeys.authMe(),
    queryFn: async () => {
      const { data, error } = await api.GET("/auth/me")
      if (error) throw error
      return data
    },
  })
}
