"use client"

// El festejo de acertar: el ranking recentra la fila propia y un puñado de
// círculos sale desde la respuesta derecho al contador de XP, de a uno. Cada
// llegada suma su parte y suena el mismo tick que cuenta la experiencia en el
// resumen de sesión de Intervalo.
//
// El estallido es suave y compacto: se abre alrededor de la respuesta y se
// queda ahí. A fuerza plena ocupaba la pantalla entera durante medio segundo
// para después juntar todo en un punto — mucho ruido para un acierto que puede
// repetirse cada quince segundos, y encima tapaba el ranking, que es adonde hay
// que mirar. El resumen de sesión de Intervalo sí usa la fuerza plena: ahí el
// festejo es el final de algo, no un paso más.
//
// El orden importa: primero llega toda la XP, y recién ahí el ranking estrena
// orden y la fila sube. Por eso `onComplete` es quien dispara la invalidación
// del ranking, y no la respuesta del servidor.

import { useCallback, useEffect, useRef, useState } from "react"
import { Confetti } from "@/components/confetti"
import { useTick } from "@/lib/audio/useSfx"
import type { GameAnswer } from "./UseGameExercise"

// Cuánta XP representa cada círculo. Antes era 1 a 1 y un acierto normal
// mandaba veinticinco: con el viaje directo eso es una fila de bolitas
// entrando al contador durante segundos. Repartida de a tres, la misma XP entra
// en un puñado que se lee de un vistazo y el conteo dura lo que tiene que
// durar. El total no cambia — `splitXp` reparte hasta el último punto.
const XP_PER_PARTICLE = 3
const MIN_PARTICLES = 4
const MAX_PARTICLES = 14

// Fuerza del estallido (ver Confetti :: power). Con el frenado del aire, a este
// valor la nube se abre y frena dentro de un radio chico alrededor del campo en
// vez de irse a los bordes de la pantalla.
const BURST_POWER = 0.14

// La recolección arranca después de que el ranking terminó de recentrar la fila
// propia: si empezara antes, el imán apuntaría a donde la fila ya no está. Y
// tiene que darle tiempo al estallido a abrirse, si no se lo lleva a medio
// desplegar.
const COLLECT_DELAY_MS = 420

type Burst = {
  seq: number
  // XP que tenía antes de este acierto; el conteo arranca acá.
  base: number
  total: number
  // Cuánto suma cada círculo al llegar (reparto parejo del total).
  chunks: number[]
  origin: { x: number; y: number }
}

// Reparte `total` en `count` llegadas lo más parejo posible.
function splitXp(total: number, count: number): number[] {
  const floor = Math.floor(total / count)
  const extra = total % count
  return Array.from({ length: count }, (_, i) => floor + (i < extra ? 1 : 0))
}

function centerOf(el: HTMLElement | null): { x: number; y: number } | null {
  if (!el) return null
  const r = el.getBoundingClientRect()
  if (r.width === 0 && r.height === 0) return null
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
}

export type XpBurst = ReturnType<typeof useXpBurst>

export function useXpBurst({ onComplete }: { onComplete?: () => void } = {}) {
  const tick = useTick()
  // Dónde nace el estallido (la card del ejercicio) y a dónde va el imán (la XP
  // de la fila propia en el ranking). Los pone el layout de cada plataforma.
  const originRef = useRef<HTMLDivElement | null>(null)
  const targetRef = useRef<HTMLElement | null>(null)
  const [burst, setBurst] = useState<Burst | null>(null)
  const [collected, setCollected] = useState(0)
  const seqRef = useRef(0)
  const chunksRef = useRef<number[]>([])
  const doneRef = useRef(onComplete)
  useEffect(() => {
    doneRef.current = onComplete
  })

  const fire = useCallback((answer: GameAnswer) => {
    const xp = answer.xp_awarded
    if (xp <= 0) return
    // El tope de arriba es por duración y el de abajo para que un acierto de
    // segundo intento igual se sienta; el `min` contra la XP evita repartos con
    // círculos de cero, que llegarían sin sumar nada.
    const count = Math.min(
      xp,
      Math.max(MIN_PARTICLES, Math.min(MAX_PARTICLES, Math.round(xp / XP_PER_PARTICLE))),
    )
    const chunks = splitXp(xp, count)
    chunksRef.current = chunks
    seqRef.current += 1
    setCollected(0)
    setBurst({
      seq: seqRef.current,
      // xp_total menos lo otorgado: no depende de que la query del jugador ya
      // se haya refrescado.
      base: answer.xp_total - xp,
      total: xp,
      chunks,
      // En % de viewport, que es la unidad de Confetti. Sin card medible, el
      // centro de la pantalla.
      origin: (() => {
        const c = centerOf(originRef.current)
        if (!c) return { x: 50, y: 45 }
        return {
          x: (c.x / window.innerWidth) * 100,
          y: (c.y / window.innerHeight) * 100,
        }
      })(),
    })
  }, [])

  const onArrive = useCallback(
    (index: number, progress: number) => {
      tick(0.9 + progress * 0.6)
      setCollected((c) => c + (chunksRef.current[index] ?? 1))
      if (index === chunksRef.current.length - 1) doneRef.current?.()
    },
    [tick],
  )

  // Se devuelven ref callbacks y no los refs: un objeto que contiene refs hace
  // que cualquier lectura suya cuente como acceso a un ref durante el render.
  const attachOrigin = useCallback((node: HTMLDivElement | null) => {
    originRef.current = node
  }, [])
  const attachTarget = useCallback((node: HTMLElement | null) => {
    targetRef.current = node
  }, [])
  const magnetTarget = useCallback(() => centerOf(targetRef.current), [])

  return {
    // XP a mostrar en la fila propia. Queda en el valor final tras el conteo:
    // si volviera a null habría un parpadeo hacia el valor viejo mientras el
    // ranking se refresca.
    liveXp: burst === null ? null : burst.base + collected,
    // Mientras esto sea true el conteo MANDA sobre el dato del ranking: si no,
    // una lista ya refrescada mostraría el total desde la primera bolita y el
    // número no subiría nunca.
    counting: burst !== null && collected < burst.total,
    burst,
    onArrive,
    fire,
    attachOrigin,
    attachTarget,
    magnetTarget,
  }
}

// Se renderiza SIEMPRE fuera de contenedores con transform: es `fixed inset-0`
// y un transform ancestro lo recortaría (ver components/confetti.tsx).
//
// Recibe las piezas sueltas y no el objeto del hook: pasar el objeto entero hace
// que cualquier lectura suya cuente como acceso a un ref durante el render.
export function XpBurstConfetti({
  burst,
  target,
  onArrive,
}: {
  burst: XpBurst["burst"]
  target: XpBurst["magnetTarget"]
  onArrive: XpBurst["onArrive"]
}) {
  // Los handlers cambian de identidad en cada render (el contador sube muchas
  // veces por festejo); el objeto `collect` se arma una sola vez por estallido
  // para no reiniciar la animación.
  const targetRef = useRef(target)
  const arriveRef = useRef(onArrive)
  useEffect(() => {
    targetRef.current = target
    arriveRef.current = onArrive
  })

  if (!burst) return null
  return (
    <Confetti
      key={burst.seq}
      count={burst.chunks.length}
      shape="circle"
      origin={burst.origin}
      power={BURST_POWER}
      collect={{
        target: () => targetRef.current(),
        startDelayMs: COLLECT_DELAY_MS,
        onArrive: (i, p) => arriveRef.current(i, p),
      }}
    />
  )
}
