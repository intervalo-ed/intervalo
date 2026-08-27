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
import { GRID_BG_STYLE } from "@/components/grid-bg"
import { useSfx } from "@/lib/audio/useSfx"
import {
  CafecitoButton,
  CafecitoCard,
  ShareButton,
  TableButton,
  markCafecitoShown,
  shouldShowCafecito,
  CAFECITO_EVERY,
  type CafecitoTrigger,
} from "./cafecito-cta"
import {
  AnswerButton,
  AnswerField,
  ExerciseCard,
  PANEL_CONTENT,
  SkipButton,
  answerTone,
} from "./exercise-card"
import { DerivativesTable, FlipCard } from "./derivatives-table"
import { GameIntroLogo, type GameIntro } from "./game-intro"
import { GameRanking } from "./game-ranking"
import { MathInput, tipFor, type MathInputHandle } from "./math-input"
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

type Panel = "exercise" | "profile" | "register"

// Cuánto tiene que estar Ctrl abajo para que cuente como consulta. Ver el
// listener de Ctrl más abajo.
const PEEK_GRACE_MS = 350

export function DesktopLayout({ intro }: { intro: GameIntro }) {
  const { player, refetch: refetchPlayer } = useGamePlayer()
  const queryClient = useQueryClient()
  const next = useNextExercise()
  const answerMutation = useAnswerExercise()
  const skipMutation = useSkipExercise()
  const sfx = useSfx()

  const [exercise, setExercise] = useState<GameExercise | null>(null)
  const [lastAnswer, setLastAnswer] = useState<GameAnswer | null>(null)
  // Contador de respuestas, no de aciertos: es lo que hace que el latido y el
  // sacudón vuelvan a correr cuando dos respuestas seguidas comparten tono.
  const [answerSeq, setAnswerSeq] = useState(0)
  const [solvedCount, setSolvedCount] = useState(0)
  const [climbFrom, setClimbFrom] = useState<number | null>(null)
  const [centerKey, setCenterKey] = useState(0)
  const [cafecito, setCafecito] = useState<CafecitoTrigger | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  // La tabla está a la vista ahora mismo.
  const [tableOpen, setTableOpen] = useState(false)
  // La tabla se consultó en ESTE ejercicio. Va en un ref y no en estado porque
  // solo se lee al responder: que cambie no tiene por qué redibujar nada.
  const peekedRef = useRef(false)
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

  // Late cada 10 s y refresca el ranking solo si alguien respondió algo. Se
  // pausa mientras cae el confeti: ahí el orden viejo tiene que quedarse quieto.
  useGamePulse({ enabled: player !== null, paused: counting })

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
        // Ejercicio nuevo, cuenta limpia: la consulta anterior no lo penaliza.
        peekedRef.current = false
        setTableOpen(false)
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
        peeked: peekedRef.current,
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
  const tone = answerTone(lastAnswer)

  // Lo que hace el botón grande. Vive suelto porque lo comparten el click y el
  // Enter, y tienen que hacer exactamente lo mismo.
  const onPrimary = useCallback(() => {
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
  }, [closed, onRevisar, loadNext])

  const onSkip = useCallback(() => {
    if (!exercise || closed || skipMutation.isPending || answerMutation.isPending) return
    posthog.capture("game_skip", { tier: exercise.tier, exercise_id: exercise.exercise_id })
    skipMutation.mutate(
      { exercise_id: exercise.exercise_id },
      {
        onSuccess: (data) => {
          // El endpoint devuelve el reemplazo, así que no hay un /next detrás:
          // el ejercicio nuevo entra en el mismo viaje.
          setExercise(data)
          setLastAnswer(null)
          setCafecito(null)
          peekedRef.current = false
          setTableOpen(false)
          servedAtRef.current = Date.now()
          inputRef.current?.clear()
          inputRef.current?.focus()
          posthog.capture("game_exercise_served", {
            tier: data.tier,
            exercise_id: data.exercise_id,
            after_skip: true,
          })
        },
      },
    )
  }, [exercise, closed, skipMutation, answerMutation.isPending])

  // Abrir la tabla marca el ejercicio: la respuesta que venga después no mueve
  // el Elo y paga XP simbólica (el server lo aplica, ver game/router.py).
  const openTable = useCallback(() => {
    if (peekedRef.current) return
    peekedRef.current = true
    posthog.capture("game_peek", {
      exercise_id: exercise?.exercise_id ?? null,
      tier: exercise?.tier ?? null,
    })
  }, [exercise])

  const toggleTable = useCallback(() => {
    sfx.select()
    setTableOpen((open) => {
      if (!open) openTable()
      return !open
    })
  }, [sfx, openTable])

  // Ctrl sostenido: la tabla mientras la tecla está abajo. El castigo NO se
  // aplica al instante sino después de PEEK_GRACE_MS: si no, un Ctrl+C o un
  // Ctrl+R —que en el camino abren y cierran la tabla en un parpadeo— costarían
  // el ejercicio, y perder el Elo por copiar algo sería incomprensible.
  const gameFocused = panel === "exercise" && !settingsOpen && exercise !== null
  useEffect(() => {
    if (!gameFocused) return
    let grace: ReturnType<typeof setTimeout> | null = null
    const down = (e: KeyboardEvent) => {
      if (e.key !== "Control" || e.repeat) return
      setTableOpen(true)
      grace = setTimeout(openTable, PEEK_GRACE_MS)
    }
    const up = (e: KeyboardEvent) => {
      if (e.key !== "Control") return
      if (grace) clearTimeout(grace)
      grace = null
      setTableOpen(false)
    }
    // `blur`: si la ventana pierde el foco con Ctrl apretado (un Alt+Tab), el
    // keyup nunca llega y la tabla quedaría abierta para siempre.
    const blur = () => {
      if (grace) clearTimeout(grace)
      grace = null
      setTableOpen(false)
    }
    window.addEventListener("keydown", down)
    window.addEventListener("keyup", up)
    window.addEventListener("blur", blur)
    return () => {
      if (grace) clearTimeout(grace)
      window.removeEventListener("keydown", down)
      window.removeEventListener("keyup", up)
      window.removeEventListener("blur", blur)
    }
  }, [gameFocused, openTable])

  const onEnterKey = useCallback(
    ({ shift }: { shift: boolean }) => {
      if (shift) {
        onSkip()
        return
      }
      onPrimary()
    },
    [onSkip, onPrimary],
  )

  // El juego se maneja entero desde el teclado. Este listener es el que cubre
  // el caso en que el foco NO está en el campo (después de responder, o tras
  // tocar una tecla del teclado en pantalla); cuando sí lo está, MathLive corta
  // la propagación y dispara el mismo handler desde su propio keydown.
  useEffect(() => {
    if (!gameFocused) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Enter" || e.metaKey || e.ctrlKey || e.altKey) return
      // Los campos de texto (el @ del registro, los selectores) son dueños de
      // su propio Enter.
      const el = e.target as HTMLElement | null
      const tag = el?.tagName
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el?.isContentEditable) return
      e.preventDefault()
      onEnterKey({ shift: e.shiftKey })
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [gameFocused, onEnterKey])

  // Todo menos el logo entra recién cuando la presentación lo devuelve a su
  // lugar; el fundido acompaña al del fondo (ver game-intro.tsx).
  const chromeStyle: React.CSSProperties = {
    opacity: intro.chromeVisible ? 1 : 0,
    transition: "opacity 0.5s ease-in-out",
  }

  // Ancho fijo para la derecha; la izquierda se queda con lo que sobra. Una fila
  // del ranking tiene mucho que meter en el renglón —puesto, alias, emoji,
  // flecha, sigla y XP— así que cada píxel acá se nota; el ejercicio, en cambio,
  // ya centra su contenido en un canal de 28rem y lo que le saquemos sale del
  // margen, no de la fórmula. La cabecera del alias comparte esta misma grilla,
  // así que crece con el ranking.
  const columns = "grid-cols-[minmax(0,1fr)_400px]"

  return (
    <div className="h-dvh overflow-hidden" style={GRID_BG_STYLE}>
      {/* La caja mide un 10% menos que antes en las dos dimensiones: el juego
          ocupa menos pantalla y queda más fondo libre a los costados y, sobre
          todo, abajo. El alto va atado al 90% de la ventana y no solo a un tope
          en píxeles, porque en las pantallas más comunes el que mandaba era el
          viewport y el tope no llegaba a aplicarse. El bloque se ancla arriba,
          así que todo lo que sobra se va al pie. */}
      {/* El ancho del bloque es lo que decide el de la columna izquierda: la
          derecha está clavada en 400 px, así que todo lo que se saque de acá
          sale del ejercicio. Bajó de 64.8rem para que esa columna deje de
          ocupar más de lo que su contenido necesita — adentro el enunciado y
          las teclas ya viven en un canal de 28rem. */}
      <div className="mx-auto flex h-full max-h-[min(90%,792px)] w-full max-w-[61.8rem] flex-col gap-3 px-6 pb-12 pt-5">
        <XpBurstConfetti burst={burst} target={magnetTarget} onArrive={onXpArrive} />

        <header className={`grid shrink-0 gap-3 ${columns}`}>
          <div className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-2.5">
            {/* El logo de la presentación es este mismo: se despega de acá, se
                escribe en el centro y vuelve (ver game-intro.tsx). */}
            {/* 15% menos que antes (era 1.25rem); el tamaño de la presentación
                bajó lo mismo, ver INTRO_FONT_PX en game-intro.tsx. */}
            <GameIntroLogo intro={intro} fontSize="1.0625rem" />
            <div className="flex items-center gap-2" style={chromeStyle}>
              <TableButton open={tableOpen} onToggle={toggleTable} />
              <ShareButton placement="header_desktop" />
              <CafecitoButton placement="header_desktop" />
            </div>
          </div>
          <div
            className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-2.5 text-sm"
            style={chromeStyle}
          >
            <span className="min-w-0 truncate">
              {player ? (player.is_guest ? player.alias : `@${player.alias}`) : "…"}
            </span>
            <button
              type="button"
              aria-label="Configuración"
              onClick={() => {
                sfx.select()
                setSettingsOpen(true)
              }}
              className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
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
                      {/* El volteo se lleva la card Y el teclado, no solo la
                          card: la tabla tiene catorce renglones y en el alto de
                          la card sola entraban siete. Con los dos, el dorso
                          hereda card + teclado y entra completa. El botón de
                          abajo queda afuera a propósito — es lo único que sigue
                          sirviendo con la tabla a la vista. */}
                      <FlipCard
                        className="min-h-0 flex-1"
                        flipped={tableOpen}
                        back={
                          <div className="flex min-h-0 flex-1 flex-col rounded-lg border border-border bg-card p-4">
                            <DerivativesTable />
                          </div>
                        }
                        front={
                          // Enunciado y teclado en UNA card, separados por una
                          // línea: son un solo objeto —la derivada y con qué
                          // escribirla— y dos cajas con su propio borde los
                          // hacían leer como dos cosas que hay que mirar por
                          // separado.
                          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-border bg-card">
                            <ExerciseCard
                              bare
                              className="flex-1"
                              streak={player?.combo ?? 0}
                              attempted={player?.exercises_attempted ?? 0}
                              promptLatex={exercise.prompt_latex}
                            >
                              <div className={`flex flex-col gap-2 ${PANEL_CONTENT}`}>
                                <AnswerField tone={tone} seq={answerSeq}>
                                  <MathInput
                                    handleRef={inputRef}
                                    tone={tone}
                                    hint={tipFor({
                                      seed: exercise.exercise_id,
                                      attempted: player?.exercises_attempted ?? 0,
                                      keys: exercise.keys,
                                    })}
                                    onEnter={onEnterKey}
                                    // En cuanto empieza a corregir, el rebote
                                    // se va: el naranja es sobre la respuesta
                                    // que mandó, no sobre la que escribe.
                                    onChange={() => {
                                      if (!closed && lastAnswer) setLastAnswer(null)
                                    }}
                                  />
                                </AnswerField>
                              </div>
                            </ExerciseCard>
                            {/* No se desmonta al cerrar el ejercicio: con la
                                página a alto fijo, sacarlo haría saltar todo. */}
                            <MathKeyboard
                              bare
                              input={inputRef}
                              keys={exercise.keys}
                              numpad={false}
                              className={closed ? "pointer-events-none opacity-45" : undefined}
                            />
                          </div>
                        }
                      />
                      {/* El confeti brota de esta fila y no del botón: al
                          acertar, "Saltear" desaparece y el botón se ensancha
                          hasta ocuparla entera. El origen se mide en el mismo
                          tick de la respuesta, o sea ANTES de ese
                          reacomodamiento, así que medir el botón daría un
                          centro corrido medio "Saltear" a la izquierda. El
                          centro de la fila no se mueve, y es exactamente donde
                          va a quedar el botón. */}
                      <div ref={attachOrigin} className="flex shrink-0 items-stretch gap-2">
                        <AnswerButton
                          className="flex-1"
                          tone={tone}
                          seq={answerSeq}
                          closed={closed}
                          showKeyHint
                          disabled={answerMutation.isPending || (closed && next.isPending)}
                          onClick={onPrimary}
                        />
                        {!closed && (
                          <SkipButton
                            showKeyHint
                            disabled={skipMutation.isPending || answerMutation.isPending}
                            onClick={onSkip}
                          />
                        )}
                      </div>
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
                      myUniversity={player?.university ?? null}
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
