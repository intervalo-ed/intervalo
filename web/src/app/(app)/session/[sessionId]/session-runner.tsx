"use client"

import MathGraph from "@/components/math-graph"
import MathText from "@/components/math-text"
import { XpDots } from "@/components/xp-dots"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Screen, ScreenBody, ScreenHeader } from "@/components/ui/screen"
import { Spinner } from "@/components/ui/spinner"
import { useSfx } from "@/lib/audio/useSfx"
import { topicShortLabel } from "@/lib/catalog"
import { exerciseTypeInfo } from "@/lib/catalog/exercise-types"
import { cn } from "@/lib/utils"
import { Braces, ChevronLeft, Eye, EyeOff, SkipForward, X } from "lucide-react"
import { animate, AnimatePresence, motion } from "motion/react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useRef, useState } from "react"
import { useAnswer } from "./UseAnswer"
import { useSessionPayload } from "./UseSessionPayload"
import type { SessionExercise } from "@/lib/api/types"

// Funciones que LaTeX renderiza como palabra completa (ej. \cos x -> "cos x"),
// a diferencia de comandos como \times o \pi que renderizan como un solo símbolo.
const LATEX_NAMED_FUNCTIONS =
  /\\(sin|cos|tan|cot|sec|csc|ln|log|lim|exp|min|max|gcd|lcm|det|dim|ker|sinh|cosh|tanh|arcsin|arccos|arctan)\b/g

// Estima el ancho visual renderizado de una opción con LaTeX, en vez de contar
// caracteres de código fuente (que sobrestima el peso de comandos como \sqrt o
// \frac, cortos en pantalla pero largos en texto plano).
function latexVisualLength(option: string): number {
  let s = option.replace(/\$/g, "")
  s = s.replace(/\\operatorname\{([^{}]*)\}/g, (_, inner) => "x".repeat(inner.length))
  s = s.replace(/\\sqrt\{([^{}]*)\}/g, (_, inner) => "x".repeat(inner.length + 1))
  s = s.replace(
    /\\d?frac\{([^{}]*)\}\{([^{}]*)\}/g,
    (_, num, den) => "x".repeat(Math.max(num.length, den.length)),
  )
  s = s.replace(LATEX_NAMED_FUNCTIONS, (_, name) => "x".repeat(name.length))
  s = s.replace(/\\[a-zA-Z]+/g, "x")
  s = s.replace(/(?<!\\)[{}]/g, "")
  return s.length
}

const ctaCls =
  "h-[var(--cta-h)] flex-1 rounded-md bg-white text-black hover:bg-white/90 hover:text-black"

// Mismas transiciones de slide que el onboarding (deslizamiento horizontal,
// dir-aware, 0.28s easeInOut, modo sync).
type SlideCustom = { dir: number }
const slideVariants = {
  enter: (c: SlideCustom) => ({ x: c.dir > 0 ? "100%" : "-100%", opacity: 1 }),
  center: { x: "0%", opacity: 1 },
  exit: (c: SlideCustom) => ({ x: c.dir > 0 ? "-100%" : "100%", opacity: 1 }),
}

// Estado por ejercicio: persiste al navegar para atrás/adelante.
type ExState = {
  selection: number | null
  wrongOptions: number[]
  result: "correct" | "wrong" | null
  xp: number | null
  showWhy: boolean
}
const DEFAULT_EX: ExState = {
  selection: null,
  wrongOptions: [],
  result: null,
  xp: null,
  showWhy: false,
}

