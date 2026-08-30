"use client"

import { useCallback, useRef, useState } from "react"
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

// El ejercicio de después, pedido antes de que lo pidan.
//
// POR QUÉ. El color de la respuesta ya es instantáneo (local-verdict.ts), pero
// Continuar seguía costando un viaje entero: se tocaba el botón y recién ahí
// salía el `/next`. Con el festejo de la XP de por medio hay dos segundos largos
// de tiempo muerto en los que ese pedido puede ir y volver sin que nadie espere.
//
// CUÁNDO SE PUEDE. Solo después de ACERTAR, y no es un detalle de implementación:
// `/next` devuelve el ejercicio abierto si hay uno (game/router.py, la guarda de
// los diez minutos que cierra el volver a tirar hasta que salga una fácil). Un
// ejercicio se cierra únicamente acertando —`closed = correct`—, así que este es
// el único instante del juego en el que pedir otro devuelve otro. Errar no
// alcanza: el ejercicio sigue abierto y el pedido volvería con el mismo.
//
// LO QUE NO SE ROMPE. La misma idempotencia garantiza que el ejercicio
// adelantado es EXACTAMENTE el que se va a consumir, así que esto no reabre el
// agujero que esa guarda cierra. Y el θ ya está actualizado cuando `/answer`
// contesta, así que la plantilla se elige con el Elo nuevo, no con el viejo.
//
// SI SE ABANDONA. Cerrar la pestaña entre el acierto y el Continuar deja un
// ejercicio servido que nadie respondió. No se pierde: al volver, `/next` lo
// devuelve por la misma guarda. El único costo visible es que las teclas que esa
// derivada desbloquea ya quedaron desbloqueadas, así que su destello de tecla
// nueva no vuelve a correr.
export function useEjercicioAdelantado() {
  const api = useGameApi()
  // Se guarda la PROMESA y no el resultado: así "ya llegó", "sigue en vuelo" y
  // "falló" se consumen por el mismo camino, sin que quien llama tenga que
  // preguntar en cuál de los tres está.
  const caja = useRef<Promise<GameExercise> | null>(null)
  // Solo para el botón: mientras se espera un adelanto que todavía no llegó,
  // Continuar tiene que seguir deshabilitándose como se deshabilitaba antes.
  const [esperando, setEsperando] = useState(false)

  // Pedido propio y no la mutación del layout: `next.isPending` es lo que apaga
  // el botón de Continuar, y compartir la instancia lo habría apagado durante el
  // adelanto —o sea justo mientras la persona mira el acierto y va a tocarlo.
  const adelantar = useCallback(() => {
    if (caja.current !== null) return
    const promesa = (async () =>
      unwrap(await api.POST("/game/derivemos/next")))()
    caja.current = promesa
    // Adelantarse es una mejora, no un requisito: si falla se descarta y el
    // camino de siempre hace el pedido cuando toque.
    promesa.catch(() => {
      if (caja.current === promesa) caja.current = null
    })
  }, [api])

  /** El adelantado, vaciando la caja: dos llamadas seguidas, la segunda es null. */
  const consumir = useCallback(() => {
    const promesa = caja.current
    caja.current = null
    if (promesa !== null) setEsperando(true)
    return promesa
  }, [])

  const servido = useCallback(() => setEsperando(false), [])

  /** Para cuando el servidor movió el piso: un 409 o un reinicio de progreso
   *  vencen lo servido, así que lo adelantado ya no vale. */
  const descartar = useCallback(() => {
    caja.current = null
    setEsperando(false)
  }, [])

  return { adelantar, consumir, servido, descartar, esperando }
}
