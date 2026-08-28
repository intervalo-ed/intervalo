"use client"

// Flujo mobile: slides infinitas de derecha a izquierda (mismos variants que el
// onboarding). El swipe se omite adrede en las slides de ejercicio: MathLive es
// dueño del puntero ahí (arrastrar selecciona dentro del campo).
//
// El marcador de XP no vive en el header: el único contador es el del ranking.
// Por eso toda respuesta correcta lleva a la slide del ranking.
//
// El festejo, en cambio, está partido en dos y a propósito. Al acertar, la
// fórmula se rompe como un break de pool sobre su propia caja y las bolas quedan
// desparramadas ahí. El toque en Continuar no las manda a ningún lado: solo abre
// la puerta. De ahí en más cada una se va sola, de a una, cuando termina de
// rodar, y cruza a la pantalla del ranking a sumarse al contador.
//
// Las bolas son INDEPENDIENTES del movimiento de la persona: no viajan con el
// pase de slide ni lo acompañan. Se quedan en la mesa —en el lugar de la pantalla
// donde estaba— y el pase ocurre por detrás. La XP se gana donde se acertó y se
// atribuye donde se acumula, y ese viaje es lo que se ve.

import { useCallback, useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import posthog from "posthog-js"
import { useQueryClient } from "@tanstack/react-query"
import { Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useSfx } from "@/lib/audio/useSfx"
import {
  CafecitoButton,
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
  PANEL_CONTENT,
  SkipButton,
  answerTone,
  type AnswerTone,
} from "./exercise-card"
import { CafecitoPanel } from "./cafecito-panel"
import { GameIntroLogo, type GameIntro } from "./game-intro"
import { INTRO_CLOSE, IntroParagraphs } from "./intro-panel"
import { SlideFlip } from "./slide-flip"
import { GameRanking } from "./game-ranking"
import { HINT_MOBILE, MathInput, type MathInputHandle } from "./math-input"
import { MathKeyboard } from "./math-keyboard"
import { parseAnswerToMathJson, warmupComputeEngine } from "./parse-answer"
import { useLocalVerdict } from "./UseLocalVerdict"
import { ProfileSlides, RegisterSlide } from "./register-slides"
import { SettingsPanel } from "./settings-panel"
import {
  useAnswerExercise,
  useNextExercise,
  useSkipExercise,
  type GameAnswer,
  type GameExercise,
} from "./UseGameExercise"
import { useGameIdentity } from "./game-telemetry"
import { useGamePulse, useMyBoost } from "./UseGameLeaderboard"
import { gameKeys, useGamePlayer } from "./UseGamePlayer"
import { useXpBurst, XpOrbs } from "./xp-burst"

const ctaCls =
  "h-[var(--cta-h)] w-full rounded-md bg-white text-black hover:bg-white/90 hover:text-black"

const slideVariants = {
  enter: { x: "100%", opacity: 1 },
  center: { x: "0%", opacity: 1 },
  exit: { x: "-100%", opacity: 1 },
}
const SLIDE_TRANSITION = { duration: 0.28, ease: "easeInOut" } as const


type Slide =
  | { kind: "intro" }
  | { kind: "exercise" }
  | { kind: "ranking"; answer: GameAnswer }
  | { kind: "profile" }
  | { kind: "register" }
  // `back` es a dónde vuelve al cerrar. Se guarda porque a configuración se
  // entra desde el ejercicio Y desde el ranking, y volver siempre al ejercicio
  // se comería el festejo que estaba en pantalla.
  | { kind: "settings"; back: Slide }
  | { kind: "cafecito"; trigger: CafecitoTrigger; correctToday: number }

// Hitos del embudo: primero enganchar; carrera/universidad cuando ya está
// metido; el registro (con el gancho del @ propio) al final.
const PROFILE_MILESTONE = 5
const REGISTER_MILESTONE = 12

// El "gancho" post-respuesta que queda pendiente de mostrar tras el Continuar.
type PendingAfter = { answer: GameAnswer } | null

// La barra de arriba: configuración a la izquierda, compartir y cafecito a la
// derecha. Va en las pantallas donde se está JUGANDO —el ejercicio y el
// ranking—, que son las dos entre las que se rebota todo el tiempo: si estuviera
// solo en una, la mitad del juego se pasa sin poder tocar ninguna de las tres.
// En las pantallas de trámite (registro, carrera, cafecito) no está a propósito:
// ahí lo que hay que hacer es eso y nada más.
function GameHeader({ onSettings }: { onSettings: () => void }) {
  return (
    <div className="flex shrink-0 items-center justify-between">
      <button
        type="button"
        aria-label="Configuración"
        onClick={onSettings}
        className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <Settings size={17} />
      </button>
      <span className="flex items-center gap-1.5">
        <ShareButton placement="header_mobile" />
        <CafecitoButton placement="header_mobile" />
      </span>
    </div>
  )
}

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
  // El color adelantado por el veredicto local, mientras la respuesta del
  // servidor viaja. Se descarta apenas llega la de verdad (ver `tone`).
  const [tonoLocal, setTonoLocal] = useState<AnswerTone>(null)
  // Si el color y el sonido de ESTA respuesta ya salieron por el veredicto
  // local, para que la llegada del servidor no los repita.
  const anticipadoRef = useRef(false)
  // Contador de respuestas, no de aciertos: es lo que hace que el latido y el
  // sacudón vuelvan a correr cuando dos respuestas seguidas comparten tono.
  const [answerSeq, setAnswerSeq] = useState(0)
  const [solvedCount, setSolvedCount] = useState(0)
  const [climbFrom, setClimbFrom] = useState<number | null>(null)
  const inputRef = useRef<MathInputHandle | null>(null)
  // Ref de CALLBACK que IGNORA el null, y no el objeto pelado. Con el volteo
  // entre ejercicios la card vieja y la nueva conviven un rato, y la vieja
  // publica `null` al desmontarse DESPUÉS de que la nueva ya publicó su campo:
  // sin esto, el teclado de abajo quedaría escribiendo en la nada. El handle
  // viejo que queda colgado es inofensivo — sus métodos apuntan a un campo que
  // ya no existe y no hacen nada.
  const attachInput = useCallback((handle: MathInputHandle | null) => {
    if (handle) inputRef.current = handle
  }, [])
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

  const {
    liveXp,
    counting,
    burst,
    holding,
    release: releaseXp,
    fire: fireXp,
    onArrive: onXpArrive,
    onOrbsCleared,
    orbArea,
    attachPrompt,
    attachTarget,
    magnetTarget,
  } = useXpBurst({ onComplete: onBurstComplete })

  // Late cada 10 s y refresca el ranking solo si alguien respondió algo. Se
  // pausa mientras cae el confeti: ahí el orden viejo tiene que quedarse quieto.
  useGamePulse({ enabled: player !== null, paused: counting })

  // El empuje de la universidad sale del mismo pulso, sin pedido propio.
  const boost = useMyBoost(player?.university)

  // Mismo motivo que en escritorio: la identidad viaja como super propiedad y
  // ningún `capture` tiene que acordarse de pasarla.
  useGameIdentity(player)

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
        setTonoLocal(null)
        setClimbFrom(null)
        servedAtRef.current = Date.now()
        inputRef.current?.clear()
        posthog.capture("game_exercise_served", {
          tier: data.tier,
          exercise_id: data.exercise_id,
          stars: data.difficulty_stars,
          keys: data.keys.length,
          new_keys: data.new_keys.length,
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
        // El imán se suelta ACÁ, en el toque, y no cuando la slide del ranking
        // termina de entrar: así los orbes ya están viajando mientras el pase
        // ocurre, y para cuando la pantalla se asienta el conteo está en marcha.
        // Esperar al final del pase dejaba medio segundo de nada entre el dedo y
        // el festejo.
        //
        // Que el destino todavía no exista en este frame no importa: el imán lo
        // reintenta hasta que aparece, y le descuenta el transform del pase para
        // apuntarle a donde va a QUEDAR (ver centerOf en xp-burst.tsx).
        releaseXp()
        goTo({ kind: "ranking", answer: a })
        return
      }
      // El disparador del cafecito se calcula ACÁ ARRIBA, antes que los hitos de
      // perfil y registro, porque uno de ellos depende de él.
      //
      // Con las correctas ACUMULADAS del jugador (las manda el servidor) y no
      // con las de esta pestaña: `solvedCount` vuelve a cero en cada recarga, así
      // que el hito de veinte pedía veinte aciertos sin refrescar, y el cooldown
      // —que sí se guarda— se comparaba contra ese contador de sesión y quedaba
      // envenenado después de la primera aparición.
      const rankBefore = a.rank_before ?? null
      const rankAfter = a.rank_after ?? null
      const delta =
        rankBefore !== null && rankAfter !== null ? rankBefore - rankAfter : 0
      const totalCorrectas = a.exercises_correct
      const trigger: CafecitoTrigger | null = a.is_record
        ? "record"
        : delta >= 3
          ? "big_climb"
          : totalCorrectas > 0 && totalCorrectas % CAFECITO_EVERY === 0
            ? "milestone"
            : null
      const tocaCafecito =
        consumed !== "cafecito" &&
        trigger !== null &&
        shouldShowCafecito(totalCorrectas, trigger)
      const sinUniversidad = player !== null && !player.university
      // La universidad se pregunta UNA VEZ y no es una condición permanente. Que lo
      // fuera es lo que rompió esto: como el paso se pregunta una sola vez por
      // visita, quien lo salteaba quedaba sin universidad Y sin la pregunta, y el
      // cafecito no volvía a salir nunca.
      //
      // Ahora el adelanto vale solo mientras la pregunta esté pendiente. Preguntada
      // —contestada o salteada— el cafecito sale igual, y si todavía no hay
      // universidad la diapo se encarga sola: tiene su propia versión para ese caso.
      const faltaPreguntarUniversidad = sinUniversidad && !askedProfileRef.current

      if (consumed === null || consumed === "ranking") {
        // La universidad va ANTES que el cafecito, siempre. La diapo del café
        // ofrece multiplicar el XP "de toda tu universidad": sin universidad no
        // tiene qué ofrecer, y lo que quedaba era una pantalla que pedía algo y
        // de paso pedía otra cosa primero.
        //
        // Por eso este hito no espera solamente a las cinco resueltas: si el
        // cafecito quiere salir antes, se adelanta y ocupa su turno.
        if (
          faltaPreguntarUniversidad &&
          (tocaCafecito || solvedCount >= PROFILE_MILESTONE)
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
      // Sin universidad no se marca el cooldown: el cafecito no se mostró, así
      // que no gastó su turno y vuelve en el próximo hito, ya con una
      // universidad que nombrar.
      if (trigger !== null && tocaCafecito && !faltaPreguntarUniversidad) {
        markCafecitoShown(totalCorrectas)
        goTo({ kind: "cafecito", trigger, correctToday: a.correct_today })
        return
      }
      pendingRef.current = null
      loadNext()
    },
    [goTo, loadNext, solvedCount, player, releaseXp],
  )

  // Deriva el enunciado en cuanto llega, mientras la persona lo lee: cuando
  // responda, juzgar cuesta diez cuentas.
  const evaluarLocal = useLocalVerdict(exercise?.prompt_latex ?? null)

  const onRevisar = useCallback(async () => {
    if (!exercise || answerMutation.isPending) return
    const latex = inputRef.current?.getLatex() ?? ""
    if (!latex.trim()) return
    const mathjson = await parseAnswerToMathJson(latex)

    // El color y el sonido salen ACÁ si el veredicto local puede decidirlo, sin
    // esperar el viaje al servidor. La XP, el Elo y el puesto siguen viniendo de
    // `/answer`: esto solo adelanta lo que ya se sabe.
    const local = evaluarLocal(mathjson)
    anticipadoRef.current = local !== null
    if (local !== null) {
      setTonoLocal(local ? "correct" : "wrong")
      setAnswerSeq((n) => n + 1)
      if (local) sfx.correct()
      else sfx.wrong()
    }

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
          // Manda el servidor: el color local ya cumplió su función.
          setTonoLocal(null)
          if (!anticipadoRef.current) setAnswerSeq((n) => n + 1)
          posthog.capture("game_answer", {
            correct: data.correct,
            parse_ok: data.parse_ok,
            attempt: data.attempt_number,
            // Para poder unir este evento con la fila de game_attempts, que
            // guarda el MISMO response_ms medido antes de salir a la red: la
            // resta de los dos relojes es el tiempo de red más servidor.
            exercise_id: exercise.exercise_id,
            // Si el veredicto se pudo adelantar, esta respuesta no se esperó.
            anticipated: anticipadoRef.current,
            tier: exercise.tier,
            stars: exercise.difficulty_stars,
            solved: solvedCount,
            combo: data.combo,
            xp: data.xp_awarded,
            multiplier: data.xp_multiplier,
            response_ms: Date.now() - servedAtRef.current,
          })
          if (!data.parse_ok) return
          if (data.correct) {
            if (!anticipadoRef.current) sfx.correct()
            setSolvedCount((n) => n + 1)
            pendingRef.current = { answer: data }
            // El estallido ocurre ACÁ, en la pantalla donde se acertó y sobre el
            // botón que se acaba de tocar. `hold` deja las partículas flotando
            // ahí: la XP ya existe pero todavía no está atribuida, y eso es lo
            // que se ve. El imán llega en la slide del ranking, que es donde
            // está el contador al que van a parar.
            fireXp(data, { hold: true })
            if (data.is_record) posthog.capture("game_record", { best_rank: data.best_rank })
          } else {
            if (!anticipadoRef.current) sfx.wrong()
            if (data.attempts_left === 0) pendingRef.current = { answer: data }
          }
        },
      },
    )
  }, [exercise, answerMutation, sfx, solvedCount, fireXp, evaluarLocal])

  const closed = lastAnswer?.parse_ok === true && (lastAnswer.correct || lastAnswer.attempts_left === 0)
  // La respuesta del servidor manda; el tono local solo cubre el hueco entre el
  // toque y su llegada.
  const tone = answerTone(lastAnswer) ?? tonoLocal

  // Saltear también en el teléfono: no hay atajo de teclado, pero el botón sí está.
  const onSkip = useCallback(() => {
    if (!exercise || closed || skipMutation.isPending || answerMutation.isPending) return
    posthog.capture("game_skip", {
      tier: exercise.tier,
      stars: exercise.difficulty_stars,
      solved: solvedCount,
      exercise_id: exercise.exercise_id,
    })
    skipMutation.mutate(
      { exercise_id: exercise.exercise_id },
      {
        onSuccess: (data) => {
          // El endpoint ya devuelve el reemplazo: no hay slide intermedia ni un
          // /next detrás, el ejercicio nuevo entra en el mismo lugar.
          setExercise(data)
          setLastAnswer(null)
          setTonoLocal(null)
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
  }, [exercise, closed, skipMutation, answerMutation.isPending, solvedCount])

  // Todo menos el logo espera a que la presentación lo devuelva a su lugar.
  const chromeStyle: React.CSSProperties = {
    opacity: intro.chromeVisible ? 1 : 0,
    transition: "opacity 0.5s ease-in-out",
  }

  const startDisabled = player === null || next.isPending || !intro.done

  return (
    <div className="relative grid h-dvh overflow-hidden">
      {/* Fuera de las slides a propósito: son motion.div con transform, y un
          transform ancestro recorta el `fixed inset-0` de las monedas. */}
      <XpOrbs
        burst={burst}
        target={magnetTarget}
        area={orbArea}
        onArrive={onXpArrive}
        onCleared={onOrbsCleared}
        holding={holding}
      />
      <AnimatePresence mode="sync" initial={false}>
        <motion.div
          key={slideSeq}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={SLIDE_TRANSITION}
          // `min-w-0` no es de adorno: como ítem de grilla, el mínimo por
          // defecto es su CONTENIDO, así que algo más ancho que la pantalla
          // —la pastilla del marcador con un Elo de cuatro cifras, por
          // ejemplo— agrandaba la columna entera. El `overflow-hidden` de la
          // raíz recortaba entonces la derecha, y las cajas quedaban pegadas a
          // ese borde con sus 16 px intactos solo del lado izquierdo: se veía
          // como un centrado roto. Con el mínimo en cero la columna nunca pasa
          // del ancho de la pantalla y lo que no entra se recorta adentro, sin
          // arrastrar al resto.
          className="col-start-1 row-start-1 flex min-h-0 min-w-0 flex-col"
        >
          {slide.kind === "intro" && (
            <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 pb-[var(--cta-pb)]">
              <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
                {/* El logo de la presentación es este mismo: se despega de
                    acá, se escribe en el centro y vuelve (ver game-intro.tsx). */}
                {/* 15% menos que antes (era 2.25rem), igual que el header de
                    escritorio y que la presentación (INTRO_FONT_PX). */}
                <GameIntroLogo intro={intro} fontSize="1.9125rem" />
                {/* El mismo texto que la intro de escritorio (intro-panel.tsx),
                    palabra por palabra: es lo único que el juego explica.

                    La tipografía es la de la bienvenida del onboarding —cuerpo
                    normal, `leading-relaxed`, `text-foreground/85`— y no el
                    `text-sm text-muted-foreground` de antes: en la primera
                    pantalla del juego este texto ES el contenido, no una
                    aclaración al pie. */}
                <div
                  style={chromeStyle}
                  // `mt-6` y no el `gap-4` del contenedor: el logo es el título
                  // de esta pantalla y el texto es su cuerpo, así que entre los
                  // dos tiene que haber más aire que entre los párrafos. Con la
                  // misma separación, el logo se leía como un renglón más de la
                  // lista.
                  className="mx-auto mt-10 flex max-w-xs flex-col gap-3 leading-relaxed text-foreground/85"
                >
                  <IntroParagraphs />
                  <p className="font-semibold text-foreground">{INTRO_CLOSE}</p>
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
            <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-3 px-4 pb-[var(--cta-pb)] pt-3">
              <GameHeader
                onSettings={() => {
                  sfx.select()
                  goTo({ kind: "settings", back: { kind: "exercise" } })
                }}
              />
              {/* Cambiar de ejercicio SIN cambiar de pantalla —o sea, saltear—
                  voltea la card entera y del otro lado está la derivada nueva.
                  Es el mismo gesto que en escritorio (desktop-layout.tsx) y la
                  misma llave: el id del ejercicio.

                  Solo se ve al saltear, y es a propósito. Después de responder
                  se pasa por el ranking, así que el ejercicio siguiente entra
                  con el deslizamiento de la slide y esta caja se monta de cero
                  —y `AnimatePresence` con `initial={false}` no anima la primera
                  cara—. Dos transiciones encimadas se leerían como un tirón. */}
              <SlideFlip
                slide={String(exercise.exercise_id)}
                className="min-h-0 flex-1"
              >
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-border bg-card">
                <ExerciseCard
                  bare
                  className="flex-1"
                  streak={player?.combo ?? 0}
                  attempted={player?.exercises_attempted ?? 0}
                  elo={player?.elo ?? null}
                  multiplier={boost?.multiplier ?? 1}
                  promptLatex={exercise.prompt_latex}
                  promptGone={tone === "correct"}
                  promptRef={attachPrompt}
                >
                  <div className={cn("flex flex-col gap-2", PANEL_CONTENT)}>
                    <AnswerField tone={tone} seq={answerSeq}>
                      <MathInput
                        handleRef={attachInput}
                        tone={tone}
                        hint={HINT_MOBILE}
                        onEnter={({ skip }) => {
                          if (skip) onSkip()
                          else if (closed) advanceAfterAnswer(null)
                          else void onRevisar()
                        }}
                        onChange={() => {
                          if (!closed && lastAnswer) setLastAnswer(null)
                          if (!closed && tonoLocal) setTonoLocal(null)
                        }}
                      />
                    </AnswerField>
                  </div>
                </ExerciseCard>
                {/* Sigue montado con el ejercicio cerrado: sacarlo empujaría todo
                    lo de arriba justo cuando la persona va a tocar Continuar. */}
                <MathKeyboard
                  bare
                  input={inputRef}
                  keys={exercise.keys}
                  className={closed ? "pointer-events-none opacity-45" : undefined}
                />
              </div>
              </SlideFlip>
              {/* Los botones quedan FUERA del volteo: no son parte del
                  ejercicio, y girarlos dejaría un instante sin dónde tocar. */}
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
              onRelease={releaseXp}
              onContinue={() => advanceAfterAnswer("ranking")}
              continueDisabled={next.isPending}
              onSettings={() => {
                sfx.select()
                goTo({ kind: "settings", back: slide })
              }}
            />
          )}

          {slide.kind === "settings" && (
            <div className="mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col px-4 pb-[var(--cta-pb)] pt-4">
              <SettingsPanel
                player={player}
                onClose={() => {
                  refetchPlayer()
                  const back = slide.back
                  // Al ejercicio solo se puede volver si hay uno servido; desde
                  // cualquier otra pantalla se vuelve a la misma.
                  if (back.kind !== "exercise") goTo(back)
                  else if (exercise) goTo(back)
                  else loadNext()
                }}
                onNeedsRegister={() => goTo({ kind: "register" })}
              />
            </div>
          )}

          {slide.kind === "profile" && (
            <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 pb-[var(--cta-pb)]">
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
            <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 pb-[var(--cta-pb)]">
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
            <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 pb-[var(--cta-pb)] pt-4">
              {/* Sin `keyboard`: el botón de seguir igual espera sus diez
                  segundos —la espera es para leer, no para el teclado— pero acá
                  no hay tecla que mostrar ni atajo que ofrecer. */}
              <CafecitoPanel
                trigger={slide.trigger}
                correctToday={slide.correctToday}
                university={player?.university ?? null}
                solved={solvedCount}
                onPickUniversity={() => goTo({ kind: "settings", back: slide })}
                onContinue={() => advanceAfterAnswer("cafecito")}
                className="flex-none"
              />
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
  onRelease,
  onContinue,
  continueDisabled,
  onSettings,
}: {
  answer: GameAnswer
  climbFrom: number | null
  liveXp: number | null
  counting: boolean
  myUniversity: string | null
  attachXpTarget: (node: HTMLElement | null) => void
  enabled: boolean
  onRelease: () => void
  onContinue: () => void
  continueDisabled: boolean
  onSettings: () => void
}) {
  // Red de seguridad, no el disparo: quien suelta el imán es el toque en
  // Continuar (ver advanceAfterAnswer), para que los orbes viajen durante el
  // pase. Esto cubre cualquier camino que llegue al ranking sin pasar por ahí, y
  // si ya se soltó no hace nada.
  const releaseRef = useRef(onRelease)
  useEffect(() => {
    releaseRef.current = onRelease
  })
  useEffect(() => {
    releaseRef.current()
  }, [answer])

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col gap-3 px-4 pb-[var(--cta-pb)] pt-3">
      {/* La misma barra que en el ejercicio, y en el mismo lugar: entre las dos
          pantallas se rebota después de cada respuesta, y una barra que aparece
          y desaparece hace saltar todo lo de abajo en cada rebote. */}
      <GameHeader onSettings={onSettings} />
      {/* Sin cartel de "+21 de experiencia" arriba: el XP ya se ve —y mejor—
          como bolitas cayendo sobre la fila propia y el número subiendo ahí
          mismo. Un renglón que dice lo que la animación está mostrando le saca
          alto al ranking, que es a lo que se vino. */}
      <GameRanking
        climbFrom={climbFrom}
        enabled={enabled}
        liveXp={liveXp}
        counting={counting}
        myUniversity={myUniversity}
        attachXpTarget={attachXpTarget}
        className="min-h-0 flex-1"
      />
      {/* Sin historial de novedades debajo del Continuar: en el teléfono era una
          caja de dos renglones peleándole el alto al ranking y quedando abajo
          del botón, o sea después del final de la pantalla. El historial vive en
          escritorio (desktop-layout.tsx), donde hay una columna que le sobra. */}
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