export default function SessionRunner({ sessionId }: { sessionId: string }) {
  const payload = useSessionPayload({ id: sessionId })
  const router = useRouter()
  const sfx = useSfx()
  const answer = useAnswer()
  const [idx, setIdx] = useState(0)
  const [dir, setDir] = useState<1 | -1>(1)
  const [states, setStates] = useState<Record<number, ExState>>({})
  const [shakeIdx, setShakeIdx] = useState<number | null>(null)
  const [feedbackByIdx, setFeedbackByIdx] = useState<Record<number, string>>({})
  const [distractorFbByIdx, setDistractorFbByIdx] = useState<
    Record<number, Record<number, string>>
  >({})
  const [explanationFbByIdx, setExplanationFbByIdx] = useState<
    Record<number, string>
  >({})
  const [noAnswer, setNoAnswer] = useState(false)
  const [gotoValue, setGotoValue] = useState("")
  // Gate del footer de feedback: al navegar se apaga y se vuelve a prender
  // recién cuando termina la animación del slide (para que salga después).
  const [footerReady, setFooterReady] = useState(true)
  // Al finalizar, la navegación al resumen puede tardar un instante. Apenas se
  // toca el botón, este flag dispara un fade-out que tapa el contenido para que
  // la espera no se sienta como una pantalla congelada.
  const [finishing, setFinishing] = useState(false)
  const startedAt = useRef(Date.now())
  const wrongResetRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const bodyRef = useRef<HTMLDivElement>(null)

  // Vuelve el scroll arriba con una animación suave, en simultáneo con el
  // deslizamiento horizontal del slide (misma duración/curva).
  function scrollToTop() {
    const el = bodyRef.current
    if (!el || el.scrollTop === 0) return
    animate(el.scrollTop, 0, {
      duration: 0.28,
      ease: "easeInOut",
      onUpdate: (v) => {
        el.scrollTop = v
      },
    })
  }

  if (payload === undefined) {
    return (
      <Screen>
        <ScreenBody className="items-center justify-center text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Spinner />
            <span>Cargando sesión…</span>
          </div>
        </ScreenBody>
      </Screen>
    )
  }

  if (payload === null) {
    return (
      <Screen>
        <ScreenBody className="items-center justify-center text-center">
          <div className="flex flex-col items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">
              Esta sesión expiró
            </h1>
            <p className="text-sm text-muted-foreground">
              Iniciá una nueva desde el inicio.
            </p>
          </div>
        </ScreenBody>
        <div className="shrink-0 px-5 pt-[var(--cta-pt)] pb-[var(--cta-pb)]">
          <div className="mx-auto w-full max-w-2xl">
            <Button
              size="lg"
              className="h-[var(--cta-h)] w-full rounded-md bg-white text-black hover:bg-white/90 hover:text-black"
              nativeButton={false}
              render={<Link href="/" />}
            >
              Continuar
            </Button>
          </div>
        </div>
      </Screen>
    )
  }

  const total = payload.exercises.length
  const exercise = payload.exercises[idx]
  const isTest = payload.mode === "test"
  if (!exercise) return null

  const cur = states[idx] ?? DEFAULT_EX
  const isLast = idx === total - 1
  const pct = Math.round(((idx + 1) / total) * 100)
  const solved = cur.result === "correct"
  // Resuelto recién después de haber fallado al menos una vez → acento lima.
  const solvedAfterError = solved && cur.wrongOptions.length > 0
  const continueLabel = isLast ? "Finalizar" : "Continuar"
  const canGoBack = isTest ? idx > 0 || cur.showWhy : idx > 0 || cur.showWhy

  function patch(p: Partial<ExState>) {
    setStates((s) => ({ ...s, [idx]: { ...(s[idx] ?? DEFAULT_EX), ...p } }))
  }

  const skillProgress = (() => {
    const et = exercise.exercise_type
    if (!et) return null
    const group = payload.exercises.filter((e) => e.exercise_type === et)
    const posInGroup = group.findIndex((e) => e.id === exercise.id) + 1
    return { et, posInGroup, groupSize: group.length }
  })()

  function onSkip() {
    if (isLast) return
    sfx.continue()
    navTo(idx + 1, 1)
  }

  function onGoto() {
    const n = parseInt(gotoValue, 10)
    if (!Number.isFinite(n) || n < 1 || n > total) return
    const target = n - 1
    if (target === idx) return
    navTo(target, target > idx ? 1 : -1)
    setGotoValue("")
  }

  function copyFeedback() {
    const rawJson = JSON.stringify(exercise, null, 2)
    const distractorFb = distractorFbByIdx[idx] ?? {}
    const distractorLines = Object.entries(distractorFb)
      .filter(([, t]) => t.trim())
      .map(
        ([i, t]) =>
          `feedback sobre distractor ${i} (${exercise.options[Number(i)]}):\n${t}\n`,
      )
      .join("\n")
    const explanationFb = (explanationFbByIdx[idx] ?? "").trim()
    const generalFb = (feedbackByIdx[idx] ?? "").trim()
    const snippet =
      `${rawJson}\n` +
      (generalFb ? `\nfeedback general:\n${generalFb}\n` : "") +
      (distractorLines ? `\n${distractorLines}` : "") +
      (explanationFb ? `\nfeedback sobre la explicación:\n${explanationFb}\n` : "")
    navigator.clipboard?.writeText(snippet)
  }

  function copyExternalId() {
    navigator.clipboard?.writeText(exercise.external_id || exercise.id)
  }

  function navTo(target: number, direction: 1 | -1) {
    setDir(direction)
    setFooterReady(false)
    scrollToTop()
    if (!states[target]?.result) startedAt.current = Date.now()
    setIdx(target)
  }

  function goBack() {
    if (cur.showWhy) {
      setDir(-1)
      scrollToTop()
      patch({ showWhy: false })
      return
    }
    if (idx > 0) navTo(idx - 1, -1)
  }

  function onContinue() {
    if (isLast) {
      // Sonido de "carga" ascendente: arranca al tocar y sigue sonando (sin
      // cortarse) durante la transición al resumen, donde se carga la bolita.
      setFinishing(true)
      sfx.charge()
      router.push(`/session/${sessionId}/summary`)
      return
    }
    sfx.continue()
    navTo(idx + 1, 1)
  }

  function handlePick(i: number) {
    if (solved || cur.wrongOptions.includes(i)) return
    if (wrongResetRef.current) {
      clearTimeout(wrongResetRef.current)
      wrongResetRef.current = null
    }
    sfx.select()
    patch({ selection: i, result: null })
  }

  function onRevisar() {
    if (cur.selection === null || solved) return
    if (cur.selection === exercise.correct_index) {
      patch({ result: "correct" })
      answer.mutate(
        {
          session_id: sessionId,
          exercise_id: exercise.id,
          answer_index: cur.selection,
          attempts: cur.wrongOptions.length + 1,
          response_time_s: (Date.now() - startedAt.current) / 1000,
        },
        { onSuccess: (data) => patch({ xp: data.xp_earned }) },
      )
      sfx.correct()
      return
    }
    sfx.wrong()
    const wrongIdx = cur.selection
    patch({
      result: "wrong",
      wrongOptions: [...cur.wrongOptions, wrongIdx],
      selection: null,
    })
    setShakeIdx(wrongIdx)
    setTimeout(() => setShakeIdx(null), 450)
    wrongResetRef.current = setTimeout(() => {
      patch({ result: null })
      wrongResetRef.current = null
    }, 8000)
  }

  function openWhy() {
    sfx.continue()
    setDir(1)
    scrollToTop()
    patch({ showWhy: true })
  }

  return (
    <Screen>
      <ScreenHeader>
        <Button
          variant="ghost"
          size="icon"
          onClick={goBack}
          disabled={!canGoBack}
          aria-label="Volver"
        >
          <ChevronLeft />
        </Button>
        {isTest ? (
          <div className="flex flex-1 items-center gap-2 overflow-hidden">
            <button
              onClick={copyExternalId}
              title="Copiar external_id"
              className="truncate rounded-md border border-white/15 bg-white/5 px-2 py-1 font-mono text-[11px] text-foreground/80 hover:border-white/40"
            >
              {exercise.external_id || exercise.id}
            </button>
            {skillProgress && (
              <span className="shrink-0 rounded-md border border-white/10 px-2 py-1 text-[11px] text-foreground/60">
                {skillProgress.posInGroup}/{skillProgress.groupSize} ·{" "}
                {exerciseTypeInfo({ type: skillProgress.et }).label}
              </span>
            )}
            <span className="ml-auto flex items-center gap-1">
              <JsonDialog exercise={exercise} />
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setNoAnswer((v) => !v)}
                aria-label="Modo sin responder"
                title={noAnswer ? "Salir del modo revisión" : "Ver sin responder"}
              >
                {noAnswer ? <EyeOff /> : <Eye />}
              </Button>
            </span>
          </div>
        ) : (
          <div className="h-3 flex-1 overflow-hidden rounded-full bg-border">
            <motion.div
              className="h-full rounded-full bg-primary"
              initial={{ width: "0%" }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.45, ease: [0.32, 0.72, 0, 1] }}
            />
          </div>
        )}
        <ExitButton />
      </ScreenHeader>
      {isTest && (
        <div className="border-b border-white/5 px-5 py-1.5 text-xs text-foreground/60">
          <div className="mx-auto flex w-full max-w-2xl items-center gap-2">
            <span>
              {topicShortLabel({ topic: exercise.topic })} · {exercise.belt}
            </span>
            <span className="ml-auto flex items-center gap-1">
              <span>{idx + 1}/{total}</span>
              <span className="mx-1 text-foreground/30">·</span>
              <span>ir a</span>
              <input
                type="number"
                min={1}
                max={total}
                value={gotoValue}
                onChange={(e) => setGotoValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") onGoto()
                }}
                className="w-14 rounded border border-white/15 bg-white/5 px-1 py-0.5 text-right text-foreground/80"
              />
              <button
                onClick={onGoto}
                className="rounded border border-white/15 px-1.5 py-0.5 text-foreground/70 hover:border-white/40"
              >
                OK
              </button>
            </span>
          </div>
        </div>
      )}

      <ScreenBody ref={bodyRef} className="overflow-x-hidden pt-0">
        <div className="grid min-h-full w-full grid-cols-1">
          <AnimatePresence mode="sync" initial={false} custom={{ dir }}>
            <motion.div
              key={cur.showWhy ? `why-${idx}` : `q-${idx}`}
              custom={{ dir }}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.28, ease: "easeInOut" }}
              onAnimationComplete={() => setFooterReady(true)}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.15}
              dragSnapToOrigin
              onDragEnd={(_, info) => {
                if (info.offset.x > 80 && canGoBack) goBack()
                else if (info.offset.x < -80 && (solved || cur.showWhy))
                  onContinue()
              }}
              className="col-start-1 row-start-1 flex min-h-full min-w-0 flex-col"
            >
              {/* Centrado vertical sesgado hacia arriba (2.5:3) con margen mínimo
                  de 40px arriba; si el ejercicio es largo, los spacers colapsan
                  y el contenido scrollea. */}
              <div className="min-h-[40px] flex-[2.5]" />
              <div className="flex flex-col gap-5">
              {cur.showWhy ? (
                <div className="flex flex-col gap-3 leading-relaxed text-foreground/80">
                  <MathText text={exercise.explanation ?? ""} />
                  {isTest && <TestFeedbackBox
                    idx={idx}
                    value={feedbackByIdx[idx] ?? ""}
                    onChange={(v) =>
                      setFeedbackByIdx((f) => ({ ...f, [idx]: v }))
                    }
                    onCopy={copyFeedback}
                  />}
                </div>
              ) : (
                <>
                  <p className="text-base leading-snug">
                    <MathText text={exercise.question} />
                  </p>

                  {exercise.graph_fn && (
                    <MathGraph
                      graphFn={exercise.graph_fn}
                      graphView={exercise.graph_view}
                    />
                  )}

                  {(() => {
                    const hasLatex = exercise.options.some((o) => o.includes("$"))
                    const limit = hasLatex ? 12 : 25
                    // Una raíz anidada dentro de una fracción (ej. 3√5/5) pesa poco en
                    // el estimado de ancho, pero el símbolo de raíz + la barra de
                    // fracción apiladas se leen recargadas y chicas comprimidas a la
                    // mitad del ancho en la grilla — para esa combinación, mejor lista.
                    const hasNestedSqrtFrac = exercise.options.some(
                      (o) => /\\sqrt/.test(o) && /\\d?frac/.test(o),
                    )
                    const useGrid =
                      !hasNestedSqrtFrac &&
                      exercise.options.length === 4 &&
                      exercise.options.every((o) =>
                        (hasLatex ? latexVisualLength(o) : o.length) <= limit,
                      )
                    return (
                      <div className={useGrid ? "grid grid-cols-2 gap-2" : "flex flex-col gap-2"}>
                        {exercise.options.map((opt, i) => {
                          const isSelected = cur.selection === i
                          const isCorrectOpt = i === exercise.correct_index
                          const isWrong = cur.wrongOptions.includes(i)
                          const isShaking = shakeIdx === i

                          let borderCls = "border-white/10"
                          let textCls = "text-foreground/80"
                          let extraCls = ""
                          if (isTest && noAnswer) {
                            if (isCorrectOpt) {
                              borderCls = "border-green-500/50"
                              textCls = "text-green-400 font-medium"
                            } else {
                              extraCls = "opacity-60"
                            }
                          } else if (isShaking) {
                            borderCls = "border-[#E3690B]"
                            textCls = "text-[#E3690B] font-medium"
                          } else if (isWrong) {
                            extraCls = "opacity-40"
                          } else if (solved && isSelected && isCorrectOpt) {
                            if (solvedAfterError) {
                              borderCls = "border-[#D9F99D]/50"
                              textCls = "text-[#D9F99D] font-medium"
                            } else {
                              borderCls = "border-green-500/50"
                              textCls = "text-green-400 font-medium"
                            }
                          } else if (solved) {
                            extraCls = "opacity-40"
                          } else if (isSelected) {
                            borderCls = "border-[#7e80f7]"
                            textCls = "text-[#c4c6ff]"
                          }

                          return (
                            <button
                              key={i}
                              disabled={solved || isWrong || (isTest && noAnswer)}
                              onClick={() => handlePick(i)}
                              className={cn(
                                "w-full rounded-md border bg-white/5 px-4 py-3.5 text-base transition-[color,border-color,opacity] duration-200 disabled:pointer-events-none",
                                useGrid ? "text-center" : "text-left",
                                borderCls,
                                textCls,
                                extraCls,
                              )}
                            >
                              <motion.span
                                className="block"
                                animate={
                                  isShaking
                                    ? { x: [0, -8, 8, -6, 6, -3, 0] }
                                    : { x: 0 }
                                }
                                transition={
                                  isShaking
                                    ? { duration: 0.4, ease: "easeInOut" }
                                    : { duration: 0 }
                                }
                              >
                                <MathText text={opt} />
                              </motion.span>
                            </button>
                          )
                        })}
                      </div>
                    )
                  })()}
                  {isTest && noAnswer && (
                    <div className="flex flex-col gap-3 border-t border-white/10 pt-4 text-sm text-foreground/80">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-semibold uppercase tracking-wide text-foreground/50">
                          Feedback correcto
                        </span>
                        <MathText text={exercise.feedback_correct} />
                      </div>
                      {Array.isArray(exercise.feedback_incorrect) &&
                        exercise.feedback_incorrect.map((hint, i) =>
                          hint ? (
                            <div key={i} className="flex flex-col gap-1.5">
                              <span className="text-xs font-semibold uppercase tracking-wide text-orange-400/80">
                                Distractor {i}: {exercise.options[i]}
                              </span>
                              <MathText text={hint} />
                              <textarea
                                value={(distractorFbByIdx[idx] ?? {})[i] ?? ""}
                                onChange={(e) =>
                                  setDistractorFbByIdx((f) => ({
                                    ...f,
                                    [idx]: {
                                      ...(f[idx] ?? {}),
                                      [i]: e.target.value,
                                    },
                                  }))
                                }
                                placeholder="Feedback sobre este distractor…"
                                className="min-h-16 rounded-md border border-white/10 bg-white/5 p-2 text-xs text-foreground/85 outline-none focus:border-white/40"
                              />
                            </div>
                          ) : null,
                        )}
                      {exercise.explanation && (
                        <div className="flex flex-col gap-1.5">
                          <span className="text-xs font-semibold uppercase tracking-wide text-foreground/50">
                            Explicación
                          </span>
                          <MathText text={exercise.explanation} />
                          <textarea
                            value={explanationFbByIdx[idx] ?? ""}
                            onChange={(e) =>
                              setExplanationFbByIdx((f) => ({
                                ...f,
                                [idx]: e.target.value,
                              }))
                            }
                            placeholder="Feedback sobre la explicación…"
                            className="min-h-16 rounded-md border border-white/10 bg-white/5 p-2 text-xs text-foreground/85 outline-none focus:border-white/40"
                          />
                        </div>
                      )}
                    </div>
                  )}
                  {isTest && (
                    <TestFeedbackBox
                      idx={idx}
                      value={feedbackByIdx[idx] ?? ""}
                      onChange={(v) =>
                        setFeedbackByIdx((f) => ({ ...f, [idx]: v }))
                      }
                      onCopy={copyFeedback}
                    />
                  )}
                </>
              )}
              </div>
              {/* Spacer inferior: flexiona para centrar cuando es corto, y
                  garantiza ~160px para scrollear bajo el último ítem (y que el
                  overlay del footer no lo tape) cuando el ejercicio es largo. */}
              <div className="min-h-[calc(3.5rem_+_var(--cta-pt)_+_var(--cta-h)_+_var(--cta-pb))] flex-[3]" />
            </motion.div>
          </AnimatePresence>
        </div>
      </ScreenBody>

      {/* Capa 1 — fondo sólido del contenedor de botones (atrás de todo). */}
      <div className="fixed inset-x-0 bottom-0 z-20 h-[calc(var(--cta-pt)_+_var(--cta-h)_+_var(--cta-pb))] border-t bg-background" />

      {/* Capa 2 — feedback: sale desde abajo, por delante del fondo del
          contenedor pero por detrás de los botones (asoma por encima de ellos). */}
      <AnimatePresence initial={false}>
        {footerReady && !cur.showWhy && cur.result === "correct" && (
          <motion.div
            key="correct"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="pointer-events-none fixed inset-x-0 bottom-0 z-30 bg-background"
          >
            <div
              className={cn(
                "border-t bg-green-500/10 px-5 pt-6 pb-[calc(var(--cta-pt)_+_var(--cta-h)_+_var(--cta-pb))]",
                solvedAfterError ? "border-[#D9F99D]/50" : "border-green-500/50",
              )}
            >
              <div className="mx-auto w-full max-w-2xl text-[15px]">
                <span
                  className={cn(
                    "font-semibold",
                    solvedAfterError ? "text-[#D9F99D]" : "text-green-400",
                  )}
                >
                  ¡Correcto!
                </span>
                {cur.xp ? (
                  <span
                    className={cn(
                      "ml-1.5 inline-flex items-center gap-0.5 font-semibold",
                      solvedAfterError ? "text-[#D9F99D]" : "text-green-400",
                    )}
                  >
                    +{cur.xp}
                    <XpDots className="-ml-px size-[0.95em]" />
                  </span>
                ) : null}
                <div className="mt-3 text-foreground/85">
                  <MathText text={exercise.feedback_correct} />
                </div>
              </div>
            </div>
          </motion.div>
        )}
        {footerReady && !cur.showWhy && cur.result === "wrong" && (
          <motion.div
            key="wrong"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="pointer-events-none fixed inset-x-0 bottom-0 z-30 bg-background"
          >
            <div className="border-t border-orange-500/50 bg-orange-500/10 px-5 pt-6 pb-[calc(var(--cta-pt)_+_var(--cta-h)_+_var(--cta-pb))]">
              <div className="mx-auto w-full max-w-2xl text-[15px]">
                <span className="font-semibold text-orange-400">¿Seguro?</span>
                <div className="mt-3 text-foreground/85">
                  {(() => {
                    const lastWrongIdx = cur.wrongOptions.length > 0 ? cur.wrongOptions[cur.wrongOptions.length - 1] : null
                    const hint =
                      Array.isArray(exercise.feedback_incorrect) && lastWrongIdx !== null
                        ? (exercise.feedback_incorrect[lastWrongIdx] ?? null)
                        : null
                    return hint ? <MathText text={hint} /> : "Revisá tu respuesta e intentalo una vez más."
                  })()}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Capa 3 — botones (adelante). Contenedor amplio y equilibrado; sin fondo
          propio (lo aporta la capa 1) para que el feedback asome entre medio. */}
      <div className="fixed inset-x-0 bottom-0 z-40 px-5 pt-[var(--cta-pt)] pb-[var(--cta-pb)]">
        <div className="mx-auto w-full max-w-2xl">
          <div className="flex gap-2">
            {cur.showWhy ? (
              <Button size="lg" className={ctaCls} onClick={onContinue}>
                {continueLabel}
              </Button>
            ) : isTest && noAnswer ? (
              <Button size="lg" className={ctaCls} onClick={onSkip}>
                {isLast ? "Terminar" : "Siguiente"}
              </Button>
            ) : solved ? (
              <>
                {exercise.explanation && (
                  <Button
                    variant="outline"
                    size="lg"
                    className="h-[var(--cta-h)] flex-1 rounded-md bg-background dark:bg-background"
                    onClick={openWhy}
                  >
                    ¿Por qué?
                  </Button>
                )}
                <Button size="lg" className={ctaCls} onClick={onContinue}>
                  {continueLabel}
                </Button>
              </>
            ) : (
              <>
                <Button
                  size="lg"
                  className={ctaCls}
                  disabled={cur.selection === null || cur.result === "wrong"}
                  onClick={onRevisar}
                >
                  Revisar
                </Button>
                {isTest && !isLast && (
                  <Button
                    variant="outline"
                    size="lg"
                    className="h-[var(--cta-h)] rounded-md bg-background dark:bg-background"
                    onClick={onSkip}
                    aria-label="Saltear"
                    title="Saltear"
                  >
                    <SkipForward />
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Al tocar "Finalizar" el fondo se superpone al instante (sin animación),
          tapando todo (por delante de los botones, z-40) mientras carga el
          resumen. */}
      {finishing && <div className="fixed inset-0 z-50 bg-background" />}
    </Screen>
  )
}

function TestFeedbackBox({
  idx,
  value,
  onChange,
  onCopy,
}: {
  idx: number
  value: string
  onChange: (value: string) => void
  onCopy: () => void
}) {
  return (
    <div className="flex flex-col gap-2 border-t border-white/10 pt-4">
      <label className="text-xs font-semibold uppercase tracking-wide text-foreground/50">
        Feedback para este ítem
      </label>
      <textarea
        key={idx}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Qué está mal, qué esperabas, qué regla se rompe…"
        className="min-h-24 rounded-md border border-white/15 bg-white/5 p-2 text-sm text-foreground/85 outline-none focus:border-white/40"
      />
      <Button size="sm" variant="outline" onClick={onCopy} className="self-end">
        Copiar snippet
      </Button>
    </div>
  )
}

function JsonDialog({ exercise }: { exercise: SessionExercise }) {
  function copy() {
    navigator.clipboard?.writeText(JSON.stringify(exercise, null, 2))
  }
  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button variant="ghost" size="icon-sm" aria-label="Ver JSON crudo">
            <Braces />
          </Button>
        }
      />
      <DialogContent className="max-h-[85vh] w-[min(90vw,44rem)] max-w-none gap-3 overflow-hidden">
        <DialogHeader className="gap-0.5">
          <DialogTitle className="font-mono text-sm">
            {exercise.external_id || exercise.id}
          </DialogTitle>
          <DialogDescription>
            JSON crudo del ejercicio actual.
          </DialogDescription>
        </DialogHeader>
        <pre className="max-h-[60vh] overflow-auto rounded-md border border-white/10 bg-black/40 p-3 text-[11px] leading-relaxed text-foreground/85">
          {JSON.stringify(exercise, null, 2)}
        </pre>
        <Button
          size="sm"
          variant="outline"
          onClick={copy}
          className="self-end"
        >
          Copiar JSON
        </Button>
      </DialogContent>
    </Dialog>
  )
}

function ExitButton() {
  const router = useRouter()
  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          <Button variant="ghost" size="icon" aria-label="Salir de la sesión">
            <X />
          </Button>
        }
      />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="font-sans">
            ¿Salir de la sesión?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Vas a perder el progreso de los ejercicios todavía no respondidos.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction
            className="h-10 w-full sm:w-auto rounded-md bg-white text-black hover:bg-white/90 hover:text-black"
            onClick={() => router.push("/")}
          >
            Salir
          </AlertDialogAction>
          <AlertDialogCancel
            className="h-10 w-full sm:w-auto rounded-md bg-background dark:bg-background"
          >
            Seguir
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
