"use client"

import { AnimatePresence, motion } from "motion/react"
import { Button } from "@/components/ui/button"
import { useSfx } from "@/lib/audio/useSfx"
import { saveOnboarding } from "@/lib/onboarding/storage"
import { cn } from "@/lib/utils"
import MathText from "@/components/math-text"
import { BELT_BAR_COLORS, BELT_HEX, CATALOGS, type BeltKey, type CourseId } from "@/lib/catalog"
import { useGridLayout } from "@/lib/latex-visual-length"
import { ONBOARDING_UNIVERSITIES, UNIVERSITY_TAG_BY_KEY, matchUniversities } from "@/lib/university-tags"
import { ChevronLeft, LayersIcon, TargetIcon } from "lucide-react"
import { useSignIn, useSignUp } from "@clerk/nextjs"
import { useEffect, useLayoutEffect, useRef, useState } from "react"

const CAREERS = [
  { value: "E", label: "Ingeniería", emoji: "⚙️" },
  { value: "S", label: "Ciencia", emoji: "🔬" },
  { value: "T", label: "Tecnología", emoji: "🤖" },
  { value: "M", label: "Matemáticas", emoji: "📐" },
]

// Pregunta de motivación (slide 2). El slug se persiste en la inscripción.
const MOTIVATIONS = [
  { value: "cursada", emoji: "📆", label: "Llevar la cursada al día." },
  { value: "bases", emoji: "🏗️", label: "Reforzar mis bases." },
  { value: "conceptos", emoji: "🧠", label: "Incorporar lo que ya aprendí." },
  { value: "competir", emoji: "🤼", label: "Competir en el ranking." },
]

// Selección de curso (slide 3). El value es el slug/CourseId; define el tutorial
// y el curso default al registrarse.
const COURSES: { value: CourseId; emoji: string; label: string }[] = [
  { value: "analisis", emoji: "📈", label: "Análisis Matemático" },
  { value: "algebra", emoji: "🧮", label: "Álgebra Lineal" },
  { value: "probabilidad", emoji: "🎲", label: "Probabilidad y Estadística" },
]

// Logos monocromos (gris) de universidades para los botones del step de universidad.
// El gris se atenúa sin seleccionar y se lleva a blanco (brightness) al seleccionar.
const UNIVERSITY_LOGOS: Partial<Record<string, string>> = {
  UNSAM: "/universities/unsam.png",
}

type OnboardingExercise = {
  question: string
  options: string[]
  correctIndex: number
  feedback: string
  explanation: string
}

// Ejercicio de prueba por curso (slide 5). Cada uno mapea al primer ítem real del
// curso (ver seed_intro_item en el backend), y el resultado se persiste.
const ONBOARDING_EXERCISES: Record<CourseId, OnboardingExercise> = {
  analisis: {
    question:
      "Una función transforma cada número en ese número más 2.\n$$f(x) = x + 2$$\n¿Cuál es el valor de $f(2)$?",
    options: ["$4$", "$0$", "$2$", "$6$"],
    correctIndex: 0,
    feedback: "La imagen del 2 es $f(2) = 2 + 2 = 4$.",
    explanation:
      "La **imagen** de un valor $x$ es lo que devuelve la función al aplicarla, es decir $f(x)$.\n\nAcá la función suma 2, así que\n$$f(2) = 2 + 2 = 4$$\nLa imagen del 2 es 4. Esperemos que no te hayas equivocado en esta.",
  },
  algebra: {
    question:
      "Cuando multiplicás potencias de la misma base, los exponentes se suman.\n$$2^2 \\cdot 2^3 = 2^x$$\n¿Cuál es el valor de $x$?",
    options: ["$5$", "$6$", "$32$", "$8$"],
    correctIndex: 0,
    feedback: "Los exponentes se suman: $2^2 \\cdot 2^3 = 2^{2+3} = 2^5$.",
    explanation:
      "Una potencia encadena multiplicaciones: $2^2 \\cdot 2^3 = (2 \\cdot 2)(2 \\cdot 2 \\cdot 2) = 2^5$.\n\nPor eso los exponentes **se suman**: $x = 2 + 3 = 5$. Esperemos que no te hayas equivocado en esta.",
  },
  probabilidad: {
    question:
      "Tirás una moneda dos veces y anotás el resultado de cada tiro.\n¿Cuántos resultados posibles hay en total?",
    options: ["$4$", "$2$", "$3$", "$8$"],
    correctIndex: 0,
    feedback: "Cada tiro tiene 2 opciones: $2 \\cdot 2 = 4$ resultados.",
    explanation:
      "El primer tiro puede salir de 2 formas y, por cada una, el segundo también: cara-cara, cara-ceca, ceca-cara y ceca-ceca.\n\nPor la **regla del producto**, $2 \\cdot 2 = 4$. Ojo: cara-ceca y ceca-cara son resultados distintos — el orden importa.",
  },
}

