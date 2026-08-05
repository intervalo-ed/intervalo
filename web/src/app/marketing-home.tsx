"use client"

import { useSplash } from "@/app/splash-context"
import { usePublicUniversityLeaderboard } from "@/app/UsePublicUniversityLeaderboard"
import { CountUp } from "@/components/count-up"
import { UniTag } from "@/components/university-tag"
import { XpDots } from "@/components/xp-dots"
import { Wordmark } from "@/components/wordmark"
import { BELT_LEGEND_COLORS, BELT_ONDARK_VIVID, BELT_ORDER, type BeltKey } from "@/lib/catalog"
import katex from "katex"
import "katex/dist/katex.min.css"
import { ChevronDown, UsersIcon } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useEffect, useMemo, useRef, useState } from "react"

type QuestionItem = { t2: string; t3: string; qt: string; q: string }
type UnitTrack = { name: string; belt: BeltKey; exprs: string[]; questions: QuestionItem[] }
type CourseTrack = { course: string; units: UnitTrack[] }

// Una "pista" por curso, con sus unidades en orden. El ciclo de la landing
// (NotationCycler + QuestionLoop) va rotando de curso en cada tick y, cada vez
// que vuelve a un curso, avanza a su siguiente unidad (ver useCourseTick).
const COURSE_TRACKS: CourseTrack[] = [
  {
    course: "Análisis",
    units: [
      {
        name: "Funciones",
        belt: "white",
        exprs: [
          "f(x) = ax^2 + bx + c",
          "y = \\sqrt{x}",
          "f(x) = \\dfrac{c}{x - a}",
          "g(x) = e^x \\cdot \\ln(x)",
          "h(x) = \\sin(x) + \\cos(x)",
        ],
        questions: [
          { t2: "Polinomios", t3: "Léxico", qt: "¿Cuál es el grado del siguiente polinomio?", q: "3x^4 - 2x + 1" },
          { t2: "Lineales", t3: "Formulación", qt: "¿Cuál es la pendiente de la siguiente función?", q: "y = 3x - 5" },
          { t2: "Cuadráticas", t3: "Clasificación", qt: "¿Cuántas raíces reales tiene la siguiente ecuación?", q: "x^2 - 4 = 0" },
        ],
      },
      {
        name: "Límites",
        belt: "blue",
        exprs: [
          "\\lim_{x \\to a} f(x) = L",
          "\\lim_{x\\to a^+} f(x) = \\lim_{x\\to a^-} f(x)",
          "\\lim_{x \\to a} \\dfrac{f(x)-f(a)}{x-a}",
          "\\lim_{x \\to \\infty} \\ln(x) = \\infty",
        ],
        questions: [
          { t2: "Directa", t3: "Resolución", qt: "¿Cuál es el resultado del siguiente límite?", q: "\\lim_{x \\to 3}(x^2 + 1)" },
          { t2: "Notable", t3: "Formulación", qt: "¿Cuánto vale este límite notable?", q: "\\lim_{x \\to 0}\\dfrac{\\sin x}{x}" },
          { t2: "Indeterm.", t3: "Resolución", qt: "¿Cuánto vale el siguiente límite?", q: "\\lim_{x \\to 2}\\dfrac{x^2 - 4}{x - 2}" },
        ],
      },
      {
        name: "Derivadas",
        belt: "violet",
        exprs: [
          "f'(x) = \\dfrac{d}{dx}f(x)",
          "\\dfrac{d}{dx}\\left[x^n\\right] = nx^{n-1}",
          "\\dfrac{\\partial f}{\\partial x}",
          "\\dfrac{dy}{dx} = \\cos(x)",
          "(fg)' = f'g + fg'",
        ],
        questions: [
          { t2: "Potencia", t3: "Derivación", qt: "¿Cuál es la derivada de la siguiente función?", q: "f(x) = x^5" },
          { t2: "Cadena", t3: "Derivación", qt: "¿Cuál es la derivada de la siguiente función compuesta?", q: "h(x) = (3x^2 + 1)^4" },
          { t2: "Exponencial", t3: "Formulación", qt: "¿Cuál es la derivada de la siguiente función?", q: "f(x) = e^{2x}" },
        ],
      },
      {
        name: "Integrales",
        belt: "brown",
        exprs: [
          "\\int x^n \\, dx = \\dfrac{x^{n+1}}{n+1} + C",
          "\\int f'(x) \\, dx = f(x) + C",
          "\\int \\dfrac{dx}{x} = \\ln|x| + C",
          "\\displaystyle\\int_a^b f(x) \\, dx = F(b) - F(a)",
        ],
        questions: [
          { t2: "Potencia", t3: "Integración", qt: "¿Cuál es la integral de la siguiente función?", q: "\\int x^4 \\, dx" },
          { t2: "Definida", t3: "Resolución", qt: "¿Cuánto vale la siguiente integral definida?", q: "\\int_0^1 x^2 \\, dx" },
          { t2: "Trigo", t3: "Formulación", qt: "¿Cuál es la integral de la siguiente función?", q: "\\int \\cos(x)\\,dx" },
        ],
      },
    ],
  },
  {
    course: "Álgebra",
    units: [
      {
        name: "Aritmética",
        belt: "white",
        exprs: [
          "a^m \\cdot a^n = a^{m+n}",
          "\\sqrt{a^2} = |a|",
          "a(b+c) = ab + ac",
          "|-a| = |a|",
          "a^2 - b^2 = (a-b)(a+b)",
          "\\log_a(xy) = \\log_a x + \\log_a y",
        ],
        questions: [
          { t2: "Potenciación", t3: "Resolución", qt: "¿Cuál es el resultado de la siguiente potencia?", q: "2^3 \\cdot 2^2" },
          { t2: "Radicales", t3: "Resolución", qt: "¿Cuánto vale la siguiente raíz?", q: "\\sqrt{81}" },
          { t2: "Logaritmos", t3: "Resolución", qt: "¿Cuál es el valor del siguiente logaritmo?", q: "\\log_3 27" },
        ],
      },
      {
        name: "Vectores",
        belt: "blue",
        exprs: [
          "\\vec{v} = (a, b)",
          "\\|\\vec{v}\\| = \\sqrt{a^2+b^2}",
          "\\vec{u} \\cdot \\vec{v}",
          "\\vec{u} \\times \\vec{v}",
          "\\vec{u} + \\vec{v} = \\vec{v} + \\vec{u}",
        ],
        questions: [
          { t2: "Norma", t3: "Resolución", qt: "¿Cuál es la norma del siguiente vector?", q: "\\vec{v} = (3, 4)" },
          { t2: "Producto", t3: "Resolución", qt: "¿Cuánto vale el siguiente producto escalar?", q: "(1,2)\\cdot(3,4)" },
          { t2: "Suma", t3: "Resolución", qt: "¿Cuál es el resultado de la siguiente suma de vectores?", q: "(1,2) + (3,-1)" },
        ],
      },
      {
        name: "Matrices",
        belt: "violet",
        exprs: [
          "A = \\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}",
          "\\det(A) = ad-bc",
          "A^{T}",
          "A^{-1}",
          "AX=B",
        ],
        questions: [
          { t2: "Determinantes", t3: "Resolución", qt: "¿Cuál es el determinante de la siguiente matriz?", q: "\\begin{pmatrix} 2 & 1 \\\\ 3 & 4 \\end{pmatrix}" },
          { t2: "Transpuesta", t3: "Formulación", qt: "¿Cuál es la transpuesta de la siguiente matriz?", q: "\\begin{pmatrix} 1 & 2 \\end{pmatrix}" },
          { t2: "Sistemas", t3: "Resolución", qt: "¿Cuál es la solución del siguiente sistema?", q: "\\begin{cases} x+y=3 \\\\ x-y=1 \\end{cases}" },
        ],
      },
      {
        name: "Espacios",
        belt: "brown",
        exprs: [
          "T(\\alpha\\vec{u} + \\vec{v}) = \\alpha T(\\vec{u}) + T(\\vec{v})",
          "\\alpha\\vec{u} + \\vec{v} \\in S",
          "T: V \\to W",
          "V = U \\oplus W",
        ],
        questions: [
          { t2: "Subespacios", t3: "Clasificación", qt: "¿El siguiente conjunto es un subespacio?", q: "S = \\{(x,y) : x = 2y\\}" },
          { t2: "Núcleo", t3: "Formulación", qt: "¿Cómo se define el núcleo de una transformación?", q: "\\ker(T)" },
          { t2: "Dimensión", t3: "Resolución", qt: "¿Cuál es la dimensión de la imagen?", q: "\\dim(\\operatorname{Im} T)" },
        ],
      },
    ],
  },
  {
    course: "Probabilidad",
    units: [
      {
        name: "Conteo",
        belt: "white",
        exprs: [
          "n! = n\\cdot(n-1)!",
          "\\binom{n}{k} = \\dfrac{n!}{k!(n-k)!}",
          "|A \\times B| = |A|\\cdot|B|",
          "P(n,k) = \\dfrac{n!}{(n-k)!}",
        ],
        questions: [
          { t2: "Factorial", t3: "Resolución", qt: "¿Cuánto vale el siguiente factorial?", q: "5!" },
          { t2: "Combinaciones", t3: "Resolución", qt: "¿Cuántas combinaciones hay?", q: "\\binom{6}{2}" },
          { t2: "Reglas", t3: "Resolución", qt: "¿Cuántas opciones hay en total?", q: "3 \\times 4" },
        ],
      },
      {
        name: "Probabilidad",
        belt: "blue",
        exprs: [
          "P(A) = \\dfrac{|A|}{|\\Omega|}",
          "P(A \\cup B)",
          "P(A|B) = \\dfrac{P(A \\cap B)}{P(B)}",
          "P(A^c) = P(\\Omega)-P(A)",
          "P(A|B) = \\dfrac{P(B|A)P(A)}{P(B)}",
        ],
        questions: [
          { t2: "Laplace", t3: "Resolución", qt: "¿Cuál es la probabilidad del siguiente evento?", q: "P(A) = \\dfrac{2}{6}" },
          { t2: "Condicional", t3: "Formulación", qt: "¿Cómo se calcula la siguiente probabilidad condicional?", q: "P(A|B)" },
          { t2: "Axiomas", t3: "Resolución", qt: "¿Cuánto vale la probabilidad del complemento?", q: "P(A^c) = 1-0.3" },
          { t2: "Bayes", t3: "Formulación", qt: "¿Cómo se calcula la siguiente probabilidad con Bayes?", q: "P(A|B) = \\dfrac{P(B|A)P(A)}{P(B)}" },
        ],
      },
      {
        name: "Variables",
        belt: "violet",
        exprs: [
          "E[X] = \\sum x_i p_i",
          "Var(X) = E[X^2]-(E[X])^2",
          "F(x) = P(X \\leq x)",
        ],
        questions: [
          { t2: "Esperanza", t3: "Resolución", qt: "¿Cuál es la esperanza de la siguiente variable?", q: "E[X] = \\sum x_i p_i" },
          { t2: "Varianza", t3: "Formulación", qt: "¿Cómo se calcula la siguiente varianza?", q: "Var(X)" },
          { t2: "Acumulada", t3: "Formulación", qt: "¿Qué representa la siguiente función?", q: "F(x) = P(X \\leq x)" },
        ],
      },
      {
        name: "Distribuciones",
        belt: "brown",
        exprs: [
          "X \\sim B(n,p)",
          "X \\sim N(\\mu,\\sigma^2)",
          "P(X=k) = \\dfrac{\\lambda^k e^{-\\lambda}}{k!}",
          "P(X=k) = \\binom{n}{k}p^k q^{n-k}",
        ],
        questions: [
          { t2: "Binomial", t3: "Resolución", qt: "¿Cuál es la probabilidad en la siguiente binomial?", q: "P(X=2),\\ X\\sim B(5,0.5)" },
          { t2: "Normal", t3: "Formulación", qt: "¿Cómo se nota la siguiente distribución normal?", q: "X \\sim N(0,1)" },
          { t2: "Poisson", t3: "Resolución", qt: "¿Cuál es la probabilidad en la siguiente Poisson?", q: "P(X=2) = \\dfrac{3^2 e^{-3}}{2!}" },
        ],
      },
    ],
  },
]

