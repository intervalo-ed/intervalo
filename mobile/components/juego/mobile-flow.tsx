// El flujo del juego en la app: el par de web/src/app/derivadas/mobile-flow.tsx.
// La navegación es la misma —una diapo por vez, de derecha a izquierda, y la
// escalera de después de responder sale de dx-core (`despuesDeResponder`)—.
// Existen de verdad la portada, las herramientas, el ejercicio, la tabla, el
// «¿Por qué?», las estadísticas, el chat, la configuración, el ranking, el @,
// las reglas, las novedades, el perfil y el registro. El resto de los escalones
// se ven como «próximamente» y su Continuar retoma la escalera sin correr los
// `marcar*`, así vuelven a salir el día que la diapo exista.
//
// El campo de la respuesta es un WebView y montarlo cuesta segundos: vive UNA
// vez en la capa del ejercicio, que no se desmonta nunca. Ir a la tabla o al
// «¿Por qué?» corre esa capa fuera de la pantalla y vuelve a traerla; un
// ejercicio nuevo es `clear()` sobre el mismo campo.

import { useCallback, useEffect, useRef, useState } from "react"
import { KeyboardAvoidingView, StyleSheet, Text, View } from "react-native"
import { router } from "expo-router"
import { StatusBar } from "expo-status-bar"
import * as Haptics from "expo-haptics"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useQueryClient } from "@tanstack/react-query"
import { ApiError } from "@intervalo/dx-core/api/client"
import { AMBAR, TEMA } from "@intervalo/dx-core/juego/game-colors"
import { HINT_MOBILE } from "@intervalo/dx-core/juego/campo-matematico"
import {
  despuesDeResponder,
  type EntradaDespuesDeResponder,
} from "@intervalo/dx-core/juego/despues-de-responder"
import { readFrecuenciaRanking } from "@intervalo/dx-core/juego/ranking-frecuencia"
import { memoriaEnBlanco, type MemoriaDelRanking } from "@intervalo/dx-core/juego/ranking-orden"
import type { RankingView } from "@intervalo/dx-core/juego/ranking-formato"
import { ALL_SCOPE } from "@intervalo/dx-core/juego/ranking-scope"
import { SIN_SCOPE } from "@intervalo/dx-core/juego/ranking-reglas"
import { marcarReglasMostradas } from "@intervalo/dx-core/juego/reglas-trigger"
import { marcarRegistroMostrado } from "@intervalo/dx-core/juego/hitos-del-juego"
import { puedeVerEstadisticas } from "@intervalo/dx-core/juego/stats-gate"
import { vistaInicialDelRanking } from "@intervalo/dx-core/juego/vuelta-universitaria"
import { estimarXp } from "@intervalo/dx-core/juego/xp-estimate"
import { useXpConteo } from "@intervalo/dx-core/juego/UseXpConteo"
import { useNovedades } from "@intervalo/dx-core/juego/UseNovedades"
import { useDespuesDelArranque } from "@intervalo/dx-core/juego/UseDespuesDelArranque"
import {
  refrescarRankingCentrado,
  useGameEvents,
  useGamePulse,
  useGameUniversityLeaderboard,
  useMyBoost,
} from "@intervalo/dx-core/juego/UseGameLeaderboard"
import { parseAnswerToMathJson } from "@intervalo/dx-core/juego/parse-answer"
import { useLocalVerdict } from "@intervalo/dx-core/juego/UseLocalVerdict"
import { useExplainExercise } from "@intervalo/dx-core/juego/UseGameExplain"
import { graficoDelExplain, type PorQueGraph } from "@intervalo/dx-core/juego/porque"
import { comboTrasIntento } from "@intervalo/dx-core/juego/racha-estimate"
import { gameKeys, type GamePlayer } from "@intervalo/dx-core/juego/game-keys"
import type { Key } from "@intervalo/dx-core/juego/teclado"
import {
  useAnswerExercise,
  useEjercicioAdelantado,
  useNextExercise,
  useSkipExercise,
  type GameAnswer,
  type GameExercise,
} from "@intervalo/dx-core/juego/UseGameExercise"
import { ESCALA_MATE, Latex } from "@/components/latex/latex"
import { track } from "@/lib/analytics/track"
import { useGameIdentity } from "@/lib/analytics/UseGameIdentity"
import { useSfx, useTick } from "@/lib/audio/UseSfx"
import { useGamePlayer } from "@/lib/juego/UseGamePlayer"
import { useAutoplay, type ControlDelJuego } from "@/lib/juego/UseAutoplay"
import { abrirPrivacidad } from "@/lib/legal"
import { BotonCta } from "./boton-cta"
import { ChatPanel } from "./chat-panel"
import { CapaDeslizante, PASE_MS, type Direccion } from "./capa-deslizante"
import { DerivativesTable } from "./derivatives-table"
import { EstadisticasSlide } from "./elo-stats-panel"
import {
  AnswerButton,
  AnswerField,
  BannerDelVeredicto,
  CAMPO_MIN_H,
  ExerciseCard,
  PorQueButton,
  VERDE_ACIERTO,
  answerTone,
  type AnswerTone,
} from "./exercise-card"
import { GameHeader } from "./game-header"
import { HerramientasSlide } from "./herramientas-slide"
import { IntroSlide } from "./intro-slide"
import { MathField, type MathFieldHandle } from "./math-field"
import { MathKeyboard, type EtiquetaDeTecla } from "./math-keyboard"
import { NovedadesSlide } from "./novedades-slide"
import { PerfilSlides } from "./perfil-slides"
import { PieRampa } from "./pie-rampa"
import { PorQuePanel } from "./porque-panel"
import { ProximamenteSlide } from "./proximamente-slide"
import { RankingSlide } from "./ranking-slide"
import { RegistroSlide } from "./registro-slide"
import { ReglasSlide } from "./reglas-slide"
import { SettingsPanel } from "./settings-panel"
import { UsernameSlide } from "./username-slide"

