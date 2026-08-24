"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { isRetriable, unwrap } from "@/lib/api/client"
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
      introItemAttempts,
      introItemResponseTimeMs,
    }: {
      university: string
      career: string
      name?: string | null
      course?: string
      motivation?: string
      introItemCorrect?: boolean
      introItemAttempts?: number
      introItemResponseTimeMs?: number
    }) => {
      return unwrap(
        await api.POST("/user/enroll", {
          body: {
            university,
            career,
            name,
            course: course ?? null,
            motivation: motivation ?? null,
            intro_item_correct: introItemCorrect ?? null,
            attempts: introItemAttempts ?? null,
            response_time_ms: introItemResponseTimeMs ?? null,
          },
        }),
      )
    },
    // Retry acá y no en los defaults del QueryClient: el resto de las
    // mutations (answer, feedback, push/subscribe) no son idempotentes.
    // /user/enroll sí lo es — el backend hace upsert sobre
    // UNIQUE(user_id, course_id) y captura el IntegrityError del reintento.
    retry: (failureCount, error) => failureCount < 2 && isRetriable(error),
    retryDelay: (n) => 500 * 2 ** n,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.userProgressAll() })
      qc.invalidateQueries({ queryKey: queryKeys.authMe() })
    },
  })
}
