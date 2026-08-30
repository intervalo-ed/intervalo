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
import { ApiError } from "@/lib/api/client"
import { useSfx } from "@/lib/audio/useSfx"
import {
  CafecitoButton,
  ShareButton,
  markCafecitoShown,
  shouldShowCafecito,
  CAFECITO_EVERY,
  VERDE,
  type CafecitoTrigger,
} from "./cafecito-cta"
import {
  AnswerButton,
  AnswerField,
  CAMPO_MIN_H,
  ExerciseCard,
  PANEL_CONTENT,
  SkipButton,
  answerTone,
  type AnswerTone,
} from "./exercise-card"
import { CafecitoPanel, CAFE } from "./cafecito-panel"
import { ReclutasPanel, type ReclutasTrigger } from "./reclutas-panel"
import { ConSalidaAbajo } from "./slide-salida"
import { marcarReclutasMostrado, tocaReclutar } from "./reclutas-trigger"
import { HITO_PERFIL, HITO_REGISTRO } from "./hitos-del-juego"
import { GameIntroLogo, type GameIntro } from "./game-intro"
import { INTRO_CLOSE, IntroParagraphs } from "./intro-panel"
import { DerivativesTable, TableButton } from "./derivatives-table"
import { PorQueButton, PorQuePanel, type PorQueGraph } from "./porque-panel"
import { useExplainExercise } from "./UseGameExplain"
import {
  SLIDE_TRANSITION,
  SlideHorizontal,
  slideVariants,
  type Direccion,
} from "./slide-horizontal"
import { ChatButton, ChatPanel } from "./chat-panel"
import { EventFeed } from "./event-feed"
import { GameRanking } from "./game-ranking"
import { HINT_MOBILE, MathInput, type MathInputHandle } from "./math-input"
import { MathKeyboard } from "./math-keyboard"
import { parseAnswerToMathJson, warmupComputeEngine } from "./parse-answer"
import { useLocalVerdict } from "./UseLocalVerdict"
import { LegalSheet } from "@/app/onboarding/legal-sheet"
import { ProfileSlides, RegisterSlide } from "./register-slides"
import { UsernameSlide } from "./username-slide"
import { SettingsPanel } from "./settings-panel"
import {
  useAnswerExercise,
  useNextExercise,
  useSkipExercise,
  useEjercicioAdelantado,
  type GameAnswer,
  type GameExercise,
} from "./UseGameExercise"
import { useGameIdentity } from "./game-telemetry"
import { useGameEvents, useGamePulse, useMyBoost } from "./UseGameLeaderboard"
import { gameKeys, useGamePlayer } from "./UseGamePlayer"
import { useXpConteo } from "./xp-conteo"

const ctaCls =
  "h-[var(--cta-h)] w-full rounded-md bg-white text-black hover:bg-white/90 hover:text-black"

type Slide =
  | { kind: "intro" }
  // Primera vez en este dispositivo, sin invitado guardado: se muestra entre
  // la intro y la primera derivada (ver startFromIntro). No lleva `back`
  // porque solo se llega acá desde la intro, nunca desde otra pantalla.
  | { kind: "username" }
  | { kind: "exercise" }
  | { kind: "ranking"; answer: GameAnswer }
  | { kind: "profile" }
  | { kind: "register" }
  // `back` es a dónde vuelve al cerrar. Se guarda porque a configuración se
  // entra desde el ejercicio Y desde el ranking, y volver siempre al ejercicio
  // se comería el festejo que estaba en pantalla.
  | { kind: "settings"; back: Slide }
  // La tabla de derivadas. Guarda a dónde volver por lo mismo que configuración:
  // se entra desde el ejercicio y desde el ranking.
  | { kind: "tabla"; back: Slide }
  // El «¿Por qué?»: de dónde salía esta derivada. Mismo trato que la tabla
  // —guarda a dónde volver— porque se entra desde dos situaciones distintas del
  // mismo ejercicio: habiéndolo acertado, y estando trabado en él.
  | { kind: "porque"; back: Slide }
  // Lo que pasó en el juego mientras jugabas. Va DESPUÉS del ranking: primero
  // el marcador propio, después el mundo.
  | { kind: "novedades" }
  // El chat. Como configuración y la tabla, guarda de dónde se vino: se entra
  // desde cualquier pantalla que tenga cabecera y se vuelve exactamente ahí.
  | { kind: "chat"; back: Slide }
  // `back` solo viaja cuando la persona abrió la diapo ella misma: ahí interrumpió
  // algo y hay que devolvérselo. Cuando la dispara un hito no hay a dónde volver,
  // porque llega después de responder y lo que sigue es la derivada siguiente.
  | {
      kind: "cafecito"
      trigger: CafecitoTrigger
      correctToday: number
      back?: Slide
    }
  // Reclutar por WhatsApp. Mismo trato que la del cafecito: `back` solo viaja
  // cuando la abrió la persona, porque ahí interrumpió algo que hay que
  // devolverle; cuando sale por hito llega después de responder y lo que sigue
  // es la derivada siguiente.
  | { kind: "reclutas"; trigger: ReclutasTrigger; back?: Slide }