// Unidades del curso, con el color de su cinturón, para los chips de la slide 4.
function courseUnits(course: CourseId): { name: string; color: string }[] {
  return CATALOGS[course].belts.flatMap((b) =>
    b.units.map((u) => ({ name: u.name, color: BELT_HEX[b.key as BeltKey].onDark })),
  )
}

const UNIT_GRID_ROWS = 7

// Tamaño de cuadradito (10px) + gap (1px), igual que el ProgressGrid de la landing
// (marketing-home.tsx). No se estira: se calculan cuántas columnas de ese tamaño fijo
// entran en el ancho disponible.
const UNIT_SQ_PX = 10
const UNIT_GAP_PX = 1

// Elige el color de un cuadradito según el progreso `p` (0..1) de la grilla, con una
// curva gaussiana por unidad centrada en i/(n-1): al principio domina la primera
// unidad, y a medida que avanza el progreso el peso se traslada a las siguientes,
// con solapamiento (mezcla transitoria) entre unidades vecinas. Generaliza a N
// unidades el mismo espíritu de la matriz de probabilidades (WP) del ProgressGrid.
function pickUnitColor(units: { color: string }[], p: number): string {
  const n = units.length
  if (n <= 1) return units[0].color
  // Ancho de la campana relativo a la distancia entre unidades vecinas: cuanto más
  // ancha, más solapan colores no vecinos, igual de generoso que el WP de la
  // landing (ahí el color inicial todavía pesaba ~50% a mitad de camino del
  // siguiente breakpoint).
  const spacing = 1 / (n - 1)
  const sigma = spacing
  const weights = units.map((_, i) => {
    const center = i / (n - 1)
    return Math.exp(-((p - center) ** 2) / (2 * sigma * sigma))
  })
  const sum = weights.reduce((a, b) => a + b, 0)
  let r = Math.random() * sum
  for (let i = 0; i < n; i++) {
    r -= weights[i]
    if (r <= 0) return units[i].color
  }
  return units[n - 1].color
}

// Techo del ciclo creciente de "bursty": 1,2,3,...,8,1,2,3,...
const UNIT_GRID_BURST_MAX = 8

