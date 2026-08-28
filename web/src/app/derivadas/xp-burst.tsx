"use client"

// El festejo de acertar: el ENUNCIADO desaparece y se rompe en orbes. Nacen
// repartidos a lo largo de la fórmula que los produjo, se abren por su propia
// caja y quedan suspendidos ahí, sin gravedad. Más tarde —en escritorio
// enseguida, en el teléfono cuando la persona pasa a la slide del ranking— un
// imán los levanta de a uno y cada llegada suma su parte de XP, con el mismo
// tick que cuenta la experiencia en el resumen de sesión de Intervalo.
//
// Que salgan de la derivada y no del botón es lo que le da sentido al gesto: lo
// que se convierte en puntos es el problema resuelto, no el botón que se apretó.
// Y por eso la fórmula se va: no se desvanece aparte de la explosión, ES la
// explosión.
//
// El movimiento vive en components/orb-scatter.tsx: se detienen porque se les
// acaba el envión, no porque un temporizador los congele.
//
// El orden importa: primero llega toda la XP, y recién ahí el ranking estrena
// orden y la fila sube. Por eso `onComplete` es quien dispara la invalidación
// del ranking, y no la respuesta del servidor.

import { useCallback, useEffect, useRef, useState } from "react"
import { OrbScatter, type Box } from "@/components/orb-scatter"
import { useTick } from "@/lib/audio/useSfx"
import type { GameAnswer } from "./UseGameExercise"

// Cuánta XP representa cada orbe. Antes era 1 a 1 y un acierto normal mandaba
// veinticinco: con el viaje directo eso es una fila de bolitas entrando al
// contador durante segundos. Repartida de a tres, la misma XP entra en un puñado
// que se lee de un vistazo y el conteo dura lo que tiene que durar. El total no
// cambia — `splitXp` reparte hasta el último punto.
const XP_PER_PARTICLE = 3
const MIN_PARTICLES = 4
const MAX_PARTICLES = 14

// Tope de la red de seguridad del `breaking`. Con la mesa real, la última bola
// despega antes del segundo y medio; esto es tres veces eso.
const BREAK_MAX_MS = 4500

// Alto mínimo de la franja donde nacen, por si la fórmula midiera casi nada.
const SEED_BAND = 14

type Burst = {
  seq: number
  // XP que tenía antes de este acierto; el conteo arranca acá.
  base: number
  total: number
  // Cuánto suma cada orbe al llegar (reparto parejo del total).
  chunks: number[]
  // La caja de la fórmula, en píxeles de viewport: los orbes nacen repartidos
  // adentro, no todos en un punto.
  from: Box
}

// Reparte `total` en `count` llegadas lo más parejo posible.
function splitXp(total: number, count: number): number[] {
  const floor = Math.floor(total / count)
  const extra = total % count
  return Array.from({ length: count }, (_, i) => floor + (i < extra ? 1 : 0))
}

/** El centro del destino, en el lugar donde va a QUEDAR.
 *
 * Se le descuentan las traslaciones de los ancestros. En el teléfono el imán se
 * suelta cuando la persona toca Continuar, o sea con la slide del ranking todavía
 * entrando por la derecha: en ese instante el contador está fuera de pantalla, y
 * apuntarle a donde está mandaría los orbes afuera para que después vuelvan.
 * Descontando el transform del pase, el destino es el mismo desde el primer frame
 * y los orbes viajan derecho mientras la slide entra.
 *
 * Descuenta CUALQUIER transform del camino, no solo el del pase. Es correcto
 * acá: los orbes son `fixed inset-0` y por eso ya está prohibido que este árbol
 * tenga transforms que no sean animaciones (un transform ancestro recortaría la
 * capa entera — ver components/orb-scatter.tsx). */
function centerOf(el: HTMLElement | null): { x: number; y: number } | null {
  if (!el) return null
  const r = el.getBoundingClientRect()
  if (r.width === 0 && r.height === 0) return null
  let x = r.left + r.width / 2
  let y = r.top + r.height / 2
  for (let node = el.parentElement; node; node = node.parentElement) {
    const t = getComputedStyle(node).transform
    if (!t || t === "none") continue
    const m = new DOMMatrix(t)
    x -= m.e
    y -= m.f
  }
  return { x, y }
}

