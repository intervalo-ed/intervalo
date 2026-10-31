// Formatos y tipos del ranking que no dependen de cómo se dibuja: los usa la
// web y los usa la app nativa. Vivían repartidos entre leaderboard-chrome.tsx,
// boost-banner.tsx, cafecito-cta.tsx y event-feed.tsx.

import { ALL_SCOPE } from "./ranking-scope"

// Carreras en orden fijo + catch-all "Otra". Nombre completo, sin abreviar y
// sin emoji, tanto en el valor colapsado del filtro como en el desplegable.
export const CAREER_META: { key: string; name: string }[] = [
  { key: "S", name: "Ciencia" },
  { key: "T", name: "Tecnología" },
  { key: "E", name: "Ingeniería" },
  { key: "M", name: "Matemática" },
  { key: "Otra", name: "Otra" },
]

export const CAREER_NAME: Record<string, string> = Object.fromEntries(
  CAREER_META.map((c) => [c.key, c.name]),
)

/** Las opciones del selector de universidad, con la elegida SIEMPRE adentro.
 *
 *  Existe por un bug que costó dos intentos de arreglo. El <Select> de Base UI
 *  es controlado, y cuando el valor que se le pasa no figura entre sus
 *  <SelectItem> montados, no se queda quieto: revierte al valor inicial y avisa
 *  llamando a `onValueChange` con ÉL. O sea que el componente le contesta al
 *  padre "elegiste Todas" sin que nadie haya elegido nada.
 *
 *  Y la lista se vaciaba sola: sale de `summary.data.universities`, y el resumen
 *  se pide con el scope adentro de la clave de caché, así que elegir una
 *  universidad estrena clave, deja `data` en undefined por un commit y borra
 *  todas las opciones menos "Todas". El resultado, desde el asiento de la
 *  persona: la primera vez que filtrás no pasa nada, y la segunda —con el
 *  resumen ya cacheado— funciona.
 *
 *  La causa se saca en cada pantalla pidiendo el catálogo sin scope (el backend
 *  lo devuelve igual para todos: «esas van siempre sin scope», dice su
 *  docstring). Esto es la red de abajo: mientras la elegida esté montada, no hay
 *  revert posible, venga la lista vacía por donde venga. */
export function opcionesDeUniversidad(universities: string[], elegida: string): string[] {
  const fuera = elegida !== ALL_SCOPE && !universities.includes(elegida)
  return fuera ? [elegida, ...universities] : universities
}

export const fmtCount = (n: number) => n.toLocaleString("es")

// Las vistas del ranking. "recruits" es opt-in (`withRecruits`) porque no toda
// pantalla que monta esto tiene reclutas que mostrar: la eligen los dos rankings
// —el del minijuego y el de Intervalo clásico—, no la vista pública.
export type RankingView = "individual" | "university" | "countries" | "recruits"

/** Un empuje vigente, ya agregado por universidad. `university` nulo = global.
 *
 *  Estructural y no un `components["schemas"][...]`: los dos productos mandan
 *  este mismo objeto por dos endpoints distintos (GameBoostOut y BoostTramo),
 *  que son la misma proyección de `game.boosts.BoostView`. Atarlo a uno de los
 *  dos nombres haría que el otro tenga que convertir para nada. */
export type EmpujeVigente = {
  university?: string | null
  multiplier: number
  cafecitos: number
  donor_name?: string | null
  expires_in_seconds: number
  /** Parte del multiplicador la puso el aforo del día y no una donación
   *  (backend game/aforo.py). `cafecitos` cuenta SOLO los donados, así que un
   *  empuje de aforo puro llega con cafecitos=0 y esta bandera en true. */
  aforo?: boolean
}

/** Qué dice el globito del chip. Son tres casos y no dos, desde que el empuje
 *  puede venir del aforo del día: solo donaciones, solo aforo, o las dos
 *  sumadas. Decir "0 cafecito(s)" en el caso del medio sería peor que no decir
 *  nada, porque el multiplicador está ahí a la vista. */
