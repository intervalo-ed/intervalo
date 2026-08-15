"use client"

import { AnimatePresence, motion } from "motion/react"
import { Button } from "@/components/ui/button"
import { useSfx } from "@/lib/audio/useSfx"
import { saveOnboarding } from "@/lib/onboarding/storage"
import { cn } from "@/lib/utils"
import MathText from "@/components/math-text"
import {
  BELT_HEX,
  BELT_LEGEND_BAR_COLORS,
  BELT_ONDARK_VIVID,
  CATALOGS,
  COURSE_LABEL,
  type BeltKey,
  type CourseId,
} from "@/lib/catalog"
import { useGridLayout } from "@/lib/latex-visual-length"
import { ONBOARDING_UNIVERSITIES, UNIVERSITY_TAG_BY_KEY, canonicalUniversity, matchUniversities } from "@/lib/university-tags"
import { ChevronLeft, LayersIcon, TargetIcon } from "lucide-react"
import { useSignIn } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import posthog from "posthog-js"
import { useEffect, useRef, useState } from "react"

export const CAREERS = [
  { value: "E", label: "Ingeniería", emoji: "⚙️" },
  { value: "S", label: "Ciencia", emoji: "🔬" },
  { value: "T", label: "Tecnología", emoji: "🤖" },
  { value: "M", label: "Matemática", emoji: "📐" },
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
  UBA: "/universities/uba.png",
  UTN: "/universities/utn.png",
  UNLP: "/universities/unlp.png",
  UNSAM: "/universities/unsam.png",
  UNC: "/universities/unc.png",
  UNL: "/universities/unl.png",
}

type OnboardingExercise = {
  question: string
  options: string[]
  correctIndex: number
  feedback: string
  // Un mensaje por opción incorrecta (mismo índice que `options`), explicando el
  // error puntual de esa alternativa. `null` en el índice correcto.
  feedbackIncorrect: (string | null)[]
  explanation: string
}

// Ejercicio de prueba por curso (slide 5). Cada uno mapea al primer ítem real del
// curso (ver seed_intro_item en el backend), y el resultado se persiste.
const ONBOARDING_EXERCISES: Record<CourseId, OnboardingExercise> = {
  analisis: {
    question:
      "Un taxista cobra \\$500 fijos al subir, más \\$300 por cada kilómetro recorrido.\n$$C(k) = 500 + 300k$$\n¿Cuánto cuesta un viaje de 3 kilómetros?",
    options: ["\\$1400", "\\$1100", "\\$800", "\\$900"],
    correctIndex: 0,
    feedback: "$C(3) = 500 + 300 \\cdot 3 = 500 + 900 = 1400$.",
    feedbackIncorrect: [
      null,
      "Ese resultado sale de usar 2 kilómetros en vez de 3.",
      "Ese resultado sale de considerar un solo kilómetro recorrido.",
      "Ese resultado es solo la parte variable ($300 \\times 3$), sin sumar los \\$500 fijos.",
    ],
    explanation:
      "Evaluamos la función en $k = 3$:\n$$\\begin{aligned} C(3) &= 500 + 300 \\cdot 3 \\\\ &= 500 + 900 \\\\ &= 1400 \\end{aligned}$$\nEl viaje cuesta \\$1400.\n\nLa tarifa por kilómetro se multiplica primero por los kilómetros recorridos, y recién después se suma el fijo: son \\$900 de recorrido más \\$500 de bajada de bandera.",
  },
  algebra: {
    question:
      "Un mensaje se reenvía y cada contacto lo manda a $2^2$ personas, que a su vez lo reenvían a $2^3$ personas más cada una.\n$$2^2 \\cdot 2^3 = 2^x$$\n¿Cuál es el valor de $x$?",
    options: ["$5$", "$6$", "$32$", "$8$"],
    correctIndex: 0,
    feedback: "Los exponentes se suman: $2^2 \\cdot 2^3 = 2^{2+3} = 2^5$.",
    feedbackIncorrect: [
      null,
      "Ese resultado sale de multiplicar los exponentes ($2 \\times 3 = 6$) en vez de sumarlos.",
      "Ese resultado es $2^5$, el valor final de la potencia, no el exponente $x$.",
      "Ese resultado corresponde solo al segundo factor ($2^3$), sin tener en cuenta el primero.",
    ],
    explanation:
      "Una potencia encadena multiplicaciones:\n$$\\begin{aligned} 2^2 \\cdot 2^3 &= (2 \\cdot 2)(2 \\cdot 2 \\cdot 2) \\\\ &= 2^{2+3} \\\\ &= 2^5 \\end{aligned}$$\nPor eso los exponentes **se suman**: $x = 5$.\n\nCada ronda de reenvíos multiplica a la anterior, no la suma: los $2^2$ contactos del primer envío se convierten en $2^5$ personas recién después de que cada uno reenvía a $2^3$ más.",
  },
  probabilidad: {
    question:
      "Tirás una moneda equilibrada 2 veces.\n\n¿Cuál es la probabilidad de sacar al menos una cara?",
    options: ["$3/4$", "$1/2$", "$2/3$", "$1/4$"],
    correctIndex: 0,
    feedback: "El único caso sin caras es cruz-cruz ($1/4$): $1 - 1/4 = 3/4$.",
    feedbackIncorrect: [
      null,
      "Eso vale para un solo tiro. Con dos tiros hay más chances: solo te quedás sin caras si salen dos cruces seguidas.",
      "Ese resultado sale de contar {ninguna, una, dos caras} como si fueran igual de probables — pero 'una cara' puede darse de dos maneras (cara-cruz y cruz-cara), y las otras de una sola.",
      "Esa es la probabilidad de que no salga ninguna cara (cruz y cruz). Lo que buscás es justo lo contrario: $1 - 1/4$.",
    ],
    explanation:
      "Cada tiro tiene 2 resultados y las posibilidades se multiplican, así que hay $2 \\times 2 = 4$ resultados igual de probables:\n$$\\text{cara-cara}, \\quad \\text{cara-cruz}, \\quad \\text{cruz-cara}, \\quad \\text{cruz-cruz}$$\nEn 3 de los 4 aparece al menos una cara: la probabilidad es $3/4$.\n\nEl atajo: el único caso sin ninguna cara es cruz-cruz, con probabilidad $1/4$, y \"al menos una cara\" es exactamente lo contrario, así que $1 - 1/4 = 3/4$. Más alto que el $1/2$ de un tiro solo — cada tiro extra es una chance más.",
  },
}

