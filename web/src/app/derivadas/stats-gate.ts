// Cuándo el juego empieza a ofrecer las estadísticas personales (tecla `j`).
//
// Suelto y sin nada de React, mismo criterio que reclutas-trigger.ts: es una
// sola cuenta sobre un campo que ya viaja en el jugador, y equivocarse acá no
// se nota jugando — se nota semanas después, cuando alguien pregunta por qué
// el atajo no le aparece.

import type { GamePlayer } from "./UseGamePlayer"

// A partir de cuántas derivadas RESUELTAS se desbloquea el panel. Mismo
// número que RECLUTAS_RESTO (reclutas-trigger.ts): "a las diez derivadas" es
// el momento en que el juego empieza a hablarte de otra cosa. Es una
// constante PROPIA y no un import cruzado porque allá 10 es el resto de un
// contador periódico (10, 30, 50…) y acá es un piso de una sola vez ("a
// partir de") — comparten el número, no el mecanismo. Tiene que ser el MISMO
// valor que game/stats.py :: UMBRAL_ESTADISTICAS: el server repite este gate
// (no confía en que el cliente lo haya respetado), así que un número
// distinto acá solo lograría un atajo que aparece y después responde 403.
export const UMBRAL_ESTADISTICAS = 10

/** ¿Ya se le puede ofrecer el panel a este jugador? */
export function puedeVerEstadisticas(player: GamePlayer | null): boolean {
  return (player?.exercises_correct ?? 0) >= UMBRAL_ESTADISTICAS
}
