// Los @ que se muestran en los renglones de ejemplo de la lista de reclutas.
//
// Fuera del .tsx —igual que `salto-ranking.ts` o `xp-pasos.ts`— para que el
// chequeo los pueda importar sin arrastrar React.
//
// **De dónde salen.** De mirar los 337 @ que la gente eligió de verdad en
// producción, que se agrupan casi enteros en tres registros:
//
//   · el que admite que no sabe   (`noentiendonada`, `burrofull`, `insanopro`)
//   · el nerd de la materia       (`fenolftaleina`, `newtonico`, `fourier16`)
//   · el absurdo rioplatense      (`gatitosensual`, `chuchubanana`, `salchipapa`)
//
// Los de ejemplo eran `cociente3196`, `tangente4626`, `escalar5925`: palabra de
// matemática más cuatro dígitos, que es el formato que el generador de invitados
// ABANDONÓ y por los dos motivos que su docstring explica (game/aliases.py) —el
// número delata que el nombre no lo eligió nadie, y la palabra viene del temario—.
// O sea que la lista prometía reclutas con el @ que hoy no le toca a nadie.
//
// **Son inventados, y eso es a propósito.** Los reales son más graciosos, pero
// un @ tomado puesto acá es una persona que abre "¿Reclutás?" y se ve a sí misma
// como recluta de otro, con una XP que no es suya y —porque las filas se pintan
// con la universidad de quien mira— con la universidad cambiada. Ninguno de
// estos veinte estaba tomado cuando se escribieron.
//
// Reglas al agregar uno (el chequeo las verifica):
//   · solo [a-z0-9._], como `usernames._VALID_RE`;
//   · hasta 15 caracteres, que es el tope del generador y lo que entra en la
//     fila sin empujar la sigla de la universidad;
//   · que NO pueda salir del generador (`modificador + sustantivo` de
//     game/aliases.py), o el ejemplo se lee como un invitado sin nombre propio;
//   · nada ofensivo: aparece al lado del nombre de todos los demás.
export const POOL_DE_EJEMPLO = [
  // El que admite que no sabe.
  "entiendocero",
  "casiapruebo",
  "burropro",
  "vinealcoloquio",
  "estudieenbondi",
  "chantapro",
  "mepierdoenla3",
  // El nerd de la materia.
  "lhopitalico",
  "epsilondelta",
  "tangentito",
  "derivoyvuelvo",
  "taylorcito",
  "tiendeainfinito",
  // El absurdo rioplatense.
  "flanconpatas",
  "panchoconpure",
  "gatoinfinito",
  "chuchumandarina",
  "salchiderivada",
  "bondiolacosmica",
  "perroconflan",
] as const

/** Hasta dónde puede llegar un @. El mismo tope que el generador de invitados
 *  (game/aliases.py :: _MAX_LEN): más que esto y la fila empuja la sigla de la
 *  universidad contra el número verde. */
export const LARGO_MAXIMO = 15

/** Los caracteres que un @ puede tener. Espejo de `usernames._VALID_RE` del
 *  backend: lo que no pasa por ahí no puede ser el @ de nadie, así que tampoco
 *  tiene sentido como ejemplo de uno. */
export const CARACTERES_VALIDOS = /^[a-z0-9._]+$/

/** `cuantos` @ del pool, sin repetir.
 *
 * Sorteados y no fijos: con tres nombres clavados, quien abre la diapo dos veces
 * ve la misma lista y deja de leerse como "así se va a ver la tuya" para
 * leerse como un dibujo. Veinte nombres y tres renglones dan 1140 combinaciones,
 * o sea que la repetición no se nota.
 *
 * El sorteo se inyecta para que el chequeo pueda ser determinístico; en la app
 * es `Math.random`. Quien lo llama tiene que hacerlo UNA vez por montaje (ver
 * `useFilasDeEjemplo`): llamarlo en cada render cambiaría los nombres mientras
 * la lista está a la vista.
 */
export function sortearAliasDeEjemplo(
  cuantos: number,
  aleatorio: () => number = Math.random,
): string[] {
  const restantes: string[] = [...POOL_DE_EJEMPLO]
  const elegidos: string[] = []
  const tope = Math.max(0, Math.min(cuantos, restantes.length))
  for (let i = 0; i < tope; i++) {
    // Acotado además del módulo: con un `aleatorio` inyectado que devuelva 1
    // exacto, el índice se iría de rango y saldría `undefined` en la fila.
    const j = Math.min(restantes.length - 1, Math.floor(aleatorio() * restantes.length))
    elegidos.push(restantes[j])
    restantes.splice(j, 1)
  }
  return elegidos
}
