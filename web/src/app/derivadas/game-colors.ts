// El color del @ de un jugador.
//
// Vive suelto y no adentro de `game-ranking.tsx` porque lo usan tres pantallas
// —el ranking, las novedades y la lista de reclutas— y la tercera la importa el
// propio ranking: teniéndolo allá, el ciclo de imports se cerraba.

import { BELT_ORDER, BELT_UNIT_TEXT_COLORS } from "@/lib/catalog"

// El juego no tiene cinturones: el color del nombre lo da el nivel que el Elo le
// reconoce al jugador (backend/game/elo.py :: level_of), o sea qué tan difícil
// resuelve — no cuánta XP juntó, que ya está en el número de al lado.
export function levelColor(level: number): string {
  const belt = BELT_ORDER[Math.min(level, BELT_ORDER.length - 1)]
  return BELT_UNIT_TEXT_COLORS[belt] ?? BELT_UNIT_TEXT_COLORS.white
}
