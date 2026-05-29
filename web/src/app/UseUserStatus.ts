"use client"

import { useQuery } from "@tanstack/react-query"
import { useApi } from "@/lib/api/useApi"
import { queryKeys } from "@/lib/query/keys"

// Authoritative new-vs-returning check, read from the DB. Use this to decide
// whether a signed-in user should run onboarding or skip straight to the
// dashboard, instead of trusting client-writable Clerk metadata.
export function useUserStatus() {
  const api = useApi()
  return useQuery({
    queryKey: queryKeys.userStatus(),
    queryFn: async () => {
      const { data, error } = await api.GET("/user/status")
      if (error) throw error
      return data
    },
    staleTime: 0,
  })
}
