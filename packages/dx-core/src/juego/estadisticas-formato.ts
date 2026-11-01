// Las cuentas del panel de estadísticas que no dependen de cómo se dibuja: los
// colores del acierto, el formato de los segundos, qué dice el cartel de cada
// celda y la escala del histograma del Elo. Las usa la web (elo-stats-panel.tsx,
// derivatives-table.tsx, components/metric-card.tsx) y la app nativa.

import type { GameStats } from "./UseGameStats"

type Bucket = GameStats["histogram"][number]

// Color para un porcentaje de acierto: rojo (0%) → amarillo (50%) → verde maduro
// (100%). Interpola en RGB por tramos.
export function accuracyColor(pct: number): string {
  const p = Math.max(0, Math.min(100, pct)) / 100
  const red = [229, 72, 77] // #E5484D
  const yellow = [230, 184, 0] // #E6B800
  const green = [31, 158, 87] // #1F9E57
  const [from, to, t] =
    p < 0.5 ? [red, yellow, p / 0.5] : [yellow, green, (p - 0.5) / 0.5]
  const ch = (i: number) => Math.round(from[i] + (to[i] - from[i]) * t)
  return `rgb(${ch(0)}, ${ch(1)}, ${ch(2)})`
}

// Segundos con un decimal, mismo criterio que el panel interno
// (metrics/game_queries.py divide por 1000 antes de mostrar "seg").
export function fmtSegundos(ms: number): string {
  return `${(ms / 1000).toFixed(1)}s`
}

/** El cuerpo del cartel de una celda de la tabla enriquecida, con o sin dato —
 *  un solo lugar que decide el texto, para que velocidad y efectividad no
 *  puedan desalinearse entre sí (las dos salen de la MISMA ventana de intentos,
 *  ver game/stats.py :: _personal_accuracy). */
export function motivoDeLaCelda({
  noExiste,
  sample,
  hayDato,
  quien,
}: {
  noExiste: boolean
  sample: number
  hayDato: boolean
  quien: string
}): string {
  if (noExiste) return "El juego todavía no pide esta derivada."
  if (!hayDato) {
    return sample > 0
      ? `Resolviste ${sample} de este tipo, todavía poco para calcular un dato.`
      : "Todavía no la intentaste."
  }
  return `${quien} de tus últimos ${sample} intentos limpios de este tipo (como mucho, los últimos 10).`
}

// Alto del área de barras, en px. Fijo y no estirable: un histograma que crece
// con lo que sobre de la columna se ve distinto según cuántos jugadores haya en
// la base, y la forma de la campana no tiene por qué depender de eso.
export const HIST_ALTO = 116

// Las alturas (en %) del esqueleto de barras mientras `/stats` viaja.
export const HIST_ESQUELETO = [25, 40, 55, 75, 90, 100, 95, 80, 65, 50, 35, 25, 40, 30, 20, 15]

/** El bucket más poblado (al menos 1, para no dividir por cero). */
export function maxCount(histogram: Bucket[]): number {
  return Math.max(1, ...histogram.map((bucket) => bucket.count))
}

/** Una etiqueta cada tantos buckets, más los dos extremos siempre — con 16
 *  buckets (game/stats.py :: N_BUCKETS) da unas 9. */
export function pasoEtiqueta(histogram: Bucket[]): number {
  return Math.max(1, Math.ceil(histogram.length / 9))
}

/** El alto de una barra en % del área. Piso de 6%: un bucket con un solo
 *  jugador entre otros de veinte no puede desaparecer del todo, o la barra
 *  dejaría de contar que hay alguien ahí. */
export function altoDeBarra({ count, max }: { count: number; max: number }): number {
  return Math.max(6, Math.round((count / max) * 100))
}

/** El cartel de una barra: el rango y cuántos hay adentro. */
export function rotuloDeBarra({
  bucket,
  fmt,
}: {
  bucket: Bucket
  fmt: (n: number) => string
}): string {
  return `${fmt(bucket.from_rating)}–${fmt(bucket.to_rating)}: ${bucket.count} jugador${bucket.count === 1 ? "" : "es"}`
}

/** La etiqueta del eje debajo del bucket `i`, o `null` si ese slot va vacío.
 *  Solo marcan los múltiplos de `paso` y los dos extremos; el último muestra
 *  el techo de su rango y no el piso. */
export function etiquetaDelEje({
  histogram,
  i,
  paso,
}: {
  histogram: Bucket[]
  i: number
  paso: number
}): { valor: number; alinear: "left" | "center" | "right" } | null {
  const esUltimo = i === histogram.length - 1
  if (!(i === 0 || esUltimo || i % paso === 0)) return null
  return {
    valor: esUltimo ? histogram[i].to_rating : histogram[i].from_rating,
    alinear: i === 0 ? "left" : esUltimo ? "right" : "center",
  }
}
