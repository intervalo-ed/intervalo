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

// Ancho del canal central del panel. Lo comparten el campo de la respuesta, su
// feedback y las teclas (math-keyboard.tsx :: CONTENT_WIDTH): con todo alineado
// al mismo ancho, el panel se lee como una columna en vez de como tres cajas de
// bordes distintos. La fórmula queda afuera a propósito — una derivada larga
// necesita todo el ancho de la card antes de ponerse a scrollear.
export const PANEL_CONTENT = "mx-auto w-full max-w-[28rem]"

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

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

// Un dígito como rodillo: la tira completa de 0 a 9, desplazada hasta dejar a
// la vista el que toca. La dirección del giro no se calcula ni se recuerda —
// sale sola de interpolar el `y` entre el valor viejo y el nuevo, así que subir
// de 4 a 5 rueda hacia arriba y caer de 7 a 0 rueda hacia abajo, sin comparar
// nada contra un valor anterior guardado.
//
// La tira mide diez líneas, así que un 10% de su alto es exactamente una línea:
// por eso el desplazamiento va en porcentaje y no en `em`, y el rodillo sigue
// cuadrando si cambia el tamaño de letra.
const LINE = "1.1em"

function RollingDigit({ d, instant }: { d: number; instant: boolean }) {
  return (
    <span className="inline-block overflow-hidden" style={{ height: LINE }}>
      <motion.span
        className="flex flex-col"
        animate={{ y: `${-d * 10}%` }}
        transition={instant ? { duration: 0 } : { type: "spring", stiffness: 300, damping: 32 }}
      >
        {DIGITS.map((n) => (
          <span key={n} style={{ height: LINE, lineHeight: LINE }}>
            {n}
          </span>
        ))}
      </motion.span>
    </span>
  )
}

function RollingNumber({ value }: { value: number }) {
  const reduceMotion = useReducedMotion()
  const digits = Math.max(0, Math.trunc(value)).toString().split("")
  return (
    // aria-hidden: diez dígitos por columna son ruido para un lector de
    // pantalla. El número lo anuncia el aria-label del contador.
    <span aria-hidden className="flex tabular-nums">
      {digits.map((d, i) => (
        // La key cuenta desde la DERECHA: al pasar de 9 a 10 la columna de las
        // unidades tiene que seguir siendo la misma y rodar de 9 a 0, no
        // remontarse y aparecer de golpe.
        <RollingDigit key={digits.length - i} d={Number(d)} instant={!!reduceMotion} />
      ))}
    </span>
  )
}

function Counter({
  value,
  emoji,
  label,
  dim = false,
}: {
  value: number
  emoji: string
  label: string
  dim?: boolean
}) {
  return (
    // `leading-none` en los dos: el emoji trae una caja de línea más alta que
    // la del rodillo y, sin achicarla, estiraba la fila entera y empujaba la
    // pregunta hacia abajo.
    <span
      className={cn(
        "flex items-center gap-1.5 text-base font-medium leading-none",
        dim ? "text-muted-foreground" : "text-foreground",
      )}
      aria-label={label}
    >
      <RollingNumber value={value} />
      {/* Sin corrección de posición a propósito. Medido en pantalla: la tinta
          del dígito y la del emoji tienen su centro a la misma altura sobre la
          línea base, y con `leading-none` en los dos el centrado del flex deja
          las dos líneas base en el mismo píxel. Cualquier empujón acá los
          desalinea en vez de arreglarlos. */}
      <span aria-hidden className={cn("leading-none", dim && "opacity-40 grayscale")}>
        {emoji}
      </span>
    </span>
  )
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
      {/* La pregunta y los marcadores comparten renglón. Los dos marcadores van
          juntos porque son la misma clase de dato —cuánto llevás—; separados a
          los extremos se leían como si midieran cosas distintas. La palabra
          "ejercicios" se fue con ellos: al lado de un número con emoji, el
          rótulo sobraba.
          La pregunta puede achicarse (`min-w-0`) y los marcadores no: en el
          teléfono lo que cede es el texto, que envuelve, y no los números. */}
      <div className="flex shrink-0 items-center justify-between gap-3">
        <p className="min-w-0 text-sm text-muted-foreground md:text-base">{PROMPT_QUESTION}</p>
        <span className="flex shrink-0 items-center gap-4">
          <Counter value={attempted} emoji="🧮" label={`${attempted} ejercicios`} />
          <Counter value={streak} emoji="🔥" label={`racha de ${streak}`} dim={streak === 0} />
        </span>
      </div>
      {/* En escritorio la card crece hasta llenar la columna: el enunciado y el
          campo quedan centrados en vez de apretados arriba con un hueco abajo.
          Sin `min-h-0` a propósito — con él, en una ventana baja la card se
          encoge por debajo de su contenido y el enunciado se sale por arriba. */}
      <div className="flex flex-1 flex-col justify-center gap-3">
        {/* La función es el foco de la pantalla y hasta acá se leía al mismo
            cuerpo que el resto del texto. El tamaño va en el contenedor y no en
            KaTeX: MathText ya escala su propio `.katex` en `em`, así que basta
            con moverle la base. */}
        <div className="text-[1.45rem]">
          <MathText text={`$$f(x) = ${promptLatex}$$`} />
        </div>
        {children}
      </div>
    </div>
  )
}

