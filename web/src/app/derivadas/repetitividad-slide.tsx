"use client"

// La diapo que pregunta si le están saliendo repetidas.
//
// Hermana de opinion-slide.tsx: misma forma, misma escalera de turnos
// (opinion-trigger.ts), mismo protocolo de dos pasos contra el servidor. Y una
// diferencia que se nota en la pantalla: **acá no hay nada que prometer.** El
// voto de dificultad mueve la vara y la diapo lo dice; este se guarda y nada
// más, así que la línea de respuesta es siempre la misma.
//
// **Por qué es una pregunta aparte y no una opción más de la otra.** Las dos
// cosas están correlacionadas por construcción: cuando el catálogo se queda sin
// tiers el selector repite, y cuando repite la derivada se siente fácil. Con una
// sola pregunta llegan mezcladas y no hay manera de saber cuál arrastra a cuál.
// Lo que las separa no es esta diapo: es el dato objetivo que el servidor
// congela al lado del voto —cuántas plantillas y cuántos enunciados distintos
// venía viendo— (game/repetitividad.py).
//
// Los tres valores repiten `justo` en el medio, como los otros dos canales del
// producto, para poder cruzarlos sin tabla de traducción. Significa otra cosa en
// cada uno, y el panel resuelve el emoji por canal.

import { useEffect, useRef, useState } from "react"
import { motion, useReducedMotion } from "motion/react"
import posthog from "posthog-js"

import { cn } from "@/lib/utils"
import { useSfx } from "@/lib/audio/useSfx"

import { useGameApi } from "./UseGameApi"
import { KeyCap } from "./exercise-card"
import { Salida } from "./slide-salida"
import { enCampoDeTexto, useTeclas } from "./teclas"

export type VotoRepetitividad = "variado" | "justo" | "repetitivo"

// Con qué tecla se vota cada una, en escritorio. El índice ES el orden en que se
// dibujan, igual que en la de dificultad.
const TECLAS = ["1", "2", "3"]

// El orden va de variado a repetitivo para que coincida con el de la otra diapo:
// arriba lo que sobra, abajo lo que falta. Con el orden invertido, las dos
// preguntas se leerían al revés una de la otra y el 1 significaría cosas
// opuestas en dos pantallas que salen alternadas.
const OPCIONES: { voto: VotoRepetitividad; emoji: string; texto: string }[] = [
  { voto: "variado", emoji: "🎲", texto: "Bien variadas" },
  { voto: "justo", emoji: "👌", texto: "Está bien así" },
  { voto: "repetitivo", emoji: "🔁", texto: "Muy repetidas" },
]

