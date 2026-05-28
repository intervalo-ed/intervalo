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
      "Trabajás tu capacidad para reconocer, describir y manipular las distintas familias de funciones que se suelen ver en Análisis Matemático I.",
  },
  blue: {
    headline: "Límites",
    description:
      "Explorás el comportamiento de funciones al acercarse a un punto. Aprendés a calcular límites con técnicas algebraicas e identificar continuidad e indeterminaciones.",
  },
  violet: {
    headline: "Derivadas",
    description:
      "Dominás las reglas de derivación y su interpretación geométrica. Usás derivadas para analizar funciones y resolver problemas de optimización.",
  },
  brown: {
    headline: "Integrales",
    description:
      "Aprendés a calcular integrales indefinidas y definidas usando sustitución e integración por partes, conectando con el Teorema Fundamental del Cálculo.",
  },
  black: {
    headline: "Aplicaciones",
    description:
      "Integrás todo lo aprendido para analizar funciones en profundidad, resolver problemas de optimización y área, y aplicar el Teorema Fundamental del Cálculo.",
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
