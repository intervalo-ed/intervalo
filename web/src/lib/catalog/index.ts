import { catalog as catalogAnalisis, type Belt, type BeltKey, type Topic, type Unit } from "./analisis.generated"
import { catalog as catalogProbabilidad } from "./probabilidad.generated"
import { catalog as catalogAlgebra } from "./algebra.generated"

// A partir de este archivo, `catalog`, `BeltKey`, `Belt`, `Unit`, `Topic` siguen
// refiriéndose al curso `analisis` para que los consumidores mono-curso (zen,
// onboarding, resto de la app) sigan funcionando sin cambios. Los helpers con
// parámetro `course` permiten operar sobre cualquier curso soportado.
export const catalog = catalogAnalisis
export type { Belt, BeltKey, Topic, Unit }

export type CourseId = "analisis" | "probabilidad" | "algebra"

export const COURSE_ORDER: CourseId[] = ["analisis", "probabilidad", "algebra"]

export const COURSE_LABEL: Record<CourseId, string> = {
  analisis: "Análisis",
  probabilidad: "Probabilidad",
  algebra: "Álgebra",
}

export const CATALOGS: Record<CourseId, typeof catalogAnalisis> = {
  analisis: catalogAnalisis,
  probabilidad: catalogProbabilidad as unknown as typeof catalogAnalisis,
  algebra: catalogAlgebra as unknown as typeof catalogAnalisis,
}

const BELT_ASSET: Record<BeltKey, string> = {
  white: "/belt_white.png",
  blue: "/belt_blue.png",
  violet: "/belt_purple.png",
  brown: "/belt_brown.png",
}

const BELT_LABEL: Record<BeltKey, string> = {
  white: "Blanco",
  blue: "Azul",
  violet: "Violeta",
  brown: "Marrón",
}

// Orden y descripciones de cinturón vienen del catálogo generado (course.json),
// no hardcodeados. Ver `beltInfo()`.
export const BELT_ORDER: BeltKey[] = catalog.belts.map((b) => b.key)

export function beltOrderFor({ course }: { course: CourseId }): BeltKey[] {
  return CATALOGS[course].belts.map((b) => b.key as BeltKey)
}

// Fuente de verdad de los colores de cinturón, espejada del ícono de la app
// (web/src/components/app-icon.tsx). `solid` = el color exacto de la marca, para
// bloques de color (ícono, cubos de la landing, barras del logo). `onDark` = el
// mismo tono aclarado para que se lea bien como texto/partícula sobre el fondo
// oscuro (#131324), donde el negro y el azul puros quedan ilegibles.
export const BELT_HEX: Record<BeltKey, { solid: string; onDark: string }> = {
  white: { solid: "#FAFAFA", onDark: "#FAFAFA" },
  blue: { solid: "#0A3180", onDark: "#4486E8" },
  violet: { solid: "#730F8C", onDark: "#C07BC9" },
  brown: { solid: "#674011", onDark: "#C57C38" },
}

// Paleta vívida usada por el onboarding (cubos de la grilla, chips de unidad) y
// por la landing (cubos/puntos de la rotación de cursos). Vive separada de
// `BELT_HEX.onDark` para que un ajuste de paleta en el resto de la app (repasar,
// practicar, ranking) no le pegue a estas dos superficies de marca.
export const BELT_ONDARK_VIVID: Record<BeltKey, string> = {
  white: BELT_HEX.white.onDark,
  blue: "#3A72C4",
  violet: "#A369AB",
  brown: "#9C6B3E",
}

// Arreglos ordenados (blanco→marrón) para los lugares que pintan los cinturones
// del curso como una secuencia de marca (logo, cubos de la landing, partículas,
// onboarding, splash, resumen). `BAR` = colores exactos; `VIVID` = versión
// legible/avivada. Ya no incluyen el negro histórico ("Aplicaciones"): esa
// unidad no forma parte de ningún curso activo, así que se sacó de la marca.
export const BELT_BAR_COLORS = BELT_ORDER.map((b) => BELT_HEX[b].solid)
export const BELT_VIVID_COLORS = BELT_ORDER.map((b) => BELT_HEX[b].onDark)

export function beltAssetPath({ belt }: { belt: BeltKey }): string {
  return BELT_ASSET[belt]
}

export function beltLabel({ belt }: { belt: BeltKey }): string {
  return BELT_LABEL[belt]
}

export function beltInfo({
  belt,
  course = "analisis",
}: {
  belt: BeltKey
  course?: CourseId
}): { headline: string; description: string } {
  const b = getBelt({ key: belt, course })
  return { headline: b?.headline ?? "", description: b?.description ?? "" }
}

export function getBelt({
  key,
  course = "analisis",
}: {
  key: BeltKey
  course?: CourseId
}): Belt | undefined {
  return CATALOGS[course].belts.find((b) => b.key === key) as Belt | undefined
}

export function unitsForBelt({
  belt,
  course = "analisis",
}: {
  belt: BeltKey
  course?: CourseId
}): Unit[] {
  return getBelt({ key: belt, course })?.units ?? []
}

// Flattened topics of a belt across all its units (units in order).
export function topicsForBelt({
  belt,
  course = "analisis",
}: {
  belt: BeltKey
  course?: CourseId
}): Topic[] {
  return unitsForBelt({ belt, course }).flatMap((u) => u.topics)
}

// Topic name comes from the catalog JSON now (no separate label map).
export function topicLabel({
  topic,
  course = "analisis",
}: {
  topic: string
  course?: CourseId
}): string {
  for (const belt of CATALOGS[course].belts) {
    for (const unit of belt.units) {
      const t = unit.topics.find((t) => t.key === topic)
      if (t) return t.name
    }
  }
  return topic
}

// Nombres cortos para mostrar en la grilla y el modo zen (el catálogo usa
// "Funciones lineales", etc.). Si un tema no está acá, cae al name del catálogo.
const TOPIC_SHORT_LABEL: Record<string, string> = {
  linear: "Lineales",
  quadratic: "Cuadráticas",
  polynomial: "Polinómicas",
  exponential: "Exponenciales",
  logarithmic: "Logarítmicas",
  rational: "Racionales",
  trigonometric: "Trigonométricas",
  limit_definition: "Definición",
  geometric_interpretation: "Interpretación",
  function_analysis: "Análisis",
  area_calculation: "Áreas",
  ftc: "Teorema",
}

export function topicShortLabel({
  topic,
  course = "analisis",
  fallback,
}: {
  topic: string
  course?: CourseId
  fallback?: string
}): string {
  if (TOPIC_SHORT_LABEL[topic]) return TOPIC_SHORT_LABEL[topic]
  if (fallback) return fallback
  return topicLabel({ topic, course })
}