// Unidades del curso. `textColor` (nombres/chips) es el mismo color que usa la
// home para los títulos de unidad (BELT_HEX.onDark); `gridColor` (cuadraditos
// de UnitGrid y de la leyenda de UnitSegmentedBar, a los que se les aplican
// intensidades variables — ver tintGridColor/seededTintGridColor) usa la
// paleta separada BELT_ONDARK_VIVID, pensada para leerse bien en bloques de
// color en vez de texto chico.
function courseUnits(
  course: CourseId,
): { name: string; textColor: string; gridColor: string }[] {
  return CATALOGS[course].belts.flatMap((b) =>
    b.units.map((u) => ({
      name: u.name,
      textColor: BELT_HEX[b.key as BeltKey].onDark,
      gridColor: BELT_ONDARK_VIVID[b.key as BeltKey],
    })),
  )
}

const UNIT_GRID_ROWS = 7

// Tamaño de cuadradito (10px) + gap (1px), igual que el ProgressGrid de la landing
// (marketing-home.tsx). No se estira: se calculan cuántas columnas de ese tamaño fijo
// entran en el ancho disponible.
const UNIT_SQ_PX = 10
const UNIT_GAP_PX = 1

// La separación entre cuadraditos de UnitGrid NO sale de un gap de grilla:
// sale de que el cuadradito visible (UNIT_GRID_SQ_PX) es más chico que el
// paso de la grilla (UNIT_SQ_PX), centrado en su celda — "come" el propio
// borde del cuadradito en vez de abrir hueco entre celdas. Radio mínimo,
// apenas perceptible en un cuadradito tan chico.
const UNIT_GRID_SQ_PX = 8
const UNIT_GRID_RADIUS_PX = 2

const ONBOARDING_BG_RGB: [number, number, number] = [19, 19, 36] // #131324

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

// Muestra una intensidad de la campana normal (Box-Muller), centrada en un
// tono medio-alto: la mayoría de los cuadraditos caen cerca del centro
// (opacos, legibles) y solo unos pocos llegan a los extremos (tenues o a
// brillo pleno), en vez de niveles discretos parejos.
function sampleNormalIntensity(mean = 0.68, stddev = 0.16, min = 0.58, max = 1.0): number {
  let u = 0
  let v = 0
  while (u === 0) u = Math.random()
  while (v === 0) v = Math.random()
  const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
  return Math.min(max, Math.max(min, mean + z * stddev))
}

// [0,1) determinístico a partir de un entero — mismo patrón que pickSeeded en
// marketing-home.tsx, para que el server y el cliente rendericen el mismo
// valor (Math.random() en JSX estático rompería la hidratación).
function seededUnit(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

// Misma campana que sampleNormalIntensity, pero determinística por `seed` en
// vez de Math.random() — para cuadraditos que no viven dentro de una animación
// (UnitSegmentedBar) y necesitan la misma intensidad en cada render.
function seededNormalIntensity(seed: number, mean = 0.68, stddev = 0.16, min = 0.58, max = 1.0): number {
  const u = seededUnit(seed) || 1e-6
  const v = seededUnit(seed + 1000)
  const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
  return Math.min(max, Math.max(min, mean + z * stddev))
}

function mixWithBg(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex)
  const mix = (channel: number, bg: number) => Math.round(channel * alpha + bg * (1 - alpha))
  return `rgb(${mix(r, ONBOARDING_BG_RGB[0])}, ${mix(g, ONBOARDING_BG_RGB[1])}, ${mix(b, ONBOARDING_BG_RGB[2])})`
}

function tintGridColor(hex: string): string {
  return mixWithBg(hex, sampleNormalIntensity())
}

function seededTintGridColor(hex: string, seed: number): string {
  return mixWithBg(hex, seededNormalIntensity(seed))
}

// Cuadraditos "sin actividad": mismo color plano para todos (no el color de
// la unidad, atenuado) — una versión apenas más clara que el fondo, para que
// se lean como parte de la misma grilla en vez de un hueco.
const UNIT_GRID_INACTIVE_COLOR = mixWithBg("#FFFFFF", 0.12)

// Elige el color de un cuadradito según el progreso `p` (0..1) de la grilla, con una
// curva gaussiana por unidad centrada en i/(n-1): al principio domina la primera
// unidad, y a medida que avanza el progreso el peso se traslada a las siguientes,
// con solapamiento (mezcla transitoria) entre unidades vecinas. Generaliza a N
// unidades el mismo espíritu de la matriz de probabilidades (WP) del ProgressGrid.
// `unlockedCount` acota qué unidades pueden aparecer todavía: las unidades desde
// `unlockedCount` en adelante están en 0 (bloqueadas) hasta que el llamador las
// desbloquee, lo que produce un progreso más clusterizado (una unidad "agota" su
// racha antes de que la siguiente empiece a asomar) en vez de mezcla desde el inicio.
function pickUnitColor(
  units: { color: string }[],
  p: number,
  unlockedCount: number,
): { color: string; index: number } {
  const n = units.length
  if (n <= 1) return { color: units[0].color, index: 0 }
  // Ancho de la campana relativo a la distancia entre unidades vecinas: cuanto más
  // ancha, más solapan colores no vecinos, igual de generoso que el WP de la
  // landing (ahí el color inicial todavía pesaba ~50% a mitad de camino del
  // siguiente breakpoint).
  const spacing = 1 / (n - 1)
  const sigma = spacing
  const weights = units.map((_, i) => {
    if (i >= unlockedCount) return 0
    const center = i / (n - 1)
    return Math.exp(-((p - center) ** 2) / (2 * sigma * sigma))
  })
  const sum = weights.reduce((a, b) => a + b, 0)
  let r = Math.random() * sum
  for (let i = 0; i < n; i++) {
    r -= weights[i]
    if (r <= 0) return { color: units[i].color, index: i }
  }
  return { color: units[unlockedCount - 1].color, index: unlockedCount - 1 }
}

