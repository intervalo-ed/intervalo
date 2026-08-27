"use client"

// Flujo mobile: slides infinitas de derecha a izquierda (mismos variants que el
// onboarding). El swipe se omite adrede en las slides de ejercicio: MathLive es
// dueño del puntero ahí (arrastrar selecciona dentro del campo).
//
// El marcador de XP no vive en el header: el único contador es el del ranking.
// Por eso toda respuesta correcta lleva a la slide del ranking, y el festejo
// —confeti, recolección sobre la fila propia y escalada— ocurre ahí.

import { useCallback, useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import posthog from "posthog-js"
import { useQueryClient } from "@tanstack/react-query"
import { Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSfx } from "@/lib/audio/useSfx"
import {
  CafecitoButton,
  CafecitoCard,
  ShareButton,
  markCafecitoShown,
  shouldShowCafecito,
  CAFECITO_EVERY,
  type CafecitoTrigger,
} from "./cafecito-cta"
import {
  AnswerButton,
  AnswerField,
  ExerciseCard,
  SkipButton,
  answerTone,
} from "./exercise-card"
import { GameIntroLogo, type GameIntro } from "./game-intro"
import { GameRanking } from "./game-ranking"
import { HINT_MOBILE, MathInput, type MathInputHandle } from "./math-input"
import { MathKeyboard } from "./math-keyboard"
import { parseAnswerToMathJson, warmupComputeEngine } from "./parse-answer"
import { ProfileSlides, RegisterSlide } from "./register-slides"
import { SettingsPanel } from "./settings-panel"
import {
  useAnswerExercise,
  useNextExercise,
  useSkipExercise,
  type GameAnswer,
  type GameExercise,
} from "./UseGameExercise"
import { useGamePulse } from "./UseGameLeaderboard"
import { gameKeys, useGamePlayer } from "./UseGamePlayer"
import { useXpBurst, XpBurstConfetti } from "./xp-burst"

const ctaCls =
  "h-[var(--cta-h)] w-full rounded-md bg-white text-black hover:bg-white/90 hover:text-black"

const slideVariants = {
  enter: { x: "100%", opacity: 1 },
  center: { x: "0%", opacity: 1 },
  exit: { x: "-100%", opacity: 1 },
}
const SLIDE_TRANSITION = { duration: 0.28, ease: "easeInOut" } as const

// El estallido espera a que la slide del ranking termine de entrar.
const BURST_AFTER_SLIDE_MS = 320

type Slide =
  | { kind: "intro" }
  | { kind: "exercise" }
  | { kind: "ranking"; answer: GameAnswer }
  | { kind: "profile" }
  | { kind: "register" }
  | { kind: "settings" }
  | { kind: "cafecito"; trigger: CafecitoTrigger }

// Hitos del embudo: primero enganchar; carrera/universidad cuando ya está
// metido; el registro (con el gancho del @ propio) al final.
const PROFILE_MILESTONE = 5
const REGISTER_MILESTONE = 12

// El "gancho" post-respuesta que queda pendiente de mostrar tras el Continuar.
type PendingAfter = { answer: GameAnswer } | null

export function MobileFlow({ intro }: { intro: GameIntro }) {
  const { player, refetch: refetchPlayer } = useGamePlayer()
  const queryClient = useQueryClient()
  const next = useNextExercise()
  const answerMutation = useAnswerExercise()
  const skipMutation = useSkipExercise()
  const sfx = useSfx()

  const [slide, setSlide] = useState<Slide>({ kind: "intro" })
  const [slideSeq, setSlideSeq] = useState(0)
  const [exercise, setExercise] = useState<GameExercise | null>(null)
  const [lastAnswer, setLastAnswer] = useState<GameAnswer | null>(null)
  // Contador de respuestas, no de aciertos: es lo que hace que el latido y el
  // sacudón vuelvan a correr cuando dos respuestas seguidas comparten tono.
  const [answerSeq, setAnswerSeq] = useState(0)
  const [solvedCount, setSolvedCount] = useState(0)
  const [climbFrom, setClimbFrom] = useState<number | null>(null)
  const inputRef = useRef<MathInputHandle | null>(null)
  const servedAtRef = useRef<number>(0)
  const pendingRef = useRef<PendingAfter>(null)
  const pendingClimbRef = useRef<number | null>(null)
  // Una sola vez por visita: skippear no re-pregunta hasta la próxima sesión.
  const askedProfileRef = useRef(false)
  const askedRegisterRef = useRef(false)

  // Cuando llega la última bolita: recién ahí el ranking estrena orden y sube.
  const onBurstComplete = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: gameKeys.leaderboard })
    setClimbFrom(pendingClimbRef.current)
    pendingClimbRef.current = null
  }, [queryClient])

  // Sin `attachOrigin`: en el teléfono el estallido nace en el centro de la
  // pantalla, porque la card del ejercicio ya no está cuando ocurre.
  const {
    liveXp,
    counting,
    burst,
    fire: fireXp,
    onArrive: onXpArrive,
    attachTarget,
    magnetTarget,
  } = useXpBurst({ onComplete: onBurstComplete })

  // Late cada 10 s y refresca el ranking solo si alguien respondió algo. Se
  // pausa mientras cae el confeti: ahí el orden viejo tiene que quedarse quieto.
  useGamePulse({ enabled: player !== null, paused: counting })

  useEffect(() => {
    posthog.capture("game_start", { is_guest: player?.is_guest ?? true, platform: "mobile" })
    warmupComputeEngine()
    // Solo al montar: el evento es de apertura, no de cambios de player.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const goTo = useCallback((s: Slide) => {
    setSlide(s)
    setSlideSeq((n) => n + 1)
  }, [])

  const loadNext = useCallback(() => {
    next.mutate(undefined, {
      onSuccess: (data) => {
        setExercise(data)
        setLastAnswer(null)
        setClimbFrom(null)
        servedAtRef.current = Date.now()
        inputRef.current?.clear()
        posthog.capture("game_exercise_served", {
          tier: data.tier,
          exercise_id: data.exercise_id,
        })
        goTo({ kind: "exercise" })
      },
    })
  }, [next, goTo])

  // Después de resolver (o del ranking/hito/cafecito), decide la próxima slide.
  const advanceAfterAnswer = useCallback(
    (consumed: "ranking" | "milestone" | "cafecito" | null) => {
      const pending = pendingRef.current
      if (!pending) {
        loadNext()
        return
      }
      const a = pending.answer

      // Toda correcta pasa por el ranking: ahí está el marcador y ahí cae el
      // confeti. Las erradas siguen de largo al próximo ejercicio.
      if (consumed === null && a.correct) {
        const rankBefore = a.rank_before ?? null
        const rankAfter = a.rank_after ?? null
        if (rankBefore !== null && rankAfter !== null && rankAfter < rankBefore) {
          pendingClimbRef.current = rankBefore
          posthog.capture("game_rank_change", {
            from: rankBefore,
            to: rankAfter,
            delta: rankBefore - rankAfter,
          })
        }
        goTo({ kind: "ranking", answer: a })
        return
      }
      if (consumed === null || consumed === "ranking") {
        if (
          solvedCount >= PROFILE_MILESTONE &&
          player !== null &&
          !player.university &&
          !askedProfileRef.current
        ) {
          askedProfileRef.current = true
          posthog.capture("game_register_slide_shown", { slide: "career" })
          goTo({ kind: "profile" })
          return
        }
        if (
          solvedCount >= REGISTER_MILESTONE &&
          player !== null &&
          player.is_guest &&
          !askedRegisterRef.current
        ) {
          askedRegisterRef.current = true
          posthog.capture("game_register_slide_shown", { slide: "register" })
          goTo({ kind: "register" })
          return
        }
      }
      if (consumed !== "cafecito") {
        const rankBefore = a.rank_before ?? null
        const rankAfter = a.rank_after ?? null
        const delta =
          rankBefore !== null && rankAfter !== null ? rankBefore - rankAfter : 0
        const trigger: CafecitoTrigger | null = a.is_record
          ? "record"
          : delta >= 3
            ? "big_climb"
            : solvedCount > 0 && solvedCount % CAFECITO_EVERY === 0
              ? "milestone"
              : null
        if (trigger && shouldShowCafecito(solvedCount, trigger)) {
          markCafecitoShown(solvedCount, trigger)
          goTo({ kind: "cafecito", trigger })
          return
        }
      }
      pendingRef.current = null
      loadNext()
    },
    [goTo, loadNext, solvedCount, player],
  )

  const onRevisar = useCallback(async () => {
    if (!exercise || answerMutation.isPending) return
    const latex = inputRef.current?.getLatex() ?? ""
    if (!latex.trim()) return
    const mathjson = await parseAnswerToMathJson(latex)
    answerMutation.mutate(
      {
        exercise_id: exercise.exercise_id,
        answer_latex: latex,
        answer_mathjson: mathjson,
        response_ms: Date.now() - servedAtRef.current,
      },
      {
        onSuccess: (data) => {
          setLastAnswer(data)
          setAnswerSeq((n) => n + 1)
          posthog.capture("game_answer", {
            correct: data.correct,
            parse_ok: data.parse_ok,
            attempt: data.attempt_number,
            tier: exercise.tier,
            response_ms: Date.now() - servedAtRef.current,
          })
          if (!data.parse_ok) return
          if (data.correct) {
            sfx.correct()
            setSolvedCount((n) => n + 1)
            pendingRef.current = { answer: data }
            if (data.is_record) posthog.capture("game_record", { best_rank: data.best_rank })
          } else {
            sfx.wrong()
            if (data.attempts_left === 0) pendingRef.current = { answer: data }
          }
        },
      },
    )
  }, [exercise, answerMutation, sfx])

  const closed = lastAnswer?.parse_ok === true && (lastAnswer.correct || lastAnswer.attempts_left === 0)
  const tone = answerTone(lastAnswer)

  // Saltear también en el teléfono: no hay Shift+Enter, pero el botón sí está.
  const onSkip = useCallback(() => {
    if (!exercise || closed || skipMutation.isPending || answerMutation.isPending) return
    posthog.capture("game_skip", { tier: exercise.tier, exercise_id: exercise.exercise_id })
    skipMutation.mutate(
      { exercise_id: exercise.exercise_id },
      {
        onSuccess: (data) => {
          // El endpoint ya devuelve el reemplazo: no hay slide intermedia ni un
          // /next detrás, el ejercicio nuevo entra en el mismo lugar.
          setExercise(data)
          setLastAnswer(null)
          servedAtRef.current = Date.now()
          inputRef.current?.clear()
          posthog.capture("game_exercise_served", {
            tier: data.tier,
            exercise_id: data.exercise_id,
            after_skip: true,
          })
        },
      },
    )
  }, [exercise, closed, skipMutation, answerMutation.isPending])

  // Todo menos el logo espera a que la presentación lo devuelva a su lugar.
  const chromeStyle: React.CSSProperties = {
    opacity: intro.chromeVisible ? 1 : 0,
    transition: "opacity 0.5s ease-in-out",
  }

  const startDisabled = player === null || next.isPending || !intro.done

  return (
    <div className="relative grid h-dvh overflow-hidden">
      {/* Fuera de las slides a propósito: son motion.div con transform, y un
          transform ancestro recorta el `fixed inset-0` del confeti. */}
      <XpBurstConfetti burst={burst} target={magnetTarget} onArrive={onXpArrive} />
      <AnimatePresence mode="sync" initial={false}>
        <motion.div
          key={slideSeq}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={SLIDE_TRANSITION}
          className="col-start-1 row-start-1 flex min-h-0 flex-col"
        >
          {slide.kind === "intro" && (
            <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 pb-[max(env(safe-area-inset-bottom),1rem)]">
              <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
                {/* El logo de la presentación es este mismo: se despega de
                    acá, se escribe en el centro y vuelve (ver game-intro.tsx). */}
                {/* 15% menos que antes (era 2.25rem), igual que el header de
                    escritorio y que la presentación (INTRO_FONT_PX). */}
                <GameIntroLogo intro={intro} fontSize="1.9125rem" />
                <div style={chromeStyle}>
                  <p className="mt-2 text-lg">¿Cuántas aguantás?</p>
                  <p className="mt-4 text-sm text-muted-foreground">
                    Empezá fácil · subí en el ranking · sin registro
                  </p>
                </div>
              </div>
              <div style={chromeStyle}>
                <Button
                  size="lg"
                  className={ctaCls}
                  disabled={startDisabled}
                  onClick={loadNext}
                >
                  Continuar
                </Button>
              </div>
            </div>
          )}

          {slide.kind === "exercise" && exercise && (
            <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-3 px-4 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-3">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  aria-label="Configuración"
                  onClick={() => {
                    sfx.select()
                    goTo({ kind: "settings" })
                  }}
                  className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <Settings size={17} />
                </button>
                <span className="flex items-center gap-1.5">
                  <ShareButton placement="header_mobile" />
                  <CafecitoButton placement="header_mobile" />
                </span>
              </div>
              <ExerciseCard
                streak={player?.combo ?? 0}
                attempted={player?.exercises_attempted ?? 0}
                promptLatex={exercise.prompt_latex}
              />
              <AnswerField tone={tone} seq={answerSeq}>
                <MathInput
                  handleRef={inputRef}
                  tone={tone}
                  hint={HINT_MOBILE}
                  onEnter={({ shift }) => {
                    if (shift) onSkip()
                    else if (closed) advanceAfterAnswer(null)
                    else void onRevisar()
                  }}
                  onChange={() => {
                    if (!closed && lastAnswer) setLastAnswer(null)
                  }}
                />
              </AnswerField>
              <div className="min-h-0 flex-1" />
              {/* Sigue montado con el ejercicio cerrado: sacarlo empujaría todo
                  lo de arriba justo cuando la persona va a tocar Continuar. */}
              <MathKeyboard
                input={inputRef}
                keys={exercise.keys}
                className={closed ? "pointer-events-none opacity-45" : undefined}
              />
              <div className="flex items-stretch gap-2">
                <AnswerButton
                  className="flex-1"
                  tone={tone}
                  seq={answerSeq}
                  closed={closed}
                  disabled={answerMutation.isPending || (closed && next.isPending)}
                  onClick={() => {
                    if (closed) advanceAfterAnswer(null)
                    else void onRevisar()
                  }}
                />
                {!closed && (
                  <SkipButton
                    disabled={skipMutation.isPending || answerMutation.isPending}
                    onClick={onSkip}
                  />
                )}
              </div>
            </div>
          )}

          {slide.kind === "ranking" && (
            <RankingSlide
              answer={slide.answer}
              climbFrom={climbFrom}
              liveXp={liveXp}
              counting={counting}
              myUniversity={player?.university ?? null}
              attachXpTarget={attachTarget}
              enabled={player !== null}
              onFire={fireXp}
              onContinue={() => advanceAfterAnswer("ranking")}
              continueDisabled={next.isPending}
            />
          )}

          {slide.kind === "settings" && (
            <div className="mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col px-4 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-4">
              <SettingsPanel
                player={player}
                onClose={() => {
                  refetchPlayer()
                  if (exercise) goTo({ kind: "exercise" })
                  else loadNext()
                }}
                onNeedsRegister={() => goTo({ kind: "register" })}
              />
            </div>
          )}

          {slide.kind === "profile" && (
            <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 pb-[max(env(safe-area-inset-bottom),0.75rem)]">
              <ProfileSlides
                onDone={() => {
                  refetchPlayer()
                  queryClient.invalidateQueries({ queryKey: gameKeys.leaderboard })
                  advanceAfterAnswer("milestone")
                }}
                onSkip={() => advanceAfterAnswer("milestone")}
              />
            </div>
          )}

          {slide.kind === "register" && player && (
            <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 pb-[max(env(safe-area-inset-bottom),0.75rem)]">
              <RegisterSlide
                player={player}
                onSkip={() => {
                  if (pendingRef.current) advanceAfterAnswer("milestone")
                  else if (exercise) goTo({ kind: "exercise" })
                  else loadNext()
                }}
              />
            </div>
          )}

          {slide.kind === "cafecito" && (
            <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-4 px-5 pb-[max(env(safe-area-inset-bottom),1rem)]">
              <CafecitoCard trigger={slide.trigger} />
              <Button
                size="lg"
                variant="ghost"
                className="text-muted-foreground"
                disabled={next.isPending}
                onClick={() => advanceAfterAnswer("cafecito")}
              >
                Continuar
              </Button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

// La slide del festejo. El estallido se dispara al montar y una sola vez: si se
// disparara desde el handler de la respuesta, el confeti nacería en la slide
// del ejercicio y la fila propia todavía no estaría en pantalla.
function RankingSlide({
  answer,
  climbFrom,
  liveXp,
  counting,
  myUniversity,
  attachXpTarget,
  enabled,
  onFire,
  onContinue,
  continueDisabled,
}: {
  answer: GameAnswer
  climbFrom: number | null
  liveXp: number | null
  counting: boolean
  myUniversity: string | null
  attachXpTarget: (node: HTMLElement | null) => void
  enabled: boolean
  onFire: (answer: GameAnswer) => void
  onContinue: () => void
  continueDisabled: boolean
}) {
  const fireRef = useRef(onFire)
  useEffect(() => {
    fireRef.current = onFire
  })
  useEffect(() => {
    const t = setTimeout(() => fireRef.current(answer), BURST_AFTER_SLIDE_MS)
    return () => clearTimeout(t)
  }, [answer])

  const climbed =
    answer.rank_before != null &&
    answer.rank_after != null &&
    answer.rank_after < answer.rank_before
  const delta = climbed ? (answer.rank_before as number) - (answer.rank_after as number) : 0

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col gap-3 px-4 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-4">
      <p className="shrink-0 text-center font-medium">
        {climbed
          ? `Subiste ${delta === 1 ? "un puesto" : `${delta} puestos`}`
          : `+${answer.xp_awarded} de experiencia`}
      </p>
      <GameRanking
        climbFrom={climbFrom}
        enabled={enabled}
        liveXp={liveXp}
        counting={counting}
        myUniversity={myUniversity}
        attachXpTarget={attachXpTarget}
        className="min-h-0 flex-1"
      />
      <Button
        size="lg"
        className={ctaCls}
        disabled={continueDisabled}
        onClick={onContinue}
      >
        Continuar
      </Button>
    </div>
  )
}
