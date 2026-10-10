import type { components } from "@/lib/api/schema"
import { PAIS_NOMBRE, tagDe, type Pais } from "@/lib/university-tags"

type FilaUniversidad = components["schemas"]["GameUniversityRow"]

// Una fila del ranking de países. Tiene la forma de `GameUniversityRow` a
// propósito: así las celdas de experiencia y de Elo de las universidades sirven
// tal cual, y el país es "una universidad más grande". `university` lleva el
// nombre del país y `pais` su clave, para dibujar la bandera.
export type FilaPais = FilaUniversidad & { pais: Pais }

type Acumulado = {
  xp: number
  players: number
  rated: number
  suma: number
  careers: Record<string, number>
}

// Suma las universidades por país. No hay endpoint propio: el de universidades
// ya trae, por cada una, la experiencia, los jugadores y el Elo promedio, y el
// país de una universidad sale del catálogo del front (`tagDe`).
//
// Las universidades sin país —las que alguien escribió a mano, como "CERN"— no
// entran: no hay a qué bandera sumarlas, y inventarles un país sería peor que
// dejarlas afuera de esta vista (siguen en la de universidades).
//
// El Elo del país es el promedio ponderado por los jugadores que ya salieron de
// la rampa, o sea el promedio de TODOS ellos y no el de los promedios: una
// universidad de seis no pesa lo mismo que una de doscientos. El piso de
// jugadores para que cuente es el mismo que el de una universidad.
export function agruparPorPais(
  filas: readonly FilaUniversidad[],
  minimoParaElo: number,
): FilaPais[] {
  const porPais = new Map<Pais, Acumulado>()
  for (const fila of filas) {
    const pais = tagDe(fila.university).country
    if (!pais) continue
    const acc = porPais.get(pais) ?? { xp: 0, players: 0, rated: 0, suma: 0, careers: {} }
    acc.xp += fila.xp
    acc.players += fila.players
    acc.rated += fila.rated_players
    acc.suma += fila.rating_avg * fila.rated_players
    for (const [carrera, n] of Object.entries(fila.careers)) {
      acc.careers[carrera] = (acc.careers[carrera] ?? 0) + n
    }
    porPais.set(pais, acc)
  }
  return [...porPais.entries()]
    .map(([pais, acc]): FilaPais => ({
      pais,
      university: PAIS_NOMBRE[pais],
      xp: acc.xp,
      players: acc.players,
      rated_players: acc.rated,
      rating_avg: acc.rated > 0 ? Math.round(acc.suma / acc.rated) : 0,
      ranked: acc.rated >= minimoParaElo,
      careers: acc.careers,
    }))
    .sort(
      (a, b) =>
        Number(b.ranked) - Number(a.ranked) ||
        b.rating_avg - a.rating_avg ||
        b.rated_players - a.rated_players,
    )
}
