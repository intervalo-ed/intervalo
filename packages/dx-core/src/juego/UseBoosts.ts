"use client"

// Los hooks del cartel de empujes. Vivían en web/src/components/boost-banner.tsx;
// están acá para que el cartel de la app nativa cuente igual que el de la web.

import { useEffect, useMemo, useState } from "react"
import type { EmpujeVigente } from "./ranking-formato"

// Cuántos empujes entran en el cartel. Cuatro y no tres: van de a DOS por fila,
// así que un número impar deja siempre un hueco al lado del último. Con dos
// filas llenas el cartel sigue siendo una cabecera; de ahí para arriba se
// convierte en una lista y le come el lugar a lo que la gente vino a mirar.
export const BOOSTS_SHOWN = 4

/** Cuenta regresiva de un empuje.
 *
 * Arranca de los segundos que mandó el servidor y descuenta sola, así el reloj
 * no necesita que le manden un instante con zona horaria.
 *
 * Descuenta contra un VENCIMIENTO absoluto, no restándole el paso a un
 * contador. Los dos motivos son la misma cosa —lo que se muestra tiene que ser
 * el tiempo que falta de verdad— vista desde dos lados:
 *
 *  · Un tick por segundo, siempre. Hubo un paso de 30 s arriba de la hora,
 *    cuando el formato de ese tramo no mostraba segundos; ahora los muestra
 *    (ver `fmtRemaining`), así que un paso más largo dejaría el segundero
 *    saltando de a treinta y el reloj se leería roto.
 *  · El navegador (y el sistema, con la app en segundo plano) estrangula los
 *    timers. Restando el paso, cada tick que no corre es tiempo que el cartel
 *    nunca descuenta; leyendo el reloj en cada tick, volver muestra el número
 *    correcto sin importar cuántos se perdieron.
 *
 * La resincronización contra el servidor NO se hace acá adentro: el chip se
 * remonta con una `key` que incluye los segundos que mandó, y al remontarse
 * estos `useState` se reinicializan solos. Es el reset de estado por key de
 * siempre, y evita el `setLeft(...)` sincrónico dentro del efecto que el
 * compilador de React no permite (react-hooks/set-state-in-effect). */
export function useCountdown({ initialSeconds }: { initialSeconds: number }): number {
  const [vence] = useState(() => Date.now() + Math.max(0, initialSeconds) * 1000)
  const [left, setLeft] = useState(() => Math.max(0, initialSeconds))

  useEffect(() => {
    if (left <= 0) return
    // `setTimeout` y no `setInterval`: el efecto se re-arma en cada tick, así
    // que el próximo se agenda recién cuando el anterior terminó y dos ticks no
    // se pueden encimar si el reloj se atrasa.
    const id = setTimeout(
      () => setLeft(Math.max(0, Math.round((vence - Date.now()) / 1000))),
      1_000,
    )
    return () => clearTimeout(id)
  }, [left, vence])

  return left
}

/** Siglas con empuje vigente y su multiplicador, para pintar las filas.
 *
 * Se calcula una vez por lista y se pasa a las filas: recorrer esta lista
 * adentro de cada fila sería hacer el mismo trabajo veinte veces para leer el
 * mismo dato. */
export function useBoostMultipliers(boosts: EmpujeVigente[]): Map<string, number> {
  // El empuje global no entra: acá se marcan las filas de las universidades
  // impulsadas, y si le tocara a TODAS la marca dejaría de distinguir nada —
  // sería una pared encendida en vez de una comparación. El chip de "TODOS" ya
  // lo cuenta por su lado.
  return useMemo(() => {
    const m = new Map<string, number>()
    for (const b of boosts) if (b.university) m.set(b.university, b.multiplier)
    return m
  }, [boosts])
}

/** Los empujes que entran en el cartel, en orden. La propia primero aunque
 *  tenga el multiplicador más bajo: es la que la persona necesita ver. */
export function empujesAMostrar({
  boosts,
  myUniversity,
}: {
  boosts: EmpujeVigente[]
  myUniversity: string | null
}): EmpujeVigente[] {
  const ordered = [...boosts].sort((a, b) => {
    const am = a.university === myUniversity ? 1 : 0
    const bm = b.university === myUniversity ? 1 : 0
    return bm - am || b.multiplier - a.multiplier
  })
  return ordered.slice(0, BOOSTS_SHOWN)
}

export function useEmpujesAMostrar({
  boosts,
  myUniversity,
}: {
  boosts: EmpujeVigente[]
  myUniversity: string | null
}): EmpujeVigente[] {
  return useMemo(() => empujesAMostrar({ boosts, myUniversity }), [boosts, myUniversity])
}