// El tinte de fondo de café/reclutas, de pantalla completa (ver el `motion.div`
// debajo de la grilla, más abajo). Antes vivía adentro de la caja de la propia
// diapo (CafecitoPanel/ReclutasPanel con `fullBleed={false}`, que es como los
// sigue dibujando escritorio); acá se pinta afuera, detrás de TODA la diapo, y
// por eso sobrevive al cambio de `slideSeq` en vez de remontarse con él: así
// motion lo desliza de un color al otro en vez de pegarlo de golpe.
//
// `color-mix(in oklab, ...)` —que es como se ve la misma mezcla en la card de
// escritorio— no se puede animar: motion lo trata como texto y el color salta
// en vez de correrse (mismo motivo por el que cafecito-panel.tsx mezcla a mano
// en rgb para el aura del slider). Por eso acá la mezcla se escribe en rgba
// crudo, con el mismo 12% que usaba la card.
const TINTE_ALPHA = 0.12
function hexToRgb(hex: string): readonly [number, number, number] {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
const tintaDe = (hex: string) => `rgba(${hexToRgb(hex).join(", ")}, ${TINTE_ALPHA})`
const SIN_TINTE = "rgba(0, 0, 0, 0)"

function fondoDeSlide(kind: Slide["kind"]): string {
  if (kind === "cafecito") return tintaDe(CAFE)
  if (kind === "reclutas") return tintaDe(VERDE)
  return SIN_TINTE
}

// Cuántas novedades sin ver hacen falta para frenar a alguien y mostrárselas.
//
// El pedido era "cada vez que haya novedades", y ese número es 1 — pero con la
// actividad del juego corriendo hay eventos casi todo el tiempo, así que con 1
// la pantalla aparecería después de CADA respuesta y dejaría de ser una novedad
// para ser un peaje. Con tres, la interrupción llega cuando de verdad pasó algo
// y el resto del tiempo el juego no se detiene.
//
// Es la perilla de esta feature: subirlo la hace más rara, bajarlo más
// frecuente.
const NOVEDADES_MINIMAS = 3

// El "gancho" post-respuesta que queda pendiente de mostrar tras el Continuar.
type PendingAfter = { answer: GameAnswer } | null

// La barra de arriba: configuración a la izquierda, compartir y cafecito a la
// derecha. Va en las pantallas donde se está JUGANDO —el ejercicio y el
// ranking—, que son las dos entre las que se rebota todo el tiempo: si estuviera
// solo en una, la mitad del juego se pasa sin poder tocar ninguna de las tres.
// En las pantallas de trámite (registro, carrera, cafecito) no está a propósito:
// ahí lo que hay que hacer es eso y nada más.
function GameHeader({
  onSettings,
  onTable,
  onChat,
  sinLeerChat = 0,
  onCafecito,
  onReclutar,
}: {
  onSettings: () => void
  // Abre el chat. En el teléfono no hay tecla, así que este botón ES el acceso.
  onChat: () => void
  sinLeerChat?: number
  // La tabla va PRIMERA de las tres de la derecha: es la única que hace algo
  // adentro del juego, y las otras dos sacan de él. Puesta al final quedaba
  // agrupada con las que se van.
  onTable: () => void
  // Abre la diapo del cafecito. Vive acá arriba y no adentro del botón porque
  // hay que saber a qué pantalla volver, y eso solo lo sabe quien lo monta.
  onCafecito: () => void
  // Ídem, para la diapo de reclutar.
  onReclutar: () => void
}) {
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
        <TableButton open={false} onToggle={onTable} keyboard={false} />
        <ChatButton open={false} onToggle={onChat} sinLeer={sinLeerChat} keyboard={false} />
        <ShareButton placement="header_mobile" onOpen={onReclutar} />
        <CafecitoButton
          placement="header_mobile"
          // Manda a la diapo del cafecito en vez de a Cafecito directo. Se
          // recuerda desde dónde se vino para volver ahí al salir.
          onOpen={() => onCafecito()}
        />
      </span>
    </div>
  )
}

