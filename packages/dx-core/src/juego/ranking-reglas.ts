// Lo que el ranking necesita saber de las reglas del servidor para escribir sus
// carteles, y los tipos que comparten la web y la app.

import { ALL_SCOPE } from "./ranking-scope"
import type { Scope } from "./UseGameLeaderboard"

// Espejo de backend/game/boosts.py :: MIN_PLAYERS_RANKED. Acá solo se usa para
// escribir cuántos jugadores le faltan a una universidad; quién entra al ranking
// lo decide el server y viaja en `row.ranked`.
export const MIN_PLAYERS_RANKED = 10

// Espejo de backend/game/elo.py :: RAMP_UPDATES. Igual que arriba: acá solo se
// usa para escribir cuántas respuestas le faltan a una persona; quién tiene el
// Elo firme lo decide el server y viaja en `entry.elo_ranked`.
export const RAMP_UPDATES = 5

/** Por qué ordena el ranking, en las dos vistas.
 *
 *  Se dice "experiencia" y no "xp" porque es la palabra que se lee en la
 *  pantalla; el servidor usa la otra (UseGameLeaderboard.ts :: LeaderboardSort)
 *  y la traducción se hace en el único lugar donde los dos se tocan. */
export type RankingSort = "experiencia" | "elo"

// El scope sin acotar, con identidad estable. Es la clave de caché del catálogo
// de universidades y del resumen sin filtrar, así que tiene que ser SIEMPRE el
// mismo objeto o cada render pediría de nuevo.
export const SIN_SCOPE: Scope = { university: ALL_SCOPE, career: ALL_SCOPE }

// Filas que quedan por encima de la propia cuando la lista descansa. No es el
// centro: se mira hacia arriba, a quién falta pasar, más que hacia abajo.
export const ROWS_ABOVE = 4

/** El scroll que deja la fila `indice` a ROWS_ABOVE del techo, en una lista de
 *  filas del mismo alto (`paso` = fila + separación). */
export function scrollEnReposo({ indice, paso }: { indice: number; paso: number }): number {
  return Math.max(0, indice - ROWS_ABOVE) * paso
}
