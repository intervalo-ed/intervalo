"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useApi } from "@/lib/api/useApi"
import { queryKeys } from "@/lib/query/keys"
import type { CourseId } from "@/lib/catalog"
import type { components } from "@/lib/api/schema"

type Progress = components["schemas"]["UserProgressResponse"]
type CapPreview = components["schemas"]["CapPreviewResponse"]

function errMessage(error: unknown): string {
  const detail = (error as { detail?: unknown } | null)?.detail
  if (typeof detail === "string") return detail
  return "No se pudo aplicar el cambio. Probá de nuevo."
}

// Mutaciones del modo editor de curso. Cada acción devuelve el progreso
// actualizado, que se escribe directo en la cache de userProgress para evitar un
// refetch con flash.
export function useCourseEditor(course: CourseId) {
  const api = useApi()
  const qc = useQueryClient()

  const writeProgress = (data: Progress) => {
    qc.setQueryData(queryKeys.userProgress({ course }), data)
  }

  const advance = useMutation({
    mutationFn: async (body: { belt: string; topic: string }) => {
      const { data, error } = await api.POST("/course/{course}/topic/advance", {
        params: { path: { course } },
        body,
      })
      if (error) throw new Error(errMessage(error))
      return data as Progress
    },
    onSuccess: writeProgress,
  })

  const suspend = useMutation({
    mutationFn: async (body: { belt: string; topic: string }) => {
      const { data, error } = await api.POST("/course/{course}/topic/suspend", {
        params: { path: { course } },
        body,
      })
      if (error) throw new Error(errMessage(error))
      return data as Progress
    },
    onSuccess: writeProgress,
  })

  const resetTopic = useMutation({
    mutationFn: async (body: { belt: string; topic: string }) => {
      const { data, error } = await api.POST("/course/{course}/topic/reset", {
        params: { path: { course } },
        body,
      })
      if (error) throw new Error(errMessage(error))
      return data as Progress
    },
    onSuccess: writeProgress,
  })

  const setCap = useMutation({
    mutationFn: async (value: number) => {
      const { data, error } = await api.PUT("/course/{course}/active-cap", {
        params: { path: { course } },
        body: { value },
      })
      if (error) throw new Error(errMessage(error))
      return data as Progress
    },
    onSuccess: writeProgress,
  })

  const resetCourse = useMutation({
    mutationFn: async () => {
      const { data, error } = await api.POST("/course/{course}/reset", {
        params: { path: { course } },
      })
      if (error) throw new Error(errMessage(error))
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.userProgress({ course }) })
      qc.invalidateQueries({ queryKey: queryKeys.practiceStats({ course }) })
      // El cinturón del ranking depende del progreso: refrescar todos los scopes.
      qc.invalidateQueries({ queryKey: queryKeys.leaderboard().slice(0, -1) })
    },
  })

  const previewCap = async (value: number): Promise<CapPreview> => {
    const { data, error } = await api.GET("/course/{course}/active-cap/preview", {
      params: { path: { course }, query: { value } },
    })
    if (error) throw new Error(errMessage(error))
    return data
  }

  return { advance, suspend, resetTopic, setCap, resetCourse, previewCap }
}