// Cantidad de cuadraditos de una unidad que tienen que aparecer antes de que la
// unidad siguiente se desbloquee y pueda empezar a mezclarse.
const UNIT_COLOR_UNLOCK_THRESHOLD = 21

// Máxima diferencia de columnas entre la fila más adelantada y la más atrasada.
const UNIT_GRID_ROW_LEAD = 5

// Grilla animada de cuadraditos de tamaño fijo (ancho completo, muchas columnas),
// llenada fila por fila de izquierda a derecha, un cuadradito a la vez. Lo que
// cambia entre modos es la forma en la que se agrupan los cuadraditos del mismo
// color:
//
// `pace="regular"` (Repasar): cuadraditos sueltos, de a uno, elegidos con el
// patrón probabilístico y mezclado de `pickUnitColor` según el progreso global de
// llenado, una sesión de repaso mezcla varios temas.
// `pace="bursty"` (Practicar): piezas tipo Tetris (líneas de 2-3-4, cuadrados 2x2,
// rectángulos 2x3) de un solo color, dos piezas seguidas nunca comparten color, y
// la primera pieza usa siempre la segunda unidad, en modo libre la gente tiende a
// encadenar varios ejercicios seguidos del mismo tema antes de cambiar.
// Fila de cuadraditos, un grupo de color por unidad, con el nombre debajo de
// cada grupo. Mismo tamaño y radio de cuadradito que UnitGrid (UNIT_SQ_PX,
// gap-px interno), con la cantidad por unidad calculada para llenar el ancho
// disponible en vez de estirar los cuadraditos.
const UNIT_BAR_GROUP_GAP_PX = 8

