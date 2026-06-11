import { catalog, type Belt, type BeltKey, type Topic } from "./analisis-1.generated"

export { catalog }
export type { Belt, BeltKey, Topic }

const BELT_ASSET: Record<BeltKey, string> = {
  white: "/belt_white.png",
  blue: "/belt_blue.png",
  violet: "/belt_purple.png",
  brown: "/belt_brown.png",
  black: "/belt_black.png",
}

const BELT_LABEL: Record<BeltKey, string> = {
  white: "Blanco",
  blue: "Azul",
  violet: "Violeta",
  brown: "Marrón",
  black: "Negro",
}

const BELT_INFO: Record<BeltKey, { headline: string; description: string }> = {
  white: {
    headline: "Funciones",
    description:
      "En esta unidad, trabajás tu capacidad para reconocer, describir y manipular las distintas familias de funciones.",
  },
  blue: {
    headline: "Límites",
    description:
      "En esta unidad, explorás el comportamiento de funciones al acercarse a un punto y aprendés a calcular límites con técnicas algebraicas, además de identificar continuidad e indeterminaciones.",
  },
  violet: {
    headline: "Derivadas",
    description:
      "En esta unidad, trabajás las reglas de derivación y su interpretación geométrica, y usás derivadas para analizar funciones y resolver problemas de optimización.",
  },
  brown: {
    headline: "Integrales",
    description:
      "En esta unidad, aprendés a calcular integrales indefinidas y definidas usando sustitución e integración por partes, conectando con el Teorema Fundamental del Cálculo.",
  },
  black: {
    headline: "Aplicaciones",
    description:
      "En esta unidad, integrás todo lo aprendido para analizar funciones en profundidad, resolver problemas de optimización y área, y aplicar el Teorema Fundamental del Cálculo.",
  },
}

export const BELT_ORDER: BeltKey[] = ["white", "blue", "violet", "brown", "black"]

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
