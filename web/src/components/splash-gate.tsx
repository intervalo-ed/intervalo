"use client"

import { useSplash } from "@/app/splash-context"
import { BELT_BAR_COLORS } from "@/lib/catalog"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { useEffect, useRef, useState } from "react"

// El splash no se va hasta que la animación de entrada termina (señal
// `introDone`), aunque los datos carguen antes. MAX_SPLASH es el fallback de
// seguridad por si los datos nunca llegan.
const MAX_SPLASH = 4000

// Misma animación que la intro del onboarding (ver IntroLogo en onboarding-wizard).
const WORD = "intervalo"
const BELT_COLORS = BELT_BAR_COLORS

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
  const [typed, setTyped] = useState("")
  const [bars, setBars] = useState(0)
  const doneRef = useRef(false)

  const fireDone = () => {
    if (!doneRef.current) {
      doneRef.current = true
      onDone()
    }
  }

  useEffect(() => {
    if (reduceMotion) {
      const id = setTimeout(fireDone, 600)
      return () => clearTimeout(id)
    }
    if (typed.length >= WORD.length) return
    const id = setTimeout(
      () => setTyped(WORD.slice(0, typed.length + 1)),
      randomDelay(32, 52),
    )
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typed, reduceMotion])

  useEffect(() => {
    if (reduceMotion || typed.length < WORD.length) return
    if (bars < BELT_COLORS.length) {
      const id = setTimeout(() => setBars((b) => b + 1), bars === 0 ? 320 : 165)
      return () => clearTimeout(id)
    }
    const id = setTimeout(fireDone, 680)
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typed, bars, reduceMotion])

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
