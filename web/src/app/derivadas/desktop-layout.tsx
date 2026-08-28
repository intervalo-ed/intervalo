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
import { useQueryClient } from "@tanstack/react-query"
import { Settings } from "lucide-react"
import { GRID_BG_STYLE } from "@/components/grid-bg"
import { ApiError } from "@/lib/api/client"
import { useSfx } from "@/lib/audio/useSfx"
import {
  CafecitoButton,
  ShareButton,
  markCafecitoShown,
  shouldShowCafecito,
  CAFECITO_EVERY,
  type CafecitoTrigger,
} from "./cafecito-cta"
import { CafecitoPanel } from "./cafecito-panel"
import {
  AnswerButton,
  AnswerField,
  ExerciseCard,
  PANEL_CONTENT,
  SkipButton,
  answerTone,
  type AnswerTone,
} from "./exercise-card"
import { DerivativesTable, FlipCard, TableButton } from "./derivatives-table"
import { GameIntroLogo, type GameIntro } from "./game-intro"
import { GameRanking } from "./game-ranking"
import { IntroPanel, IntroStartButton } from "./intro-panel"
import { SlideFlip } from "./slide-flip"
import { useTeclas } from "./teclas"
import { MathInput, tipFor, type MathInputHandle } from "./math-input"
import { MathKeyboard } from "./math-keyboard"
import { parseAnswerToMathJson, warmupComputeEngine } from "./parse-answer"
import { useLocalVerdict } from "./UseLocalVerdict"
import { ProfileSlides, RegisterSlide } from "./register-slides"
import { EventFeed } from "./event-feed"
import { outOfFocus } from "./out-of-focus"
import { useGameIdentity } from "./game-telemetry"
import { SettingsPanel } from "./settings-panel"
import {
  useAnswerExercise,
  useNextExercise,
  useSkipExercise,
  type GameAnswer,
  type GameExercise,
} from "./UseGameExercise"
import { useGamePulse, useMyBoost } from "./UseGameLeaderboard"
import { gameKeys, useGamePlayer } from "./UseGamePlayer"
import { useXpBurst, XpOrbs } from "./xp-burst"

// Las pantallas del panel izquierdo. Todas viven en la misma caja y se cambian
// con el mismo volteo (slide-flip.tsx).
type Panel = "intro" | "exercise" | "profile" | "register" | "cafecito"

// Los hitos que interrumpen el ejercicio son un subconjunto: la intro no se
// "agenda", ocurre antes de que haya juego.
type Milestone = Extract<Panel, "profile" | "register">

// Piso de alto de la caja de las pantallas. Lo fija la que más pide —el
// ejercicio— y lo heredan todas: así el volteo gira una caja del mismo tamaño de
// los dos lados, que es la única forma de que se lea como una card dándose
// vuelta y no como un salto. Sale de sumar sus partes (la FlipCard, el botón, el
// piso del historial y los dos gaps de 0.75rem), no de un número a ojo.
const PANEL_MIN_H = "min-h-[calc(26rem_+_7rem_+_1.5rem_+_var(--cta-h))]"

// Mientras se lee la intro, todo lo demás va fuera de foco (ver out-of-focus.ts).
const enIntro = (panel: Panel) => panel === "intro"

// Los dos umbrales de la consulta con Alt sostenido (ver el listener más abajo):
// a los 100 ms se voltea la card, y recién a los 600 se cobra.
//
// El primero estuvo en 250 mientras el gesto era con Shift, donde ese margen
// hacía falta para no voltear la card cada vez que alguien escribía un
// paréntesis (Shift+8). Con Alt eso no existe —no se escribe nada con Alt— y
// 250 ms se sienten como un retardo. 100 es el umbral por debajo del cual una
// respuesta se percibe instantánea, y alcanza para que un Alt+Tab rápido cancele
// antes de que se dibuje nada: sin ninguna espera, el Tab llegaría con el giro
// ya empezado y se vería amagar y volver.
//
// El segundo es cuándo se cobra, y sigue holgado a propósito: quien la abrió sin
// querer tiene medio segundo largo para soltar antes de perder Elo.
const PEEK_OPEN_MS = 100
const PEEK_CHARGE_MS = 600

/** Lo que se ve mientras llega la primera derivada.
 *
 * Un esqueleto y no un cartel de "cargando": dibuja la FORMA de lo que está por
 * aparecer —enunciado, fórmula, campo, teclado y botón— así que cuando el
 * ejercicio llega no hay salto de layout, solo se rellena lo que ya estaba. Un
 * texto centrado, en cambio, obliga a redibujar la pantalla entera y se siente
 * más lento aunque tarde lo mismo.
 *
 * Las medidas son las de las piezas reales (la card de PANEL_MIN_H, el CTA de
 * --cta-h, el historial de 107,5 px), para que el relleno sea exacto.
 */
function ExerciseSkeleton() {
  return (
    <div className="flex flex-1 animate-pulse flex-col gap-3" aria-hidden>
      <div className="flex min-h-[26rem] flex-1 flex-col rounded-lg border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <div className="h-4 w-56 rounded bg-foreground/10" />
          <div className="flex gap-3">
            <div className="h-4 w-10 rounded bg-foreground/10" />
            <div className="h-4 w-10 rounded bg-foreground/10" />
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="h-9 w-48 rounded bg-foreground/10" />
        </div>
        <div className="h-[3.4rem] shrink-0 rounded-lg bg-foreground/[0.07]" />
        <div className="mt-4 grid shrink-0 grid-cols-6 gap-2">
          {Array.from({ length: 18 }).map((_, i) => (
            <div key={i} className="h-9 rounded-md bg-foreground/[0.07]" />
          ))}
        </div>
      </div>
    </div>
  )
}

