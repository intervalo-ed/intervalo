"use client"

import { useQuery } from "@tanstack/react-query"
import { useApi } from "@/lib/api/useApi"
import { queryKeys } from "@/lib/query/keys"
import type { CourseId } from "@/lib/catalog"

export function usePracticeStats({ course }: { course?: CourseId } = {}) {
  const api = useApi()
  return useQuery({
    queryKey: queryKeys.practiceStats({ course }),
    queryFn: async () => {
      const { data, error } = await api.GET("/user/practice-stats", {
        params: { query: course ? { course } : {} },
      })
      if (error) throw error
      return data
    },
    staleTime: 0,
  })
}
