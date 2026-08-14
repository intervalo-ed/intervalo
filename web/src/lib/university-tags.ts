// Fuente única de verdad para las tags de universidad: cada una tiene su
// color de marca, pero todas comparten la misma tipografía/tamaño/grosor
// (tomados de ITBA) para que se vean parejas entre sí — usados tanto en el
// tag del leaderboard como en los botones/sugerencias del step de
// universidad del onboarding.
export type UniversityTag = {
  key: string
  fullName: string
  color: string
  font: React.CSSProperties // fontFamily, fontWeight, letterSpacing
  tagFontSize: string
  tagDy?: number // ajuste vertical fino (px) del tag chico del leaderboard
}

// Tipografía compartida por todas las tags (referencia: ITBA).
const TAG_FONT: React.CSSProperties = {
  fontFamily: "var(--font-itba)",
  fontWeight: 500,
  letterSpacing: "0.02em",
}
const TAG_FONT_SIZE = "9.0px"

export const UNIVERSITY_TAGS: UniversityTag[] = [
  {
    key: "UBA",
    fullName: "Universidad de Buenos Aires",
    color: "#4F76E0",
    font: TAG_FONT,
    tagFontSize: TAG_FONT_SIZE,
  },
  {
    key: "UTN",
    fullName: "Universidad Tecnológica Nacional",
    color: "#EC4869",
    font: TAG_FONT,
    tagFontSize: TAG_FONT_SIZE,
  },
  {
    key: "UNSAM",
    fullName: "Universidad Nacional de San Martín",
    color: "#4D90F2",
    font: TAG_FONT,
    tagFontSize: TAG_FONT_SIZE,
  },
  {
    key: "UNLP",
    fullName: "Universidad Nacional de La Plata",
    color: "#21B8AE",
    font: TAG_FONT,
    tagFontSize: TAG_FONT_SIZE,
  },
  {
    key: "UNC",
    fullName: "Universidad Nacional de Córdoba",
    color: "#4A63D6",
    font: TAG_FONT,
    tagFontSize: TAG_FONT_SIZE,
  },
  {
    key: "UNR",
    fullName: "Universidad Nacional de Rosario",
    color: "#D742A0",
    font: TAG_FONT,
    tagFontSize: TAG_FONT_SIZE,
  },
  {
    key: "UNL",
    fullName: "Universidad Nacional del Litoral",
    color: "#29CBD9",
    font: TAG_FONT,
    tagFontSize: TAG_FONT_SIZE,
  },
  {
    key: "UNT",
    fullName: "Universidad Nacional de Tucumán",
    color: "#9AA7B8",
    font: TAG_FONT,
    tagFontSize: TAG_FONT_SIZE,
  },
  {
    key: "UNS",
    fullName: "Universidad Nacional del Sur",
    color: "#2E8FE0",
    font: TAG_FONT,
    tagFontSize: TAG_FONT_SIZE,
  },
  {
    key: "UADE",
    fullName: "Universidad Argentina de la Empresa",
    color: "#E3A73C",
    font: TAG_FONT,
    tagFontSize: TAG_FONT_SIZE,
  },
  {
    key: "ITBA",
    fullName: "Instituto Tecnológico de Buenos Aires",
    color: "#2C7DBE",
    font: TAG_FONT,
    tagFontSize: TAG_FONT_SIZE,
  },
  {
    key: "UNLaM",
    fullName: "Universidad Nacional de La Matanza",
    color: "#3FAE5C",
    font: TAG_FONT,
    tagFontSize: TAG_FONT_SIZE,
  },

  // Universidades nacionales más grandes/conocidas que no estaban ya arriba,
  // y las privadas más buscadas, en orden aproximado de tamaño de alumnado y
  // popularidad (mismo criterio que matchUniversities usa como desempate).
  // Fuente del listado público: CIN, https://www.cin.edu.ar/instituciones-universitarias/
  // Colores: paleta distintiva generada, no verificada institución por institución
  // (salvo las privadas grandes, con su color de marca real).
  { key: "UNCUYO", fullName: "Universidad Nacional de Cuyo", color: "#9E2E6B", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },
  { key: "UNNE", fullName: "Universidad Nacional del Nordeste", color: "#B8358C", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },
  { key: "UNMDP", fullName: "Universidad Nacional de Mar del Plata", color: "#9E452E", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },
  { key: "UNLZ", fullName: "Universidad Nacional de Lomas de Zamora", color: "#ADB835", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },
  { key: "UNLU", fullName: "Universidad Nacional de Luján", color: "#8C479E", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },
  { key: "UNSA", fullName: "Universidad Nacional de Salta", color: "#9E476F", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },
  { key: "UNSJ", fullName: "Universidad Nacional de San Juan", color: "#9E992E", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },
  { key: "UNSL", fullName: "Universidad Nacional de San Luis", color: "#9653B8", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },
  { key: "UNRC", fullName: "Universidad Nacional de Río Cuarto", color: "#B87C53", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },
  { key: "UNTREF", fullName: "Universidad Nacional de Tres de Febrero", color: "#7EB844", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },
  { key: "UNQ", fullName: "Universidad Nacional de Quilmes", color: "#859E47", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },
  { key: "UNCOMA", fullName: "Universidad Nacional del Comahue", color: "#B86135", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },
  { key: "UNAM", fullName: "Universidad Nacional de Misiones", color: "#535BB8", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },
  { key: "UNPSJB", fullName: "Universidad Nacional de la Patagonia San Juan Bosco", color: "#612E9E", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },
  { key: "UNJu", fullName: "Universidad Nacional de Jujuy", color: "#9E7647", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },
  { key: "UNSE", fullName: "Universidad Nacional de Santiago del Estero", color: "#3A9E5F", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },
  { key: "UNGS", fullName: "Universidad Nacional de General Sarmiento", color: "#2E4F9E", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },
  { key: "UNICEN", fullName: "Universidad Nacional del Centro de la Provincia de Buenos Aires", color: "#9E4759", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },
  { key: "UNLPAM", fullName: "Universidad Nacional de La Pampa", color: "#339E2E", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },
  { key: "UNM", fullName: "Universidad Nacional de Moreno", color: "#609E3A", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },
  { key: "UNCA", fullName: "Universidad Nacional de Catamarca", color: "#35B840", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },
  { key: "UADER", fullName: "Universidad Autónoma de Entre Ríos", color: "#B89653", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },
  { key: "UNDAV", fullName: "Universidad Nacional de Avellaneda", color: "#603A9E", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },
  { key: "UNAJ", fullName: "Universidad Nacional Arturo Jauretche", color: "#2E9E9A", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },
  { key: "UNA", fullName: "Universidad Nacional de las Artes", color: "#B8449A", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },
  { key: "UNLaR", fullName: "Universidad Nacional de La Rioja", color: "#B85374", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },
  { key: "UNPA", fullName: "Universidad Nacional de la Patagonia Austral", color: "#53B863", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },
  { key: "UNF", fullName: "Universidad Nacional de Formosa", color: "#B84444", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },
  { key: "UNER", fullName: "Universidad Nacional de Entre Ríos", color: "#8135B8", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },
  { key: "UNNOBA", fullName: "Universidad Nacional del Noroeste de la Provincia de Buenos Aires", color: "#479B9E", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },
  { key: "UNO", fullName: "Universidad Nacional del Oeste", color: "#B89A44", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },
  { key: "UNRN", fullName: "Universidad Nacional de Río Negro", color: "#473A9E", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },
  { key: "UNVM", fullName: "Universidad Nacional de Villa María", color: "#9E2E87", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },
  { key: "UNLA", fullName: "Universidad Nacional de Lanús", color: "#3A799E", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },

  // Privadas
  { key: "UCA", fullName: "Universidad Católica Argentina", color: "#8C2A3B", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },
  { key: "UP", fullName: "Universidad de Palermo", color: "#B5453E", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },
  { key: "UB", fullName: "Universidad de Belgrano", color: "#1B3A6B", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },
  { key: "Kennedy", fullName: "Universidad Argentina John F. Kennedy", color: "#2E6FA8", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },
  { key: "UAI", fullName: "Universidad Abierta Interamericana", color: "#1E88A8", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },
  { key: "UM", fullName: "Universidad de Morón", color: "#3C7A5E", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },
  { key: "USAL", fullName: "Universidad del Salvador", color: "#7A4B9E", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },
  { key: "UCES", fullName: "Universidad de Ciencias Empresariales y Sociales", color: "#C77B2E", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },
  { key: "UFLO", fullName: "Universidad de Flores", color: "#B0742E", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },
  { key: "Maimonides", fullName: "Universidad Maimónides", color: "#3E8E7E", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },
  { key: "Austral", fullName: "Universidad Austral", color: "#0B4EA2", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },
  { key: "UTDT", fullName: "Universidad Torcuato Di Tella", color: "#C8372E", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },
  { key: "UdeSA", fullName: "Universidad de San Andrés", color: "#136B3D", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },
  { key: "UCEMA", fullName: "Universidad del CEMA", color: "#2B3A67", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },
  { key: "UCC", fullName: "Universidad Católica de Córdoba", color: "#9B3A2E", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },
  { key: "UCASAL", fullName: "Universidad Católica de Salta", color: "#A8562E", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },
  { key: "UBP", fullName: "Universidad Blas Pascal", color: "#3D6FB0", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },
  { key: "Champagnat", fullName: "Universidad Champagnat", color: "#5C8A3A", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },
  { key: "Barcelo", fullName: "Instituto Universitario Fundación Barceló", color: "#2E7D6B", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },
  { key: "ISALUD", fullName: "Universidad ISALUD", color: "#4E7D2E", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },

  // Públicas más chicas / de creación reciente
  { key: "UPC", fullName: "Universidad Provincial de Córdoba", color: "#61B844", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },
  { key: "UNCAUS", fullName: "Universidad Nacional del Chaco Austral", color: "#447EB8", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },
  { key: "UNDEC", fullName: "Universidad Nacional de Chilecito", color: "#869E2E", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },
  { key: "UNRT", fullName: "Universidad Nacional de Río Tercero", color: "#4BB835", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },
  { key: "UNPAZ", fullName: "Universidad Nacional de José C. Paz", color: "#35B8A2", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },
  { key: "UNAB", fullName: "Universidad Nacional Guillermo Brown", color: "#8DB853", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },
  { key: "UNAHUR", fullName: "Universidad Nacional de Hurlingham", color: "#9E3A92", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },
  { key: "UNICABA", fullName: "Universidad de la Ciudad de Buenos Aires", color: "#3A9E79", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },
  { key: "UNDEF", fullName: "Universidad de la Defensa Nacional", color: "#53A7B8", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },
  { key: "UPE", fullName: "Universidad Provincial de Ezeiza", color: "#479E61", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },
  { key: "UNMa", fullName: "Universidad Nacional Madres de Plaza de Mayo", color: "#44B87E", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },
  { key: "UNIPE", fullName: "Universidad Pedagógica Nacional", color: "#9E3A47", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },
  { key: "UDC", fullName: "Universidad del Chubut", color: "#AF53B8", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },
  { key: "UNLC", fullName: "Universidad Nacional de los Comechingones", color: "#4B479E", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },
  { key: "UNSO", fullName: "Universidad Nacional Raúl Scalabrini Ortiz", color: "#2E9E7D", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },
  { key: "UPSO", fullName: "Universidad Provincial del Sudoeste", color: "#B84035", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },
  { key: "UNRAF", fullName: "Universidad Nacional de Rafaela", color: "#B744B8", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },
  { key: "UNTDF", fullName: "Universidad Nacional de Tierra del Fuego", color: "#475A9E", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },
  { key: "UNDELTA", fullName: "Universidad Nacional del Delta", color: "#9E923A", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },
  { key: "UPLAB", fullName: "Universidad Provincial de Laguna Blanca", color: "#6144B8", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },
  { key: "UNSADA", fullName: "Universidad Nacional de San Antonio de Areco", color: "#449BB8", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },
  { key: "UNVIME", fullName: "Universidad Nacional de Villa Mercedes", color: "#53B8AF", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },
  { key: "UNPILAR", fullName: "Universidad Nacional de Pilar", color: "#356CB8", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },
  { key: "UNAU", fullName: "Universidad Nacional del Alto Uruguay", color: "#6F9E47", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },
]

