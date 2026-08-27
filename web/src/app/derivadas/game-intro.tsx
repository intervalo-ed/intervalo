"use client"

// Presentación del minijuego: la pantalla arranca en negro con "derivadas"
// escribiéndose en el centro y termina con esa misma palabra ya instalada en su
// lugar — el header en escritorio, la portada en el teléfono.
//
// La clave está en que es UN SOLO logo, el de verdad, el que vive en el layout.
// No hay una copia que vuele y después ceda el puesto: el logo se despega de su
// sitio, se agranda, se escribe, y vuelve. Por eso tampoco hay ningún relevo que
// disimular al final.
//
// Dos decisiones sostienen eso:
//
//   1. Se anima el TAMAÑO DE LETRA, no una escala. Escalar es más barato, pero
//      dibuja el logo estirando una textura: el texto y el subrayado de ~3px
//      quedan con otro grosor que los mismos elementos dibujados a tamaño real,
//      y ese cambio se nota justo al aterrizar. Animando el tamaño, cada
//      fotograma se dibuja nativo y el final es exactamente el logo del layout.
//
//   2. Mientras viaja, el logo va en `position: fixed` y deja un hueco de su
//      tamaño exacto en el layout. Así el header no se reacomoda cuando se va ni
//      cuando vuelve, y al soltarlo cae en el mismo píxel en el que estaba.
//
// No hay overlay por encima del logo: el fondo negro es una capa por DEBAJO, y
// lo que se oculta es el resto de la pantalla. Eso evita pelear con z-index y
// con los contextos de apilamiento que crean las slides del teléfono.

import { useCallback, useEffect, useRef, useState } from "react"
import { motion, useReducedMotion } from "motion/react"
import { DERIVADAS_WORD, DerivadasLogo } from "./derivadas-logo"

// Tamaño del logo mientras se presenta, en px. Va atado a los tamaños de
// llegada (1.0625rem en el header de escritorio, 1.9125rem en la portada del
// teléfono): si se toca uno solo, el vuelo cambia de recorrido — con la
// presentación más chica que el destino, el logo aterrizaría agrandándose.
const INTRO_FONT_PX = 37

// Ritmo, tomado del splash de Intervalo (components/splash-gate.tsx) para que
// la marca se sienta igual.
const START_HOLD = 700
const CHAR_MIN = 96
const CHAR_MAX = 126
const BAR_FIRST = 360
const BAR_STEP = 160
const TAIL_HOLD = 600

const LANDING_S = 0.55
const BACKDROP_FADE_S = 0.5

// Tope de seguridad: el navegador congela las animaciones en pestañas de fondo,
// así que sin esto abrir el juego en segundo plano (el "abrir en otra pestaña"
// de WhatsApp) dejaría la presentación a medio camino para siempre. Los timers
// sí corren en segundo plano. Tiene que superar el recorrido completo
// (700 + ~1000 + ~840 + 600 de animación, más 750 de aterrizaje ≈ 3,9s).
const MAX_INTRO_MS = 7000

const BAR_TOTAL = 4

type Phase = "measuring" | "writing" | "landing" | "done"

type Natural = { left: number; top: number; width: number; height: number; fontPx: number }

