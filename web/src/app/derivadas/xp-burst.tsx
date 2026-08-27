"use client"

// El festejo de acertar: la derivada estalla en círculos de colores y, un
// instante después, un imán en el ranking los va juntando de a uno sobre la XP
// de la fila propia. Cada círculo que llega vale 1 XP y suena el mismo tick que
// cuenta la experiencia en el resumen de sesión de Intervalo.
//
// El orden importa: primero llega toda la XP, y recién ahí el ranking estrena
// orden y la fila sube. Por eso `onComplete` es quien dispara la invalidación
// del ranking, y no la respuesta del servidor.

import { useCallback, useEffect, useRef, useState } from "react"
import { Confetti } from "@/components/confetti"
import { useTick } from "@/lib/audio/useSfx"
import type { GameAnswer } from "./UseGameExercise"

// Tope de partículas. Más allá el conteo se hace largo, así que cada círculo
// pasa a valer varios XP en vez de sumar círculos.
const MAX_PARTICLES = 40

// La recolección arranca después de que el ranking terminó de recentrar la fila
// propia: si empezara antes, el imán apuntaría a donde la fila ya no está.
const COLLECT_DELAY_MS = 550

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
    const count = Math.min(xp, MAX_PARTICLES)
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
      collect={{
        target: () => targetRef.current(),
        startDelayMs: COLLECT_DELAY_MS,
        onArrive: (i, p) => arriveRef.current(i, p),
      }}
    />
  )
}
