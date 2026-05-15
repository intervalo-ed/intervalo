import { catalog, type Belt, type BeltKey } from "./analisis-1.generated"

export { catalog }
export type { Belt, BeltKey }

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

const SKILL_LABEL: Record<string, string> = {
  CLSF: "Clasificación",
  LEXI: "Identificación",
  FORM: "Formal",
  GRAF: "Gráfica",
  DERI: "Derivada",
  INTG: "Integral",
  RESL: "Resolución",
  ESTR: "Estructura",
  APLI: "Aplicación",
}

const TOPIC_LABEL: Record<string, string> = {
  linear: "Funciones lineales",
  quadratic: "Funciones cuadráticas",
  polynomial: "Funciones polinómicas",
  exponential: "Funciones exponenciales",
  logarithmic: "Funciones logarítmicas",
  rational: "Funciones racionales",
  trigonometric: "Funciones trigonométricas",
  algebraic_limits: "Límites algebraicos",
  lateral_limits: "Límites laterales",
  infinite_limits: "Límites al infinito",
  continuity: "Continuidad",
  factorizacion: "Factorización",
  racionalizacion: "Racionalización",
  limit_definition: "Definición de derivada",
  geometric_interpretation: "Interpretación geométrica",
  basic_rules: "Reglas básicas",
  product_quotient: "Producto y cociente",
  chain_rule: "Regla de la cadena",
  lhopital: "L'Hôpital",
  indefinite_integral: "Integral indefinida",
  substitution: "Sustitución",
  integration_by_parts: "Integración por partes",
  definite_integral: "Integral definida",
  function_analysis: "Análisis de funciones",
  optimization: "Optimización",
  area_calculation: "Cálculo de áreas",
  ftc: "Teorema fundamental",
}

export const BELT_ORDER: BeltKey[] = ["white", "blue", "violet", "brown", "black"]

export function beltAssetPath({ belt }: { belt: BeltKey }): string {
  return BELT_ASSET[belt]
}

export function beltLabel({ belt }: { belt: BeltKey }): string {
  return BELT_LABEL[belt]
}

export function skillLabel({ skill }: { skill: string }): string {
  return SKILL_LABEL[skill] ?? skill
}

export function topicLabel({ topic }: { topic: string }): string {
  return TOPIC_LABEL[topic] ?? topic
}

export function getBelt({ key }: { key: BeltKey }): Belt | undefined {
  return catalog.belts.find((b) => b.key === key)
}

// Matches the backend's `${topic}:${skill}` skill_states key shape.
// Topic keys are globally unique across belts in catalog.json, so the belt is
// not part of the key.
export function itemKey({
  topic,
  skill,
}: {
  topic: string
  skill: string
}): string {
  return `${topic}:${skill}`
}
