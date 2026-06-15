"use client"

import { useSplash } from "@/app/splash-context"
import { BELT_BAR_COLORS } from "@/lib/catalog"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { useEffect, useRef, useState } from "react"

// El splash no se va hasta que la animación de entrada termina (señal
// `introDone`), aunque los datos carguen antes. MAX_SPLASH es el fallback de
// seguridad por si los datos nunca llegan.
const MAX_SPLASH = 5000

// Misma animación que la intro del onboarding (ver IntroLogo en onboarding-wizard).
const WORD = "intervalo"
const BELT_COLORS = BELT_BAR_COLORS

// Ritmo de la intro. Antes la animación arrancaba apenas montaba (durante la
// hidratación, con la fuente todavía cargando) y se sentía apurada. Ahora:
// 1) esperamos a que las fuentes estén listas + un hold mínimo en navy,
// 2) tipeamos más lento, y 3) garantizamos una duración mínima total.
const START_HOLD = 700 // ms de fondo navy antes de empezar a tipear
const CHAR_MIN = 96 // ~111ms promedio × 9 letras ≈ 1000ms de typewriter
const CHAR_MAX = 126
const BAR_FIRST = 360 // pausa antes de revelar la primera barra
const BAR_STEP = 160 // entre barras siguientes (360 + 4×160 = 1000ms de subrayado)
const TAIL_HOLD = 600 // logo completo en pantalla antes de salir
const MIN_INTRO = 2600 // piso desde que arranca: typewriter 1000 + subrayado 1000 + tail 600

function randomDelay(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function SplashGate() {
  const { ready } = useSplash()
  const reduceMotion = useReducedMotion()

  const [visible, setVisible] = useState(true)
  const [introDone, setIntroDone] = useState(false)

  useEffect(() => {
    const maxId = setTimeout(() => setVisible(false), MAX_SPLASH)
    return () => clearTimeout(maxId)
  }, [])

  useEffect(() => {
    if (ready && introDone) setVisible(false)
  }, [ready, introDone])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="splash"
          className="fixed inset-0 z-50 flex items-center justify-center bg-background"
          initial={false}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -24 }}
          transition={{ duration: 0.45, ease: "easeInOut" }}
        >
          <SplashLogo
            reduceMotion={!!reduceMotion}
            onDone={() => setIntroDone(true)}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Escribe "intervalo" con typewriter y revela los 5 colores del cinturón uno a
// uno. Replica IntroLogo del onboarding.
function SplashLogo({
  reduceMotion,
  onDone,
}: {
  reduceMotion: boolean
  onDone: () => void
}) {
  const [started, setStarted] = useState(false)
  const [typed, setTyped] = useState("")
  const [bars, setBars] = useState(0)
  const doneRef = useRef(false)
  const startRef = useRef(0)

  // Cierra la intro respetando el piso de duración (MIN_INTRO desde que arrancó).
  const fireDone = () => {
    if (doneRef.current) return
    doneRef.current = true
    const elapsed = performance.now() - startRef.current
    setTimeout(onDone, Math.max(0, MIN_INTRO - elapsed))
  }

  // Hold inicial: esperamos a que las fuentes estén listas y un mínimo en navy
  // antes de animar, para que la palabra no "entre por la mitad" ni haya swap
  // de fuente a mitad de animación.
  useEffect(() => {
    let cancelled = false
    let timer: ReturnType<typeof setTimeout>
    const fontsReady = document.fonts?.ready ?? Promise.resolve()
    fontsReady.then(() => {
      if (cancelled) return
      timer = setTimeout(() => {
        startRef.current = performance.now()
        setStarted(true)
      }, START_HOLD)
    })
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [])

  // Reduce motion: sin typewriter; mostramos el logo completo y cerramos.
  useEffect(() => {
    if (!started || !reduceMotion) return
    const id = setTimeout(fireDone, TAIL_HOLD)
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, reduceMotion])

  useEffect(() => {
    if (!started || reduceMotion || typed.length >= WORD.length) return
    const id = setTimeout(
      () => setTyped(WORD.slice(0, typed.length + 1)),
      randomDelay(CHAR_MIN, CHAR_MAX),
    )
    return () => clearTimeout(id)
  }, [started, typed, reduceMotion])

  useEffect(() => {
    if (!started || reduceMotion || typed.length < WORD.length) return
    if (bars < BELT_COLORS.length) {
      const id = setTimeout(
        () => setBars((b) => b + 1),
        bars === 0 ? BAR_FIRST : BAR_STEP,
      )
      return () => clearTimeout(id)
    }
    const id = setTimeout(fireDone, TAIL_HOLD)
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, typed, bars, reduceMotion])

  const shownBars = reduceMotion ? BELT_COLORS.length : bars

  return (
    <div className="inline-flex flex-col items-center gap-[7px] leading-none">
      <span className="font-heading text-[2.75rem] font-semibold text-[#F6F8FC]">
        {reduceMotion ? (
          WORD
        ) : typed.length === 0 ? (
          " "
        ) : (
          typed.split("").map((ch, i) => (
            <motion.span
              key={i}
              className="inline-block"
              initial={{ opacity: 0, y: "0.3em", scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.16, ease: "easeOut" }}
            >
              {ch}
            </motion.span>
          ))
        )}
      </span>
      <div className="flex h-[4px] w-full overflow-hidden rounded-[2px]">
        {BELT_COLORS.map((c, i) => (
          <motion.span
            key={i}
            className="flex-1 origin-left"
            style={{ background: c }}
            initial={{ opacity: 0, scaleX: 0 }}
            animate={
              i < shownBars
                ? { opacity: 1, scaleX: 1 }
                : { opacity: 0, scaleX: 0 }
            }
            transition={{ duration: 0.22, ease: "easeOut" }}
          />
        ))}
      </div>
    </div>
  )
}
