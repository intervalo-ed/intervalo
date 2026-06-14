"use client"

import { AnimatePresence, motion } from "motion/react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useSfx } from "@/lib/audio/useSfx"
import { saveOnboarding } from "@/lib/onboarding/storage"
import { cn } from "@/lib/utils"
import MathText from "@/components/math-text"
import { BELT_BAR_COLORS } from "@/lib/catalog"
import { catalog, type Topic } from "@/lib/catalog/analisis-1.generated"
import { exerciseTypeInfo } from "@/lib/catalog/exercise-types"
import { ChevronLeft, Pause, Play, RotateCcw } from "lucide-react"
import { useSignIn } from "@clerk/nextjs"
import { useEffect, useRef, useState } from "react"

const CAREERS = [
  { value: "E", label: "Ingeniería", emoji: "⚙️" },
  { value: "S", label: "Ciencias", emoji: "🔬" },
  { value: "T", label: "Tecnología", emoji: "🤖" },
  { value: "M", label: "Matemática", emoji: "π" },
]

const UNIVERSITIES = ["UBA", "UTN", "UNSAM"]

// Tipografía que evoca el logo de cada universidad.
const UNI_FONT: Record<string, React.CSSProperties> = {
  UBA: { fontFamily: "var(--font-uba)", fontWeight: 500, letterSpacing: "0.06em" },
  UTN: { fontFamily: "var(--font-utn)", fontWeight: 600, letterSpacing: "0.1em" },
  UNSAM: { fontFamily: "var(--font-unsam)", fontWeight: 500, letterSpacing: "0.02em" },
}

// Ejercicio de prueba del onboarding: inspirado en el banco real (Definición ·
// Léxico, imagen/preimagen) y simplificado a f(x) = x + 2 para la demo.
const EXERCISE_QUESTION =
  "Una regla transforma cada número en ese número más 2.\n$$f(x) = x + 2$$\n¿Cuál es el valor de $f(2)$?"
const EXERCISE_OPTIONS = ["$4$", "$0$", "$2$", "$6$"]
const EXERCISE_CORRECT_INDEX = 0
const EXERCISE_FEEDBACK = "La imagen del 2 es $f(2) = 2 + 2 = 4$."

const EXERCISE_EXPLANATION =
  "La **imagen** de un valor $x$ es lo que devuelve la regla al aplicarla, es decir $f(x)$.\n\nAcá la regla suma 2, así que\n$$f(2) = 2 + 2 = 4$$\nLa imagen del 2 es 4. Esperemos que no te hayas equivocado en esta."

const WHITE_TOPICS = catalog.belts.find((b) => b.key === "white")!.topics

const WHITE_BELT_FUNCTIONS = [
  { key: "definition", name: "Definición", items: ["LEXI", "CLSF"] },
  { key: "linear", name: "Lineales", items: ["CLSF", "FORM", "GRAF"] },
  { key: "quadratic", name: "Cuadráticas", items: ["CLSF", "FORM", "GRAF"] },
  { key: "polynomial", name: "Polinomiales", items: ["CLSF", "FORM", "GRAF"] },
  { key: "exponential", name: "Exponenciales", items: ["CLSF", "FORM", "GRAF"] },
  { key: "logarithmic", name: "Logarítmicas", items: ["CLSF", "FORM", "GRAF"] },
  { key: "rational", name: "Racionales", items: ["CLSF", "FORM", "GRAF", "RESL"] },
  { key: "trigonometric", name: "Trigonométricas", items: ["CLSF", "FORM", "GRAF", "RESL"] },
]

const ITEM_COLORS = {
  nuevo: "#3B82F6",
  pendiente: "#E3690B",
  aprendiendo: "#A0CC18",
  graduado: "#1A9447",
} as const

// Color del contador de días: naranja (día 0) → verde maduro (día 30+).
function dayColor(day: number): string {
  const t = Math.min(day, 30) / 30
  const from = [227, 105, 11] // #E3690B
  const to = [26, 148, 71] // #1A9447
  const ch = (i: number) => Math.round(from[i] + (to[i] - from[i]) * t)
  return `rgb(${ch(0)}, ${ch(1)}, ${ch(2)})`
}

// Estado de un ítem en la grilla. `days` = días restantes hasta el próximo repaso.
// Lo usaremos más adelante para animar la cuenta regresiva de los repasos.
type Cell =
  | { kind: "empty" }
  | { kind: "nuevo" }
  | { kind: "pendiente" } // repaso para hoy → 0 días
  | { kind: "aprendiendo"; days: number } // days > 0
  | { kind: "graduado"; days: number } // days > 0

function cellColor(cell: Cell): string | null {
  switch (cell.kind) {
    case "nuevo": return ITEM_COLORS.nuevo
    case "pendiente": return ITEM_COLORS.pendiente
    case "aprendiendo": return ITEM_COLORS.aprendiendo
    case "graduado": return ITEM_COLORS.graduado
    case "empty": return null
  }
}

function cellLabel(cell: Cell): string {
  switch (cell.kind) {
    case "pendiente": return "0d"
    case "aprendiendo":
    case "graduado": return `${cell.days}d`
    case "nuevo":
    case "empty": return "-"
  }
}

