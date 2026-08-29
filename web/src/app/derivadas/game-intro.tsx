"use client"

// Presentación del minijuego: la pantalla arranca en negro con la palabra
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
import { motion, useReducedMotion, PresenceContext } from "motion/react"
import { LOGO_WORD, GameLogo } from "./game-logo"

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
// Cuánto tarda en entrar cada pieza del lockup después de que la palabra ya está
// escrita: primero los corchetes, después el operador. Más lento que un tramo de
// barra (160) porque son dos gestos y no ocho: si van rápido no se leen como una
// secuencia, se leen como un parpadeo.
const PART_STEP = 260
const PART_TOTAL = 2

// La palabra se escribe CENTRADA en la pantalla y recién después se corre a la
// derecha, para hacerle lugar al `d/dx [` que entra a su izquierda.
//
// Antes no se corría: lo que se centraba era el lockup ENTERO, con el operador y
// los corchetes ya ocupando su lugar aunque todavía estuvieran invisibles. Como
// a la izquierda de la palabra hay mucho más que a su derecha, la palabra se
// escribía visiblemente corrida hacia la derecha del centro y, hasta que la
// notación no aparecía, eso no se leía como un espacio reservado sino como un
// centrado mal hecho. Ahora el hueco se reserva a la vista: la palabra está
// centrada, se hace a un lado, y ahí entra lo que faltaba.
const SHIFT_HOLD = 260
const SHIFT_S = 0.42

const LANDING_S = 0.55
const BACKDROP_FADE_S = 0.5

// Tope de seguridad: el navegador congela las animaciones en pestañas de fondo,
// así que sin esto abrir el juego en segundo plano (el "abrir en otra pestaña"
// de WhatsApp) dejaría la presentación a medio camino para siempre. Los timers
// sí corren en segundo plano. Tiene que superar el recorrido completo, que es
// el del teléfono por ser el que tiene notación: 700 de espera + ~1000 de
// tipeo + ~840 de subrayado + ~940 entre el corrimiento y las dos piezas + 600
// de cola, más 550 de aterrizaje ≈ 4,6s.
const MAX_INTRO_MS = 7000

const BAR_TOTAL = 4

type Phase = "measuring" | "writing" | "landing" | "done"

type Natural = { left: number; top: number; width: number; height: number; fontPx: number }

// Dónde cae la palabra DENTRO de la caja del logo, en px al tamaño del hueco.
// Con notación la caja es más grande que la palabra y no está centrada en ella;
// sin notación las dos coinciden y esto no mueve nada.
type Word = { left: number; width: number }