/** La caja de la TINTA de la fórmula, dentro de la caja del enunciado.
 *
 * Se mide `.katex-base` y no `.katex`, que es lo primero que uno probaría: en
 * modo display KaTeX hace bloque tanto a `.katex` como a `.katex-html`, así que
 * las dos devuelven el ancho del canal entero (medido: 398 px para una fórmula
 * de 126). Con eso, los orbes nacerían a lo largo de una caja donde la fórmula
 * ocupa el tercio del medio — o sea, la mayoría saliendo de zonas vacías.
 *
 * Son varias porque una fórmula puede tener más de una base; se unen todas.
 *
 * Sin KaTeX montado vale la franja del medio del contenedor, que es donde la
 * fórmula habría estado. */
function formulaBox(host: HTMLElement | null): Box | null {
  if (!host) return null
  const outer = host.getBoundingClientRect()
  if (outer.width === 0) return null

  let ink: Box | null = null
  for (const el of host.querySelectorAll<HTMLElement>(".katex-base")) {
    const r = el.getBoundingClientRect()
    if (r.width === 0) continue
    ink = ink
      ? {
          left: Math.min(ink.left, r.left),
          right: Math.max(ink.right, r.right),
          top: Math.min(ink.top, r.top),
          bottom: Math.max(ink.bottom, r.bottom),
        }
      : { left: r.left, right: r.right, top: r.top, bottom: r.bottom }
  }
  if (ink) return ink

  const mid = outer.top + outer.height / 2
  return {
    left: outer.left,
    right: outer.right,
    top: mid - SEED_BAND / 2,
    bottom: mid + SEED_BAND / 2,
  }
}

export type XpBurst = ReturnType<typeof useXpBurst>

