"use client"

// Falso mientras el navegador tiene trabajo urgente, verdadero para siempre
// después.
//
// PARA QUÉ. Al abrir el juego salen diez pedidos al servidor en el mismo
// instante —medido el 28/09: `player`, `bienvenida`, `me`, `events`,
// `leaderboard`, `summary`, `universities`, `pulse` y dos de `cta`, todos entre
// los 6.644 y los 6.964 ms— y solo dos de ellos tienen que estar para dibujar
// la primera pantalla. Los otros son precalentamientos, puestos a propósito y
// con el motivo escrito en cada sitio: la lista de universidades está tibia
// desde el arranque para que la primera vuelta universitaria no caiga sobre un
// esqueleto, y las novedades se piden siempre para que al decidir el dato ya
// esté.
//
// O sea que no sobran: lo que está mal es que salgan JUNTO con los dos que
// trancan la pantalla. Diez pedidos simultáneos compiten por los mismos workers
// de uvicorn y por la misma base, y el que la persona está esperando hace cola
// detrás de ocho que no.
//
// Esto no los saca, los corre. El backend hace el mismo trabajo un segundo
// después.

import { useEffect, useState } from "react"

// Techo del `requestIdleCallback` y espera del camino de respaldo. Dos segundos
// es más que el hueco que hay hasta que alguien toca algo —la mediana de lo que
// tarda una respuesta es de 19 s— y bastante menos que cualquier cosa que se
// note.
const TECHO_MS = 2_000
const RESPALDO_MS = 1_200

type ConIdle = Window & {
  requestIdleCallback?: (cb: () => void, opciones?: { timeout: number }) => number
  cancelIdleCallback?: (id: number) => void
}

export function useDespuesDelArranque(): boolean {
  const [listo, setListo] = useState(false)
  useEffect(() => {
    const w = window as ConIdle
    // Safari no tuvo `requestIdleCallback` hasta la 16.4 y iOS es un tercio de
    // la base, así que el respaldo no es decorativo.
    if (typeof w.requestIdleCallback === "function") {
      const id = w.requestIdleCallback(() => setListo(true), { timeout: TECHO_MS })
      return () => w.cancelIdleCallback?.(id)
    }
    const t = setTimeout(() => setListo(true), RESPALDO_MS)
    return () => clearTimeout(t)
  }, [])
  return listo
}