function randomDelay(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// El logo centrado en la pantalla, a tamaño de presentación. Sus medidas se
// deducen de las del hueco: todo el logo está expresado en `em`, así que su
// ancho y su alto crecen en proporción al tamaño de letra.
function centeredAt(natural: Natural) {
  const ratio = INTRO_FONT_PX / natural.fontPx
  return {
    left: (window.innerWidth - natural.width * ratio) / 2,
    top: (window.innerHeight - natural.height * ratio) / 2,
    fontSize: INTRO_FONT_PX,
  }
}

export type GameIntro = ReturnType<typeof useGameIntro>

function readBox(el: HTMLElement): Natural | null {
  const rect = el.getBoundingClientRect()
  if (rect.width === 0) return null
  const fontPx = parseFloat(getComputedStyle(el).fontSize) || 24
  return {
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height,
    fontPx,
  }
}

export function useGameIntro() {
  const reduceMotion = useReducedMotion()
  // El hueco que el logo ocupa en el layout; se mide para poder devolverlo
  // exactamente ahí y para que nada se corra mientras está afuera.
  const slotEl = useRef<HTMLDivElement | null>(null)
  const measuredRef = useRef(false)
  const [phase, setPhase] = useState<Phase>("measuring")
  const [natural, setNatural] = useState<Natural | null>(null)
  const [typed, setTyped] = useState(0)
  const [bars, setBars] = useState(0)
  const [started, setStarted] = useState(false)
  const landingRef = useRef(false)

  const measure = useCallback((): Natural | null => {
    const el = slotEl.current
    return el ? readBox(el) : null
  }, [])

  const finish = useCallback(() => {
    setPhase((p) => (p === "done" ? p : "done"))
  }, [])

  // La primera medición ocurre acá, cuando React entrega el nodo: es el mismo
  // momento que un efecto de layout (antes de pintar), así que el logo se mide
  // en su lugar y a su tamaño final sin que nadie alcance a verlo ahí.
  const attachSlot = useCallback((node: HTMLDivElement | null) => {
    slotEl.current = node
    if (!node || measuredRef.current) return
    measuredRef.current = true
    const m = readBox(node)
    if (!m) {
      // Sin caja medible no hay presentación posible; se sigue de largo.
      setPhase("done")
      return
    }
    setNatural(m)
    setPhase("writing")
  }, [])

  // Espera a las fuentes antes de escribir: con la tipografía todavía sin
  // cargar, la palabra entraría con otra letra y cambiaría de ancho a mitad de
  // animación.
  useEffect(() => {
    if (phase !== "writing") return
    let cancelled = false
    let timer: ReturnType<typeof setTimeout>
    const fontsReady = document.fonts?.ready ?? Promise.resolve()
    void fontsReady.then(() => {
      if (cancelled) return
      // Con las fuentes ya cargadas, la medida del hueco es la definitiva.
      const m = measure()
      if (m) setNatural(m)
      timer = setTimeout(() => setStarted(true), START_HOLD)
    })
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [phase, measure])

  const startLanding = useCallback(() => {
    if (landingRef.current) return
    landingRef.current = true
    // Se remide en el momento de volver: si la ventana cambió de tamaño
    // mientras tanto, el logo tiene que aterrizar donde está el hueco AHORA.
    const m = measure()
    if (m) setNatural(m)
    setPhase("landing")
  }, [measure])

  // Con movimiento reducido no hay tipeo: la palabra completa y a su lugar.
  useEffect(() => {
    if (!started || !reduceMotion || phase !== "writing") return
    const id = setTimeout(startLanding, TAIL_HOLD)
    return () => clearTimeout(id)
  }, [started, reduceMotion, phase, startLanding])

  useEffect(() => {
    if (!started || reduceMotion || phase !== "writing") return
    if (typed < DERIVADAS_WORD.length) {
      const id = setTimeout(
        () => setTyped((n) => n + 1),
        randomDelay(CHAR_MIN, CHAR_MAX),
      )
      return () => clearTimeout(id)
    }
    if (bars < BAR_TOTAL) {
      const id = setTimeout(
        () => setBars((b) => b + 1),
        bars === 0 ? BAR_FIRST : BAR_STEP,
      )
      return () => clearTimeout(id)
    }
    const id = setTimeout(startLanding, TAIL_HOLD)
    return () => clearTimeout(id)
  }, [started, typed, bars, reduceMotion, phase, startLanding])

  useEffect(() => {
    if (phase === "done") return
    const id = setTimeout(finish, MAX_INTRO_MS)
    return () => clearTimeout(id)
  }, [phase, finish])

  // El logo viaja solo mientras se presenta; en "done" ya es parte del layout.
  const detached = phase === "writing" || phase === "landing"

  // Dónde va el logo en cada momento, en coordenadas de pantalla. Se calcula
  // acá y no en el render porque necesita medidas de la ventana, que no existen
  // al renderizar en el servidor.
  const target =
    natural === null
      ? null
      : phase === "landing"
        ? { left: natural.left, top: natural.top, fontSize: natural.fontPx }
        : centeredAt(natural)

  return {
    phase,
    attachSlot,
    natural,
    detached,
    target,
    done: phase === "done",
    // El resto de la pantalla (y el fondo que lo tapa) espera a que el logo
    // esté puesto: primero llega, después aparece todo lo demás.
    chromeVisible: phase === "done",
    typedCount: reduceMotion || phase !== "writing" ? undefined : typed,
    barCount: reduceMotion || phase !== "writing" ? undefined : bars,
    onLanded: finish,
    reduceMotion: !!reduceMotion,
  }
}

// El logo del juego, con su hueco. Se usa igual en el header de escritorio y en
// la portada del teléfono; `fontSize` es el tamaño que tiene ya instalado.
export function GameIntroLogo({
  intro,
  fontSize,
}: {
  intro: GameIntro
  fontSize: string
}) {
  const { natural, detached, target, typedCount, barCount, phase, onLanded, reduceMotion, attachSlot } = intro

  const floating = detached && natural !== null && target !== null

  return (
    <div
      ref={attachSlot}
      style={{
        fontSize,
        // Mientras el logo está afuera, el hueco conserva su tamaño para que
        // nada se reacomode; cuando vuelve, lo dicta otra vez el contenido.
        ...(floating ? { width: natural.width, height: natural.height } : null),
      }}
    >
      <motion.div
        // Sin transform: el logo se dibuja a su tamaño real en cada fotograma
        // (ver la cabecera del archivo).
        style={floating ? { position: "fixed", display: "flex" } : { display: "flex" }}
        initial={false}
        animate={floating ? target : {}}
        transition={
          phase === "landing" && !reduceMotion
            ? { duration: LANDING_S, ease: [0.32, 0.72, 0.24, 1] }
            : { duration: 0 }
        }
        onAnimationComplete={() => {
          if (phase === "landing") onLanded()
        }}
      >
        <DerivadasLogo
          fontSize="1em"
          typedCount={typedCount}
          barCount={barCount}
          animateEntry={!reduceMotion && phase === "writing"}
        />
      </motion.div>
    </div>
  )
}

// Fondo de la presentación: va DEBAJO del logo y por encima del resto, así el
// logo nunca necesita pelear por z-index con las slides.
export function GameIntroBackdrop({ intro }: { intro: GameIntro }) {
  if (intro.done) return null
  return (
    <motion.div
      className="pointer-events-none fixed inset-0 bg-background"
      initial={false}
      animate={{ opacity: intro.chromeVisible ? 0 : 1 }}
      transition={{ duration: BACKDROP_FADE_S, ease: "easeInOut" }}
    />
  )
}