// Tick compartido por el título, NotationCycler y QuestionLoop: cada 1.5s
// avanza, y el curso/unidad que le toca a cada tick sale de aritmética modular
// (ver getTrackUnit), así los tres quedan sincronizados sin estado duplicado.
function useCourseTick() {
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1500)
    return () => clearInterval(id)
  }, [])
  return tick
}

function getTrackUnit(tick: number) {
  const track = COURSE_TRACKS[tick % COURSE_TRACKS.length]
  const occurrence = Math.floor(tick / COURSE_TRACKS.length)
  const unit = track.units[occurrence % track.units.length]
  return { course: track.course, unit }
}

// Leyenda del ProgressGrid para el curso vigente: una entrada por color de
// cinturón (en orden white→brown, los mismos 4 colores que pinta la grilla).
// Si un curso tiene más de una unidad del mismo cinturón, se muestran juntas
// como "unidad1 / unidad2" (no ocurre hoy en ninguna COURSE_TRACKS).
function courseLegend(tick: number): { belt: BeltKey; label: string }[] {
  const track = COURSE_TRACKS[tick % COURSE_TRACKS.length]
  return BELT_ORDER.map((belt) => {
    const names = track.units.filter((u) => u.belt === belt).map((u) => u.name)
    return names.length ? { belt, label: names.join(" / ") } : null
  }).filter((x): x is { belt: BeltKey; label: string } => x !== null)
}

