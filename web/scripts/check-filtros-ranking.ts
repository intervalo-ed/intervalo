// Chequeo del filtro de universidad de los dos rankings.
//
// Corre con: bun run check:filtros
//
// Existe por un bug que costó dos intentos de arreglo y que la persona reportó
// así: «si quiero filtrar una universidad, la primera vez que la filtro el
// filtro no hace nada, y la segunda vez ahí efectivamente funciona».
//
// La causa: el <Select> de Base UI es controlado, y cuando el valor que se le
// pasa NO figura entre sus <SelectItem> montados, no se queda quieto — revierte
// al valor inicial y avisa llamando a `onValueChange` con él. O sea que le
// contesta al padre «elegiste Todas» sin que nadie haya elegido nada. Y la
// lista se vaciaba sola porque salía de un resumen cacheado POR SCOPE: elegir
// una universidad estrena clave de caché, deja `data` en undefined por un
// commit y borra todas las opciones menos «Todas». La segunda vez funcionaba
// porque el resumen del scope nuevo ya estaba cacheado.
//
// Lo que se fija acá es la INVARIANTE que hace que el revert sea imposible:
// el valor que se le pasa al <Select> tiene que estar siempre entre las
// opciones que se dibujan. Es aritmética de listas, así que se comprueba sin
// navegador — que es justo lo que faltaba: este bug sobrevivió a un arreglo
// porque no había nada que lo mirara.

import { ALL_SCOPE, opcionesDeUniversidad } from "../src/components/leaderboard-chrome"

let fallos = 0
function check(ok: boolean, label: string) {
  console.log(`  [${ok ? "ok" : "FAIL"}] ${label}`)
  if (!ok) fallos++
}

const LISTA = ["UBA", "UNC", "UNLP", "UTN"]

console.log("1. La elegida está siempre entre las opciones")

// El caso del bug: la lista llegó vacía (el resumen todavía viaja) y hay una
// universidad elegida. Antes se dibujaba solo «Todas» y Base UI revertía.
for (const [nombre, lista] of [
  ["la lista completa", LISTA],
  ["la lista vacía —el resumen todavía viaja—", []],
  ["una lista que no la contiene", ["UNS", "UNR"]],
] as [string, string[]][]) {
  for (const elegida of LISTA) {
    const opts = opcionesDeUniversidad(lista, elegida)
    check(
      opts.includes(elegida),
      `con ${nombre}, «${elegida}» sigue estando entre las opciones`,
    )
  }
}

console.log("2. No inventa una opción cuando no hace falta")

check(
  opcionesDeUniversidad(LISTA, ALL_SCOPE).join(",") === LISTA.join(","),
  "con «Todas» elegida la lista queda igual: «Todas» es su propio <SelectItem>",
)
check(
  opcionesDeUniversidad(LISTA, "UBA").join(",") === LISTA.join(","),
  "si ya estaba, no se duplica ni se reordena",
)
check(
  opcionesDeUniversidad([], ALL_SCOPE).length === 0,
  "lista vacía y sin filtro: no hay nada que agregar",
)

console.log("3. La agregada va primero y una sola vez")

const conFaltante = opcionesDeUniversidad(LISTA, "UNSAM")
check(conFaltante[0] === "UNSAM", `la que falta entra al principio (dio ${conFaltante[0]})`)
check(
  conFaltante.length === LISTA.length + 1 &&
    new Set(conFaltante).size === conFaltante.length,
  "y entra exactamente una vez",
)

console.log("4. Idempotente")

// Dos renders seguidos con el mismo valor tienen que dar la misma lista, o el
// desplegable reordenaría solo mientras está abierto.
const a = opcionesDeUniversidad(LISTA, "UNSAM")
const b = opcionesDeUniversidad(a, "UNSAM")
check(a.join(",") === b.join(","), "aplicarla dos veces da lo mismo")

console.log(fallos === 0 ? "\ntodo ok" : `\n${fallos} fallos`)
process.exit(fallos === 0 ? 0 : 1)
