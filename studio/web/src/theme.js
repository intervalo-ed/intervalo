// Tokens MODO CLARO derivados de la paleta de marca de Intervalo.
// (La app principal es modo oscuro; acá creamos la variante clara manteniendo
//  identidad: periwinkle primario, colores de cinturón, fuentes Inter/Noto Serif.)

export const fonts = {
  heading: "'Noto Serif', Georgia, serif",
  body: "'Inter', system-ui, sans-serif",
  mono: "'JetBrains Mono', monospace",
};

export const C = {
  bg: "#F7F7FB",
  bgCard: "#FFFFFF",
  bgElevated: "#F1F2F8",
  border: "#E5E7EF",
  borderStrong: "#D5D8E5",

  primary: "#7E80F7",
  primaryHover: "#6A6CF0",
  primarySoft: "rgba(126,128,247,0.12)",

  success: "#1FA85A",
  successBg: "rgba(54,216,122,0.14)",
  error: "#E0484C",
  errorBg: "rgba(247,101,101,0.12)",

  text: "#131324",
  textSecondary: "#5B6478",
  muted: "#8A93A6",

  pill: "rgba(126,128,247,0.12)",
  pillText: "#5557C9",
};

export const BELT_COLORS = ["#E0DDD0", "#1C3A8B", "#6B2D8B", "#6B3A1F", "#111111"];

export const BELT_LABELS = {
  white: "Blanco",
  blue: "Azul",
  violet: "Violeta",
  brown: "Marrón",
  black: "Negro",
};

export const SKILL_LABELS = {
  CLSF: "Clasificación", LEXI: "Léxico", FORM: "Formulación",
  GRAF: "Graficación", RESL: "Resolución", ESTR: "Estrategia",
  DERI: "Derivación", INTG: "Integración", APLI: "Aplicación",
};

export const TOPIC_LABELS = {
  linear: "Lineales", quadratic: "Cuadráticas", polynomial: "Polinomiales",
  exponential: "Exponenciales", logarithmic: "Logarítmicas",
  rational: "Racionales", trigonometric: "Trigonométricas",
  algebraic_limits: "Lím. algebraicos", lateral_limits: "Lím. laterales",
  infinite_limits: "Lím. al infinito", continuity: "Continuidad",
  factorizacion: "Factorización", racionalizacion: "Racionalización",
  limit_definition: "Def. de límite", geometric_interpretation: "Interp. geométrica",
  basic_rules: "Reglas básicas", product_quotient: "Prod./Cociente",
  chain_rule: "Regla de la cadena", lhopital: "L'Hôpital",
  indefinite_integral: "Integral indef.", substitution: "Sustitución",
  integration_by_parts: "Por partes", definite_integral: "Integral def.",
  function_analysis: "Análisis func.", optimization: "Optimización",
  area_calculation: "Cálculo de área", ftc: "T. Fundamental",
};

export const card = {
  background: C.bgCard,
  border: `1px solid ${C.border}`,
  borderRadius: 14,
  boxShadow: "0 1px 2px rgba(19,19,36,0.04), 0 4px 16px rgba(19,19,36,0.04)",
};

export const inputStyle = {
  width: "100%",
  padding: "0.6rem 0.75rem",
  border: `1px solid ${C.border}`,
  borderRadius: 9,
  fontSize: "0.92rem",
  outline: "none",
  color: C.text,
  background: C.bgCard,
  fontFamily: fonts.body,
};

export const labelStyle = {
  fontWeight: 600,
  fontSize: "0.72rem",
  color: C.muted,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  marginBottom: "0.35rem",
  display: "block",
};

export function topicLabel(key) {
  return TOPIC_LABELS[key] || key;
}