// Pseudo-aleatorio determinístico a partir de un entero: mismo `seed` siempre
// da el mismo índice, así el server y el cliente eligen el mismo elemento en
// el primer render (Math.random() puro rompería la hidratación de React).
function pickSeeded<T>(items: T[], seed: number): T {
  const x = Math.sin(seed * 999) * 10000
  const r = x - Math.floor(x)
  return items[Math.floor(r * items.length)]
}

// Mismo tamaño de cuadradito que la leyenda (h-2.5 w-2.5 = 10px), con el
// mismo gap de 2px que tenía la grilla antes (pitch 12px). Menos columnas y
// filas que antes (26x40 a 8px) para que la grilla siga ocupando un ancho
// similar con cuadraditos más grandes.
const GRID_COLS = 22
const GRID_ROWS = 33
const GRID_CELL_PX = 12

const PROGRESS_GRID_BG_RGB: [number, number, number] = [19, 19, 36] // #131324

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

// Muestra una intensidad de la campana normal (Box-Muller), centrada en un
// tono medio-alto: la mayoría de los cuadraditos caen cerca del centro
// (opacos, legibles) y solo unos pocos llegan a los extremos (tenues o a
// brillo pleno).
function sampleNormalIntensity(mean = 0.68, stddev = 0.16, min = 0.58, max = 1.0): number {
  let u = 0
  let v = 0
  while (u === 0) u = Math.random()
  while (v === 0) v = Math.random()
  const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
  return Math.min(max, Math.max(min, mean + z * stddev))
}