// Grilla animada de cuadraditos de tamaño fijo (ancho completo, muchas columnas). En
// ambos modos se llena columna por columna, de izquierda a derecha (una unidad se
// agota antes de pasar a la siguiente), y los cuadraditos aparecen de a uno. Lo que
// cambia entre modos es el largo de las "rachas" seguidas de la misma unidad:
//
// `pace="regular"` (Repasar): rachas cortas y mezcladas, largo aleatorio 1-5 —
// una sesión de repaso mezcla varios temas.
// `pace="bursty"` (Practicar): rachas que crecen en ciclo 1,2,3,...,8,1,2,... —
// en modo libre la gente tiende a encadenar varios ejercicios seguidos del mismo
// tema antes de cambiar.
//
// En ambos modos el color de cada cuadradito sigue el mismo patrón probabilístico y
// mezclado (pickUnitColor) según el progreso global de llenado.
// Fila de chips (uno por unidad) de ancho uniforme, medido con el ancho real
// renderizado del chip más largo (no una estimación en `ch`, que subestima o
// sobrestima según la fuente). Se mide en un primer pase sin ancho fijo y se aplica
// el máximo a todos antes del paint (useLayoutEffect), sin flash visual.
function UnitChipsRow({ units }: { units: { name: string; color: string }[] }) {
  const rowRef = useRef<HTMLDivElement>(null)
  const [chipWidth, setChipWidth] = useState<number | null>(null)
  const [measuredKey, setMeasuredKey] = useState<string | null>(null)
  const unitsKey = units.map((u) => u.name).join("|")

  // Patrón oficial de React para "ajustar estado cuando cambia una prop": el reset
  // ocurre sincrónicamente durante el render, no en un efecto dedicado solo a eso
  // (ver "you-might-not-need-an-effect" en la doc de React).
  if (unitsKey !== measuredKey) {
    setMeasuredKey(unitsKey)
    setChipWidth(null)
  }

  useLayoutEffect(() => {
    if (chipWidth !== null) return
    const chips = rowRef.current?.querySelectorAll<HTMLElement>(".unit-chip")
    if (!chips || !chips.length) return
    const max = Math.max(...Array.from(chips, (c) => c.getBoundingClientRect().width))
    if (max > 0) setChipWidth(Math.ceil(max))
  }, [chipWidth, unitsKey])

  return (
    <div ref={rowRef} className="mx-auto grid w-fit grid-cols-[max-content_max-content] gap-2">
      {units.map((u, i, arr) => {
        const isLoneLast = arr.length % 2 === 1 && i === arr.length - 1
        return (
          <span
            key={u.name}
            className={cn(
              "unit-chip inline-flex items-center justify-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm",
              isLoneLast && "col-span-2 justify-self-center",
            )}
            style={{ color: u.color, width: chipWidth ?? undefined }}
          >
            <span className="size-2.5 shrink-0 rounded-[2px]" style={{ background: u.color }} />
            {u.name}
          </span>
        )
      })}
    </div>
  )
}

function UnitGrid({
  units,
  pace,
}: {
  units: { name: string; color: string }[]
  pace: "regular" | "bursty"
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const [cols, setCols] = useState(0)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const compute = () => {
      const w = el.clientWidth
      setCols(Math.max(units.length, Math.floor((w + UNIT_GAP_PX) / (UNIT_SQ_PX + UNIT_GAP_PX))))
    }
    compute()
    const ro = new ResizeObserver(compute)
    ro.observe(el)
    return () => ro.disconnect()
  }, [units.length])

  useEffect(() => {
    const rows = UNIT_GRID_ROWS
    const total = cols * rows
    const grid = gridRef.current
    if (!grid || !total) return
    const sqs = Array.from(grid.querySelectorAll<HTMLDivElement>(".unit-sq"))

    // Orden de índices DOM (row*cols+col) a recorrer: columna por columna, de
    // izquierda a derecha, de arriba a abajo dentro de cada una.
    const order: number[] = []
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) order.push(r * cols + c)
    }

    let filled = 0
    let batchLeft = 0 // cuadraditos que faltan del bache actual
    let burstIdx = 0 // contador del ciclo creciente (solo "bursty")
    let stepDelay = 0 // frames hasta el próximo cuadradito
    let rafId = 0

    function nextBatchSize(): number {
      if (pace === "bursty") {
        burstIdx++
        return ((burstIdx - 1) % UNIT_GRID_BURST_MAX) + 1
      }
      return 1 + Math.floor(Math.random() * 5)
    }

    function step() {
      if (filled >= total) return
      if (stepDelay > 0) {
        stepDelay--
        rafId = requestAnimationFrame(step)
        return
      }
      if (batchLeft === 0) {
        batchLeft = Math.min(nextBatchSize(), total - filled)
        stepDelay = 10 + Math.floor(Math.random() * 5) // pausa entre baches
        rafId = requestAnimationFrame(step)
        return
      }
      const p = filled / (total - 1)
      sqs[order[filled]].style.background = pickUnitColor(units, p)
      filled++
      batchLeft--
      stepDelay = 3 + Math.floor(Math.random() * 3) // cuadradito a cuadradito, dentro del bache
      rafId = requestAnimationFrame(step)
    }
    rafId = requestAnimationFrame(step)
    return () => cancelAnimationFrame(rafId)
  }, [units, cols, pace])

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div ref={containerRef} className="w-full min-w-0">
        <div
          ref={gridRef}
          className="grid gap-px"
          style={{ gridTemplateColumns: `repeat(${cols}, ${UNIT_SQ_PX}px)` }}
        >
          {Array.from({ length: cols * UNIT_GRID_ROWS }).map((_, i) => (
            <div key={i} className="unit-sq h-2.5 w-2.5 rounded-[1px] bg-white/[0.06]" />
          ))}
        </div>
      </div>
    </div>
  )
}

