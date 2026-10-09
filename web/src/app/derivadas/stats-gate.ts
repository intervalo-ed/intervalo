// Cuándo el juego empieza a ofrecer las estadísticas personales (tecla `j` en
// escritorio, botón de la cabecera en el teléfono).
//
// Suelto y sin nada de React, mismo criterio que reclutas-trigger.ts: es una
// sola cuenta sobre un campo que ya viaja en el jugador, y equivocarse acá no
// se nota jugando — se nota semanas después, cuando alguien pregunta por qué
// el atajo no le aparece.

import type { GamePlayer } from "./UseGamePlayer"

// A partir de cuántas derivadas RESUELTAS se desbloquea el panel. Fue 10 (el
// momento en que el juego empieza a hablarte de otra cosa) hasta el 09/10,
// cuando el panel llegó al teléfono y bajó a 3: es la vara de la activación
// («3 resueltas en la primera tanda»), así que quien activó ya tiene el botón,
// y con tres derivadas las tiles ya dicen algo. Tiene que ser el MISMO valor
// que game/stats.py :: UMBRAL_ESTADISTICAS: el server repite este gate (no
// confía en que el cliente lo haya respetado), así que un número distinto
// acá solo lograría un botón que aparece y después responde 403.
//
// La campana del Elo sigue contando solo a los de 10 o más
// (game/stats.py :: UMBRAL_CALIFICADO): ver el panel y entrar en la campana
// son dos cosas distintas.
export const UMBRAL_ESTADISTICAS = 3

/** ¿Ya se le puede ofrecer el panel a este jugador? */
export function puedeVerEstadisticas(player: GamePlayer | null): boolean {
  return (player?.exercises_correct ?? 0) >= UMBRAL_ESTADISTICAS
}