export function useXpBurst({ onComplete }: { onComplete?: () => void } = {}) {
  const tick = useTick()
  // La caja del enunciado —de donde salen los orbes y por la cual se
  // desparraman— y el destino del imán (la XP de la fila propia en el ranking).
  // Los pone el layout de cada plataforma.
  const promptRef = useRef<HTMLDivElement | null>(null)
  const targetRef = useRef<HTMLElement | null>(null)
  const [burst, setBurst] = useState<Burst | null>(null)
  const [collected, setCollected] = useState(0)
  const seqRef = useRef(0)
  const chunksRef = useRef<number[]>([])
  const doneRef = useRef(onComplete)
  useEffect(() => {
    doneRef.current = onComplete
  })

  // El festejo puede ocurrir en dos tiempos: los orbes se abren donde se acertó
  // y la recolección pasa en otra pantalla. Mientras esto es `true` se quedan
  // suspendidos y el imán no existe todavía.
  const [holding, setHolding] = useState(false)

  // Hay bolas en la mesa: se rompió y todavía queda alguna rodando o esperando
  // turno. Mientras dure, seguir al próximo ejercicio se llevaría puesto el
  // festejo a medio camino.
  //
  // Con red de seguridad: si por lo que sea el imán nunca llega a despachar
  // —destino que no se puede medir, por ejemplo— esto se apagaría solo igual. Un
  // botón que no se habilita nunca es peor que un festejo cortado.
  const [breaking, setBreaking] = useState(false)
  const breakTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => {
    if (breakTimerRef.current) clearTimeout(breakTimerRef.current)
  }, [])

  const onOrbsCleared = useCallback(() => {
    if (breakTimerRef.current) clearTimeout(breakTimerRef.current)
    setBreaking(false)
  }, [])

  const fire = useCallback((answer: GameAnswer, { hold = false } = {}) => {
    const xp = answer.xp_awarded
    if (xp <= 0) return
    setHolding(hold)
    // Solo cuando el festejo es de un tiempo. En el de dos, las bolas esperan a
    // que la persona toque Continuar: bloquear justamente ese botón sería
    // esperar a que pase lo que solo puede pasar apretándolo.
    setBreaking(!hold)
    if (breakTimerRef.current) clearTimeout(breakTimerRef.current)
    if (!hold) {
      breakTimerRef.current = setTimeout(() => setBreaking(false), BREAK_MAX_MS)
    }
    // El tope de arriba es por duración y el de abajo para que un acierto de
    // segundo intento igual se sienta; el `min` contra la XP evita repartos con
    // orbes de cero, que llegarían sin sumar nada.
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
      // xp_total menos lo otorgado: no depende de que la query del jugador ya se
      // haya refrescado.
      base: answer.xp_total - xp,
      total: xp,
      chunks,
      // Se mide ACÁ y no en el primer frame, al revés que el área: `fire` corre
      // dentro del onSuccess de la respuesta, o sea antes del commit que hace
      // desaparecer la fórmula. Un frame más tarde ya no habría nada que medir.
      //
      // Sin fórmula medible, una franja en el medio de la pantalla.
      from: formulaBox(promptRef.current) ?? {
        left: window.innerWidth * 0.35,
        right: window.innerWidth * 0.65,
        top: window.innerHeight * 0.42,
        bottom: window.innerHeight * 0.42 + SEED_BAND,
      },
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
  //
  // Este además IGNORA el null, como el `attachInput` de mobile-flow y
  // por exactamente el mismo motivo: con el volteo entre ejercicios la card vieja
  // y la nueva conviven un rato, y la vieja publica `null` al desmontarse DESPUÉS
  // de que la nueva ya publicó su caja. Con el ref pelado, del segundo ejercicio
  // en adelante no había caja que medir: los orbes salían del respaldo —una
  // franja en el medio de la pantalla— y caían en una línea contra el piso de
  // emergencia, fuera del enunciado.
  //
  // La caja vieja que queda colgada un instante es inofensiva: la próxima card
  // publica la suya antes de que haya nada que medir.
  const attachPrompt = useCallback((node: HTMLDivElement | null) => {
    if (node) promptRef.current = node
  }, [])
  const attachTarget = useCallback((node: HTMLElement | null) => {
    targetRef.current = node
  }, [])
  const magnetTarget = useCallback(() => centerOf(targetRef.current), [])

  // Por dónde se desparraman: la misma caja del enunciado, entera. La fórmula se
  // rompe y los pedazos quedan tirados adentro del recuadro donde estaba.
  //
  // Entera y no solo su borde de abajo: para cuando el primer orbe toca el piso,
  // la fórmula ya no está y la caja quedó vacía, así que se puede usar todo — a
  // lo largo y a lo ancho.
  const orbArea = useCallback((): Box | null => {
    const box = promptRef.current
    if (!box) return null
    const r = box.getBoundingClientRect()
    if (r.width === 0) return null
    return { left: r.left, right: r.right, top: r.top, bottom: r.bottom }
  }, [])

  // Suelta el imán: lo llama la pantalla que TIENE el destino, cuando ya está en
  // su lugar. Sin destino medible los orbes se quedarían suspendidos para
  // siempre, así que quien llama es también quien garantiza que el contador de
  // XP existe.
  const release = useCallback(() => setHolding(false), [])

  return {
    // Los orbes están suspendidos a la espera del imán.
    holding,
    release,
    // XP a mostrar en la fila propia. Queda en el valor final tras el conteo: si
    // volviera a null habría un parpadeo hacia el valor viejo mientras el
    // ranking se refresca.
    liveXp: burst === null ? null : burst.base + collected,
    // Mientras esto sea true el conteo MANDA sobre el dato del ranking: si no,
    // una lista ya refrescada mostraría el total desde el primer orbe y el
    // número no subiría nunca.
    counting: burst !== null && collected < burst.total,
    burst,
    onArrive,
    onOrbsCleared,
    breaking,
    orbArea,
    fire,
    attachPrompt,
    attachTarget,
    magnetTarget,
  }
}

// Se renderiza SIEMPRE fuera de contenedores con transform: es `fixed inset-0` y
// un transform ancestro lo recortaría (ver components/orb-drop.tsx).
//
// Recibe las piezas sueltas y no el objeto del hook: pasar el objeto entero hace
// que cualquier lectura suya cuente como acceso a un ref durante el render.
export function XpOrbs({
  burst,
  target,
  area,
  onArrive,
  onCleared,
  holding = false,
}: {
  burst: XpBurst["burst"]
  target: XpBurst["magnetTarget"]
  area: XpBurst["orbArea"]
  onArrive: XpBurst["onArrive"]
  onCleared: XpBurst["onOrbsCleared"]
  // Mientras sea true no se le pasa `collect`: los orbes se quedan apoyados
  // donde cayeron hasta que la pantalla del destino las suelte.
  holding?: boolean
}) {
  // Los handlers cambian de identidad en cada render (el contador sube muchas
  // veces por festejo); el objeto `collect` se arma una sola vez por tanda para
  // no reiniciar la animación.
  const targetRef = useRef(target)
  const arriveRef = useRef(onArrive)
  useEffect(() => {
    targetRef.current = target
    arriveRef.current = onArrive
  })

  if (!burst) return null
  return (
    <OrbScatter
      key={burst.seq}
      count={burst.chunks.length}
      from={burst.from}
      area={area}
      onCleared={onCleared}
      collect={
        holding
          ? undefined
          : {
              target: () => targetRef.current(),
              onArrive: (i, p) => arriveRef.current(i, p),
            }
      }
    />
  )
}
