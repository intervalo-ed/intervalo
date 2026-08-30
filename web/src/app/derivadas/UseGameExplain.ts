"use client"

// El pedido del «¿Por qué?».
//
// Mutación y no query, aunque leer una explicación suene a lectura: el pedido
// TIENE efecto de servidor. Si el ejercicio sigue abierto, queda marcado como
// explicado y acertarlo después va a pagar XP_EXPLICADO en vez de la XP normal
// (backend/game/xp.py). Una query se refetchearía sola al volver a la pestaña,
// y eso sería bajarle la recompensa a alguien que no tocó nada.
//
// Tampoco se cachea por ejercicio a propósito: la explicación se pide cuando se
// toca el botón y se guarda en el estado de la vista que la muestra. El
// ejercicio siguiente es otro y la anterior no sirve para nada.

import { useMutation } from "@tanstack/react-query"
import { unwrap } from "@/lib/api/client"
import type { components } from "@/lib/api/schema"
import { useGameApi } from "./UseGameApi"

export type GameExplain = components["schemas"]["GameExplainOut"]

export function useExplainExercise() {
  const api = useGameApi()
  return useMutation({
    mutationFn: async (body: { exercise_id: number }) =>
      unwrap(await api.POST("/game/derivemos/explain", { body })),
  })
}
