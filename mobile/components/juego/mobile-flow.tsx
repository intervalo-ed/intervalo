// El flujo del juego en la app: el par de web/src/app/derivadas/mobile-flow.tsx.
// La navegación es la misma —una diapo por vez, de derecha a izquierda, y la
// escalera de después de responder sale de dx-core (`despuesDeResponder`)—
// pero de las diapos solo existen de verdad la portada, el ejercicio, la tabla
// y el «¿Por qué?». El resto de los escalones se ven como «próximamente» y su
// Continuar retoma la escalera sin correr los `marcar*` ni las refs del paso,
// así vuelven a salir el día que la diapo exista.
//
// El campo de la respuesta es un WebView y montarlo cuesta segundos: vive UNA
// vez en la capa del ejercicio, que no se desmonta nunca. Ir a la tabla o al
// «¿Por qué?» corre esa capa fuera de la pantalla y vuelve a traerla; un
// ejercicio nuevo es `clear()` sobre el mismo campo.

import { useCallback, useEffect, useRef, useState } from "react"
import { StyleSheet, Text, View } from "react-native"
import { router } from "expo-router"
import { StatusBar } from "expo-status-bar"
import * as Haptics from "expo-haptics"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useQueryClient } from "@tanstack/react-query"
import { ApiError } from "@intervalo/dx-core/api/client"
import { TEMA } from "@intervalo/dx-core/juego/game-colors"
import { HINT_MOBILE } from "@intervalo/dx-core/juego/campo-matematico"
import {
  despuesDeResponder,
  type EntradaDespuesDeResponder,
} from "@intervalo/dx-core/juego/despues-de-responder"
import { readFrecuenciaRanking } from "@intervalo/dx-core/juego/ranking-frecuencia"
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
import { useSfx } from "@/lib/audio/UseSfx"
import { useGamePlayer } from "@/lib/juego/UseGamePlayer"
import { useAutoplay, type ControlDelJuego } from "@/lib/juego/UseAutoplay"
import { BotonCta } from "./boton-cta"
import { CapaDeslizante, PASE_MS, type Direccion } from "./capa-deslizante"
import { DerivativesTable } from "./derivatives-table"
import {
  AnswerButton,
  AnswerField,
  BannerDelVeredicto,
  CAMPO_MIN_H,
  ExerciseCard,
  PorQueButton,
  answerTone,
  type AnswerTone,
} from "./exercise-card"
import { IntroSlide } from "./intro-slide"
import { MathField, type MathFieldHandle } from "./math-field"
import { MathKeyboard, type EtiquetaDeTecla } from "./math-keyboard"
import { PieRampa } from "./pie-rampa"
import { PorQuePanel } from "./porque-panel"
import { ProximamenteSlide } from "./proximamente-slide"

