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

import { useCallback, useEffect, useRef, useState } from "react"
import { collectSchedule } from "@/components/confetti"
import type { Box } from "@/components/orb-flight"
import { useTick } from "@/lib/audio/useSfx"
import type { GameAnswer } from "./UseGameExercise"
import { VERDE_ACIERTO } from "./exercise-card"
import { coloresDelFestejo, pasosDe, repartir } from "./xp-pasos"

// Quién empuja el conteo.
//
// `vuelo` es escritorio: no hay temporizadores: el ritmo lo ponen las llegadas
// de los orbes, que ya vienen agendadas con la misma rampa.
// `espera` es el teléfono: el conteo queda guardado hasta que `release` lo larga,
// que es cuando la persona pasa a la pantalla donde está el número.
export type ModoDeConteo = "vuelo" | "espera"

// Los "unos momentos" entre el Continuar y el conteo, en el teléfono.
//
// No es una demora técnica, es la pausa que separa dos cosas que se dicen: el
// pase de pantalla primero, y recién cuando el ranking se asentó, el número. Sin
// pausa las dos ocurren encimadas y el conteo se pierde adentro del pase.
//
// Nadie queda esperando estos milisegundos: el Continuar está habilitado desde el
// primer frame y el conteo sigue corriendo si la persona ya siguió de largo.
const ESPERA_MS = 500

// El color del conteo: el verde del acierto, importado de donde ya vivía en vez
// de copiado. Si algún día ese verde cambia, cambia en los dos lados a la vez,
// que es todo el punto de que sean el mismo.
const COLOR_DEL_CONTEO = VERDE_ACIERTO

// Cuánto se queda el color después del último paso antes de que el número vuelva
// al suyo. Corto, pero no cero: sin esto el número se apaga en el mismo frame en
// que entra el último orbe y el final del conteo se lee como si algo se hubiera
// roto.
const DESCANSO_MS = 700