export function DesktopLayout({ intro }: { intro: GameIntro }) {
  const { player, refetch: refetchPlayer } = useGamePlayer()
  const queryClient = useQueryClient()
  const next = useNextExercise()
  const answerMutation = useAnswerExercise()
  const skipMutation = useSkipExercise()
  const sfx = useSfx()
  const teclas = useTeclas()

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
  const [centerKey, setCenterKey] = useState(0)
  // El disparador MÁS el número que la diapo va a mostrar. Van juntos porque el
  // conteo del día viaja en la respuesta que disparó el hito: guardarlo aparte
  // obligaría a leerlo de una consulta que para entonces ya se refrescó.
  const [cafecito, setCafecito] = useState<{
    trigger: CafecitoTrigger
    correctToday: number
    // A dónde se vuelve al salir. Sin esto, quien entró por configuración
    // terminaba en el ejercicio y perdía lo que estaba haciendo ahí.
    volverA?: "settings"
  } | null>(null)
  // La tabla está a la vista ahora mismo.
  const [tableOpen, setTableOpen] = useState(false)
  // Cuál de las dos caras traseras es la que se está mostrando. Se actualiza
  // solo al ABRIR una, nunca al cerrar.
  //
  // Antes salía de `settingsOpen ? configuración : tabla`, y ahí estaba el bug:
  // al cerrar la configuración, `settingsOpen` pasaba a false en el mismo
  // instante en que arrancaba el giro, así que el dorso se convertía en la tabla
  // de derivadas ANTES de empezar a moverse y lo que se veía darse vuelta era
  // una tabla que nadie había pedido. Recordando la última abierta, el dorso se
  // queda quieto mientras la card gira y lo que se va es lo que estaba.
  const [backKind, setBackKind] = useState<"settings" | "table">("table")
  // La configuración está a la vista: es el dorso del RANKING, no del ejercicio,
  // así que no es una de las pantallas de `panel` — las dos columnas se voltean
  // por separado y pueden estar dadas vuelta a la vez.
  const [settingsOpen, setSettingsOpen] = useState(false)
  const abierto = settingsOpen ? "settings" : tableOpen ? "table" : null
  if (abierto !== null && abierto !== backKind) setBackKind(abierto)
  // La tabla se consultó en ESTE ejercicio. Va en un ref y no en estado porque
  // solo se lee al responder: que cambie no tiene por qué redibujar nada.
  const peekedRef = useRef(false)
  // Los hitos (carrera/universidad, registro) ocurren EN el panel izquierdo,
  // reemplazando al ejercicio: todo pasa en la misma vista (pedido de producto).
  //
  // `null` = todavía no se navegó a ninguna pantalla a mano, y entonces manda la
  // intro (ver `panel` más abajo). Guardar acá un "intro" inicial sería
  // más simple de leer, pero exigiría decidirlo en un efecto y eso es un
  // setState sincrónico en efecto — cascada de renders, y el lint del compilador
  // lo rechaza. Derivarlo cuesta este `null` y nada más.
  const [navPanel, setNavPanel] = useState<Panel | null>(null)
  const pendingMilestoneRef = useRef<Milestone | null>(null)
  const askedProfileRef = useRef(false)
  const askedRegisterRef = useRef(false)
  const inputRef = useRef<MathInputHandle | null>(null)
  // Ref de CALLBACK y no el objeto pelado: con el volteo entre ejercicios, la
  // card vieja y la nueva conviven un rato, y la vieja publica `null` al
  // desmontarse DESPUÉS de que la nueva ya publicó su campo. Ignorar el null es
  // lo que evita que el juego se quede sin dónde escribir. El handle que queda
  // colgado es inofensivo: sus métodos leen un campo que ya no existe y no
  // hacen nada.
  const attachInput = useCallback((handle: MathInputHandle | null) => {
    if (handle) inputRef.current = handle
  }, [])
  const servedAtRef = useRef<number>(0)
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
    onOrbsCleared,
    breaking,
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

  // La universidad, la carrera y si es invitado se cuelgan de TODOS los eventos del
  // juego como super propiedades: sin esto, cortar cualquier embudo por universidad
  // obliga a acordarse de pasarla en los treinta `capture` que hay repartidos.
  useGameIdentity(player)

  useEffect(() => {
    posthog.capture("game_start", {
      is_guest: player?.is_guest ?? true,
      platform: "desktop",
    })
    warmupComputeEngine()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadNext = useCallback(() => {
    next.mutate(undefined, {
      onSuccess: (data) => {
        setExercise(data)
        // El panel vuelve al ejercicio ACÁ y no en quien pidió el ejercicio, que
        // es donde estaba. Cambiarlo antes producía DOS volteos por un solo
        // gesto: el panel giraba enseguida y del otro lado aparecía la card con
        // el ejercicio VIEJO —que sigue en el estado hasta que llega el nuevo—, y
        // cuando la respuesta llegaba unos cientos de milisegundos después
        // cambiaba la clave del volteo de adentro y la card giraba otra vez.
        //
        // Así el volteo es uno solo y del otro lado ya está todo listo. Es
        // exactamente lo que hace el teléfono (mobile-flow.tsx :: loadNext), que
        // por eso nunca tuvo este problema.
        setNavPanel("exercise")
        setLastAnswer(null)
        setTonoLocal(null)
        setClimbFrom(null)
        setCafecito(null)
        // Ejercicio nuevo, cuenta limpia: la consulta anterior no lo penaliza.
        peekedRef.current = false
        setTableOpen(false)
        servedAtRef.current = Date.now()
        inputRef.current?.clear()
        inputRef.current?.focus()
        posthog.capture("game_exercise_served", {
          tier: data.tier,
          exercise_id: data.exercise_id,
          // Las estrellas son p̂ redondeado (elo.difficulty_stars): es lo más
          // cerca de la dificultad servida que el cliente puede ver, y sin
          // ellas ningún embudo de PostHog se puede cortar por dificultad.
          stars: data.difficulty_stars,
          keys: data.keys.length,
          new_keys: data.new_keys.length,
        })
      },
    })
  }, [next])

  // Empezar de verdad: entra la primera derivada. Es lo que hace el botón y
  // también el Enter.
  const startFromIntro = useCallback(() => {
    posthog.capture("game_intro_done", { platform: "desktop" })
    sfx.continue()
    loadNext()
  }, [loadNext, sfx])

  // La pantalla efectiva: lo último que se eligió a mano y, si no se eligió
  // nada, la intro. Siempre la intro: ya no se recuerda en localStorage si se
  // vio (ver la cabecera de intro-panel.tsx), así que el HTML del servidor y el
  // primer render del cliente dicen lo mismo y no hay nada que reconciliar.
  //
  // Como consecuencia, la primera derivada la pide SIEMPRE el botón: no queda
  // ningún camino en el que la partida arranque sola.
  const panel: Panel = navPanel ?? "intro"

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
        peeked: peekedRef.current,
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
            // Con la tabla abierta la derivada deja de ser una pregunta: sin
            // esta propiedad, PostHog mezcla «resolvió» con «copió» en la misma
            // tasa de acierto, igual que le pasaba al panel antes de persistirlo.
            peeked: peekedRef.current,
            solved: solvedCount,
            combo: data.combo,
            xp: data.xp_awarded,
            multiplier: data.xp_multiplier,
            response_ms: Date.now() - servedAtRef.current,
          })
          if (!data.parse_ok) return
          if (!data.correct) {
            if (!anticipadoRef.current) sfx.wrong()
            return
          }
          if (!anticipadoRef.current) sfx.correct()
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
          if (data.is_record)
            posthog.capture("game_record", { best_rank: data.best_rank })
          const delta =
            rankBefore !== null && rankAfter !== null
              ? rankBefore - rankAfter
              : 0
          // El hito del cafecito se cuenta con las correctas ACUMULADAS del
          // jugador, que las manda el servidor, y no con las de esta pestaña.
          // `solved` vive en un `useState` y vuelve a cero en cada recarga, así
          // que llegar a veinte pedía veinte aciertos seguidos sin refrescar —
          // y el cooldown, que sí se guarda en localStorage, se comparaba
          // contra ese contador de sesión: después de la primera aparición la
          // cuenta quedaba envenenada y no volvía a salir nunca.
          const totalCorrectas = data.exercises_correct
          const trigger: CafecitoTrigger | null = data.is_record
            ? "record"
            : delta >= 3
              ? "big_climb"
              : totalCorrectas > 0 && totalCorrectas % CAFECITO_EVERY === 0
                ? "milestone"
                : null
          const tocaCafecito =
            trigger !== null && shouldShowCafecito(totalCorrectas, trigger)
          const sinUniversidad = player !== null && !player.university
          // La universidad se pregunta UNA VEZ y no es una condición permanente. Que lo
          // fuera es lo que rompió esto: como el paso se pregunta una sola vez por
          // visita, quien lo salteaba quedaba sin universidad Y sin la pregunta, y el
          // cafecito no volvía a salir nunca.
          //
          // Ahora el adelanto vale solo mientras la pregunta esté pendiente. Preguntada
          // —contestada o salteada— el cafecito sale igual, y si todavía no hay
          // universidad la diapo se encarga sola: tiene su propia versión para ese caso.
          const faltaPreguntarUniversidad =
            sinUniversidad && !askedProfileRef.current

          // La universidad va ANTES que el cafecito, siempre. La diapo del café
          // ofrece multiplicar el XP "de toda tu universidad": sin universidad no
          // tiene qué ofrecer, y lo que quedaba era una pantalla que pedía algo y
          // de paso pedía otra cosa primero.
          //
          // Cuando el cafecito quiere salir y falta la universidad, el hito del
          // perfil se ADELANTA y ocupa su lugar. Por eso no se marca el cooldown
          // en ese caso: el cafecito no se mostró, así que no gastó su turno y
          // vuelve en el próximo hito, ya con universidad que nombrar.
          if (tocaCafecito && !faltaPreguntarUniversidad) {
            markCafecitoShown(totalCorrectas)
            setCafecito({ trigger, correctToday: data.correct_today })
          }
          if (faltaPreguntarUniversidad && (tocaCafecito || solved >= 5)) {
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
        // Red de seguridad para cualquier desincronización con el server.
        //
        // Un 409 acá significa que este ejercicio ya no está servido: lo venció
        // un reinicio de progreso, lo cerró otra pestaña, o la sesión quedó vieja.
        // Sin esto el juego se traba —el botón responde y no pasa nada— y la
        // única salida es recargar la página. Pidiendo otro, se destraba solo.
        onError: (err) => {
          if (err instanceof ApiError && err.status === 409) {
            setExercise(null)
            setLastAnswer(null)
            setTonoLocal(null)
            loadNext()
          }
        },
      },
    )
  }, [exercise, answerMutation, sfx, solvedCount, player, fireXp, evaluarLocal, loadNext])

  const closed =
    lastAnswer?.parse_ok === true &&
    (lastAnswer.correct || lastAnswer.attempts_left === 0)
  // La respuesta del servidor manda; el tono local solo cubre el hueco entre el
  // toque y su llegada.
  const tone = answerTone(lastAnswer) ?? tonoLocal

  // Lo que hace el botón grande. Vive suelto porque lo comparten el click y el
  // Enter, y tienen que hacer exactamente lo mismo.
  const onPrimary = useCallback(() => {
    if (!closed) {
      void onRevisar()
      return
    }
    // Con la mesa todavía en juego no se sigue. El guardia va ACÁ y no solo en el
    // `disabled` del botón porque este mismo callback es el que corre con Enter,
    // y el juego se juega con Enter: un botón gris que igual responde a la tecla
    // es peor que no bloquear nada.
    if (breaking) return
    const milestone = pendingMilestoneRef.current
    if (milestone) {
      pendingMilestoneRef.current = null
      posthog.capture("game_register_slide_shown", {
        slide: milestone === "profile" ? "career" : "register",
      })
      setNavPanel(milestone)
      return
    }
    // El café interrumpe acá y no al responder: la diapo entra DESPUÉS del
    // Continuar, con el mismo volteo con el que entraría la derivada siguiente,
    // así que ocupa el lugar del ejercicio en vez de aparecer al costado
    // mientras todavía se está mirando el resultado.
    if (cafecito) {
      setNavPanel("cafecito")
      return
    }
    loadNext()
  }, [closed, onRevisar, loadNext, cafecito, breaking])

  const onSkip = useCallback(() => {
    if (
      !exercise ||
      closed ||
      skipMutation.isPending ||
      answerMutation.isPending
    )
      return
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
        onError: (err) => {
          // Ídem responder: si este ejercicio ya no está servido —lo venció un
          // reinicio, lo cerró otra pestaña— saltear también devolvía 409 y
          // dejaba el juego trabado. Se pide otro y sigue.
          if (err instanceof ApiError && err.status === 409) {
            setExercise(null)
            setLastAnswer(null)
            setTonoLocal(null)
            loadNext()
          }
        },
      },
    )
  }, [exercise, closed, skipMutation, answerMutation.isPending, solvedCount, loadNext])

  // Abrir la tabla marca el ejercicio: la respuesta que venga después no mueve
  // el Elo y paga XP simbólica (el server lo aplica, ver game/router.py).
  const openTable = useCallback(() => {
    if (peekedRef.current) return
    peekedRef.current = true
    posthog.capture("game_peek", {
      exercise_id: exercise?.exercise_id ?? null,
      tier: exercise?.tier ?? null,
      stars: exercise?.difficulty_stars ?? null,
    })
  }, [exercise])

  // Espejo del estado para los handlers de teclado: si `tableOpen` entrara en
  // las dependencias del efecto, cada volteo volvería a registrar los
  // listeners, y esa limpieza a mitad de camino se comería el temporizador de
  // gracia de Alt y el flag de "estoy sosteniendo".
  const tableOpenRef = useRef(false)
  useEffect(() => {
    tableOpenRef.current = tableOpen
  })

  const flipTable = useCallback(() => {
    if (!tableOpenRef.current) openTable()
    setTableOpen(!tableOpenRef.current)
  }, [openTable])

  const toggleTable = useCallback(() => {
    sfx.select()
    flipTable()
  }, [sfx, flipTable])

  // Alt SOSTENIDO (Option en Mac, donde la tecla lleva impreso "alt" también):
  // la tabla mientras está abajo, y al soltarla vuelve el ejercicio.
  //
  // **El bug que hacía que el gesto "amagara y volviera".** Pasaba con Shift y
  // pasaba con Alt, o sea que nunca fue la tecla: mientras una tecla está abajo
  // el sistema REPITE el keydown (en Windows, desde el medio segundo). La regla
  // de "cualquier otra tecla cancela" tomaba esa repetición por una tecla nueva,
  // así que la card empezaba a voltearse a los 250 ms y a los ~500 se volvía
  // sola. Una repetición no es una tecla nueva: ahora se ignora.
  //
  // Por qué Alt y no las otras tres:
  //   · Shift NO, aunque sea la más cómoda. Windows tiene dos atajos de
  //     accesibilidad encima: FilterKeys salta al sostener Shift 8 segundos y
  //     StickyKeys a las 5 pulsaciones seguidas. Los intercepta el sistema antes
  //     que el navegador, así que no hay `preventDefault` ni API que los evite —
  //     desde una página no se puede mitigar, solo apagarlos en la configuración
  //     de cada máquina. Un juego no puede pedir eso.
  //   · Ctrl tampoco: Windows manda AltGr como un Control sintético, así que en
  //     un teclado español o latinoamericano —el de casi todo el que juega esto—
  //     escribir `@` o `[` abría la tabla. De paso Ctrl queda libre para el
  //     Ctrl+Enter del salteo, y acá se descarta cualquier evento con `ctrlKey`,
  //     que es justo como llega AltGr.
  //   · Tab no: MathLive ya lo usa para saltar entre los huecos de la fórmula
  //     (√□, e^□) mientras se escribe la respuesta.
  //
  // Alt no se escribe con nada y no dispara nada del sistema. Lo único que hay
  // que atajarle son sus propios atajos, y para eso están las dos defensas:
  //   1. cualquier OTRA tecla mientras se sostiene cancela — cubre Alt+Tab,
  //      Alt+F4 y las flechas de historial, que son atajos y no consultas;
  //   2. el castigo tarda PEEK_CHARGE_MS, para quien la abre y cierra enseguida.
  //
  // Solo toma el gesto si la tabla está cerrada, y solo cierra si fue él quien
  // la abrió: si no, tocar Alt con la tabla ya abierta desde el botón la
  // cerraría de rebote.
  const gameFocused = panel === "exercise" && exercise !== null
  useEffect(() => {
    if (!gameFocused) return
    const timers: ReturnType<typeof setTimeout>[] = []
    let sosteniendo = false
    // Si la card llegó a voltearse. El sonido va atado a ESTO y no a la tecla:
    // el gesto que se cancela antes de los PEEK_OPEN_MS no dibujó nada, así que
    // tampoco tiene que sonar. Un Alt+Tab con chasquido sería peor que mudo.
    let volteada = false
    const soltar = () => {
      if (!sosteniendo) return
      sosteniendo = false
      while (timers.length) clearTimeout(timers.pop()!)
      if (volteada) {
        volteada = false
        sfx.select()
      }
      setTableOpen(false)
    }
    const down = (e: KeyboardEvent) => {
      if (e.key === "Alt" && !e.ctrlKey) {
        // Sin esto, soltar un Alt pelado le pasa el foco a la barra de menú del
        // navegador y el teclado deja de escribir en el campo.
        e.preventDefault()
        // Repetición del sistema, o gesto ya tomado: no arma de nuevo, pero
        // sobre todo NO cancela. Que cayera en la rama de abajo era el bug.
        if (e.repeat || sosteniendo || tableOpenRef.current) return
        sosteniendo = true
        timers.push(
          setTimeout(() => {
            // El mismo sonido que el botón de la tabla: es la misma acción, y
            // que una suene y la otra no las haría parecer dos cosas distintas.
            volteada = true
            sfx.select()
            setTableOpen(true)
          }, PEEK_OPEN_MS),
        )
        timers.push(setTimeout(openTable, PEEK_CHARGE_MS))
        return
      }
      // Cualquier OTRA tecla mientras se sostiene: era un atajo, no una consulta.
      if (sosteniendo) soltar()
    }
    const up = (e: KeyboardEvent) => {
      if (e.key !== "Alt") return
      e.preventDefault()
      soltar()
    }
    // `blur`: si la ventana pierde el foco con la tecla apretada, el
    // keyup nunca llega y la tabla quedaría abierta para siempre.
    window.addEventListener("keydown", down)
    window.addEventListener("keyup", up)
    window.addEventListener("blur", soltar)
    return () => {
      while (timers.length) clearTimeout(timers.pop()!)
      window.removeEventListener("keydown", down)
      window.removeEventListener("keyup", up)
      window.removeEventListener("blur", soltar)
    }
    // `sfx` entra en las dependencias sin riesgo: `useSfx` lo memoiza sin
    // dependencias, así que es el mismo objeto en cada render y el efecto no se
    // vuelve a registrar (lo que borraría el estado del gesto en curso).
  }, [gameFocused, openTable, sfx])

  const onEnterKey = useCallback(
    ({ skip }: { skip: boolean }) => {
      // En la intro Enter es lo único que hay: no hay nada que saltear todavía.
      if (panel === "intro") {
        startFromIntro()
        return
      }
      // La diapo del café tiene su propio Enter —espera diez segundos, y con
      // Shift invita— y lo maneja ella (cafecito-panel.tsx). Si además corriera
      // este, el primer Enter saltearía la diapo entera.
      if (panel === "cafecito") return
      if (skip) {
        onSkip()
        return
      }
      onPrimary()
    },
    [panel, startFromIntro, onSkip, onPrimary],
  )

  // Dónde escucha el Enter global. Es más ancho que `gameFocused` (que gobierna
  // la tabla) porque la intro también se despacha con Enter, y de hecho es la
  // primera vez que alguien lo usa: si ahí no funcionara, el chip de la tecla
  // estaría mintiendo justo cuando se lo lee.
  const enterFocused = gameFocused || panel === "intro"

  // El juego se maneja entero desde el teclado. Este listener es el que cubre
  // el caso en que el foco NO está en el campo (después de responder, o tras
  // tocar una tecla del teclado en pantalla); cuando sí lo está, MathLive corta
  // la propagación y dispara el mismo handler desde su propio keydown.
  useEffect(() => {
    if (!enterFocused) return
    const onKeyDown = (e: KeyboardEvent) => {
      // Alt es el que saltea, así que Alt+Enter tiene que ENTRAR acá. Antes se
      // descartaba —Alt+Enter era del navegador— y ahora es el atajo: en una
      // página, sin foco en la barra de direcciones, no pisa nada.
      if (e.key !== "Enter") return
      // Los campos de texto (el @ del registro, los selectores) son dueños de
      // su propio Enter.
      const el = e.target as HTMLElement | null
      const tag = el?.tagName
      if (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        el?.isContentEditable
      )
        return
      // Y también los desplegables. La lista de arriba mira el TAG, y los
      // filtros del ranking no son un `<select>` nativo sino un
      // `<button role="combobox">` con su lista aparte (components/ui/select.tsx,
      // sobre Base UI). Sin esta línea, elegir una universidad con Enter caía
      // acá: el filtro no se aplicaba y encima se mandaba la respuesta del
      // ejercicio que estaba a medio escribir.
      if (el?.closest('[role="combobox"], [role="listbox"], [role="option"]'))
        return
      e.preventDefault()
      onEnterKey({ skip: e.altKey })
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [enterFocused, onEnterKey])

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
  // La columna derecha subió de 400 a 420 px cuando la tabla de derivadas se mudó
  // a su dorso: con 400, las dos columnas de la tabla quedaban en ~185 px cada
  // una y ahí `n x^{n-1}` se aprieta. Llegó a 440 y volvió a bajar — con las
  // fracciones escritas en una línea la fórmula más larga pide bastante menos, y
  // veinte píxeles de más en el ranking solo estiran los nombres.
  const columns = "grid-cols-[minmax(0,1fr)_420px]"

  // Las dos pantallas que llevan botón e historial abajo, fuera del volteo. Las
  // de trámite —perfil, registro, cafecito— ocupan la columna entera y no llevan
  // ninguno de los dos.
  const pieDelPanel = panel === "intro" || panel === "exercise"

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
      {/* Estirado de 90%/792px: la columna izquierda está clavada por la
          FlipCard (min-h-[26rem]) más el CTA, así que todo el alto que se sume
          acá se lo lleva entero el ranking, que es lo que se quería alargar.
          El 94% deja igual una franja de fondo abajo, que es lo que apoya el
          bloque en la pantalla en vez de pegarlo al borde. */}
      {/* El alto del bloque es lo que reparte las dos columnas, así que se fija
          por el RANKING: nueve filas enteras piden 460 px (52 de paso menos el
          gap sobrante), y con el 94% de la ventana el scroller llega a 528. Se
          probó descontarle los 2,9rem que el historial dejó libres al pasar de
          cuatro novedades a tres, y el precio era que en una pantalla de menos
          de ~857 px la novena fila quedaba cortada.
          De la columna izquierda, ese aire se lo lleva entero la card del
          ejercicio: es la única pieza `flex-1` — el historial tiene alto fijo
          (97,5 px) y los botones también. */}
      <div className="mx-auto flex h-full max-h-[calc(min(94%,880px)_+_10px)] w-full max-w-[61.8rem] flex-col gap-3 px-6 pb-12 pt-5">
        <XpOrbs
          burst={burst}
          target={magnetTarget}
          area={orbArea}
          onArrive={onXpArrive}
          onCleared={onOrbsCleared}
        />

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
              <CafecitoButton
                placement="header_desktop"
                compact
                // Voltea la card del ejercicio y muestra la diapo del cafecito,
                // en vez de mandar directo a Cafecito. El ejercicio no se toca:
                // sigue en el estado y vuelve entero al salir.
                onOpen={() => {
                  setCafecito({ trigger: "pedido", correctToday: 0 })
                  setNavPanel("cafecito")
                }}
              />
            </div>
          </div>
          <div
            className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-2.5 text-sm"
            style={chromeStyle}
          >
            {/* Envueltos en su propia caja: el desenfoque de la intro agarra el
                @ y la tuerca, y el borde del panel queda afuera. */}
            <div
              className={`flex min-w-0 flex-1 items-center justify-between ${outOfFocus(
                enIntro(panel),
              )}`}
            >
              <span className="min-w-0 truncate">
                {player
                  ? player.is_guest
                    ? player.alias
                    : `@${player.alias}`
                  : "…"}
              </span>
              {/* La tuerca no abre una pantalla nueva: voltea el panel del
                ranking, que es la columna donde vive. Por eso es un interruptor
                — tocarla de nuevo vuelve al ranking. */}
              <button
                type="button"
                aria-label="Configuración"
                aria-pressed={settingsOpen}
                onClick={() => {
                  sfx.select()
                  if (settingsOpen) {
                    setSettingsOpen(false)
                    refetchPlayer()
                    if (!exercise) loadNext()
                    return
                  }
                  setSettingsOpen(true)
                }}
                className={`shrink-0 rounded-md p-1 transition-colors hover:bg-accent hover:text-foreground ${
                  settingsOpen
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                <Settings size={17} />
              </button>
            </div>
          </div>
        </header>

        {/* La configuración ya no se come la pantalla: es una cara más de la
            card del ejercicio (ver el SlideFlip de abajo). Por eso acá ya no hay
            dos capas que cruzarse — el ranking se queda donde está mientras se
            cambia el @ o la universidad, que es justo cuando conviene tenerlo a la
            vista. */}
        <div className="min-h-0 flex-1" style={chromeStyle}>
          <div className={`grid h-full min-h-0 gap-3 ${columns}`}>
            {/* `overflow-y-auto` es la válvula de escape para ventanas muy
                    bajas: en cualquier pantalla razonable nada scrollea.
                    `px-1 -mx-1` no es decorativo: en CSS no existe scrollear en
                    Y sin recortar en X, así que este contenedor recorta, y su
                    borde derecho caía en el MISMO píxel que el de la card
                    (medido: 858.391 los dos) — la línea de 1px quedaba justo
                    sobre el corte y no se dibujaba. El padding corre el recorte
                    4px hacia afuera y el margen negativo devuelve el layout a
                    donde estaba. */}
            <div
              className={`no-scrollbar -mx-1 flex min-h-0 flex-col gap-3 overflow-y-auto px-1 ${PANEL_MIN_H}`}
            >
              {/* Lo que gira es la CARD y nada más. El botón y el historial
                  quedan abajo, fuera del volteo, porque no son parte de lo que
                  se reemplaza: son el mismo botón y el mismo historial antes y
                  después. Girarlos también —que es lo que pasaba— hacía que
                  empezar a jugar se leyera como si la pantalla entera se diera
                  vuelta, cuando lo único que cambió fue el contenido de una caja.

                  El alto mínimo pasó de la caja que gira a la COLUMNA: la caja
                  ahora mide solo lo suyo (26rem) y el resto lo ponen el botón y
                  el historial, que ya no están adentro. */}
              <SlideFlip slide={panel} className="min-h-[26rem] flex-1">
                {panel === "intro" ? (
                  <IntroPanel />
                ) : panel === "profile" ? (
                  <div className="flex min-h-0 flex-1 flex-col rounded-lg border border-border bg-card p-5">
                    <ProfileSlides
                      onDone={() => {
                        refetchPlayer()
                        queryClient.invalidateQueries({
                          queryKey: gameKeys.leaderboard,
                        })
                        loadNext()
                      }}
                      onSkip={() => {
                        loadNext()
                      }}
                    />
                  </div>
                ) : panel === "cafecito" && cafecito ? (
                  <CafecitoPanel
                    keyboard
                    trigger={cafecito.trigger}
                    correctToday={cafecito.correctToday}
                    university={player?.university ?? null}
                    solved={solvedCount}
                    onPickUniversity={() => setSettingsOpen(true)}
                    onContinue={() => {
                      const volverA = cafecito.volverA
                      setCafecito(null)
                      // La diapo que abrió la persona interrumpió algo que sigue
                      // ahí y hay que devolvérselo; la que dispara un hito llega
                      // DESPUÉS de responder, y ahí sí toca pedir el siguiente.
                      if (cafecito.trigger !== "pedido") {
                        loadNext()
                        return
                      }
                      setNavPanel("exercise")
                      if (volverA === "settings") setSettingsOpen(true)
                      else if (!exercise) loadNext()
                    }}
                  />
                ) : panel === "register" && player ? (
                  <div className="flex min-h-0 flex-1 flex-col rounded-lg border border-border bg-card p-5">
                    <RegisterSlide
                      player={player}
                      onSkip={() => {
                        // Sin ejercicio pendiente hay que pedir uno; con uno ya
                        // servido alcanza con volver, y eso lo hace `loadNext`
                        // solo cuando responde, así que acá se vuelve a mano.
                        if (exercise) setNavPanel("exercise")
                        else loadNext()
                      }}
                    />
                  </div>
                ) : exercise ? (
                  <>
                    {/* El volteo se lleva la card Y el teclado, no solo la
                          card: la tabla tiene catorce renglones y en el alto de
                          la card sola entraban siete. Con los dos, el dorso
                          hereda card + teclado y entra completa. El botón de
                          abajo queda afuera a propósito — es lo único que sigue
                          sirviendo con la tabla a la vista. */}
                    {/* Alto fijado por la TABLA, que es la cara más alta:
                          medido, su contenido pide 473 px contra los 400 del
                          ejercicio. Antes la caja se estiraba a lo que sobrara
                          en la columna (546) y quedaban 147 px de nada abajo
                          del teclado. `min-h` y no `h`: si algún día un
                          enunciado largo pide más, crece. */}
                    {/* El cambio de ejercicio también es un volteo: al tocar
                          Continuar, la card entera —enunciado, campo y teclado—
                          gira y del otro lado está la derivada siguiente. Va
                          acá afuera y no adentro de la FlipCard porque son dos
                          giros distintos que nunca corren juntos: este cambia de
                          EJERCICIO y el de adentro cambia de CARA (la tabla).
                          El botón de abajo y el historial quedan fuera del giro:
                          no son parte del ejercicio. */}
                    <SlideFlip
                      slide={String(exercise.exercise_id)}
                      className="min-h-[26rem] flex-1"
                    >
                      {/* Sin FlipCard: la tabla de derivadas se mudó al dorso
                          del RANKING, así que esta card ya no tiene dos caras.
                          Lo único que la da vuelta ahora es el cambio de
                          ejercicio, que es el SlideFlip de acá arriba.

                          Enunciado y teclado van en UNA card, separados por una
                          línea: son un solo objeto —la derivada y con qué
                          escribirla— y dos cajas con su propio borde los hacían
                          leer como dos cosas que hay que mirar por separado.

                          La card toma `flex-1` y no `shrink-0`: todo el alto que
                          sobra en la caja se lo queda ella —y adentro se reparte
                          alrededor de la fórmula, que es lo que hay que mirar—,
                          así el teclado queda apoyado abajo con el mismo aire
                          que lo separa del campo. */}
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
                          <div
                            className={`flex flex-col gap-2 ${PANEL_CONTENT}`}
                          >
                            <AnswerField tone={tone} seq={answerSeq}>
                              <MathInput
                                handleRef={attachInput}
                                // La card se remonta con cada ejercicio, y
                                // el `focus()` del layout corre antes de que
                                // este campo exista.
                                autoFocus
                                tone={tone}
                                hint={tipFor({
                                  teclas,
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
                                  if (!closed && tonoLocal) setTonoLocal(null)
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
                          newKeys={exercise.new_keys}
                          numpad={false}
                          className={
                            closed
                              ? "pointer-events-none opacity-45"
                              : undefined
                          }
                        />
                      </div>
                    </SlideFlip>
                  </>
                ) : (
                  <ExerciseSkeleton />
                )}
              </SlideFlip>
              {/* El pie: mismo botón y mismo historial para la intro y para el
                  ejercicio, en el mismo lugar. Las pantallas de trámite —perfil,
                  registro, cafecito— no lo llevan, y ahí el volteo se queda con
                  la columna entera porque es `flex-1` y no tiene con quién
                  repartirla. */}
              {pieDelPanel && (
                <>
                  <div className="flex shrink-0 items-stretch gap-2">
                    {panel === "intro" ? (
                      <IntroStartButton
                        onStart={startFromIntro}
                        disabled={player === null || next.isPending}
                      />
                    ) : exercise ? (
                      <>
                        <AnswerButton
                          className="flex-1"
                          tone={tone}
                          seq={answerSeq}
                          closed={closed}
                          showKeyHint
                          disabled={
                            answerMutation.isPending ||
                            (closed && (next.isPending || breaking))
                          }
                          onClick={onPrimary}
                        />
                        {!closed && (
                          <SkipButton
                            showKeyHint
                            disabled={
                              skipMutation.isPending || answerMutation.isPending
                            }
                            onClick={onSkip}
                          />
                        )}
                      </>
                    ) : (
                      // Mientras carga la primera derivada. El botón no puede
                      // faltar: es lo que sostiene el alto de la columna.
                      <div
                        className="h-[var(--cta-h)] w-full animate-pulse rounded-md bg-foreground/10"
                        aria-hidden
                      />
                    )}
                  </div>
                  <EventFeed
                    enabled={player !== null}
                    className="h-[107.5px] shrink-0 py-1"
                    veiled={panel === "intro"}
                  />
                </>
              )}
            </div>

            <aside className="flex min-h-0 flex-col gap-3">
              {/* Esta columna tiene DOS dorsos y una sola cara: la
                      configuración y la tabla de derivadas. Los dos son cosas
                      que se consultan sin dejar de jugar, y las dos dejan el
                      ejercicio intacto del otro lado — que es exactamente por lo
                      que la tabla se mudó acá desde la card del ejercicio.
                      Nunca se piden a la vez (el gesto de Alt cierra la
                      configuración y viceversa), así que alcanza con elegir cuál
                      va atrás; la configuración manda si las dos estuvieran
                      abiertas. */}
              <FlipCard
                className="min-h-0 flex-1"
                flipped={settingsOpen || tableOpen}
                front={
                  <div className="flex min-h-0 flex-1 flex-col justify-center overflow-hidden rounded-lg border border-border bg-card p-3">
                    <GameRanking
                      climbFrom={climbFrom}
                      enabled={player !== null}
                      liveXp={liveXp}
                      counting={counting}
                      myUniversity={player?.university ?? null}
                      attachXpTarget={attachTarget}
                      centerKey={centerKey}
                      className={`flex-1 ${outOfFocus(enIntro(panel))}`}
                    />
                  </div>
                }
                back={
                  backKind === "settings" ? (
                    <div className="flex min-h-0 flex-1 flex-col rounded-lg border border-border bg-card p-4">
                      <SettingsPanel
                        variant="desktop"
                        player={player}
                        onClose={() => {
                          setSettingsOpen(false)
                          refetchPlayer()
                          // Por si se cerró sin ejercicio servido.
                          if (!exercise) loadNext()
                        }}
                        onReset={() => {
                          setSettingsOpen(false)
                          refetchPlayer()
                          // Reiniciar VENCE el ejercicio servido del lado del
                          // server, así que el que hay acá ya no existe para
                          // nadie: hay que soltarlo y pedir otro.
                          //
                          // Antes esto colgaba de `onClose` con un `if
                          // (!exercise)`, y esa guarda no se cumplía nunca —
                          // nadie limpiaba `exercise`—, así que después de
                          // reiniciar quedaba en pantalla una derivada que el
                          // server ya había vencido: Revisar y Saltear
                          // respondían 409 y no había forma de salir salvo
                          // recargando la página.
                          setExercise(null)
                          setLastAnswer(null)
                          setTonoLocal(null)
                          setClimbFrom(null)
                          setCafecito(null)
                          loadNext()
                        }}
                        onCafecito={() => {
                          // Cerrar la configuración y abrir la diapo es UN solo
                          // volteo: la card vuelve a su cara de adelante y del
                          // otro lado ya está el cafecito.
                          setSettingsOpen(false)
                          setCafecito({
                            trigger: "pedido",
                            correctToday: 0,
                            volverA: "settings",
                          })
                          setNavPanel("cafecito")
                        }}
                        onNeedsRegister={() => {
                          setSettingsOpen(false)
                          setNavPanel("register")
                        }}
                      />
                    </div>
                  ) : (
                    <div className="flex min-h-0 flex-1 flex-col rounded-lg border border-border bg-card p-3">
                      <DerivativesTable />
                    </div>
                  )
                }
              />
            </aside>
          </div>
        </div>
      </div>
    </div>
  )
}
