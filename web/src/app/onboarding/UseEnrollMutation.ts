"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { readAttribution } from "@/lib/analytics/attribution"
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
      knownUnits,
      introItemCorrect,
      introItemAttempts,
      introItemResponseTimeMs,
    }: {
      university: string
      career: string
      name?: string | null
      course?: string
      knownUnits?: string[]
      introItemCorrect?: boolean
      introItemAttempts?: number
      introItemResponseTimeMs?: number
    }) => {
      // La atribución se lee acá y no la pasa quien llama: es estado ambiente
      // del dispositivo (se capturó al aterrizar, antes de que existiera el
      // usuario), no una decisión del formulario. Leerla adentro hace que todas
      // las vías de alta la manden sin tener que acordarse.
      const { groupId, utmSource } = readAttribution()
      return unwrap(
        await api.POST("/user/enroll", {
          body: {
            university,
            career,
            name,
            course: course ?? null,
            known_units: knownUnits?.length ? knownUnits.join(",") : null,
            first_group_id: groupId ?? null,
            first_utm_source: utmSource ?? null,
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
