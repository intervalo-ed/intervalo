"use client"

// Versión de escritorio: todo en la misma vista, sin navegación. Dos columnas
// que arrancan desde la cabecera — a la izquierda la marca y el ejercicio, a la
// derecha la identidad y el ranking, que es el marcador del juego.
//
// La página NO scrollea: ocupa el alto de la ventana (con tope, para que en
// pantallas muy altas no se estire sin sentido) y deja más aire abajo que
// arriba. La lista del ranking scrollea adentro de su caja.
//
// El festejo de acertar termina en el ranking: el confeti se recolecta sobre la
// XP de la fila propia y recién cuando llega la última bolita se refresca el
// orden y la fila sube (ver xp-burst.tsx).

import { useCallback, useEffect, useRef, useState } from "react"
import posthog from "posthog-js"
import { AnimatePresence, motion } from "motion/react"
import { useQueryClient } from "@tanstack/react-query"
import { Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { GRID_BG_STYLE } from "@/components/grid-bg"
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
import { ExerciseCard, FeedbackBanner } from "./exercise-card"
import { GameIntroLogo, type GameIntro } from "./game-intro"
import { GameRanking } from "./game-ranking"
import { MathInput, type MathInputHandle } from "./math-input"
import { MathKeyboard } from "./math-keyboard"
import { parseAnswerToMathJson, warmupComputeEngine } from "./parse-answer"
import { ProfileSlides, RegisterSlide } from "./register-slides"
import { SettingsPanel } from "./settings-panel"
import { useAnswerExercise, useNextExercise, type GameAnswer, type GameExercise } from "./UseGameExercise"
import { gameKeys, useGamePlayer } from "./UseGamePlayer"
import { useXpBurst, XpBurstConfetti } from "./xp-burst"

type Panel = "exercise" | "profile" | "register"

export function DesktopLayout({ intro }: { intro: GameIntro }) {
  const { player, refetch: refetchPlayer } = useGamePlayer()
  const queryClient = useQueryClient()
  const next = useNextExercise()
  const answerMutation = useAnswerExercise()
  const sfx = useSfx()

  const [exercise, setExercise] = useState<GameExercise | null>(null)
  const [lastAnswer, setLastAnswer] = useState<GameAnswer | null>(null)
  const [solvedCount, setSolvedCount] = useState(0)
  const [climbFrom, setClimbFrom] = useState<number | null>(null)
  const [centerKey, setCenterKey] = useState(0)
  const [cafecito, setCafecito] = useState<CafecitoTrigger | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  // Los hitos (carrera/universidad, registro) ocurren EN el panel izquierdo,
  // reemplazando al ejercicio: todo pasa en la misma vista (pedido de producto).
  const [panel, setPanel] = useState<Panel>("exercise")
  const pendingMilestoneRef = useRef<Panel | null>(null)
  const askedProfileRef = useRef(false)
  const askedRegisterRef = useRef(false)
  const inputRef = useRef<MathInputHandle | null>(null)
  const servedAtRef = useRef<number>(0)
  const startedRef = useRef(false)
  // Puesto anterior, guardado hasta que termina de caer el confeti.
  const pendingClimbRef = useRef<number | null>(null)

  // Cuando llega la última bolita: recién ahí el ranking estrena orden y la
  // fila propia sube. Antes de eso sigue mostrando el puesto viejo.
  const onBurstComplete = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: gameKeys.leaderboard })
    setClimbFrom(pendingClimbRef.current)
    pendingClimbRef.current = null
  }, [queryClient])

  const {
    liveXp,
    counting,
    burst,
    fire: fireXp,
    onArrive: onXpArrive,
    attachOrigin,
    attachTarget,
    magnetTarget,
  } = useXpBurst({ onComplete: onBurstComplete })

  useEffect(() => {
    posthog.capture("game_start", { is_guest: player?.is_guest ?? true, platform: "desktop" })
    warmupComputeEngine()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadNext = useCallback(() => {
    next.mutate(undefined, {
      onSuccess: (data) => {
        setExercise(data)
        setLastAnswer(null)
        setClimbFrom(null)
        setCafecito(null)
        servedAtRef.current = Date.now()
        inputRef.current?.clear()
        inputRef.current?.focus()
        posthog.capture("game_exercise_served", { tier: data.tier, exercise_id: data.exercise_id })
      },
    })
  }, [next])

  // Arranque directo: en desktop no hay intro, la primera derivada ya espera.
  useEffect(() => {
    if (player !== null && !startedRef.current) {
      startedRef.current = true
      loadNext()
    }
  }, [player, loadNext])

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
          posthog.capture("game_answer", {
            correct: data.correct,
            parse_ok: data.parse_ok,
            attempt: data.attempt_number,
            tier: exercise.tier,
            response_ms: Date.now() - servedAtRef.current,
          })
          if (!data.parse_ok) return
          if (!data.correct) {
            sfx.wrong()
            return
          }
          sfx.correct()
          // El imán necesita ver su destino: primero el ranking devuelve la
          // fila propia al centro, y el confeti espera a que asiente.
          setCenterKey((n) => n + 1)
          const rankBefore = data.rank_before ?? null
          const rankAfter = data.rank_after ?? null
          pendingClimbRef.current =
            rankBefore !== null && rankAfter !== null && rankAfter < rankBefore
              ? rankBefore
              : null
          fireXp(data)

          const solved = solvedCount + 1
          setSolvedCount(solved)
          if (pendingClimbRef.current !== null) {
            posthog.capture("game_rank_change", {
              from: rankBefore,
              to: rankAfter,
              delta: (rankBefore ?? 0) - (rankAfter ?? 0),
            })
          }
          if (data.is_record) posthog.capture("game_record", { best_rank: data.best_rank })
          const delta =
            rankBefore !== null && rankAfter !== null ? rankBefore - rankAfter : 0
          const trigger: CafecitoTrigger | null = data.is_record
            ? "record"
            : delta >= 3
              ? "big_climb"
              : solved % CAFECITO_EVERY === 0
                ? "milestone"
                : null
          if (trigger && shouldShowCafecito(solved, trigger)) {
            markCafecitoShown(solved, trigger)
            setCafecito(trigger)
          }
          if (solved >= 5 && player !== null && !player.university && !askedProfileRef.current) {
            askedProfileRef.current = true
            pendingMilestoneRef.current = "profile"
          } else if (
            solved >= 12 &&
            player !== null &&
            player.is_guest &&
            !askedRegisterRef.current
          ) {
            askedRegisterRef.current = true
            pendingMilestoneRef.current = "register"
          }
        },
      },
    )
  }, [exercise, answerMutation, sfx, solvedCount, player, fireXp])

  const closed =
    lastAnswer?.parse_ok === true && (lastAnswer.correct || lastAnswer.attempts_left === 0)

  // Todo menos el logo entra recién cuando la presentación lo devuelve a su
  // lugar; el fundido acompaña al del fondo (ver game-intro.tsx).
  const chromeStyle: React.CSSProperties = {
    opacity: intro.chromeVisible ? 1 : 0,
    transition: "opacity 0.5s ease-in-out",
  }

  const columns = "grid-cols-[minmax(0,1fr)_400px]"

  return (
    <div className="h-dvh overflow-hidden" style={GRID_BG_STYLE}>
      {/* Más aire abajo que arriba, y tope de alto para que en una pantalla muy
          alta el bloque no se estire hasta perder la forma. */}
      <div className="mx-auto flex h-full max-h-[880px] w-full max-w-6xl flex-col gap-3 px-6 pb-12 pt-5">
        <XpBurstConfetti burst={burst} target={magnetTarget} onArrive={onXpArrive} />

        <header className={`grid shrink-0 gap-3 ${columns}`}>
          <div className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-2.5">
            {/* El logo de la presentación es este mismo: se despega de acá, se
                escribe en el centro y vuelve (ver game-intro.tsx). */}
            <GameIntroLogo intro={intro} fontSize="1.25rem" />
            <div className="flex items-center gap-2" style={chromeStyle}>
              <ShareButton placement="header_desktop" />
              <CafecitoButton placement="header_desktop" />
            </div>
          </div>
          <div
            className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-2.5 text-sm"
            style={chromeStyle}
          >
            <span className="truncate">
              {player ? (player.is_guest ? player.alias : `@${player.alias}`) : "…"}
            </span>
            <button
              type="button"
              aria-label="Configuración"
              onClick={() => {
                sfx.select()
                setSettingsOpen(true)
              }}
              className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <Settings size={17} />
            </button>
          </div>
        </header>

        <div className="relative min-h-0 flex-1" style={chromeStyle}>
          {/* `sync` y no `wait`: las dos capas están superpuestas en la misma
              caja, así que se cruzan sin pisarse. Con `wait`, si la animación de
              salida no corre (una pestaña en segundo plano congela los frames)
              la tuerca no abre nada — el mismo problema que tuvieron las slides
              del teléfono. */}
          <AnimatePresence mode="sync" initial={false}>
            {settingsOpen ? (
              <motion.div
                key="settings"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                // z-10: durante el cruce las dos capas conviven, y la de
                // configuración tiene que quedar arriba y recibir los clicks.
                className="absolute inset-0 z-10 flex min-h-0 flex-col rounded-lg border border-border bg-card p-5"
              >
                <SettingsPanel
                  player={player}
                  onClose={() => {
                    setSettingsOpen(false)
                    refetchPlayer()
                  }}
                  onNeedsRegister={() => {
                    setSettingsOpen(false)
                    setPanel("register")
                  }}
                />
              </motion.div>
            ) : (
              <motion.div
                key="game"
                initial={{ opacity: 0, scale: 0.99 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.99 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className={`absolute inset-0 grid min-h-0 gap-3 ${columns}`}
              >
                {/* `overflow-y-auto` es la válvula de escape para ventanas muy
                    bajas: en cualquier pantalla razonable nada scrollea. */}
                <div className="no-scrollbar flex min-h-0 flex-col gap-3 overflow-y-auto">
                  {panel === "profile" && (
                    <div className="flex min-h-0 flex-1 flex-col rounded-lg border border-border bg-card p-5">
                      <ProfileSlides
                        onDone={() => {
                          refetchPlayer()
                          queryClient.invalidateQueries({ queryKey: gameKeys.leaderboard })
                          setPanel("exercise")
                          loadNext()
                        }}
                        onSkip={() => {
                          setPanel("exercise")
                          loadNext()
                        }}
                      />
                    </div>
                  )}
                  {panel === "register" && player && (
                    <div className="flex min-h-0 flex-1 flex-col rounded-lg border border-border bg-card p-5">
                      <RegisterSlide
                        player={player}
                        onSkip={() => {
                          setPanel("exercise")
                          if (!exercise) loadNext()
                        }}
                      />
                    </div>
                  )}
                  {panel === "exercise" && exercise ? (
                    <>
                      <ExerciseCard
                        className="flex-1"
                        streak={player?.combo ?? 0}
                        attempted={player?.exercises_attempted ?? 0}
                        promptLatex={exercise.prompt_latex}
                        stars={exercise.difficulty_stars}
                      >
                        {/* El estallido del confeti nace acá. */}
                        <div ref={attachOrigin}>
                          <MathInput
                            handleRef={inputRef}
                            onEnter={() => {
                              if (!closed) void onRevisar()
                            }}
                          />
                        </div>
                      </ExerciseCard>
                      {lastAnswer && <FeedbackBanner answer={lastAnswer} />}
                      {/* El teclado no se desmonta al cerrar el ejercicio: con
                          la página a alto fijo, sacarlo haría saltar todo. */}
                      <MathKeyboard
                        input={inputRef}
                        keys={exercise.keys}
                        className={closed ? "pointer-events-none opacity-45" : undefined}
                      />
                      <Button
                        size="lg"
                        className="h-[var(--cta-h)] w-full shrink-0 rounded-md bg-white text-black hover:bg-white/90 hover:text-black"
                        disabled={answerMutation.isPending || (closed && next.isPending)}
                        onClick={() => {
                          if (!closed) {
                            void onRevisar()
                            return
                          }
                          const milestone = pendingMilestoneRef.current
                          if (milestone) {
                            pendingMilestoneRef.current = null
                            posthog.capture("game_register_slide_shown", {
                              slide: milestone === "profile" ? "career" : "register",
                            })
                            setPanel(milestone)
                            return
                          }
                          loadNext()
                        }}
                      >
                        {closed ? "Continuar" : "Revisar"}
                      </Button>
                    </>
                  ) : panel === "exercise" ? (
                    <div className="flex flex-1 items-center justify-center rounded-lg border border-border bg-card text-sm text-muted-foreground">
                      Preparando la primera derivada…
                    </div>
                  ) : null}
                </div>

                <aside className="flex min-h-0 flex-col gap-3">
                  {cafecito && <CafecitoCard trigger={cafecito} />}
                  <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-border bg-card p-3">
                    <GameRanking
                      climbFrom={climbFrom}
                      enabled={player !== null}
                      liveXp={liveXp}
                      counting={counting}
                      attachXpTarget={attachTarget}
                      centerKey={centerKey}
                      className="flex-1"
                    />
                  </div>
                </aside>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