function mixWithBg(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex)
  const mix = (channel: number, bg: number) => Math.round(channel * alpha + bg * (1 - alpha))
  return `rgb(${mix(r, PROGRESS_GRID_BG_RGB[0])}, ${mix(g, PROGRESS_GRID_BG_RGB[1])}, ${mix(b, PROGRESS_GRID_BG_RGB[2])})`
}

function tintGridColor(hex: string): string {
  return mixWithBg(hex, sampleNormalIntensity())
}

// Cuadraditos "sin actividad": mismo color plano para todos (no el color de
// la unidad, atenuado) — una versión apenas más clara que el fondo, para que
// se lean como parte de la misma grilla en vez de un hueco.
const PROGRESS_GRID_INACTIVE_COLOR = mixWithBg("#FFFFFF", 0.12)

const GRID_BG_STYLE = {
  backgroundImage:
    "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
  backgroundSize: "40px 40px",
}

function renderMath(expr: string) {
  return katex.renderToString(expr, { throwOnError: false, displayMode: true })
}

function NotationCycler({ tick }: { tick: number }) {
  const { unit } = getTrackUnit(tick)
  const color = BELT_LEGEND_COLORS[unit.belt]
  const expr = useMemo(() => pickSeeded(unit.exprs, tick), [unit, tick])

  return (
    <div className="flex w-[90%] max-w-[480px] flex-col items-center gap-2">
      <div className="flex items-center gap-2 font-mono text-[0.72rem] uppercase tracking-[0.14em] text-[#768899]">
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-[2px] transition-colors duration-300"
          style={{ background: color }}
        />
        <span>{unit.name}</span>
      </div>
      <div
        className="flex h-[72px] shrink-0 items-center justify-center text-[1.45rem] leading-none text-[#F6F8FC] [&_.katex-display]:m-0"
        dangerouslySetInnerHTML={{ __html: renderMath(expr) }}
      />
    </div>
  )
}

