// Las tres cajas de «universidades cercanas» del cartel del cafecito: la propia,
// la de arriba y la de abajo en el ranking por experiencia.
//
// Sin React a propósito, para que `check:cafecito` pueda probarlo: es una regla
// de elección y se equivocó una vez en producción de un modo que se ve a ojo
// pero no se prueba jugando (ver `universidadDeRelleno`).

export type FilaUniversidad = { university: string; players: number; xp: number }

// Universidades de relleno, en el orden en que se prueban. Nunca es la propia ni
// una que ya esté en pantalla —se filtra antes de usarla—.
const UNIVERSIDADES_DE_RELLENO = ["UBA", "UTN", "UNC", "UNLP", "UCA", "UNSAM"] as const

/** Una universidad inventada, para cuando la propia está primera o última y de
 *  ese lado no hay vecina real.
 *
 *  `yaUsadas` tiene que traer **todas las universidades reales del ranking**, y
 *  no solo las de las cajas: con la propia primera, el relleno de arriba elegía
 *  «UBA» aunque UBA fuera justo la vecina real de abajo, y el cartel mostraba la
 *  misma sigla dos veces con números distintos. El relleno es plausible, no
 *  verdadero, y por eso no puede coincidir con nada que sí lo sea. */
export function universidadDeRelleno({
  yaUsadas,
  players,
  xp,
}: {
  yaUsadas: readonly string[]
  players: number
  xp: number
}): FilaUniversidad {
  const nombre = UNIVERSIDADES_DE_RELLENO.find((u) => !yaUsadas.includes(u)) ?? "Otra"
  // Con `xp` y no en cero: la caja inventada se lee igual que las de verdad, y
  // un cero ahí parecería un dato —«esta universidad no sumó nada»— en vez de
  // un relleno. Se deriva de la propia, como ya se hacía con las personas.
  return { university: nombre, players, xp: Math.max(1, Math.round(xp)) }
}

/** Las tres cajas. `filas` ya viene ordenado por experiencia (`porExperiencia`);
 *  el índice de la propia es el que decide quién es vecina.
 *
 *  Si de un lado no hay vecina real —la propia está primera, última, o todavía
 *  no juntó XP— se inventa una de relleno que no repite ninguna sigla del
 *  ranking ni de la otra caja. */
export function vecinasDe<T extends FilaUniversidad>({
  filas,
  university,
}: {
  filas: readonly T[]
  university: string
}): { arriba: FilaUniversidad; propia: FilaUniversidad; abajo: FilaUniversidad } {
  const indice = filas.findIndex((f) => f.university === university)
  const propia: FilaUniversidad =
    indice >= 0 ? filas[indice] : { university, players: 1, xp: 0 }
  const delRanking = filas.map((f) => f.university)

  const arriba =
    indice > 0
      ? filas[indice - 1]
      : universidadDeRelleno({
          yaUsadas: [propia.university, ...delRanking],
          players: propia.players + 15,
          xp: propia.xp * 1.4,
        })
  const abajo =
    indice >= 0 && indice < filas.length - 1
      ? filas[indice + 1]
      : universidadDeRelleno({
          yaUsadas: [propia.university, arriba.university, ...delRanking],
          players: Math.max(1, propia.players - 8),
          xp: propia.xp * 0.6,
        })
  return { arriba, propia, abajo }
}
