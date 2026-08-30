"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { unwrap } from "@/lib/api/client"
import type { components } from "@/lib/api/schema"
import { gameKeys, type GamePlayer } from "./UseGamePlayer"
import { useGameApi } from "./UseGameApi"

export type GameExercise = components["schemas"]["GameExerciseOut"]
export type GameAnswer = components["schemas"]["GameAnswerResponse"]

export function useNextExercise() {
  const api = useGameApi()
  return useMutation({
    mutationFn: async () =>
      unwrap(await api.POST("/game/derivemos/next")),
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
      unwrap(await api.POST("/game/derivemos/skip", { body })),
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
      peeked?: boolean
      // El schema lo pide siempre (tiene default en Pydantic, no en OpenAPI);
      // el teléfono no tiene tabla y nunca lo manda.
    }) => unwrap(await api.POST("/game/derivemos/answer", { body: { peeked: false, ...body } })),
    onSuccess: (data) => {
      // Solo el jugador. El ranking lo invalida el layout cuando TERMINA el
      // conteo de XP (ver xp-conteo.ts): si se refrescara acá, la fila propia
      // estrenaría puesto y XP antes del primer paso del conteo y el festejo se
      // quedaría sin nada que contar.
      //
      // Refresca con TODA respuesta que el parser entendió, no solo con las
      // correctas. Los tres marcadores de la card se mueven igual al errar: en
      // el primer intento el server suma `exercises_attempted`, manda la racha
      // a cero y baja el θ, acierte o no (game/router.py). Mirando solo las
      // correctas, los tres números quedaban viejos justo cuando más tenían
      // para decir — errabas y la racha seguía marcando 7.
      if (!data.parse_ok) return
      // Primero lo que la respuesta YA trae, escrito directo en el caché: los
      // marcadores se mueven en el mismo fotograma en que aparece el color, sin
      // esperar un segundo viaje a la red. Y si ese viaje se pierde —el caso
      // normal en un colectivo—, los números igual quedaron bien.
      queryClient.setQueryData(gameKeys.me, (previo: GamePlayer | undefined) =>
        previo === undefined
          ? previo
          : {
              ...previo,
              xp: data.xp_total,
              combo: data.combo,
              exercises_correct: data.exercises_correct,
              // El intento lo suma el server acierte o no.
              exercises_attempted: previo.exercises_attempted + 1,
              ...(data.rank_after !== null && { rank: data.rank_after }),
              ...(data.best_rank !== null && { best_rank: data.best_rank }),
            },
      )
      // Y después el refresco, que es lo único que trae el elo nuevo: no viaja
      // en la respuesta de /answer aunque el server lo haya movido.
      queryClient.invalidateQueries({ queryKey: gameKeys.me })
    },
  })
}
