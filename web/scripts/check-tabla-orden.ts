// Chequeo del reordenamiento de la tabla de derivadas.
//
// Corre con: bun run check:tabla
//
// La tabla de escritorio sube arriba las filas que la derivada en curso
// necesita, y solo cuando no entra entera (ver `acomodar` en
// derivatives-table.tsx). Son seis líneas de `filter`, y las seis líneas de
// `filter` son justo donde se pierde o se duplica una fila sin que nadie lo
// note: el síntoma sería un agujero en la tabla de derivadas en la mitad de
// una partida, con la persona buscando la regla del cociente que ya no está.
//
// Lo que se fija acá, en orden de importancia:
//
//   1. **No se pierde ni se repite ninguna fila.** Pase lo que pase con los
//      slugs que mande el server, la tabla que se dibuja tiene las MISMAS
//      quince filas.
//   2. **Si entra, no se toca.** Es la mitad de la promesa: con las quince a
//      la vista, moverlas rompe la memoria muscular a cambio de nada — el
//      mismo argumento con el que backend/game/keyboard.py congela el orden de
//      las teclas.
//   3. **El orden canónico se conserva adentro de cada grupo.** Las que suben
//      no se barajan entre sí, y las de abajo tampoco.
//   4. **`subidas` apunta a la costura.** Es el índice de la primera fila que
//      NO subió, así que un off-by-one acá pinta el borde grueso en el renglón
//      equivocado.

import { FILAS, acomodar } from "../src/app/derivadas/derivatives-table"

let fallos = 0
function check(ok: boolean, label: string) {
  console.log(`  [${ok ? "ok" : "FAIL"}] ${label}`)
  if (!ok) fallos++
}

const TODOS = FILAS.map((f) => f.slug)
const canonico = (slugs: string[]) =>
  slugs.slice().sort((a, b) => TODOS.indexOf(a) - TODOS.indexOf(b))

function slugs(clave: string, desborda: boolean) {
  return acomodar(clave, desborda).filas.map((f) => f.slug)
}

console.log("1. nunca se pierde ni se repite una fila")
// El barrido incluye lo que el server podría mandar de más o de menos: una
// fila que este front no conoce, la lista vacía, y la lista entera.
const CASOS = [
  "",
  "chain",
  "x_n,sin_x,prod",
  "x,x_n,e_x,prod,chain",
  "a",
  "quot,chain",
  "inventada",
  "chain,inventada",
  TODOS.join(","),
]
for (const clave of CASOS) {
  for (const desborda of [false, true]) {
    const salida = slugs(clave, desborda)
    const ok =
      salida.length === FILAS.length &&
      new Set(salida).size === FILAS.length &&
      canonico(salida).join(",") === TODOS.join(",")
    if (!ok) {
      check(false, `«${clave}» desborda=${desborda} -> ${salida.join(",")}`)
    }
  }
}
check(fallos === 0, `las ${FILAS.length} filas sobreviven a los ${CASOS.length} casos`)

console.log("2. si la tabla entra, el orden no se toca")
for (const clave of CASOS) {
  const salida = slugs(clave, false)
  if (salida.join(",") !== TODOS.join(",")) {
    check(false, `sin desborde «${clave}» reordenó: ${salida.join(",")}`)
  }
}
check(true, "sin desborde, las nueve claves dejan el orden canónico")
// Y el caso degenerado: desbordando pero sin nada que subir, tampoco.
check(
  slugs("", true).join(",") === TODOS.join(","),
  "sin filas pedidas tampoco reordena aunque desborde",
)
check(
  slugs("inventada", true).join(",") === TODOS.join(","),
  "un slug que este front no conoce no reordena nada",
)
check(
  slugs(TODOS.join(","), true).join(",") === TODOS.join(","),
  "pedir TODAS las filas es no pedir ninguna",
)

console.log("3. desbordando, las pedidas van arriba y en orden canónico")
const PEDIDAS = "x,x_n,e_x,prod,chain"
const r = acomodar(PEDIDAS, true)
const arriba = r.filas.slice(0, r.subidas).map((f) => f.slug)
const abajo = r.filas.slice(r.subidas).map((f) => f.slug)
check(
  arriba.join(",") === canonico(PEDIDAS.split(",")).join(","),
  `las pedidas arriba y en orden de tabla (dio ${arriba.join(",")})`,
)
check(
  abajo.join(",") === TODOS.filter((s) => !PEDIDAS.split(",").includes(s)).join(","),
  "las demás abajo, también en orden de tabla",
)
// El caso que motivó todo: `prod` y `chain` son las dos últimas filas de la
// tabla, así que con la ventana baja son las primeras en quedar debajo del
// pliegue — y son las que más se consultan.
const reglas = acomodar("prod,chain", true)
check(
  reglas.filas.slice(0, 2).map((f) => f.slug).join(",") === "prod,chain",
  "las dos reglas del fondo suben a los dos primeros renglones",
)

console.log("4. `subidas` es dónde va la costura")
check(r.subidas === 5, `cinco filas pedidas, cinco subidas (dio ${r.subidas})`)
check(
  r.filas[r.subidas] !== undefined && !r.pedidas.has(r.filas[r.subidas].slug),
  "el renglón de la costura es el primero que NO subió",
)
check(
  r.filas.slice(0, r.subidas).every((f) => r.pedidas.has(f.slug)),
  "y todo lo que está por encima sí subió",
)
check(acomodar("", true).subidas === 0, "sin reordenar, la costura no existe")
// El slug que el front no conoce no cuenta como fila subida: si contara, la
// costura se pintaría un renglón más abajo del que corresponde.
check(
  acomodar("chain,inventada", true).subidas === 1,
  `un slug desconocido no corre la costura (dio ${acomodar("chain,inventada", true).subidas})`,
)

console.log(
  fallos === 0 ? "\ntodos los chequeos pasaron" : `\n${fallos} chequeos fallaron`,
)
process.exit(fallos === 0 ? 0 : 1)
