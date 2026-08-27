"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { unwrap } from "@/lib/api/client"
import type { components } from "@/lib/api/schema"
import { gameKeys } from "./UseGamePlayer"
import { useGameApi } from "./UseGameApi"

export type GameExercise = components["schemas"]["GameExerciseOut"]
export type GameAnswer = components["schemas"]["GameAnswerResponse"]

export function useNextExercise() {
  const api = useGameApi()
  return useMutation({
    mutationFn: async () =>
      unwrap(await api.POST("/game/derivadas/next")),
  })
}

export function useAnswerExercise() {
  const api = useGameApi()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: {
      exercise_id: number
      answer_latex: string
      answer_mathjson: unknown
      response_ms?: number
    }) => unwrap(await api.POST("/game/derivadas/answer", { body })),
    onSuccess: (data) => {
      // Solo el jugador. El ranking lo invalida el layout cuando TERMINA de
      // caer el confeti (ver xp-burst.tsx): si se refrescara acá, la fila
      // propia estrenaría puesto y XP antes de que llegue la primera bolita y
      // el festejo se quedaría sin nada que contar.
      if (data.correct) queryClient.invalidateQueries({ queryKey: gameKeys.me })
    },
  })
}
