"use client"

// Card del enunciado + banner de feedback. El input y el teclado los arma el
// layout (mobile-flow / desktop-layout); acá va solo lo presentacional.

import MathText from "@/components/math-text"
import { XpDots } from "@/components/xp-dots"
import { cn } from "@/lib/utils"
import type { GameAnswer } from "./UseGameExercise"

// Siempre la misma: la persona no tiene que releerla, pero sin ella la primera
// pantalla es una fórmula suelta sin consigna.
export const PROMPT_QUESTION = "¿Cuál es la derivada de la siguiente función?"

export function ExerciseCard({
  streak,
  attempted,
  promptLatex,
  stars,
  children,
  className,
}: {
  // Correctas al primer intento seguidas (el combo del jugador).
  streak: number
  attempted: number
  promptLatex: string
  stars: number
  children?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex flex-col rounded-lg border border-border bg-card p-4", className)}>
      <div className="flex shrink-0 items-center justify-between gap-3 text-sm">
        <span className="flex items-center gap-3 tabular-nums">
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
          <span className="text-muted-foreground" aria-label={`${attempted} ejercicios`}>
            {attempted} ejercicios
          </span>
        </span>
        <span aria-label={`dificultad ${stars} de 5`} className="tracking-tight text-muted-foreground">
          {"●".repeat(stars)}
          <span className="opacity-25">{"●".repeat(5 - stars)}</span>
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

// Mismo lenguaje que el footer del session-runner: verde al acertar, naranja
// al errar (con el feedback específico o genérico del server).
export function FeedbackBanner({ answer }: { answer: GameAnswer }) {
  if (!answer.parse_ok) {
    return (
      <div className="rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
        {answer.parse_error ?? "No pudimos evaluar tu respuesta."} No cuenta
        como intento.
      </div>
    )
  }
  if (answer.correct) {
    return (
      <div className="rounded-lg border border-green-500/50 bg-green-500/10 px-4 py-3">
        <p className="flex items-center gap-2 font-medium text-green-400">
          ¡Correcto!
          <span className="inline-flex items-center gap-1 text-sm">
            +{answer.xp_awarded} <XpDots className="h-3.5 w-auto" />
          </span>
        </p>
        {answer.combo_bonus > 0 && (
          <p className="mt-1 text-sm text-muted-foreground">
            Combo ×{answer.combo}: +{answer.combo_bonus} extra
          </p>
        )}
      </div>
    )
  }
  return (
    <div
      className={cn(
        "rounded-lg border border-orange-500/50 bg-orange-500/10 px-4 py-3",
      )}
    >
      <p className="font-medium text-orange-300">
        {answer.attempts_left > 0 ? "¿Seguro?" : "Era así:"}
      </p>
      {answer.attempts_left > 0 && answer.feedback_incorrect && (
        <div className="mt-1 text-sm text-foreground/90">
          <MathText text={answer.feedback_incorrect} />
        </div>
      )}
      {answer.correct_answer_latex && (
        <div className="mt-1 text-sm">
          <MathText text={`$$f'(x) = ${answer.correct_answer_latex}$$`} />
        </div>
      )}
    </div>
  )
}
