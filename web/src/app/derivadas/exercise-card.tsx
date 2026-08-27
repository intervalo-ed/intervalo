"use client"

// Card del enunciado y las piezas del feedback. El input y el teclado los arma
// el layout (mobile-flow / desktop-layout); acá va solo lo presentacional.
//
// El feedback NO es un cartel: es el mismo lugar donde se escribió la respuesta
// el que responde. La barra late en verde o se sacude en naranja, el botón toma
// ese color, y arriba de la barra queda una línea con lo que hay que decir (la
// pista, o la derivada correcta cuando ya no quedan intentos). Es el lenguaje
// de las sesiones de Intervalo — el sacudón sale de las opciones del
// session-runner y el latido de las tablas (components/exercise-table.tsx).

import { useEffect, useState } from "react"
import { motion, useReducedMotion } from "motion/react"
import { CornerDownLeft } from "lucide-react"
import MathText from "@/components/math-text"
import { Button } from "@/components/ui/button"
import { XpDots } from "@/components/xp-dots"
import { cn } from "@/lib/utils"
import type { GameAnswer } from "./UseGameExercise"

// Siempre la misma: la persona no tiene que releerla, pero sin ella la primera
// pantalla es una fórmula suelta sin consigna.
export const PROMPT_QUESTION = "¿Cuál es la derivada de la siguiente función?"

// Los mismos hex que usa el session-runner para las opciones: naranja al errar,
// verde al acertar. Que el juego y las sesiones hablen distinto sería gratis y
// no aportaría nada.
const WRONG = "#E3690B"
const RIGHT = "#22C55E"

const TONE_PULSE = {
  correct: "rgba(34, 197, 94, 0.26)",
  wrong: "rgba(227, 105, 11, 0.28)",
} as const

export type AnswerTone = "correct" | "wrong" | null

export function answerTone(answer: GameAnswer | null): AnswerTone {
  if (!answer) return null
  // Un LaTeX que no se pudo leer no consume intento, pero visualmente es un
  // rebote igual: la respuesta no entró.
  if (!answer.parse_ok) return "wrong"
  return answer.correct ? "correct" : "wrong"
}

const SHAKE = [0, -8, 8, -6, 6, -3, 0]
const SHAKE_S = 0.4
const PULSE_S = 0.45

// El sacudón tiene que volver a correr en cada respuesta errada, incluso si la
// anterior también lo estaba: si `animate` se quedara en el mismo valor, motion
// no reanimaría. En vez de resetear el estado desde el efecto (que sería un
// setState síncrono dentro de un effect), se DERIVA: se sacude mientras la
// última respuesta asentada no sea esta.
function useShake(wrong: boolean, seq: number) {
  const [settled, setSettled] = useState<number | null>(null)
  const shaking = wrong && settled !== seq
  useEffect(() => {
    if (!shaking) return
    const t = setTimeout(() => setSettled(seq), SHAKE_S * 1000 + 60)
    return () => clearTimeout(t)
  }, [shaking, seq])
  return shaking
}

export function ExerciseCard({
  streak,
  attempted,
  promptLatex,
  children,
  className,
}: {
  // Correctas al primer intento seguidas (el combo del jugador).
  streak: number
  attempted: number
  promptLatex: string
  children?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex flex-col rounded-lg border border-border bg-card p-4", className)}>
      <div className="flex shrink-0 items-center justify-between gap-3 text-sm tabular-nums">
        <span className="text-muted-foreground" aria-label={`${attempted} ejercicios`}>
          {attempted} ejercicios
        </span>
        <span
          className={cn(
            "flex items-center gap-1",
            streak > 0 ? "text-foreground" : "text-muted-foreground",
          )}
          aria-label={`racha de ${streak}`}
        >
          {streak}
          <span aria-hidden className={streak > 0 ? undefined : "opacity-40 grayscale"}>
            🔥
          </span>
        </span>
      </div>
      <p className="mt-1 shrink-0 text-sm text-muted-foreground">{PROMPT_QUESTION}</p>
      {/* En escritorio la card crece hasta llenar la columna: el enunciado y el
          campo quedan centrados en vez de apretados arriba con un hueco abajo.
          Sin `min-h-0` a propósito — con él, en una ventana baja la card se
          encoge por debajo de su contenido y el enunciado se sale por arriba. */}
      <div className="flex flex-1 flex-col justify-center gap-3">
        <MathText text={`$$f(x) = ${promptLatex}$$`} />
        {children}
      </div>
    </div>
  )
}

