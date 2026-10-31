"use client"

// El festejo de acertar: el número de XP de la fila propia se llena, paso a
// paso, cambiando de color en cada uno.
//
// El conteo es UNO SOLO —los mismos pasos, la misma rampa que acelera, el mismo
// tick que sube de tono, los mismos colores— pero lo empujan dos motores
// distintos según la pantalla:
//
// · En escritorio lo empujan los ORBES. La fórmula se rompe y los pedazos salen
//   volando hacia el contador; cada llegada es un paso (ver orb-flight.tsx). El
//   ejercicio y el contador están a la vista al mismo tiempo, así que se puede
//   mostrar de dónde sale la XP y adónde va.
// · En el teléfono lo empuja un RELOJ. Ahí el contador vive en la pantalla
//   siguiente: cuando la persona toca Continuar, el conteo arranca solo, medio
//   segundo después. No hay nada que pueda volar de una pantalla a la otra sin
//   mentir sobre dónde estaba la XP mientras tanto.
//
// Y mientras dura, el número y su ícono se prenden del verde de haber acertado:
// el mismo con el que destella la respuesta correcta que produjo esa XP. No es
// decoración, es lo que ata las dos mitades del festejo — la respuesta se pone
// verde y el contador se pone del mismo verde mientras se llena, así que se lee
// como una sola cosa que pasó y no como dos que coincidieron.
//
// El orden importa: primero entra toda la XP y recién ahí el ranking estrena
// orden y la fila sube. Por eso `onComplete` es quien dispara la invalidación del
// ranking, y no la respuesta del servidor.

import { useCallback, useRef, useState } from "react"
import type { Box } from "@/components/orb-flight"
import { useTick } from "@/lib/audio/useSfx"
import {
  useXpConteo as useXpConteoMotor,
  type ModoDeConteo,
} from "@intervalo/dx-core/juego/UseXpConteo"
import { VERDE_ACIERTO } from "./exercise-card"
import { coloresDelFestejo } from "@intervalo/dx-core/juego/xp-pasos"

// El motor —pasos, reloj del teléfono, reconciliación, aborto, salvavidas— vive
// en dx-core (juego/UseXpConteo.ts) porque lo comparte la app nativa. Acá queda
// lo que es de escritorio: medir la fórmula y el destino en el DOM y armar la
// tanda de orbes.
export type { ModoDeConteo }

// El color del conteo: el verde del acierto, importado de donde ya vivía en vez
// de copiado. Si algún día ese verde cambia, cambia en los dos lados a la vez,
// que es todo el punto de que sean el mismo.
const COLOR_DEL_CONTEO = VERDE_ACIERTO

/** El centro del destino, en el lugar donde va a QUEDAR.
 *
 * Se le descuentan las traslaciones de los ancestros: si el contador está
 * viajando —porque el ranking está recentrando la fila propia por esta misma
 * respuesta— apuntarle a donde está ahora mandaría los orbes a donde ya no va a
 * estar. Descontando el transform, el destino es el mismo desde el primer frame.
 *
 * Descuenta CUALQUIER transform del camino, no solo el de una animación puntual.
 * Es correcto acá: los orbes son `fixed inset-0` y por eso ya está prohibido que
 * ese árbol tenga transforms que no sean animaciones. */