function QuestionLoop({ tick }: { tick: number }) {
  const { unit } = getTrackUnit(tick)
  const color = BELT_LEGEND_COLORS[unit.belt]
  const item = useMemo(() => pickSeeded(unit.questions, tick), [unit, tick])

  return (
    <div className="mx-auto grid h-[160px] max-w-[600px] grid-rows-[40px_40px_40px_1fr] text-center">
      {/* Tags: 1º renglón de la grilla */}
      <div className="row-start-1 flex flex-wrap items-center justify-center gap-2">
        <span
          className="h-2.5 w-2.5 shrink-0 -translate-y-px rounded-[2px] transition-colors duration-300"
          style={{ background: color }}
        />
        <span className="font-mono text-[0.62rem] uppercase tracking-[0.13em] text-[#768899]">
          {unit.name.toUpperCase()}
        </span>
        <span aria-hidden className="text-[0.5rem] text-[#38385A]">
          ◆
        </span>
        <span className="font-mono text-[0.62rem] uppercase tracking-[0.13em] text-[#768899]">
          {item.t2.toUpperCase()}
        </span>
        <span aria-hidden className="text-[0.5rem] text-[#38385A]">
          ◆
        </span>
        <span className="font-mono text-[0.62rem] uppercase tracking-[0.13em] text-[#768899]">
          {item.t3.toUpperCase()}
        </span>
      </div>
      {/* Pregunta: 3º renglón, pegada a la fórmula */}
      <div className="row-start-3 flex items-center justify-center text-[clamp(1.1rem,3.6vw,1.45rem)] leading-[1.4] text-[#F6F8FC]">
        {item.qt}
      </div>
      {/* Fórmula: arriba del espacio restante, cerca de la pregunta */}
      <div
        className="row-start-4 mx-auto flex max-w-[520px] items-start justify-center pt-2 font-medium leading-[1.5] text-[#F6F8FC] [&_.katex-display]:m-0 [&_.katex]:text-[clamp(1.25rem,4vw,1.5rem)]"
        dangerouslySetInnerHTML={{ __html: renderMath(item.q) }}
      />
    </div>
  )
}

