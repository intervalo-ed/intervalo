import { catalog, type Belt, type BeltKey, type Topic } from "./analisis-1.generated"

export { catalog }
export type { Belt, BeltKey, Topic }

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

const BELT_INFO: Record<BeltKey, { headline: string; description: string }> = {
  white: {
    headline: "Funciones",
    description:
      "El estudio de la relación matemática que asocia a cada elemento de un dominio con una única imagen en un codominio. Representan la estructura lógica básica para modelar cualquier tipo de dependencia entre variables en el cálculo.\n\nPermite transformar entradas en salidas siguiendo leyes definidas, modelar dinámicas de crecimiento, decaimiento o ciclos, y establecer la base para cualquier análisis de cambio posterior.\n\nSe aplica en el modelado de trayectorias físicas, en la predicción de tendencias económicas, en la representación de fenómenos naturales mediante modelos funcionales, etc.",
  },
  blue: {
    headline: "Límites",
    description:
      "El análisis del comportamiento de una función a medida que su variable independiente se aproxima a un valor específico o al infinito. Constituyen el concepto crítico que permite definir la continuidad y la derivada de manera rigurosa.\n\nFacilita el estudio de discontinuidades, el cálculo de asíntotas y la evaluación de tasas de variación instantánea, permitiendo resolver indeterminaciones algebraicas fundamentales para el cálculo.\n\nSe aplica en la definición rigurosa de la velocidad instantánea, en el análisis de estabilidad de sistemas, en la aproximación numérica de valores funcionales, etc.",
  },
  violet: {
    headline: "Derivadas",
    description:
      "La medida de la tasa de cambio instantánea de una función con respecto a su variable independiente. Actúan como la herramienta principal para entender la sensibilidad, la pendiente y el movimiento de un sistema en un punto dado.\n\nPermite identificar pendientes, calcular razones de cambio, determinar la dirección de crecimiento o decrecimiento y analizar la curvatura de las funciones para entender su comportamiento local.\n\nSe aplica en la física para el cálculo de velocidades y aceleraciones, en la optimización de procesos industriales, en la interpretación geométrica de tangentes, etc.",
  },
  brown: {
    headline: "Integrales",
    description:
      "La operación analítica que permite acumular cambios infinitesimales o calcular el área neta bajo curvas en un intervalo definido. Representan el núcleo del cálculo integral y la conexión fundamental mediante el Teorema Fundamental del Cálculo.\n\nPermite reconstruir funciones a partir de sus tasas de cambio, calcular el área neta bajo curvas y determinar volúmenes o acumulaciones de cantidades físicas en intervalos.\n\nSe aplica en el cálculo de áreas de figuras irregulares, en la determinación de centros de masa, en el análisis de trabajo y energía en física, en la reconstrucción de funciones de posición a partir de la velocidad, etc.",
  },
}

export const BELT_ORDER: BeltKey[] = ["white", "blue", "violet", "brown"]

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
  return BELT_INFO[belt]
}

export function getBelt({ key }: { key: BeltKey }): Belt | undefined {
  return catalog.belts.find((b) => b.key === key)
}

// Topic name comes from the catalog JSON now (no separate label map).
export function topicLabel({ topic }: { topic: string }): string {
  for (const belt of catalog.belts) {
    const t = belt.topics.find((t) => t.key === topic)
    if (t) return t.name
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