export function MobileFlow({ intro }: { intro: GameIntro }) {
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

  const [slide, setSlide] = useState<Slide>({ kind: "intro" })
  const [slideSeq, setSlideSeq] = useState(0)
  // La hoja de "¿Qué pasa con mis datos?" de la slide de registro. Afuera del
  // stack de slides a propósito: se superpone a lo que sea que esté mostrando
  // en ese momento, como en el onboarding principal (onboarding-wizard.tsx).
  const [legalOpen, setLegalOpen] = useState(false)
  const [exercise, setExercise] = useState<GameExercise | null>(null)
  const [lastAnswer, setLastAnswer] = useState<GameAnswer | null>(null)
  // La derivada que la persona escribió, cuando estuvo bien: la caja del
  // enunciado pasa a mostrarla en vez de pedirla.
  const [solvedLatex, setSolvedLatex] = useState<string | null>(null)
  // Este ejercicio ya se erró alguna vez. No sale de `lastAnswer`: ese se borra
  // apenas la persona toca una tecla, y el ¿Por qué? tiene que seguir puesto
  // mientras corrige.
  const [fallado, setFallado] = useState(false)
  const explainMutation = useExplainExercise()
  const [porqueTexto, setPorqueTexto] = useState<string | null>(null)
  // El gráfico de cierre (f y f' juntas): solo lo pinta el teléfono, ver
  // porque-panel.tsx :: PorQueGraph. Va aparte de `porqueTexto` y no adentro
  // —son dos piezas de la misma respuesta, pero el texto ya tenía su propio
  // ciclo de vida antes de que existiera el gráfico—.
  const [porqueGraph, setPorqueGraph] = useState<PorQueGraph | null>(null)
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

  // Cuando termina el conteo: recién ahí el ranking estrena orden y sube.
  const onBurstComplete = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: gameKeys.leaderboard })
    setClimbFrom(pendingClimbRef.current)
    pendingClimbRef.current = null
  }, [queryClient])

  const {
    liveXp,
    counting,
    xpColor,
    release: releaseXp,
    fire: fireXp,
  } = useXpConteo({ onComplete: onBurstComplete })

  // Late cada 10 s y refresca el ranking solo si alguien respondió algo. Se
  // pausa mientras dura el conteo: ahí el orden viejo tiene que quedarse quieto.
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

  // La dirección del próximo pase. Vive en estado y no en el `Slide` porque no
  // es una propiedad de la pantalla sino del MOVIMIENTO: la misma pantalla se
  // puede alcanzar avanzando o volviendo.
  const [direccion, setDireccion] = useState<Direccion>("adelante")

  const goTo = useCallback((s: Slide, hacia: Direccion = "adelante") => {
    setDireccion(hacia)
    setSlide(s)
    setSlideSeq((n) => n + 1)
  }, [])

  // La tabla se consultó en ESTE ejercicio. Va en un ref y no en estado porque
  // solo se lee al responder: que cambie no tiene por qué redibujar nada. Es el
  // mismo mecanismo que en escritorio (desktop-layout.tsx :: peekedRef).
  //
  // Y NO es opcional que esté: mirar la tabla baja la XP del ejercicio a un
  // puñado y saltea el ajuste de Elo. Sin esto, el teléfono tendría la tabla
  // gratis mientras el escritorio la paga —y los dos comparten el mismo
  // ranking, así que sería una ventaja de plataforma.
  const peekedRef = useRef(false)

  // Las novedades del juego. Se consultan siempre —el mismo latido que en
  // escritorio— para que en el momento de decidir el dato ya esté y no haya que
  // esperar una request con la persona mirando una pantalla en blanco.
  const eventos = useGameEvents(true)

  // El id de la última novedad que esta persona YA VIO. Arranca en null y se fija
  // con la primera lista que llega: lo que pasó antes de sentarse a jugar no es
  // novedad para nadie.
  //
  // Estado y no un ref, y se ajusta durante el render: es el patrón que React
  // documenta para acomodar estado cuando cambian los datos de afuera, y además
  // el lint del compilador no deja leer un ref mientras se renderiza.
  const [visto, setVisto] = useState<number | null>(null)
  const novedades = eventos.data?.events ?? []
  const ultimoId =
    novedades.length > 0 ? Math.max(...novedades.map((e) => e.id)) : null
  if (visto === null && ultimoId !== null) setVisto(ultimoId)
  const sinVer = visto === null ? 0 : novedades.filter((e) => e.id > visto).length

  // Lo mismo para el chat, con su propio contador: las novedades y los mensajes
  // se miran en pantallas distintas, así que haber leído unas no es haber leído
  // los otros.
  const [vistoChat, setVistoChat] = useState<number | null>(null)
  const mensajes = eventos.data?.messages ?? []
  const ultimoMensajeId =
    mensajes.length > 0 ? Math.max(...mensajes.map((m) => m.id)) : null
  if (vistoChat === null && ultimoMensajeId !== null) setVistoChat(ultimoMensajeId)
  const sinVerChat =
    vistoChat === null ? 0 : mensajes.filter((m) => m.id > vistoChat).length

  // Espejo para los handlers. `advanceAfterAnswer` está memoizada y este número
  // cambia con cada latido de las novedades: en sus dependencias la rehacía cada
  // ocho segundos, y con ella todo lo que cuelga. Es el mismo recurso que ya usa
  // el estado de la tabla en escritorio.
  const sinVerRef = useRef(0)
  useEffect(() => {
    sinVerRef.current = sinVer
  })

  // Sin `useCallback`: se llama solo desde un onClick y necesita la slide de
  // AHORA para saber a dónde volver. Memoizada tendría que llevar `slide` en las
  // dependencias, o sea rehacerse igual en cada cambio.
  const verTabla = () => {
    peekedRef.current = true
    goTo({ kind: "tabla", back: slide })
  }

  // Poner en pantalla un ejercicio que ya llegó. Se separó de `loadNext` porque
  // ahora hay dos formas de conseguirlo —el pedido de siempre y el adelantado—
  // y las dos tienen que dejar la pantalla exactamente igual.
  //
  // El reloj y la telemetría de "servido" viven ACÁ y no en el adelanto: si se
  // sellaran al pedirlo, el `response_ms` de cada respuesta se comería los
  // segundos del festejo y dejaría de ser comparable con game_attempts.
  const servir = useCallback(
    (data: GameExercise, { adelantado }: { adelantado: boolean }) => {
      setExercise(data)
      setLastAnswer(null)
      setTonoLocal(null)
      setClimbFrom(null)
      // Ejercicio nuevo, cuenta limpia: la consulta anterior no lo penaliza.
      peekedRef.current = false
      // El ¿Por qué? era de la derivada anterior.
      setPorqueTexto(null)
      setPorqueGraph(null)
      setSolvedLatex(null)
      setFallado(false)
      servedAtRef.current = Date.now()
      inputRef.current?.clear()
      posthog.capture("game_exercise_served", {
        tier: data.tier,
        exercise_id: data.exercise_id,
        stars: data.difficulty_stars,
        keys: data.keys.length,
        new_keys: data.new_keys.length,
        // Sin esto no hay forma de saber en PostHog si el adelanto sirvió, ni
        // de probar que no infló el `response_ms`.
        adelantado,
      })
      goTo({ kind: "exercise" })
      adelantoServido()
    },
    [goTo, adelantoServido],
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
        .catch(() => {
          next.mutate(undefined, { onSuccess: (data) => servir(data, { adelantado: false }) })
        })
    },
    [next, consumirAdelanto, servir],
  )

  // Lo que hace el botón Continuar de la intro: a la primera derivada, salvo
  // que este dispositivo esté entrando por primera vez y el jugador siga con
  // el @ que le tocó al azar — ahí primero pasa por la slide de "elegí tu @".
  const startFromIntro = useCallback(() => {
    if (player?.is_guest && player.alias_is_generated && isFirstVisit) {
      goTo({ kind: "username" })
      return
    }
    loadNext()
  }, [player, isFirstVisit, loadNext, goTo])

  // Después de resolver (o del ranking/hito/cafecito), decide la próxima slide.
  const advanceAfterAnswer = useCallback(
    (
      consumed:
        | "ranking"
        | "novedades"
        | "milestone"
        | "cafecito"
        | "reclutas"
        | null,
    ) => {
      const pending = pendingRef.current
      if (!pending) {
        loadNext()
        return
      }
      const a = pending.answer

      // Toda correcta pasa por el ranking: ahí está el marcador y ahí sube el
      // número. Las erradas siguen de largo al próximo ejercicio.
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
        // El conteo arranca ACÁ, en el toque, y no cuando la slide del ranking
        // termina de entrar. Los dos pases corren juntos: la pantalla entra
        // mientras el conteo agota su media espera, y para cuando el ranking se
        // asienta el número empieza a subir. Esperar al final del pase para
        // recién ahí empezar a esperar dejaba casi un segundo de nada entre el
        // dedo y el festejo.
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

      // Recién salido del ranking: si mientras jugaba pasaron cosas, se muestran
      // antes de seguir. Va acá y no antes del ranking porque el orden importa —
      // primero el marcador propio, que es la consecuencia de LO QUE ACABA DE
      // HACER, y después el mundo.
      if (consumed === "ranking" && sinVerRef.current >= NOVEDADES_MINIMAS) {
        goTo({ kind: "novedades" })
        return
      }

      if (consumed === null || consumed === "ranking" || consumed === "novedades") {
        // La universidad va ANTES que el cafecito, siempre. La diapo del café
        // ofrece multiplicar el XP "de toda tu universidad": sin universidad no
        // tiene qué ofrecer, y lo que quedaba era una pantalla que pedía algo y
        // de paso pedía otra cosa primero.
        //
        // Por eso este hito no espera solamente a las cinco resueltas: si el
        // cafecito quiere salir antes, se adelanta y ocupa su turno.
        if (
          faltaPreguntarUniversidad &&
          (tocaCafecito || solvedCount >= HITO_PERFIL)
        ) {
          askedProfileRef.current = true
          posthog.capture("game_register_slide_shown", { slide: "career" })
          goTo({ kind: "profile" })
          return
        }
        if (
          solvedCount >= HITO_REGISTRO &&
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
      // Reclutar va DESPUÉS del café en el orden de este ladder, pero antes en el
      // tiempo: el primero sale a las diez resueltas y el primer café a las
      // veinte. Nunca compiten en la misma respuesta —el cooldown que comparten
      // no lo permite— así que quién está escrito primero acá no cambia nada.
      if (consumed !== "reclutas" && tocaReclutar(totalCorrectas)) {
        marcarReclutasMostrado(totalCorrectas)
        goTo({ kind: "reclutas", trigger: "hito" })
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
        // Si se miró la tabla, este ejercicio paga menos y no mueve el Elo. Lo
        // decide el servidor; acá solo se le cuenta lo que pasó.
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
            // tasa de acierto. Viajaba en el cuerpo del pedido pero no en el
            // evento, así que el corte existía en escritorio y no acá — justo
            // en la plataforma donde la tabla se abre con un botón.
            peeked: peekedRef.current,
            solved: solvedCount,
            combo: data.combo,
            xp: data.xp_awarded,
            multiplier: data.xp_multiplier,
            response_ms: Date.now() - servedAtRef.current,
          })
          if (!data.parse_ok) return
          // Sobrevive a que `lastAnswer` se borre al primer tecleo.
          if (data.correct) setSolvedLatex(latex)
          else setFallado(true)
          if (data.correct) {
            if (!anticipadoRef.current) sfx.correct()
            // Acá y en ningún otro lado: acertar es lo único que cierra un
            // ejercicio, así que este es el primer instante en que pedir el
            // siguiente devuelve uno nuevo. Alcanza y sobra con lo que tarda la
            // slide del ranking.
            adelantar()
            setSolvedCount((n) => n + 1)
            pendingRef.current = { answer: data }
            // Modo `espera` porque el número que tiene que subir está en la
            // pantalla siguiente: la XP ya existe, pero contarla acá sería
            // contarla donde no se ve. Queda guardada hasta el Continuar.
            //
            // Y por eso mismo acá no hay orbes, que es lo que sí hay en
            // escritorio: no se puede mostrar algo volando hacia un contador que
            // está en otra pantalla sin mentir sobre dónde estuvo la XP mientras
            // tanto.
            fireXp(data, { modo: "espera" })
            if (data.is_record) posthog.capture("game_record", { best_rank: data.best_rank })
          } else {
            if (!anticipadoRef.current) sfx.wrong()
            // Acá había una rama para el ejercicio que se cerraba sin acertar
            // —al quemar el segundo intento— que dejaba el pase al ranking
            // preparado igual. Ese estado ya no existe: los intentos son
            // ilimitados y solo acertar cierra un ejercicio. Salir sin
            // resolverlo es saltear, que sigue su propio camino.
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
            // El 409 dice que el servidor venció lo que teníamos servido, así
            // que un ejercicio adelantado contra ese estado ya no vale.
            descartarAdelanto()
            loadNext({ fresco: true })
          }
        },
      },
    )
  }, [exercise, answerMutation, sfx, solvedCount, fireXp, evaluarLocal, loadNext, adelantar, descartarAdelanto])

  const closed = lastAnswer?.parse_ok === true && (lastAnswer.correct || lastAnswer.attempts_left === 0)
  // La respuesta del servidor manda; el tono local solo cubre el hueco entre el
  // toque y su llegada.
  const tone = answerTone(lastAnswer) ?? tonoLocal

  // El botón del ¿Por qué? existe cuando ya hay algo para explicar: se acertó, o
  // se erró al menos una vez. Nunca antes del primer intento — ahí sería regalar
  // la respuesta, y el servidor lo rechaza igual (409 en POST /explain).
  const hayPorque = solvedLatex !== null || fallado

  // Pedir el texto. Suelto de la navegación porque el botón de reintentar, que
  // vive DENTRO de la pantalla del ¿Por qué?, tiene que volver a pedirlo sin
  // navegar a ninguna parte.
  const pedirPorque = useCallback(() => {
    if (!exercise) return
    // Una sola vez por ejercicio: el texto no cambia y volver a pedirlo sería
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
  }, [exercise, explainMutation, porqueTexto])

  const abrirPorque = useCallback(() => {
    if (!exercise) return
    sfx.select()
    posthog.capture("game_porque_open", {
      exercise_id: exercise.exercise_id,
      tier: exercise.tier,
      stars: exercise.difficulty_stars,
      // Lo que hay que poder contestar después: si lo abre quien ya resolvió
      // —curiosidad— o quien está trabado —ayuda—, porque no son la misma
      // persona ni la misma función del botón.
      was_correct: solvedLatex !== null,
    })
    pedirPorque()
    goTo({ kind: "porque", back: { kind: "exercise" } })
  }, [exercise, goTo, pedirPorque, sfx, solvedLatex])

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
          peekedRef.current = false
          setPorqueTexto(null)
          setPorqueGraph(null)
          setSolvedLatex(null)
          setFallado(false)
          servedAtRef.current = Date.now()
          inputRef.current?.clear()
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
            // El 409 dice que el servidor venció lo que teníamos servido, así
            // que un ejercicio adelantado contra ese estado ya no vale.
            descartarAdelanto()
            loadNext({ fresco: true })
          }
        },
      },
    )
  }, [exercise, closed, skipMutation, answerMutation.isPending, solvedCount, loadNext, descartarAdelanto])

  // Todo menos el logo espera a que la presentación lo devuelva a su lugar.
  const chromeStyle: React.CSSProperties = {
    opacity: intro.chromeVisible ? 1 : 0,
    transition: "opacity 0.5s ease-in-out",
  }

  const startDisabled = player === null || next.isPending || !intro.done

  return (
    <div className="relative grid h-dvh overflow-hidden">
      {/* El tinte de café/reclutas, de pantalla completa. Vive FUERA del
          `AnimatePresence` de abajo —a propósito—: ese árbol remonta un
          `motion.div` por cada diapo (por eso tiene `key={slideSeq}`), y
          remontado el tinte pegaría un salto de color en vez de correrse. Este
          en cambio es un solo elemento para toda la sesión de juego, así que
          `animate` anima la MISMA instancia de un color al otro cada vez que
          cambia `slide.kind`. Ver `fondoDeSlide`.

          `col-start-1 row-start-1` y NO `absolute inset-0`: la grilla de acá
          arriba tiene un solo lugar, y ese mismo truco es el que usa el
          `motion.div` de la diapo para superponerse en ese lugar sin salirse
          del flujo. Con `absolute` este tinte pasaba a ser un elemento
          POSICIONADO, y el orden de pintado de CSS pinta TODO lo posicionado
          por encima de todo lo que no lo es —pase lo que pase en el HTML—, así
          que terminaba tapando la diapo entera (botones incluidos) en vez de
          quedar detrás. Sin `absolute`, los dos son ítems de grilla comunes y
          pintan en el orden en que aparecen acá: este primero, la diapo
          después, encima. */}
      <motion.div
        aria-hidden
        className="pointer-events-none col-start-1 row-start-1"
        animate={{ backgroundColor: fondoDeSlide(slide.kind) }}
        transition={SLIDE_TRANSITION}
      />
      <AnimatePresence mode="sync" initial={false} custom={direccion}>
        <motion.div
          key={slideSeq}
          custom={direccion}
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
                  onClick={startFromIntro}
                >
                  Continuar
                </Button>
              </div>
            </div>
          )}

          {slide.kind === "username" && player && (
            <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 pb-[var(--cta-pb)]">
              <UsernameSlide player={player} onDone={loadNext} />
            </div>
          )}

          {slide.kind === "exercise" && exercise && (
            <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-3 px-4 pb-[var(--cta-pb)] pt-3">
              <GameHeader
                onSettings={() => {
                  sfx.select()
                  goTo({ kind: "settings", back: { kind: "exercise" } })
                }}
                onTable={() => {
                  sfx.select()
                  verTabla()
                }}
                onChat={() => {
                  sfx.select()
                  goTo({ kind: "chat", back: { kind: "exercise" } })
                }}
                sinLeerChat={sinVerChat}
                onCafecito={() => {
                  sfx.select()
                  goTo({ kind: "cafecito", trigger: "pedido", correctToday: 0 })
                }}
                onReclutar={() => {
                  sfx.select()
                  goTo({ kind: "reclutas", trigger: "pedido" })
                }}
              />
              {/* Cambiar de ejercicio SIN cambiar de pantalla —o sea, saltear—
                  desliza la card y entra la derivada nueva por la derecha, con
                  la llave de siempre: el id del ejercicio. En escritorio el
                  mismo gesto es un volteo 3D (desktop-layout.tsx) y acá no,
                  porque acá todo se mueve de costado.

                  Solo se ve al saltear, y es a propósito. Después de responder
                  se pasa por el ranking, así que el ejercicio siguiente entra
                  con el deslizamiento de la slide y esta caja se monta de cero
                  —y `AnimatePresence` con `initial={false}` no anima la primera
                  cara—. Dos transiciones encimadas se leerían como un tirón. */}
              <SlideHorizontal
                llave={String(exercise.exercise_id)}
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
                  // Sin explosión de por medio —los orbes son de escritorio,
                  // acá el contador está en otra pantalla— el intercambio es
                  // inmediato: donde se pedía la derivada, ahora está.
                  solvedLatex={solvedLatex}
                >
                  <div className={cn("flex flex-col gap-2", PANEL_CONTENT)}>
                    <AnswerField
                      tone={tone}
                      seq={answerSeq}
                      // Resuelto el ejercicio, el campo entero se convierte en
                      // el botón del «¿Por qué?» — mismo mecanismo que en
                      // escritorio (ver desktop-layout.tsx), ahora también acá:
                      // ocupa el mismo lugar y mide lo mismo que el campo que
                      // reemplaza, así que nada se mueve al aparecer y es
                      // donde el pulgar ya estaba. `font-bold` porque, a
                      // diferencia del ¿Por qué? del pie —secundario, al lado
                      // de Saltear—, acá es la única acción posible y tiene
                      // que pesar como el Continuar que reemplazó.
                      hint={
                        solvedLatex !== null ? (
                          <PorQueButton
                            onClick={abrirPorque}
                            className={`${CAMPO_MIN_H} h-auto w-full rounded-lg font-bold`}
                            // Siempre, y no solo si `fallado`: mismo criterio
                            // que en escritorio (ver desktop-layout.tsx) — acá
                            // ya no avisa un error puntual, es LA invitación a
                            // leer la explicación.
                            wrong
                          />
                        ) : undefined
                      }
                    >
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
              </SlideHorizontal>
              {/* Los botones quedan FUERA del deslizamiento: no son parte del
                  ejercicio, y moverlos dejaría un instante sin dónde tocar. */}
              <div className="flex items-stretch gap-2">
                {/* Acertada, la pregunta ya se mudó adentro del campo (ver el
                    `hint` de AnswerField, arriba) y el pie queda para el solo
                    Continuar. Esto es para el otro cierre posible: se agotaron
                    los intentos sin acertar, así que no hay campo-botón que la
                    reemplace y el ¿Por qué? tiene que seguir apareciendo acá. */}
                {closed && hayPorque && solvedLatex === null && (
                  <PorQueButton onClick={abrirPorque} wrong />
                )}
                <AnswerButton
                  className="flex-1"
                  tone={tone}
                  seq={answerSeq}
                  closed={closed}
                  disabled={answerMutation.isPending || (closed && (next.isPending || esperandoAdelanto))}
                  onClick={() => {
                    if (closed) advanceAfterAnswer(null)
                    else void onRevisar()
                  }}
                />
                {/* En el medio de los tres, igual que en escritorio (ver el
                    comentario del mismo pie en desktop-layout.tsx). En una
                    pantalla de 375 px los tres quedan al filo —medido: 327 px de
                    tinta contra 343 disponibles— así que este va `min-w-0` y con
                    menos aire lateral: el que tiene que entrar entero sí o sí es
                    Revisar. */}
                {!closed && hayPorque && (
                  <PorQueButton onClick={abrirPorque} className="min-w-0 px-3" wrong={fallado} />
                )}
                {!closed && (
                  <SkipButton
                    disabled={skipMutation.isPending || answerMutation.isPending}
                    onClick={onSkip}
                  />
                )}

              </div>
            </div>
          )}

          {slide.kind === "porque" && (
            <div className="mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col gap-3 px-4 pb-[var(--cta-pb)] pt-4">
              <PorQuePanel
                explanation={porqueTexto}
                isPending={explainMutation.isPending}
                isError={explainMutation.isError}
                onRetry={pedirPorque}
                graph={porqueGraph}
              />
              {/* Igual que la tabla: volver es un botón de ancho completo abajo
                  de todo, donde está el pulgar. Lo que sigue después de leer NO
                  es siempre lo mismo — si el ejercicio ya se acertó, sigue el
                  ranking con el festejo esperando; si sigue abierto, sigue el
                  ejercicio, con lo que se había escrito donde estaba. Por eso el
                  rótulo cambia: prometer "Continuar" para volver al mismo
                  problema sería mentir. */}
              <Button
                size="lg"
                className={ctaCls}
                onClick={() => {
                  sfx.select()
                  // Lo mismo que haría el Continuar del ejercicio: con una
                  // correcta esperando, lo que sigue es el ranking y el festejo.
                  if (pendingRef.current) {
                    advanceAfterAnswer(null)
                    return
                  }
                  goTo(slide.back, "atras")
                }}
              >
                {/* `solvedLatex` y no `pendingRef`: dicen lo mismo —hay una
                    correcta esperando el pase al ranking— pero un ref no se
                    puede leer durante el render, y este rótulo es render. */}
                {solvedLatex !== null ? "Continuar" : "Volver al ejercicio"}
              </Button>
            </div>
          )}

          {slide.kind === "ranking" && (
            <RankingSlide
              answer={slide.answer}
              climbFrom={climbFrom}
              liveXp={liveXp}
              counting={counting}
              xpColor={xpColor}
              myUniversity={player?.university ?? null}
              enabled={player !== null}
              onRelease={releaseXp}
              onChat={() => {
                sfx.select()
                goTo({ kind: "chat", back: slide })
              }}
              sinLeerChat={sinVerChat}
              onContinue={() => advanceAfterAnswer("ranking")}
              continueDisabled={next.isPending || esperandoAdelanto}
              onCafecito={() => {
                sfx.select()
                goTo({ kind: "cafecito", trigger: "pedido", correctToday: 0 })
              }}
              onReclutar={() => {
                sfx.select()
                goTo({ kind: "reclutas", trigger: "pedido", back: slide })
              }}
              onSettings={() => {
                sfx.select()
                goTo({ kind: "settings", back: slide })
              }}
              onTable={() => {
                sfx.select()
                verTabla()
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
                  // cualquier otra pantalla se vuelve a la misma. Y se vuelve
                  // HACIA ATRÁS, por lo mismo que la tabla: cerrar no es avanzar.
                  if (back.kind !== "exercise") goTo(back, "atras")
                  else if (exercise) goTo(back, "atras")
                  else loadNext()
                }}
                onReset={() => {
                  refetchPlayer()
                  // Reiniciar VENCE el ejercicio servido del lado del server, así
                  // que el que hay acá ya no existe para nadie: se suelta y se
                  // pide otro. Sin esto quedaba en pantalla una derivada vencida
                  // y tanto Revisar como Saltear respondían 409 para siempre.
                  setExercise(null)
                  setLastAnswer(null)
                  setTonoLocal(null)
                  setClimbFrom(null)
                  pendingRef.current = null
                  // Reiniciar vence TODO lo servido, también lo adelantado.
                  descartarAdelanto()
                  loadNext({ fresco: true })
                }}
                onCafecito={() =>
                  goTo({
                    kind: "cafecito",
                    trigger: "pedido",
                    correctToday: 0,
                    back: slide,
                  })
                }
                onShare={() => goTo({ kind: "reclutas", trigger: "pedido", back: slide })}
                onNeedsRegister={() => goTo({ kind: "register" })}
              />
            </div>
          )}

          {slide.kind === "tabla" && (
            <div className="mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col gap-3 px-4 pb-[var(--cta-pb)] pt-4">
              {/* La MISMA tabla que en escritorio, sin una copia para el
                  teléfono: es una lista de reglas y no cambia con el aparato.
                  Scrollea sola adentro de su caja. */}
              <DerivativesTable />
              {/* Volver es un botón de ancho completo y no una flecha arriba:
                  esta pantalla se abre en medio de un ejercicio y lo que se
                  quiere es salir rápido con el pulgar, que está abajo. */}
              <Button
                size="lg"
                className={ctaCls}
                onClick={() => {
                  sfx.select()
                  const back = slide.back
                  // "atras": esta pantalla no lleva a ninguna parte, se sale de
                  // ella. Si volviera con el pase de siempre, el ejercicio al que
                  // se regresa entraría como si fuera uno nuevo.
                  if (back.kind !== "exercise") goTo(back, "atras")
                  else if (exercise) goTo(back, "atras")
                  else loadNext()
                }}
              >
                Volver
              </Button>
            </div>
          )}

          {slide.kind === "novedades" && (
            <div className="mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col gap-3 px-4 pb-[var(--cta-pb)] pt-4">
              {/* La misma barra que en el ejercicio y en el ranking, en vez de
                  un título. Un "Mientras jugabas…" ocupaba un renglón para decir
                  algo que las novedades ya dicen solas, y de paso esta pantalla
                  quedaba siendo la única sin salida hacia configuración, el
                  cafecito o compartir. */}
              <GameHeader
                onSettings={() => {
                  sfx.select()
                  goTo({ kind: "settings", back: slide })
                }}
                onTable={() => {
                  sfx.select()
                  verTabla()
                }}
                onChat={() => {
                  sfx.select()
                  goTo({ kind: "chat", back: slide })
                }}
                sinLeerChat={sinVerChat}
                onCafecito={() => {
                  sfx.select()
                  goTo({ kind: "cafecito", trigger: "pedido", correctToday: 0 })
                }}
                onReclutar={() => {
                  sfx.select()
                  goTo({ kind: "reclutas", trigger: "pedido", back: slide })
                }}
              />
              {/* El MISMO historial que en escritorio. Allá vive apretado abajo
                  del botón; acá tiene la pantalla entera, que es lo que en el
                  teléfono le faltaba para poder leerse. */}
              <EventFeed enabled paginado className="min-h-0 flex-1" />
              <Button
                size="lg"
                className={ctaCls}
                onClick={() => {
                  sfx.select()
                  // Leídas: la próxima vez solo frenan las que pasen de acá en
                  // más. Se marca al SALIR y no al entrar por si alguien cierra
                  // la pestaña con la pantalla abierta.
                  if (ultimoId !== null) setVisto(ultimoId)
                  advanceAfterAnswer("novedades")
                }}
              >
                Seguir
              </Button>
            </div>
          )}

          {slide.kind === "chat" && (
            <div className="mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col gap-3 px-4 pb-[var(--cta-pb)] pt-3">
              {/* La misma cabecera que en todas las demás: desde el chat se
                  puede ir a cualquier lado sin volver primero. */}
              <GameHeader
                onSettings={() => {
                  sfx.select()
                  goTo({ kind: "settings", back: slide })
                }}
                onTable={() => {
                  sfx.select()
                  verTabla()
                }}
                onChat={() => {}}
                onCafecito={() => {
                  sfx.select()
                  goTo({ kind: "cafecito", trigger: "pedido", correctToday: 0 })
                }}
                onReclutar={() => {
                  sfx.select()
                  goTo({ kind: "reclutas", trigger: "pedido", back: slide })
                }}
              />
              <ChatPanel enabled={player !== null} className="min-h-0 flex-1" />
              <Button
                size="lg"
                className={ctaCls}
                onClick={() => {
                  sfx.select()
                  // Leídos al SALIR y no al entrar, igual que las novedades: si
                  // alguien cierra la pestaña con el chat abierto, lo que no
                  // llegó a leer le sigue esperando.
                  if (ultimoMensajeId !== null) setVistoChat(ultimoMensajeId)
                  goTo(slide.back, "atras")
                }}
              >
                Volver
              </Button>
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
                onOpenPrivacy={() => setLegalOpen(true)}
              />
            </div>
          )}

          {slide.kind === "cafecito" && (
            <div className="mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col px-5 pb-[var(--cta-pb)] pt-4">
              {/* Sin `keyboard`: el botón de seguir igual espera sus diez
                  segundos —la espera es para leer, no para el teclado— pero acá
                  no hay tecla que mostrar ni atajo que ofrecer. */}
              <ConSalidaAbajo>
                {({ salida, accion }) => (
                  <CafecitoPanel
                    trigger={slide.trigger}
                    correctToday={slide.correctToday}
                    university={player?.university ?? null}
                    solved={solvedCount}
                    slotSalida={salida}
                    slotAccion={accion}
                    onPickUniversity={() =>
                      goTo({ kind: "settings", back: slide })
                    }
                    onContinue={() => {
                      // La diapo que abrió la persona interrumpió lo que estaba
                      // haciendo y hay que devolvérselo; la que dispara un hito
                      // llega DESPUÉS de responder, y ahí sí toca seguir.
                      // Y va "atras", que es lo que hace que salir se vea como
                      // salir: la diapo se corre para el otro lado y devuelve la
                      // pantalla de donde vino, en vez de entrar como una nueva.
                      if (slide.trigger !== "pedido")
                        advanceAfterAnswer("cafecito")
                      else goTo(slide.back ?? { kind: "exercise" }, "atras")
                    }}
                    fullBleed
                    className="flex-none"
                  />
                )}
              </ConSalidaAbajo>
            </div>
          )}

          {slide.kind === "reclutas" && (
            <div className="mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col px-5 pb-[var(--cta-pb)] pt-4">
              {/* Con la lista adentro, al revés que en escritorio. Allá el
                  ranking de al lado se conmuta a "Reclutas" y la muestra; acá el
                  ranking es otra diapo, así que si la lista no viajara con esta
                  el "10% de lo que sumen" sería una frase sin nada que mirar. */}
              <ConSalidaAbajo>
                {({ salida, accion }) => (
                  <ReclutasPanel
                    trigger={slide.trigger}
                    conLista
                    slotSalida={salida}
                    slotAccion={accion}
                    onContinue={() => {
                      // Igual que la del café: la que abrió la persona
                      // interrumpió algo y hay que devolvérselo; la que salió por
                      // hito llega después de responder, y ahí toca seguir.
                      if (slide.trigger !== "pedido")
                        advanceAfterAnswer("reclutas")
                      else goTo(slide.back ?? { kind: "exercise" }, "atras")
                    }}
                    fullBleed
                    className="flex-none"
                  />
                )}
              </ConSalidaAbajo>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
      <LegalSheet open={legalOpen} onOpenChange={setLegalOpen} />
    </div>
  )
}

