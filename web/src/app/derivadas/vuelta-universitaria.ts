// Cada cuántas derivadas bien resueltas la XP se cuenta sobre la universidad en
// vez de sobre la tarjeta propia.
//
// Sin React a propósito, igual que reclutas-trigger.ts y instalacion-trigger.ts:
// es una regla aritmética y así se puede comprobar sin navegador (ver
// web/scripts/check-ranking-universitario.ts).
//
// Lo que cambia es DÓNDE se dibuja el conteo, no adónde va la XP: la persona
// suma exactamente lo mismo en su puesto individual. El total de una universidad
// ES la suma de la XP de sus jugadores (game/router.py :: game_university_leaderboard),
// así que la XP que se ve aterrizar en la universidad es literalmente la propia
// subiendo por el otro lado — no hay dos contabilidades ni nada que migrar.
//
// Por qué existe: el ranking universitario es el motor de retención de largo
// plazo (context/gamification.md), y hasta ahora había que ir a buscarlo a un
// selector. Una de cada tres veces, el festejo lo trae al frente solo.

/** Cada cuántas correctas cae la vuelta universitaria.
 *
 *  Tres y no cinco ni diez: tiene que ser lo bastante seguido como para que se
 *  lea como parte del ritmo y no como una interrupción rara. Dos de cada tres
 *  festejos siguen siendo sobre la tarjeta propia, que es el que la persona
 *  vino a buscar. */
export const VUELTA_UNIVERSITARIA_CADA = 3

/** Si el acierto número `correctasTotales` se cuenta sobre la universidad.
 *
 *  El número es `game_players.exercises_correct` DESPUÉS de este acierto, que
 *  viene en la respuesta de `/answer` (`GameAnswerResponse.exercises_correct`).
 *  Cumulativo y del servidor a propósito: un contador por pestaña se reinicia al
 *  recargar y la persona vería dos vueltas universitarias seguidas, o ninguna en
 *  veinte derivadas (ver el comentario largo de hitos-del-juego.ts).
 *
 *  Se cuentan solo las CORRECTAS: «cada 3 derivadas resueltas» son tres
 *  resueltas. Una errada no mueve el contador — y además no tendría XP que
 *  contar, así que la vuelta caería sobre un festejo que no existe.
 *
 *  `universidad` no es un extra: sin ella la vuelta no tiene sentido y se ve
 *  rota. El ranking universitario no tendría fila propia, así que el número no
 *  treparía en ningún lado y los orbes se apagarían a mitad de camino por falta
 *  de destino. Y no es un caso raro: el juego pide la universidad en la derivada
 *  3 (hitos-del-juego.ts :: HITO_PERFIL), o sea EXACTAMENTE en la primera vuelta
 *  universitaria — la primera de todas caía siempre sobre una lista en la que la
 *  persona todavía no estaba. Sin universidad se festeja sobre la tarjeta
 *  propia, como siempre, y la primera vuelta llega en la 6. */
export function esVueltaUniversitaria(
  correctasTotales: number,
  universidad: string | null,
): boolean {
  return (
    universidad !== null &&
    correctasTotales > 0 &&
    correctasTotales % VUELTA_UNIVERSITARIA_CADA === 0
  )
}
