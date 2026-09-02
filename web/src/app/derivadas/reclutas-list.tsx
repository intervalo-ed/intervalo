"use client"

// La lista de reclutas del minijuego: el adaptador entre `GameRecruitEntry` y la
// tabla compartida (components/reclutas-list.tsx), que es la que dibuja.
//
// La tabla se mudó allá cuando Intervalo clásico estrenó su propia vista de
// reclutas: es la misma tabla en los dos productos, y lo único que cambia es de
// dónde sale el color del nombre. Acá sale del NIVEL que el Elo le reconoce al
// jugador (level_of en backend/game/elo.py), o sea qué tan difícil resuelve — no
// cuánta XP juntó, que ya está en el número de al lado.
//
// La usan dos pantallas: la vista "Reclutas" del ranking y la diapo `¿Reclutas?`
// en el teléfono, donde el ranking no está a la vista y la promesa no se vería
// si la lista no viajara con ella.

import {
  EJEMPLOS_COUNT,
  ListaDeReclutas as Tabla,
  filasDeEjemplo,
  type FilaRecluta,
} from "@/components/reclutas-list"
import { levelColor } from "./game-colors"
import type { GameRecruitEntry } from "./UseGameLeaderboard"

export { EJEMPLOS_COUNT, EJEMPLOS_XP_TOTAL } from "@/components/reclutas-list"

function aFila(entry: GameRecruitEntry): FilaRecluta {
  return {
    key: entry.player_id,
    rank: entry.rank,
    nombre: entry.alias,
    color: levelColor(entry.level),
    university: entry.university,
    career: entry.career,
    xp_given: entry.xp_given,
  }
}

export function ListaDeReclutas({
  entries,
  // La universidad de quien mira, para pintar los ejemplos con la SUYA en vez
  // de la mezcla de siempre. `null` mientras no la eligió.
  university = null,
  // Cuántos renglones de ejemplo mostrar mientras no hay reclutas.
  //
  // Cinco en el ranking, donde la lista ES el contenido y cinco llenan la caja.
  // Tres en la diapo, donde la lista viene detrás del copy y del botón: ahí lo
  // que tiene que hacer es mostrar la FORMA de lo que va a pasar, y para eso con
  // tres alcanza. Con cinco empuja al botón fuera de la pantalla de un teléfono.
  ejemplos = EJEMPLOS_COUNT,
  className,
}: {
  entries: GameRecruitEntry[]
  university?: string | null
  ejemplos?: number
  className?: string
}) {
  const vacia = entries.length === 0
  return (
    <Tabla
      filas={vacia ? filasDeEjemplo(university, ejemplos) : entries.map(aFila)}
      ejemplo={vacia}
      className={className}
    />
  )
}