const STATE_INFO: Record<Cell["kind"], { label: string; description: string; color: string }> = {
  empty: {
    label: "Bloqueado",
    description: "Se desbloquea a medida que avanzás en la unidad.",
    color: "#9CA3AF",
  },
  nuevo: {
    label: "Nuevo",
    description: "Todavía no resolviste ejercicios de este tipo.",
    color: ITEM_COLORS.nuevo,
  },
  pendiente: {
    label: "Pendiente",
    description: "Tenés un repaso para hacer hoy.",
    color: ITEM_COLORS.pendiente,
  },
  // Visibles por días restantes; ocultan el estado interno (aprendiendo/graduado).
  // La descripción se calcula con stateDescription() según los días.
  aprendiendo: {
    label: "Próximo",
    description: "",
    color: ITEM_COLORS.aprendiendo,
  },
  graduado: {
    label: "Consolidado",
    description: "",
    color: ITEM_COLORS.graduado,
  },
}

function stateDescription(cell: Cell): string {
  if (cell.kind === "aprendiendo" || cell.kind === "graduado") {
    return cell.days === 1
      ? "Mañana vas a volver a repasar este ítem."
      : `Dentro de ${cell.days} días vas a volver a repasar este ítem.`
  }
  return STATE_INFO[cell.kind].description
}

// ── Simulación de evolución de la grilla ──
// Cada iteración = 1 día. Se intentan los ítems "nuevo" y "pendiente" (vencen hoy).
// Acierto inicial aleatorio 75–85%, +10% por cada fallo. Graduar = 3 aciertos seguidos
// con lapsos mínimos de 1 día. Tope de 15 ítems activos (nuevo+pendiente+aprendiendo);
// al graduar uno se desbloquea el siguiente.
type SimItem = {
  status: Exclude<Cell["kind"], "empty"> | "bloqueado"
  prob: number
  streak: number // aciertos seguidos en fase de aprendizaje (hacia graduar)
  due: number
  mature: boolean // ya graduó → usa el ladder SM-2
  ladderIdx: number // posición en SM2_LADDER (solo maduros)
}

const ACTIVE_CAP = 15
const SM2_LADDER = [3, 7, 14, 21, 30] // intervalos (días) tras graduar, suben con la racha

// Intervalo del escalón `idx` del ladder. Pasado el máximo, suma 15 días por escalón.
function ladderInterval(idx: number): number {
  const last = SM2_LADDER.length - 1
  if (idx <= last) return SM2_LADDER[idx]
  return SM2_LADDER[last] + 15 * (idx - last)
}

function initSim(correct: boolean): SimItem[] {
  const count = WHITE_BELT_FUNCTIONS.reduce((acc, fn) => acc + fn.items.length, 0)
  return Array.from({ length: count }, (_, i): SimItem => {
    const prob = 0.75 + Math.random() * 0.1 // 75–85%
    if (i === 0)
      return correct
        ? { status: "aprendiendo", prob, streak: 1, due: 1, mature: false, ladderIdx: 0 }
        : { status: "pendiente", prob, streak: 0, due: 0, mature: false, ladderIdx: 0 }
    if (i <= 14) return { status: "nuevo", prob, streak: 0, due: 0, mature: false, ladderIdx: 0 }
    return { status: "bloqueado", prob, streak: 0, due: 0, mature: false, ladderIdx: 0 }
  })
}

function iterateSim(items: SimItem[]): SimItem[] {
  const next = items.map((it) => ({ ...it }))
  const attempted = new Set<number>()

  // 1. Intentar los ítems que vencen hoy (nuevo o pendiente).
  next.forEach((item, i) => {
    if (item.status !== "nuevo" && item.status !== "pendiente") return
    attempted.add(i)
    const success = Math.random() < item.prob
    if (success) {
      if (item.mature) {
        // SM-2: sube un escalón del ladder (sin tope: +15d por escalón tras el máximo).
        item.ladderIdx += 1
        item.status = "graduado"
        item.due = ladderInterval(item.ladderIdx)
      } else {
        item.streak += 1
        if (item.streak >= 3) {
          // Gradúa → entra al ladder SM-2 en 3d.
          item.mature = true
          item.ladderIdx = 0
          item.status = "graduado"
          item.due = SM2_LADDER[0]
        } else {
          item.status = "aprendiendo"
          item.due = item.streak // 1d, luego 2d
        }
      }
    } else {
      item.prob = Math.min(1, item.prob + 0.1)
      if (item.mature) {
        // Error en un repaso maduro → vuelve a 3d (sigue graduado).
        item.ladderIdx = 0
        item.status = "graduado"
        item.due = SM2_LADDER[0]
      } else {
        // Error aprendiendo → queda pendiente hasta el otro día.
        item.streak = 0
        item.status = "pendiente"
        item.due = 0
      }
    }
  })

  // 2. Avanzar el día para los que no se intentaron; al llegar a 0d → pendiente.
  next.forEach((item, i) => {
    if (attempted.has(i)) return
    if (item.status === "aprendiendo" || item.status === "graduado") {
      item.due -= 1
      if (item.due <= 0) {
        item.status = "pendiente"
        item.due = 0
      }
    }
  })

  // 3. Tope de activos (no maduros: nuevo+pendiente+aprendiendo). Al graduar se libera
  //    cupo y se desbloquea el siguiente ítem.
  const active = next.filter(
    (it) => !it.mature && (it.status === "nuevo" || it.status === "pendiente" || it.status === "aprendiendo"),
  ).length
  let slots = ACTIVE_CAP - active
  for (const item of next) {
    if (slots <= 0) break
    if (item.status === "bloqueado") {
      item.status = "nuevo"
      slots -= 1
    }
  }

  return next
}

