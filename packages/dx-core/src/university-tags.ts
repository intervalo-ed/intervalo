// Fuente única de verdad para las tags de universidad: cada una tiene su
// color de marca, pero todas comparten la misma tipografía/tamaño/grosor
// (tomados de ITBA) para que se vean parejas entre sí — usados tanto en el
// tag del leaderboard como en los botones/sugerencias del step de
// universidad del onboarding.
// País de la casa de estudios. Define la banderita que va a la derecha de la
// tag. "Sin país" (undefined) es una institución custom: no lleva bandera.
export type Pais = "AR" | "UY" | "CL" | "PY"

export const PAIS_NOMBRE: Record<Pais, string> = {
  AR: "Argentina",
  UY: "Uruguay",
  CL: "Chile",
  PY: "Paraguay",
}

export type UniversityTag = {
  // Lo que se guarda en la base. Es único en todo el listado, así que dos
  // universidades de países distintos con la misma sigla (UNAB de Chile y UNAB
  // de Argentina) necesitan claves distintas: "UNAB-CL" y "UNAB".
  key: string
  // Lo que se DIBUJA en la tag, si no es la clave. Existe para que la clave
  // técnica "UNAB-CL" se lea "UNAB" con la bandera chilena al lado.
  label?: string
  // Otras maneras de buscarla en el campo "Otra" (no se guardan ni
  // canonicalizan: "UC" tipeado a mano es ambiguo entre países).
  aliases?: string[]
  country?: Pais
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

// La fórmula de la tag: el color de marca hace de texto, de borde al 60% y de
// fondo al 20%. TODAS las universidades la comparten — no hay excepciones, y
// esa uniformidad es la que hace que se lean como un conjunto.
//
// Vive acá y no en cada componente porque estaba copiada en TRES lugares —el
// tag del ranking, las sugerencias del step de universidad y las del recupero
// de perfil—, y tres copias de una fórmula son tres formas de que la próxima
// universidad se vea distinta en un lado y no en los otros. Devuelve solo
// color/borde/fondo + tipografía: el tamaño y el ajuste vertical los pone cada
// lugar, que no son el mismo (9 px en el ranking, `text-xs` en los botones).
export function estilosDeTag(cfg: UniversityTag): React.CSSProperties {
  return {
    color: cfg.color,
    borderColor: `${cfg.color}99`,
    backgroundColor: `${cfg.color}33`,
    ...cfg.font,
  }
}

const TAGS_BASE: Omit<UniversityTag, "country">[] = [
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
    // El verdeazulado del isotipo de la FCEFyN. Reemplaza al #4A63D6, un azul
    // violáceo que a 9 px no se distinguía del #4F76E0 de la UBA ni del
    // #2E8FE0 de la UNS.
    //
    // Queda cerca del #21B8AE de la UNLP: misma familia, y lo que las separa
    // es la saturación y no el tono. Elegido así a sabiendas — si en el
    // ranking se ve que se confunden, el que se mueve es este.
    key: "UNC",
    fullName: "Universidad Nacional de Córdoba",
    color: "#3E9C93",
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
  { key: "UNNE", fullName: "Universidad Nacional del Nordeste", color: "#E0479E", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },
  { key: "UNMDP", fullName: "Universidad Nacional de Mar del Plata", color: "#E06B3E", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },
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
  { key: "UCA", fullName: "Universidad Católica Argentina", color: "#3454D1", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },
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
  // Uruguay. El tono sale del sitio oficial de la facultad de
  // ingeniería/económicas de cada una, investigado 2026-09-19, pero AJUSTADO a
  // más brillo/saturación que el original institucional: el color real de
  // marca de estas 5 es oscuro (navy, bordó), y a 9px de texto sobre un fondo
  // al 20% se leía apagado al lado del resto de las tags — la fórmula de
  // `estilosDeTag` pide un color que funcione como texto, no como superficie.
  // UTEC no se tocó: su marca ya es un cian brillante.
  // "UMontevideo" y no "UM" porque esa sigla ya la usa Universidad de Morón
  // arriba — la Universidad de Montevideo se abrevia UM en Uruguay, pero acá
  // hubiera chocado.
  { key: "UdelaR", fullName: "Universidad de la República", color: "#4C63D6", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },
  { key: "UTEC", fullName: "Universidad Tecnológica del Uruguay", color: "#00C7FF", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },
  { key: "ORT", fullName: "Universidad ORT Uruguay", color: "#C4415E", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },
  { key: "UCU", fullName: "Universidad Católica del Uruguay", color: "#8F6FC9", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },
  { key: "UMontevideo", fullName: "Universidad de Montevideo", color: "#2E86DE", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },
  { key: "UDE", fullName: "Universidad de la Empresa", color: "#14A9C7", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },
]

const URUGUAY = new Set(["UdelaR", "UTEC", "ORT", "UCU", "UMontevideo", "UDE"])

// Chile. Los colores salen de la identidad de cada casa de estudios, subidos de
// brillo por la misma razón que los de Uruguay: a 9 px sobre un fondo al 20% el
// navy y el bordó institucionales se leen apagados. Las que comparten sigla con
// una de otro país (UAI, UNAB) llevan la clave con sufijo y un `label` que se
// dibuja sin él: se guardan distintas y se ven iguales, con su bandera al lado.
const TAGS_CHILE: UniversityTag[] = [
  { key: "UChile", aliases: ["UCH", "U de Chile"], country: "CL", fullName: "Universidad de Chile", color: "#E5484D", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },
  { key: "PUC", aliases: ["UC", "Católica de Chile", "PUC Chile"], country: "CL", fullName: "Pontificia Universidad Católica de Chile", color: "#2F6FDB", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },
  { key: "USACH", aliases: ["Santiago"], country: "CL", fullName: "Universidad de Santiago de Chile", color: "#E8742C", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },
  { key: "UTFSM", aliases: ["USM", "Santa María"], country: "CL", fullName: "Universidad Técnica Federico Santa María", color: "#3AA66B", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },
  { key: "UDEC", aliases: ["UdeC"], country: "CL", fullName: "Universidad de Concepción", color: "#F2B632", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },
  { key: "PUCV", country: "CL", fullName: "Pontificia Universidad Católica de Valparaíso", color: "#3B82C4", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },
  { key: "UV", country: "CL", fullName: "Universidad de Valparaíso", color: "#2BA3B5", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },
  { key: "UACh", aliases: ["Austral de Chile"], country: "CL", fullName: "Universidad Austral de Chile", color: "#4C9A2A", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },
  { key: "UFRO", country: "CL", fullName: "Universidad de La Frontera", color: "#1FA88A", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },
  { key: "ULS", country: "CL", fullName: "Universidad de La Serena", color: "#C0508A", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },
  { key: "UANTOF", country: "CL", fullName: "Universidad de Antofagasta", color: "#D0692B", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },
  { key: "UTA", country: "CL", fullName: "Universidad de Tarapacá", color: "#7B5BD6", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },
  { key: "UDD", country: "CL", fullName: "Universidad del Desarrollo", color: "#D1456B", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },
  { key: "UAI-CL", label: "UAI", country: "CL", fullName: "Universidad Adolfo Ibáñez", color: "#3D5AD6", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },
  { key: "UDP", country: "CL", fullName: "Universidad Diego Portales", color: "#E5533D", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },
  { key: "UANDES", country: "CL", fullName: "Universidad de los Andes (Chile)", color: "#1F7A8C", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },
  { key: "UNAB-CL", label: "UNAB", country: "CL", fullName: "Universidad Andrés Bello", color: "#E0504A", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },
  { key: "UTEM", country: "CL", fullName: "Universidad Tecnológica Metropolitana", color: "#36A3D9", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },
  { key: "UCSC", country: "CL", fullName: "Universidad Católica de la Santísima Concepción", color: "#6C7BD9", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },
  { key: "UCN", country: "CL", fullName: "Universidad Católica del Norte", color: "#C99A2E", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },
  { key: "UBB", aliases: ["Biobío"], country: "CL", fullName: "Universidad del Bío-Bío", color: "#3E9AD6", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },
  { key: "UDLA", country: "CL", fullName: "Universidad de las Américas", color: "#D9672E", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },
  { key: "UVM", country: "CL", fullName: "Universidad Viña del Mar", color: "#8C5BC0", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },
  { key: "UCM", country: "CL", fullName: "Universidad Católica del Maule", color: "#5AAE4A", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },
  { key: "UMAG", country: "CL", fullName: "Universidad de Magallanes", color: "#4A86C8", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },
  { key: "UCT", country: "CL", fullName: "Universidad Católica de Temuco", color: "#B5683A", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },
  { key: "USS", country: "CL", fullName: "Universidad San Sebastián", color: "#D4A02F", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },
  { key: "UMayor", country: "CL", fullName: "Universidad Mayor", color: "#2F8F9D", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },
  { key: "UCEN", country: "CL", fullName: "Universidad Central de Chile", color: "#C44F4F", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },
  { key: "UNAP", country: "CL", fullName: "Universidad Arturo Prat", color: "#5F7FD0", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },
  { key: "UDA", country: "CL", fullName: "Universidad de Atacama", color: "#B9772F", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },
  { key: "UOH", country: "CL", fullName: "Universidad de O'Higgins", color: "#D95F5F", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },
  { key: "UTalca", country: "CL", fullName: "Universidad de Talca", color: "#E2832A", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },
]

// Paraguay. Mismo criterio. UNP (Pilar) y UNE no chocan con nada; UNA, UCA y
// UNCA sí (Artes, Católica Argentina, Catamarca) y por eso llevan sufijo.
const TAGS_PARAGUAY: UniversityTag[] = [
  { key: "UNA-PY", label: "UNA", aliases: ["UNA Paraguay"], country: "PY", fullName: "Universidad Nacional de Asunción", color: "#1F5FBF", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },
  { key: "UCA-PY", label: "UCA", aliases: ["Católica de Asunción"], country: "PY", fullName: "Universidad Católica Nuestra Señora de la Asunción", color: "#D0A12E", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },
  { key: "UNE", country: "PY", fullName: "Universidad Nacional del Este", color: "#2E9E5B", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },
  { key: "UNI", aliases: ["Itapúa"], country: "PY", fullName: "Universidad Nacional de Itapúa", color: "#E07B39", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },
  { key: "UNP", aliases: ["UNP Paraguay"], country: "PY", fullName: "Universidad Nacional de Pilar (Paraguay)", color: "#7B4FBF", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },
  { key: "UNCA-PY", label: "UNCA", country: "PY", fullName: "Universidad Nacional de Concepción", color: "#3FA3A3", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },
  { key: "UNVES", country: "PY", fullName: "Universidad Nacional de Villarrica del Espíritu Santo", color: "#B84A8F", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },
  { key: "UPAP", country: "PY", fullName: "Universidad Politécnica y Artística del Paraguay", color: "#CF5B5B", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },
  { key: "UAA", country: "PY", fullName: "Universidad Autónoma de Asunción", color: "#3C8DD6", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },
  { key: "UNINORTE", country: "PY", fullName: "Universidad del Norte", color: "#4A9E6A", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },
  { key: "UTIC", country: "PY", fullName: "Universidad Tecnológica Intercontinental", color: "#8B6FD1", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },
  { key: "UPA", country: "PY", fullName: "Universidad Paraguayo Alemana", color: "#C9863A", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },
  { key: "UAM", country: "PY", fullName: "Universidad Americana", color: "#D4506B", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },
  { key: "UNIDA", country: "PY", fullName: "Universidad de la Integración de las Américas", color: "#2FA4C4", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },
  { key: "Columbia", country: "PY", fullName: "Universidad Columbia del Paraguay", color: "#6F8FD6", font: TAG_FONT, tagFontSize: TAG_FONT_SIZE },
]

export const UNIVERSITY_TAGS: UniversityTag[] = [
  ...TAGS_BASE.map((t): UniversityTag => ({ ...t, country: URUGUAY.has(t.key) ? "UY" : "AR" })),
  ...TAGS_CHILE,
  ...TAGS_PARAGUAY,
]

export const UNIVERSITY_TAG_BY_KEY: Record<string, UniversityTag> = Object.fromEntries(
  UNIVERSITY_TAGS.map((u) => [u.key, u]),
)

// Los accesos directos del step de universidad del onboarding, en el orden en
// que se dibujan (grilla de 3 columnas → dos filas). El resto de las tags entra
// por el campo "Otra". Cada una necesita su logo en UNIVERSITY_LOGOS
// (onboarding-wizard.tsx); sin logo el botón cae al texto de la sigla.
export const ONBOARDING_UNIVERSITIES = ["UBA", "UTN", "UNLP", "UNSAM", "UNC", "UNL"]

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
// alguien que tocó la sugerencia "UBA".
//
// Si no matchea nada es una institución custom ("CERN", "FING"). Una sola
// palabra corta de letras se guarda en MAYÚSCULAS: "Fing", "fing" y "FING" son
// la misma sigla y, sin esto, el ranking las cuenta como tres universidades.
// Todo lo demás se guarda como lo escribió, con los espacios colapsados.
export function canonicalUniversity(input: string): string {
  const value = input.trim().replace(/\s+/g, " ")
  const q = normalize(value)
  if (!q) return value
  const match = UNIVERSITY_TAGS.find(
    (uni) => normalize(uni.key) === q || normalize(uni.fullName) === q,
  )
  if (match) return match.key
  return /^[A-Za-z]{2,6}$/.test(value) ? value.toUpperCase() : value
}

// Sugerencias de universidad para el campo "Otra": matchea por sigla, por alias
// o por nombre completo (sin distinguir may/min ni tildes), y también por país
// ("chile" trae las chilenas). Prioriza sigla, después alias, después nombre.
export function matchUniversities(query: string, limit = 5): UniversityTag[] {
  const q = normalize(query.trim())
  if (!q) return []

  const byKey: UniversityTag[] = []
  const byAlias: UniversityTag[] = []
  const byName: UniversityTag[] = []
  for (const uni of UNIVERSITY_TAGS) {
    if (normalize(uni.key).includes(q) || normalize(uni.label ?? "").includes(q)) {
      byKey.push(uni)
    } else if (uni.aliases?.some((a) => normalize(a).includes(q))) {
      byAlias.push(uni)
    } else if (
      normalize(uni.fullName).includes(q) ||
      (uni.country && normalize(PAIS_NOMBRE[uni.country]).includes(q))
    ) {
      byName.push(uni)
    }
  }
  return [...byKey, ...byAlias, ...byName].slice(0, limit)
}

// --- Tag automática -------------------------------------------------------
//
// Quien escribe una institución que no está en el listado ("CERN", "ISFD 99")
// recibe una tag con la MISMA fórmula que las demás, y no un chip gris que la
// marca de entrada como de segunda. El color sale de un hash del texto
// normalizado: es estable (siempre el mismo tono para el mismo nombre, en
// cualquier pantalla y en cualquier sesión) y no hace falta guardar nada.
//
// Saturación y luminosidad van fijas para que el texto se lea a 9 px sobre el
// fondo al 20%, igual que el resto; lo único que varía es el tono.
function hashDe(texto: string): number {
  let h = 2166136261
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function hslAHex(h: number, s: number, l: number): string {
  const a = (s / 100) * Math.min(l / 100, 1 - l / 100)
  const canal = (n: number) => {
    const k = (n + h / 30) % 12
    const v = l / 100 - a * Math.max(-1, Math.min(k - 3, Math.min(9 - k, 1)))
    return Math.round(255 * v).toString(16).padStart(2, "0")
  }
  return `#${canal(0)}${canal(8)}${canal(4)}`.toUpperCase()
}

// Iniciales de un nombre largo: "Instituto Superior de Formación Docente" →
// "ISFD". Una tag de 9 px no aguanta una frase.
function abreviar(texto: string): string {
  if (texto.length <= 10) return texto
  const palabras = texto
    .split(/\s+/)
    .filter((w) => w.length > 2 || /^\d+$/.test(w))
  const iniciales = palabras.map((w) => (/^\d+$/.test(w) ? w : w[0].toUpperCase())).join("")
  return iniciales.length >= 2 ? iniciales.slice(0, 8) : texto.slice(0, 10)
}

export function tagGenerada(nombre: string): UniversityTag {
  const limpio = nombre.trim()
  return {
    key: limpio,
    label: abreviar(limpio),
    fullName: limpio,
    color: hslAHex(hashDe(normalize(limpio)) % 360, 62, 64),
    font: TAG_FONT,
    tagFontSize: TAG_FONT_SIZE,
  }
}

// La tag de cualquier valor guardado: la del listado si existe, la automática
// si no. Es la única puerta que usan los componentes.
export function tagDe(university: string): UniversityTag {
  return UNIVERSITY_TAG_BY_KEY[university] ?? tagGenerada(university)
}

// Lo que se escribe adentro de la tag.
export function etiquetaDe(tag: UniversityTag): string {
  return tag.label ?? tag.key
}

// Qué textos NO son una institución: teclazos, números sueltos, una letra. El
// ranking de universidades los esconde (`is_junk_university` del backend es su
// gemelo y tiene que decidir igual).
export function esUniversidadBasura(texto: string): boolean {
  const t = texto.trim()
  if (t.length < 2) return true
  const letras = t.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/g, "")
  if (letras.length < t.replace(/\s/g, "").length / 2) return true
  return letras.length >= 6 && !/[aeiouáéíóúAEIOUÁÉÍÓÚ]/.test(letras)
}