function randomDelay(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// El logo centrado en la pantalla, a tamaño de presentación. Sus medidas se
// deducen de las del hueco: todo el logo está expresado en `em`, así que su
// ancho y su alto crecen en proporción al tamaño de letra.
//
// `soloPalabra` centra la palabra en vez de la caja — el primer tramo de la
// presentación, cuando la notación todavía no entró (ver SHIFT_HOLD). Lo que se
// mueve sigue siendo la caja: se la corre para que la palabra caiga en el
// centro. El alto no se toca en ninguno de los dos casos, porque la palabra está
// centrada verticalmente en la caja y su centro es el mismo.
function centeredAt(natural: Natural, word: Word | null, soloPalabra: boolean) {
  const ratio = INTRO_FONT_PX / natural.fontPx
  const centrar = soloPalabra && word ? word : { left: 0, width: natural.width }
  return {
    left: (window.innerWidth - centrar.width * ratio) / 2 - centrar.left * ratio,
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

// La palabra dentro de la caja. Se mide UNA sola vez, con la primera medición
// del hueco, y no se vuelve a leer: en cuanto la presentación arranca, el logo
// se despega (`position: fixed`) y la palabra deja de estar en las coordenadas
// del hueco, además de estar a medio escribir. Como es geometría del dibujo
// —todo el logo está en `em`—, la de aquel momento sigue valiendo.
function readWord(el: HTMLElement): Word | null {
  const box = el.getBoundingClientRect()
  const word = el.querySelector<HTMLElement>("[data-logo-word]")
  if (!word) return null
  const rect = word.getBoundingClientRect()
  if (rect.width === 0) return null
  return { left: rect.left - box.left, width: rect.width }
}

export function useGameIntro({
  // ¿El logo lleva la notación (`d/dx [ ... ]`) o es la palabra sola? Lo decide
  // la plataforma en game-root.tsx: el teléfono sí, el escritorio no. Entra por
  // acá y no solo en el componente porque también cambia el RECORRIDO de la
  // presentación — sin notación no hay corchetes ni operador que encender, así
  // que la palabra termina de escribirse y el logo se va derecho a su lugar.
  notation = true,
}: { notation?: boolean } = {}) {
  const reduceMotion = useReducedMotion()
  // El hueco que el logo ocupa en el layout; se mide para poder devolverlo
  // exactamente ahí y para que nada se corra mientras está afuera.
  const slotEl = useRef<HTMLDivElement | null>(null)
  const measuredRef = useRef(false)
  const [phase, setPhase] = useState<Phase>("measuring")
  const [natural, setNatural] = useState<Natural | null>(null)
  const [word, setWord] = useState<Word | null>(null)
  const [typed, setTyped] = useState(0)
  const [bars, setBars] = useState(0)
  // ¿La palabra ya se hizo a un lado? Es el paso entre escribirla y encender la
  // notación: hasta acá está centrada ella, después lo está el lockup entero.
  const [corrido, setCorrido] = useState(false)
  // 0 = solo la palabra · 1 = con corchetes · 2 = con d/dx. El lockup se arma de
  // adentro hacia afuera. Sin notación se queda en 0: la palabra sola YA es el
  // logo completo, y ahí no falta nada por encender.
  const [parts, setParts] = useState(0)
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
    setWord(readWord(node))
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
    if (typed < LOGO_WORD.length) {
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
    // La palabra ya está escrita y subrayada: se hace a un lado.
    if (notation && !corrido) {
      const id = setTimeout(() => setCorrido(true), SHIFT_HOLD)
      return () => clearTimeout(id)
    }
    if (notation && parts < PART_TOTAL) {
      // El primer corchete espera a que el corrimiento TERMINE. Si entrara
      // antes, la notación aparecería alrededor de algo que todavía se está
      // acomodando, y el lugar que la palabra dejó libre dejaría de leerse como
      // el motivo por el que se corrió.
      const id = setTimeout(
        () => setParts((p) => p + 1),
        parts === 0 ? SHIFT_S * 1000 : PART_STEP,
      )
      return () => clearTimeout(id)
    }
    const id = setTimeout(startLanding, TAIL_HOLD)
    return () => clearTimeout(id)
  }, [started, typed, bars, parts, corrido, notation, reduceMotion, phase, startLanding])

  useEffect(() => {
    if (phase === "done") return
    const id = setTimeout(finish, MAX_INTRO_MS)
    return () => clearTimeout(id)
  }, [phase, finish])

  // El logo viaja solo mientras se presenta; en "done" ya es parte del layout.
  const detached = phase === "writing" || phase === "landing"

  // La presentación está por ocurrir o está ocurriendo. Incluye "measuring" a
  // propósito: ese render es el que monta las piezas animadas, y de ahí depende
  // que nazcan ocultas (ver el bloque de abajo).
  const preparando = !reduceMotion && (phase === "measuring" || phase === "writing")

  // Dónde va el logo en cada momento, en coordenadas de pantalla. Se calcula
  // acá y no en el render porque necesita medidas de la ventana, que no existen
  // al renderizar en el servidor.
  // Mientras la palabra está sola en la pantalla, lo que se centra es ella;
  // desde que se corre, el lockup entero. Con movimiento reducido no hay tramos:
  // el logo sale completo desde el primer cuadro, así que se centra completo.
  const soloPalabra = !reduceMotion && !corrido

  const target =
    natural === null
      ? null
      : phase === "landing"
        ? { left: natural.left, top: natural.top, fontSize: natural.fontPx }
        : centeredAt(natural, word, soloPalabra)

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
    // La palabra se mide: en "measuring" va COMPLETA, porque de su ancho salen
    // el tamaño del hueco y el punto al que el logo tiene que volver. No se
    // llega a ver: la fase cambia dentro del callback de la ref, o sea antes de
    // que el navegador pinte.
    typedCount: reduceMotion || phase !== "writing" ? undefined : typed,
    // Las tres piezas que se ANIMAN, en cambio, tienen que nacer ocultas ya en
    // "measuring". Son elementos de motion con `initial={false}`: se montan con
    // el valor que reciben y a partir de ahí solo pueden ANIMAR hacia el
    // siguiente. Naciendo visibles —que es lo que hacía `undefined`— el primer
    // fotograma las pintaba en su lugar y la presentación arrancaba con un
    // fundido de SALIDA: la notación aparecía, se iba, y volvía cuando le
    // tocaba. Ocultas desde el montaje no hay nada que sacar de la pantalla.
    //
    // Que estén ocultas no mueve la medición: opacidad y escala no ocupan
    // lugar, y las barras viven dentro de una caja de alto fijo.
    barCount: preparando ? bars : undefined,
    // Viaja en el objeto y no como prop de `GameIntroLogo` para que los dos
    // layouts lo pidan igual: el que sabe qué logo va es game-root.tsx, que es
    // el único que conoce la plataforma.
    notation,
    // ¿La caja se está moviendo por el corrimiento? Es lo único que anima la
    // POSICIÓN fuera del aterrizaje, así que el componente lo necesita para
    // saber que ese cambio de `target` va con transición y no de un salto.
    shifting: corrido,
    // `undefined` fuera de la presentación: el logo ya instalado se dibuja
    // entero.
    showBrackets: preparando ? parts >= 1 : undefined,
    showOperator: preparando ? parts >= 2 : undefined,
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
  const {
    natural, detached, target, typedCount, barCount, notation, showBrackets,
    showOperator, shifting, phase, onLanded, reduceMotion, attachSlot,
  } = intro

  const floating = detached && natural !== null && target !== null

  return (
    // Se corta el contexto de presencia heredado, y esto es lo que hace que las
    // letras se animen en el teléfono.
    //
    // En el teléfono el logo vive adentro de una diapo, que es un hijo de un
    // `<AnimatePresence initial={false}>` (mobile-flow.tsx). Ese `initial={false}`
    // no es para la primera diapo nada más: AnimatePresence arma el contexto UNA
    // vez —está memoizado por `isPresent`, no por `initial`— y a partir de ahí
    // todo elemento de motion que nazca ahí adentro, cuando sea, nace con su
    // animación de entrada bloqueada (framer-motion, use-visual-state.mjs:
    // `presenceContext.initial === false`). Las letras del typewriter nacen de a
    // una, así que aparecían de golpe en vez de entrar con su fundido, y solo en
    // el teléfono: en escritorio no hay AnimatePresence arriba del logo.
    //
    // Cortarlo acá no se lleva nada por delante: la diapo que sale del DOM se
    // anima a sí misma, por encima de este proveedor, y el logo no tiene ninguna
    // animación de salida que coordinar.
    <PresenceContext.Provider value={null}>
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
            reduceMotion
              ? { duration: 0 }
              : phase === "landing"
                ? { duration: LANDING_S, ease: [0.32, 0.72, 0.24, 1] }
                : // El corrimiento, con la misma curva del aterrizaje: son el
                  // mismo gesto —el logo yendo a donde va— a dos escalas.
                  shifting
                  ? { duration: SHIFT_S, ease: [0.32, 0.72, 0.24, 1] }
                  : { duration: 0 }
          }
          onAnimationComplete={() => {
            if (phase === "landing") onLanded()
          }}
        >
          <GameLogo
            fontSize="1em"
            typedCount={typedCount}
            barCount={barCount}
            showNotation={notation}
            showBrackets={showBrackets}
            showOperator={showOperator}
            animateEntry={!reduceMotion && phase === "writing"}
          />
        </motion.div>
      </div>
    </PresenceContext.Provider>
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
