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

// Saltear cierra el ejercicio sin responderlo y devuelve DIRECTAMENTE el
// siguiente, ya más fácil: un solo viaje, así el reemplazo se siente inmediato.
// Baja un poco el Elo y corta la racha, y las dos cosas se ven en la card, así
// que hay que refrescar al jugador.
export function useSkipExercise() {
  const api = useGameApi()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: { exercise_id: number }) =>
      unwrap(await api.POST("/game/derivadas/skip", { body })),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gameKeys.me })
    },
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
