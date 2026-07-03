import { catalog, type Belt, type BeltKey, type Topic, type Unit } from "./analisis.generated"

export { catalog }
export type { Belt, BeltKey, Topic, Unit }

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

// Fuente de verdad de los colores de cinturón, espejada del ícono de la app
// (web/src/components/app-icon.tsx). `solid` = el color exacto de la marca, para
// bloques de color (ícono, cubos de la landing, barras del logo). `onDark` = el
// mismo tono aclarado para que se lea bien como texto/partícula sobre el fondo
// oscuro (#131324), donde el negro y el azul puros quedan ilegibles.
export const BELT_HEX: Record<BeltKey, { solid: string; onDark: string }> = {
  white: { solid: "#FAFAFA", onDark: "#FAFAFA" },
  blue: { solid: "#0A3180", onDark: "#5C86E8" },
  violet: { solid: "#730F8C", onDark: "#C07BD4" },
  brown: { solid: "#674011", onDark: "#C58A4A" },
}

// Negro histórico ("Aplicaciones"): ya no es una unidad del curso, pero sigue
// formando parte de la identidad visual de la marca (el logo y la secuencia de
// colores). Por eso vive acá como color fijo y no en BELT_HEX (que es Record por
// BeltKey y sigue al curso activo).
const BRAND_BLACK = { solid: "#272727", onDark: "#C9CDD6" }

// Arreglos ordenados (blanco→negro) para los lugares que pintan los 5 cinturones
// como una secuencia de marca (logo, cubos de la landing, partículas, onboarding,
// splash, resumen). Incluyen SIEMPRE el negro aunque el curso ya no lo use.
// `BAR` = colores exactos; `VIVID` = versión legible/avivada.
export const BELT_BAR_COLORS = [
  ...BELT_ORDER.map((b) => BELT_HEX[b].solid),
  BRAND_BLACK.solid,
]
export const BELT_VIVID_COLORS = [
  ...BELT_ORDER.map((b) => BELT_HEX[b].onDark),
  BRAND_BLACK.onDark,
]

export function beltAssetPath({ belt }: { belt: BeltKey }): string {
  return BELT_ASSET[belt]
}

export function beltLabel({ belt }: { belt: BeltKey }): string {
  return BELT_LABEL[belt]
}

export function beltInfo({ belt }: { belt: BeltKey }): {
  headline: string
  description: string
} {
  const b = getBelt({ key: belt })
  return { headline: b?.headline ?? "", description: b?.description ?? "" }
}

export function getBelt({ key }: { key: BeltKey }): Belt | undefined {
  return catalog.belts.find((b) => b.key === key)
}

export function unitsForBelt({ belt }: { belt: BeltKey }): Unit[] {
  return getBelt({ key: belt })?.units ?? []
}

// Flattened topics of a belt across all its units (units in order).
export function topicsForBelt({ belt }: { belt: BeltKey }): Topic[] {
  return unitsForBelt({ belt }).flatMap((u) => u.topics)
}

// Topic name comes from the catalog JSON now (no separate label map).
export function topicLabel({ topic }: { topic: string }): string {
  for (const belt of catalog.belts) {
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
  modulo: "Módulo",
  trigonometric: "Trigonométricas",
  limit_definition: "Definición",
  geometric_interpretation: "Interpretación",
  function_analysis: "Análisis",
  area_calculation: "Áreas",
  ftc: "Teorema",
}

export function topicShortLabel({ topic }: { topic: string }): string {
  return TOPIC_SHORT_LABEL[topic] ?? topicLabel({ topic })
}