export function tituloDe(boost: EmpujeVigente): string {
  const invitados = boost.cafecitos > 0
    ? boost.donor_name
      ? `${boost.donor_name} invitó ${boost.cafecitos} cafecito(s)`
      : `${boost.cafecitos} cafecito(s)`
    : null
  // Sin el número: el umbral vive en el backend (aforo.UMBRAL_PERSONAS) y
  // espejarlo acá es la misma trampa en la que ya cayeron las constantes del
  // cafecito. El feed sí lo dice, porque lo escribe el server con el conteo real.
  const porAforo = boost.aforo ? "las personas que entraron hoy" : null
  return [invitados, porAforo].filter(Boolean).join(" + ") || "Empuje vigente"
}

// Un solo formato, siempre HH:MM:SS ("23:40:12", "00:18:24").
//
// Antes eran dos regímenes: "23h 40m" arriba de la hora y "18:24" abajo. Se
// unificó porque el cambio de formato a mitad de la cuenta es lo que hace dudar
// del número — el cartel pasaba de una etiqueta a un reloj sin avisar, y el
// mismo empuje se leía de dos maneras según cuándo lo mirabas. Con un solo
// formato el ancho tampoco salta, así que los cuatro chips quedan alineados en
// una vertical de punta a punta de la cuenta.
//
// Y el segundero corre siempre. La objeción vieja era que "un segundero cuando
// faltan veinte horas promete una urgencia que no existe": es cierto que no hay
// urgencia, pero un reloj que no se mueve no se lee como calma sino como algo
// que se colgó.
export function fmtRemaining(seconds: number): string {
  const s = Math.max(0, seconds)
  const dosDigitos = (n: number) => String(n).padStart(2, "0")
  return [
    dosDigitos(Math.floor(s / 3600)),
    dosDigitos(Math.floor((s % 3600) / 60)),
    dosDigitos(s % 60),
  ].join(":")
}

/** Lo que queda, en palabras: `{ texto: "23 horas", enHoras: true }`.
 *
 * Vive al lado de `fmtRemaining` porque las dos tienen que decir lo MISMO. El
 * copy del cafecito y el de Practicar tenían cada uno su versión, las dos con
 * `Math.round`: con hora y media restante decían "2 horas" mientras el chip del
 * ranking, en la misma pantalla del producto, decía "1h 30m". Redondear para
 * arriba promete tiempo que no hay, así que las tres truncan.
 *
 * Devuelve las piezas y no la frase armada porque el artículo cambia con la
 * unidad ("las próximas 23 horas" contra "los próximos 40 minutos"), y eso lo
 * resuelve mejor cada copy que un parámetro más acá. */
export function restanteEnPalabras(seconds: number): {
  texto: string
  enHoras: boolean
} {
  const s = Math.max(0, seconds)
  if (s >= 3600) {
    const h = Math.max(1, Math.floor(s / 3600))
    return { texto: `${h} ${h === 1 ? "hora" : "horas"}`, enHoras: true }
  }
  const m = Math.max(1, Math.floor(s / 60))
  return { texto: `${m} ${m === 1 ? "minuto" : "minutos"}`, enHoras: false }
}

// El multiplicador siempre con la coma decimal de acá y una sola cifra: es el
// mismo formato en el slider, en el cartel del ranking y en el marcador de la
// card, así que vive en un solo lugar.
export const fmtMultiplier = (m: number) => `×${m.toFixed(1).replace(".", ",")}`

/** «recién» / «12 min» / «3 h» / «2 d». Lo usa también el chat, que muestra la
 *  misma clase de renglón. */
export function fmtAgo(seconds: number): string {
  if (seconds < 60) return "recién"
  const min = Math.floor(seconds / 60)
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h} h`
  return `${Math.floor(h / 24)} d`
}
