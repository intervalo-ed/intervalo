// Colores compartidos del juego: el del @ de un jugador, y el formato de "esto
// tiene un empuje de café corriendo".
//
// Viven sueltos y no adentro de `game-ranking.tsx` porque los usa más de una
// pantalla —el ranking, las novedades, la lista de reclutas y la diapo del
// café— y alguna de esas el propio ranking la importa: teniéndolos allá, el
// ciclo de imports se cerraba.

import { BELT_HEX, BELT_ORDER, BELT_UNIT_TEXT_COLORS } from "../catalog"

// El juego no tiene cinturones: el color del nombre lo da el nivel que el Elo le
// reconoce al jugador (backend/game/elo.py :: level_of), o sea qué tan difícil
// resuelve — no cuánta XP juntó, que ya está en el número de al lado.
export function levelColor(level: number): string {
  const belt = BELT_ORDER[Math.min(level, BELT_ORDER.length - 1)]
  return BELT_UNIT_TEXT_COLORS[belt] ?? BELT_UNIT_TEXT_COLORS.white
}

// El ámbar del cafecito, el mismo que pinta las filas con empuje y la diapo de
// la pausa: en el juego, marrón = cafecito, en todos lados.
export const AMBAR = BELT_HEX.brown.onDark

// La rampa completa del café, en RGB: apagado → ámbar (el mismo `AMBAR` de
// arriba, es su punto medio) → dorado. Vivía duplicada dentro de
// `cafecito-panel.tsx` (la barra del slider); se saca para acá porque ahora
// también la usa `xp-pasos.ts` para las bolitas de XP cuando la universidad
// tiene un empuje corriendo — mismo tono en los dos lados, una sola fuente.
//
// Se calcula en RGB y no con `color-mix` porque motion no sabe interpolar un
// `color-mix(...)`: lo trataría como texto y el color saltaría de un paso al
// otro en vez de correrse.
const CAFE_AMBAR_RGB = [0xa8, 0x70, 0x3c] as const
const CAFE_APAGADO_RGB = [0x6b, 0x4a, 0x28] as const
const CAFE_DORADO_RGB = [0xea, 0xbb, 0x74] as const

export function mezclarRGB(a: readonly number[], b: readonly number[], t: number): string {
  return `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(", ")})`
}

/** Un punto de la rampa de café, de 0 (apagado) a 1 (dorado), pasando por el
 *  ámbar de marca a la mitad. */
export function colorDeCafe(t: number): string {
  return t < 0.5
    ? mezclarRGB(CAFE_APAGADO_RGB, CAFE_AMBAR_RGB, t * 2)
    : mezclarRGB(CAFE_AMBAR_RGB, CAFE_DORADO_RGB, (t - 0.5) * 2)
}

export { CAFE_AMBAR_RGB, CAFE_APAGADO_RGB, CAFE_DORADO_RGB }

// Espejo de backend/game/boosts.py. El empuje más flojo que existe es ×1,1 —un
// solo cafecito— y el techo es ×3, al que solo se llega entre varios. Esos dos
// números son los extremos de la escala de brillo del chip.
const BOOST_MIN_MULTIPLIER = 1.1
const BOOST_MAX_MULTIPLIER = 3.0

/** 0 para el empuje más flojo, 1 para el techo. Es lo que hace que un ×3 se vea
 *  de lejos y un ×1,1 apenas se insinúe: la fuerza del café se lee sin leer el
 *  número. */
export function boostStrength(multiplier: number): number {
  const t = (multiplier - BOOST_MIN_MULTIPLIER) / (BOOST_MAX_MULTIPLIER - BOOST_MIN_MULTIPLIER)
  return Math.min(1, Math.max(0, t))
}

/** Las intensidades del chip de un empuje, en porcentaje de ámbar. Las aplica
 *  cada plataforma a su manera (la web con `color-mix`, la app en RGB).
 *
 *  El BRILLO lo decide el multiplicador, no de quién es: un ×3 se ve de lejos y
 *  un ×1,1 apenas se insinúa. El halo solo aparece de verdad en la mitad de
 *  arriba de la escala: a fuerza baja queda en nada. */
export function intensidadDelChip(multiplier: number): {
  fondo: number
  texto: number
  borde: number
  haloRadio: number
  haloOpacidad: number
} {
  const f = boostStrength(multiplier)
  return {
    fondo: 10 + 12 * f,
    texto: 68 + 22 * f,
    borde: 45 + 35 * f,
    haloRadio: 6 + 10 * f,
    haloOpacidad: 13 * f,
  }
}

// Para el chip propio, aclarado hasta que se lee como oro sobre el fondo.
export const ORO_CHIP_PCT = 55

// La fila (o caja) de alguien cuya universidad tiene un empuje corriendo. Era
// un ☕ al lado de la sigla —un ícono más en un renglón que ya tiene cinco
// cosas— y ahí no lo miraba nadie. Ahora se pinta la fila ENTERA: un ámbar de
// café con fondo y borde, más fuerte cuanto más alto el multiplicador.
//
// El objetivo es la envidia, no la información. Un ícono dice "esta persona
// tiene un empuje"; una fila que brilla entre diez apagadas dice "esta persona
// está subiendo más rápido que vos", que es lo que hace que alguien mire cuánto
// sale un cafecito. Por eso el color va en el fondo y no en el texto: se ve
// desde el rabillo del ojo, sin leer.
//
// La usan las filas del ranking (game-ranking.tsx) y, para previsualizar el
// que se está por comprar mientras se mueve el slider, la diapo del café
// (cafecito-panel.tsx) — mismo formato en los dos lados: lo que se ve ahí es
// lo que se va a ver acá si se compra.
/** La misma fila/caja, con la intensidad atada a la fuerza del multiplicador:
 *  un ×3 se ve más encendido que un ×1,1.
 *
 *  El recorrido es CORTO a propósito: el relleno se mueve 5 puntos de punta a
 *  punta (7→12%). Son hasta veinte filas a la vez y no un solo chip, así que
 *  lo que en un lugar es una escala legible acá sería una pared. Y los valores
 *  se mueven ALREDEDOR de los que ya estaban afinados a ojo —9% de relleno,
 *  68% de borde—, no desde cero. */
export function filaConEmpuje(multiplier: number): React.CSSProperties {
  const f = boostStrength(multiplier)
  return {
    backgroundColor: `color-mix(in oklab, ${AMBAR} ${7 + 5 * f}%, transparent)`,
    "--tw-ring-color": `color-mix(in oklab, ${AMBAR} ${60 + 18 * f}%, transparent)`,
  } as React.CSSProperties
}

/** El tema del juego en hex, para donde no hay variables CSS (la app nativa).
 *  Es copia de `web/src/app/globals.css` (`:root, .dark`): el juego tiene un
 *  solo tema, oscuro. */
export const TEMA = {
  background: "#131324",
  foreground: "#f6f8fc",
  card: "#1a1a2a",
  primary: "#5457e5",
  mutedForeground: "#a4b3c6",
  accent: "#38385a",
  border: "#38385a",
  ring: "#7e80f7",
} as const
