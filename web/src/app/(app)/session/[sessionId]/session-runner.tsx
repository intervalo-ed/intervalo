"use client"

import posthog from "posthog-js"
import ExerciseTable, { type TableTone } from "@/components/exercise-table"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Screen, ScreenBody, ScreenHeader } from "@/components/ui/screen"
import { useSfx } from "@/lib/audio/useSfx"
import { BASE_URL as API_BASE_URL } from "@/lib/api/client"
import { topicShortLabel } from "@/lib/catalog"
import { exerciseTypeInfo } from "@/lib/catalog/exercise-types"
import { latexVisualLength } from "@/lib/latex-visual-length"
import { clearSession } from "@/lib/session/storage"
import { cn } from "@/lib/utils"
import { Braces, ChevronLeft, Download, Eye, EyeOff, Flag, SkipForward, X } from "lucide-react"
import { animate, AnimatePresence, motion } from "motion/react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import type { KeyboardEvent, Ref } from "react"
import { useAnswer } from "./UseAnswer"
import { useSessionFeedback } from "./UseSessionFeedback"
import { useSessionPayload } from "./UseSessionPayload"
import { ReportPane } from "./report-pane"
import { isSurveyType, SurveyPane, type SurveyType } from "./survey-pane"
import type { SessionExercise } from "@/lib/api/types"

// Persistencia del feedback de test mode en localStorage: sobrevive recargas
// o cierres accidentales del tab durante una pasada larga de cientos de
// ítems. Vive fuera del componente porque no depende de nada de React.
type TestFeedbackState = {
  general: Record<number, string>
  distractors: Record<number, Record<number, string>>
  explanations: Record<number, string>
}
const EMPTY_TEST_FEEDBACK: TestFeedbackState = {
  general: {},
  distractors: {},
  explanations: {},
}
function testFeedbackStorageKey(sessionId: string) {
  return `intervalo:test-feedback:${sessionId}`
}
function loadTestFeedback(sessionId: string): TestFeedbackState {
  if (typeof window === "undefined") return EMPTY_TEST_FEEDBACK
  try {
    const raw = window.localStorage.getItem(testFeedbackStorageKey(sessionId))
    if (!raw) return EMPTY_TEST_FEEDBACK
    return { ...EMPTY_TEST_FEEDBACK, ...JSON.parse(raw) }
  } catch {
    return EMPTY_TEST_FEEDBACK
  }
}
function saveTestFeedback(sessionId: string, state: TestFeedbackState) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(testFeedbackStorageKey(sessionId), JSON.stringify(state))
}

// Documento markdown con todo el feedback acumulado en la pasada, para bajar
// desde el panel superior y pegarlo en el chat con Claude.
function buildFeedbackDocument({
  exercises,
  feedbackByIdx,
  distractorFbByIdx,
  explanationFbByIdx,
}: {
  exercises: SessionExercise[]
  feedbackByIdx: Record<number, string>
  distractorFbByIdx: Record<number, Record<number, string>>
  explanationFbByIdx: Record<number, string>
}) {
  const sections: string[] = []
  exercises.forEach((exercise, idx) => {
    const general = (feedbackByIdx[idx] ?? "").trim()
    const explanationFb = (explanationFbByIdx[idx] ?? "").trim()
    const distractorFb = distractorFbByIdx[idx] ?? {}
    const distractorEntries = Object.entries(distractorFb).filter(([, t]) => t.trim())
    if (!general && !explanationFb && distractorEntries.length === 0) return

    const lines: string[] = []
    lines.push(`## ${exercise.belt}/${exercise.topic}/${exercise.exercise_type} — ${exercise.external_id || exercise.id}`)
    lines.push("")
    lines.push("**Pregunta:**")
    lines.push(exercise.question)
    lines.push("")
    lines.push("**Opciones:**")
    exercise.options.forEach((opt, i) => {
      lines.push(`${i}. ${opt}${i === exercise.correct_index ? " ← correcta" : ""}`)
    })
    if (general) {
      lines.push("")
      lines.push("**Feedback general:**")
      lines.push(general)
    }
    for (const [i, t] of distractorEntries) {
      lines.push("")
      lines.push(`**Feedback sobre distractor ${i} (${exercise.options[Number(i)]}):**`)
      lines.push(t.trim())
    }
    if (explanationFb) {
      lines.push("")
      lines.push("**Feedback sobre la explicación:**")
      lines.push(explanationFb)
    }
    sections.push(lines.join("\n"))
  })

  const header =
    `# Feedback de test — ${sections.length} ítem${sections.length === 1 ? "" : "s"}\n` +
    `Generado: ${new Date().toISOString()}\n`
  return sections.length > 0 ? `${header}\n${sections.join("\n\n---\n\n")}\n` : `${header}\n(sin feedback todavía)\n`
}

