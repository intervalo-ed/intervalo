"use client"

// El pulso blanco que marca que una tecla de pantalla acaba de ACTUAR porque se
// tocó su tecla física. Nació en las flechas de «¿Por qué?» (porque-panel.tsx:
// w y s) y ahora lo usan también las teclas del teclado de escritorio que tienen
// atajo (math-keyboard.tsx). Golpe rápido y salida lenta —mismo criterio que el
// destello de Revisar en exercise-card.tsx (`FLASH_IN`/`FLASH_OUT`)—: así se
// lee como un pulso y no como un cambio de estado que se queda.

import { useEffect, useState } from "react"

export const PULSO_MS = 120
export const PULSO_IN = "40ms"
export const PULSO_OUT = "260ms"

/** Activo mientras el último pulso no se haya "asentado".
 *
 *  Misma mecánica que `useMoment` en exercise-card.tsx. Al no depender de un
 *  booleano externo que cambie, alcanza con que `seq` no sea el inicial (0 =
 *  todavía ningún pulso) y no coincida con el último asentado — así una segunda
 *  pulsada de la MISMA tecla reinicia la animación en vez de quedarse sin
 *  disparar, que es lo que pasaría si el estado "activo" no cambiara de valor. */
export function usePulsoActivo(seq: number, ms: number = PULSO_MS): boolean {
  const [asentado, setAsentado] = useState(0)
  const activo = seq !== 0 && asentado !== seq
  useEffect(() => {
    if (!activo) return
    const t = setTimeout(() => setAsentado(seq), ms)
    return () => clearTimeout(t)
  }, [activo, seq, ms])
  return activo
}

/** La capa blanca, para apoyar dentro de un botón `relative overflow-hidden`.
 *  Lo que tiene que seguir leyéndose encima lleva `relative z-10`. */
export function PulsoBlanco({ seq }: { seq: number }) {
  const on = usePulsoActivo(seq)
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-0 bg-white"
      style={{
        opacity: on ? 0.7 : 0,
        transitionProperty: "opacity",
        transitionDuration: on ? PULSO_IN : PULSO_OUT,
      }}
    />
  )
}