function ProgressGrid({ tick }: { tick: number }) {
  const sectionRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const legend = courseLegend(tick)

  useEffect(() => {
    const COLS = GRID_COLS
    const ROWS = GRID_ROWS
    const TOTAL = COLS * ROWS
    const COLORS = BELT_ORDER.map((b) => BELT_ONDARK_VIVID[b])
    const WP: number[][] = [
      [0.0, 1.0, 0.0, 0.0, 0.0],
      [0.15, 0.8, 0.2, 0.0, 0.0],
      [0.3, 0.5, 0.35, 0.15, 0.0],
      [0.45, 0.25, 0.3, 0.35, 0.1],
      [0.6, 0.1, 0.15, 0.35, 0.3],
      [0.75, 0.05, 0.08, 0.2, 0.37],
      [1.0, 0.02, 0.05, 0.1, 0.25],
    ]

    function pickColor(p: number) {
      let i = 0
      while (i < WP.length - 2 && WP[i + 1][0] <= p) i++
      const t = (p - WP[i][0]) / (WP[i + 1][0] - WP[i][0])
      const probs = WP[i].slice(1).map((v, j) => v + (WP[i + 1][j + 1] - v) * t)
      const r = Math.random()
      let cum = 0
      for (let j = 0; j < probs.length; j++) {
        cum += probs[j]
        if (r < cum) return COLORS[j]
      }
      return COLORS[COLORS.length - 1]
    }

    const grid = gridRef.current
    const section = sectionRef.current
    if (!grid || !section) return

    const sqs = Array.from(grid.querySelectorAll<HTMLDivElement>(".sq"))

    // Cuadraditos "sin actividad": por columna, rachas cortas de 1 a 3 filas
    // seguidas que quedan sin pintar (nunca en blancos sueltos), simulando
    // días sin repasar en vez de ruido al azar cuadradito por cuadradito.
    const skipMask: boolean[][] = Array.from({ length: ROWS }, () => new Array(COLS).fill(false))
    for (let c = 0; c < COLS; c++) {
      let r = 0
      while (r < ROWS) {
        if (Math.random() < 0.05) {
          const len = 1 + Math.floor(Math.random() * 3)
          for (let i = 0; i < len && r < ROWS; i++, r++) skipMask[r][c] = true
        } else {
          r++
        }
      }
    }

    const colHeights = new Array(COLS).fill(0)
    let fillIdx = 0
    let animated = false
    let rafId = 0

    // Tope de "parejura" entre columnas: ninguna columna puede ir más de
    // MAX_COL_LEAD filas por delante de la columna disponible menos llena.
    const MAX_COL_LEAD = 5

    // Cuadraditos spawneados por frame — generación continua, sin ráfagas ni
    // pausas en el medio.
    const GRID_SPEED = 3

    function spawnSquare() {
      const avail: number[] = []
      for (let c = 0; c < COLS; c++) {
        if (colHeights[c] < ROWS) avail.push(c)
      }
      if (!avail.length) return
      const minHeight = Math.min(...avail.map((c) => colHeights[c]))
      const withinLead = avail.filter((c) => colHeights[c] - minHeight <= MAX_COL_LEAD)
      const col = withinLead[Math.floor(Math.random() * withinLead.length)]
      const row = colHeights[col]
      const color = pickColor(fillIdx / (TOTAL - 1))
      sqs[row * COLS + col].style.background = skipMask[row][col]
        ? PROGRESS_GRID_INACTIVE_COLOR
        : tintGridColor(color)
      colHeights[col]++
      fillIdx++
    }

    function step() {
      for (let i = 0; i < GRID_SPEED; i++) {
        if (fillIdx >= TOTAL) return
        spawnSquare()
      }
      rafId = requestAnimationFrame(step)
    }

    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !animated) {
          animated = true
          rafId = requestAnimationFrame(step)
        }
      },
      { threshold: 0.1 },
    )
    obs.observe(section)

    return () => {
      obs.disconnect()
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [])

  return (
    <div ref={sectionRef} className="px-10 py-12" style={GRID_BG_STYLE}>
      <div className="mx-auto w-fit">
        <div className="mb-5 flex flex-col gap-[0.55rem]">
          {legend.map((l) => (
            <div
              key={l.belt}
              className="flex items-center gap-1.5 font-mono text-[0.6rem] uppercase tracking-[0.1em] text-[#768899]"
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-[2px] transition-colors duration-300"
                style={{ background: BELT_LEGEND_COLORS[l.belt] }}
              />
              {l.label}
            </div>
          ))}
        </div>
        <div
          ref={gridRef}
          className="grid w-fit place-items-center"
          style={{
            gridTemplateColumns: `repeat(${GRID_COLS}, ${GRID_CELL_PX}px)`,
            gridAutoRows: `${GRID_CELL_PX}px`,
          }}
        >
          {Array.from({ length: GRID_COLS * GRID_ROWS }).map((_, i) => (
            <div key={i} className="sq h-2.5 w-2.5 rounded-[2px]" />
          ))}
        </div>
      </div>
    </div>
  )
}

const fmt = (n: number) => n.toLocaleString("es")