function UnitSegmentedBar({
  units,
}: {
  units: { name: string; textColor: string; gridColor: string }[]
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [perUnit, setPerUnit] = useState(1)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const n = units.length
    const compute = () => {
      const w = el.clientWidth
      const raw =
        (w - (n - 1) * UNIT_BAR_GROUP_GAP_PX + n * UNIT_GAP_PX) / (n * (UNIT_SQ_PX + UNIT_GAP_PX))
      setPerUnit(Math.max(1, Math.floor(raw)))
    }
    compute()
    const ro = new ResizeObserver(compute)
    ro.observe(el)
    return () => ro.disconnect()
  }, [units.length])

  return (
    <div ref={containerRef} className="mx-auto w-full max-w-sm">
      <div className="flex justify-center gap-2">
        {units.map((u, ui) => (
          <div key={u.name} className="flex gap-px">
            {Array.from({ length: perUnit }).map((_, i) => (
              <div
                key={i}
                className="h-2.5 w-2.5 rounded-[2px]"
                style={{ background: seededTintGridColor(u.gridColor, ui * 97 + i) }}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-center gap-2">
        {units.map((u) => (
          <div
            key={u.name}
            className="text-center text-xs font-medium leading-tight"
            style={{ color: u.textColor, width: perUnit * (UNIT_SQ_PX + UNIT_GAP_PX) - UNIT_GAP_PX }}
          >
            {u.name}
          </div>
        ))}
      </div>
    </div>
  )
}

function UnitGrid({
  units,
  pace,
}: {
  units: { name: string; textColor: string; gridColor: string }[]
  pace: "regular" | "bursty"
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const [cols, setCols] = useState(0)
  const gridUnits = units.map((u) => ({ color: u.gridColor }))

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const compute = () => {
      const w = el.clientWidth
      setCols(Math.max(units.length, Math.floor(w / UNIT_SQ_PX)))
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

    // Cuadraditos "sin actividad": por fila, rachas cortas de 1 a 3 columnas
    // seguidas que quedan sin pintar (nunca en blancos sueltos), simulando
    // días sin repasar en vez de ruido al azar cuadradito por cuadradito.
    const skipMask: boolean[][] = Array.from({ length: rows }, () => new Array(cols).fill(false))
    for (let r = 0; r < rows; r++) {
      let c = 0
      while (c < cols) {
        if (Math.random() < 0.05) {
          const len = 1 + Math.floor(Math.random() * 3)
          for (let i = 0; i < len && c < cols; i++, c++) skipMask[r][c] = true
        } else {
          c++
        }
      }
    }

    // Como el Tetris de la landing pero horizontal: cada fila se llena de
    // izquierda a derecha, y la fila que recibe el próximo cuadradito se elige
    // al azar (probabilidad uniforme) entre las filas que todavía tienen lugar.
    const rowFilled = new Array(rows).fill(0)

    // Desbloqueo progresivo de colores: solo la primera unidad puede aparecer al
    // inicio, y cada unidad siguiente se habilita recién cuando la anterior ya
    // puso UNIT_COLOR_UNLOCK_THRESHOLD cuadraditos. En "bursty" arranca desbloqueada
    // la segunda unidad también, porque la primera pieza usa esa unidad a la fuerza.
    const unitCounts = new Array(units.length).fill(0)
    let unlocked = Math.min(pace === "bursty" ? 2 : 1, units.length)

    // Mínimo global entre TODAS las filas con lugar, no solo entre las candidatas
    // de una pieza puntual: si se calculara solo sobre las candidatas, una fila ya
    // muy adelantada podría quedar afuera del cálculo (por no tener lugar para esa
    // pieza en particular) y el resto seguiría de largo sin respetar el tope real.
    function globalMinFilled(): number {
      let min = cols
      for (let r = 0; r < rows; r++) if (rowFilled[r] < cols) min = Math.min(min, rowFilled[r])
      return min
    }

    // `extra` es cuánto va a avanzar la fila si se elige (1 para un cuadradito
    // suelto, el largo/ancho completo de una pieza): filtra para que la fila no
    // termine pasado el tope, no solo que no lo esté ya antes de sumarle la pieza.
    function rowsWithinLead(candidates: number[], extra: number): number[] {
      if (!candidates.length) return candidates
      const minFilled = globalMinFilled()
      const ok = candidates.filter((r) => rowFilled[r] + extra - minFilled <= UNIT_GRID_ROW_LEAD)
      if (ok.length) return ok
      // Ningún candidato entra en el tope (puede pasar si las únicas filas con
      // lugar para esta pieza ya están adelantadas): en vez de caer en cualquiera
      // (lo que dejaba avanzar sin límite a las filas ya adelantadas), quedarse
      // con las candidatas menos avanzadas para acercarse lo más posible al tope.
      const minCand = Math.min(...candidates.map((r) => rowFilled[r]))
      return candidates.filter((r) => rowFilled[r] === minCand)
    }

    function spawnSquareRegular(p: number) {
      // Tope de "parejura" entre filas: ninguna fila puede ir más de
      // UNIT_GRID_ROW_LEAD columnas por delante de la fila más atrasada.
      const notFull = Array.from({ length: rows }, (_, r) => r).filter((r) => rowFilled[r] < cols)
      if (!notFull.length) return
      const avail = rowsWithinLead(notFull, 1)
      const r = avail[Math.floor(Math.random() * avail.length)]
      const c = rowFilled[r]
      const { color, index } = pickUnitColor(gridUnits, p, unlocked)
      sqs[r * cols + c].style.background = skipMask[r][c]
        ? UNIT_GRID_INACTIVE_COLOR
        : tintGridColor(color)
      rowFilled[r]++
      unitCounts[index]++
      if (index === unlocked - 1 && unitCounts[index] >= UNIT_COLOR_UNLOCK_THRESHOLD) {
        unlocked = Math.min(unlocked + 1, units.length)
      }
    }

    // ── "bursty" (Practicar): en vez de una racha de cuadraditos sueltos del mismo
    // color, arma piezas tipo Tetris (líneas de 2-3-4, cuadrados 2x2, rectángulos
    // 2x3) que se pintan de a un cuadradito, izquierda a derecha dentro de la pieza.
    let pieceQueue: { r: number; c: number; color: string; index: number }[] = []
    let lastPieceIndex = -1
    let firstPiece = true

    function lineRow(len: number): number | null {
      const cand = []
      for (let r = 0; r < rows; r++) if (rowFilled[r] + len <= cols) cand.push(r)
      if (!cand.length) return null
      const pool = rowsWithinLead(cand, len)
      return pool[Math.floor(Math.random() * pool.length)]
    }

    function blockRow(width: number): number | null {
      const cand = []
      for (let r = 0; r < rows - 1; r++) {
        if (rowFilled[r] === rowFilled[r + 1] && rowFilled[r] + width <= cols) cand.push(r)
      }
      if (!cand.length) return null
      const pool = rowsWithinLead(cand, width)
      return pool[Math.floor(Math.random() * pool.length)]
    }

    function pickPieceIndex(p: number): number {
      if (firstPiece) {
        firstPiece = false
        return Math.min(1, units.length - 1)
      }
      for (let tries = 0; tries < 6; tries++) {
        const { index } = pickUnitColor(gridUnits, p, unlocked)
        if (index !== lastPieceIndex || units.length <= 1) return index
      }
      return (lastPieceIndex + 1) % unlocked
    }

    function buildPiece(): number {
      const p = filled / (total - 1)
      const index = pickPieceIndex(p)
      const color = units[index].gridColor
      lastPieceIndex = index

      let cells: { r: number; c: number }[] | null = null
      const roll = Math.random()
      if (roll < 0.55) {
        const len = [2, 2, 3, 3, 3, 4][Math.floor(Math.random() * 6)]
        const r = lineRow(len)
        if (r !== null) {
          const c0 = rowFilled[r]
          cells = Array.from({ length: len }, (_, i) => ({ r, c: c0 + i }))
          rowFilled[r] += len
        }
      } else if (roll < 0.8) {
        const r = blockRow(2)
        if (r !== null) {
          const c0 = rowFilled[r]
          cells = []
          for (let off = 0; off < 2; off++) {
            cells.push({ r, c: c0 + off }, { r: r + 1, c: c0 + off })
          }
          rowFilled[r] += 2
          rowFilled[r + 1] += 2
        }
      } else {
        const r = blockRow(3)
        if (r !== null) {
          const c0 = rowFilled[r]
          cells = []
          for (let off = 0; off < 3; off++) {
            cells.push({ r, c: c0 + off }, { r: r + 1, c: c0 + off })
          }
          rowFilled[r] += 3
          rowFilled[r + 1] += 3
        }
      }
      // Sin lugar para la forma elegida: probar líneas cada vez más cortas.
      for (let len = 2; len >= 1 && !cells; len--) {
        const r = lineRow(len)
        if (r === null) continue
        const c0 = rowFilled[r]
        cells = Array.from({ length: len }, (_, i) => ({ r, c: c0 + i }))
        rowFilled[r] += len
      }
      if (!cells) return 0

      pieceQueue = cells.map((cell) => ({ ...cell, color, index }))
      return pieceQueue.length
    }

    function spawnSquareBursty() {
      const cell = pieceQueue.shift()
      if (!cell) return
      sqs[cell.r * cols + cell.c].style.background = skipMask[cell.r][cell.c]
        ? UNIT_GRID_INACTIVE_COLOR
        : tintGridColor(cell.color)
      unitCounts[cell.index]++
      if (cell.index === unlocked - 1 && unitCounts[cell.index] >= UNIT_COLOR_UNLOCK_THRESHOLD) {
        unlocked = Math.min(unlocked + 1, units.length)
      }
    }

    let filled = 0
    let batchLeft = 0 // cuadraditos que faltan del bache actual
    let spawnCredit = 0 // acumulador fraccional de cuadraditos a spawnear este frame
    let rafId = 0

    function nextBatchSize(): number {
      if (pace === "bursty") return buildPiece()
      return 1 + Math.floor(Math.random() * 5)
    }

    // Basado en el ritmo de la landing (marketing-home.tsx, ProgressGrid), pero
    // sin la pausa fija entre baches: al agotarse uno, arma el siguiente y lo
    // dibuja en el mismo frame en vez de perder un ciclo sin pintar nada.
    function step() {
      if (filled >= total) return
      if (batchLeft === 0) {
        batchLeft = Math.min(nextBatchSize(), total - filled)
        spawnCredit = 0
        if (batchLeft === 0 && filled < total) {
          // No entró ninguna forma en el espacio libre restante: reintentar el
          // próximo frame en vez de trabar la animación.
          rafId = requestAnimationFrame(step)
          return
        }
      }
      // Un poquito más rápido cada vez que se desbloquea una unidad siguiente.
      spawnCredit += 60 * (1 + 0.08 * (unlocked - 1))
      while (spawnCredit >= 1 && batchLeft > 0 && filled < total) {
        if (pace === "bursty") spawnSquareBursty()
        else spawnSquareRegular(filled / (total - 1))
        filled++
        batchLeft--
        spawnCredit -= 1
      }
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
          className="grid place-items-center"
          style={{
            gridTemplateColumns: `repeat(${cols}, ${UNIT_SQ_PX}px)`,
            gridAutoRows: `${UNIT_SQ_PX}px`,
          }}
        >
          {Array.from({ length: cols * UNIT_GRID_ROWS }).map((_, i) => (
            <div
              key={i}
              className="unit-sq bg-white/[0.06]"
              style={{
                width: UNIT_GRID_SQ_PX,
                height: UNIT_GRID_SQ_PX,
                borderRadius: UNIT_GRID_RADIUS_PX,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// Nombre estable de cada slide para el evento `onboarding_step` de PostHog. No
// mandamos el índice: si mañana se reordenan o agregan pasos, el mismo número
// pasa a significar otra slide y el embudo histórico deja de ser comparable.
const STEP_NAMES: Record<number, string> = {
  [-1]: "intro",
  0: "nombre",
  1: "bienvenida",
  2: "motivacion",
  3: "curso",
  4: "unidades",
  5: "ejercicio",
  6: "felicitacion",
  7: "modo-repasar",
  8: "modo-practicar",
  9: "carrera",
  10: "universidad",
  11: "registro",
}

const ONBOARDING_FLAG = "onboarding-orden-apodo"

// Orden de visita de las slides. Los índices siguen significando siempre la misma
// slide (0 es el apodo en las dos variantes): lo único que cambia es en qué
// posición se visitan. Así los `{step === N}`, el switch de PinnedCTA y STEP_NAMES
// quedan intactos, y el embudo histórico de PostHog sigue siendo comparable.
const ORDER_CONTROL = [-1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
// En test el apodo (0) cae justo antes de carrera (9): las tres preguntas
// personales quedan juntas al final y las primeras ocho slides son puro valor.
const ORDER_TEST = [-1, 1, 2, 3, 4, 5, 6, 7, 8, 0, 9, 10, 11]

type Variant = "control" | "test" | "unavailable"

// `unavailable` = los flags no resolvieron (adblock, red caída). Esa gente corre
// el orden de control, pero se marca distinto para poder sacarla del análisis en
// vez de contaminar el brazo de control con gente que nunca fue sorteada.
// Atajo para probar las dos variantes en local con `?variant=test`. Fuera de
// desarrollo no existe, así que no hay forma de forzarse un brazo en producción
// y ensuciar los datos del experimento.
function forcedVariant(): Variant | null {
  if (process.env.NODE_ENV === "production" || typeof window === "undefined") return null
  const forced = new URLSearchParams(window.location.search).get("variant")
  return forced === "control" || forced === "test" ? forced : null
}

function useOnboardingVariant(): Variant | null {
  const forced = forcedVariant()
  const [variant, setVariant] = useState<Variant | null>(forced)

  useEffect(() => {
    if (forced !== null) return

    let settled = false
    function settle(v: Variant) {
      if (settled) return
      settled = true
      setVariant(v)
    }

    // onFeatureFlags dispara al toque si ya estaban cargados.
    const unsubscribe = posthog.onFeatureFlags(() => {
      const value = posthog.getFeatureFlag(ONBOARDING_FLAG)
      settle(value === "test" ? "test" : value === "control" ? "control" : "unavailable")
    })
    const timeout = setTimeout(() => settle("unavailable"), 2500)

    return () => {
      unsubscribe?.()
      clearTimeout(timeout)
    }
  }, [forced])

  return variant
}

function positionOf(step: number, order: number[]) {
  const i = order.indexOf(step)
  return i === -1 ? 0 : i
}

function randomDelay(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

type SlideCustom = { dir: number; from: number }

const slideVariants = {
  enter: (c: SlideCustom) => ({ x: c.dir > 0 ? "100%" : "-100%", opacity: 1 }),
  center: { x: "0%", opacity: 1 },
  exit: (c: SlideCustom) => ({ x: c.dir > 0 ? "-100%" : "100%", opacity: 1 }),
}

const INTRO_BELT_COLORS = BELT_LEGEND_BAR_COLORS

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

export default function OnboardingWizard({ alreadySignedIn = false }: { alreadySignedIn?: boolean }) {
  const router = useRouter()
  const { signIn } = useSignIn()
  const sfx = useSfx()
  const [step, setStep] = useState(-1) // -1 = intro animada del logo
  const [prevStep, setPrevStep] = useState(-1)
  const [direction, setDirection] = useState<1 | -1>(1)
  const variant = useOnboardingVariant()
  const order = variant === "test" ? ORDER_TEST : ORDER_CONTROL
  const position = positionOf(step, order)
  // Posición 0 es el intro, así que la 1 es la primera slide con la que el usuario
  // interactúa: el apodo en control, la bienvenida en test. Es la que se lleva el
  // botón de Google y la que no muestra la barra de progreso.
  const isFirstContentSlide = position === 1
  const [introDone, setIntroDone] = useState(false)
  const [name, setName] = useState("")
  const [motivation, setMotivation] = useState("")
  const [course, setCourse] = useState<CourseId | "">("")
  const [exerciseSelection, setExerciseSelection] = useState<number | null>(null)
  const [exerciseCorrect, setExerciseCorrect] = useState<boolean | null>(null)
  const [wrongOptions, setWrongOptions] = useState<number[]>([])
  const [introItemResponseTimeMs, setIntroItemResponseTimeMs] = useState<number | null>(null)
  const exerciseStartRef = useRef<number | null>(null)
  const lastTrackedStepRef = useRef<string | null>(null)
  const [shakeIdx, setShakeIdx] = useState<number | null>(null)
  const [showWhy, setShowWhy] = useState(false)
  const [authPending, setAuthPending] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
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

  // Arranca el cronómetro del ejercicio de prueba al entrar a esa slide, para
  // poder mandar cuánto tardó en responder junto con el resto del payload.
  useEffect(() => {
    if (step === 5) {
      exerciseStartRef.current = Date.now()
    }
  }, [step])

  // Un evento por cada entrada a una slide: los pasos son estado de React y no
  // cambian la URL, así que los $pageview automáticos no los distinguen y el
  // embudo del onboarding no se puede armar sin esto. El ref evita repetir el
  // evento cuando la slide re-renderiza (elegir curso, por ejemplo, corre el
  // effect de nuevo), pero sí vuelve a emitir si el usuario va y vuelve.
  // Esperamos a que resuelva la variante antes del primer evento: si saliera
  // sin `variant`, el paso `intro` —que es la base del embudo— quedaría sin
  // brazo asignado y no se podría comparar nada.
  useEffect(() => {
    if (variant === null) return
    const name = STEP_NAMES[step]
    if (name === undefined || lastTrackedStepRef.current === name) return
    lastTrackedStepRef.current = name
    posthog.capture("onboarding_step", { step: name, course: course || undefined, variant })
  }, [step, course, variant])

  // La animación del intro y la carga de los flags corren en paralelo; recién
  // cuando terminaron las dos se puede avanzar, porque la variante decide cuál
  // es la slide siguiente.
  useEffect(() => {
    if (introDone && variant !== null && step === -1) goNext()
  }, [introDone, variant, step])

  function goNext(target?: number) {
    setPrevStep(step)
    setDirection(1)
    if (target !== undefined) {
      setStep(target)
      return
    }
    setStep(order[Math.min(position + 1, order.length - 1)])
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
    // Al volver desde la felicitación (6) al ejercicio (5), reseteamos su estado
    // para que se pueda rehacer desde cero.
    if (step === 6) {
      setExerciseSelection(null)
      setExerciseCorrect(null)
      setWrongOptions([])
      setIntroItemResponseTimeMs(null)
    }
    setPrevStep(step)
    setDirection(-1)
    // Tope en 1: el intro no se puede volver a ver.
    setStep(order[Math.max(position - 1, 1)])
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
    const value = canonicalUniversity(universityOther)
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
      if (exerciseStartRef.current !== null) {
        setIntroItemResponseTimeMs(Date.now() - exerciseStartRef.current)
      }
      return
    }
    sfx.wrong?.()
    const wrongIdx = exerciseSelection
    setExerciseCorrect(false)
    setWrongOptions((prev) => [...prev, wrongIdx])
    setShakeIdx(wrongIdx)
    setTimeout(() => setShakeIdx(null), 450)
    wrongResetRef.current = setTimeout(() => {
      setExerciseCorrect(null)
      // Recién acá soltamos la selección: hasta este momento el panel de
      // feedback (más abajo) la necesita para mostrar el mensaje específico
      // de feedbackIncorrect[exerciseSelection], no el genérico.
      setExerciseSelection(null)
      wrongResetRef.current = null
    }, 2000)
  }

  // Un solo flujo de Google para los dos botones: se arranca siempre como
  // sign-in y /sso-callback resuelve el resto (transfiere a sign-up si la
  // cuenta no existe y elige el destino). Al usuario no le tiene que importar
  // si ya tenía cuenta o no.
  async function authenticateWithGoogle() {
    if (!signIn || authPending) return
    setAuthPending(true)
    setAuthError(null)

    const origin = window.location.origin
    const callbackUrl = `${origin}/sso-callback`
    const completeUrl = `${origin}/onboarding/complete`

    // sso() reusa el sign-in que ya esté en el cliente. Si ese quedó terminado
    // por un intento anterior (volver del callback y apretar "atrás", sesión ya
    // activa), no pide un redirect nuevo: no navega a ningún lado y tampoco
    // devuelve error, así que el botón se queda en "Conectando..." para siempre.
    // El create() explícito arranca siempre un intento limpio.
    const created = await signIn.create({
      strategy: "oauth_google",
      redirectUrl: callbackUrl,
      actionCompleteRedirectUrl: completeUrl,
    })
    if (created.error) return failGoogleSso(created.error)

    // `sso()` no lanza: resuelve con `{ error }`. Sin chequearlo, cualquier
    // fallo (red, captcha, sesión ya activa) deja el botón muerto en silencio.
    const { error } = await signIn.sso({
      strategy: "oauth_google",
      redirectUrl: completeUrl,
      redirectCallbackUrl: callbackUrl,
    })
    if (error) return failGoogleSso(error)

    // Resolvió sin error pero sin redirect que seguir: no nos vamos a ningún
    // lado, así que soltamos el botón en vez de dejarlo colgado.
    if (!signIn.firstFactorVerification.externalVerificationRedirectURL) {
      failGoogleSso({ code: "no_external_verification_redirect" })
    }
  }

  function failGoogleSso(error: { code: string }) {
    // Sesión ya activa: no hay nada que autenticar, directo al home.
    if (error.code === "session_exists") {
      window.location.assign("/")
      return
    }
    console.error("Google SSO error", error)
    setAuthPending(false)
    setAuthError("No pudimos conectar con Google. Probá de nuevo.")
  }

  function onboardingPayload() {
    return {
      name: name.trim(),
      career,
      university,
      course: courseKey,
      motivation,
      introItemCorrect: firstTryCorrect,
      // Intentos hasta acertar (el wizard exige acertar para avanzar, así que
      // siempre está definido cuando llegamos acá) y tiempo de respuesta.
      introItemAttempts: exerciseCorrect === true ? wrongOptions.length + 1 : undefined,
      introItemResponseTimeMs: introItemResponseTimeMs ?? undefined,
    }
  }

  // Los dos botones llevan al mismo flujo de Google, pero significan cosas
  // opuestas: uno es el final natural del wizard y el otro es alguien que dice
  // tener cuenta. Cuando no la tiene, /onboarding/page.tsx lo rebota al wizard y
  // lo hace empezar de nuevo — un tercio del tráfico está cayendo ahí. Sin este
  // evento el click solo se puede inferir de la secuencia (el paso `intro` dos
  // veces con un $identify en el medio), que no distingue el click del botón de
  // otras formas de llegar a /sso-callback.
  function trackSignInAttempt(origen: "ya-tengo-cuenta" | "fin-onboarding") {
    posthog.capture("signin_attempt", {
      origen,
      step: STEP_NAMES[step],
      variant,
      already_signed_in: alreadySignedIn,
    })
  }

  function signInFromShortcut() {
    trackSignInAttempt("ya-tengo-cuenta")
    void authenticateWithGoogle()
  }

  // Final del onboarding: guardamos lo elegido antes de irnos a Google para que
  // /onboarding/complete lo encuentre al volver.
  async function onFinish() {
    trackSignInAttempt("fin-onboarding")
    saveOnboarding(onboardingPayload())
    await authenticateWithGoogle()
  }

  // Vino ya autenticado (atajo "Ya tengo una cuenta" de una cuenta nueva): no
  // hay que volver a pasar por Google, solo guardar las respuestas —
  // /onboarding/complete hace el enroll y muestra "instalá la app".
  function finishAlreadySignedIn() {
    saveOnboarding(onboardingPayload())
    router.push("/onboarding/complete")
  }

  return (
    <main className="flex min-h-dvh flex-col bg-background [&_h2]:font-sans overflow-x-hidden">
      <AnimatePresence>
        {position > 1 && <ProgressBar key="progress" position={position} total={order.length} onBack={goBack} />}
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
              {step === -1 && <IntroLogo onDone={() => setIntroDone(true)} />}

              {/* ── SLIDE 0: Nombre ── */}
              {step === 0 && (
                <Slide0
                  name={name}
                  setName={setName}
                  sfx={sfx}
                  onNext={() => goNext()}
                  onSignIn={signInFromShortcut}
                  authReady={signIn !== null}
                  authPending={authPending}
                  authError={authError}
                  hideSignIn={alreadySignedIn || !isFirstContentSlide}
                  isFirstContentSlide={isFirstContentSlide}
                />
              )}

              {/* ── SLIDE 1: Bienvenida ── */}
              {step === 1 && (
                <div className="flex flex-col gap-5">
                  {/* En test esta slide va primera, así que todavía no hay nombre. */}
                  <h2 className="text-2xl font-bold">{name ? `Hola, ${name}` : "¡Bienvenido!"}</h2>
                  <div className="flex flex-col gap-3 leading-relaxed text-foreground/85">
                    <p>
                      <strong className="text-foreground">Intervalo</strong> está pensado para
                      acompañarte a repasar los contenidos{" "}
                      <strong className="text-foreground">durante y después</strong> de tu cursada.
                    </p>
                    <p>
                      Su propósito principal es <strong className="text-foreground">incentivarte</strong>{" "}
                      a repasar todos los días los conceptos que{" "}
                      <strong className="text-foreground">más necesitás reforzar</strong>.
                    </p>
                    <p>¿Arrancamos?</p>
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
                      Podés probar los otros después.
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
                  <h2 className="text-left text-2xl font-bold">{COURSE_LABEL[courseKey]}</h2>
                  <div className="flex flex-col gap-3 leading-relaxed text-foreground/85">
                    <p>
                      Los contenidos de este curso se dividen en las siguientes{" "}
                      <strong className="text-foreground">unidades correlativas</strong>:
                    </p>
                  </div>
                  <UnitSegmentedBar units={currentUnits} />
                  <p className="leading-relaxed text-foreground/85">
                    Dentro de cada unidad hay una serie de{" "}
                    <strong className="text-foreground">temas</strong>, y cada uno contempla distintos{" "}
                    <strong className="text-foreground">tipos</strong> de{" "}
                    <strong className="text-foreground">ejercicios</strong>.
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
                    Cada ejercicio está pensado para reforzar las principales{" "}
                    <strong className="text-foreground">definiciones y propiedades</strong> de un
                    tema.
                  </p>
                  <p>
                    Vas a encontrarlos en dos modos,{" "}
                    <strong className="text-foreground">
                      Repasar <LayersIcon className="inline size-[18px] align-[-3px]" />
                    </strong>{" "}
                    y{" "}
                    <strong className="text-foreground">
                      Practicar <TargetIcon className="inline size-[18px] align-[-3px]" />
                    </strong>
                    .
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
                    arma sesiones de repaso{" "}
                    <strong className="text-foreground">personalizadas</strong> según tu{" "}
                    <strong className="text-foreground">desempeño</strong> en cada tipo de
                    ejercicio.
                  </p>
                  <p>
                    Los <strong className="text-foreground">conceptos</strong> que{" "}
                    <strong className="text-foreground">te cuesten</strong>, van a aparecer{" "}
                    <strong className="text-foreground">más</strong> seguido.
                  </p>
                  <p>
                    Los que{" "}
                    <strong className="text-foreground">ya incorporaste</strong>, van a aparecer
                    cada vez{" "}
                    <strong className="text-foreground">menos</strong>.
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
                    El modo{" "}
                    <strong className="text-foreground">
                      Practicar <TargetIcon className="inline size-[18px] align-[-3px]" />
                    </strong>{" "}
                    te permite elegir uno o varios temas y resolver todos los ejercicios que
                    quieras.
                  </p>
                  <UnitGrid units={currentUnits} pace="bursty" />
                  <p>
                    Ideal para <strong className="text-foreground">reforzar</strong> un tema visto
                    en clase, o hacer <strong className="text-foreground">énfasis</strong> en
                    determinados temas para acompañar las guías de estudio.
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
                                  "w-auto max-w-full object-contain transition-[filter,opacity]",
                                  u === "UNSAM" || u === "UNC" ? "h-[20px]" : "h-[23px]",
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

              {/* ── SLIDE 11: Registro ── */}
              {step === 11 && (
                <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center translate-y-[20px]">
                  <div className="flex flex-col gap-2">
                    <h2 className="text-2xl font-bold">¡Ya casi estamos!</h2>
                    <p className="leading-relaxed text-foreground/85">
                      {alreadySignedIn ? "Ya podés arrancar." : "Registrate para poder guardar tu progreso."}
                    </p>
                  </div>
                  {alreadySignedIn ? (
                    <Button
                      size="lg"
                      className="h-12 w-full rounded-md bg-white text-black hover:bg-white/90 hover:text-black"
                      onClick={finishAlreadySignedIn}
                    >
                      Continuar
                    </Button>
                  ) : (
                    <Button
                      size="lg"
                      className="h-12 w-full rounded-md bg-white text-black hover:bg-white/90 hover:text-black"
                      disabled={signIn === null || authPending}
                      onClick={onFinish}
                    >
                      <GoogleIcon className="size-5" />
                      {authPending ? "Conectando..." : "Continuar con Google"}
                    </Button>
                  )}
                  {authError && <p className="text-sm text-red-500">{authError}</p>}
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
        isFirstContentSlide={isFirstContentSlide}
        direction={direction}
        name={name}
        onSignIn={signInFromShortcut}
        authReady={signIn !== null}
        authPending={authPending}
        authError={authError}
        hideSignIn={alreadySignedIn}
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
  isFirstContentSlide,
  direction,
  name,
  onSignIn,
  authReady,
  authPending,
  authError,
  hideSignIn,
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
  isFirstContentSlide: boolean
  direction: 1 | -1
  name: string
  onSignIn: () => void
  authReady: boolean
  authPending: boolean
  authError: string | null
  hideSignIn: boolean
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
    // Solo cuando el apodo cae en el medio del wizard (test). Abriendo el wizard
    // (control) los botones van dentro de la slide, centrados, y acá no va nada.
    case 0:
      if (isFirstContentSlide) return null
      content = (
        <Button
          size="lg"
          className={ctaCls}
          disabled={!name.trim()}
          onClick={() => { sfx.continue(); goNext() }}
        >
          Continuar
        </Button>
      )
      break
    // En test la bienvenida abre el wizard, así que se lleva la salida para
    // quien ya tiene cuenta (en control vive en la slide del apodo).
    case 1:
      content = (
        <div className="flex flex-col gap-2">
          {isFirstContentSlide && !hideSignIn && (
            <Button
              variant="outline"
              size="lg"
              className="h-[var(--cta-h)] w-full rounded-md gap-2"
              disabled={!authReady || authPending}
              onClick={onSignIn}
            >
              <GoogleIcon className="size-5" />
              {authPending ? "Conectando..." : "Ya tengo una cuenta"}
            </Button>
          )}
          <Button size="lg" className={ctaCls} onClick={() => { sfx.continue(); goNext() }}>
            Continuar
          </Button>
          {isFirstContentSlide && authError && (
            <p className="text-center text-sm text-red-500">{authError}</p>
          )}
        </div>
      )
      break
    case 6:
    case 7:
    case 8:
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
                  <div className="mt-0.5 text-foreground/85">
                    {exerciseSelection !== null && exercise.feedbackIncorrect[exerciseSelection] ? (
                      <MathText text={exercise.feedbackIncorrect[exerciseSelection]!} />
                    ) : (
                      "Revisá tu respuesta e intentalo una vez más."
                    )}
                  </div>
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

  // La barra fija vive fuera del AnimatePresence de las slides, así que su
  // contenido aparece de golpe. En la slide que abre el wizard se nota, porque el
  // texto entra deslizándose y los botones no: ahí los acompañamos con la misma
  // curva y duración que usa slideVariants. En el resto del wizard queda como
  // estaba — el CTA ya está en pantalla y no tiene que volver a entrar.
  if (isFirstContentSlide) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-40 flex justify-center px-4 pt-[var(--cta-pt)] pb-[var(--cta-pb)] bg-gradient-to-t from-background via-background/90 to-transparent pointer-events-none">
        <div className="w-full max-w-md pointer-events-auto overflow-hidden">
          <motion.div
            initial={{ x: direction > 0 ? "100%" : "-100%" }}
            animate={{ x: "0%" }}
            transition={{ duration: 0.28, ease: "easeInOut" }}
          >
            {content}
          </motion.div>
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
  authReady,
  authPending,
  authError,
  hideSignIn,
  isFirstContentSlide,
}: {
  name: string
  setName: (v: string) => void
  sfx: ReturnType<typeof useSfx>
  onNext: () => void
  onSignIn: () => void
  authReady: boolean
  authPending: boolean
  authError: string | null
  hideSignIn: boolean
  isFirstContentSlide: boolean
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

  const input = (
    <input
      ref={inputRef}
      type="text"
      value={name}
      onChange={(e) => setName(e.target.value)}
      onKeyDown={(e) => { if (e.key === "Enter") handleContinue() }}
      placeholder="Tu nombre o apodo"
      className="h-12 w-full rounded-xl border border-border bg-accent px-4 text-foreground outline-none focus:border-primary transition-colors"
    />
  )

  // Cuando el apodo cae en el medio del wizard (test) es una pregunta más: mismo
  // formato de título y bajada que carrera o motivación, y el Continuar en la
  // barra de abajo como el resto — lo pone PinnedCTA.
  if (!isFirstContentSlide) {
    return (
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2 text-center">
          <h2 className="text-2xl font-bold">¿Cómo te llamás?</h2>
          <p className="text-foreground/85">Puede ser tu nombre o el apodo que prefieras.</p>
        </div>
        {input}
      </div>
    )
  }

  // Abriendo el wizard, en cambio, es una pantalla de bienvenida: saludo grande,
  // todo centrado en el alto y los botones ahí mismo.
  return (
    <div className="flex-1 w-full flex flex-col">
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

        {input}

        <div className="flex flex-col gap-2">
          <Button size="lg" className="h-12 w-full rounded-md bg-white text-black hover:bg-white/90 hover:text-black" disabled={!name.trim()} onClick={handleContinue}>
            Continuar
          </Button>
          {!hideSignIn && (
            <Button
              variant="outline"
              size="lg"
              className="h-12 w-full rounded-md gap-2"
              disabled={!authReady || authPending}
              onClick={onSignIn}
            >
              <GoogleIcon className="size-5" />
              {authPending ? "Conectando..." : "Ya tengo una cuenta"}
            </Button>
          )}
          {authError && <p className="text-center text-sm text-red-500">{authError}</p>}
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

function ProgressBar({ position, total, onBack }: { position: number; total: number; onBack: () => void }) {
  // La posición 1 es la primera slide de contenido (0%) y la última es el 100%.
  const pct = ((position - 1) / (total - 2)) * 100

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

export function OptionButton({
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

export function CareerCard({
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
