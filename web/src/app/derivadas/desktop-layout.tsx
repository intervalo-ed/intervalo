"use client"

// Versión de escritorio: todo en la misma vista, sin navegación. Dos columnas
// que arrancan desde la cabecera — a la izquierda la marca y el ejercicio, a la
// derecha la identidad y el ranking, que es el marcador del juego.
//
// La página NO scrollea: ocupa el alto de la ventana (con tope, para que en
// pantallas muy altas no se estire sin sentido) y deja más aire abajo que
// arriba. La lista del ranking scrollea adentro de su caja.
//
// El festejo de acertar termina en el ranking: la fórmula se rompe en orbes que
// salen volando hacia la XP de la fila propia, que se prende del azul-violeta de
// la marca y sube con cada llegada. Recién cuando entra el último se refresca el
// orden y la fila sube (ver xp-conteo.ts y components/orb-flight.tsx).

import { Fragment, useCallback, useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import posthog from "posthog-js"
import { useQueryClient } from "@tanstack/react-query"
import { ChevronLeft, Settings } from "lucide-react"
import { GRID_BG_STYLE } from "@/components/grid-bg"
import { PrivacidadContent } from "@/components/legal-content"
import { Button } from "@/components/ui/button"
import { XpDots } from "@/components/xp-dots"
import { ApiError } from "@/lib/api/client"
import { useSfx } from "@/lib/audio/useSfx"
import {
  CafecitoButton,
  ShareButton,
  markCafecitoShown,
  shouldShowCafecito,
  CAFECITO_EVERY,
  TECLA_CAFECITO,
  TECLA_RECLUTAS,
  type CafecitoTrigger,
} from "./cafecito-cta"
import { CafecitoPanel } from "./cafecito-panel"
import { ReclutasPanel, type ReclutasTrigger } from "./reclutas-panel"
import { marcarReclutasMostrado, tocaReclutar } from "./reclutas-trigger"
import { HITO_PERFIL, HITO_REGISTRO } from "./hitos-del-juego"
import {
  AnswerButton,
  AnswerField,
  CAMPO_H,
  CAMPO_MIN_H,
  ExerciseCard,
  KeyCap,
  PANEL_CONTENT,
  SkipButton,
  answerTone,
  type AnswerTone,
} from "./exercise-card"
import { PorQueButton, PorQuePanel, type PorQueGraph, TECLA_PORQUE } from "./porque-panel"
import { useExplainExercise } from "./UseGameExplain"
import {
  DerivativesStatsTable,
  DerivativesTable,
  FlipCard,
  TableButton,
} from "./derivatives-table"
import { ChatButton, ChatPanel, TECLA_CHAT } from "./chat-panel"
import { EloStatsPanel, StatsButton, TECLA_ESTADISTICAS } from "./elo-stats-panel"
import { GameIntroLogo, type GameIntro } from "./game-intro"
import { GameRanking, type RankingSort } from "./game-ranking"
import { AMBAR } from "./game-colors"
import { IntroPanel, IntroStartButton } from "./intro-panel"
import { SlideFlip } from "./slide-flip"
import { puedeVerEstadisticas } from "./stats-gate"
import { enCampoDeTexto, useTeclas } from "./teclas"
import { MathInput, tipFor, type MathInputHandle } from "./math-input"
import {
  CONTENT_WIDTH,
  GRID_COLS,
  LARGOS_DE_TIRA,
  MathKeyboard,
  STRIP_ROW,
  columnaDeTira,
} from "./math-keyboard"
import { Barra, Hueco } from "./skeleton-barra"
import { parseAnswerToMathJson, warmupComputeEngine } from "./parse-answer"
import { useLocalVerdict } from "./UseLocalVerdict"
import { EditCareerPanel, EditUniversityPanel } from "./edit-profile-field"
import { ProfileSlides, RegisterSlide } from "./register-slides"
import { UsernameSlide } from "./username-slide"
import { EventFeed } from "./event-feed"
import { outOfFocus } from "./out-of-focus"
import { useCta, useGameIdentity } from "./game-telemetry"
import { SettingsPanel } from "./settings-panel"
import {
  useAnswerExercise,
  useNextExercise,
  useSkipExercise,
  useEjercicioAdelantado,
  type GameAnswer,
  type GameExercise,
} from "./UseGameExercise"
import { useGamePulse, useMyBoost } from "./UseGameLeaderboard"
import { gameKeys, useGamePlayer, type GamePlayer } from "./UseGamePlayer"
import { useGameEvents } from "./UseGameLeaderboard"
import { useGameStats } from "./UseGameStats"
import { comboTrasIntento } from "./racha-estimate"
import { estimarXp } from "./xp-estimate"
import { useXpConteo } from "./xp-conteo"
import { OrbFlight } from "@/components/orb-flight"

// Las pantallas del panel izquierdo. Todas viven en la misma caja y se cambian
// con el mismo volteo (slide-flip.tsx).
type Panel =
  | "intro"
  | "username"
  | "exercise"
  | "profile"
  | "editCareer"
  | "editUniversity"
  | "register"
  | "cafecito"
  | "reclutas"

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
 * Las medidas no se eligen mirando: son las clases de las piezas reales, caja
 * por caja. La de afuera es la del `front` del FlipCard; adentro van las dos que
 * de verdad hay —`ExerciseCard bare` (`gap-3 px-4 pt-4`) y `MathKeyboard bare`
 * (`gap-1.5 px-4 pb-8 pt-4`)— y no un `p-5` que promediaba las dos.
 *
 * El teclado se dibujaba como una grilla de seis columnas con dieciocho teclas,
 * que no es lo que hay en escritorio: ahí `numpad` va en false y lo que se pinta
 * son DOS tiras centradas en diez columnas. El largo de cada tira y su centrado
 * salen de math-keyboard.tsx (`LARGOS_DE_TIRA`, `columnaDeTira`) para que no
 * puedan separarse del teclado de verdad.
 */
function ExerciseSkeleton() {
  return (
    <div
      className="flex min-h-[26rem] flex-1 animate-pulse flex-col overflow-hidden rounded-lg border border-border bg-card"
      aria-hidden
    >
      <div className="flex min-h-0 flex-1 flex-col gap-3 px-4 pt-4">
        {/* La pastilla del marcador: centrada y `w-fit`, como `Counters`. Los
            cuatro huecos van separados por la misma línea de 1 px. */}
        <span className="mx-auto flex w-fit shrink-0 items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 md:gap-3.5 md:px-4">
          {[0, 1, 2, 3].map((i) => (
            <Fragment key={i}>
              {i > 0 && <span className="h-3.5 w-px shrink-0 bg-border" />}
              <Hueco alto="h-5" className="w-9" barra="h-3.5 w-full" />
            </Fragment>
          ))}
        </span>
        {/* La caja de la fórmula es la que crece con lo que sobra. */}
        <div className="flex min-h-0 flex-1 items-center justify-center">
          <Barra className="h-9 w-48" />
        </div>
        <div className={cn(CAMPO_H, PANEL_CONTENT, "shrink-0 rounded-lg bg-foreground/[0.07]")} />
      </div>
      <div className="flex shrink-0 flex-col gap-1.5 px-4 pb-8 pt-4">
        {LARGOS_DE_TIRA.map((largo, f) => (
          <div
            key={f}
            className={cn("grid shrink-0 gap-1.5", CONTENT_WIDTH)}
            style={{
              height: STRIP_ROW,
              gridTemplateColumns: `repeat(${GRID_COLS}, minmax(0, 1fr))`,
            }}
          >
            {Array.from({ length: largo }).map((_, i) => (
              <Barra
                key={i}
                className="h-full rounded-md bg-foreground/[0.07]"
                style={{ gridColumnStart: columnaDeTira({ total: largo, indice: i }) }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export function DesktopLayout({ intro }: { intro: GameIntro }) {
  const { player, isFirstVisit, refetch: refetchPlayer } = useGamePlayer()
  const queryClient = useQueryClient()
  const next = useNextExercise()
  const answerMutation = useAnswerExercise()
  const skipMutation = useSkipExercise()
  const {
    adelantar,
    consumir: consumirAdelanto,
    servido: adelantoServido,
    descartar: descartarAdelanto,
    esperando: esperandoAdelanto,
  } = useEjercicioAdelantado()
  const sfx = useSfx()
  const teclas = useTeclas()
  // Para los atajos `w` y `c`: los botones registran su propio click, y llegar
  // por la tecla tiene que contar igual.
  const cta = useCta()

  const [exercise, setExercise] = useState<GameExercise | null>(null)
  const [lastAnswer, setLastAnswer] = useState<GameAnswer | null>(null)
  // El color adelantado por el veredicto local, mientras la respuesta del
  // servidor viaja. Se descarta apenas llega la de verdad (ver `tone`).
  const [tonoLocal, setTonoLocal] = useState<AnswerTone>(null)
  // Si el color y el sonido de ESTA respuesta ya salieron por el veredicto
  // local, para que la llegada del servidor no los repita.
  const anticipadoRef = useRef(false)
  // Si el festejo grande (bolitas/conteo) YA arrancó por el veredicto local.
  // No es lo mismo que `anticipadoRef`: ese es true también cuando el
  // veredicto local decidió "incorrecto" (ahí no hay festejo que adelantar).
  // Sin esta distinción, un desacuerdo donde el local dijo "mal" y el
  // servidor dice "bien" se quedaría sin festejo: `anticipadoRef.current`
  // ya sería true por el color, y el festejo de respaldo no arrancaría nunca.
  const festejoAdelantadoRef = useRef(false)
  // Igual que `festejoAdelantadoRef` pero para los contadores de la card
  // (racha/intentos) en vez del festejo de XP: true si ya se escribió un
  // adelanto en el caché del jugador que todavía no confirmó (o deshizo) la
  // respuesta real.
  const rachaAdelantadaRef = useRef(false)
  // Lo que había ANTES de adelantar, por si hay que devolverlo.
  const rachaPrevioRef = useRef<{ combo: number; exercises_attempted: number } | null>(null)
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
  // Lo mismo para la diapo de reclutar. No lleva número que mostrar: la lista de
  // reclutas la muestra el ranking de al lado.
  const [reclutas, setReclutas] = useState<{
    trigger: ReclutasTrigger
    volverA?: "settings"
  } | null>(null)
  // Lo que la diapo del café va anunciando mientras se mueve el slider —el
  // multiplicador y el color de la barra en ese instante—, para que el ranking
  // de al lado se filtre a la universidad propia y muestre lo mismo en cada
  // fila. `CafecitoPanel` lo apaga solo (`null`) al cerrarse o al llegar al
  // cartel de vuelta, así que acá no hace falta limpiarlo a mano.
  const [cafecitoPreview, setCafecitoPreview] = useState<{
    multiplier: number
    color: string
  } | null>(null)
  // Se agenda al responder y se despacha en el Continuar, igual que el café: la
  // diapo tiene que entrar con el mismo volteo con el que entraría la derivada
  // siguiente, y no al costado mientras todavía se mira el resultado.
  const reclutasPendienteRef = useRef(false)
  // La tabla está a la vista ahora mismo.
  const [tableOpen, setTableOpen] = useState(false)
  // Las estadísticas personales están a la vista (tecla `j`, ver el efecto de
  // teclado más abajo). Un booleano más y no un tercer valor adentro de
  // `tableOpen`: gobierna un FlipCard DISTINTO —el de la card del ejercicio,
  // no el del aside— así que tiene que poder valer `true` con `tableOpen` en
  // `false` y viceversa.
  const [statsOpen, setStatsOpen] = useState(false)
  // El «¿Por qué?» está a la vista: el OTRO dorso de la card del ejercicio, el
  // que comparte con las estadísticas. Nunca los dos a la vez —abrir uno cierra
  // el otro— pero cada uno tiene su booleano porque se abren por caminos
  // distintos y ninguno es un modo del otro.
  const [porqueOpen, setPorqueOpen] = useState(false)
  // Cuál de los dos dorsos de la card del ejercicio se está mostrando. Mismo
  // motivo que `backKind` en el aside: al cerrar uno, su booleano pasa a false
  // en el mismo instante en que arranca el giro, y sin recordar cuál era, lo que
  // se vería girar es la otra cara.
  const [caraDelEjercicio, setCaraDelEjercicio] = useState<"stats" | "porque">("stats")
  const dorsoEjercicio = porqueOpen ? "porque" : statsOpen ? "stats" : null
  if (dorsoEjercicio !== null && dorsoEjercicio !== caraDelEjercicio) {
    setCaraDelEjercicio(dorsoEjercicio)
  }
  // La derivada que la persona escribió, cuando estuvo bien. Se guarda al
  // responder porque el campo se limpia enseguida y la caja del enunciado la
  // necesita para mostrarla en lugar del problema.
  const [solvedLatex, setSolvedLatex] = useState<string | null>(null)
  // Este ejercicio ya se erró al menos una vez. No se puede leer de `lastAnswer`:
  // ese se borra en cuanto la persona empieza a corregir (ver el `onChange` del
  // campo), y el ¿Por qué? tiene que seguir estando mientras escribe.
  const [fallado, setFallado] = useState(false)
  const explainMutation = useExplainExercise()
  const [porqueTexto, setPorqueTexto] = useState<string | null>(null)
  // El gráfico de cierre (f y f' juntas): antes solo lo guardaba el
  // teléfono (mobile-flow.tsx :: porqueGraph). Va aparte de `porqueTexto`
  // por el mismo motivo que allá: son dos piezas de la misma respuesta con
  // ciclos de vida propios.
  const [porqueGraph, setPorqueGraph] = useState<PorQueGraph | null>(null)
  // Cuál de las TRES caras traseras del aside es la que se está mostrando. Se
  // actualiza solo al ABRIR una, nunca al cerrar.
  //
  // Antes salía de `settingsOpen ? configuración : tabla`, y ahí estaba el bug:
  // al cerrar la configuración, `settingsOpen` pasaba a false en el mismo
  // instante en que arrancaba el giro, así que el dorso se convertía en la tabla
  // de derivadas ANTES de empezar a moverse y lo que se veía darse vuelta era
  // una tabla que nadie había pedido. Recordando la última abierta, el dorso se
  // queda quieto mientras la card gira y lo que se va es lo que estaba.
  const [backKind, setBackKind] = useState<
    "settings" | "chat" | "table" | "stats" | "privacy"
  >("table")
  // La configuración está a la vista: es el dorso del RANKING, no del ejercicio,
  // así que no es una de las pantallas de `panel` — las dos columnas se voltean
  // por separado y pueden estar dadas vuelta a la vez.
  const [settingsOpen, setSettingsOpen] = useState(false)
  // Por qué ordena el ranking —y qué número muestra cada fila—: la experiencia
  // o el Elo. Vale para las dos vistas, la individual y la universitaria. Vive
  // acá y no adentro de GameRanking porque el selector que lo cambia está en
  // esta cabecera, al lado de la tuerca — ver game-ranking.tsx :: RankingSort.
  const [rankingSort, setRankingSort] = useState<RankingSort>("experiencia")
  // El chat está a la vista: la cuarta cara trasera del aside, y la única que se
  // abre y se cierra con la MISMA tecla (`m`). Las otras tres son o un gesto
  // sostenido o un botón.
  const [chatOpen, setChatOpen] = useState(false)
  // El dorso de "¿Qué pasa con mis datos?", que se abre desde la slide de
  // registro. Es el quinto y el más nuevo: el menos frecuente de los cinco.
  const [privacyOpen, setPrivacyOpen] = useState(false)
  // Si a `panel === "register"` se llegó tocando "Usuario" en Configuración
  // (invitado sin cuenta) y no por el hito de la mitad del juego. Los dos
  // comparten pantalla, pero no layout: la de configuración es un trámite
  // corto —la persona ya sabe quién es— así que su caja mide lo mismo que la
  // del ejercicio (mismo mecanismo que cafecito/reclutas, ver `slotSalida` más
  // abajo) y no repite "sos fulano, puesto tanto" ni un "Ahora no" de sobra.
  const [registroDesdeConfig, setRegistroDesdeConfig] = useState(false)
  // El punto del botón: cuántos mensajes entraron desde la última vez que se
  // miró el chat.
  //
  // Se lee con el MISMO hook que el historial de novedades. No es un pedido más:
  // react-query deduplica por clave, así que esto se cuelga de la consulta que la
  // franja de al lado ya tiene abierta y no agrega ni un request — que es toda la
  // idea del chat.
  //
  // El id visto se ajusta durante el render y no en un efecto, como el badge de
  // novedades del teléfono: es estado derivado de otro estado, y hacerlo en un
  // efecto significaría pintar un frame con el punto todavía puesto.
  const historialChat = useGameEvents(player !== null)
  const ultimoMensajeId = historialChat.data?.cursorMessages ?? 0
  const [chatVisto, setChatVisto] = useState(0)
  if (chatOpen && chatVisto !== ultimoMensajeId) setChatVisto(ultimoMensajeId)
  const mensajesSinLeer = (historialChat.data?.messages ?? []).filter(
    (m) => m.id > chatVisto,
  ).length
  // Prioridad settings > chat > table > stats > privacy: la misma que ya regía
  // entre settings y table ("la configuración manda si las dos estuvieran
  // abiertas"), extendida a los otros tres dorsos — privacy último, por ser el
  // más nuevo y el menos frecuente. En la práctica los listeners se ocupan de
  // que no haya dos en `true` a la vez.
  const abierto = settingsOpen
    ? "settings"
    : chatOpen
      ? "chat"
      : tableOpen
        ? "table"
        : statsOpen
          ? "stats"
          : privacyOpen
            ? "privacy"
            : null
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
  // Ref de CALLBACK y no el objeto pelado: durante un cambio de PANEL las dos
  // caras conviven un rato (slide-flip.tsx), y la que se va publica `null` al
  // desmontarse, lo que puede caer DESPUÉS de que la que llega ya publicó su
  // campo. Ignorar el null es lo que evita que el juego se quede sin dónde
  // escribir. El handle que queda colgado es inofensivo: sus métodos leen un
  // campo que ya no existe y no hacen nada.
  //
  // Entre una derivada y la siguiente esto ya no pasa: la card se queda puesta y
  // no hay dos campos montados a la vez.
  const attachInput = useCallback((handle: MathInputHandle | null) => {
    if (handle) inputRef.current = handle
  }, [])
  const servedAtRef = useRef<number>(0)
  // Puesto anterior, guardado hasta que termina el conteo de XP.
  const pendingClimbRef = useRef<number | null>(null)
  // Cuántas veces se intentó ESTE ejercicio. Lo necesita el festejo optimista
  // para estimar la XP (ver xp-estimate.ts) antes de que el servidor conteste
  // con el `attempt_number` real.
  const attemptRef = useRef(0)
  // Si el intento que se está mostrando fue el PRIMERO de este ejercicio —en
  // estado, no en un ref, porque decide si el botón destella y eso es
  // render—. Se fija junto con `tonoLocal` en `onRevisar`, así que llega en
  // el mismo instante que el resto del veredicto optimista.
  const [primerIntento, setPrimerIntento] = useState(true)

  // Cuando entra el último orbe: recién ahí el ranking estrena orden y la fila
  // propia sube. Antes de eso sigue mostrando el puesto viejo.
  const onBurstComplete = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: gameKeys.leaderboard })
    setClimbFrom(pendingClimbRef.current)
    pendingClimbRef.current = null
  }, [queryClient])

  const {
    liveXp,
    counting,
    xpColor,
    fireProvisional: fireXpProvisional,
    reconcile: reconcileXp,
    abort: abortXp,
    vuelo,
    paso: onOrbeLlega,
    attachPrompt,
    attachTarget,
    magnetTarget,
  } = useXpConteo({ onComplete: onBurstComplete })

  // Late cada 10 s y refresca el ranking solo si alguien respondió algo. Se
  // pausa mientras vuelan los orbes: ahí el orden viejo tiene que quedarse
  // quieto.
  useGamePulse({ enabled: player !== null, paused: counting })

  // El empuje de la universidad sale del mismo pulso, sin pedido propio.
  const boost = useMyBoost(player?.university)

  // A partir de la derivada 10 (game/stats.py :: UMBRAL_ESTADISTICAS, mismo
  // número que el server). El pedido en sí es perezoso —`enabled: statsOpen`—
  // así que cruzar el umbral no dispara ningún pedido hasta que se toca `p`.
  const estadisticasDisponibles = puedeVerEstadisticas(player)
  const statsQuery = useGameStats(statsOpen)

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

  // Poner en pantalla un ejercicio que ya llegó. Se separó de `loadNext` porque
  // ahora hay dos formas de conseguirlo —el pedido de siempre y el adelantado—
  // y las dos tienen que dejar la pantalla exactamente igual.
  //
  // El reloj y la telemetría de "servido" viven ACÁ y no en el adelanto: si se
  // sellaran al pedirlo, el `response_ms` de cada respuesta se comería los
  // segundos del festejo y dejaría de ser comparable con game_attempts, que mide
  // lo mismo del otro lado.
  const servir = useCallback(
    (data: GameExercise, { adelantado }: { adelantado: boolean }) => {
      setExercise(data)
      // El panel vuelve al ejercicio ACÁ y no en quien pidió el ejercicio, que
      // es donde estaba. Cambiarlo antes producía DOS transiciones por un solo
      // gesto: el panel cambiaba enseguida y del otro lado aparecía la card con
      // el ejercicio VIEJO —que sigue en el estado hasta que llega el nuevo—, y
      // cuando la respuesta llegaba unos cientos de milisegundos después
      // cambiaba otra vez. Así es una sola, y del otro lado ya está todo listo.
      // Es exactamente lo que hace el teléfono (mobile-flow.tsx :: loadNext),
      // que por eso nunca tuvo este problema.
      setNavPanel("exercise")
      setLastAnswer(null)
      setTonoLocal(null)
      setClimbFrom(null)
      setCafecito(null)
      // Ejercicio nuevo, cuenta limpia: la consulta anterior no lo penaliza.
      peekedRef.current = false
      setTableOpen(false)
      setStatsOpen(false)
      // El ¿Por qué? es de la derivada que se acaba de dejar atrás.
      setPorqueOpen(false)
      setPorqueTexto(null)
      setPorqueGraph(null)
      setSolvedLatex(null)
      setFallado(false)
      servedAtRef.current = Date.now()
      attemptRef.current = 0
      setPrimerIntento(true)
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
        // Sin esto no hay forma de saber en PostHog si el adelanto sirvió, ni
        // de probar que no infló el `response_ms`: son dos distribuciones que
        // se comparan cortando por acá.
        adelantado,
      })
      adelantoServido()
    },
    [adelantoServido],
  )

  // `fresco` fuerza el pedido normal y saltea lo adelantado. Lo usan los caminos
  // en los que el servidor movió el piso —un 409, un reinicio— donde lo que haya
  // en la caja ya no vale.
  const loadNext = useCallback(
    ({ fresco = false }: { fresco?: boolean } = {}) => {
      const adelantado = fresco ? null : consumirAdelanto()
      if (adelantado === null) {
        next.mutate(undefined, { onSuccess: (data) => servir(data, { adelantado: false }) })
        return
      }
      void adelantado
        .then((data) => servir(data, { adelantado: true }))
        // El adelanto falló después de haberlo tomado: se pide de nuevo, que es
        // lo que habría pasado sin todo esto.
        .catch(() => {
          next.mutate(undefined, { onSuccess: (data) => servir(data, { adelantado: false }) })
        })
    },
    [next, consumirAdelanto, servir],
  )

  // Empezar de verdad: entra la primera derivada. Es lo que hace el botón y
  // también el Enter.
  const startFromIntro = useCallback(() => {
    posthog.capture("game_intro_done", { platform: "desktop" })
    sfx.continue()
    if (player?.is_guest && player.alias_is_generated && isFirstVisit) {
      setNavPanel("username")
      return
    }
    loadNext()
  }, [loadNext, sfx, player, isFirstVisit])

  // La pantalla efectiva: lo último que se eligió a mano y, si no se eligió
  // nada, la intro. Siempre la intro: ya no se recuerda en localStorage si se
  // vio (ver la cabecera de intro-panel.tsx), así que el HTML del servidor y el
  // primer render del cliente dicen lo mismo y no hay nada que reconciliar.
  //
  // Como consecuencia, la primera derivada la pide SIEMPRE el botón: no queda
  // ningún camino en el que la partida arranque sola.
  const panel: Panel = navPanel ?? "intro"

  // Los dos dorsos de la card del ejercicio son DEL EJERCICIO: si la columna
  // pasó a mostrar otra cosa —el cafecito, reclutar, el perfil, el registro—
  // tienen que quedar cerrados.
  //
  // Sin esto quedaban abiertos por debajo de la diapo, y eso rompía el Enter en
  // la diapo: el Enter global mira `porqueOpen` ANTES de mirar `panel`, así que
  // el primero se gastaba cerrando algo que no estaba en pantalla en vez de
  // llegar al "Ahora no". Con las estadísticas era peor —ahí el Enter no se
  // gasta, se bloquea— y no se destrababa nunca.
  //
  // Y de paso arregla lo otro que el guard de teclado de `w`/`i` ya evitaba por
  // el lado de la tecla pero no por el del botón: al volver de la diapo, la card
  // reaparecía volteada a algo que nadie había vuelto a pedir.
  //
  // Ajuste DURANTE el render y no en un efecto, que es el patrón que este
  // archivo ya usa para `backKind` y `caraDelEjercicio`.
  if (panel !== "exercise") {
    if (porqueOpen) setPorqueOpen(false)
    if (statsOpen) setStatsOpen(false)
  }

  // Deshace el adelanto de racha/intentos si el servidor termina en
  // desacuerdo (o si el camino que lo pisaría con el dato real ni corre,
  // como el 409 o `!parse_ok`). Se define acá y no adentro de cada callback
  // porque `onRevisar` y `onSkip` la usan igual.
  const revertirRacha = useCallback(() => {
    if (!rachaAdelantadaRef.current || !rachaPrevioRef.current) return
    const previoReal = rachaPrevioRef.current
    queryClient.setQueryData(gameKeys.me, (p: GamePlayer | undefined) =>
      p === undefined ? p : { ...p, ...previoReal },
    )
    rachaAdelantadaRef.current = false
  }, [queryClient])

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
    attemptRef.current += 1
    const local = evaluarLocal(mathjson)
    anticipadoRef.current = local !== null
    if (local !== null) {
      setTonoLocal(local ? "correct" : "wrong")
      setPrimerIntento(attemptRef.current === 1)
      setAnswerSeq((n) => n + 1)
      if (local) sfx.correct()
      else sfx.wrong()
    }
    festejoAdelantadoRef.current = local === true
    // Racha e intentos también se adelantan acá, junto al color: solo se
    // mueven en el PRIMER intento del ejercicio (game/router.py::_aplicar_elo
    // corta antes en cualquier otro) y con cualquier veredicto CONFIDENTE
    // —a diferencia del festejo, acá importa tanto el correcto (racha+1) como
    // el incorrecto (racha a 0), porque los dos mueven el número.
    if (attemptRef.current === 1 && local !== null) {
      const previo = queryClient.getQueryData<GamePlayer>(gameKeys.me)
      if (previo !== undefined) {
        rachaPrevioRef.current = {
          combo: previo.combo,
          exercises_attempted: previo.exercises_attempted,
        }
        rachaAdelantadaRef.current = true
        queryClient.setQueryData(gameKeys.me, {
          ...previo,
          combo: comboTrasIntento({ correct: local, comboAntes: exercise.combo }),
          exercises_attempted: previo.exercises_attempted + 1,
        })
      }
    }
    if (local) {
      // El festejo grande arranca ACÁ, en el mismo instante que el color, en
      // vez de esperar a `/answer`: es la misma idea que el veredicto local ya
      // aplica al color, extendida al festejo. La XP es una ESTIMACIÓN
      // (xp-estimate.ts, espejo de game/xp.py) — `reconcile` la ajusta sola
      // cuando llega la real, y si el servidor termina en desacuerdo (rarísimo,
      // ver local-verdict.ts), `abortXp` la desarma en el `onSuccess`/`onError`
      // de más abajo.
      //
      // `setCenterKey`/`setRankingSort` también se adelantan acá: no dependen
      // de nada que traiga la respuesta, y los orbes necesitan que el ranking
      // ya esté mostrando la fila propia en experiencia para tener destino.
      setCenterKey((n) => n + 1)
      setRankingSort("experiencia")
      fireXpProvisional(
        estimarXp({
          attemptNumber: attemptRef.current,
          pHat: exercise.p_hat,
          comboAfter: attemptRef.current === 1 && !peekedRef.current ? exercise.combo + 1 : 0,
          peeked: peekedRef.current,
        }),
        { modo: "vuelo", intento: attemptRef.current, multiplicador: boost?.multiplier ?? 1 },
      )
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
          // El `onSuccess` PROPIO de `useAnswerExercise` (UseGameExercise.ts)
          // ya corrió antes que este y ya escribió el combo/intentos REALES
          // en el caché con `data.parse_ok` en true —React Query llama primero
          // el `onSuccess` del hook, después el de esta llamada—, así que acá
          // no hace falta corregir nada a mano: solo dar por cerrado el
          // adelanto, sea porque ya no hace falta o porque nunca se aplicó.
          rachaAdelantadaRef.current = false
          // Lo que se escribió pasa a la caja del enunciado si estuvo bien, y
          // marca al ejercicio como errado si no. Las dos cosas sobreviven a que
          // `lastAnswer` se borre en cuanto la persona toque una tecla.
          if (data.parse_ok && data.correct) setSolvedLatex(latex)
          if (data.parse_ok && !data.correct) setFallado(true)
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
          if (!data.parse_ok) {
            // El veredicto local dijo "puedo decidir" y el servidor ni pudo
            // evaluar la respuesta: si ya había arrancado un festejo optimista,
            // no queda otra que desarmarlo.
            if (festejoAdelantadoRef.current) abortXp()
            // Único camino donde el `onSuccess` del hook NO tocó el caché
            // (corta antes si `!parse_ok`): acá sí hay que devolver la racha
            // a mano, porque el servidor no contó esto como un intento real.
            revertirRacha()
            return
          }
          if (!data.correct) {
            if (!anticipadoRef.current) sfx.wrong()
            // Desacuerdo rarísimo: el local dijo correcto, el servidor dijo que
            // no. Se desarma el festejo que ya había arrancado (ver
            // local-verdict.ts sobre qué tan improbable es esto).
            if (festejoAdelantadoRef.current) abortXp()
            return
          }
          if (!anticipadoRef.current) sfx.correct()
          // Acá y en ningún otro lado: acertar es lo único que cierra un
          // ejercicio, así que este es el primer instante en que pedir el
          // siguiente devuelve uno nuevo. Mientras corre el festejo, va y vuelve.
          adelantar()
          const rankBefore = data.rank_before ?? null
          const rankAfter = data.rank_after ?? null
          pendingClimbRef.current =
            rankBefore !== null && rankAfter !== null && rankAfter < rankBefore
              ? rankBefore
              : null
          // La XP real llegó: ajusta en silencio el conteo que el veredicto
          // local ya arrancó. Si no se pudo adelantar —local dijo "mal" o no
          // se pudo decidir— todavía no hay ningún festejo corriendo, así que
          // se arranca acá directo con el dato real antes de reconciliar.
          if (!festejoAdelantadoRef.current) {
            setCenterKey((n) => n + 1)
            setRankingSort("experiencia")
            fireXpProvisional(data.xp_awarded, {
              modo: "vuelo",
              intento: data.attempt_number,
              multiplicador: data.xp_multiplier,
            })
          }
          reconcileXp(data)

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
          // Piso de CAFECITO_EVERY para los tres tipos, no solo para "milestone"
          // (que ya lo tenía gratis, por el módulo): "récord" y "big_climb" no
          // tenían ninguno, y un invitado nuevo bate su propio récord —no tiene
          // casi historia— o pasa a varias cuentas en cero —el ranking está
          // lleno de ellas— en casi cualquiera de sus primeras derivadas. Antes
          // de esta cantidad ninguno de los tres cuenta como para interrumpir.
          const trigger: CafecitoTrigger | null =
            totalCorrectas < CAFECITO_EVERY
              ? null
              : data.is_record
                ? "record"
                : delta >= 3
                  ? "big_climb"
                  : totalCorrectas % CAFECITO_EVERY === 0
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
          // Mientras falte preguntarla, el café se queda callado y NO gasta su
          // cooldown (no se llama a `markCafecitoShown`): no se mostró, así que
          // vuelve a estar disponible en su próximo hito natural, ya con
          // universidad que nombrar.
          //
          // La pregunta de perfil NUNCA se adelanta —antes se adelantaba
          // apenas el café quería salir, pero eso la disparaba en el PRIMER
          // acierto casi siempre: alcanza con pasar a un solo jugador con más
          // XP en cero (`delta >= 3`, "big_climb") para que un invitado nuevo
          // dispare esta condición en su primera derivada, mucho antes de
          // `HITO_PERFIL`. Sale justo en `HITO_PERFIL` y en ningún otro
          // momento, sea cual sea el motivo que tenga el café para querer
          // salir ese mismo acierto.
          if (tocaCafecito && !faltaPreguntarUniversidad) {
            markCafecitoShown(totalCorrectas)
            setCafecito({ trigger, correctToday: data.correct_today })
          } else if (tocaReclutar(totalCorrectas)) {
            // `else if` y no una condición aparte: las dos diapos ocupan el
            // mismo turno —el que se abre al tocar Continuar— y agendar las dos
            // haría que la segunda se pierda sin que nadie la vea. El cooldown
            // que comparten hace que en la práctica nunca coincidan, pero el
            // `else` es lo que lo vuelve imposible en vez de improbable.
            marcarReclutasMostrado(totalCorrectas)
            reclutasPendienteRef.current = true
          }
          if (faltaPreguntarUniversidad && solved >= HITO_PERFIL) {
            askedProfileRef.current = true
            pendingMilestoneRef.current = "profile"
          } else if (
            solved >= HITO_REGISTRO &&
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
            // Si el veredicto local había arrancado el festejo, este ejercicio
            // ya no existe para desarmarlo con datos reales: se desarma solo.
            if (festejoAdelantadoRef.current) abortXp()
            revertirRacha()
            // El 409 dice que el servidor venció lo que teníamos servido, así
            // que un ejercicio adelantado contra ese estado ya no vale.
            descartarAdelanto()
            loadNext({ fresco: true })
          }
        },
      },
    )
  }, [
    exercise,
    answerMutation,
    sfx,
    solvedCount,
    player,
    boost,
    fireXpProvisional,
    reconcileXp,
    abortXp,
    queryClient,
    revertirRacha,
    evaluarLocal,
    loadNext,
    adelantar,
    descartarAdelanto,
  ])

  // El botón existe cuando ya hay algo para explicar: se acertó, o se erró al
  // menos una vez. Nunca antes del primer intento — ahí sería regalar la
  // respuesta, y el servidor lo rechaza igual (409 en POST /explain).
  const hayPorque = solvedLatex !== null || fallado

  const abrirPorque = useCallback(() => {
    if (!exercise) return
    sfx.select()
    setStatsOpen(false) // exclusión con el otro dorso de esta card
    setPorqueOpen(true)
    posthog.capture("game_porque_open", {
      exercise_id: exercise.exercise_id,
      tier: exercise.tier,
      stars: exercise.difficulty_stars,
      // Lo que hay que poder contestar después: si lo abre quien ya resolvió
      // —curiosidad— o quien está trabado —ayuda—, porque no son la misma
      // persona ni la misma función del botón.
      was_correct: solvedLatex !== null,
    })
    // Una sola vez por ejercicio: el texto no cambia, y volver a pedirlo sería
    // otro viaje para recibir lo mismo.
    if (porqueTexto !== null || explainMutation.isPending) return
    explainMutation.mutate(
      { exercise_id: exercise.exercise_id },
      {
        onSuccess: (data) => {
          setPorqueTexto(data.explanation)
          setPorqueGraph({
            fn: data.graph_fn,
            fn2: data.graph_fn2,
            fnLatex: data.graph_fn_latex,
            fn2Latex: data.graph_fn2_latex,
            view: data.graph_view as PorQueGraph["view"],
          })
        },
      },
    )
  }, [exercise, explainMutation, porqueTexto, sfx, solvedLatex])

  const cerrarPorque = useCallback(() => {
    sfx.select()
    setPorqueOpen(false)
  }, [sfx])

  const closed =
    lastAnswer?.parse_ok === true &&
    (lastAnswer.correct || lastAnswer.attempts_left === 0)
  // La respuesta del servidor manda; el tono local solo cubre el hueco entre el
  // toque y su llegada.
  const tone = answerTone(lastAnswer) ?? tonoLocal
  // Solo para lo VISUAL (qué botones se ven, si el teclado se apaga): se
  // cierra apenas el veredicto local dice "correcto", sin esperar la
  // respuesta real. Sin esto, entre el toque y que vuelva `/answer` había un
  // instante con `closed` todavía en `false` —Revisar, «¿Por qué?» y Saltear
  // los tres a la vista, en verde— que un momento después colapsaba de golpe a
  // Continuar solo: dos layouts distintos por un rato, mientras la red viaja.
  //
  // Lo que hace un click o Enter sigue esperando la respuesta real (`closed`,
  // sin sufijo): el botón está deshabilitado todo ese instante de cualquier
  // forma (`answerMutation.isPending`), así que no hay riesgo de avanzar
  // antes de que el servidor confirme.
  const cerradoVisual = closed || tonoLocal === "correct"

  // Lo que hace el botón grande. Vive suelto porque lo comparten el click y el
  // Enter, y tienen que hacer exactamente lo mismo.
  const onPrimary = useCallback(() => {
    if (!closed) {
      void onRevisar()
      return
    }
    // Acá había un guardia que no dejaba seguir mientras el festejo estuviera en
    // curso. Hacía falta con la mesa de billar, donde las bolas se quedaban
    // rodando ADENTRO de la card del ejercicio: cambiar de ejercicio con la mesa
    // en juego se llevaba puesta la animación. Los orbes de ahora no viven en la
    // card —salen de ella en el primer frame y cruzan por encima de todo, en una
    // capa `fixed`— así que la derivada siguiente puede entrar debajo de ellos
    // sin molestar a nadie. Enter no se bloquea nunca más.
    const milestone = pendingMilestoneRef.current
    if (milestone) {
      pendingMilestoneRef.current = null
      posthog.capture("game_register_slide_shown", {
        slide: milestone === "profile" ? "career" : "register",
      })
      // Por si quedó en `true` de una visita anterior a Configuración: este es
      // el hito, no ese camino, y su registro es el de columna entera.
      if (milestone === "register") setRegistroDesdeConfig(false)
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
    // Reclutar entra por el mismo lugar y por el mismo motivo.
    if (reclutasPendienteRef.current) {
      reclutasPendienteRef.current = false
      setReclutas({ trigger: "hito" })
      setNavPanel("reclutas")
      return
    }
    loadNext()
  }, [closed, onRevisar, loadNext, cafecito])

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
    // Determinístico y sin desacuerdo posible salvo el 409 de abajo:
    // skip_exercise siempre pone el combo en 0 si el ejercicio seguía sin
    // responder (game/router.py:688). `exercises_attempted` NO se toca acá:
    // saltear no es responder.
    const previoRacha = queryClient.getQueryData<GamePlayer>(gameKeys.me)
    if (previoRacha !== undefined) {
      rachaPrevioRef.current = {
        combo: previoRacha.combo,
        exercises_attempted: previoRacha.exercises_attempted,
      }
      rachaAdelantadaRef.current = true
      queryClient.setQueryData(gameKeys.me, { ...previoRacha, combo: 0 })
    }
    skipMutation.mutate(
      { exercise_id: exercise.exercise_id },
      {
        onSuccess: (data) => {
          // El endpoint devuelve el reemplazo, así que no hay un /next detrás:
          // el ejercicio nuevo entra en el mismo viaje. El combo real ya viene
          // en `data.combo` (y `useSkipExercise` invalida `gameKeys.me`), así
          // que no hace falta reconciliar nada: solo cerrar el adelanto.
          rachaAdelantadaRef.current = false
          setExercise(data)
          setLastAnswer(null)
          // También el tono local, no solo el del servidor. Si `/answer` falló
          // con algo que no fuera un 409 —una caída de red, un 500—, su
          // `onSuccess` nunca corrió y `tonoLocal` quedó con el color del
          // intento anterior; como `tone` es `answerTone(lastAnswer) ?? tonoLocal`,
          // ese color sobrevivía al salteo y teñía la derivada nueva. El teléfono
          // ya lo limpiaba (mobile-flow.tsx :: onSkip).
          setTonoLocal(null)
          setCafecito(null)
          peekedRef.current = false
          setTableOpen(false)
          setStatsOpen(false)
          setPorqueOpen(false)
          setPorqueTexto(null)
          setPorqueGraph(null)
          setSolvedLatex(null)
          setFallado(false)
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
            revertirRacha()
            // El 409 dice que el servidor venció lo que teníamos servido, así
            // que un ejercicio adelantado contra ese estado ya no vale.
            descartarAdelanto()
            loadNext({ fresco: true })
          }
        },
      },
    )
  }, [
    exercise,
    closed,
    skipMutation,
    answerMutation.isPending,
    solvedCount,
    queryClient,
    revertirRacha,
    loadNext,
    descartarAdelanto,
  ])

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
  // Mismo espejo, para las tres guardas de más abajo (Alt, `w`/`i`) que
  // tienen que ignorar sus gestos mientras las estadísticas están a la vista
  // — ver el comentario largo donde se usa.
  const statsOpenRef = useRef(false)
  useEffect(() => {
    statsOpenRef.current = statsOpen
  })
  // Y lo mismo para el ¿Por qué?, que voltea la MISMA card y por lo tanto tiene
  // que apagar los mismos gestos: con el ejercicio del otro lado, ni Alt ni
  // `w`/`i` pueden hacer nada.
  const porqueOpenRef = useRef(false)
  useEffect(() => {
    porqueOpenRef.current = porqueOpen
  })
  // Y el del chat, que apaga los mismos gestos por un motivo DISTINTO de los
  // otros dos: no es que la card esté mostrando otra cosa, es que hay un campo
  // de texto con el foco. `enCampoDeTexto` ya cubre las letras —el input es un
  // `<input>` de verdad— pero el gesto de Alt no consulta a nadie y hace
  // preventDefault sobre cualquier tecla mientras se sostiene.
  const chatOpenRef = useRef(false)
  useEffect(() => {
    chatOpenRef.current = chatOpen
  })
  // La tecla que abrió el chat sigue apretada.
  //
  // Sin esto, MANTENER la tecla escribe una fila de letras en el chat, y no por
  // un descuido sino por cómo encajan dos cosas que por separado están bien: la
  // primera pulsación abre el panel y el panel le da el foco a su campo
  // (chat-panel.tsx), así que las repeticiones automáticas que siguen ya llegan
  // con ESE campo como destino — y el listener las deja pasar a propósito,
  // porque adentro del chat esa letra es una letra.
  //
  // La distinción que falta no es "estoy en un campo de texto" sino "esto sigue
  // siendo la misma pulsación que abrió esto". Eso es lo que guarda el ref, y se
  // limpia al soltar.
  const abriendoChatRef = useRef(false)

  const flipTable = useCallback(() => {
    if (!tableOpenRef.current) openTable()
    setTableOpen(!tableOpenRef.current)
  }, [openTable])

  // Abrir el chat cierra los otros tres dorsos. No es exclusión defensiva: el
  // aside tiene UNA cara trasera, así que dos abiertos a la vez significa que
  // uno de los dos no se ve y su booleano queda mintiendo hasta que alguien lo
  // apague.
  const abrirChat = useCallback(() => {
    sfx.select()
    setSettingsOpen(false)
    setTableOpen(false)
    setStatsOpen(false)
    setPrivacyOpen(false)
    setChatOpen(true)
  }, [sfx])

  // Al cerrar, el foco vuelve a la fórmula.
  //
  // Es el único panel que lo necesita: los otros tres no se lo habían llevado
  // —el campo conserva el foco mientras el aside gira, que es justamente por lo
  // que los atajos tienen que ir en captura— pero este tiene un `<input>` que sí
  // se lo pidió. Sin devolverlo, al cerrar el chat el teclado escribe en un campo
  // que ya no está en pantalla y el juego parece trabado.
  const cerrarChat = useCallback(() => {
    sfx.select()
    setChatOpen(false)
    inputRef.current?.focus()
  }, [sfx])

  // El dorso de privacidad se abre desde un link de texto en la slide de
  // registro, nunca por atajo de teclado — mismo molde que abrirChat/cerrarChat.
  const abrirPrivacidad = useCallback(() => {
    sfx.select()
    setSettingsOpen(false)
    setChatOpen(false)
    setTableOpen(false)
    setStatsOpen(false)
    setPrivacyOpen(true)
  }, [sfx])

  const cerrarPrivacidad = useCallback(() => {
    sfx.select()
    setPrivacyOpen(false)
  }, [sfx])

  // De vuelta de editar carrera o universidad: la configuración nunca se
  // cerró (sigue a la vista todo el rato, en el otro dorso), así que acá solo
  // vuelve el panel principal al ejercicio — o pide uno, si por lo que sea no
  // había ninguno servido.
  const volverDeEditarPerfil = useCallback(() => {
    sfx.select()
    if (exercise) setNavPanel("exercise")
    else loadNext()
  }, [exercise, loadNext, sfx])

  const toggleTable = useCallback(() => {
    sfx.select()
    flipTable()
  }, [sfx, flipTable])

  // Mismo molde que `flipTable`/`toggleTable`, para el botón de la cabecera Y
  // para la tecla `j` (más abajo) — una sola definición de "qué significa
  // abrir las estadísticas" en vez de dos copias que puedan desalinearse.
  const flipStats = useCallback(() => {
    if (!statsOpenRef.current) {
      // La tabla enriquecida del aside muestra las mismas 14 fórmulas CON
      // derivada que la tabla plana: ocultarle este hecho al backend rompería
      // la regla del proyecto de que `peeked` separa resolvió de copió.
      openTable()
      posthog.capture("game_stats_open", {
        exercises_correct: player?.exercises_correct ?? 0,
      })
    }
    setTableOpen(false) // exclusión con el otro dorso del aside
    setPorqueOpen(false) // exclusión con el otro dorso de la card del ejercicio
    setStatsOpen(!statsOpenRef.current)
  }, [openTable, player?.exercises_correct])

  const toggleStats = useCallback(() => {
    sfx.select()
    flipStats()
  }, [sfx, flipStats])

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
      // Con las estadísticas a la vista, Alt no hace nada: la card del
      // ejercicio ya está mostrando otra cosa (el Elo, no la tabla), y abrir
      // encima la tabla plana del aside dejaría las dos columnas contando
      // historias distintas. Cerrar las estadísticas es cosa de `p`.
      if (statsOpenRef.current || porqueOpenRef.current || chatOpenRef.current) return
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
      // Las dos diapos que piden algo tienen su propio Enter —esperan unos
      // segundos, y con Shift hacen lo suyo— y lo manejan ellas
      // (cafecito-panel.tsx, reclutas-panel.tsx). Si además corriera este, el
      // primer Enter saltearía la diapo entera.
      //
      // El ¿Por qué?, las estadísticas y el chat comparten la misma regla: no
      // bloquean el Enter, lo GASTAN en cerrarse. Es lo que Enter significa en
      // todas las demás pantallas —seguir, volver al ejercicio— y acá no hay
      // nada más que responder con la card volteada; dejarlo pasar de largo
      // sería un Revisar sobre un campo que no se ve.
      // El orden importa: las diapos primero. Las tres caras de abajo solo
      // pueden reclamarse el Enter si son lo que se está viendo, y lo que se
      // ve cuando hay una diapo abierta es la diapo.
      if (panel === "cafecito" || panel === "reclutas") return
      if (statsOpen) {
        sfx.select()
        setStatsOpen(false)
        return
      }
      if (porqueOpen) {
        cerrarPorque()
        return
      }
      // El chat sigue la misma regla que el ¿Por qué?: no bloquea el Enter, lo
      // GASTA en cerrarse. Este listener es el que escucha en `document`, así
      // que solo lo alcanza un Enter que NO cayó en el campo de escribir —ese
      // lo maneja el propio ChatPanel y corta la propagación—, o sea
      // exactamente el momento en que el campo ya no está (falta el
      // enfriamiento de después de mandar) y lo que queda es el botón Volver.
      if (chatOpen) {
        cerrarChat()
        return
      }
      if (skip) {
        onSkip()
        return
      }
      onPrimary()
    },
    [panel, startFromIntro, onSkip, onPrimary, statsOpen, sfx, porqueOpen, cerrarPorque, chatOpen, cerrarChat],
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
      // El campo de la respuesta también es dueño de su Enter, y ese sí lo
      // maneja MathLive: acá se descarta por `isContentEditable`, que
      // `enCampoDeTexto` a propósito no mira (ver su comentario).
      const el = e.target as HTMLElement | null
      if (el?.isContentEditable || enCampoDeTexto(el)) return
      e.preventDefault()
      onEnterKey({ skip: e.altKey })
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [enterFocused, onEnterKey])

  // Las teclas de los dos botones que sacan del ejercicio: `w` abre la diapo de
  // reclutar y `c` la del cafecito.
  //
  // Va en CAPTURA y le corta la propagación al evento. Es la diferencia entre
  // que el atajo exista y que no: el campo de la respuesta tiene el foco casi
  // todo el tiempo que se juega —vuelve solo después de cada respuesta— y
  // MathLive escucha el keydown en el elemento, o sea antes que cualquier
  // listener en `document` que escuche en burbuja. Sin capturar, la letra se
  // escribía en la fórmula y el atajo no llegaba nunca.
  //
  // Eso obliga a ser cuidadoso, porque estas dos letras dejan de poder
  // escribirse en la respuesta:
  //
  // Cuáles se eligieron y qué se perdió con cada una está en TECLA_RECLUTAS y
  // TECLA_CAFECITO (cafecito-cta.tsx).
  //
  // Las otras tres guardas:
  //
  //   · Solo mientras se está JUGANDO (`gameFocused`). Con una diapo abierta, la
  //     `w` que abriría la de reclutar estando ya en ella no significa nada, y
  //     estando en la del café sería un salto lateral que nadie pidió.
  //   · Nada con modificadores. Ctrl+W y ⌘W cierran la pestaña y no se tocan; y
  //     con Alt sostenido está corriendo el gesto de la tabla, donde cualquier
  //     otra tecla significa "cancelá".
  //   · Nada en un campo de TEXTO de verdad. El @ del registro y la universidad
  //     "otra" son texto libre, y ahí una w es una w.
  useEffect(() => {
    if (!gameFocused) return
    const onKeyDown = (e: KeyboardEvent) => {
      // Con las estadísticas abiertas, `w`/`i` no navegan a otra diapo: la
      // card ya está volteada al Elo, y `panel` es una capa distinta de
      // `statsOpen` — si se dejara pasar, al volver de cafecito/reclutas la
      // card reaparecería mostrando un Elo que nadie volvió a pedir.
      if (statsOpenRef.current || porqueOpenRef.current) return
      if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return
      const tecla = e.key.toLowerCase()
      if (tecla !== TECLA_RECLUTAS && tecla !== TECLA_CAFECITO) return
      if (enCampoDeTexto(e.target)) return
      e.preventDefault()
      e.stopPropagation()
      sfx.select()
      // La misma telemetría que el click, con el atajo marcado: si el botón se
      // usa poco pero la tecla mucho, eso es algo que hay que poder ver.
      if (tecla === TECLA_RECLUTAS) {
        cta("share", "click", {
          placement: "header_desktop",
          props: { shortcut: true },
        })
        setReclutas({ trigger: "pedido" })
        setNavPanel("reclutas")
        return
      }
      cta("cafecito", "click", {
        placement: "header_desktop",
        props: { shortcut: true },
      })
      setCafecito({ trigger: "pedido", correctToday: 0 })
      setNavPanel("cafecito")
    }
    document.addEventListener("keydown", onKeyDown, true)
    return () => document.removeEventListener("keydown", onKeyDown, true)
  }, [gameFocused, setNavPanel, cta, sfx])

  // La tecla de las estadísticas personales (game/stats.py :: game_stats_endpoint
  // / stats-gate.ts). Se usa de DOS formas, como el Alt de la tabla pero con
  // una segunda salida que Alt no tiene:
  //
  //   · SOSTENIDA: a los PEEK_OPEN_MS se abre —un vistazo— y soltarla la
  //     cierra sola, igual que Alt con la tabla.
  //   · TOCADA (se suelta ANTES de llegar a los PEEK_OPEN_MS): se abre igual,
  //     pero se QUEDA abierta — es la otra forma de pedirlas, un toque y
  //     listo, como tocar el botón de la cabecera. Ahí aparece el botón
  //     "Volver" en el pie para cerrarlas a mano (mismo lugar que usan las
  //     diapos de reclutar y de cafecito para su salida), en vez de que la
  //     única forma de cerrar sea sostener la tecla de nuevo.
  //
  // Con las estadísticas YA abiertas —por cualquiera de las dos vías— volver a
  // apretar la tecla las cierra en el acto, sin esperar ningún timer.
  //
  // Captura + stopPropagation, mismo motivo que el listener de `w`/`i`: es
  // una letra, y sin ganarle a MathLive se escribiría en la fórmula en vez de
  // abrir el panel.
  useEffect(() => {
    if (!gameFocused) return
    if (!estadisticasDisponibles) return
    const timers: ReturnType<typeof setTimeout>[] = []
    let sosteniendo = false
    // Si llegó a abrirse de veras (a los PEEK_OPEN_MS) durante ESTA pulsada.
    // Decide qué hace `soltar`: cerrar como Alt, o abrir-y-quedarse como un
    // toque corto.
    let abrioPorHold = false
    const soltar = () => {
      if (!sosteniendo) return
      sosteniendo = false
      while (timers.length) clearTimeout(timers.pop()!)
      if (abrioPorHold) {
        sfx.select()
        setStatsOpen(false)
        return
      }
      // Se soltó ANTES de que el timer la abriera sola: es un toque, y un
      // toque abre y se queda. `flipStats` ya sabe cobrar el peek y excluir
      // los otros dorsos — es la misma acción que dispara el botón de la
      // cabecera.
      sfx.select()
      flipStats()
    }
    // Distinto de `soltar`: si la ventana pierde el foco a mitad de una
    // sostenida que todavía no llegó a abrirse, no hay que interpretarlo como
    // un toque y abrir igual — eso sería un efecto secundario de cambiar de
    // pestaña, no un pedido. Solo cierra si ya se había abierto de veras.
    const abortar = () => {
      if (!sosteniendo) return
      sosteniendo = false
      while (timers.length) clearTimeout(timers.pop()!)
      if (abrioPorHold) setStatsOpen(false)
    }
    const down = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return
      if (e.key.toLowerCase() !== TECLA_ESTADISTICAS) return
      if (enCampoDeTexto(e.target)) return
      e.preventDefault()
      e.stopPropagation()
      if (statsOpenRef.current) {
        // Ya estaban abiertas —de un toque anterior, o de una sostenida en
        // curso— y esta pulsación las cierra. Sin `e.repeat` de por medio: si
        // se las sostiene otra vez ya abiertas, alcanza con la primera.
        if (e.repeat) return
        sfx.select()
        setStatsOpen(false)
        return
      }
      if (e.repeat || sosteniendo) return
      sosteniendo = true
      abrioPorHold = false
      timers.push(
        setTimeout(() => {
          abrioPorHold = true
          sfx.select()
          setTableOpen(false)
          setPorqueOpen(false)
          setStatsOpen(true)
        }, PEEK_OPEN_MS),
      )
      timers.push(setTimeout(openTable, PEEK_CHARGE_MS))
    }
    const up = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== TECLA_ESTADISTICAS) return
      e.preventDefault()
      soltar()
    }
    document.addEventListener("keydown", down, true)
    document.addEventListener("keyup", up, true)
    window.addEventListener("blur", abortar)
    return () => {
      while (timers.length) clearTimeout(timers.pop()!)
      document.removeEventListener("keydown", down, true)
      document.removeEventListener("keyup", up, true)
      window.removeEventListener("blur", abortar)
    }
  }, [gameFocused, estadisticasDisponibles, openTable, sfx, flipStats])

  // La tecla del «¿Por qué?». Mismo molde que la de arriba —captura +
  // stopPropagation, para ganarle a MathLive, que escucha en el elemento— y con
  // la misma condición que el botón: solo existe cuando ya hay algo para
  // explicar. Antes del primer intento no es que esté deshabilitada, es que no
  // está, igual que el servidor la rechaza con un 409.
  //
  // Se pierde poder escribir la `p` en la respuesta, como ya pasa con `w` e `i`.
  // No cuesta nada acá: ninguna derivada del juego la lleva.
  useEffect(() => {
    if (!gameFocused) return
    if (!hayPorque) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return
      if (e.key.toLowerCase() !== TECLA_PORQUE) return
      if (enCampoDeTexto(e.target)) return
      e.preventDefault()
      e.stopPropagation()
      // Mantener la tecla apretada manda un keydown por repetición (`e.repeat`)
      // hasta que se suelta. Sin esto, cada uno alternaba abrir/cerrar: la
      // explicación entraba y salía a los tumbos con el volteo de por medio, y
      // según cuántas repeticiones llegaran antes de soltar, podía quedar
      // trabada abierta o cerrada sin que la persona haya elegido nada.
      if (e.repeat) return
      if (porqueOpenRef.current) cerrarPorque()
      else abrirPorque()
    }
    document.addEventListener("keydown", onKeyDown, true)
    return () => document.removeEventListener("keydown", onKeyDown, true)
  }, [gameFocused, hayPorque, abrirPorque, cerrarPorque])

  // La tecla del chat. Mismo molde que las de arriba —captura +
  // stopPropagation— más una salida que las otras no tienen: Escape.
  //
  // Escape se maneja acá y no adentro del panel porque tiene que funcionar
  // ESTÉ DONDE ESTÉ EL FOCO: escribiendo en el campo del chat, mirando la lista,
  // o con el foco todavía en la fórmula. Y no pasa por `enCampoDeTexto` a
  // propósito — es la única tecla que en un campo de texto significa "salí de
  // acá" y no un carácter.
  //
  // La `m` sí lo consulta: adentro del chat una eme es una eme.
  useEffect(() => {
    if (!gameFocused) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return
      if (e.key === "Escape") {
        if (!chatOpenRef.current) return
        e.preventDefault()
        e.stopPropagation()
        cerrarChat()
        return
      }
      if (e.key.toLowerCase() !== TECLA_CHAT) return
      if (enCampoDeTexto(e.target)) {
        // Adentro del chat la letra es una letra... salvo que sea la repetición
        // de la misma pulsación que lo acaba de abrir (ver `abriendoChatRef`).
        if (abriendoChatRef.current) {
          e.preventDefault()
          e.stopPropagation()
        }
        return
      }
      // Repetición con el foco todavía afuera del campo: pasa cuando el chat no
      // se lo pudo llevar —un invitado, que tiene el campo apagado—. Tampoco
      // tiene que hacer nada: la tecla ya abrió.
      if (e.repeat) {
        e.preventDefault()
        e.stopPropagation()
        return
      }
      e.preventDefault()
      e.stopPropagation()
      if (chatOpenRef.current) cerrarChat()
      else {
        abriendoChatRef.current = true
        abrirChat()
      }
    }
    const soltar = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === TECLA_CHAT) abriendoChatRef.current = false
    }
    // Y si la ventana pierde el foco con la tecla apretada, el keyup no llega
    // nunca: sin esto el ref queda en `true` y la próxima letra suelta se
    // tragaría sin motivo. Mismo recaudo que el gesto de Alt.
    const abandonar = () => {
      abriendoChatRef.current = false
    }
    document.addEventListener("keydown", onKeyDown, true)
    document.addEventListener("keyup", soltar, true)
    window.addEventListener("blur", abandonar)
    return () => {
      document.removeEventListener("keydown", onKeyDown, true)
      document.removeEventListener("keyup", soltar, true)
      window.removeEventListener("blur", abandonar)
    }
  }, [gameFocused, abrirChat, cerrarChat])

  // Escape para el dorso de privacidad, en un efecto APARTE del de arriba: ese
  // solo corre con `gameFocused` (panel === "exercise"), pero a este panel se
  // entra desde la slide de registro, con `panel === "register"` — si viviera
  // adentro del otro efecto, nunca se engancharía.
  useEffect(() => {
    if (!privacyOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return
      e.preventDefault()
      e.stopPropagation()
      cerrarPrivacidad()
    }
    document.addEventListener("keydown", onKeyDown, true)
    return () => document.removeEventListener("keydown", onKeyDown, true)
  }, [privacyOpen, cerrarPrivacidad])

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
  // El piso de 420px en la izquierda es el mismo ancho que ya se midió sin
  // problemas (con teclas de Mac, que son las que más espacio piden: "option +
  // return"): por debajo de esa ventana total, la card de la intro y la del
  // ejercicio empezaban a apretarse hasta desbordar su propio borde en vez de
  // reacomodarse. Con el piso, lo que pasa en una ventana angosta es un scroll
  // horizontal de toda la página —previsible y contenido— en vez de contenido
  // roto adentro de una columna que se dejó angostar sin fondo.
  const columns = "grid-cols-[minmax(420px,1fr)_420px]"

  // Las pantallas que llevan pie —botón e historial— abajo, fuera del volteo.
  //
  // Las dos diapos de pedido están adentro, y ese es el cambio que hace que
  // pedir algo se lea como una pausa y no como cambiar de pantalla: la caja del
  // ejercicio se da vuelta y muestra el pedido, pero el botón de seguir no se
  // movió de su lugar —ahí abajo, donde estaba Revisar— y el historial de al
  // lado ni se entera, porque no se desmonta.
  //
  const esDiapoDePedido = panel === "cafecito" || panel === "reclutas"
  // Elegir carrera o universidad usa el MISMO pie que las diapos de pedido —
  // el botón vive abajo, por portal— porque se abre desde la configuración,
  // que sigue a la vista del otro lado: es una pausa adentro del ejercicio,
  // no un formulario que se lleva la columna entera.
  const esDiapoDeCampo = panel === "editCareer" || panel === "editUniversity"
  // El registro —las dos variantes, desde Configuración y desde el hito— se
  // suma a este grupo por el mismo motivo que cafecito/reclutas: el botón que
  // cierra la pantalla vive en el pie, así que la caja se achica al tamaño
  // del ejercicio en vez de comerse la columna (ver el comentario de
  // `registroDesdeConfig`, más arriba, sobre qué cambia entre las dos).
  const registroEnElPie = panel === "register"
  // "Elegí tu @" (la primera vez, antes de la primera derivada) y el hito de
  // perfil (carrera/universidad) son la MISMA idea: no hay nada que pausar de
  // por medio —el ejercicio sigue del otro lado, intacto—, así que no tiene
  // sentido de "trámite de columna entera" y sus cajas miden lo mismo que la
  // del ejercicio, como todo lo demás de este grupo.
  const esUsername = panel === "username"
  const esPerfil = panel === "profile"
  const pieDelPanel =
    panel === "intro" ||
    panel === "exercise" ||
    esDiapoDePedido ||
    esDiapoDeCampo ||
    registroEnElPie ||
    esUsername ||
    esPerfil

  // El nodo del pie donde las diapos dibujan su botón de salir (ver
  // slide-salida.tsx). Va en estado y no en un ref porque un ref no vuelve a
  // renderizar, y la diapo tiene que enterarse de que el destino ya existe.
  const [slotSalida, setSlotSalida] = useState<HTMLDivElement | null>(null)

  return (
    <div className="h-dvh overflow-hidden" style={GRID_BG_STYLE}>
      {/* La caja mide un 10% menos que antes en las dos dimensiones: el juego
          ocupa menos pantalla y queda más fondo libre a los costados y, sobre
          todo, abajo. El alto va atado al 90% de la ventana y no solo a un tope
          en píxeles, porque en las pantallas más comunes el que mandaba era el
          viewport y el tope no llegaba a aplicarse. El bloque se ancla arriba,
          así que todo lo que sobra se va al pie. */}
      {/* El ancho del bloque es lo que decide el de la columna izquierda: la
          derecha está clavada en 420 px, así que todo lo que se sume acá se lo
          lleva entero el ejercicio.
          Había bajado a 61.8rem con el argumento de que esa columna ocupaba más
          de lo que su contenido necesitaba, porque adentro el enunciado y las
          teclas viven en un canal fijo. Volvió a subir —a 68rem— porque ese
          argumento dejó de ser cierto: el dorso de la card es ahora el «¿Por
          qué?», que no es un canal sino prosa con fórmulas en display, y esas
          fórmulas usan el ancho ENTERO de la card. Con 61.8rem la columna daba
          508 px y la explicación de un cociente quedaba justo al filo.
          Con 68rem son 608, y el canal de adentro subió de 28 a 32rem para que
          el campo y las teclas no queden flotando en el medio de una card que
          creció sin ellos: con el canal viejo quedaban 64 px de margen muerto a
          cada lado, y con 32rem quedan 48, que es el mismo aire proporcional que
          tenía antes. */}
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
      <div className="mx-auto flex h-full max-h-[calc(min(94%,880px)_+_10px)] w-full max-w-[68rem] flex-col gap-3 px-6 pb-12 pt-5">
        {/* La `key` es lo que arranca una tanda nueva: la capa lee su caja de
            origen y su cantidad una sola vez, al montarse. Sin ella, el segundo
            acierto no despegaría. */}
        {vuelo && (
          <OrbFlight
            key={vuelo.seq}
            count={vuelo.count}
            colors={vuelo.colores}
            from={vuelo.from}
            target={magnetTarget}
            onArrive={onOrbeLlega}
          />
        )}
        <header className={`grid shrink-0 gap-3 ${columns}`}>
          <div className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-2.5">
            {/* El logo de la presentación es este mismo: se despega de acá, se
                escribe en el centro y vuelve (ver game-intro.tsx). */}
            {/* Acá es el logo común de Intervalo —la palabra con su barra, sin
                el `d/dx [ ]`—, y por eso no se pide nada: quién lleva notación
                lo decide la plataforma en game-root.tsx y viaja en `intro`. */}
            {/* 15% menos que antes (era 1.25rem); el tamaño de la presentación
                bajó lo mismo, ver INTRO_FONT_PX en game-intro.tsx. */}
            <GameIntroLogo intro={intro} fontSize="1.0625rem" />
            <div className="flex items-center gap-2" style={chromeStyle}>
              <TableButton open={tableOpen} onToggle={toggleTable} />
              <ChatButton
                open={chatOpen}
                sinLeer={mensajesSinLeer}
                onToggle={chatOpen ? cerrarChat : abrirChat}
              />
              <StatsButton
                open={statsOpen}
                visible={estadisticasDisponibles}
                onToggle={toggleStats}
              />
              <ShareButton
                keyboard
                placement="header_desktop"
                // Igual que el del cafecito: voltea la card y muestra la diapo,
                // en vez de mandar directo a WhatsApp. El ejercicio no se toca y
                // vuelve entero al salir.
                onOpen={() => {
                  setReclutas({ trigger: "pedido" })
                  setNavPanel("reclutas")
                }}
              />
              <CafecitoButton
                placement="header_desktop"
                compact
                keyboard
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
              <div className="flex shrink-0 items-center gap-2">
                {/* Por qué ordena el ranking — game-ranking.tsx ::
                    RankingSort. Dos botones y no un menú desplegable: son solo
                    dos opciones y las dos se quieren ver siempre, no ocultas
                    atrás de un clic más. Cada uno lleva el MISMO glifo que ya
                    usa el indicador que prende: el ícono de experiencia
                    (XpDots) para uno, "ELO" en su misma tipografía versalita
                    para el otro — así el selector no inventa un lenguaje
                    visual nuevo, adelanta el que ya está puesto en cada fila.

                    Vuelve solo a experiencia al acertar (ver `onSuccess` de la
                    respuesta): los orbes son de XP y caen en el número de XP
                    de la fila propia, así que el festejo necesita esa columna
                    puesta. */}
                <div className="flex items-center gap-0.5 rounded-md border border-border p-0.5">
                  <button
                    type="button"
                    aria-label="Ordenar el ranking por experiencia"
                    aria-pressed={rankingSort === "experiencia"}
                    onClick={() => {
                      sfx.select()
                      setRankingSort("experiencia")
                    }}
                    className={`rounded p-1 transition-colors ${
                      rankingSort === "experiencia"
                        ? "bg-accent text-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    }`}
                  >
                    <XpDots className="size-[15px]" />
                  </button>
                  <button
                    type="button"
                    aria-label="Ordenar el ranking por Elo"
                    aria-pressed={rankingSort === "elo"}
                    onClick={() => {
                      sfx.select()
                      setRankingSort("elo")
                    }}
                    className={`rounded px-1.5 py-1 text-[0.7em] font-normal tracking-wider transition-colors ${
                      rankingSort === "elo"
                        ? "bg-accent text-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    }`}
                  >
                    ELO
                  </button>
                </div>
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
                      slotSalida={slotSalida}
                    />
                  </div>
                ) : panel === "editCareer" && player ? (
                  <div className="flex min-h-0 flex-1 flex-col rounded-lg border border-border bg-card p-5">
                    <EditCareerPanel
                      initialValue={player.career ?? ""}
                      slotSalida={slotSalida}
                      onDone={volverDeEditarPerfil}
                    />
                  </div>
                ) : panel === "editUniversity" && player ? (
                  <div className="flex min-h-0 flex-1 flex-col rounded-lg border border-border bg-card p-5">
                    <EditUniversityPanel
                      initialValue={player.university ?? ""}
                      slotSalida={slotSalida}
                      onDone={volverDeEditarPerfil}
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
                    slotSalida={slotSalida}
                    onPreview={setCafecitoPreview}
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
                ) : panel === "reclutas" && reclutas ? (
                  <ReclutasPanel
                    keyboard
                    trigger={reclutas.trigger}
                    // Sin lista adentro: acá al lado el ranking ya se conmutó a
                    // "Reclutas" y la muestra entera. Ver `viewOverride`.
                    slotSalida={slotSalida}
                    onContinue={() => {
                      const { trigger, volverA } = reclutas
                      setReclutas(null)
                      // La que salió por hito llega después de responder, así
                      // que lo que sigue es la derivada siguiente; la que abrió
                      // la persona interrumpió algo que hay que devolverle.
                      if (trigger !== "pedido") {
                        loadNext()
                        return
                      }
                      setNavPanel("exercise")
                      if (volverA === "settings") setSettingsOpen(true)
                      else if (!exercise) loadNext()
                    }}
                  />
                ) : panel === "username" && player ? (
                  <div className="flex min-h-0 flex-1 flex-col rounded-lg border border-border bg-card p-5">
                    <UsernameSlide player={player} onDone={loadNext} slotSalida={slotSalida} />
                  </div>
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
                      onOpenPrivacy={abrirPrivacidad}
                      desdeConfiguracion={registroDesdeConfig}
                      slotSalida={slotSalida}
                      // Atajos de teclado: solo en la variante de hito, que es
                      // la única con "Ahora no" (Alt+Enter) — la de
                      // Configuración no tiene ese botón y "Guardar" no tiene
                      // atajo propio.
                      keyboard={!registroDesdeConfig}
                      // Solo escritorio: el login corre en una ventana aparte
                      // y esta pestaña no se mueve de `/derivadas` (ver
                      // `autenticarConVentana` en register-slides.tsx). En el
                      // teléfono no hay ventanas que abrir.
                      popup
                    />
                  </div>
                ) : exercise ? (
                  <>
                  {/* La card del ejercicio y su teclado, en una sola caja
                      que se da vuelta.

                      El giro se lleva la card Y el teclado, no solo la card: el
                      dorso —las estadísticas (tecla `j`) o el «¿Por qué?»—
                      hereda card + teclado y entra completo. El botón de abajo y
                      el historial quedan afuera a propósito: no son parte del
                      ejercicio y siguen sirviendo con el dorso a la vista.

                      Alto fijado por la cara MÁS ALTA, que es el dorso: medido,
                      su contenido pide 473 px contra los 400 del ejercicio.
                      Antes la caja se estiraba a lo que sobrara en la columna
                      (546) y quedaban 147 px de nada abajo del teclado. `min-h`
                      y no `h`: si algún día un enunciado largo pide más, crece.

                      ACÁ AFUERA HABÍA OTRO CAMBIO DE PANTALLA, uno por
                      ejercicio: al tocar Continuar la card entera se iba y del
                      otro lado estaba la derivada siguiente. Se sacó. Un
                      ejercicio nuevo no es una pantalla nueva —es la misma card
                      con otra derivada adentro—, y anunciarlo con el gesto de
                      cambiar de pantalla decía que había pasado algo más grande
                      de lo que pasó. Ahora cambia solo lo que cambia: el
                      enunciado, el campo —que se limpia y se enfoca solo, ver
                      `loadNext`— y el teclado, que se ACOMODA con las teclas
                      nuevas en vez de volver a dibujarse entero (el `layout` de
                      math-keyboard.tsx, que con el remonte no llegaba a correr
                      nunca: sus teclas nacían de cero en cada derivada).

                      Sacarlo se llevó también un remonte por ejercicio de todo
                      lo que hay acá adentro, MathLive incluido —que entra por un
                      import dinámico—. El precio es que nada de acá abajo puede
                      guardar estado que dependa de nacer con cada derivada; lo
                      único que lo hacía era el relevo de la caja del enunciado
                      (ver `relevado` en exercise-card.tsx).

                      Enunciado y teclado van en UNA card, separados por una
                      línea: son un solo objeto —la derivada y con qué
                      escribirla— y dos cajas con su propio borde los hacían leer
                      como dos cosas que hay que mirar por separado.

                      La card toma `flex-1` y no `shrink-0`: todo el alto que
                      sobra en la caja se lo queda ella —y adentro se reparte
                      alrededor de la fórmula, que es lo que hay que mirar—, así
                      el teclado queda apoyado abajo con el mismo aire que lo
                      separa del campo. */}
                    {/* El FlipCard lo tuvo antes para la tabla de derivadas,
                        hasta que esta se mudó al dorso del RANKING; ahora es de
                        las estadísticas personales (tecla `j`) y del «¿Por
                        qué?». Es el único cambio de cara que le queda a esta
                        caja. */}
                    <FlipCard
                      className="min-h-[26rem] flex-1"
                      flipped={statsOpen || porqueOpen}
                      front={
                        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-border bg-card">
                          {/* Con el chat abierto, el ejercicio se va de foco:
                              el mismo vidrio con el que el ranking espera
                              mientras se lee la intro (out-of-focus.ts). Ahí
                              dice «esto todavía no está en juego» y acá dice
                              «esto quedó esperando», que es la misma frase.
                              Y de paso lo apaga al tacto —el vidrio trae
                              `pointer-events-none`—, que es lo correcto: con
                              el foco puesto en el campo del chat, tocar una
                              tecla de la fórmula no escribiría donde se está
                              mirando.

                              Va sobre el CONTENIDO y no sobre este div: el
                              marco desenfocado se lee como un error de dibujo
                              (ver out-of-focus.ts). Antes había una segunda
                              razón —un `filter` sobre un ancestro aplana el
                              contexto 3D y se llevaba puesto el volteo de esta
                              card—, y con el volteo se fue: hoy el cambio de
                              cara es un fundido y no hay contexto 3D que
                              aplanar. */}
                          <div
                            className={`flex min-h-0 flex-1 flex-col ${outOfFocus(chatOpen)}`}
                          >
                          <ExerciseCard
                            bare
                            className="flex-1"
                            streak={player?.combo ?? 0}
                            attempted={player?.exercises_attempted ?? 0}
                            elo={player?.elo ?? null}
                            multiplier={boost?.multiplier ?? 1}
                            promptLatex={exercise.prompt_latex}
                            // La caja del enunciado pasa a mostrar la derivada
                            // que se escribió. Entra después de la explosión,
                            // no en vez de ella: los orbes salen de la fórmula
                            // vieja y la nueva ocupa el lugar que dejaron.
                            solvedLatex={solvedLatex}
                            promptGone={tone === "correct"}
                            promptRef={attachPrompt}
                          >
                            <div
                              className={`flex flex-col gap-2 ${PANEL_CONTENT}`}
                            >
                              <AnswerField
                                tone={tone}
                                seq={answerSeq}
                                // Resuelto el ejercicio, el campo deja lugar a
                                // la pista: lo que se escribió ya está arriba,
                                // en la caja del enunciado.
                                // Resuelto el ejercicio, el campo entero se
                                // convierte en el botón del «¿Por qué?»: la
                                // caja completa, no un botón adentro de una
                                // caja. Ocupa el mismo lugar y mide lo mismo
                                // que el campo que reemplaza —`CAMPO_MIN_H` y
                                // el redondeo grande— así que nada se mueve
                                // al aparecer, y es donde el cursor estaba
                                // hace un segundo: no hay que ir a buscarlo.
                                //
                                // `h-auto` porque el botón trae el alto de un
                                // CTA y acá manda el del campo.
                                hint={
                                  solvedLatex !== null ? (
                                    <PorQueButton
                                      showKeyHint
                                      className={`${CAMPO_MIN_H} h-auto w-full rounded-lg`}
                                      onClick={porqueOpen ? cerrarPorque : abrirPorque}
                                      open={porqueOpen}
                                      // Blanco con letra negra, igual que
                                      // Continuar —es el campo, no el pie—
                                      // (ver `blanco` en porque-panel.tsx).
                                      blanco
                                    />
                                  ) : undefined
                                }
                              >
                                <MathInput
                                  handleRef={attachInput}
                                  // Al acertar, el campo deja lugar al botón
                                  // del «¿Por qué?» (ver `hint`), así que en la
                                  // derivada siguiente vuelve a montarse — y el
                                  // `focus()` que dispara `loadNext` corre antes
                                  // de que exista. Saliendo por Saltear no se
                                  // desmonta y lo enfoca aquel.
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
                              cerradoVisual
                                ? "pointer-events-none opacity-45"
                                : undefined
                            }
                          />
                          </div>
                        </div>
                      }
                      back={
                        <div className="flex min-h-0 flex-1 flex-col rounded-lg border border-border bg-card p-5">
                          {/* El dorso también: lo que la card esté mostrando
                              —el ejercicio o su explicación— queda esperando
                              igual mientras se escribe en el chat. */}
                          <div
                            className={`flex min-h-0 flex-1 flex-col ${outOfFocus(chatOpen)}`}
                          >
                          {caraDelEjercicio === "porque" ? (
                            <PorQuePanel
                              bare
                              // `gameFocused` solo: sin esto, `w`/`s` seguían
                              // atados a ESTA instancia aunque `panel` ya no
                              // fuera "exercise" —la card del ejercicio no se
                              // desmonta al abrir Reclutas o Cafecito, solo
                              // queda tapada— y se comían la tecla en
                              // silencio en vez de dejarla pasar.
                              // `porqueOpen` además: `caraDelEjercicio` es
                              // pegajosa a propósito (no vuelve a "stats" sola
                              // al cerrar, para que el giro de cierre no salte
                              // de cara) — sin este chequeo, la PRIMERA vez
                              // que se abre «¿Por qué?» dejaba este panel
                              // montado en el dorso para siempre, y su
                              // listener de captura le robaba la "s" a la
                              // respuesta en todos los ejercicios siguientes.
                              scrollButtons={gameFocused && porqueOpen}
                              explanation={porqueTexto}
                              isPending={explainMutation.isPending}
                              isError={explainMutation.isError}
                              onRetry={abrirPorque}
                              graph={porqueGraph}
                            />
                          ) : (
                            <EloStatsPanel
                              player={player}
                              stats={statsQuery.data}
                              isLoading={statsQuery.isPending}
                            />
                          )}
                          </div>
                        </div>
                      }
                    />
                  </>
                ) : (
                  <ExerciseSkeleton />
                )}
              </SlideFlip>
              {/* El pie: mismo botón y mismo historial para todas las
                  pantallas de esta caja, intro y ejercicio incluidos —hoy no
                  queda ninguna que se lleve la columna entera con su propio
                  botón adentro. */}
              {pieDelPanel && (
                <>
                  <div className={`flex shrink-0 items-stretch gap-2 ${outOfFocus(chatOpen)}`}>
                    {panel === "intro" ? (
                      <IntroStartButton
                        onStart={startFromIntro}
                        disabled={player === null || next.isPending}
                      />
                    ) : esDiapoDePedido || esDiapoDeCampo || registroEnElPie || esUsername || esPerfil ? (
                      // La caja vacía donde la diapo (o el campo) dibuja su
                      // botón. Se monta y se desmonta con `panel`, y eso
                      // resuelve el único caso molesto: durante los ~380 ms
                      // del volteo de salida la pantalla que se va sigue
                      // montada (ver slide-flip.tsx) e intentaría dibujar su
                      // botón al lado del Revisar que ya volvió. Como el
                      // destino desaparece en el mismo instante en que cambia
                      // `panel`, no dibuja nada.
                      <div ref={setSlotSalida} className="flex w-full" />
                    ) : statsOpen ? (
                      // Reemplaza a Revisar/Saltear/¿Por qué? entero: con la
                      // card volteada al Elo no hay ejercicio que responder ni
                      // saltear. Blanco y con el chip de Enter, como Continuar
                      // y no como el Volver gris de las diapos (claseDeSalida)
                      // — acá Enter YA cierra (ver `onEnterKey`), así que el
                      // botón tiene que anunciarlo en vez de mentir un atajo
                      // que no hace nada. Mismo `Button` que `IntroStartButton`
                      // (intro-panel.tsx) y no un `<button>` a mano: con las
                      // clases copiadas terminó un poco más alto y con la letra
                      // un poco más grande que Continuar — se nota apenas se
                      // los mira uno al lado del otro.
                      <Button
                        size="lg"
                        onClick={() => {
                          sfx.select()
                          setStatsOpen(false)
                        }}
                        className="h-[var(--cta-h)] w-full shrink-0 rounded-md bg-white text-black hover:bg-white/90 hover:text-black"
                      >
                        Volver
                        <KeyCap>{teclas.enter}</KeyCap>
                      </Button>
                    ) : exercise ? (
                      <>
                        {/* Resuelto el ejercicio el pie es UNO solo, Continuar
                            de punta a punta: el ¿Por qué? se mudó adentro de la
                            caja de la pista, arriba, donde estaba el cursor
                            (mismo mecanismo en las dos plataformas — ver el
                            `hint` de AnswerField, más abajo, y su equivalente
                            en mobile-flow.tsx). Acá abajo quedaban dos botones
                            para dos cosas de peso muy distinto, y el chico se
                            llevaba la mitad del renglón del que cierra el
                            ejercicio. */}
                        <AnswerButton
                          className="flex-1"
                          tone={tone}
                          seq={answerSeq}
                          closed={cerradoVisual}
                          // Sin destello cuando salió bien a la primera: ahí
                          // el pie entero cambia de forma (¿Por qué? y
                          // Saltear se van, este botón pasa a ocupar toda la
                          // fila) y ese colapso ya avisa por su cuenta. El
                          // destello es para cuando el pie NO cambia de forma
                          // —acertar en el segundo intento o más—, que es el
                          // único caso en que hace falta.
                          sinFlash={primerIntento}
                          showKeyHint
                          disabled={
                            answerMutation.isPending || (closed && (next.isPending || esperandoAdelanto))
                          }
                          onClick={onPrimary}
                        />
                        {/* En el MEDIO de los tres, y no al final. Los de los
                            extremos son las dos formas de terminar con esta
                            derivada —resolverla o irse—, y el del medio es la
                            única que no la termina: te deja acá y te explica.
                            Puesto último quedaba leyéndose como una tercera
                            salida, que es lo que no es. */}
                        {!cerradoVisual && hayPorque && (
                          <PorQueButton
                            showKeyHint
                            onClick={porqueOpen ? cerrarPorque : abrirPorque}
                            disabled={answerMutation.isPending}
                            open={porqueOpen}
                            blanco
                          />
                        )}
                        {!cerradoVisual && (
                          <SkipButton
                            showKeyHint
                            disabled={
                              skipMutation.isPending || answerMutation.isPending
                            }
                            onClick={onSkip}
                          />
                        )}
                        {/* Tercero en discordia cuando el ejercicio sigue
                            abierto: Revisar se queda con el ancho que sobra y
                            estos dos miden lo suyo. Cuando ya se acertó son solo
                            dos —Continuar y esto—, que es el mismo pie que la
                            rama `solved` del session-runner de Intervalo.
                            Alterna: tocarlo con el panel abierto lo cierra, que
                            es lo que espera quien terminó de leer. */}

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
                  {/* `|| porqueOpen`: leyendo el «¿por qué?» tampoco importa
                      qué pasó en el juego mientras tanto — mismo criterio que
                      la intro (ver out-of-focus.ts). */}
                  <EventFeed
                    enabled={player !== null}
                    className="h-[107.5px] shrink-0 py-1"
                    veiled={panel === "intro" || porqueOpen}
                  />
                </>
              )}
            </div>

            <aside className="flex min-h-0 flex-col gap-3">
              {/* Esta columna tiene TRES dorsos y una sola cara: la
                      configuración, la tabla de derivadas y —desde que existe
                      el panel de estadísticas (tecla `j`)— la misma tabla con
                      dos columnas más. Los tres son cosas que se consultan sin
                      dejar de jugar, y los tres dejan el ejercicio intacto del
                      otro lado. Nunca se piden dos a la vez (el gesto de Alt y
                      la tecla `j` se cierran uno a otro, y los dos cierran la
                      configuración y viceversa), así que alcanza con elegir
                      cuál va atrás; la configuración manda si más de uno
                      estuviera abierto. */}
              <FlipCard
                className="min-h-0 flex-1"
                flipped={settingsOpen || chatOpen || tableOpen || statsOpen || privacyOpen}
                front={
                  <div className="flex min-h-0 flex-1 flex-col justify-center overflow-hidden rounded-lg border border-border bg-card p-3">
                    <GameRanking
                      climbFrom={climbFrom}
                      enabled={player !== null}
                      liveXp={liveXp}
                      counting={counting}
                      xpColor={xpColor && (boost?.multiplier ?? 1) > 1 ? AMBAR : xpColor}
                      attachXpTarget={attachTarget}
                      myUniversity={player?.university ?? null}
                      centerKey={centerKey}
                      // Con la diapo de reclutar abierta, el ranking de al lado
                      // muestra los reclutas. Es la mitad que falta del pedido:
                      // la diapo dice cuánto se gana y la tabla muestra con
                      // quiénes, o —la primera vez— con quiénes se vería.
                      viewOverride={panel === "reclutas" ? "recruits" : null}
                      // Con la diapo del café abierta y universidad propia, el
                      // ranking se filtra solo a esa universidad y cada fila
                      // muestra el multiplicador que se está por comprar en vez
                      // de su XP: la misma idea que arriba, aplicada al café.
                      boostPreview={
                        panel === "cafecito" && cafecitoPreview && player?.university
                          ? {
                              university: player.university,
                              multiplier: cafecitoPreview.multiplier,
                              color: cafecitoPreview.color,
                            }
                          : null
                      }
                      sort={rankingSort}
                      // `|| porqueOpen`: leyendo el «¿por qué?» tampoco hay
                      // motivo para que el ranking compita por atención.
                      className={`flex-1 ${outOfFocus(enIntro(panel) || porqueOpen)}`}
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
                          // Si se cerró en medio de elegir carrera o
                          // universidad, ese panel no tiene a dónde volver
                          // solo: sin esto quedaba huérfano, mostrando el
                          // campo abandonado con la configuración ya cerrada.
                          if (panel === "editCareer" || panel === "editUniversity") {
                            if (exercise) setNavPanel("exercise")
                            else loadNext()
                          } else if (!exercise) {
                            // Por si se cerró sin ejercicio servido.
                            loadNext()
                          }
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
                          // Reiniciar vence TODO lo servido, también lo que
                          // hubiéramos adelantado.
                          descartarAdelanto()
                          loadNext({ fresco: true })
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
                        onShare={() => {
                          // Mismo volteo único que el cafecito de acá arriba.
                          setSettingsOpen(false)
                          setReclutas({ trigger: "pedido", volverA: "settings" })
                          setNavPanel("reclutas")
                        }}
                        onNeedsRegister={() => {
                          setSettingsOpen(false)
                          setRegistroDesdeConfig(true)
                          setNavPanel("register")
                        }}
                        onEditCareer={() => {
                          // A diferencia del cafecito/reclutas de acá arriba,
                          // la configuración NO se cierra: sigue a la vista
                          // del otro lado mientras se elige, que es lo que
                          // tiene sentido cuando lo que se está cambiando es
                          // justo lo que esa fila muestra.
                          setNavPanel("editCareer")
                        }}
                        onEditUniversity={() => {
                          setNavPanel("editUniversity")
                        }}
                      />
                    </div>
                  ) : backKind === "chat" ? (
                    <div className="flex min-h-0 flex-1 flex-col rounded-lg border border-border bg-card p-3">
                      <ChatPanel
                        open={chatOpen}
                        enabled={player !== null}
                        onClose={cerrarChat}
                        className="flex-1"
                      />
                    </div>
                  ) : backKind === "table" ? (
                    <div className="flex min-h-0 flex-1 flex-col rounded-lg border border-border bg-card p-3">
                      <DerivativesTable />
                    </div>
                  ) : backKind === "stats" ? (
                    <div className="flex min-h-0 flex-1 flex-col rounded-lg border border-border bg-card p-3">
                      <DerivativesStatsTable rows={statsQuery.data?.rows ?? []} />
                    </div>
                  ) : (
                    <div className="flex min-h-0 flex-1 flex-col gap-3 rounded-lg border border-border bg-card p-4">
                      <button
                        type="button"
                        onClick={cerrarPrivacidad}
                        aria-label="Volver"
                        className="flex shrink-0 items-center gap-1 self-start rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent"
                      >
                        <ChevronLeft size={18} />
                      </button>
                      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto">
                        <PrivacidadContent compact condensedIntro chico sinGrilla />
                      </div>
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