// La slide del festejo: es la que TIENE el número que sube, así que también es
// la que garantiza que el conteo empiece. Lo larga el toque en Continuar, y esta
// slide lo vuelve a intentar al montarse por si se llegó por otro camino.
function RankingSlide({
  answer,
  climbFrom,
  liveXp,
  counting,
  xpColor,
  myUniversity,
  enabled,
  onRelease,
  onChat,
  sinLeerChat,
  onContinue,
  continueDisabled,
  onSettings,
  onTable,
  onCafecito,
  onReclutar,
}: {
  answer: GameAnswer
  climbFrom: number | null
  liveXp: number | null
  counting: boolean
  xpColor: string | null
  myUniversity: string | null
  enabled: boolean
  onRelease: () => void
  onChat: () => void
  sinLeerChat: number
  onContinue: () => void
  continueDisabled: boolean
  onSettings: () => void
  onTable: () => void
  onCafecito: () => void
  onReclutar: () => void
}) {
  // Red de seguridad, no el disparo: quien larga el conteo es el toque en
  // Continuar (ver advanceAfterAnswer), para que corra durante el pase. Esto
  // cubre cualquier camino que llegue al ranking sin pasar por ahí, y si ya se
  // largó no hace nada.
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
      <GameHeader
        onSettings={onSettings}
        onTable={onTable}
        onChat={onChat}
        sinLeerChat={sinLeerChat}
        onCafecito={onCafecito}
        onReclutar={onReclutar}
      />
      {/* Sin cartel de "+21 de experiencia" arriba: el XP ya se ve —y mejor—
          como el número de la fila propia prendiéndose y subiendo. Un renglón
          que dice lo que la animación está mostrando le saca alto al ranking,
          que es a lo que se vino. */}
      <GameRanking
        climbFrom={climbFrom}
        enabled={enabled}
        liveXp={liveXp}
        counting={counting}
        xpColor={xpColor}
        myUniversity={myUniversity}
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
