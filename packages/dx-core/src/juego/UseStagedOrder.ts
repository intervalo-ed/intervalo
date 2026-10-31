"use client"

// El reacomodo del ranking de a un cruce por vez. Vivía en
// web/src/app/derivadas/game-ranking.tsx; está acá para que lo use también la
// app nativa. La aritmética está en `ranking-orden.ts`.

import { useEffect, useMemo, useRef, useState, type RefObject } from "react"
import type { GameLeaderboardEntry } from "./UseGameLeaderboard"
import { mismoOrden, swapsToReach } from "./ranking-orden"

// Cada cuánto se aplica UN reordenamiento. El pulso trae los datos cada 10 s, así
// que hay lugar de sobra para desarmar una tanda en varios pasos sin que se
// solape con la siguiente.
const SWAP_MS = 420

// Más que esto no es una historia, es un revuelo: cuando la tanda trae demasiados
// cruces, se aplica de una. Verlos de a uno tardaría más que el próximo pulso y
// además nadie sigue catorce movimientos seguidos.
const MAX_SWAPS = 14

/** Muestra la lista aplicando UN reordenamiento por vez.
 *
 * Los datos llegan todos juntos con cada pulso —la XP de cada fila se actualiza
 * al toque— pero el ORDEN se acomoda de a un cruce, con una pausa entre uno y
 * otro. Sin esto, una tanda con cinco cambios mueve cinco filas a la vez y no se
 * entiende quién pasó a quién; de a uno, cada movimiento se lee.
 *
 * Solo se escalona el orden. Si cambia el CONJUNTO de jugadores (entró o salió
 * alguien de la ventana, o se cambió de filtro) no hay cruces que contar y se
 * aplica de una: un alta no es un sobrepaso.
 *
 * `pausadoRef` lo calla mientras la fila propia está escalando. Los dos mueven
 * las mismas tarjetas por motivos distintos —uno cuenta lo que hizo el jugador,
 * el otro lo que hizo el mundo— y encimados no se lee ninguno de los dos. El
 * mundo espera: cuando la escalada termina, el reacomodo aplica lo que se
 * acumuló, que es para lo que existe la cola. */
export function useStagedOrder({
  entries,
  pausadoRef,
}: {
  entries: GameLeaderboardEntry[]
  pausadoRef: RefObject<boolean>
}): GameLeaderboardEntry[] {
  const [orderIds, setOrderIds] = useState<number[]>([])
  const targetRef = useRef<number[]>([])
  const orderRef = useRef<number[]>([])
  const queueRef = useRef<number[]>([])

  const byId = useMemo(
    () => new Map(entries.map((e) => [e.player_id, e])),
    [entries],
  )

  // El orden efectivo: hasta que el intervalo lo llene, el que viene del
  // servidor. Derivado y no un setState en efecto —que el compilador rechaza— y
  // de paso evita que la lista parpadee vacía en el primer render.
  //
  // Memoizado para que su identidad sea estable: es la dependencia de la lista
  // final, y sin esto había que compararlo armando un `join(",")` de todos los
  // ids en cada render.
  const shownIds = useMemo(() => {
    const ids = entries.map((e) => e.player_id)
    if (orderIds.length === 0) return ids
    // Si cambió el CONJUNTO —se puso o se sacó un filtro, entró o salió alguien
    // de la ventana— el orden escalonado no aplica: no hay cruces que contar.
    // Es la misma regla que el intervalo de abajo, aplicada acá en vez de
    // esperar a que el intervalo la note.
    //
    // Esperar costaba una lista MAL DIBUJADA los 420 ms del tick: el orden viejo
    // se mapea contra los datos nuevos y lo que no está en los dos se cae, así
    // que filtrar por una universidad sin gente en común con lo que se estaba
    // mirando dejaba la lista vacía y después se llenaba sola. Justo el gesto
    // en el que la persona está mirando si el filtro hizo algo.
    const previos = new Set(orderIds)
    if (ids.length !== orderIds.length || ids.some((id) => !previos.has(id)))
      return ids
    return orderIds
  }, [orderIds, entries])

  useEffect(() => {
    targetRef.current = entries.map((e) => e.player_id)
    orderRef.current = shownIds
  })

  useEffect(() => {
    const id = setInterval(() => {
      // Con la pestaña tapada no hay a quién contarle el sobrepaso, y este
      // intervalo es de los pocos que corren toda la sesión: en escritorio el
      // ranking queda montado de principio a fin.
      // En la app nativa no hay `document`.
      const doc = (globalThis as { document?: { hidden?: boolean } }).document
      if (doc?.hidden) return
      // El salto manda: mientras dura, el orden no lo toca nadie más. Pero la
      // cola se deja ALINEADA con lo que el salto está mostrando, que es el
      // orden del servidor: sin esto, al terminar el salto la lista volvía de un
      // golpe al orden viejo para recién ahí caminar de a un cruce hasta el
      // nuevo, o sea que el reacomodo deshacía a ojos vista lo que el salto
      // acababa de hacer.
      if (pausadoRef.current) {
        if (!mismoOrden(targetRef.current, orderRef.current)) {
          queueRef.current = []
          setOrderIds(targetRef.current)
        }
        return
      }

      const target = targetRef.current
      const actual = orderRef.current
      if (target.length === 0) return

      // La salida temprana: casi siempre el orden ya está donde tiene que estar
      // y no hay nada que hacer. Sin esto, cada latido pagaba el `includes` de
      // abajo —que es cuadrático— sobre las hasta noventa filas que puede tener
      // una lista scrolleada, dos veces y media por segundo, para nada.
      if (queueRef.current.length === 0 && mismoOrden(target, actual)) return

      // ¿Cambió el conjunto? Entonces no hay cruces: se aplica entero.
      const mismoConjunto =
        target.length === actual.length && target.every((x) => actual.includes(x))
      if (!mismoConjunto) {
        queueRef.current = []
        setOrderIds(target)
        return
      }

      if (queueRef.current.length === 0) {
        const pasos = swapsToReach(actual, target)
        if (pasos.length === 0) return
        if (pasos.length > MAX_SWAPS) {
          setOrderIds(target)
          return
        }
        queueRef.current = pasos
      }

      const i = queueRef.current.shift() as number
      setOrderIds((prev) => {
        const base = prev.length > 0 ? prev : actual
        if (i + 1 >= base.length) return base
        const next = [...base]
        const t = next[i]
        next[i] = next[i + 1]
        next[i + 1] = t
        return next
      })
    }, SWAP_MS)
    return () => clearInterval(id)
    // `pausadoRef` es un ref: su identidad no cambia nunca y meterlo acá no
    // agrega nada más que ruido.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Los datos son SIEMPRE los últimos; lo único escalonado es el orden.
  return useMemo(
    () => shownIds.map((id) => byId.get(id)).filter((e): e is GameLeaderboardEntry => !!e),
    [shownIds, byId],
  )
}