export const UNIVERSITY_TAG_BY_KEY: Record<string, UniversityTag> = Object.fromEntries(
  UNIVERSITY_TAGS.map((u) => [u.key, u]),
)

// Los accesos directos del step de universidad del onboarding, en el orden en
// que se dibujan (grilla de 3 columnas → dos filas). El resto de las tags entra
// por el campo "Otra". Cada una necesita su logo en UNIVERSITY_LOGOS
// (onboarding-wizard.tsx); sin logo el botón cae al texto de la sigla.
export const ONBOARDING_UNIVERSITIES = ["UBA", "UTN", "UNLP", "UNSAM", "UNC", "UADE"]

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
}

// Lo que se guarda cuando alguien escribe la universidad a mano en "Otra". Si
// el texto es una sigla o el nombre completo de una tag conocida (sin importar
// may/min ni tildes), se guarda la sigla canónica: alguien que escribe "uba" o
// "Universidad de Buenos Aires" tiene que quedar con la misma tag azul que
// alguien que tocó la sugerencia "UBA", no con el chip gris de universidad
// desconocida. Si no matchea nada, se guarda tal cual lo escribió.
export function canonicalUniversity(input: string): string {
  const value = input.trim()
  const q = normalize(value)
  if (!q) return value
  const match = UNIVERSITY_TAGS.find(
    (uni) => normalize(uni.key) === q || normalize(uni.fullName) === q,
  )
  return match ? match.key : value
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