function simToCell(item: SimItem): Cell {
  switch (item.status) {
    case "bloqueado": return { kind: "empty" }
    case "nuevo": return { kind: "nuevo" }
    case "pendiente": return { kind: "pendiente" }
    // Color/estado visible por días: ≤2d → lima (Entrante), >2d → verde (Afianzado).
    case "aprendiendo":
    case "graduado":
      return item.due <= 2
        ? { kind: "aprendiendo", days: item.due }
        : { kind: "graduado", days: item.due }
  }
}

const TOTAL_STEPS = 12


function randomDelay(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

type SlideCustom = { dir: number; from: number }

const slideVariants = {
  enter: (c: SlideCustom) => ({ x: c.dir > 0 ? "100%" : "-100%", opacity: 1 }),
  center: { x: "0%", opacity: 1 },
  exit: (c: SlideCustom) => ({ x: c.dir > 0 ? "-100%" : "100%", opacity: 1 }),
}

const INTRO_BELT_COLORS = BELT_BAR_COLORS

// Intro: escribe "intervalo" con typewriter y revela los 5 colores del cinturón uno a uno.
function IntroLogo({ onDone }: { onDone: () => void }) {
  const WORD = "intervalo"
  const [typed, setTyped] = useState("")
  const [bars, setBars] = useState(0)
  const doneRef = useRef(false)

  useEffect(() => {
    if (typed.length >= WORD.length) return
    const id = setTimeout(() => setTyped(WORD.slice(0, typed.length + 1)), randomDelay(32, 52))
    return () => clearTimeout(id)
  }, [typed])

  useEffect(() => {
    if (typed.length < WORD.length) return
    if (bars < INTRO_BELT_COLORS.length) {
      const id = setTimeout(() => setBars((b) => b + 1), bars === 0 ? 320 : 165)
      return () => clearTimeout(id)
    }
    const id = setTimeout(() => {
      if (!doneRef.current) {
        doneRef.current = true
        onDone()
      }
    }, 680)
    return () => clearTimeout(id)
  }, [typed, bars, onDone])

  return (
    <div className="flex flex-1 flex-col items-center justify-center">
      <div className="inline-flex flex-col items-center gap-[7px] leading-none">
        <span className="font-heading text-[2.75rem] font-semibold text-[#F6F8FC]">
          {typed.length === 0
            ? " "
            : typed.split("").map((ch, i) => (
                <motion.span
                  key={i}
                  className="inline-block"
                  initial={{ opacity: 0, y: "0.3em", scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.16, ease: "easeOut" }}
                >
                  {ch}
                </motion.span>
              ))}
        </span>
        <div className="flex h-[4px] w-full overflow-hidden rounded-[2px]">
          {INTRO_BELT_COLORS.map((c, i) => (
            <motion.span
              key={i}
              className="flex-1 origin-left"
              style={{ background: c }}
              initial={{ opacity: 0, scaleX: 0 }}
              animate={i < bars ? { opacity: 1, scaleX: 1 } : { opacity: 0, scaleX: 0 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default function OnboardingWizard() {
  const { signIn } = useSignIn()
  const sfx = useSfx()
  const [step, setStep] = useState(-1) // -1 = intro animada del logo
  const [prevStep, setPrevStep] = useState(-1)
  const [direction, setDirection] = useState<1 | -1>(1)
  const [name, setName] = useState("")
  const [exerciseSelection, setExerciseSelection] = useState<number | null>(null)
  const [exerciseCorrect, setExerciseCorrect] = useState<boolean | null>(null)
  const [wrongOptions, setWrongOptions] = useState<number[]>([])
  const [shakeIdx, setShakeIdx] = useState<number | null>(null)
  const [itemTapped, setItemTapped] = useState(false)
  const [itemTapped6, setItemTapped6] = useState(false)
  const [simItems, setSimItems] = useState<SimItem[] | null>(null)
  const [simDay, setSimDay] = useState(0)
  const [simPlaying, setSimPlaying] = useState(false)
  const [simStarted, setSimStarted] = useState(false)
  const [showWhy, setShowWhy] = useState(false)
  const wrongResetRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [career, setCareer] = useState("")
  const [university, setUniversity] = useState("")
  const [universityOther, setUniversityOther] = useState("")
  const [showOther, setShowOther] = useState(false)

  // Acierto limpio = correcto sin ningún error previo. Decide el estado inicial
  // del ítem (mañana vs hoy) y se persiste al registrarse.
  const firstTryCorrect = exerciseCorrect === true && wrongOptions.length === 0

  // Reproducción automática de la simulación: 3 iteraciones por segundo, sin sonido.
  useEffect(() => {
    if (!simPlaying) return
    const id = setInterval(() => {
      setSimItems((prev) => iterateSim(prev ?? initSim(firstTryCorrect)))
      setSimDay((d) => d + 1)
    }, 333)
    return () => clearInterval(id)
  }, [simPlaying, firstTryCorrect])

  function goNext(target?: number) {
    setPrevStep(step)
    setDirection(1)
    if (target !== undefined) {
      setStep(target)
    } else {
      setStep((s) => s + 1)
    }
  }

  function openWhy() {
    sfx.continue()
    setPrevStep(step)
    setDirection(1)
    setShowWhy(true)
  }

  function continueFromWhy() {
    sfx.continue()
    setShowWhy(false)
    goNext()
  }

  function goBack() {
    if (showWhy) {
      setDirection(-1)
      setShowWhy(false)
      return
    }
    if (step === 10 && showOther) {
      setShowOther(false)
      return
    }
    if (step === 5) {
      setExerciseSelection(null)
      setExerciseCorrect(null)
      setWrongOptions([])
    }
    setPrevStep(step)
    setDirection(-1)
    setStep((s) => Math.max(0, s - 1))
  }

  function handleCareer(value: string) {
    sfx.select()
    setCareer(value)
  }

  function handleUniversity(value: string) {
    sfx.select()
    setUniversity(value)
    setShowOther(false)
  }

  function selectOther() {
    sfx.select()
    setUniversity("")
    setShowOther(true)
  }

  function confirmOther() {
    const value = universityOther.trim()
    if (!value) return
    sfx.continue()
    setUniversity(value)
    goNext()
  }

  function handleExercise(idx: number) {
    if (exerciseCorrect === true || wrongOptions.includes(idx)) return
    if (wrongResetRef.current) {
      clearTimeout(wrongResetRef.current)
      wrongResetRef.current = null
    }
    sfx.select()
    setExerciseSelection(idx)
    setExerciseCorrect(null)
  }

  function onRevisar() {
    if (exerciseSelection === null || exerciseCorrect === true) return
    const isCorrect = exerciseSelection === EXERCISE_CORRECT_INDEX
    if (isCorrect) {
      setExerciseCorrect(true)
      sfx.correct?.()
      return
    }
    sfx.wrong?.()
    const wrongIdx = exerciseSelection
    setExerciseCorrect(false)
    setWrongOptions((prev) => [...prev, wrongIdx])
    setExerciseSelection(null)
    setShakeIdx(wrongIdx)
    setTimeout(() => setShakeIdx(null), 450)
    wrongResetRef.current = setTimeout(() => {
      setExerciseCorrect(null)
      wrongResetRef.current = null
    }, 2000)
  }

  function onFinish() {
    if (!signIn) return
    saveOnboarding({ name: name.trim(), career, university, introItemCorrect: firstTryCorrect })
    const origin = window.location.origin
    signIn.sso({
      strategy: "oauth_google",
      redirectUrl: `${origin}/onboarding/complete`,
      redirectCallbackUrl: `${origin}/sso-callback`,
    })
  }

  // Cuenta existente: login directo con Google, sin guardar onboarding ni pasar
  // por /onboarding/complete; vuelve al home.
  function onSignInGoogle() {
    if (!signIn) return
    const origin = window.location.origin
    signIn.sso({
      strategy: "oauth_google",
      redirectUrl: `${origin}/`,
      redirectCallbackUrl: `${origin}/sso-callback`,
    })
  }

  return (
    <main className="flex min-h-dvh flex-col bg-background [&_h2]:font-sans overflow-x-hidden">
      <AnimatePresence>
        {step > 0 && <ProgressBar key="progress" step={step} onBack={goBack} />}
      </AnimatePresence>
      <div className="flex flex-1 flex-col items-center justify-start px-4 pb-8 pt-16">
        <div className="relative grid flex-1 w-full max-w-md overflow-hidden">
          <AnimatePresence mode="popLayout" initial={false} custom={{ dir: direction, from: prevStep }}>
            <motion.div
              key={showWhy ? "why" : step}
              custom={{ dir: direction, from: prevStep }}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.28, ease: "easeInOut" }}
              className="col-start-1 row-start-1 flex flex-col justify-center gap-6 pb-28"
            >
              {/* ── SLIDE intermedia: ¿Por qué? ── */}
              {showWhy && (
                <div className="flex flex-col gap-3 leading-relaxed text-foreground/80">
                  <MathText text={EXERCISE_EXPLANATION} />
                </div>
              )}

              {!showWhy && (
              <>

              {/* ── INTRO: animación del logo ── */}
              {step === -1 && <IntroLogo onDone={() => goNext(0)} />}

              {/* ── SLIDE 0: Nombre ── */}
              {step === 0 && (
                <Slide0
                  name={name}
                  setName={setName}
                  sfx={sfx}
                  onNext={() => goNext()}
                  onSignIn={onSignInGoogle}
                />
              )}

              {/* ── SLIDE 1: Bienvenida ── */}
              {step === 1 && (
                <div className="flex flex-col gap-5">
                  <h2 className="text-2xl font-bold">Hola, {name}.</h2>
                  <div className="flex flex-col gap-3 leading-relaxed text-foreground/85">
                    <p>
                      <strong className="text-foreground">Intervalo</strong> está pensado para
                      acompañarte a repasar los contenidos{" "}
                      <strong className="text-foreground">durante y después</strong> de tu cursada.
                    </p>
                    <p>
                      <strong className="text-foreground">Prioriza</strong> lo que necesitás repasar
                      y omite lo que ya incorporaste.
                    </p>
                    <p>
                      Este tutorial dura <strong>menos de 5 minutos</strong>.
                    </p>
                  </div>
                </div>
              )}

              {/* ── SLIDE 2: Cinturones ── */}
              {step === 2 && (
                <div className="flex flex-col gap-8 pt-10">
                  <div className="flex flex-col gap-3 leading-relaxed text-foreground/85">
                    <p>
                      Los contenidos están organizados en{" "}
                      <strong className="text-foreground">cinco unidades</strong>.
                    </p>
                    <p>
                      Cada unidad es <strong className="text-foreground">correlativa</strong> a la
                      anterior, y estas se habilitan a medida que consolidás los temas previos.
                    </p>
                    <p>
                      La idea es que incorpores los contenidos de manera{" "}
                      <strong className="text-foreground">gradual</strong>, a tus tiempos.
                    </p>
                  </div>
                </div>
              )}

              {/* ── SLIDE 3: Intro ejercicios ── */}
              {step === 3 && (
                <div className="flex flex-1 flex-col justify-center gap-4 leading-relaxed text-foreground/85">
                  <p>
                    Los ejercicios de cada unidad están pensados para trabajar las{" "}
                    <strong className="text-foreground">mecánicas principales</strong> de cada tema.
                  </p>
                  <p>
                    En esta primera etapa, vas a trabajar tu capacidad para{" "}
                    <strong className="text-foreground">reconocer, describir y manipular</strong>{" "}
                    distintas familias de funciones.
                  </p>
                  <p className="text-foreground/90 font-medium">
                    ¿Hacemos un ejercicio de prueba?
                  </p>
                </div>
              )}

              {/* ── SLIDE 4: Ejercicio dummy ── */}
              {step === 4 && (
                <div className="flex flex-col gap-5">
<div className="text-base leading-snug">
                    <MathText text={EXERCISE_QUESTION} />
                  </div>
                  <div className="flex flex-col gap-2">
                    {EXERCISE_OPTIONS.map((opt, i) => {
                      const isSelected = exerciseSelection === i
                      const solved = exerciseCorrect === true
                      const isCorrectOpt = i === EXERCISE_CORRECT_INDEX
                      const isWrong = wrongOptions.includes(i)
                      const isShaking = shakeIdx === i
                      let borderCls = "border-white/10"
                      let textCls = "text-foreground/80"
                      let extraCls = ""
                      if (isShaking) {
                        borderCls = "border-[#E3690B]"
                        textCls = "text-[#E3690B] font-medium"
                      } else if (isWrong) {
                        extraCls = "opacity-40"
                      } else if (solved && isSelected && isCorrectOpt) {
                        borderCls = "border-green-500"
                        textCls = "text-green-300 font-medium"
                      } else if (solved) {
                        extraCls = "opacity-40"
                      } else if (isSelected) {
                        borderCls = "border-[#7e80f7]"
                        textCls = "text-[#c4c6ff] font-medium"
                      }
                      return (
                        <button
                          key={i}
                          disabled={solved || isWrong}
                          onClick={() => handleExercise(i)}
                          className={cn(
                            "w-full rounded-md border bg-white/5 px-4 py-3.5 text-left text-base transition-[color,border-color,opacity] duration-200 disabled:pointer-events-none",
                            borderCls,
                            textCls,
                            extraCls,
                          )}
                        >
                          <motion.span
                            className="block"
                            animate={isShaking ? { x: [0, -8, 8, -6, 6, -3, 0] } : { x: 0 }}
                            transition={isShaking ? { duration: 0.4, ease: "easeInOut" } : { duration: 0 }}
                          >
                            <MathText text={opt} />
                          </motion.span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* ── SLIDE 5: Qué es un ítem ── */}
              {step === 5 && (
                <div className="flex flex-col gap-4 leading-relaxed text-foreground/85">
                  <p>
                    El ejercicio que acabás de resolver es parte de un{" "}
                    <strong className="text-foreground">ítem</strong>, que evalúa una
                    habilidad específica sobre un tema.
                  </p>
                  <p>
                    <strong className="text-foreground">Tocá</strong> cualquiera para ver más.
                  </p>
                  <BeltGrid cellFor={() => ({ kind: "empty" })} onItemTap={() => setItemTapped(true)} />
                </div>
              )}

              {/* ── SLIDE 6: Estados de los ítems ── */}
              {step === 6 && (
                <div className="flex flex-col gap-4 leading-relaxed text-foreground/85">
                  <p>
                    Cada ítem define con qué <strong className="text-foreground">frecuencia</strong>{" "}
                    aparecen los problemas de su tipo en tus sesiones de repaso.
                  </p>
                  <p>
                    Estos son <strong className="text-foreground">tus ítems</strong> de la
                    primera unidad.<br />
                    <strong className="text-foreground">Tocá</strong> cualquiera para ver más.
                  </p>
                  <BeltGrid
                    cellFor={(i) => {
                      if (i === 0) return firstTryCorrect ? { kind: "aprendiendo", days: 1 } : { kind: "pendiente" }
                      if (i <= 14) return { kind: "nuevo" }
                      return { kind: "empty" }
                    }}
                    onItemTap={() => setItemTapped6(true)}
                    showState
                  />
                </div>
              )}

              {/* ── SLIDE 7: Repaso adaptativo (animación grilla) ── */}
              {step === 7 && (
                <div className="flex flex-col gap-4 leading-relaxed text-foreground/85 pt-[10px]">
                  <p>
                    Los que te cuesten los vas a repasar más seguido, los que no, cada vez menos.
                  </p>
                  <p>De esta forma, el repaso se adapta a vos.</p>
                  <p>
                    <strong className="text-foreground">Tocá</strong> el botón para ver cómo
                    evolucionan tus ítems con el paso de los días.
                  </p>
                  <div className="mt-[8px] flex items-center justify-center gap-2">
                    <div
                      className="flex h-10 items-center rounded-md border border-white/15 bg-white/5 px-3 text-xs font-semibold tabular-nums"
                      style={{ color: dayColor(simDay) }}
                    >
                      {simDay}d
                    </div>
                    <Button
                      variant="outline"
                      size="lg"
                      aria-label={simPlaying ? "Pausar" : "Reproducir"}
                      className="size-10 rounded-md p-0"
                      onClick={() => { sfx.iterate(); setSimStarted(true); setSimPlaying((p) => !p) }}
                    >
                      {simPlaying ? <Pause className="size-4" /> : <Play className="size-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      aria-label="Reiniciar"
                      className="size-10 rounded-md p-0"
                      disabled={!simItems}
                      onClick={() => { sfx.iterate(); setSimPlaying(false); setSimItems(null); setSimDay(0) }}
                    >
                      <RotateCcw className="size-4" />
                    </Button>
                  </div>
                  <div className="mt-[8px]">
                    <BeltGrid
                      cellFor={(i) =>
                        simItems
                          ? simToCell(simItems[i])
                          : i === 0
                          ? firstTryCorrect
                            ? { kind: "aprendiendo", days: 1 }
                            : { kind: "pendiente" }
                          : i <= 14
                          ? { kind: "nuevo" }
                          : { kind: "empty" }
                      }
                      showState
                    />
                  </div>
                </div>
              )}

              {/* ── SLIDE 8: Resumen (cierre de los ítems) ── */}
              {step === 8 && (
                <div className="flex flex-col gap-4 leading-relaxed text-foreground/85">
                  <p>
                    Repasar un poco todos los días nos permite{" "}
                    <strong className="text-foreground">internalizar</strong> lo que ya nos costó
                    tiempo y esfuerzo entender.
                  </p>
                  <p>
                    Ya sea para entender nuevos conceptos, para rendir un examen, o para plantear
                    y resolver problemas de la vida real, siempre es mejor partir desde bases
                    sólidas.
                  </p>
                  <p className="font-medium text-foreground/90">
                    ¿Listo para tu primera sesión de repaso?
                  </p>
                </div>
              )}

              {/* ── SLIDE 9: Carrera ── */}
              {step === 9 && (
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col gap-2 text-center">
                    <h2 className="text-2xl font-bold">¿Qué estudiás?</h2>
                    <p className="text-foreground/85">
                      Marcá la que más se aproxime a tu carrera.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    {CAREERS.map((c) => (
                      <CareerCard
                        key={c.value}
                        emoji={c.emoji}
                        label={c.label}
                        selected={career === c.value}
                        onClick={() => handleCareer(c.value)}
                      />
                    ))}
                    <CareerCard
                      className="col-span-2"
                      emoji="✦"
                      label="Otra"
                      selected={career === "Otra"}
                      onClick={() => handleCareer("Otra")}
                    />
                  </div>
                </div>
              )}

              {/* ── SLIDE 10: Universidad ── */}
              {step === 10 && (
                <div className="flex flex-col gap-5 text-center">
                  <h2 className="text-2xl font-bold">¿Dónde?</h2>
                  <div className="flex flex-col gap-2.5">
                    <div className="flex gap-2.5">
                      {UNIVERSITIES.map((u) => (
                        <OptionButton
                          key={u}
                          className="flex-1 text-base"
                          style={UNI_FONT[u]}
                          selected={university === u && !showOther}
                          onClick={() => handleUniversity(u)}
                        >
                          {u}
                        </OptionButton>
                      ))}
                    </div>
                    <OptionButton selected={showOther} onClick={selectOther}>
                      Otra
                    </OptionButton>
                    {showOther && (
                      <div className="flex flex-col gap-3 pt-1">
                        <input
                          type="text"
                          value={universityOther}
                          onChange={(e) => setUniversityOther(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && confirmOther()}
                          placeholder="Ej: UNLP, UNQ, UNLa…"
                          autoFocus
                          className="h-11 rounded-md border border-white/10 bg-white/5 px-4 text-foreground outline-none focus:border-[#7e80f7] transition-colors"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── SLIDE 11: Registro ── */}
              {step === 11 && (
                <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center translate-y-[20px]">
                  <div className="flex flex-col gap-2">
                    <h2 className="text-2xl font-bold">¡Ya casi estamos!</h2>
                    <p className="leading-relaxed text-foreground/85">
                      Registrate para poder repasar los ítems que desbloqueaste hoy.
                    </p>
                  </div>
                  <Button
                    size="lg"
                    className="h-12 w-full rounded-md bg-white text-black hover:bg-white/90 hover:text-black"
                    onClick={onFinish}
                  >
                    <GoogleIcon className="size-5" />
                    Continuar con Google
                  </Button>
                </div>
              )}
              </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      <PinnedCTA
        step={step}
        showOther={showOther}
        universityOther={universityOther}
        career={career}
        university={university}
        showWhy={showWhy}
        openWhy={openWhy}
        continueFromWhy={continueFromWhy}
        itemTapped={itemTapped}
        itemTapped6={itemTapped6}
        simStarted={simStarted}
        exerciseSelection={exerciseSelection}
        exerciseCorrect={exerciseCorrect}
        sfx={sfx}
        goNext={goNext}
        confirmOther={confirmOther}
        onRevisar={onRevisar}
        onFinish={onFinish}
      />
    </main>
  )
}

function PinnedCTA({
  step,
  showOther,
  universityOther,
  career,
  university,
  showWhy,
  openWhy,
  continueFromWhy,
  itemTapped,
  itemTapped6,
  simStarted,
  exerciseSelection,
  exerciseCorrect,
  sfx,
  goNext,
  confirmOther,
  onRevisar,
  onFinish,
}: {
  step: number
  showOther: boolean
  universityOther: string
  career: string
  university: string
  showWhy: boolean
  openWhy: () => void
  continueFromWhy: () => void
  itemTapped: boolean
  itemTapped6: boolean
  simStarted: boolean
  exerciseSelection: number | null
  exerciseCorrect: boolean | null
  sfx: ReturnType<typeof useSfx>
  goNext: () => void
  confirmOther: () => void
  onRevisar: () => void
  onFinish: () => void
}) {
  const ctaCls = "h-12 w-full rounded-md bg-white text-black hover:bg-white/90 hover:text-black"

  if (showWhy) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-40 flex justify-center px-4 pt-6 pb-[var(--cta-pb)] bg-gradient-to-t from-background via-background/90 to-transparent pointer-events-none">
        <div className="w-full max-w-md pointer-events-auto">
          <Button size="lg" className={ctaCls} onClick={continueFromWhy}>
            Continuar
          </Button>
        </div>
      </div>
    )
  }

  let content: React.ReactNode = null

  switch (step) {
    case 1:
    case 2:
    case 8:
      content = (
        <Button size="lg" className={ctaCls} onClick={() => { sfx.continue(); goNext() }}>
          Continuar
        </Button>
      )
      break
    case 7:
      content = (
        <Button size="lg" className={ctaCls} disabled={!simStarted} onClick={() => { sfx.continue(); goNext() }}>
          Continuar
        </Button>
      )
      break
    case 3:
      content = (
        <Button size="lg" className={ctaCls} onClick={() => { sfx.continue(); goNext() }}>
          ¡Vamos!
        </Button>
      )
      break
    case 4:
      // handled separately below
      break
    case 5:
      content = (
        <Button size="lg" className={ctaCls} disabled={!itemTapped} onClick={() => { sfx.continue(); goNext() }}>
          Continuar
        </Button>
      )
      break
    case 6:
      content = (
        <Button size="lg" className={ctaCls} disabled={!itemTapped6} onClick={() => { sfx.continue(); goNext() }}>
          Continuar
        </Button>
      )
      break
    case 9:
      content = (
        <Button size="lg" className={ctaCls} disabled={!career} onClick={() => { sfx.continue(); goNext() }}>
          Continuar
        </Button>
      )
      break
    case 10:
      if (showOther) {
        content = (
          <Button size="lg" className={ctaCls} disabled={!universityOther.trim()} onClick={confirmOther}>
            Continuar
          </Button>
        )
      } else {
        content = (
          <Button size="lg" className={ctaCls} disabled={!university} onClick={() => { sfx.continue(); goNext() }}>
            Continuar
          </Button>
        )
      }
      break
    default:
      return null
  }

  // Step 4: footer verde animado al acertar
  if (step === 4) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-40 flex justify-center pointer-events-none">
        <div className={cn(
          "w-full max-w-md pointer-events-auto px-4 pb-[var(--cta-pb)] transition-colors duration-300",
          exerciseCorrect === true
            ? "border-t border-green-500/40 bg-green-500/10 pt-0"
            : exerciseCorrect === false
            ? "border-t border-orange-500/40 bg-orange-500/10 pt-0"
            : "bg-gradient-to-t from-background via-background/90 to-transparent pt-6",
        )}>
          <AnimatePresence>
            {exerciseCorrect === true && (
              <motion.div
                key="correct"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="overflow-hidden"
              >
                <div className="pt-4 pb-3 text-sm">
                  <span className="font-semibold text-green-400">¡Correcto!</span>
                  <div className="mt-0.5 text-foreground/85">
                    <MathText text={EXERCISE_FEEDBACK} />
                  </div>
                </div>
              </motion.div>
            )}
            {exerciseCorrect === false && (
              <motion.div
                key="wrong"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="overflow-hidden"
              >
                <div className="pt-4 pb-3 text-sm">
                  <span className="font-semibold text-orange-400">¿Seguro?</span>
                  <div className="mt-0.5 text-foreground/85">Revisá tu respuesta e intentalo una vez más.</div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="flex gap-2">
            {exerciseCorrect === true && (
              <Button variant="outline" size="lg" className="h-12 flex-1 rounded-md" onClick={openWhy}>
                ¿Por qué?
              </Button>
            )}
            <Button
              size="lg"
              className="h-12 flex-1 rounded-md bg-white text-black hover:bg-white/90 hover:text-black"
              disabled={exerciseSelection === null || exerciseCorrect === false}
              onClick={exerciseCorrect === true ? () => { sfx.continue(); goNext() } : onRevisar}
            >
              {exerciseCorrect === true ? "Continuar" : "Revisar"}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 flex justify-center px-4 pt-6 pb-[var(--cta-pb)] bg-gradient-to-t from-background via-background/90 to-transparent pointer-events-none">
      <div className="w-full max-w-md pointer-events-auto">
        {content}
      </div>
    </div>
  )
}

function Slide0({
  name,
  setName,
  sfx,
  onNext,
  onSignIn,
}: {
  name: string
  setName: (v: string) => void
  sfx: ReturnType<typeof useSfx>
  onNext: () => void
  onSignIn: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  function handleContinue() {
    if (!name.trim()) return
    sfx.continue()
    onNext()
  }

  useEffect(() => {
    const id = setTimeout(() => inputRef.current?.focus(), 350)
    return () => clearTimeout(id)
  }, [])

  return (
    <div className="flex-1 w-full flex flex-col">
      {/* Título + contenido agrupados y centrados verticalmente */}
      <motion.div
        className="flex flex-1 flex-col justify-center gap-7 pt-[16vh]"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <div className="flex flex-col gap-2 text-center">
          <h2 className="text-3xl font-bold">¡Hola!</h2>
          <p className="text-lg text-foreground/70">¿Cómo te llamás?</p>
        </div>

        <input
          ref={inputRef}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleContinue() }}
          placeholder="Tu nombre o apodo"
          className="h-12 w-full rounded-xl border border-border bg-accent px-4 text-foreground outline-none focus:border-primary transition-colors"
        />

        <div className="flex flex-col gap-2">
          <Button size="lg" className="h-12 w-full rounded-md bg-white text-black hover:bg-white/90 hover:text-black" disabled={!name.trim()} onClick={handleContinue}>
            Continuar
          </Button>
          <Button variant="outline" size="lg" className="h-12 w-full rounded-md gap-2" onClick={onSignIn}>
            <GoogleIcon className="size-5" />
            Ya tengo una cuenta
          </Button>
        </div>
      </motion.div>
    </div>
  )
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18A10.97 10.97 0 0 0 1 12c0 1.77.43 3.45 1.18 4.93l3.66-2.83z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
    </svg>
  )
}

function ProgressBar({ step, onBack }: { step: number; onBack: () => void }) {
  const pct = (step / (TOTAL_STEPS - 1)) * 100

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 z-50 bg-background flex items-center gap-3 px-4 pt-5 pb-3"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <button
        onClick={onBack}
        className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Volver"
      >
        <ChevronLeft className="size-6" />
      </button>
      <div className="flex-1 h-3 rounded-full bg-border overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-primary"
          initial={{ width: "0%" }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.45, ease: [0.32, 0.72, 0, 1] }}
        />
      </div>
    </motion.div>
  )
}

function BeltGrid({
  cellFor,
  onItemTap,
  showState,
}: {
  cellFor: (index: number) => Cell
  onItemTap?: () => void
  showState?: boolean
}) {
  let globalIdx = 0
  return (
    <div className="flex flex-col gap-1">
      {WHITE_BELT_FUNCTIONS.map((fn) => {
        const topic = WHITE_TOPICS.find((t) => t.key === fn.key)!
        return (
          <div key={fn.name} className="flex items-center justify-between gap-3">
            <span className="text-base leading-none text-foreground">{fn.name}</span>
            <div className="flex gap-1">
              {fn.items.map((typeId) => {
                const cell = cellFor(globalIdx)
                globalIdx += 1
                return <ItemPill key={typeId} topic={topic} typeId={typeId} cell={cell} onTap={onItemTap} showState={showState} />
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ItemPill({
  topic,
  typeId,
  cell,
  onTap,
  showState,
}: {
  topic: Topic
  typeId: string
  cell: Cell
  onTap?: () => void
  showState?: boolean
}) {
  const color = cellColor(cell)
  const label = cellLabel(cell)
  const painted = color !== null
  const skill = exerciseTypeInfo({ type: typeId })
  return (
    <Dialog>
      <DialogTrigger
        onClick={onTap}
        aria-label={`${topic.name} — ${skill.label}`}
        style={painted ? { color, borderColor: `${color}99`, backgroundColor: `${color}33` } : undefined}
        className={cn(
          "flex h-6 w-9 items-center justify-center rounded-md border text-[0.6rem] font-semibold tabular-nums transition-opacity hover:opacity-80",
          !painted && "border-white/15 bg-white/5 text-foreground/40",
        )}
      >
        {label}
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader className="gap-0.5">
          <DialogTitle className="font-sans text-sm font-semibold text-foreground">{topic.name}</DialogTitle>
          <DialogDescription className="text-sm leading-relaxed text-foreground/80">
            <MathText text={topic.short_description ?? topic.tooltip} />
          </DialogDescription>
        </DialogHeader>
        <div className="mt-1 flex flex-col gap-0.5 border-t border-border pt-3">
          <span className="text-sm font-semibold text-foreground">{skill.label}</span>
          <span className="text-sm text-foreground/70">{skill.description}</span>
        </div>
        {showState && (
          <div className="flex flex-col gap-0.5 border-t border-border pt-3">
            <span className="text-sm font-semibold" style={{ color: STATE_INFO[cell.kind].color }}>
              {STATE_INFO[cell.kind].label}
            </span>
            <span className="text-sm text-foreground/70">{stateDescription(cell)}</span>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function OptionButton({
  children,
  selected,
  onClick,
  className,
  style,
}: {
  children: React.ReactNode
  selected?: boolean
  onClick: () => void
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <button
      onClick={onClick}
      style={style}
      className={cn(
        "rounded-md border bg-white/5 px-4 py-3.5 font-medium transition-colors",
        selected
          ? "border-[#7e80f7] text-[#c4c6ff]"
          : "border-white/10 text-foreground/80 hover:border-white/20",
        className,
      )}
    >
      {children}
    </button>
  )
}

function CareerCard({
  emoji,
  label,
  selected,
  onClick,
  className,
}: {
  emoji: string
  label: string
  selected?: boolean
  onClick: () => void
  className?: string
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-md border bg-white/5 py-6 font-medium transition-colors",
        selected
          ? "border-[#7e80f7] text-[#c4c6ff]"
          : "border-white/10 text-foreground/80 hover:border-white/20",
        className,
      )}
    >
      <span className="text-2xl leading-none">{emoji}</span>
      <span className="text-sm">{label}</span>
    </button>
  )
}
