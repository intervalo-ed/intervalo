// Fuente única de verdad para las tags de universidad: color + tipografía que
// evoca cada isotipo, usados tanto en el tag del leaderboard como en los
// botones/sugerencias del step de universidad del onboarding.
export type UniversityTag = {
  key: string
  fullName: string
  color: string
  font: React.CSSProperties // fontFamily, fontWeight, letterSpacing
  tagFontSize: string
  tagDy?: number // ajuste vertical fino (px) del tag chico del leaderboard
}

export const UNIVERSITY_TAGS: UniversityTag[] = [
  {
    key: "UBA",
    fullName: "Universidad de Buenos Aires",
    color: "#4F76E0",
    font: { fontFamily: "var(--font-uba)", fontWeight: 500, letterSpacing: "0.06em" },
    tagFontSize: "0.55rem",
  },
  {
    key: "UTN",
    fullName: "Universidad Tecnológica Nacional",
    color: "#EC4869",
    font: { fontFamily: "var(--font-utn)", fontWeight: 600, letterSpacing: "0.1em" },
    tagFontSize: "0.55rem",
  },
  {
    key: "UNSAM",
    fullName: "Universidad Nacional de San Martín",
    color: "#4D90F2",
    font: { fontFamily: "var(--font-unsam)", fontWeight: 500, letterSpacing: "0.02em" },
    tagFontSize: "0.55rem",
  },
  {
    key: "UNLP",
    fullName: "Universidad Nacional de La Plata",
    color: "#21B8AE",
    font: { fontFamily: "var(--font-unlp)", fontWeight: 600, letterSpacing: "0.03em" },
    tagFontSize: "8.5px",
  },
  {
    key: "UNC",
    fullName: "Universidad Nacional de Córdoba",
    color: "#4A63D6",
    font: { fontFamily: "var(--font-unc)", fontWeight: 600, letterSpacing: "0.04em" },
    tagFontSize: "8.2px",
    tagDy: 0.8,
  },
  {
    key: "UNR",
    fullName: "Universidad Nacional de Rosario",
    color: "#D742A0",
    font: { fontFamily: "var(--font-unr)", fontWeight: 600, letterSpacing: "0.03em" },
    tagFontSize: "8.4px",
    tagDy: -0.8,
  },
  {
    key: "UNL",
    fullName: "Universidad Nacional del Litoral",
    color: "#29CBD9",
    font: { fontFamily: "var(--font-unl)", fontWeight: 500, letterSpacing: "0.04em" },
    tagFontSize: "8.2px",
  },
  {
    key: "UNT",
    fullName: "Universidad Nacional de Tucumán",
    color: "#9AA7B8",
    font: { fontFamily: "var(--font-unt)", fontWeight: 500, letterSpacing: "0.05em" },
    tagFontSize: "8.0px",
  },
  {
    key: "UNS",
    fullName: "Universidad Nacional del Sur",
    color: "#2E8FE0",
    font: { fontFamily: "var(--font-uns)", fontWeight: 600, letterSpacing: "0.04em" },
    tagFontSize: "9.0px",
    tagDy: 0.3,
  },
  {
    key: "UADE",
    fullName: "Universidad Argentina de la Empresa",
    color: "#E3A73C",
    font: { fontFamily: "var(--font-uade)", fontWeight: 600, letterSpacing: "0.06em" },
    tagFontSize: "8.3px",
    tagDy: 0.6,
  },
  {
    key: "ITBA",
    fullName: "Instituto Tecnológico de Buenos Aires",
    color: "#2C7DBE",
    font: { fontFamily: "var(--font-itba)", fontWeight: 500, letterSpacing: "0.02em" },
    tagFontSize: "9.0px",
  },
  {
    key: "UNLaM",
    fullName: "Universidad Nacional de La Matanza",
    color: "#3FAE5C",
    font: { fontFamily: "var(--font-unlam)", fontWeight: 500, letterSpacing: "0.04em" },
    tagFontSize: "8.6px",
  },
]

export const UNIVERSITY_TAG_BY_KEY: Record<string, UniversityTag> = Object.fromEntries(
  UNIVERSITY_TAGS.map((u) => [u.key, u]),
)

// Los 3 accesos directos del step de universidad del onboarding.
export const PRESET_UNIVERSITIES = ["UBA", "UTN", "UNSAM"]

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
}

// Sugerencias de universidad para el campo "Otra" del onboarding: matchea por
// sigla o por nombre completo (sin distinguir may/min ni tildes). Prioriza los
// matches por sigla por sobre los que solo matchean por nombre completo.
export function matchUniversities(query: string, limit = 5): UniversityTag[] {
  const q = normalize(query.trim())
  if (!q) return []

  const byKey: UniversityTag[] = []
  const byName: UniversityTag[] = []
  for (const uni of UNIVERSITY_TAGS) {
    if (normalize(uni.key).includes(q)) {
      byKey.push(uni)
    } else if (normalize(uni.fullName).includes(q)) {
      byName.push(uni)
    }
  }
  return [...byKey, ...byName].slice(0, limit)
}