// El feedback, debajo del campo: es donde queda el ojo después de escribir. Va
// centrado y con el mismo ancho que el campo, así aparece y desaparece sin
// correr nada de lugar a los costados.
export function FeedbackLine({ answer }: { answer: GameAnswer }) {
  if (!answer.parse_ok) {
    return (
      <div className="text-center text-sm" style={{ color: WRONG }}>
        <p className="font-medium">{answer.parse_error ?? "No pudimos leer tu respuesta."}</p>
        <p className="mt-0.5 text-muted-foreground">No cuenta como intento.</p>
      </div>
    )
  }
  if (answer.correct) {
    return (
      <div className="text-center">
        <p
          className="flex items-center justify-center gap-2 font-medium"
          style={{ color: RIGHT }}
        >
          ¡Correcto!
          <span className="inline-flex items-center gap-1 text-sm">
            +{answer.xp_awarded}
            <XpDots className="h-3.5 w-auto" />
          </span>
        </p>
        {answer.combo_bonus > 0 && (
          <p className="mt-0.5 text-sm text-muted-foreground">
            Combo ×{answer.combo}: +{answer.combo_bonus} extra
          </p>
        )}
      </div>
    )
  }
  if (answer.attempts_left > 0) {
    return (
      <div className="text-center text-sm">
        <p className="font-medium" style={{ color: WRONG }}>
          ¿Seguro?
        </p>
        {answer.feedback_incorrect && (
          <div className="mt-0.5 text-muted-foreground">
            <MathText text={answer.feedback_incorrect} />
          </div>
        )}
      </div>
    )
  }
  return (
    <div className="text-center text-sm">
      <p className="font-medium" style={{ color: WRONG }}>
        Era así
      </p>
      {answer.correct_answer_latex && (
        <div className="mt-0.5 text-[1.05rem] text-foreground">
          <MathText text={`$f'(x) = ${answer.correct_answer_latex}$`} />
        </div>
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

// Saltear. Mismo formato que el botón "Opciones" de las sesiones de Intervalo
// (session-runner.tsx :: OptionsArea): contorno fino sobre el fondo, sin
// relleno. Es la forma que el proyecto ya usa para "la acción secundaria de
// este paso", y acá cumple ese mismo papel al lado del botón principal.
//
// Va al lado y no debajo porque el pedido fue que el bloque ocupara menos alto,
// y una fila más para un atajo secundario iba justo en contra.
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
      variant="outline"
      disabled={disabled}
      onClick={onClick}
      className="h-[var(--cta-h)] shrink-0 rounded-md bg-background px-5 font-normal dark:bg-background"
    >
      Saltear
      {showKeyHint && (
        <KeyCap>
          ⇧
          <CornerDownLeft size={11} strokeWidth={2.5} />
        </KeyCap>
      )}
    </Button>
  )
}
