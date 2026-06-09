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
import { Button } from "@/components/ui/button"
import { Screen, ScreenBody, ScreenHeader } from "@/components/ui/screen"
import { Spinner } from "@/components/ui/spinner"
import { useSfx } from "@/lib/audio/useSfx"
import { cn } from "@/lib/utils"
import { ChevronLeft, X } from "lucide-react"
import { animate, AnimatePresence, motion } from "motion/react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useRef, useState } from "react"
import { useAnswer } from "./UseAnswer"
import { useSessionPayload } from "./UseSessionPayload"

const ctaCls =
  "h-12 flex-1 rounded-md bg-white text-black hover:bg-white/90 hover:text-black"

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
  // Gate del footer de feedback: al navegar se apaga y se vuelve a prender
  // recién cuando termina la animación del slide (para que salga después).
  const [footerReady, setFooterReady] = useState(true)
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
        <div className="shrink-0 p-5">
          <div className="mx-auto w-full max-w-2xl">
            <Button
              size="lg"
              className="h-12 w-full rounded-md bg-white text-black hover:bg-white/90 hover:text-black"
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
  if (!exercise) return null

  const cur = states[idx] ?? DEFAULT_EX
  const isLast = idx === total - 1
  const pct = Math.round(((idx + 1) / total) * 100)
  const solved = cur.result === "correct"
  // Resuelto recién después de haber fallado al menos una vez → acento lima.
  const solvedAfterError = solved && cur.wrongOptions.length > 0
  const continueLabel = isLast ? "Finalizar" : "Continuar"
  const canGoBack = idx > 0 || cur.showWhy

  function patch(p: Partial<ExState>) {
    setStates((s) => ({ ...s, [idx]: { ...(s[idx] ?? DEFAULT_EX), ...p } }))
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
      sfx.end()
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
    }, 2000)
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
        <div className="h-3 flex-1 overflow-hidden rounded-full bg-border">
          <motion.div
            className="h-full rounded-full bg-primary"
            initial={{ width: "0%" }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.45, ease: [0.32, 0.72, 0, 1] }}
          />
        </div>
        <ExitButton />
      </ScreenHeader>

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
                </div>
              ) : (
                <>
                  <p className="text-lg leading-snug">
                    <MathText text={exercise.question} />
                  </p>

                  {exercise.graph_fn && (
                    <MathGraph
                      graphFn={exercise.graph_fn}
                      graphView={exercise.graph_view}
                    />
                  )}

                  <div className="flex flex-col gap-2">
                    {exercise.options.map((opt, i) => {
                      const isSelected = cur.selection === i
                      const isCorrectOpt = i === exercise.correct_index
                      const isWrong = cur.wrongOptions.includes(i)
                      const isShaking = shakeIdx === i

                      let borderCls = "border-white/10"
                      let textCls = "text-foreground/80"
                      let extraCls = ""
                      if (isShaking) {
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
                        textCls = "text-[#c4c6ff] font-medium"
                      }

                      return (
                        <button
                          key={i}
                          disabled={solved || isWrong}
                          onClick={() => handlePick(i)}
                          className={cn(
                            "w-full rounded-md border bg-white/5 px-4 py-3.5 text-left text-sm transition-[color,border-color,opacity] duration-200 disabled:pointer-events-none",
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
                </>
              )}
              </div>
              {/* Spacer inferior: flexiona para centrar cuando es corto, y
                  garantiza ~160px para scrollear bajo el último ítem (y que el
                  overlay del footer no lo tape) cuando el ejercicio es largo. */}
              <div className="min-h-[160px] flex-[3]" />
            </motion.div>
          </AnimatePresence>
        </div>
      </ScreenBody>

      {/* Capa 1 — fondo sólido del contenedor de botones (atrás de todo). */}
      <div className="fixed inset-x-0 bottom-0 z-20 h-[104px] border-t bg-background" />

      {/* Capa 2 — feedback: sale desde abajo, por delante del fondo del
          contenedor pero por detrás de los botones (asoma por encima de ellos). */}
      <AnimatePresence initial={false}>
        {footerReady &&
          !cur.showWhy &&
          cur.result === "correct" &&
          (cur.xp !== null || answer.isError) && (
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
                "border-t bg-green-500/10 px-5 pt-6 pb-[108px]",
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
            <div className="border-t border-orange-500/50 bg-orange-500/10 px-5 pt-6 pb-[108px]">
              <div className="mx-auto w-full max-w-2xl text-[15px]">
                <span className="font-semibold text-orange-400">¿Seguro?</span>
                <div className="mt-3 text-foreground/85">
                  Revisá tu respuesta e intentalo una vez más.
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Capa 3 — botones (adelante). Contenedor amplio y equilibrado; sin fondo
          propio (lo aporta la capa 1) para que el feedback asome entre medio. */}
      <div className="fixed inset-x-0 bottom-0 z-40 px-5 py-7">
        <div className="mx-auto w-full max-w-2xl">
          <div className="flex gap-2">
            {cur.showWhy ? (
              <Button size="lg" className={ctaCls} onClick={onContinue}>
                {continueLabel}
              </Button>
            ) : solved ? (
              <>
                {exercise.explanation && (
                  <Button
                    variant="outline"
                    size="lg"
                    className="h-12 flex-1 rounded-md bg-background dark:bg-background"
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
              <Button
                size="lg"
                className={ctaCls}
                disabled={cur.selection === null || cur.result === "wrong"}
                onClick={onRevisar}
              >
                Revisar
              </Button>
            )}
          </div>
        </div>
      </div>
    </Screen>
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
            className="h-10 w-full rounded-md bg-white text-black hover:bg-white/90 hover:text-black"
            onClick={() => router.push("/")}
          >
            Salir
          </AlertDialogAction>
          <AlertDialogCancel
            className="h-10 w-full rounded-md bg-background dark:bg-background"
          >
            Seguir
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