// La línea de feedback, arriba de la barra. Corta a propósito: lo que hay que
// mirar es la respuesta, no el cartel que la comenta.
export function FeedbackLine({ answer }: { answer: GameAnswer }) {
  if (!answer.parse_ok) {
    return (
      <p className="text-sm" style={{ color: WRONG }}>
        {answer.parse_error ?? "No pudimos leer tu respuesta."} No cuenta como intento.
      </p>
    )
  }
  if (answer.correct) {
    return (
      <p className="flex items-center gap-1.5 text-sm font-medium" style={{ color: RIGHT }}>
        +{answer.xp_awarded}
        <XpDots className="h-3.5 w-auto" />
        {answer.combo_bonus > 0 && (
          <span className="font-normal text-muted-foreground">
            · combo ×{answer.combo}: +{answer.combo_bonus}
          </span>
        )}
      </p>
    )
  }
  if (answer.attempts_left > 0) {
    return (
      <div className="text-sm" style={{ color: WRONG }}>
        {answer.feedback_incorrect ? (
          <MathText text={answer.feedback_incorrect} />
        ) : (
          "¿Seguro? Fijate de nuevo."
        )}
      </div>
    )
  }
  return (
    <div className="text-sm" style={{ color: WRONG }}>
      Era así:
      {answer.correct_answer_latex && (
        <span className="ml-1.5 text-foreground">
          <MathText text={`$f'(x) = ${answer.correct_answer_latex}$`} />
        </span>
      )}
    </div>
  )
}

// La caja de la respuesta: late al confirmar y se sacude si está mal. El pulso
// va montado por `seq` y no por tono, así dos erradas seguidas laten dos veces.
export function AnswerField({
  tone,
  seq,
  children,
}: {
  tone: AnswerTone
  seq: number
  children?: React.ReactNode
}) {
  const reduceMotion = useReducedMotion()
  const shaking = useShake(tone === "wrong", seq) && !reduceMotion

  return (
    <motion.div
      className="relative"
      animate={shaking ? { x: SHAKE } : { x: 0 }}
      transition={shaking ? { duration: SHAKE_S, ease: "easeInOut" } : { duration: 0 }}
    >
      {children}
      {tone && !reduceMotion && (
        <motion.span
          key={`pulse-${seq}`}
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-lg"
          initial={{ backgroundColor: "rgba(0,0,0,0)" }}
          animate={{
            backgroundColor: ["rgba(0,0,0,0)", TONE_PULSE[tone], "rgba(0,0,0,0)"],
          }}
          transition={{ duration: PULSE_S, times: [0, 0.22, 1], ease: "easeOut" }}
        />
      )}
    </motion.div>
  )
}

// Chip de tecla, con el aire y el redondeo de los que muestran los CLI. Solo en
// escritorio: en el teléfono no hay tecla que mostrar.
// Los colores salen de `currentColor`: el mismo chip va sobre el botón blanco
// (texto negro) y sobre el "saltear" apagado (texto claro).
function KeyCap({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="ml-2 inline-flex items-center gap-0.5 rounded border border-current/25 bg-current/10 px-1.5 py-[3px] font-mono text-[0.7rem] font-normal leading-none">
      {children}
    </kbd>
  )
}

// El botón ES el feedback: verde y "Continuar" al acertar, naranja y un
// sacudón al errar. Vuelve a blanco solo cuando el layout limpia la respuesta,
// que es en cuanto la persona empieza a corregir.
export function AnswerButton({
  tone,
  seq,
  closed,
  disabled,
  onClick,
  showKeyHint = false,
  className,
}: {
  tone: AnswerTone
  seq: number
  closed: boolean
  disabled?: boolean
  onClick: () => void
  showKeyHint?: boolean
  className?: string
}) {
  const reduceMotion = useReducedMotion()
  const shaking = useShake(tone === "wrong", seq) && !reduceMotion

  const bg = tone === "correct" ? RIGHT : tone === "wrong" ? WRONG : "#FFFFFF"

  return (
    <motion.div
      className={cn("shrink-0", className)}
      animate={shaking ? { x: SHAKE } : { x: 0 }}
      transition={shaking ? { duration: SHAKE_S, ease: "easeInOut" } : { duration: 0 }}
    >
      <Button
        size="lg"
        // El color va inline y no por clase: son los mismos hex que el resto
        // del feedback, y Tailwind no genera clases interpoladas.
        style={{ backgroundColor: bg, color: "#000" }}
        className="h-[var(--cta-h)] w-full rounded-md transition-colors hover:opacity-90"
        disabled={disabled}
        onClick={onClick}
      >
        {closed ? "Continuar" : "Revisar"}
        {showKeyHint && (
          <KeyCap>
            <CornerDownLeft size={11} strokeWidth={2.5} />
          </KeyCap>
        )}
      </Button>
    </motion.div>
  )
}

// Saltear. Vive al lado del botón principal y no debajo: el pedido fue que el
// bloque ocupara menos alto, y una fila más para un atajo secundario iba justo
// en contra.
export function SkipButton({
  disabled,
  onClick,
  showKeyHint = false,
}: {
  disabled?: boolean
  onClick: () => void
  showKeyHint?: boolean
}) {
  return (
    <Button
      size="lg"
      variant="ghost"
      disabled={disabled}
      onClick={onClick}
      className="h-[var(--cta-h)] shrink-0 rounded-md px-3 text-sm font-normal text-muted-foreground hover:text-foreground"
    >
      saltear
      {showKeyHint && (
        <KeyCap>
          ⇧
          <CornerDownLeft size={11} strokeWidth={2.5} />
        </KeyCap>
      )}
    </Button>
  )
}