function downloadFeedbackDocument({
  sessionId,
  exercises,
  feedbackByIdx,
  distractorFbByIdx,
  explanationFbByIdx,
}: {
  sessionId: string
  exercises: SessionExercise[]
  feedbackByIdx: Record<number, string>
  distractorFbByIdx: Record<number, Record<number, string>>
  explanationFbByIdx: Record<number, string>
}) {
  const doc = buildFeedbackDocument({
    exercises,
    feedbackByIdx,
    distractorFbByIdx,
    explanationFbByIdx,
  })
  const blob = new Blob([doc], { type: "text/markdown;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `intervalo-test-feedback-${sessionId}.md`
  a.click()
  URL.revokeObjectURL(url)
}

// Banner de agradecimiento tras enviar feedback: título (pool genérico,
// compartido entre canales) + subtítulo específico del canal (Core Drives del
// diseño — CD4 Alfred Effect para A/B, CD3/CD1 para reportes). El subtítulo de
// A y B además varía según si la respuesta fue "positiva" (justo/muy_facil,
// útil) o "negativa" (muy difícil, no útil): agradecer distinto ante una queja
// que ante un elogio. "¡Buen ojo!" es un título exclusivo de C, pareado
// siempre con el mismo subtítulo (no se combina al azar con los demás).
const THANKS_TITLES = ["¡Gracias!", "¡Recibido!", "¡Anotado!", "¡Listo!"]

const SURVEY_THANKS_A_POS = ["Esto nos ayuda a elegir mejor qué mostrarte."]
// D reusa este subconjunto: las dos líneas que no hablan de dificultad.
const SURVEY_THANKS_GENERIC_NEG = [
  "Esto nos ayuda a mejorar el ejercicio.",
  "Tomamos nota para ajustar lo que te mostramos.",
]
const SURVEY_THANKS_A_NEG = [
  "Nos ayuda a calibrar la dificultad de lo que te mostramos.",
  ...SURVEY_THANKS_GENERIC_NEG,
]
const SURVEY_THANKS_B_POS = [
  "Sabemos qué explicaciones funcionan gracias a vos.",
  "Nos ayuda a decidir qué explicaciones mantener.",
  "Ayudás a que más estudiantes entiendan este tema.",
]
const SURVEY_THANKS_B_NEG = [
  "Vamos a mejorar esta explicación.",
  "Nos ayuda a saber qué explicaciones reescribir.",
  "Ayudás a que la próxima explicación sea mejor.",
]
const REPORT_THANKS = [
  "Lo revisamos.",
  "Reportes como este mejoran el material para todos.",
  "Tu reporte queda en la cola de revisión.",
]
const REPORT_TITLE_SPECIAL = "¡Buen ojo!"
const REPORT_SUBTITLE_SPECIAL = "Lo mandamos a revisión."

function pickFrom<T>(pool: T[]): T {
  return pool[Math.floor(Math.random() * pool.length)]
}

function surveyThanksPool(type: SurveyType, value: string | null): string[] {
  if (type === "D") return value === "aburrido" ? SURVEY_THANKS_GENERIC_NEG : SURVEY_THANKS_A_POS
  const negative = type === "A" ? value === "muy_dificil" : value === "no_util"
  if (type === "A") return negative ? SURVEY_THANKS_A_NEG : SURVEY_THANKS_A_POS
  return negative ? SURVEY_THANKS_B_NEG : SURVEY_THANKS_B_POS
}

function pickReportThanks(): { title: string; subtitle: string } {
  const title = pickFrom([...THANKS_TITLES, REPORT_TITLE_SPECIAL])
  if (title === REPORT_TITLE_SPECIAL) {
    return { title, subtitle: REPORT_SUBTITLE_SPECIAL }
  }
  return { title, subtitle: pickFrom(REPORT_THANKS) }
}

const ctaCls =
  "h-[var(--cta-h)] flex-1 rounded-md bg-white text-black hover:bg-white/90 hover:text-black"

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
  // Modo práctica: opciones ocultas detrás de un botón "Opciones" hasta que
  // el estudiante lo toca; persiste para no re-esconderlas al volver atrás
  // (goBack/swipe) sobre un ejercicio ya abierto. En test siempre están
  // visibles (ver `revealed` en OptionsArea).
  optionsOpen: boolean
  // Alto (px) del spacer superior en el momento justo de abrir las opciones,
  // para congelarlo ahí (ver openOptions) y que el párrafo de arriba no se
  // corra cuando el centrado vertical recalcula por el crecimiento del grid.
  spacerFrozenH: number | null
  wrongOptions: number[]
  result: "correct" | "wrong" | null
  xp: number | null
  showWhy: boolean
  // Micro-encuesta (canales A/B/D): slide propio, ver survey-pane.tsx.
  showSurvey: boolean
  surveyValue: string | null
  // Canal D: chip de razón. Va al state y no a un ref porque tiene que
  // re-renderizar el chip seleccionado.
  surveyReason: string | null
  surveySubmitted: boolean
  surveyThanksTitle: string | null
  surveyThanksMsg: string | null
  surveyThanksXp: number | null
  // Reporte de problema (canal C, siempre disponible): slide propio, ver
  // report-pane.tsx. Vuelve a `showWhy` (question o explicación) al cerrarse.
  showReport: boolean
  reportValue: string | null
  reportSubmitted: boolean
  reportThanksTitle: string | null
  reportThanksMsg: string | null
  reportThanksXp: number | null
}
const DEFAULT_EX: ExState = {
  selection: null,
  optionsOpen: false,
  spacerFrozenH: null,
  wrongOptions: [],
  result: null,
  xp: null,
  showWhy: false,
  showSurvey: false,
  surveyValue: null,
  surveyReason: null,
  surveySubmitted: false,
  surveyThanksTitle: null,
  surveyThanksMsg: null,
  surveyThanksXp: null,
  showReport: false,
  reportValue: null,
  reportSubmitted: false,
  reportThanksTitle: null,
  reportThanksMsg: null,
  reportThanksXp: null,
}

export default function SessionRunner({ sessionId }: { sessionId: string }) {
  const payload = useSessionPayload({ id: sessionId })
  const router = useRouter()
  const sfx = useSfx()
  const answer = useAnswer()
  const feedback = useSessionFeedback()
  // Qué ejercicios ya dispararon (o descartaron) la micro-encuesta asignada a
  // la sesión, para no volver a ofrecerla si el usuario navega para atrás y
  // adelante sobre el mismo ejercicio. La impression del feedback ("A"/"B")
  // es async; se resuelve acá y se usa recién al enviar la respuesta.
  const surveyFiredRef = useRef<Set<number>>(new Set())
  const surveyImpressionRef = useRef<Record<number, Promise<number>>>({})
  const surveyTypeRef = useRef<Record<number, SurveyType>>({})
  // El texto libre de la encuesta y del reporte vive en un ref (y en un state
  // local de cada pane): tenerlo en el state del runner hacía que cada tecla
  // re-renderizara todo el ejercicio — MathText/MathGraph incluidos. Se lee
  // recién al enviar y se limpia al abrir/cerrar cada slide.
  const surveyFreeTextRef = useRef("")
  const reportFreeTextRef = useRef("")
  const [idx, setIdx] = useState(0)
  const [dir, setDir] = useState<1 | -1>(1)
  const [states, setStates] = useState<Record<number, ExState>>({})
  const [shakeIdx, setShakeIdx] = useState<number | null>(null)
  const [feedbackByIdx, setFeedbackByIdx] = useState<Record<number, string>>(
    () => loadTestFeedback(sessionId).general,
  )
  const [distractorFbByIdx, setDistractorFbByIdx] = useState<
    Record<number, Record<number, string>>
  >(() => loadTestFeedback(sessionId).distractors)
  const [explanationFbByIdx, setExplanationFbByIdx] = useState<
    Record<number, string>
  >(() => loadTestFeedback(sessionId).explanations)
  const [noAnswer, setNoAnswer] = useState(false)
  const [gotoValue, setGotoValue] = useState("")
  // Foco automático del snippet de feedback: se pisa cada vez que cambia de
  // ejercicio o de vista (enunciado/explicación) — ver el useEffect más abajo
  // y handleFeedbackKeyDown, que maneja el Enter para avanzar sin mouse.
  const feedbackTextareaRef = useRef<HTMLTextAreaElement>(null)
  // Gate del footer de feedback: al navegar se apaga y se vuelve a prender
  // recién cuando termina la animación del slide (para que salga después).
  const [footerReady, setFooterReady] = useState(true)
  // Al finalizar, la navegación al resumen puede tardar un instante. Apenas se
  // toca el botón, este flag dispara un fade-out que tapa el contenido para que
  // la espera no se sienta como una pantalla congelada.
  const [finishing, setFinishing] = useState(false)
  const startedAt = useRef(Date.now())
  const wrongResetRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  // Spacer superior del centrado vertical (ver openOptions): se mide al abrir
  // las opciones para congelarlo y que el párrafo no se corra. Un Map keyed
  // por idx en vez de un único useRef: mientras se navega, el slide saliente
  // queda montado un rato (desliza hacia afuera) al mismo tiempo que el
  // entrante — si compartieran un solo ref object, el saliente lo pisa con
  // null al desmontarse (más tarde) y el freeze deja de funcionar desde el
  // segundo ejercicio en adelante.
  const spacerRefs = useRef<Map<number, HTMLDivElement>>(new Map())
  // Botón "Reportar" que sigue al grid de opciones (ver openOptions): el
  // scroll al abrir opciones para ahí en vez de en el fondo real del
  // documento.
  const reportBtnRefs = useRef<Map<number, HTMLButtonElement>>(new Map())

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

  // Persiste el feedback acumulado de test mode a localStorage en cada
  // cambio, para sobrevivir un reload o un cierre accidental del tab a mitad
  // de una pasada larga. No hace nada fuera de test mode.
  useEffect(() => {
    if (payload?.mode !== "test") return
    saveTestFeedback(sessionId, {
      general: feedbackByIdx,
      distractors: distractorFbByIdx,
      explanations: explanationFbByIdx,
    })
  }, [payload?.mode, sessionId, feedbackByIdx, distractorFbByIdx, explanationFbByIdx])

  // Auto-guardado a disco (debounce), solo QA local: localStorage por sí solo
  // no alcanza porque depende de que el tab conserve el sessionStorage de la
  // sesión — si se pierde (cierre, refresh), la pantalla de "sesión
  // expirada" bloquea cualquier forma de volver a entrar al runner para
  // descargar el feedback ya tipeado. Esto lo deja en
  // backend/.test-feedback/<sessionId>.md pase lo que pase con el tab.
  useEffect(() => {
    if (payload?.mode !== "test") return
    const hasFb =
      Object.values(feedbackByIdx).some((t) => t.trim()) ||
      Object.values(explanationFbByIdx).some((t) => t.trim()) ||
      Object.values(distractorFbByIdx).some((byI) =>
        Object.values(byI).some((t) => t.trim()),
      )
    if (!hasFb) return
    const doc = buildFeedbackDocument({
      exercises: payload.exercises,
      feedbackByIdx,
      distractorFbByIdx,
      explanationFbByIdx,
    })
    const t = setTimeout(() => {
      fetch(`${API_BASE_URL}/dev/test-feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, doc }),
      }).catch(() => {})
    }, 1200)
    return () => clearTimeout(t)
  }, [payload, sessionId, feedbackByIdx, distractorFbByIdx, explanationFbByIdx])

  // Foco automático del snippet general al arrancar y en cada cambio de
  // ejercicio o de vista (enunciado/explicación), para no tener que tocar el
  // mouse durante una pasada de QA — ver handleFeedbackKeyDown.
  const showWhyForFocus = states[idx]?.showWhy ?? false
  useEffect(() => {
    if (payload?.mode !== "test") return
    const el = feedbackTextareaRef.current
    if (!el) return
    el.focus({ preventScroll: true })
    el.setSelectionRange(el.value.length, el.value.length)
  }, [payload?.mode, idx, showWhyForFocus])

  // Es un solo frame (el payload viene de sessionStorage): sin spinner ni
  // texto, para no destellar contenido entre la pantalla de origen (que ya se
  // desvaneció) y el fade-in del primer ejercicio.
  if (payload === undefined) {
    return <Screen>{null}</Screen>
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
        <div className="shrink-0 px-5 pt-[var(--cta-pt)] pb-[var(--cta-pb)]">
          <div className="mx-auto w-full max-w-2xl">
            <Button
              size="lg"
              className="h-[var(--cta-h)] w-full rounded-md bg-white text-black hover:bg-white/90 hover:text-black"
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
  const isTest = payload.mode === "test"
  if (!exercise) return null

  const cur = states[idx] ?? DEFAULT_EX
  const isLast = idx === total - 1
  const pct = Math.round(((idx + 1) / total) * 100)
  const solved = cur.result === "correct"
  // Resuelto recién después de haber fallado al menos una vez → acento lima.
  const solvedAfterError = solved && cur.wrongOptions.length > 0
  // Qué columna pinta la tabla de un ejercicio con `table`. NO puede ser
  // cur.selection: onRevisar la resetea a null al errar, así que la columna
  // equivocada aparecería y desaparecería en el mismo frame. La opción
  // confirmada sobrevive en wrongOptions (o es la correcta, si ya resolvió).
  //
  // Antes de confirmar queda en null a propósito: si el alumno pudiera ir
  // tocando opciones y viendo la tabla responder, el ítem se convierte en una
  // máquina de ensayo y error en vez de uno de generalización.
  const lastWrongOption =
    cur.wrongOptions.length > 0 ? cur.wrongOptions[cur.wrongOptions.length - 1] : null
  const tableRevealIndex = solved ? exercise.correct_index : lastWrongOption
  // La columna se marca con el mismo color que la opción que la produjo, para
  // que la tabla y el feedback sean una sola señal y no dos.
  const tableTone: TableTone = solved ? (solvedAfterError ? "retry" : "correct") : "wrong"
  const continueLabel = isLast ? "Finalizar" : "Continuar"
  const canGoBack =
    idx > 0 || cur.showWhy || cur.showSurvey || cur.showReport

  function patch(p: Partial<ExState>) {
    setStates((s) => ({ ...s, [idx]: { ...(s[idx] ?? DEFAULT_EX), ...p } }))
  }

  const hasFeedback =
    Object.values(feedbackByIdx).some((t) => t.trim()) ||
    Object.values(explanationFbByIdx).some((t) => t.trim()) ||
    Object.values(distractorFbByIdx).some((byI) =>
      Object.values(byI).some((t) => t.trim()),
    )

  const exercises = payload.exercises

  function downloadFeedback() {
    downloadFeedbackDocument({
      sessionId,
      exercises,
      feedbackByIdx,
      distractorFbByIdx,
      explanationFbByIdx,
    })
  }

  const skillProgress = (() => {
    const et = exercise.exercise_type
    if (!et) return null
    const group = payload.exercises.filter((e) => e.exercise_type === et)
    const posInGroup = group.findIndex((e) => e.id === exercise.id) + 1
    return { et, posInGroup, groupSize: group.length }
  })()

  function onSkip() {
    if (isLast) return
    sfx.continue()
    navTo(idx + 1, 1)
  }

  function onGoto() {
    const n = parseInt(gotoValue, 10)
    if (!Number.isFinite(n) || n < 1 || n > total) return
    const target = n - 1
    if (target === idx) return
    navTo(target, target > idx ? 1 : -1)
    setGotoValue("")
  }

  function copyFeedback() {
    const rawJson = JSON.stringify(exercise, null, 2)
    const distractorFb = distractorFbByIdx[idx] ?? {}
    const distractorLines = Object.entries(distractorFb)
      .filter(([, t]) => t.trim())
      .map(
        ([i, t]) =>
          `feedback sobre distractor ${i} (${exercise.options[Number(i)]}):\n${t}\n`,
      )
      .join("\n")
    const explanationFb = (explanationFbByIdx[idx] ?? "").trim()
    const generalFb = (feedbackByIdx[idx] ?? "").trim()
    const snippet =
      `${rawJson}\n` +
      (generalFb ? `\nfeedback general:\n${generalFb}\n` : "") +
      (distractorLines ? `\n${distractorLines}` : "") +
      (explanationFb ? `\nfeedback sobre la explicación:\n${explanationFb}\n` : "")
    navigator.clipboard?.writeText(snippet)
  }

  function copyExternalId() {
    navigator.clipboard?.writeText(exercise.external_id || exercise.id)
  }

  function navTo(target: number, direction: 1 | -1) {
    setDir(direction)
    setFooterReady(false)
    scrollToTop()
    if (!states[target]?.result) startedAt.current = Date.now()
    setIdx(target)
  }

  function goBack() {
    // Volver desde el reporte o la encuesta no envía nada (queda como skip
    // logueado si ya se había disparado la impression) y cae en la pantalla
    // que estaba debajo (explicación o enunciado, según `cur.showWhy`).
    if (cur.showReport) {
      setDir(-1)
      scrollToTop()
      reportFreeTextRef.current = ""
      patch({
        showReport: false,
        reportSubmitted: false,
        reportValue: null,
      })
      return
    }
    if (cur.showSurvey) {
      setDir(-1)
      scrollToTop()
      surveyFreeTextRef.current = ""
      patch({
        showSurvey: false,
        surveySubmitted: false,
        surveyValue: null,
        surveyReason: null,
      })
      return
    }
    if (cur.showWhy) {
      setDir(-1)
      scrollToTop()
      patch({ showWhy: false })
      return
    }
    if (idx > 0) navTo(idx - 1, -1)
  }

  function goToSummary() {
    // La sesión terminó: el stash se borra acá y no recién en el summary. Si
    // quedara vivo, el back del navegador remontaba el runner limpio (useState
    // en cero) con los mismos ejercicios, y la segunda pasada re-enviaba todos
    // los slots. El summary conserva su clearSession como red de contención.
    clearSession({ id: sessionId })
    // Sonido de "carga" ascendente: arranca al tocar y sigue sonando (sin
    // cortarse) durante la transición al resumen, donde se carga la bolita.
    setFinishing(true)
    sfx.charge()
    router.push(`/session/${sessionId}/summary`)
  }

  function onContinue() {
    // Canal C (reporte): seleccionar categoría + Continuar envía; un segundo
    // Continuar (ya con el banner de agradecimiento mostrado) vuelve a donde
    // estaba, sin avanzar de ejercicio.
    if (cur.showReport) {
      if (!cur.reportSubmitted) {
        if (!cur.reportValue) return
        feedback.mutate(
          {
            action: "report",
            session_id: sessionId,
            exercise_external_id: exercise.external_id || exercise.id,
            value: cur.reportValue,
            free_text: reportFreeTextRef.current.trim() || undefined,
          },
          { onSuccess: (r) => patch({ reportThanksXp: r.xp_earned || null }) },
        )
        sfx.correct()
        const { title, subtitle } = pickReportThanks()
        patch({ reportSubmitted: true, reportThanksTitle: title, reportThanksMsg: subtitle })
        return
      }
      reportFreeTextRef.current = ""
      patch({
        showReport: false,
        reportSubmitted: false,
        reportValue: null,
        reportThanksTitle: null,
        reportThanksMsg: null,
        reportThanksXp: null,
      })
      return
    }

    // Canales A/B/D (encuesta): seleccionar + Continuar envía la respuesta y
    // muestra el banner; un segundo Continuar avanza al siguiente ejercicio.
    // Sin selección, Continuar la saltea (skip) y avanza directo.
    if (cur.showSurvey) {
      if (!cur.surveySubmitted) {
        const surveyType = surveyTypeRef.current[idx] ?? "A"
        if (cur.surveyValue) {
          const value = cur.surveyValue
          const freeText = surveyFreeTextRef.current.trim() || undefined
          const reason = cur.surveyReason ?? undefined
          surveyImpressionRef.current[idx]?.then((feedback_id) => {
            feedback.mutate(
              { action: "answer", session_id: sessionId, feedback_id, value, free_text: freeText, reason },
              { onSuccess: (r) => patch({ surveyThanksXp: r.xp_earned || null }) },
            )
          })
          posthog.capture("survey_answered", {
            channel: surveyType,
            value,
            reason: reason ?? null,
            has_free_text: Boolean(freeText),
            exercise_external_id: exercise.external_id || exercise.id,
            session_id: sessionId,
            position: idx,
          })
          sfx.correct()
          patch({
            surveySubmitted: true,
            surveyThanksTitle: pickFrom(THANKS_TITLES),
            surveyThanksMsg: pickFrom(surveyThanksPool(surveyType, value)),
          })
          return
        }
        // send_instantly: si es el último, goToSummary navega en la línea
        // siguiente y el evento encolado se pierde en la descarga de la página.
        // El skip es el denominador de la tasa de respuesta, no se puede perder.
        posthog.capture(
          "survey_skipped",
          {
            channel: surveyType,
            exercise_external_id: exercise.external_id || exercise.id,
            session_id: sessionId,
            position: idx,
            is_last: isLast,
          },
          { send_instantly: true },
        )
        sfx.continue()
        if (isLast) goToSummary()
        else navTo(idx + 1, 1)
        return
      }
      sfx.continue()
      if (isLast) goToSummary()
      else navTo(idx + 1, 1)
      return
    }

    if (isLast) {
      goToSummary()
      return
    }

    // ¿el ejercicio que estamos dejando es el marcado por el backend para
    // llevar la micro-encuesta? "A" y "D" disparan siempre; "B" solo si el
    // usuario realmente abrió "¿Por qué?" (si no la abrió, esta sesión queda sin
    // encuesta — no se loguea impression y la alternancia no se consume).
    // isSurveyType además protege contra un backend que mande un canal que este
    // frontend todavía no conoce: sin ese guard, SURVEY_QUESTIONS[type] queda
    // undefined y rompe el runner en plena sesión.
    const survey = payload!.survey
    const isMarked =
      !isTest &&
      survey?.exercise_id === exercise.id &&
      !surveyFiredRef.current.has(idx) &&
      isSurveyType(survey.type)
    const shouldFireSurvey = isMarked && (survey!.type !== "B" || cur.showWhy)
    if (shouldFireSurvey && survey) {
      const type = survey.type as SurveyType
      surveyFiredRef.current.add(idx)
      surveyTypeRef.current[idx] = type
      surveyImpressionRef.current[idx] = feedback
        .mutateAsync({
          action: "impression",
          session_id: sessionId,
          exercise_external_id: exercise.external_id || exercise.id,
          question_type: type,
        })
        .then((r) => r.feedback_id)
      posthog.capture("survey_shown", {
        channel: type,
        exercise_external_id: exercise.external_id || exercise.id,
        session_id: sessionId,
        mode: payload!.mode,
        position: idx,
      })
      sfx.continue()
      setDir(1)
      scrollToTop()
      surveyFreeTextRef.current = ""
      patch({ showSurvey: true })
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
          exercise_external_id: exercise.external_id || exercise.id,
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
    }, 8000)
  }

  // A diferencia de openWhy/openReport, esto no navega de slide: el reveal
  // pasa dentro del mismo ejercicio, así que no toca setDir/scrollToTop.
  // Congela el spacer superior en su alto actual: si no, al crecer el grid
  // de opciones el centrado vertical recalcula y el párrafo de arriba salta
  // hacia arriba junto con el resto del contenido.
  function openOptions() {
    sfx.continue()
    const h = spacerRefs.current.get(idx)?.getBoundingClientRect().height ?? null
    patch({ optionsOpen: true, spacerFrozenH: h })
    // Scroll lento y continuo, no hasta el fondo real del documento sino
    // hasta un poco después de "Reportar". No se puede medir su posición ya
    // en el mismo frame: "Reportar" tiene su propio `layout` (FLIP) por el
    // corrimiento hacia abajo, y ese FLIP aplica un transform compensatorio
    // que hace que getBoundingClientRect() devuelva su posición VIEJA
    // (pre-corrimiento) mientras dura la animación — recién al terminar
    // (OPTIONS_LAYOUT_TRANSITION) el transform vuelve a identity y el rect
    // pasa a reflejar la posición final real. Por eso se espera ese tiempo
    // antes de medir.
    setTimeout(() => {
      const el = bodyRef.current
      if (!el) return
      const start = el.scrollTop
      const reportEl = reportBtnRefs.current.get(idx)
      // Usamos el propio cálculo del navegador (scrollIntoView) en vez de
      // geometría a mano: es más robusto y respeta scroll-margin-bottom (el
      // "gap" hasta Reportar) sin tener que reimplementar el clamp contra el
      // fondo real. Se hace de forma instantánea y oculta (se revierte antes
      // de pintar) solo para leer el scrollTop resultante; la animación
      // suave la hacemos nosotros con `animate` para mantener el mismo
      // efecto lento y continuo de siempre.
      if (reportEl) {
        reportEl.scrollIntoView({ behavior: "instant" as ScrollBehavior, block: "end" })
      } else {
        el.scrollTop = el.scrollHeight - el.clientHeight
      }
      const target = el.scrollTop
      el.scrollTop = start
      if (target <= start) return
      animate(start, target, {
        duration: 0.9,
        ease: "easeInOut",
        onUpdate: (v) => {
          el.scrollTop = v
        },
      })
    }, 380)
  }

  function openWhy() {
    sfx.continue()
    setDir(1)
    scrollToTop()
    patch({ showWhy: true })
  }

  // Enter en el snippet de feedback general avanza sin mouse: desde el
  // enunciado abre la explicación (sin necesidad de responder), desde la
  // explicación pasa al siguiente ítem. Shift+Enter sigue siendo un salto de
  // línea normal dentro del textarea. Shift+Backspace es el simétrico para
  // volver atrás (Backspace solo sigue borrando texto como siempre).
  function handleFeedbackKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (!isTest) return
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      if (cur.showWhy) onContinue()
      else openWhy()
      return
    }
    if (e.key === "Backspace" && e.shiftKey) {
      if (!canGoBack) return
      e.preventDefault()
      goBack()
    }
  }

  // `cur.showWhy` ya indica si veníamos del enunciado o de la explicación —
  // al volver (goBack) cae naturalmente en la pantalla correcta sin guardar
  // un origen aparte.
  function openReport() {
    sfx.continue()
    setDir(1)
    scrollToTop()
    reportFreeTextRef.current = ""
    patch({ showReport: true })
  }

  return (
    // Fade-in leve y rápido al aparecer el primer ejercicio (una sola vez: esta
    // rama solo se monta al pasar de "cargando" a sesión lista, no en cada
    // ejercicio — la navegación entre ejercicios sigue con el slide horizontal).
    <motion.div
      className="h-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
    >
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
        {isTest ? (
          <div className="flex flex-1 items-center gap-2 overflow-hidden">
            <button
              onClick={copyExternalId}
              title="Copiar external_id"
              className="truncate rounded-md border border-white/15 bg-white/5 px-2 py-1 font-mono text-[11px] text-foreground/80 hover:border-white/40"
            >
              {exercise.external_id || exercise.id}
            </button>
            {skillProgress && (
              <span className="shrink-0 rounded-md border border-white/10 px-2 py-1 text-[11px] text-foreground/60">
                {skillProgress.posInGroup}/{skillProgress.groupSize} ·{" "}
                {exerciseTypeInfo({ type: skillProgress.et }).label}
              </span>
            )}
            <span className="ml-auto flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={downloadFeedback}
                disabled={!hasFeedback}
                aria-label="Descargar feedback acumulado"
                title="Descargar feedback acumulado (.md)"
              >
                <Download />
              </Button>
              <JsonDialog exercise={exercise} />
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setNoAnswer((v) => !v)}
                aria-label="Modo sin responder"
                title={noAnswer ? "Salir del modo revisión" : "Ver sin responder"}
              >
                {noAnswer ? <EyeOff /> : <Eye />}
              </Button>
            </span>
          </div>
        ) : (
          <div className="h-3 flex-1 overflow-hidden rounded-full bg-border">
            <motion.div
              className="h-full rounded-full bg-primary"
              initial={{ width: "0%" }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.45, ease: [0.32, 0.72, 0, 1] }}
            />
          </div>
        )}
        <ExitButton />
      </ScreenHeader>
      {isTest && (
        <div className="border-b border-white/5 px-5 py-1.5 text-xs text-foreground/60">
          <div className="mx-auto flex w-full max-w-2xl items-center gap-2">
            <span>
              {topicShortLabel({ topic: exercise.topic })} · {exercise.belt}
            </span>
            <span className="ml-auto flex items-center gap-1">
              <span>{idx + 1}/{total}</span>
              <span className="mx-1 text-foreground/30">·</span>
              <span>ir a</span>
              <input
                type="number"
                min={1}
                max={total}
                value={gotoValue}
                onChange={(e) => setGotoValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") onGoto()
                }}
                className="w-14 rounded border border-white/15 bg-white/5 px-1 py-0.5 text-right text-foreground/80"
              />
              <button
                onClick={onGoto}
                className="rounded border border-white/15 px-1.5 py-0.5 text-foreground/70 hover:border-white/40"
              >
                OK
              </button>
            </span>
          </div>
        </div>
      )}

      <ScreenBody ref={bodyRef} className="overflow-x-hidden pt-0">
        <div className="grid min-h-full w-full grid-cols-1">
          <AnimatePresence mode="sync" initial={false} custom={{ dir }}>
            <motion.div
              key={
                cur.showReport
                  ? `report-${idx}`
                  : cur.showSurvey
                    ? `survey-${idx}`
                    : cur.showWhy
                      ? `why-${idx}`
                      : `q-${idx}`
              }
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
                else if (
                  info.offset.x < -80 &&
                  (solved || cur.showWhy || cur.showSurvey || cur.showReport)
                )
                  onContinue()
              }}
              className="col-start-1 row-start-1 flex min-h-full min-w-0 flex-col"
            >
              {/* Centrado vertical sesgado hacia arriba (2.5:3) con margen mínimo
                  de 40px arriba; si el ejercicio es largo, los spacers colapsan
                  y el contenido scrollea. Se congela (openOptions) al abrir las
                  opciones en práctica para que el párrafo no se corra cuando el
                  grid de opciones crece — ver ExState.spacerFrozenH. Ese freeze
                  es solo para la vista de la pregunta: "¿Por qué?"/reporte/
                  encuesta son slides propios (keys distintas más arriba) y
                  deben centrarse con su propio alto, no heredar el freeze de
                  la pregunta — si no, arrancaban tan abajo como quedaba el
                  grid de opciones abierto. */}
              <div
                ref={(el) => {
                  if (el) spacerRefs.current.set(idx, el)
                  else spacerRefs.current.delete(idx)
                }}
                className={
                  cur.spacerFrozenH == null || cur.showReport || cur.showSurvey || cur.showWhy
                    ? "min-h-[40px] flex-[2.5]"
                    : undefined
                }
                style={
                  cur.spacerFrozenH != null && !cur.showReport && !cur.showSurvey && !cur.showWhy
                    ? { height: cur.spacerFrozenH, flex: "0 0 auto" }
                    : undefined
                }
              />
              <div className="flex flex-col gap-5">
              {cur.showReport ? (
                <ReportPane
                  value={cur.reportValue}
                  freeTextRef={reportFreeTextRef}
                  submitted={cur.reportSubmitted}
                  onSelect={(v) => { sfx.select(); patch({ reportValue: v }) }}
                />
              ) : cur.showSurvey ? (
                <SurveyPane
                  type={surveyTypeRef.current[idx] ?? "A"}
                  value={cur.surveyValue}
                  reason={cur.surveyReason}
                  onSelectReason={(r) => { sfx.select(); patch({ surveyReason: r }) }}
                  freeTextRef={surveyFreeTextRef}
                  submitted={cur.surveySubmitted}
                  onSelect={(v) => { sfx.select(); patch({ surveyValue: v, surveyReason: null }) }}
                />
              ) : cur.showWhy ? (
                <div className="flex flex-col gap-3 leading-relaxed text-foreground">
                  <MathText text={exercise.explanation ?? ""} />
                  {!isTest && <ReportFlagButton onClick={openReport} />}
                  {isTest && <TestFeedbackBox
                    idx={idx}
                    value={feedbackByIdx[idx] ?? ""}
                    onChange={(v) =>
                      setFeedbackByIdx((f) => ({ ...f, [idx]: v }))
                    }
                    onCopy={copyFeedback}
                    onKeyDown={handleFeedbackKeyDown}
                    inputRef={feedbackTextareaRef}
                  />}
                </div>
              ) : (
                <>
                  <p className="text-base leading-snug">
                    <MathText text={exercise.question} />
                  </p>

                  {exercise.graph_fn && (
                    <MathGraph
                      graphFn={exercise.graph_fn}
                      graphView={exercise.graph_view}
                      graphShade={exercise.graph_shade}
                      graphFreeAspect={exercise.graph_free_aspect}
                    />
                  )}

                  {exercise.table && (
                    <ExerciseTable
                      table={exercise.table}
                      revealIndex={tableRevealIndex}
                      tone={tableTone}
                    />
                  )}

                  <OptionsArea
                    exercise={exercise}
                    isTest={isTest}
                    noAnswer={noAnswer}
                    cur={cur}
                    solved={solved}
                    solvedAfterError={solvedAfterError}
                    shakeIdx={shakeIdx}
                    onReveal={openOptions}
                    onPick={handlePick}
                  />
                  {!isTest && (
                    <ReportFlagButton
                      onClick={openReport}
                      innerRef={(el) => {
                        if (el) reportBtnRefs.current.set(idx, el)
                        else reportBtnRefs.current.delete(idx)
                      }}
                    />
                  )}
                  {isTest && noAnswer && (
                    <div className="flex flex-col gap-3 border-t border-white/10 pt-4 text-sm text-foreground/80">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-semibold uppercase tracking-wide text-foreground/50">
                          Feedback correcto
                        </span>
                        <MathText text={exercise.feedback_correct} />
                      </div>
                      {Array.isArray(exercise.feedback_incorrect) &&
                        exercise.feedback_incorrect.map((hint, i) =>
                          hint ? (
                            <div key={i} className="flex flex-col gap-1.5">
                              <span className="text-xs font-semibold uppercase tracking-wide text-orange-400/80">
                                Distractor {i}: {exercise.options[i]}
                              </span>
                              <MathText text={hint} />
                              <textarea
                                value={(distractorFbByIdx[idx] ?? {})[i] ?? ""}
                                onChange={(e) =>
                                  setDistractorFbByIdx((f) => ({
                                    ...f,
                                    [idx]: {
                                      ...(f[idx] ?? {}),
                                      [i]: e.target.value,
                                    },
                                  }))
                                }
                                placeholder="Feedback sobre este distractor…"
                                className="min-h-16 rounded-md border border-white/10 bg-white/5 p-2 text-xs text-foreground/85 outline-none focus:border-white/40"
                              />
                            </div>
                          ) : null,
                        )}
                      {exercise.explanation && (
                        <div className="flex flex-col gap-1.5">
                          <span className="text-xs font-semibold uppercase tracking-wide text-foreground/50">
                            Explicación
                          </span>
                          <MathText text={exercise.explanation} />
                          <textarea
                            value={explanationFbByIdx[idx] ?? ""}
                            onChange={(e) =>
                              setExplanationFbByIdx((f) => ({
                                ...f,
                                [idx]: e.target.value,
                              }))
                            }
                            placeholder="Feedback sobre la explicación…"
                            className="min-h-16 rounded-md border border-white/10 bg-white/5 p-2 text-xs text-foreground/85 outline-none focus:border-white/40"
                          />
                        </div>
                      )}
                    </div>
                  )}
                  {isTest && (
                    <TestFeedbackBox
                      idx={idx}
                      value={feedbackByIdx[idx] ?? ""}
                      onChange={(v) =>
                        setFeedbackByIdx((f) => ({ ...f, [idx]: v }))
                      }
                      onCopy={copyFeedback}
                      onKeyDown={handleFeedbackKeyDown}
                      inputRef={feedbackTextareaRef}
                    />
                  )}
                </>
              )}
              </div>
              {/* Spacer inferior: flexiona para centrar cuando es corto, y
                  garantiza ~160px para scrollear bajo el último ítem (y que el
                  overlay del footer no lo tape) cuando el ejercicio es largo. */}
              <div className="min-h-[calc(3.5rem_+_var(--cta-pt)_+_var(--cta-h)_+_var(--cta-pb))] flex-[3]" />
            </motion.div>
          </AnimatePresence>
        </div>
      </ScreenBody>

      {/* Capa 1 — fondo sólido del contenedor de botones (atrás de todo). */}
      <div className="fixed inset-x-0 bottom-0 z-20 h-[calc(var(--cta-pt)_+_var(--cta-h)_+_var(--cta-pb))] border-t bg-background" />

      {/* Capa 2 — feedback: sale desde abajo, por delante del fondo del
          contenedor pero por detrás de los botones (asoma por encima de ellos). */}
      <AnimatePresence initial={false}>
        {footerReady && cur.showSurvey && cur.surveySubmitted && (
          <motion.div
            key="survey-thanks"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="pointer-events-none fixed inset-x-0 bottom-0 z-30 bg-background"
          >
            <div className="border-t border-green-500/50 bg-green-500/10 px-5 pt-6 pb-[calc(var(--cta-pt)_+_var(--cta-h)_+_var(--cta-pb))]">
              <div className="mx-auto w-full max-w-2xl text-[15px]">
                <span className="font-semibold text-green-400">{cur.surveyThanksTitle}</span>
                {cur.surveyThanksXp ? (
                  <span className="ml-1.5 inline-flex items-center gap-0.5 font-semibold text-green-400">
                    +{cur.surveyThanksXp}
                    <XpDots className="-ml-px size-[0.95em]" />
                  </span>
                ) : null}
                <div className="mt-3 text-foreground/85">{cur.surveyThanksMsg}</div>
              </div>
            </div>
          </motion.div>
        )}
        {footerReady && cur.showReport && cur.reportSubmitted && (
          <motion.div
            key="report-thanks"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="pointer-events-none fixed inset-x-0 bottom-0 z-30 bg-background"
          >
            <div className="border-t border-green-500/50 bg-green-500/10 px-5 pt-6 pb-[calc(var(--cta-pt)_+_var(--cta-h)_+_var(--cta-pb))]">
              <div className="mx-auto w-full max-w-2xl text-[15px]">
                <span className="font-semibold text-green-400">{cur.reportThanksTitle}</span>
                {cur.reportThanksXp ? (
                  <span className="ml-1.5 inline-flex items-center gap-0.5 font-semibold text-green-400">
                    +{cur.reportThanksXp}
                    <XpDots className="-ml-px size-[0.95em]" />
                  </span>
                ) : null}
                <div className="mt-3 text-foreground/85">{cur.reportThanksMsg}</div>
              </div>
            </div>
          </motion.div>
        )}
        {footerReady &&
          !cur.showWhy &&
          !cur.showSurvey &&
          !cur.showReport &&
          cur.result === "correct" && (
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
                "border-t bg-green-500/10 px-5 pt-6 pb-[calc(var(--cta-pt)_+_var(--cta-h)_+_var(--cta-pb))]",
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
        {footerReady &&
          !cur.showWhy &&
          !cur.showSurvey &&
          !cur.showReport &&
          cur.result === "wrong" && (
          <motion.div
            key="wrong"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="pointer-events-none fixed inset-x-0 bottom-0 z-30 bg-background"
          >
            <div className="border-t border-orange-500/50 bg-orange-500/10 px-5 pt-6 pb-[calc(var(--cta-pt)_+_var(--cta-h)_+_var(--cta-pb))]">
              <div className="mx-auto w-full max-w-2xl text-[15px]">
                <span className="font-semibold text-orange-400">¿Seguro?</span>
                <div className="mt-3 text-foreground/85">
                  {(() => {
                    const lastWrongIdx = cur.wrongOptions.length > 0 ? cur.wrongOptions[cur.wrongOptions.length - 1] : null
                    const hint =
                      Array.isArray(exercise.feedback_incorrect) && lastWrongIdx !== null
                        ? (exercise.feedback_incorrect[lastWrongIdx] ?? null)
                        : null
                    return hint ? <MathText text={hint} /> : "Revisá tu respuesta e intentalo una vez más."
                  })()}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Capa 3 — botones (adelante). Contenedor amplio y equilibrado; sin fondo
          propio (lo aporta la capa 1) para que el feedback asome entre medio. */}
      <div className="fixed inset-x-0 bottom-0 z-40 px-5 pt-[var(--cta-pt)] pb-[var(--cta-pb)]">
        <div className="mx-auto w-full max-w-2xl">
          <div className="flex gap-2">
            {cur.showReport ? (
              <Button
                size="lg"
                className={ctaCls}
                disabled={!cur.reportValue && !cur.reportSubmitted}
                onClick={onContinue}
              >
                {cur.reportSubmitted ? "Continuar" : "Enviar"}
              </Button>
            ) : cur.showSurvey ? (
              <Button size="lg" className={ctaCls} onClick={onContinue}>
                {cur.surveySubmitted || !cur.surveyValue ? "Continuar" : "Enviar"}
              </Button>
            ) : cur.showWhy ? (
              <Button size="lg" className={ctaCls} onClick={onContinue}>
                {continueLabel}
              </Button>
            ) : isTest && noAnswer ? (
              <Button size="lg" className={ctaCls} onClick={onSkip}>
                {isLast ? "Terminar" : "Siguiente"}
              </Button>
            ) : solved ? (
              <>
                {exercise.explanation && (
                  <Button
                    variant="outline"
                    size="lg"
                    className="h-[var(--cta-h)] flex-1 rounded-md bg-background dark:bg-background"
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
              <>
                <Button
                  size="lg"
                  className={ctaCls}
                  disabled={cur.selection === null || cur.result === "wrong"}
                  onClick={onRevisar}
                >
                  Revisar
                </Button>
                {isTest && !isLast && (
                  <Button
                    variant="outline"
                    size="lg"
                    className="h-[var(--cta-h)] rounded-md bg-background dark:bg-background"
                    onClick={onSkip}
                    aria-label="Saltear"
                    title="Saltear"
                  >
                    <SkipForward />
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Al tocar "Finalizar" el fondo se superpone al instante (sin animación),
          tapando todo (por delante de los botones, z-40) mientras carga el
          resumen. */}
      {finishing && <div className="fixed inset-0 z-50 bg-background" />}
    </Screen>
    </motion.div>
  )
}

// Curva de easing compartida con la barra de progreso (línea ~576) y con
// ReportFlagButton, para que el despliegue del grid y el corrimiento de
// "Reportar" se lean como un solo movimiento coordinado.
const OPTIONS_LAYOUT_TRANSITION = { layout: { duration: 0.35, ease: [0.32, 0.72, 0, 1] as const } }

// Ritmo con el que se asoman las opciones: una tras otra (no todas juntas) y
// cada una se asienta con una escala suave. FRAGMENT_SPAN es lo que tarda
// desde que arranca la primera hasta que arranca la última — fijo, con 4
// opciones (el caso de referencia) da el mismo FRAGMENT_STAGGER de antes
// (0.33 / 3 = 0.11). El intervalo entre una y la siguiente
// (staggerChildren) se recalcula según cuántas opciones haya para que ese
// recorrido total dure siempre lo mismo — si no, con 3 opciones en vez de 4
// el mismo intervalo fijo hacía que la secuencia entera terminara antes,
// sintiéndose más rápida.
const FRAGMENT_SPAN = 0.33
const FRAGMENT_SETTLE = 0.26
function fragmentStagger(optionCount: number): number {
  return FRAGMENT_SPAN / Math.max(optionCount - 1, 1)
}

type OptionsPhase = "closed" | "open"

function OptionsArea({
  exercise,
  isTest,
  noAnswer,
  cur,
  solved,
  solvedAfterError,
  shakeIdx,
  onReveal,
  onPick,
}: {
  exercise: SessionExercise
  isTest: boolean
  noAnswer: boolean
  cur: ExState
  solved: boolean
  solvedAfterError: boolean
  shakeIdx: number | null
  onReveal: () => void
  onPick: (i: number) => void
}) {
  // Si ya estaba abierto (volver atrás sobre un ejercicio ya visto), arranca
  // directo en "open", sin repetir la animación. Test: siempre "open".
  const [phase, setPhase] = useState<OptionsPhase>(() =>
    isTest || cur.optionsOpen ? "open" : "closed",
  )
  const areaRef = useRef<HTMLDivElement>(null)

  function handleReveal() {
    onReveal()
    setPhase("open")
  }

  const hasLatex = exercise.options.some((o) => o.includes("$"))
  const limit = hasLatex ? 12 : 25
  const useGrid =
    exercise.options.length === 4 &&
    exercise.options.every((o) => (hasLatex ? latexVisualLength(o) : o.length) <= limit)

  return (
    // Condicional sin AnimatePresence en el botón: desaparece al instante (un
    // solo commit de React, sin período de exit ni fade de por medio) y en
    // el mismo tick ya está montado el grid. AnimatePresence + exit acá
    // llegaba a colgarse un rato (el botón compartido — cva `transition-all`
    // — seguía interpolando su propio opacity por CSS aunque Framer pidiera
    // duration:0), así que el botón se mantiene fuera de cualquier
    // AnimatePresence.
    //
    // El grid sí necesita su propio <AnimatePresence> (sin exit real: nunca
    // vuelve a "closed"), únicamente para resetear el contexto de presencia
    // que hereda del <AnimatePresence initial={false}> del slide exterior.
    // Ese `initial={false}` es "pegajoso": en el primer ejercicio de la
    // sesión (el único que ya existe cuando el AnimatePresence exterior
    // monta por primera vez), CUALQUIER motion.div que aparezca después
    // dentro de ese mismo slide — como este grid, recién al tocar
    // "Opciones" — hereda ese `initial:false` ambiental y salta directo al
    // estado final, sin stagger. Los ejercicios siguientes no tienen este
    // problema porque su slide se monta como hijo nuevo del AnimatePresence
    // exterior, con contexto de presencia propio. Confirmado con una réplica
    // mínima antes de aplicar este fix.
    <motion.div ref={areaRef} layout transition={OPTIONS_LAYOUT_TRANSITION} className="relative">
      {phase === "closed" ? (
        <Button
          variant="outline"
          size="lg"
          className="h-[var(--cta-h)] w-full rounded-md bg-background dark:bg-background"
          onClick={handleReveal}
        >
          Opciones
        </Button>
      ) : (
        <AnimatePresence>
        <motion.div
          key="options-grid"
          className={useGrid ? "grid grid-cols-2 gap-2" : "flex flex-col gap-2"}
          variants={{
            hidden: {},
            show: {
              transition: {
                staggerChildren: fragmentStagger(exercise.options.length),
                delayChildren: 0.02,
              },
            },
          }}
          initial="hidden"
          animate="show"
        >
            {exercise.options.map((opt, i) => {
                const isSelected = cur.selection === i
                const isCorrectOpt = i === exercise.correct_index
                const isWrong = cur.wrongOptions.includes(i)
                const isShaking = shakeIdx === i

                let borderCls = "border-white/10"
                let textCls = "text-foreground/80"
                // El opacity final lo maneja el `variants` de motion.button de
                // abajo (no una clase de Tailwind): al animar `opacity` con
                // Framer, ese valor inline pisa cualquier `opacity-*` de
                // Tailwind, así que el apagado de una opción incorrecta tiene
                // que ir acá, no en una clase.
                let dimOpacity = 1
                if (isTest && noAnswer) {
                  if (isCorrectOpt) {
                    borderCls = "border-green-500/50"
                    textCls = "text-green-400 font-medium"
                  } else {
                    dimOpacity = 0.6
                  }
                } else if (isShaking) {
                  borderCls = "border-[#E3690B]"
                  textCls = "text-[#E3690B] font-medium"
                } else if (isWrong) {
                  dimOpacity = 0.4
                } else if (solved && isSelected && isCorrectOpt) {
                  if (solvedAfterError) {
                    borderCls = "border-[#D9F99D]/50"
                    textCls = "text-[#D9F99D] font-medium"
                  } else {
                    borderCls = "border-green-500/50"
                    textCls = "text-green-400 font-medium"
                  }
                } else if (solved) {
                  dimOpacity = 0.4
                } else if (isSelected) {
                  borderCls = "border-[#7e80f7]"
                  textCls = "text-[#c4c6ff]"
                }

                return (
                  <motion.button
                    key={i}
                    // La pieza "aparece" de golpe (no se desvanece desde la
                    // nada) y solo la escala se asienta despacio. El opacity
                    // final del estado "show" es `dimOpacity`, no un 1 fijo,
                    // para que las opciones incorrectas/no elegidas sigan
                    // pudiendo apagarse visualmente.
                    variants={{
                      hidden: { opacity: 0, scale: 1.06 },
                      show: {
                        opacity: dimOpacity,
                        scale: 1,
                        transition: {
                          opacity: { duration: 0.2 },
                          scale: { duration: FRAGMENT_SETTLE, ease: [0.22, 1, 0.36, 1] },
                        },
                      },
                    }}
                    disabled={solved || isWrong || (isTest && noAnswer)}
                    onClick={() => onPick(i)}
                    className={cn(
                      "w-full rounded-md border bg-white/5 px-4 py-3.5 text-base transition-[color,border-color] duration-200 disabled:pointer-events-none",
                      useGrid ? "text-center" : "text-left",
                      borderCls,
                      textCls,
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
                  </motion.button>
                )
              })}
        </motion.div>
        </AnimatePresence>
      )}
    </motion.div>
  )
}

function ReportFlagButton({
  onClick,
  innerRef,
}: {
  onClick: () => void
  innerRef?: (el: HTMLButtonElement | null) => void
}) {
  return (
    <motion.button
      ref={innerRef}
      layout
      transition={OPTIONS_LAYOUT_TRANSITION}
      type="button"
      onClick={onClick}
      aria-label="Reportar un problema"
      className="flex items-center gap-1.5 self-start scroll-mb-[140px] text-sm text-foreground/40 transition-colors hover:text-foreground/70"
    >
      <Flag className="size-5" />
      Reportar
    </motion.button>
  )
}

function TestFeedbackBox({
  idx,
  value,
  onChange,
  onCopy,
  onKeyDown,
  inputRef,
}: {
  idx: number
  value: string
  onChange: (value: string) => void
  onCopy: () => void
  onKeyDown?: (e: KeyboardEvent<HTMLTextAreaElement>) => void
  inputRef?: Ref<HTMLTextAreaElement>
}) {
  return (
    <div className="flex flex-col gap-2 border-t border-white/10 pt-4">
      <label className="text-xs font-semibold uppercase tracking-wide text-foreground/50">
        Feedback para este ítem
      </label>
      <textarea
        key={idx}
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="Qué está mal, qué esperabas, qué regla se rompe… (Enter avanza, Shift+Enter salto de línea)"
        className="min-h-24 rounded-md border border-white/15 bg-white/5 p-2 text-sm text-foreground/85 outline-none focus:border-white/40"
      />
      <Button size="sm" variant="outline" onClick={onCopy} className="self-end">
        Copiar snippet
      </Button>
    </div>
  )
}

function JsonDialog({ exercise }: { exercise: SessionExercise }) {
  function copy() {
    navigator.clipboard?.writeText(JSON.stringify(exercise, null, 2))
  }
  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button variant="ghost" size="icon-sm" aria-label="Ver JSON crudo">
            <Braces />
          </Button>
        }
      />
      <DialogContent className="max-h-[85vh] w-[min(90vw,44rem)] max-w-none gap-3 overflow-hidden">
        <DialogHeader className="gap-0.5">
          <DialogTitle className="font-mono text-sm">
            {exercise.external_id || exercise.id}
          </DialogTitle>
          <DialogDescription>
            JSON crudo del ejercicio actual.
          </DialogDescription>
        </DialogHeader>
        <pre className="max-h-[60vh] overflow-auto rounded-md border border-white/10 bg-black/40 p-3 text-[11px] leading-relaxed text-foreground/85">
          {JSON.stringify(exercise, null, 2)}
        </pre>
        <Button
          size="sm"
          variant="outline"
          onClick={copy}
          className="self-end"
        >
          Copiar JSON
        </Button>
      </DialogContent>
    </Dialog>
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
            className="h-10 w-full sm:w-auto rounded-md bg-white text-black hover:bg-white/90 hover:text-black"
            onClick={() => router.push("/")}
          >
            Salir
          </AlertDialogAction>
          <AlertDialogCancel
            className="h-10 w-full sm:w-auto rounded-md bg-background dark:bg-background"
          >
            Seguir
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