// Filas tipo leaderboard (mismo formato que UniversityRanking en
// leaderboard-content.tsx) que se revelan de a una, en orden, cuando la
// Mismo formato de fila que UniversityRanking en leaderboard-content.tsx
// (rank, tag de universidad, estudiantes + XP juntos) — esa lista real no
// tiene scroll-reveal, solo el conteo animado de CountUp al montar, así que
// acá tampoco: nada de IntersectionObserver, se anima solo con aparecer.
function UniversityRankingCards({
  rows,
}: {
  rows: { university: string; students: number; total_xp: number }[]
}) {
  return (
    <div className="mx-auto flex max-w-[520px] flex-col gap-2">
      {rows.map((row, i) => (
        <div
          key={row.university}
          className="flex items-center gap-2 rounded-lg border border-[#38385A] bg-white/[0.02] px-4 py-3"
        >
          <span className="w-4 shrink-0 text-center text-sm font-semibold tabular-nums text-[#768899]">
            {i + 1}
          </span>
          <span className="flex min-w-0 flex-1 items-center">
            <UniTag university={row.university} />
          </span>
          <span className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold tabular-nums text-[#F6F8FC]">
            <CountUp value={row.students} format={fmt} />
            <UsersIcon className="size-[0.9em] text-[#F6F8FC]" />
          </span>
          <span className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold tabular-nums text-[#F6F8FC]">
            <CountUp value={row.total_xp} format={fmt} />
            <XpDots className="size-[0.85em] text-[#F6F8FC]" />
          </span>
        </div>
      ))}
    </div>
  )
}

export default function MarketingHome() {
  const { markReady } = useSplash()
  useEffect(() => markReady(), [markReady])
  const tick = useCourseTick()
  const course = COURSE_TRACKS[tick % COURSE_TRACKS.length].course
  const { data: uniLeaderboard } = usePublicUniversityLeaderboard()

  return (
    <main className="bg-[#131324] font-sans text-[#F6F8FC]">
      <section
        id="hero"
        className="relative flex min-h-[100svh] flex-col items-center justify-center gap-6 overflow-hidden border-b border-[#38385A] px-5 py-10 text-center"
        style={GRID_BG_STYLE}
      >
        <div className="absolute top-[10%] left-1/2 -translate-x-1/2">
          <Wordmark
            textClass="text-[clamp(1.4rem,5vw,1.9rem)]"
            barClass="h-[3px]"
          />
        </div>

        {/* Placeholder invisible: reserva el mismo espacio en el flex que el h1
            de abajo, para que el resto de los elementos (párrafo, fórmula) no
            se muevan cuando el h1 real se reposiciona con `absolute`. */}
        <div
          aria-hidden
          className="invisible font-sans text-[clamp(1.6rem,6vw,2.25rem)] font-bold leading-[1.2] tracking-[-0.01em]"
        >
          <span className="block">Repasá {course}</span>
          <span className="block">todos los días.</span>
        </div>
        <h1 className="absolute top-[26%] left-1/2 w-full -translate-x-1/2 px-5 font-sans text-[clamp(1.6rem,6vw,2.25rem)] font-bold leading-[1.2] tracking-[-0.01em] text-[#F6F8FC]">
          <span className="block">
            Repasá <span className="text-[#5457E5] transition-colors duration-300">{course}</span>
          </span>
          <span className="block">todos los días.</span>
        </h1>
        <p className="-mt-6 max-w-[28rem] text-[clamp(1.1rem,3.5vw,1.35rem)] leading-[1.75] text-[#A4B3C6] max-md:text-[0.93rem]">
          Ejercitá las definiciones y propiedades que tanto cuestan entender de
          forma efectiva.
        </p>
        <NotationCycler tick={tick} />

        <div className="absolute bottom-[3%] left-1/2 flex -translate-x-1/2 flex-col items-center gap-6">
          <Link
            href="/onboarding"
            className="inline-flex animate-[cta-breathe_3s_ease-in-out_infinite] items-center gap-2 whitespace-nowrap rounded-[4px] bg-[#5457E5] px-8 py-[0.9rem] font-mono text-[0.95rem] font-medium uppercase tracking-[0.1em] text-[#F6F8FC] transition-[transform,background] duration-150 hover:-translate-y-0.5 hover:animate-none hover:bg-[#7E80F7] hover:shadow-[0_10px_36px_rgba(84,87,229,0.4)] active:translate-y-0 max-md:w-full max-md:max-w-[340px] max-md:justify-center max-md:px-8 max-md:py-4 max-md:text-base"
          >
            Probar ahora
          </Link>
          <div className="flex items-center text-[#768899] opacity-60">
            <ChevronDown className="size-[34px] animate-[bounce-down_1.8s_ease-in-out_infinite]" />
          </div>
        </div>

        <style>{`
          @keyframes cta-breathe {
            0%, 100% { box-shadow: 0 4px 20px rgba(84,87,229,0.25), 0 0 0 0 rgba(84,87,229,0.2); }
            50% { box-shadow: 0 8px 32px rgba(84,87,229,0.40), 0 0 0 10px rgba(84,87,229,0); }
          }
          @keyframes bounce-down {
            0%, 100% { transform: translateY(0); opacity: 0.4; }
            50% { transform: translateY(6px); opacity: 1; }
          }
        `}</style>
      </section>

      <section className="border-b border-[#38385A] bg-[#1A1A2A] px-6 py-16">
        <div className="mx-auto flex max-w-[960px] flex-col gap-4">
          <h2 className="max-w-[28rem] font-sans text-[clamp(1.6rem,6vw,2.25rem)] font-bold leading-[1.2] tracking-[-0.01em] text-[#F6F8FC]">
            Mantenete en contacto constante con los contenidos
          </h2>
          <p className="max-w-[26rem] text-[clamp(0.95rem,3vw,1.1rem)] leading-[1.7] text-[#A4B3C6]">
            Un repositorio de ejercicios enfocado en los conceptos
            fundamentales, organizado por unidades, temas y habilidades.
          </p>
        </div>
      </section>

      <section className="px-6 pb-20 pt-10" style={GRID_BG_STYLE}>
        <QuestionLoop tick={tick} />
      </section>

      <section className="border-y border-[#38385A] bg-[#1A1A2A] px-6 py-12">
        <div className="mx-auto max-w-[960px]">
          <h2 className="mb-2.5 font-sans text-[clamp(1.45rem,5vw,2rem)] font-bold leading-[1.2] tracking-[-0.01em] text-[#F6F8FC]">
            Progreso acorde al plan de estudios
          </h2>
          <p className="max-w-[520px] text-[clamp(0.875rem,2.5vw,1rem)] leading-[1.75] text-[#A4B3C6]">
            Un sistema que incorpora contenido nuevo a medida que lo anterior se
            consolida, logrando un progreso orgánico que prioriza lo que más
            necesitás reforzar.
          </p>
        </div>
      </section>

      <ProgressGrid tick={tick} />

      {uniLeaderboard && uniLeaderboard.rows.length > 0 && (
        <>
          <section className="border-y border-[#38385A] bg-[#1A1A2A] px-6 py-12">
            <div className="mx-auto max-w-[960px]">
              <h2 className="mb-2.5 font-sans text-[clamp(1.45rem,5vw,2rem)] font-bold leading-[1.2] tracking-[-0.01em] text-[#F6F8FC]">
                Universidades que ya están repasando
              </h2>
              <p className="max-w-[520px] text-[clamp(0.875rem,2.5vw,1rem)] leading-[1.75] text-[#A4B3C6]">
                Cada facultad suma a su propia comunidad — este es el ranking
                por estudiantes y XP acumulado.
              </p>
            </div>
          </section>

          <section className="px-6 pb-20 pt-10" style={GRID_BG_STYLE}>
            <UniversityRankingCards rows={uniLeaderboard.rows} />
          </section>
        </>
      )}

      <footer>
        <div className="flex flex-col items-center gap-5 bg-[#7E80F7] px-6 py-16 text-center">
          <h2 className="max-w-[28rem] font-sans text-[clamp(1.5rem,4vw,2rem)] font-semibold leading-[1.25] text-[#131324]">
            No pierdas lo que ya entendiste.
          </h2>
          <p className="text-[0.875rem] text-[rgba(19,19,36,0.65)]">
            Repasá de forma inteligente haciendo un poco todos los días.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/about"
              className="inline-flex h-[52px] items-center justify-center rounded-[4px] border-[1.5px] border-[rgba(19,19,36,0.35)] px-8 font-mono text-[0.9rem] font-medium uppercase tracking-[0.1em] text-[#131324] transition-colors duration-150 hover:border-[rgba(19,19,36,0.5)] hover:bg-[rgba(19,19,36,0.08)]"
            >
              Conocer más
            </Link>
            <Link
              href="/onboarding"
              className="inline-flex h-[52px] items-center justify-center rounded-[4px] bg-[#131324] px-8 font-mono text-[0.9rem] font-medium uppercase tracking-[0.1em] text-[#7E80F7] transition-[transform,box-shadow] duration-150 hover:-translate-y-px hover:shadow-[0_6px_22px_rgba(0,0,0,0.4)]"
            >
              Probar ahora
            </Link>
          </div>
        </div>

        <div className="bg-[#1A1A2A] px-5 py-10">
          <div className="mx-auto flex max-w-[960px] flex-wrap items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <a
                href="https://github.com/nvranco"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 transition-opacity hover:opacity-80"
              >
                <Image
                  src="https://avatars.githubusercontent.com/nvranco"
                  alt="Nicolás Vrancovich"
                  width={44}
                  height={44}
                  unoptimized
                  className="rounded-md object-cover grayscale brightness-[0.85]"
                />
                <div className="flex flex-col gap-px">
                  <span className="text-[0.85rem] font-medium text-[#F6F8FC]">
                    Nicolás Vrancovich
                  </span>
                  <span className="font-mono text-[0.7rem] text-[#768899]">
                    @nvranco
                  </span>
                </div>
              </a>
            </div>
            <div className="pr-12 max-md:pr-6">
              <Wordmark textClass="text-[1.1rem]" barClass="h-[2px]" />
            </div>
          </div>
          <div className="mx-auto max-w-[960px] pt-6 text-center text-[0.68rem] text-[#768899]">
            <p>
              Intervalo 2026. Desarrollado por y para estudiantes.
            </p>
          </div>
        </div>
      </footer>
    </main>
  )
}