function centerOf(el: HTMLElement | null): { x: number; y: number } | null {
  if (!el) return null
  // **`isConnected` y no solo la medida.** `attachTarget` guarda el nodo que le
  // pasa la fila propia del ranking, y cuando esa fila se desmonta —el ranking
  // cambió de orden, se repaginó, o la fila se fue de la página cargada— el ref
  // se queda con el nodo VIEJO, ya fuera del documento. Un nodo desmontado mide
  // 0×0, así que el `return null` de abajo lo atrapaba igual; se chequea
  // explícito porque «está desmontado» y «todavía no se midió» son dos cosas
  // distintas y solo una de las dos se arregla esperando.
  if (!el.isConnected) return null
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

// Alto mínimo de la franja donde nacen, por si la fórmula midiera casi nada.
const FRANJA = 14

/** La caja de la TINTA de la fórmula, dentro de la caja del enunciado.
 *
 * Se mide `.katex-base` y no `.katex`, que es lo primero que uno probaría: en
 * modo display KaTeX hace bloque tanto a `.katex` como a `.katex-html`, así que
 * las dos devuelven el ancho del canal entero (medido: 398 px para una fórmula de
 * 126). Con eso, los orbes nacerían a lo largo de una caja donde la fórmula ocupa
 * el tercio del medio — o sea, la mayoría saliendo de zonas vacías.
 *
 * Son varias porque una fórmula puede tener más de una base; se unen todas.
 *
 * Sin KaTeX montado vale la franja del medio del contenedor, que es donde la
 * fórmula habría estado. */
function formulaBox(host: HTMLElement | null): Box | null {
  if (!host) return null
  const outer = host.getBoundingClientRect()
  if (outer.width === 0) return null

  let tinta: Box | null = null
  for (const el of host.querySelectorAll<HTMLElement>(".katex-base")) {
    const r = el.getBoundingClientRect()
    if (r.width === 0) continue
    tinta = tinta
      ? {
          left: Math.min(tinta.left, r.left),
          right: Math.max(tinta.right, r.right),
          top: Math.min(tinta.top, r.top),
          bottom: Math.max(tinta.bottom, r.bottom),
        }
      : { left: r.left, right: r.right, top: r.top, bottom: r.bottom }
  }
  if (tinta) return tinta

  const medio = outer.top + outer.height / 2
  return {
    left: outer.left,
    right: outer.right,
    top: medio - FRANJA / 2,
    bottom: medio + FRANJA / 2,
  }
}

/** Lo que la capa de orbes necesita para armar una tanda. */
export type Vuelo = {
  // Cambia con cada acierto: es la key que reinicia la animación.
  seq: number
  count: number
  from: Box
  // Uno por orbe. Se sortean acá y no en la capa porque dependen de CÓMO salió el
  // ejercicio —cuánta XP pagó, cuántos intentos costó—, que es información de la
  // respuesta y no del dibujo.
  colores: string[]
}

export type XpConteo = ReturnType<typeof useXpConteo>

export function useXpConteo({ onComplete }: { onComplete?: () => void } = {}) {
  const tick = useTick()
  const motor = useXpConteoMotor({ tick, color: COLOR_DEL_CONTEO, onComplete })
  const [vuelo, setVuelo] = useState<Vuelo | null>(null)

  const { fireProvisional: dispararMotor, abort: abortarMotor } = motor
  const seqRef = useRef(0)
  const promptRef = useRef<HTMLDivElement | null>(null)
  const targetRef = useRef<HTMLElement | null>(null)
  // El destino de respaldo: la columna del ranking. Ver `magnetTarget`.
  const respaldoRef = useRef<HTMLElement | null>(null)

  /** Arranca el festejo con una XP TODAVÍA NO CONFIRMADA por el servidor: la
   *  llama el veredicto local en el instante en que dice "correcto", sin
   *  esperar el viaje a `/answer` (ver xp-estimate.ts). `reconcile` ajusta el
   *  número real cuando esa respuesta llega, y `abort` lo desarma si el
   *  servidor termina en desacuerdo — casos rarísimos por diseño de
   *  `local-verdict.ts`, no el camino esperable.
   *
   *  `base` queda en `null` (no en `xp_total - xp` como antes: eso todavía no
   *  se sabe) hasta que `reconcile` lo fija; `liveXp` ya sabe leer ese `null`
   *  como "no mostrar todavía". */
  const fireProvisional = useCallback(
    (
      xp: number,
      { modo, intento, multiplicador }: { modo: ModoDeConteo; intento: number; multiplicador: number },
    ) => {
      const cuantos = dispararMotor(xp, { modo })
      if (cuantos === 0) return

      if (modo === "espera") {
        setVuelo(null)
        return
      }

      seqRef.current += 1
      setVuelo({
        seq: seqRef.current,
        count: cuantos,
        colores: coloresDelFestejo({
          cuantos,
          xp,
          multiplicador,
          intento,
          cafe: multiplicador > 1,
        }),
        // Se mide ACÁ y no en el primer frame: esto corre en el instante del
        // veredicto local, antes de que nada haya cambiado en pantalla, así
        // que la fórmula sigue exactamente donde estaba.
        //
        // Sin fórmula medible, una franja en el medio de la pantalla.
        from: formulaBox(promptRef.current) ?? {
          left: window.innerWidth * 0.35,
          right: window.innerWidth * 0.65,
          top: window.innerHeight * 0.42,
          bottom: window.innerHeight * 0.42 + FRANJA,
        },
      })
    },
    [dispararMotor],
  )

  /** Desarma un festejo ya arrancado (ver `abort` en dx-core) y la tanda de
   *  orbes que hubiera en el aire. */
  const abort = useCallback(() => {
    abortarMotor()
    setVuelo(null)
  }, [abortarMotor])

  // Se devuelven ref callbacks y no los refs: un objeto que contiene refs hace
  // que cualquier lectura suya cuente como acceso a un ref durante el render.
  //
  // El del enunciado IGNORA el null, como el `attachInput` del layout y por
  // exactamente el mismo motivo: con el volteo entre ejercicios la card vieja y
  // la nueva conviven un rato, y la vieja publica `null` al desmontarse DESPUÉS
  // de que la nueva ya publicó su caja. Con el ref pelado, del segundo ejercicio
  // en adelante no había caja que medir y los orbes salían de una franja en el
  // medio de la pantalla.
  const attachPrompt = useCallback((node: HTMLDivElement | null) => {
    if (node) promptRef.current = node
  }, [])
  const attachTarget = useCallback((node: HTMLElement | null) => {
    targetRef.current = node
  }, [])
  const attachRespaldo = useCallback((node: HTMLElement | null) => {
    respaldoRef.current = node
  }, [])

  /** Dónde tienen que aterrizar los orbes.
   *
   * **El respaldo no es una precaución de más: sin él los orbes se CONGELAN.**
   * `orb-flight.tsx` espera hasta `SIN_DESTINO_MS` a que haya destino y, si no
   * aparece, da todos por llegados de una — un sonido solo y los puntos que se
   * apagan donde nacieron, sin volar. Eso es lo que se ve cuando el número de
   * XP de la fila propia no se puede medir, y hay por lo menos dos formas de
   * que pase:
   *
   *   · el ranking está ordenado por Elo, donde ese número no se dibuja y
   *     `GameRanking` deja de pasar `attachXpTarget`. Al acertar se vuelve solo
   *     a experiencia, pero la fila tiene que volver a montarse antes de que se
   *     acabe la paciencia;
   *   · la fila propia no está en la página cargada de la lista —se repaginó,
   *     o el salto de puesto la movió—, así que no hay nodo que medir.
   *
   * Las dos son intermitentes desde el lado del jugador, y por eso el arreglo
   * no es taparlas de a una sino que no haya forma de quedarse sin destino. El
   * respaldo es la columna entera del ranking: está montada siempre y no
   * depende de qué fila se esté mostrando. Volar al borde de la columna en vez
   * de al número exacto se nota apenas; no volar se nota mucho.
   *
   * Y como el vuelo relee esto en CADA frame, si el número aparece a mitad de
   * camino la curva se corrige sola y los últimos orbes entran donde deben. */
  const magnetTarget = useCallback(
    () => centerOf(targetRef.current) ?? centerOf(respaldoRef.current),
    [],
  )

  return {
    // liveXp, xpSumada, counting, xpColor, reconcile, release y paso, del motor.
    ...motor,
    fireProvisional,
    abort,
    // Solo para el modo vuelo.
    vuelo,
    attachPrompt,
    attachTarget,
    attachRespaldo,
    magnetTarget,
  }
}