// Los escalones de la escalera que todavía no tienen diapo. Cada uno ocupa el
// lugar del `kind` homónimo del `Slide` de la web.
type PasoPendiente =
  | "instalar"
  | "notificaciones"
  | "cafecito"
  | "reclutas"
  | "frecuencia"
  | "encuesta"
  | "opinion"
  | "repetitividad"

type Slide =
  | { kind: "intro" }
  | { kind: "herramientas" }
  | { kind: "exercise" }
  // `back` es a dónde vuelve al cerrar, como en la web.
  | { kind: "tabla"; back: Slide }
  | { kind: "porque"; back: Slide }
  | { kind: "stats"; back: Slide }
  | { kind: "chat"; back: Slide }
  | { kind: "settings"; back: Slide }
  | { kind: "profile" }
  | { kind: "register" }
  | { kind: "ranking"; answer: GameAnswer }
  | { kind: "username" }
  | { kind: "reglas"; cuales: number[] }
  | { kind: "novedades" }
  | { kind: "proximamente"; paso: PasoPendiente }

type EnPila = { seq: number; slide: Slide }

type PendingAfter = { answer: GameAnswer } | null

// La etiqueta de cada tecla en LaTeX, como la web con KaTeX: el glifo ocupa la
// tecla a su cuerpo (`.katex` a 1em), y `Latex` dibuja a ESCALA_MATE del suyo.
function etiquetaDeTecla({ key, ancha, color, fontSize }: EtiquetaDeTecla) {
  const crudo = ancha && key.texWide ? key.texWide : key.tex
  // `\boldsymbol` es de un paquete que el MathJax de la app no carga; el
  // `\mathbf` de base da el mismo trazo grueso en + − ·.
  const tex = crudo?.replace(/\\boldsymbol\{/g, "\\mathbf{")
  if (tex === undefined) return <Text style={{ color, fontSize }}>{key.texto}</Text>
  return <Latex tex={tex} size={fontSize / ESCALA_MATE} color={color} />
}

let montajesDelCampo = 0

export function MobileFlow({ auto }: { auto?: string }) {
  const insets = useSafeAreaInsets()
  const { player, refetch: refetchPlayer } = useGamePlayer()
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

  const [pila, setPila] = useState<EnPila[]>([{ seq: 0, slide: { kind: "intro" } }])
  const [direccion, setDireccion] = useState<Direccion>("adelante")
  const slide = pila[pila.length - 1].slide

  const [exercise, setExercise] = useState<GameExercise | null>(null)
  const [lastAnswer, setLastAnswer] = useState<GameAnswer | null>(null)
  const [solvedLatex, setSolvedLatex] = useState<string | null>(null)
  const [fallado, setFallado] = useState(false)
  const explainMutation = useExplainExercise()
  const [porqueTexto, setPorqueTexto] = useState<string | null>(null)
  const [porqueGraph, setPorqueGraph] = useState<PorQueGraph | null>(null)
  const [tonoLocal, setTonoLocal] = useState<AnswerTone>(null)
  const anticipadoRef = useRef(false)
  // Si el festejo (el conteo, guardado hasta Continuar) YA se armó por el
  // veredicto local: `anticipadoRef` también es true con un "incorrecto".
  const festejoAdelantadoRef = useRef(false)
  const rachaAdelantadaRef = useRef(false)
  const rachaPrevioRef = useRef<{ combo: number; exercises_attempted: number } | null>(null)
  const [answerSeq, setAnswerSeq] = useState(0)
  const [primerIntento, setPrimerIntento] = useState(true)
  // El enunciado se desliza solo al saltear (ver PromptBox).
  const [deslizar, setDeslizar] = useState(false)
  const [altoPie, setAltoPie] = useState(0)
  const inputRef = useRef<MathFieldHandle>(null)
  const servedAtRef = useRef(0)
  const enPantallaRef = useRef<number | null>(null)
  const pendingRef = useRef<PendingAfter>(null)
  const pendingClimbRef = useRef<number | null>(null)
  const attemptRef = useRef(0)
  const peekedRef = useRef(false)
  // El @ se pide una vez por sesión: la condición de verdad es del servidor
  // (`alias_is_generated`) y esto cubre la PATCH que falla por red.
  const askedUsernameRef = useRef(false)
  // Una sola vez por visita: saltearlos no los vuelve a pedir hasta la próxima
  // sesión (en la app, hasta cerrar sesión: la web ahí recarga).
  const askedProfileRef = useRef(false)
  const askedRegisterRef = useRef(false)
  // Las reglas se anotan en el almacén (reglas-trigger.ts); esto cubre el rato
  // entre que se muestran y se anotan.
  const reglasMostradasRef = useRef(false)
  // TODO(M5): los «próximamente» no corren sus `marcar*`, así que dos
  // disparadores pueden turnarse para siempre (reclutas → opinión →
  // reclutas…). Si la escalera vuelve a un «próximamente» ya mostrado en esta
  // respuesta, la respuesta se da por terminada. Se va con la última diapo.
  const pendientesEnEstaRespuestaRef = useRef(new Set<PasoPendiente>())

  const [climbFrom, setClimbFrom] = useState<number | null>(null)
  // Lo que el ranking se acuerda entre una diapo y otra: la diapo se remonta
  // con cada navegación, así que vive acá. Se reinicia una vez por derivada.
  const memoriaRanking = useRef<MemoriaDelRanking>(memoriaEnBlanco())
  // En estado y no en el ref porque es el estado inicial del ranking y se lee
  // en el render.
  const [scopeRanking, setScopeRanking] = useState<{ view: RankingView; university: string }>({
    view: "individual",
    university: ALL_SCOPE,
  })
  const leerMemoriaRanking = useCallback(() => memoriaRanking.current, [])
  const guardarMemoriaRanking = useCallback((m: MemoriaDelRanking) => {
    memoriaRanking.current = m
  }, [])

  // Cuando termina el conteo: recién ahí el ranking estrena orden y sube.
  const onBurstComplete = useCallback(() => {
    void refrescarRankingCentrado(queryClient)
    setClimbFrom(pendingClimbRef.current)
    pendingClimbRef.current = null
  }, [queryClient])

  const tick = useTick()
  const {
    liveXp,
    xpSumada: liveXpDelta,
    counting,
    xpColor,
    release: releaseXp,
    fireProvisional: fireXpProvisional,
    reconcile: reconcileXp,
    abort: abortXp,
  } = useXpConteo({ tick, color: VERDE_ACIERTO, onComplete: onBurstComplete })

  // Los precalentamientos, después de lo urgente del arranque (como la web).
  const arrancado = useDespuesDelArranque()
  // El latido del ranking, quieto mientras dura el conteo.
  useGamePulse({ enabled: player !== null && arrancado, paused: counting })
  // La lista de universidades tibia desde el arranque, para que la primera
  // vuelta universitaria no caiga sobre un esqueleto.
  useGameUniversityLeaderboard(SIN_SCOPE, player !== null && arrancado)
  const boost = useMyBoost(player?.university)

  // Las novedades se consultan siempre, para que el dato ya esté al decidir.
  const eventos = useGameEvents(arrancado)
  const { sinVer, sinVerChat, marcarVisto, marcarVistoChat } = useNovedades({ data: eventos.data })
  // Espejo para `advanceAfterAnswer`, que está memoizada.
  const sinVerRef = useRef(0)
  useEffect(() => {
    sinVerRef.current = sinVer
  })

  useGameIdentity(player)

  useEffect(() => {
    track("game_start", { is_guest: player?.is_guest ?? true, layout: "mobile" })
    // Solo al montar, como en la web.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Como el `slideSeq` de la web, pero las diapos que salen se quedan en la
  // pila hasta que terminan de irse.
  const seqRef = useRef(0)
  const goTo = useCallback((s: Slide, hacia: Direccion = "adelante") => {
    const seq = ++seqRef.current
    setDireccion(hacia)
    setPila((p) => [...p, { seq, slide: s }])
    setTimeout(() => setPila((p) => p.filter((e) => e.seq >= seq)), PASE_MS + 40)
  }, [])

  const verTabla = () => {
    peekedRef.current = true
    goTo({ kind: "tabla", back: slide })
  }

  // A partir de la derivada 3 (stats-gate.ts). La tabla enriquecida muestra las
  // fórmulas CON derivada: mirarla cuenta como mirar la tabla (`peeked`).
  const estadisticasDisponibles = puedeVerEstadisticas(player)
  const verEstadisticas = () => {
    peekedRef.current = true
    track("game_stats_open", { exercises_correct: player?.exercises_correct ?? 0, layout: "mobile" })
    goTo({ kind: "stats", back: slide })
  }

  const servir = useCallback(
    (data: GameExercise, { adelantado }: { adelantado: boolean }) => {
      enPantallaRef.current = data.exercise_id
      setExercise(data)
      setLastAnswer(null)
      setTonoLocal(null)
      setClimbFrom(null)
      setDeslizar(false)
      peekedRef.current = false
      setPorqueTexto(null)
      setPorqueGraph(null)
      setSolvedLatex(null)
      setFallado(false)
      servedAtRef.current = Date.now()
      attemptRef.current = 0
      setPrimerIntento(true)
      inputRef.current?.clear()
      track("game_exercise_served", {
        tier: data.tier,
        exercise_id: data.exercise_id,
        stars: data.difficulty_stars,
        keys: data.keys.length,
        new_keys: data.new_keys.length,
        adelantado,
      })
      goTo({ kind: "exercise" })
      adelantoServido()
    },
    [goTo, adelantoServido],
  )

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

  // El chasquido del Continuar, con la misma guardia contra el doble que la web.
  const ultimoChasquidoRef = useRef(0)
  const chasquido = useCallback(() => {
    const ahora = Date.now()
    if (ahora - ultimoChasquidoRef.current < 150) return
    ultimoChasquidoRef.current = ahora
    sfx.continue()
  }, [sfx])
  // Las diapos que ya tocaron su propio sonido avisan antes del embudo.
  const yaSono = useCallback(() => {
    ultimoChasquidoRef.current = Date.now()
  }, [])

  const veredicto = useCallback(
    (correcto: boolean) => {
      if (correcto) {
        sfx.correct()
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      } else {
        sfx.wrong()
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      }
    },
    [sfx],
  )

  const startFromIntro = useCallback(() => {
    track("game_intro_done", { layout: "mobile" })
    chasquido()
    if ((player?.exercises_attempted ?? 0) === 0) {
      goTo({ kind: "herramientas" })
      return
    }
    loadNext()
  }, [loadNext, player, goTo, chasquido])

  const advanceAfterAnswer = useCallback(
    (entrada: EntradaDespuesDeResponder) => {
      chasquido()
      const pending = pendingRef.current
      if (!pending) {
        loadNext()
        return
      }
      const a = pending.answer
      const totalCorrectas = a.exercises_correct

      const despues = despuesDeResponder({
        entrada,
        respuesta: a,
        jugador: player,
        yaPreguntoUsername: askedUsernameRef.current,
        reglasMostradas: reglasMostradasRef.current,
        yaPreguntoPerfil: askedProfileRef.current,
        yaPreguntoRegistro: askedRegisterRef.current,
        sinVer: sinVerRef.current,
        frecuenciaRanking: readFrecuenciaRanking(),
        // La app no tiene cafecito ni pedido de instalar ni avisos web.
        cafecito: null,
        puedeOfrecerInstalar: false,
        puedeOfrecerNotificaciones: false,
      })

      // Sin la diapo del ranking, el festejo que la esperaba se desarma y el
      // ranking se refresca para que la próxima vez ya tenga el puesto nuevo.
      if (despues.saltaRanking) {
        abortXp()
        pendingClimbRef.current = null
        void refrescarRankingCentrado(queryClient)
      }

      switch (despues.paso) {
        case "ranking":
          if (despues.subida !== null) {
            pendingClimbRef.current = despues.subida.desde
            track("game_rank_change", {
              from: despues.subida.desde,
              to: despues.subida.hasta,
              delta: despues.subida.delta,
            })
          }
          // El conteo arranca en el toque, mientras la diapo entra.
          releaseXp()
          // El único lugar donde nace una diapo de ranking nueva, y por eso el
          // único donde su memoria se reinicia.
          memoriaRanking.current = memoriaEnBlanco()
          // La vuelta universitaria se decide eligiendo la vista inicial.
          setScopeRanking({
            view: vistaInicialDelRanking(a.exercises_correct, player?.university ?? null),
            university: ALL_SCOPE,
          })
          goTo({ kind: "ranking", answer: a })
          return
        case "username":
          askedUsernameRef.current = true
          goTo({ kind: "username" })
          return
        case "reglas":
          reglasMostradasRef.current = true
          marcarReglasMostradas(totalCorrectas)
          goTo({ kind: "reglas", cuales: despues.cuales })
          return
        case "novedades":
          goTo({ kind: "novedades" })
          return
        case "perfil":
          askedProfileRef.current = true
          track("game_register_slide_shown", { slide: "career" })
          goTo({ kind: "profile" })
          return
        case "registro":
          askedRegisterRef.current = true
          marcarRegistroMostrado(totalCorrectas)
          track("game_register_slide_shown", { slide: "register" })
          goTo({ kind: "register" })
          return
        case "siguiente-ejercicio":
          pendingRef.current = null
          loadNext()
          return
        default:
          if (pendientesEnEstaRespuestaRef.current.has(despues.paso)) {
            pendingRef.current = null
            loadNext()
            return
          }
          pendientesEnEstaRespuestaRef.current.add(despues.paso)
          goTo({ kind: "proximamente", paso: despues.paso })
      }
    },
    [goTo, loadNext, player, chasquido, abortXp, releaseXp, queryClient],
  )

  // El @ no es un escalón: es una pausa ADENTRO del del ranking, así que se
  // retoma como `"ranking"`. Desde la portada (sin respuesta pendiente) sigue
  // la primera derivada.
  const usernameListo = useCallback(() => {
    yaSono()
    if (pendingRef.current) advanceAfterAnswer("ranking")
    else loadNext()
  }, [yaSono, advanceAfterAnswer, loadNext])
  // Volvió de Google: en la web la recarga saca a la persona de la diapo; acá
  // sigue como el @, con su chasquido (no sonó ningún `continue`).
  const usernameConGoogle = () => {
    if (pendingRef.current) advanceAfterAnswer("ranking")
    else loadNext()
  }

  // El perfil y el registro retoman la escalera como `"milestone"`. El
  // registro también se abre desde Configuración, sin respuesta pendiente: ahí
  // vuelve al ejercicio (o pide uno), como la web.
  const perfilListo = () => {
    yaSono()
    void refetchPlayer()
    void queryClient.invalidateQueries({ queryKey: gameKeys.leaderboard })
    advanceAfterAnswer("milestone")
  }
  const registroListo = () => {
    if (pendingRef.current) advanceAfterAnswer("milestone")
    else if (exercise) goTo({ kind: "exercise" })
    else loadNext()
  }

  // Leídas al SALIR, por si alguien cierra la app con la pantalla abierta.
  const novedadesListas = () => {
    marcarVisto()
    marcarVistoChat()
    advanceAfterAnswer("novedades")
  }

  // Continuar de un «próximamente»: retoma la escalera con la entrada que
  // usaría la diapo de verdad (mobile-flow.tsx de la web, diapo por diapo).
  const continuarPendiente = (paso: PasoPendiente) => advanceAfterAnswer(paso)

  const herramientasListas = () => {
    chasquido()
    loadNext()
  }

  const revertirRacha = useCallback(() => {
    if (!rachaAdelantadaRef.current || !rachaPrevioRef.current) return
    const previoReal = rachaPrevioRef.current
    queryClient.setQueryData(gameKeys.me, (p: GamePlayer | undefined) =>
      p === undefined ? p : { ...p, ...previoReal },
    )
    rachaAdelantadaRef.current = false
  }, [queryClient])

  const evaluarLocal = useLocalVerdict(exercise?.prompt_latex ?? null)

  const onRevisar = useCallback(() => {
    if (!exercise || answerMutation.isPending) return
    const latex = inputRef.current?.getLatex() ?? ""
    if (!latex.trim()) return
    const mathjson = parseAnswerToMathJson(latex)

    // El color, el sonido y la vibración salen acá si el veredicto local puede
    // decidirlo; XP, Elo y puesto siguen viniendo de `/answer`.
    attemptRef.current += 1
    const local = evaluarLocal(mathjson)
    anticipadoRef.current = local !== null
    if (local !== null) {
      setTonoLocal(local ? "correct" : "wrong")
      setPrimerIntento(attemptRef.current === 1)
      setAnswerSeq((n) => n + 1)
      veredicto(local)
      if (local) setSolvedLatex(latex)
      else setFallado(true)
    }
    // Racha e intentos, adelantados solo en el primer intento y con veredicto
    // confidente (game/router.py::_aplicar_elo).
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
    festejoAdelantadoRef.current = local === true
    if (local) {
      // El festejo queda armado (en espera) con una XP estimada desde el
      // veredicto local; `reconcileXp` la corrige con la de `/answer`.
      fireXpProvisional(
        estimarXp({
          attemptNumber: attemptRef.current,
          tier: exercise.tier,
          comboAfter: attemptRef.current === 1 && !peekedRef.current ? exercise.combo + 1 : 0,
          peeked: peekedRef.current,
        }),
        { modo: "espera" },
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
          setTonoLocal(null)
          if (!anticipadoRef.current) setAnswerSeq((n) => n + 1)
          rachaAdelantadaRef.current = false
          track("game_answer", {
            correct: data.correct,
            parse_ok: data.parse_ok,
            attempt: data.attempt_number,
            exercise_id: exercise.exercise_id,
            anticipated: anticipadoRef.current,
            tier: exercise.tier,
            stars: exercise.difficulty_stars,
            peeked: peekedRef.current,
            solved: data.exercises_correct,
            combo: data.combo,
            xp: data.xp_awarded,
            multiplier: data.xp_multiplier,
            response_ms: Date.now() - servedAtRef.current,
          })
          if (!data.parse_ok) {
            if (festejoAdelantadoRef.current) abortXp()
            // El servidor no lo contó como intento: la racha vuelve a mano.
            revertirRacha()
            if (local === true) setSolvedLatex(null)
            return
          }
          if (data.correct) {
            setSolvedLatex(latex)
          } else {
            setFallado(true)
            // Desacuerdo: el local dijo correcto y el servidor no.
            if (local === true) setSolvedLatex(null)
          }
          if (data.correct) {
            if (!anticipadoRef.current) veredicto(true)
            adelantar()
            pendingRef.current = { answer: data }
            pendientesEnEstaRespuestaRef.current = new Set()
            // En espera: el número que sube está en la diapo siguiente.
            if (!festejoAdelantadoRef.current) fireXpProvisional(data.xp_awarded, { modo: "espera" })
            reconcileXp(data)
            if (data.is_record) track("game_record", { best_rank: data.best_rank ?? null })
          } else {
            if (!anticipadoRef.current) veredicto(false)
            // Desacuerdo: se desarma el festejo que el local había armado.
            if (festejoAdelantadoRef.current) abortXp()
          }
        },
        onError: (err) => {
          if (err instanceof ApiError && err.status === 409) {
            if (enPantallaRef.current !== null && enPantallaRef.current !== exercise.exercise_id) {
              return
            }
            setExercise(null)
            setLastAnswer(null)
            setTonoLocal(null)
            if (festejoAdelantadoRef.current) abortXp()
            revertirRacha()
            descartarAdelanto()
            loadNext({ fresco: true })
          }
        },
      },
    )
  }, [
    exercise,
    answerMutation,
    veredicto,
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

  const closed =
    lastAnswer?.parse_ok === true && (lastAnswer.correct || lastAnswer.attempts_left === 0)
  const tone = answerTone(lastAnswer) ?? tonoLocal
  // Solo para lo visual: se cierra apenas el veredicto local dice "correcto".
  const cerradoVisual = closed || tonoLocal === "correct"

  // El ¿Seguro? se retira solo: a los 5 s o con el primer toque en cualquier
  // lugar de la pantalla (ver `onStartShouldSetResponderCapture` abajo).
  const limpiarBannerRef = useRef<(() => void) | null>(null)
  useEffect(() => {
    if (closed || tone !== "wrong") {
      limpiarBannerRef.current = null
      return
    }
    const limpiar = () => {
      limpiarBannerRef.current = null
      setLastAnswer(null)
      setTonoLocal(null)
    }
    limpiarBannerRef.current = limpiar
    const t = setTimeout(limpiar, 5000)
    return () => clearTimeout(t)
  }, [closed, tone])

  const hayPorque = solvedLatex !== null || fallado

  const pedirPorque = useCallback(() => {
    if (!exercise) return
    if (porqueTexto !== null || explainMutation.isPending) return
    explainMutation.mutate(
      { exercise_id: exercise.exercise_id },
      {
        onSuccess: (data) => {
          if (enPantallaRef.current !== null && enPantallaRef.current !== exercise.exercise_id) {
            return
          }
          setPorqueTexto(data.explanation)
          setPorqueGraph(graficoDelExplain(data))
        },
      },
    )
  }, [exercise, explainMutation, porqueTexto])

  const abrirPorque = useCallback(() => {
    if (!exercise) return
    sfx.select()
    track("game_porque_open", {
      exercise_id: exercise.exercise_id,
      tier: exercise.tier,
      stars: exercise.difficulty_stars,
      was_correct: solvedLatex !== null,
    })
    pedirPorque()
    goTo({ kind: "porque", back: { kind: "exercise" } })
  }, [exercise, goTo, pedirPorque, sfx, solvedLatex])

  const onSkip = useCallback(() => {
    if (!exercise || closed || skipMutation.isPending || answerMutation.isPending) return
    sfx.continue()
    track("game_skip", {
      tier: exercise.tier,
      stars: exercise.difficulty_stars,
      solved: player?.exercises_correct ?? 0,
      exercise_id: exercise.exercise_id,
    })
    const previoRacha = queryClient.getQueryData<GamePlayer>(gameKeys.me)
    if (previoRacha !== undefined) {
      rachaPrevioRef.current = {
        combo: previoRacha.combo,
        exercises_attempted: previoRacha.exercises_attempted,
      }
      rachaAdelantadaRef.current = true
      queryClient.setQueryData(gameKeys.me, { ...previoRacha, combo: 0 })
    }
    setDeslizar(true)
    skipMutation.mutate(
      { exercise_id: exercise.exercise_id },
      {
        onSuccess: (data) => {
          rachaAdelantadaRef.current = false
          enPantallaRef.current = data.exercise_id
          setExercise(data)
          setLastAnswer(null)
          setTonoLocal(null)
          peekedRef.current = false
          setPorqueTexto(null)
          setPorqueGraph(null)
          setSolvedLatex(null)
          setFallado(false)
          servedAtRef.current = Date.now()
          attemptRef.current = 0
          setPrimerIntento(true)
          inputRef.current?.clear()
          // Terminado el deslizamiento, la caja vuelve a cambiar sin moverse:
          // el próximo cambio de derivada llega con la pantalla entera.
          setTimeout(() => setDeslizar(false), PASE_MS + 40)
          track("game_exercise_served", {
            tier: data.tier,
            exercise_id: data.exercise_id,
            after_skip: true,
          })
        },
        onError: (err) => {
          setDeslizar(false)
          if (err instanceof ApiError && err.status === 409) {
            if (enPantallaRef.current !== null && enPantallaRef.current !== exercise.exercise_id) {
              return
            }
            setExercise(null)
            setLastAnswer(null)
            setTonoLocal(null)
            revertirRacha()
            descartarAdelanto()
            loadNext({ fresco: true })
          }
        },
      },
    )
  }, [
    sfx,
    exercise,
    closed,
    skipMutation,
    answerMutation.isPending,
    player?.exercises_correct,
    queryClient,
    revertirRacha,
    loadNext,
    descartarAdelanto,
  ])

  const onPrincipal = () => {
    if (closed) advanceAfterAnswer(null)
    else onRevisar()
  }

  const onKey = useCallback((key: Key) => {
    inputRef.current?.press(key)
  }, [])

  // Al ejercicio solo se vuelve si hay uno servido; a cualquier otra pantalla,
  // a la misma. Y HACIA ATRÁS: cerrar no es avanzar.
  const volverA = (back: Slide) => {
    if (back.kind !== "exercise") goTo(back, "atras")
    else if (exercise) goTo(back, "atras")
    else loadNext()
  }

  // Volver de la tabla, del «¿Por qué?», de las estadísticas o del chat.
  const volver = () => {
    if (
      slide.kind !== "tabla" &&
      slide.kind !== "porque" &&
      slide.kind !== "stats" &&
      slide.kind !== "chat"
    ) {
      return
    }
    sfx.select()
    if (slide.kind === "porque" && pendingRef.current) {
      advanceAfterAnswer(null)
      return
    }
    // Leídos al SALIR, como las novedades.
    if (slide.kind === "chat") {
      marcarVistoChat()
      goTo(slide.back, "atras")
      return
    }
    volverA(slide.back)
  }

  const cerrarConfiguracion = (back: Slide) => {
    void refetchPlayer()
    volverA(back)
  }

  // Lo que el reinicio y el cierre de sesión tiran: el ejercicio servido (y el
  // adelantado) quedan vencidos del lado del server.
  const soltarLoServido = () => {
    setExercise(null)
    setLastAnswer(null)
    setTonoLocal(null)
    setClimbFrom(null)
    memoriaRanking.current = memoriaEnBlanco()
    setScopeRanking({ view: "individual", university: ALL_SCOPE })
    pendingRef.current = null
    descartarAdelanto()
  }

  const onReset = () => {
    void refetchPlayer()
    soltarLoServido()
    loadNext({ fresco: true })
  }

  // La web recarga la página: acá se reinicia a mano lo que vive por sesión y se
  // vuelve a la portada, que espera al invitado nuevo.
  const onSignedOut = () => {
    soltarLoServido()
    abortXp()
    pendingClimbRef.current = null
    peekedRef.current = false
    askedUsernameRef.current = false
    askedProfileRef.current = false
    askedRegisterRef.current = false
    reglasMostradasRef.current = false
    pendientesEnEstaRespuestaRef.current = new Set()
    goTo({ kind: "intro" }, "atras")
  }

  // La barra de arriba, la misma en el ejercicio, el ranking, las novedades y
  // el chat. `desde` es a dónde vuelven configuración, estadísticas y chat.
  const cabecera = ({
    desde,
    conTabla = true,
    enChat = false,
  }: {
    desde: Slide
    conTabla?: boolean
    enChat?: boolean
  }) => (
    <GameHeader
      onSettings={() => {
        sfx.select()
        goTo({ kind: "settings", back: desde })
      }}
      onTable={
        conTabla
          ? () => {
              sfx.select()
              verTabla()
            }
          : undefined
      }
      onStats={
        estadisticasDisponibles
          ? () => {
              sfx.select()
              verEstadisticas()
            }
          : undefined
      }
      // En el chat, el botón está y no hace nada (como la web).
      onChat={
        enChat
          ? () => {}
          : () => {
              sfx.select()
              goTo({ kind: "chat", back: desde })
            }
      }
      chatSinVer={!enChat && sinVerChat > 0}
    />
  )

  const continueDisabled = next.isPending || esperandoAdelanto
  const principalDisabled =
    answerMutation.isPending || (closed && (next.isPending || esperandoAdelanto))

  const controlRef = useRef<ControlDelJuego | null>(null)
  useEffect(() => {
    if (!__DEV__) return
    controlRef.current = {
      estado: () => ({
        slide: slide.kind === "proximamente" ? `proximamente:${slide.paso}` : slide.kind,
        contando: counting,
        exerciseId: exercise?.exercise_id ?? null,
        tone,
        closed,
        ocupado:
          next.isPending || answerMutation.isPending || skipMutation.isPending || esperandoAdelanto,
        startDisabled: player === null || next.isPending,
        porqueListo: porqueTexto !== null || explainMutation.isError,
        montajes: montajesDelCampo,
        statsDisponibles: estadisticasDisponibles,
      }),
      tecla: onKey,
      escribir: (latex) => inputRef.current?.setValue(latex),
      principal: onPrincipal,
      saltear: onSkip,
      tabla: () => {
        sfx.select()
        verTabla()
      },
      porque: abrirPorque,
      // Los mismos caminos que los botones de la cabecera del ejercicio.
      configuracion: () => {
        sfx.select()
        goTo({ kind: "settings", back: slide })
      },
      estadisticas: () => {
        if (!estadisticasDisponibles) return
        sfx.select()
        verEstadisticas()
      },
      chat: () => {
        sfx.select()
        goTo({ kind: "chat", back: slide })
      },
      volver: () => {
        if (slide.kind !== "settings") return volver()
        sfx.select()
        cerrarConfiguracion(slide.back)
      },
      continuar: () => {
        if (slide.kind === "intro") startFromIntro()
        else if (slide.kind === "herramientas") herramientasListas()
        // El perfil y el registro se saltean («Ahora no»): nunca Google.
        else if (slide.kind === "profile") advanceAfterAnswer("milestone")
        else if (slide.kind === "register") registroListo()
        else if (slide.kind === "settings") cerrarConfiguracion(slide.back)
        else if (slide.kind === "stats" || slide.kind === "chat") volver()
        else if (slide.kind === "proximamente") continuarPendiente(slide.paso)
        else if (slide.kind === "ranking") advanceAfterAnswer("ranking")
        else if (slide.kind === "reglas") advanceAfterAnswer("reglas")
        else if (slide.kind === "novedades") novedadesListas()
        // Sin tocar el @: el mismo final que una PATCH que falla por red.
        else if (slide.kind === "username") usernameListo()
      },
    }
  })
  useAutoplay({ auto, control: controlRef })

  const enEjercicio = slide.kind === "exercise"
  const abajo = Math.max(insets.bottom, 16) + 8

  return (
    <View
      style={[styles.raiz, { paddingTop: insets.top }]}
      onStartShouldSetResponderCapture={() => {
        limpiarBannerRef.current?.()
        return false
      }}
    >
      <StatusBar style="light" />
      <View style={styles.escena}>
        <CapaDeslizante activa={enEjercicio} direccion={direccion} entrarAlMontar={false}>
          <View style={[styles.ejercicio, { paddingBottom: abajo }]}>
            {cabecera({ desde: { kind: "exercise" }, conTabla: false })}
            <View style={styles.marcoCard}>
              <ExerciseCard
                streak={player?.combo ?? 0}
                attempted={player?.exercises_attempted ?? 0}
                elo={player?.elo ?? null}
                exerciseId={exercise?.exercise_id ?? null}
                promptLatex={exercise?.prompt_latex ?? ""}
                solvedLatex={solvedLatex}
                deslizar={deslizar}
                onLongPressMarcador={__DEV__ ? () => router.push("/debug") : undefined}
              >
                <AnswerField
                  tone={tone}
                  seq={answerSeq}
                  hint={
                    solvedLatex !== null ? (
                      <PorQueButton onPress={abrirPorque} alto={CAMPO_MIN_H} style={{ flex: 1 }} />
                    ) : undefined
                  }
                >
                  <MathField
                    ref={inputRef}
                    tone={tone}
                    hint={HINT_MOBILE}
                    oculto={exercise === null}
                    onReady={({ mountToReadyMs }) => {
                      montajesDelCampo += 1
                      console.log(
                        `[juego] MathField listo · montaje #${montajesDelCampo} · ${Math.round(mountToReadyMs)} ms`,
                      )
                    }}
                    onEnter={({ skip }) => {
                      if (skip) onSkip()
                      else if (closed) advanceAfterAnswer(null)
                      else onRevisar()
                    }}
                    onChange={() => {
                      if (!closed && lastAnswer) setLastAnswer(null)
                      if (!closed && tonoLocal) setTonoLocal(null)
                    }}
                  />
                </AnswerField>
              </ExerciseCard>
              {/* Sigue montado con el ejercicio cerrado: sacarlo empujaría todo
                  lo de arriba justo cuando la persona va a tocar Continuar. */}
              <MathKeyboard
                keys={exercise?.keys}
                newKeys={exercise?.new_keys}
                fijas={exercise?.fijas}
                newFijas={exercise?.fijas_nuevas}
                onKey={onKey}
                renderEtiqueta={etiquetaDeTecla}
                apagado={cerradoVisual}
                areaSegura={false}
              />
            </View>
            <BannerDelVeredicto tone={tone} answer={lastAnswer} reservaAbajo={altoPie + abajo + 8} />
            <View style={styles.pie} onLayout={(e) => setAltoPie(e.nativeEvent.layout.height)}>
              <PieRampa
                cerradoVisual={cerradoVisual}
                skipDisabled={skipMutation.isPending || answerMutation.isPending}
                onTabla={() => {
                  sfx.select()
                  verTabla()
                }}
                onSaltear={onSkip}
              />
              <View style={styles.filaPrincipal}>
                {hayPorque && (!cerradoVisual || solvedLatex === null) && (
                  <PorQueButton onPress={abrirPorque} plano={!cerradoVisual} style={!cerradoVisual && { flex: 1 }} />
                )}
                <AnswerButton
                  tone={tone}
                  seq={answerSeq}
                  closed={cerradoVisual}
                  sinFlash={primerIntento}
                  disabled={principalDisabled}
                  onPress={onPrincipal}
                />
              </View>
            </View>
          </View>
        </CapaDeslizante>

        {pila.map(({ seq, slide: s }) => {
          if (s.kind === "exercise") return null
          const activa = seq === pila[pila.length - 1].seq
          return (
            <CapaDeslizante key={seq} activa={activa} direccion={direccion} entrarAlMontar={seq !== 0}>
              <View style={[styles.diapo, { paddingBottom: abajo }]}>
                {s.kind === "intro" && (
                  <IntroSlide onStart={startFromIntro} startDisabled={player === null || next.isPending} />
                )}
                {s.kind === "herramientas" && <HerramientasSlide onContinue={herramientasListas} />}
                {s.kind === "ranking" && (
                  <RankingSlide
                    answer={s.answer}
                    climbFrom={climbFrom}
                    // El salto se da por visto apenas arranca.
                    onSaltoArranca={() => setClimbFrom(null)}
                    leerMemoria={leerMemoriaRanking}
                    guardarMemoria={guardarMemoriaRanking}
                    scopeInicial={scopeRanking}
                    onScopeElegido={setScopeRanking}
                    liveXp={liveXp}
                    liveXpDelta={liveXpDelta}
                    counting={counting}
                    xpColor={xpColor && (boost?.multiplier ?? 1) > 1 ? AMBAR : xpColor}
                    myUniversity={player?.university ?? null}
                    enabled={player !== null}
                    onRelease={releaseXp}
                    onContinue={() => advanceAfterAnswer("ranking")}
                    continueDisabled={continueDisabled}
                    cabecera={cabecera({ desde: s })}
                  />
                )}
                {s.kind === "username" && player && (
                  <UsernameSlide
                    player={player}
                    onDone={usernameListo}
                    onGoogleLogin={usernameConGoogle}
                    onOpenPrivacy={() => void abrirPrivacidad()}
                  />
                )}
                {s.kind === "reglas" && (
                  <ReglasSlide cuales={s.cuales} onContinue={() => advanceAfterAnswer("reglas")} />
                )}
                {s.kind === "novedades" && (
                  <View style={styles.conCabecera}>
                    <View style={styles.cabecera}>{cabecera({ desde: s })}</View>
                    <NovedadesSlide player={player} onSeguir={novedadesListas} />
                  </View>
                )}
                {s.kind === "chat" && (
                  // `padding` y el desfase de la raíz, como las novedades.
                  <KeyboardAvoidingView
                    style={styles.conVolver}
                    behavior="padding"
                    keyboardVerticalOffset={insets.top}
                  >
                    {cabecera({ desde: s, enChat: true })}
                    <ChatPanel enabled={player !== null} player={player} />
                    <BotonCta texto="Volver" onPress={volver} />
                  </KeyboardAvoidingView>
                )}
                {s.kind === "stats" && <EstadisticasSlide player={player} onVolver={volver} />}
                {s.kind === "settings" && (
                  <SettingsPanel
                    player={player}
                    onClose={() => cerrarConfiguracion(s.back)}
                    onReset={onReset}
                    onNeedsRegister={() => goTo({ kind: "register" })}
                    onSignedOut={onSignedOut}
                    // La fila rota y guarda sola; sin callback no se dibuja.
                    onFrecuencia={() => {}}
                  />
                )}
                {s.kind === "profile" && (
                  <PerfilSlides onDone={perfilListo} onSkip={() => advanceAfterAnswer("milestone")} />
                )}
                {s.kind === "register" && player && (
                  <RegistroSlide
                    player={player}
                    onSkip={registroListo}
                    onLoggedIn={registroListo}
                    onOpenPrivacy={() => void abrirPrivacidad()}
                  />
                )}
                {s.kind === "proximamente" && (
                  <ProximamenteSlide
                    paso={s.paso}
                    disabled={continueDisabled}
                    onContinue={() => continuarPendiente(s.paso)}
                  />
                )}
                {s.kind === "tabla" && (
                  <View style={styles.conVolver}>
                    <DerivativesTable destacar={exercise?.tabla_slugs} style={{ flexShrink: 1 }} />
                    <View style={{ flex: 1 }} />
                    <BotonCta texto="Volver" onPress={volver} />
                  </View>
                )}
                {s.kind === "porque" && (
                  <View style={styles.conVolver}>
                    <PorQuePanel
                      explanation={porqueTexto}
                      isPending={explainMutation.isPending}
                      isError={explainMutation.isError}
                      onRetry={pedirPorque}
                      graph={porqueGraph}
                    />
                    <BotonCta texto={solvedLatex !== null ? "Continuar" : "Volver"} onPress={volver} />
                  </View>
                )}
              </View>
            </CapaDeslizante>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: TEMA.background },
  escena: { flex: 1, overflow: "hidden" },
  ejercicio: { flex: 1, gap: 12, paddingHorizontal: 16, paddingTop: 12 },
  marcoCard: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: TEMA.border,
    backgroundColor: TEMA.card,
    overflow: "hidden",
  },
  pie: { gap: 8, zIndex: 10 },
  filaPrincipal: { flexDirection: "row", gap: 8 },
  diapo: { flex: 1, paddingTop: 16 },
  conVolver: { flex: 1, gap: 12, paddingHorizontal: 16 },
  conCabecera: { flex: 1, gap: 12 },
  cabecera: { paddingHorizontal: 16 },
})