// Salvavidas del modo vuelo: si a esta altura todavía faltan pasos, se dan por
// dados sin sonido y el conteo se cierra igual.
//
// No es paranoia: de que el conteo TERMINE cuelga el refresco del ranking, y
// mientras `counting` sea true el latido que lo refrescaría solo está pausado
// (ver useGamePulse). Un festejo que se corta a la mitad —porque la capa de
// orbes se desmontó, porque la pestaña pasó a segundo plano y el navegador dejó
// de dar frames— dejaría la tabla congelada hasta el próximo acierto. El vuelo
// más largo de un acierto grande son unos 1,6 s; esto es casi el doble.
const SALVAVIDAS_MS = 3000

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
  // La XP que había antes de este acierto; el conteo arranca acá. Sale de la
  // respuesta (`xp_total - xp_awarded`) y no de la query del jugador, así no
  // depende de que esa query ya se haya refrescado.
  const [base, setBase] = useState<number | null>(null)
  const [total, setTotal] = useState(0)
  const [sumado, setSumado] = useState(0)
  // `null` es "el número está en su color de siempre", que es el estado normal:
  // el color solo existe mientras dura el festejo.
  const [color, setColor] = useState<string | null>(null)
  const [vuelo, setVuelo] = useState<Vuelo | null>(null)

  const doneRef = useRef(onComplete)
  useEffect(() => {
    doneRef.current = onComplete
  })

  // Los temporizadores del modo espera, más el que apaga el color y el
  // salvavidas. Se guardan todos para poder cancelarlos: un acierto nuevo pisa al
  // anterior, y desmontar en medio del conteo no puede dejar timers escribiendo
  // estado.
  const relojesRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const limpiar = useCallback(() => {
    for (const r of relojesRef.current) clearTimeout(r)
    relojesRef.current = []
  }, [])
  useEffect(() => limpiar, [limpiar])

  const partesRef = useRef<number[]>([])
  // Qué pasos ya se cobraron. Es un conjunto y no un contador porque lo que hay
  // que garantizar es "una vez cada uno", no "tantas veces en total".
  const dadosRef = useRef<Set<number>>(new Set())

  const terminar = useCallback(() => {
    limpiar()
    relojesRef.current.push(setTimeout(() => setColor(null), DESCANSO_MS))
    doneRef.current?.()
  }, [limpiar])

  /** Un paso del conteo: suena, cambia de color y sube el número. La llaman los
   *  dos motores, y por eso el ritmo y el sonido son idénticos en las dos
   *  pantallas aunque lo que se vea sea distinto.
   *
   *  Un paso se cobra UNA vez. El descarte no es de trámite: si un índice entrara
   *  dos veces —dos capas de orbes vivas a la vez, un frame que se repite— el
   *  número treparía por encima de la XP que el servidor otorgó, y ahí se
   *  quedaría: `counting` ya sería false y el ranking muestra el mayor entre el
   *  conteo y su propio dato, así que el número inflado le ganaría al verdadero
   *  hasta el próximo acierto. Un paso perdido no se ve; uno de más se queda. */
  const paso = useCallback(
    (i: number, progreso: number) => {
      const partes = partesRef.current
      if (i < 0 || i >= partes.length || dadosRef.current.has(i)) return
      dadosRef.current.add(i)
      tick(0.9 + progreso * 0.6)
      // Se enciende con el primer paso y no al disparar el festejo: en escritorio
      // los orbes todavía están en el aire durante medio segundo, y prender el
      // número antes de que llegue el primero sería anunciar lo que está por
      // pasar en vez de acompañarlo. `setColor` con el mismo valor no re-renderiza.
      setColor(COLOR_DEL_CONTEO)
      setSumado((s) => s + partes[i])
      if (dadosRef.current.size >= partes.length) terminar()
    },
    [terminar, tick],
  )

  const arrancarReloj = useCallback(() => {
    const partes = partesRef.current
    const rampa = collectSchedule(partes.length)
    const ultimo = partes.length - 1
    partes.forEach((_, i) => {
      relojesRef.current.push(
        setTimeout(
          () => paso(i, i / Math.max(1, ultimo)),
          ESPERA_MS + rampa[i],
        ),
      )
    })
  }, [paso])

  const pendienteRef = useRef(false)
  const seqRef = useRef(0)
  const promptRef = useRef<HTMLDivElement | null>(null)
  const targetRef = useRef<HTMLElement | null>(null)

  const fire = useCallback(
    (answer: GameAnswer, { modo }: { modo: ModoDeConteo }) => {
      const xp = answer.xp_awarded
      if (xp <= 0) return
      // Si venía uno corriendo, lo pisa. No se le llama `onComplete` al que se
      // interrumpe: lo único que hace es refrescar el ranking, y el que acaba de
      // empezar lo va a hacer un segundo después con datos más nuevos.
      limpiar()
      setBase(answer.xp_total - xp)
      setTotal(xp)
      setSumado(0)
      setColor(null)
      partesRef.current = repartir(xp, pasosDe(xp))
      dadosRef.current = new Set()

      if (modo === "espera") {
        pendienteRef.current = true
        setVuelo(null)
        return
      }

      pendienteRef.current = false
      seqRef.current += 1
      setVuelo({
        seq: seqRef.current,
        count: partesRef.current.length,
        colores: coloresDelFestejo({
          cuantos: partesRef.current.length,
          xp,
          multiplicador: answer.xp_multiplier,
          intento: answer.attempt_number,
        }),
        // Se mide ACÁ y no en el primer frame: `fire` corre dentro del onSuccess
        // de la respuesta, o sea antes del commit que hace desaparecer la
        // fórmula. Un frame más tarde ya no habría nada que medir.
        //
        // Sin fórmula medible, una franja en el medio de la pantalla.
        from: formulaBox(promptRef.current) ?? {
          left: window.innerWidth * 0.35,
          right: window.innerWidth * 0.65,
          top: window.innerHeight * 0.42,
          bottom: window.innerHeight * 0.42 + FRANJA,
        },
      })
      relojesRef.current.push(
        setTimeout(() => {
          const partes = partesRef.current
          if (dadosRef.current.size >= partes.length) return
          setSumado(xp)
          for (let i = 0; i < partes.length; i++) dadosRef.current.add(i)
          terminar()
        }, SALVAVIDAS_MS),
      )
    },
    [limpiar, terminar],
  )

  /** Larga el conteo que estaba guardado. Lo llama la pantalla que TIENE el
   *  número, cuando la persona pasa a ella.
   *
   *  No hace nada si no hay nada guardado, y eso es lo que la hace segura de
   *  llamar dos veces: en el teléfono la larga el toque en Continuar y además,
   *  por las dudas, la slide del ranking al montarse. */
  const release = useCallback(() => {
    if (!pendienteRef.current) return
    pendienteRef.current = false
    arrancarReloj()
  }, [arrancarReloj])

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
  const magnetTarget = useCallback(() => centerOf(targetRef.current), [])

  return {
    // XP a mostrar en la fila propia. Queda en el valor final cuando el conteo
    // termina: si volviera a null habría un parpadeo al valor viejo mientras el
    // ranking se refresca.
    liveXp: base === null ? null : base + sumado,
    // Mientras esto sea true el conteo MANDA sobre el dato del ranking: si no,
    // una lista ya refrescada mostraría el total desde el primer paso y el número
    // no subiría nunca.
    counting: base !== null && sumado < total,
    // El color del número mientras se llena, o null para el de siempre.
    xpColor: color,
    fire,
    release,
    // Solo para el modo vuelo.
    vuelo,
    paso,
    attachPrompt,
    attachTarget,
    magnetTarget,
  }
}