export function RepetitividadSlide({
  onContinue,
  slotSalida,
  keyboard = false,
  fullBleed = false,
  className,
}: {
  /** `contesto` dice si se votó o si se salió sin contestar; lo usa el flow para
   *  la racha de salteos (opinion-trigger.ts :: anotarRespuesta). */
  onContinue: (contesto: boolean) => void
  slotSalida?: HTMLElement | null
  /** Escritorio: 1, 2 y 3 votan y Enter sigue. El Enter global no llega acá. */
  keyboard?: boolean
  /** Solo lo manda el teléfono, donde el fondo lo pinta la pantalla entera. */
  fullBleed?: boolean
  className?: string
}) {
  const api = useGameApi()
  const sfx = useSfx()
  const teclas = useTeclas()
  const reduce = useReducedMotion()
  const [votado, setVotado] = useState<VotoRepetitividad | null>(null)

  useEffect(() => {
    posthog.capture("game_repetitividad_shown")
    // La impresión va a la base por lo mismo que en la otra: la ausencia de la
    // respuesta es la ÚNICA señal de salteo que existe del lado del servidor, no
    // hay unmount ni beforeunload de por medio.
    void api
      .POST("/game/derivemos/repetitividad", { body: { accion: "impression" } })
      .catch(() => {})
    // Una sola vez por aparición.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function votar(voto: VotoRepetitividad) {
    if (votado) return
    setVotado(voto)
    sfx.select()
    posthog.capture("game_repetitividad_answered", { voto })
    // Sin await y sin leer la respuesta: no hay nada que mostrar que dependa de
    // lo que conteste el servidor, así que esperarlo solo agregaría una demora
    // entre el toque y el «anotado».
    void api
      .POST("/game/derivemos/repetitividad", { body: { accion: "answer", voto } })
      .catch(() => {})
  }

  // Los dos por ref y por el mismo motivo que en opinion-slide.tsx: el listener
  // vive en `document` y se arma con `[keyboard, onContinue]`, así que leer
  // `votado` desde ahí daría siempre el valor inicial.
  const votarRef = useRef(votar)
  useEffect(() => {
    votarRef.current = votar
  })
  const contestoRef = useRef(false)
  useEffect(() => {
    contestoRef.current = votado !== null
  })
  const seguidoRef = useRef(false)

  useEffect(() => {
    if (!keyboard) return
    const onKey = (e: KeyboardEvent) => {
      if (enCampoDeTexto(e.target)) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === "Enter") {
        e.preventDefault()
        if (seguidoRef.current) return
        seguidoRef.current = true
        onContinue(contestoRef.current)
        return
      }
      const i = TECLAS.indexOf(e.key)
      if (i === -1) return
      e.preventDefault()
      void votarRef.current(OPCIONES[i].voto)
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [keyboard, onContinue])

  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col justify-center gap-6 p-6",
        !fullBleed && "rounded-lg border border-border bg-card",
        className,
      )}
    >
      <div className="space-y-2 text-center">
        <h2 className="text-xl font-semibold">¿Te están saliendo repetidas?</h2>
        <p className="text-sm text-muted-foreground">
          Nos sirve para saber cuánto ampliar el banco.
        </p>
      </div>

      <div className="mx-auto flex w-full max-w-xs flex-col gap-2">
        {OPCIONES.map((o, i) => (
          <motion.button
            key={o.voto}
            type="button"
            disabled={votado !== null}
            onClick={() => void votar(o.voto)}
            // Sin `opacity` en el `initial`, igual que la otra: si el rAF no
            // corre —pestaña de fondo— las tres opciones quedarían invisibles y
            // la pregunta sería incontestable. Con solo `y`, el peor caso es que
            // aparezcan ocho píxeles corridas.
            initial={reduce ? false : { y: 8 }}
            animate={{
              opacity: votado !== null && votado !== o.voto ? 0.4 : 1,
              y: 0,
            }}
            transition={{
              duration: reduce ? 0 : 0.22,
              delay: reduce || votado !== null ? 0 : 0.05 * i,
              ease: "easeOut",
            }}
            whileTap={reduce || votado !== null ? undefined : { scale: 0.97 }}
            className={cn(
              "relative flex items-center justify-center gap-3 rounded-lg border px-4 py-3 transition-colors",
              votado === null && "hover:border-chart-5 hover:bg-accent/40",
              votado === o.voto && "border-chart-5 bg-accent/40",
            )}
          >
            <span aria-hidden className="text-2xl">
              {o.emoji}
            </span>
            <span className="font-medium">{o.texto}</span>
            {keyboard && (
              <KeyCap className="absolute right-3 ml-0">{TECLAS[i]}</KeyCap>
            )}
          </motion.button>
        ))}
      </div>

      {/* El alto se reserva igual que en la otra diapo, aunque acá la línea sea
          siempre la misma: sin esto, aparece y empuja los tres botones justo
          cuando la persona acabó de tocar uno. */}
      <div className="min-h-5 text-center text-sm text-muted-foreground">
        {votado !== null && (
          <motion.p
            initial={reduce ? false : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduce ? 0 : 0.25, ease: "easeOut" }}
          >
            Anotado.
          </motion.p>
        )}
      </div>

      <Salida slot={slotSalida}>
        <button
          type="button"
          onClick={() => onContinue(votado !== null)}
          className={cn(
            "flex w-full items-center justify-center rounded-md bg-white text-base font-semibold text-black transition-colors hover:bg-white/90",
            slotSalida ? "h-[var(--cta-h)]" : "mt-3 px-4 py-3",
          )}
        >
          Continuar
          {keyboard && <KeyCap>{teclas.enter}</KeyCap>}
        </button>
      </Salida>
    </div>
  )
}