const TOTAL_STEPS = 13

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
            ? " "
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
  const { signUp } = useSignUp()
  const sfx = useSfx()
  const [step, setStep] = useState(-1) // -1 = intro animada del logo
  const [prevStep, setPrevStep] = useState(-1)
  const [direction, setDirection] = useState<1 | -1>(1)
  const [name, setName] = useState("")
  const [motivation, setMotivation] = useState("")
  const [course, setCourse] = useState<CourseId | "">("")
  const [exerciseSelection, setExerciseSelection] = useState<number | null>(null)
  const [exerciseCorrect, setExerciseCorrect] = useState<boolean | null>(null)
  const [wrongOptions, setWrongOptions] = useState<number[]>([])
  const [shakeIdx, setShakeIdx] = useState<number | null>(null)
  const [showWhy, setShowWhy] = useState(false)
  const wrongResetRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [career, setCareer] = useState("")
  const [university, setUniversity] = useState("")
  const [universityOther, setUniversityOther] = useState("")
  const [showOther, setShowOther] = useState(false)
  const universityInputRef = useRef<HTMLInputElement>(null)
  const universitySuggestions = universityOther.trim() ? matchUniversities(universityOther) : []

  // Curso resuelto para el render (el ejercicio y las unidades siempre necesitan
  // uno; antes de elegir cae a analisis, pero esas slides van gateadas por course).
  const courseKey: CourseId = course || "analisis"
  const currentUnits = courseUnits(courseKey)
  const exercise = ONBOARDING_EXERCISES[courseKey]
  const exerciseUseGrid = useGridLayout(exercise.options)

  function selectUniversitySuggestion(key: string) {
    sfx.select()
    setUniversityOther(key)
    universityInputRef.current?.focus()
  }

  // Acierto limpio = correcto sin ningún error previo. Decide el estado inicial
  // del ítem (mañana vs hoy) y se persiste al registrarse.
  const firstTryCorrect = exerciseCorrect === true && wrongOptions.length === 0

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
    if (step === 11 && showOther) {
      setShowOther(false)
      return
    }
    // Al volver desde la felicitación (6) al ejercicio (5), reseteamos su estado
    // para que se pueda rehacer desde cero.
    if (step === 6) {
      setExerciseSelection(null)
      setExerciseCorrect(null)
      setWrongOptions([])
    }
    setPrevStep(step)
    setDirection(-1)
    setStep((s) => Math.max(0, s - 1))
  }

  function handleMotivation(value: string) {
    sfx.select()
    setMotivation(value)
  }

  function handleCourse(value: CourseId) {
    sfx.select()
    setCourse(value)
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
    const isCorrect = exerciseSelection === exercise.correctIndex
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

  // Final del onboarding = registro: arranca un sign-UP con Google. Un usuario
  // nuevo completa el sign-up de una (sin el error "External Account not found"
  // que da el sign-in al no encontrar cuenta). Si la cuenta ya existía, el
  // callback /sso-callback transfiere el sign-up a sign-in.
  function onFinish() {
    if (!signUp) return
    saveOnboarding({
      name: name.trim(),
      career,
      university,
      course: courseKey,
      motivation,
      introItemCorrect: firstTryCorrect,
    })
    const origin = window.location.origin
    signUp.sso({
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
                  <MathText text={exercise.explanation} />
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

              {/* ── SLIDE 2: Motivación ── */}
              {step === 2 && (
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col gap-2 text-center">
                    <h2 className="text-2xl font-bold">¿Qué te motiva?</h2>
                    <p className="text-foreground/85">
                      Marcá la que más te identifique.
                    </p>
                  </div>
                  <div className="flex flex-col gap-2.5">
                    {MOTIVATIONS.map((m) => (
                      <ChoiceRow
                        key={m.value}
                        emoji={m.emoji}
                        label={m.label}
                        selected={motivation === m.value}
                        onClick={() => handleMotivation(m.value)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* ── SLIDE 3: Selección de curso ── */}
              {step === 3 && (
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col gap-2 text-center">
                    <h2 className="text-2xl font-bold">¿Por dónde empezamos?</h2>
                    <p className="text-foreground/85">
                      Marcá la que te trajo hasta acá. Podés cambiar cuando quieras.
                    </p>
                  </div>
                  <div className="flex flex-col gap-2.5">
                    {COURSES.map((c) => (
                      <ChoiceRow
                        key={c.value}
                        emoji={c.emoji}
                        label={c.label}
                        selected={course === c.value}
                        onClick={() => handleCourse(c.value)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* ── SLIDE 4: Curso + unidades ── */}
              {step === 4 && (
                <div className="flex flex-col gap-6 pt-6">
                  <div className="flex flex-col gap-3 leading-relaxed text-foreground/85">
                    <p>
                      ¡Excelente! Los contenidos de este curso están divididos en{" "}
                      {currentUnits.length} unidades correlativas:
                    </p>
                  </div>
                  <UnitChipsRow units={currentUnits} />
                  <p className="leading-relaxed text-foreground/85">
                    Dentro de cada unidad hay varios <strong className="text-foreground">temas</strong>,
                    y cada uno trae distintos <strong className="text-foreground">tipos</strong> de
                    ejercicios para practicar.
                  </p>
                  <p className="font-medium text-foreground/90">
                    ¿Vamos con uno de prueba?
                  </p>
                </div>
              )}

              {/* ── SLIDE 5: Ejercicio de prueba ── */}
              {step === 5 && (
                <div className="flex flex-col gap-5">
                  <div className="text-base leading-snug">
                    <MathText text={exercise.question} />
                  </div>
                  <div className={exerciseUseGrid ? "grid grid-cols-2 gap-2" : "flex flex-col gap-2"}>
                    {exercise.options.map((opt, i) => {
                      const isSelected = exerciseSelection === i
                      const solved = exerciseCorrect === true
                      const isCorrectOpt = i === exercise.correctIndex
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
                            "w-full rounded-md border bg-white/5 px-4 py-3.5 text-base transition-[color,border-color,opacity] duration-200 disabled:pointer-events-none",
                            exerciseUseGrid ? "text-center" : "text-left",
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

              {/* ── SLIDE 6: Felicitación + dos modos ── */}
              {step === 6 && (
                <div className="flex flex-col gap-4 leading-relaxed text-foreground/85">
                  <p>
                    ¡Excelente! Acabás de resolver tu{" "}
                    <strong className="text-foreground">primer ejercicio</strong>.
                  </p>
                  <p>
                    Los ejercicios de intervalo están pensados para que trabajes las principales{" "}
                    <strong className="text-foreground">definiciones y propiedades</strong> de cada
                    tema.
                  </p>
                  <p>
                    Vas a encontrarlos en dos modos, <strong className="text-foreground">Repasar</strong>{" "}
                    y <strong className="text-foreground">Practicar</strong>.
                  </p>
                </div>
              )}

              {/* ── SLIDE 7: Modo Repasar ── */}
              {step === 7 && (
                <div className="flex flex-col gap-4 leading-relaxed text-foreground/85">
                  <p>
                    El modo{" "}
                    <strong className="text-foreground">
                      Repasar <LayersIcon className="inline size-[18px] align-[-3px]" />
                    </strong>{" "}
                    arma sesiones de repaso según cómo te va en los distintos tipos de ejercicios.
                  </p>
                  <p>
                    Los que te cuesten van a aparecer <strong className="text-foreground">más
                    seguido</strong>, y los que ya incorporaste, cada vez menos.
                  </p>
                  <UnitGrid units={currentUnits} pace="regular" />
                  <p>
                    La idea es que incorpores los contenidos de manera{" "}
                    <strong className="text-foreground">gradual</strong>, a tus tiempos.
                  </p>
                </div>
              )}

              {/* ── SLIDE 8: Modo Practicar ── */}
              {step === 8 && (
                <div className="flex flex-col gap-4 leading-relaxed text-foreground/85">
                  <p>
                    En el modo{" "}
                    <strong className="text-foreground">
                      Practicar <TargetIcon className="inline size-[18px] align-[-3px]" />
                    </strong>
                    . Elegís uno o varios temas y resolvés todos los ejercicios que quieras.
                  </p>
                  <p>
                    Te permite <strong className="text-foreground">enfocarte</strong> en lo que más
                    te cuesta, independientemente del modo Repasar.
                  </p>
                  <UnitGrid units={currentUnits} pace="bursty" />
                  <p>
                    Ideal para reforzar un tema de clase, o volver sobre algo que te costó en una
                    sesión de repaso.
                  </p>
                </div>
              )}

              {/* ── SLIDE 9: Cierre ── */}
              {step === 9 && (
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

              {/* ── SLIDE 10: Carrera ── */}
              {step === 10 && (
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

              {/* ── SLIDE 11: Universidad ── */}
              {step === 11 && (
                <div className="flex flex-col gap-5 text-center">
                  <h2 className="text-2xl font-bold">¿Dónde?</h2>
                  <div className="flex flex-col gap-2.5">
                    <div className="grid grid-cols-3 gap-2.5">
                      {ONBOARDING_UNIVERSITIES.map((u) => {
                        const logo = UNIVERSITY_LOGOS[u]
                        const isSel = university === u && !showOther
                        return (
                          <OptionButton
                            key={u}
                            className={cn(
                              "flex h-[52px] items-center justify-center text-base",
                              logo && "px-2 py-2",
                            )}
                            style={logo ? undefined : UNIVERSITY_TAG_BY_KEY[u]?.font}
                            selected={isSel}
                            onClick={() => handleUniversity(u)}
                          >
                            {logo ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={logo}
                                alt={u}
                                className={cn(
                                  "h-8 w-auto max-w-full object-contain transition-[filter,opacity]",
                                  isSel ? "opacity-100 brightness-150" : "opacity-90",
                                )}
                              />
                            ) : (
                              u
                            )}
                          </OptionButton>
                        )
                      })}
                    </div>
                    {showOther ? (
                      <div className="flex flex-col gap-3">
                        <input
                          ref={universityInputRef}
                          type="text"
                          value={universityOther}
                          onChange={(e) => setUniversityOther(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && confirmOther()}
                          placeholder="Ej: UNQ, UNLa, UNGS…"
                          autoFocus
                          className="h-[52px] rounded-md border border-[#7e80f7] bg-white/5 px-4 text-foreground outline-none transition-colors"
                        />
                        {universitySuggestions.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {universitySuggestions.map((s) => (
                              <button
                                key={s.key}
                                type="button"
                                onClick={() => selectUniversitySuggestion(s.key)}
                                className="inline-flex items-center justify-center rounded-md border px-2.5 py-1.5 text-xs transition-opacity hover:opacity-80"
                                style={{
                                  color: s.color,
                                  borderColor: `${s.color}99`,
                                  backgroundColor: `${s.color}33`,
                                  ...s.font,
                                }}
                              >
                                {s.key}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <OptionButton selected={false} onClick={selectOther}>
                        Otra
                      </OptionButton>
                    )}
                  </div>
                </div>
              )}

              {/* ── SLIDE 12: Registro ── */}
              {step === 12 && (
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
        motivation={motivation}
        course={course}
        career={career}
        university={university}
        showWhy={showWhy}
        openWhy={openWhy}
        continueFromWhy={continueFromWhy}
        exercise={exercise}
        exerciseSelection={exerciseSelection}
        exerciseCorrect={exerciseCorrect}
        sfx={sfx}
        goNext={goNext}
        confirmOther={confirmOther}
        onRevisar={onRevisar}
      />
    </main>
  )
}

function PinnedCTA({
  step,
  showOther,
  universityOther,
  motivation,
  course,
  career,
  university,
  showWhy,
  openWhy,
  continueFromWhy,
  exercise,
  exerciseSelection,
  exerciseCorrect,
  sfx,
  goNext,
  confirmOther,
  onRevisar,
}: {
  step: number
  showOther: boolean
  universityOther: string
  motivation: string
  course: CourseId | ""
  career: string
  university: string
  showWhy: boolean
  openWhy: () => void
  continueFromWhy: () => void
  exercise: OnboardingExercise
  exerciseSelection: number | null
  exerciseCorrect: boolean | null
  sfx: ReturnType<typeof useSfx>
  goNext: () => void
  confirmOther: () => void
  onRevisar: () => void
}) {
  const ctaCls = "h-[var(--cta-h)] w-full rounded-md bg-white text-black hover:bg-white/90 hover:text-black"

  if (showWhy) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-40 flex justify-center px-4 pt-[var(--cta-pt)] pb-[var(--cta-pb)] bg-gradient-to-t from-background via-background/90 to-transparent pointer-events-none">
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
    case 6:
    case 7:
    case 8:
    case 9:
      content = (
        <Button size="lg" className={ctaCls} onClick={() => { sfx.continue(); goNext() }}>
          Continuar
        </Button>
      )
      break
    case 4:
      content = (
        <Button size="lg" className={ctaCls} onClick={() => { sfx.continue(); goNext() }}>
          ¡Vamos!
        </Button>
      )
      break
    case 2:
      content = (
        <Button size="lg" className={ctaCls} disabled={!motivation} onClick={() => { sfx.continue(); goNext() }}>
          Continuar
        </Button>
      )
      break
    case 3:
      content = (
        <Button size="lg" className={ctaCls} disabled={!course} onClick={() => { sfx.continue(); goNext() }}>
          Continuar
        </Button>
      )
      break
    case 5:
      // handled separately below (footer del ejercicio)
      break
    case 10:
      content = (
        <Button size="lg" className={ctaCls} disabled={!career} onClick={() => { sfx.continue(); goNext() }}>
          Continuar
        </Button>
      )
      break
    case 11:
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

  // Step 5: footer verde animado al acertar el ejercicio.
  if (step === 5) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-40 flex justify-center pointer-events-none">
        <div className={cn(
          "w-full max-w-md pointer-events-auto px-4 pb-[var(--cta-pb)] transition-colors duration-300",
          exerciseCorrect === true
            ? "border-t border-green-500/40 bg-green-500/10 pt-0"
            : exerciseCorrect === false
            ? "border-t border-orange-500/40 bg-orange-500/10 pt-0"
            : "bg-gradient-to-t from-background via-background/90 to-transparent pt-[var(--cta-pt)]",
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
                    <MathText text={exercise.feedback} />
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
              <Button variant="outline" size="lg" className="h-[var(--cta-h)] flex-1 rounded-md" onClick={openWhy}>
                ¿Por qué?
              </Button>
            )}
            <Button
              size="lg"
              className="h-[var(--cta-h)] flex-1 rounded-md bg-white text-black hover:bg-white/90 hover:text-black"
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
    <div className="fixed bottom-0 left-0 right-0 z-40 flex justify-center px-4 pt-[var(--cta-pt)] pb-[var(--cta-pb)] bg-gradient-to-t from-background via-background/90 to-transparent pointer-events-none">
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

// Fila de selección con emoji + label (+ bajada opcional). Usada por las slides de
// motivación y curso.
function ChoiceRow({
  emoji,
  label,
  description,
  selected,
  onClick,
}: {
  emoji: string
  label: string
  description?: string
  selected?: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-md border bg-white/5 px-4 py-3.5 text-left transition-colors",
        selected
          ? "border-[#7e80f7]"
          : "border-white/10 hover:border-white/20",
      )}
    >
      <span className="text-2xl leading-none">{emoji}</span>
      <span className="flex flex-col gap-0.5">
        <span className={cn("font-medium", selected ? "text-[#c4c6ff]" : "text-foreground/90")}>
          {label}
        </span>
        {description && (
          <span className="text-sm leading-snug text-foreground/60">{description}</span>
        )}
      </span>
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