// Los escalones de la escalera (y la pantalla de herramientas de la portada)
// que todavía no tienen diapo. Cada uno ocupa el lugar del `kind` homónimo del
// `Slide` de la web.
type PasoPendiente =
  | "herramientas"
  | "ranking"
  | "username"
  | "reglas"
  | "novedades"
  | "perfil"
  | "registro"
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
  | { kind: "exercise" }
  // `back` es a dónde vuelve al cerrar, como en la web.
  | { kind: "tabla"; back: Slide }
  | { kind: "porque"; back: Slide }
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
  const { player } = useGamePlayer()
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
  const attemptRef = useRef(0)
  const peekedRef = useRef(false)
  // La diapo del @ todavía no existe, así que su `askedUsernameRef` no se
  // escribe. Esto es lo mínimo para que la escalera no la vuelva a ofrecer
  // dentro de la MISMA respuesta: se limpia con cada correcta nueva.
  const usernameEnEstaRespuestaRef = useRef(false)
  // Por lo mismo, los escalones que ya se mostraron como «próximamente» en
  // esta respuesta: sin sus `marcar*`, dos disparadores pueden turnarse para
  // siempre (reclutas → opinión → reclutas…). Si la escalera vuelve a uno, la
  // respuesta se da por terminada.
  const pasosEnEstaRespuestaRef = useRef(new Set<PasoPendiente>())

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

  const servir = useCallback(
    (data: GameExercise, { adelantado }: { adelantado: boolean }) => {
      enPantallaRef.current = data.exercise_id
      setExercise(data)
      setLastAnswer(null)
      setTonoLocal(null)
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
      goTo({ kind: "proximamente", paso: "herramientas" })
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

      const despues = despuesDeResponder({
        entrada,
        respuesta: a,
        jugador: player,
        yaPreguntoUsername: usernameEnEstaRespuestaRef.current,
        reglasMostradas: false,
        yaPreguntoPerfil: false,
        yaPreguntoRegistro: false,
        // TODO(M3): las novedades (`useGameEvents`) llegan con su diapo.
        sinVer: 0,
        frecuenciaRanking: readFrecuenciaRanking(),
        // La app no tiene cafecito ni pedido de instalar ni avisos web.
        cafecito: null,
        puedeOfrecerInstalar: false,
        puedeOfrecerNotificaciones: false,
      })

      // TODO(M3): sin la diapo del ranking no hay festejo que desarmar
      // (`abortXp`) ni ranking que refrescar (`refrescarRankingCentrado`).

      switch (despues.paso) {
        case "ranking":
          if (despues.subida !== null) {
            track("game_rank_change", {
              from: despues.subida.desde,
              to: despues.subida.hasta,
              delta: despues.subida.delta,
            })
          }
          // TODO(M3): `releaseXp`, la memoria y la vista inicial del ranking.
          goTo({ kind: "proximamente", paso: "ranking" })
          return
        case "siguiente-ejercicio":
          pendingRef.current = null
          loadNext()
          return
        default:
          if (pasosEnEstaRespuestaRef.current.has(despues.paso)) {
            pendingRef.current = null
            loadNext()
            return
          }
          pasosEnEstaRespuestaRef.current.add(despues.paso)
          goTo({ kind: "proximamente", paso: despues.paso })
      }
    },
    [goTo, loadNext, player, chasquido],
  )

  // Continuar de un «próximamente»: retoma la escalera con la entrada que
  // usaría la diapo de verdad (mobile-flow.tsx de la web, diapo por diapo).
  const continuarPendiente = (paso: PasoPendiente) => {
    switch (paso) {
      case "herramientas":
        chasquido()
        loadNext()
        return
      case "username":
        usernameEnEstaRespuestaRef.current = true
        if (pendingRef.current) advanceAfterAnswer("ranking")
        else loadNext()
        return
      case "perfil":
      case "registro":
        advanceAfterAnswer("milestone")
        return
      default:
        advanceAfterAnswer(paso)
    }
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
    // TODO(M3): el festejo optimista de XP (`fireXpProvisional`) es del ranking.

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
            usernameEnEstaRespuestaRef.current = false
            pasosEnEstaRespuestaRef.current = new Set()
            if (data.is_record) track("game_record", { best_rank: data.best_rank ?? null })
          } else if (!anticipadoRef.current) {
            veredicto(false)
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

  // Volver de la tabla o del «¿Por qué?».
  const volver = () => {
    if (slide.kind !== "tabla" && slide.kind !== "porque") return
    sfx.select()
    if (slide.kind === "porque" && pendingRef.current) {
      advanceAfterAnswer(null)
      return
    }
    const back = slide.back
    if (back.kind !== "exercise") goTo(back, "atras")
    else if (exercise) goTo(back, "atras")
    else loadNext()
  }

  const continueDisabled = next.isPending || esperandoAdelanto
  const principalDisabled =
    answerMutation.isPending || (closed && (next.isPending || esperandoAdelanto))

  const controlRef = useRef<ControlDelJuego | null>(null)
  useEffect(() => {
    if (!__DEV__) return
    controlRef.current = {
      estado: () => ({
        slide: slide.kind === "proximamente" ? `proximamente:${slide.paso}` : slide.kind,
        exerciseId: exercise?.exercise_id ?? null,
        tone,
        closed,
        ocupado:
          next.isPending || answerMutation.isPending || skipMutation.isPending || esperandoAdelanto,
        startDisabled: player === null || next.isPending,
        porqueListo: porqueTexto !== null || explainMutation.isError,
        montajes: montajesDelCampo,
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
      volver,
      continuar: () => {
        if (slide.kind === "intro") startFromIntro()
        else if (slide.kind === "proximamente") continuarPendiente(slide.paso)
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
})
