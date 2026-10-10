// Chequeo de la palanca de dificultad.
//
// Corre con: bun run check:dificultad
//
// El front espeja DOS cosas del backend: cuántas posiciones hay y el nivel (el
// color) de cada una. Esto las lee de backend/game/dificultad.py y de
// backend/game/elo.py y las compara, porque un espejo que nada compara se
// despega en silencio: el servidor sirve una cosa y la pantalla dice otra.

import { readFileSync } from "node:fs"
import { join } from "node:path"

import {
  POSICIONES,
  POSICION_DEFAULT,
  POSICION_MAX,
  posicionInicial,
  textoDeDificultad,
} from "../src/app/derivadas/dificultad"

let fallos = 0
function check(cond: boolean, label: string, extra = "") {
  console.log(`  [${cond ? "ok" : "FAIL"}] ${label}${extra ? " " + extra : ""}`)
  if (!cond) fallos += 1
}

const backend = join(process.cwd(), "..", "backend", "game")
const dif = readFileSync(join(backend, "dificultad.py"), "utf-8")
const eloPy = readFileSync(join(backend, "elo.py"), "utf-8")

const thetas = (/THETA_DE_POSICION[^=]*=\s*\(([^)]*)\)/.exec(dif)?.[1] ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean)
  .map(Number)
const cortes = (/_LEVEL_CUTS\s*=\s*\(([^)]*)\)/.exec(eloPy)?.[1] ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean)
  .map(Number)
const nivelDe = (theta: number) => cortes.filter((c) => theta >= c).length

console.log("1. las posiciones")
check(POSICIONES.length === 9, "hay nueve", `(${POSICIONES.length})`)
check(POSICIONES.length === thetas.length, "las mismas que el backend", `(${thetas.length})`)
check(cortes.length === 3, "y se leyeron los tres cortes de nivel", `(${cortes})`)
check(
  POSICIONES.every((p) => p.formula.length > 0 && p.texto.length > 0),
  "todas tienen fórmula y texto",
)
check(new Set(POSICIONES.map((p) => p.formula)).size === 9, "y las fórmulas no se repiten")
check(
  POSICIONES.every((p, i) => i === 0 || p.nivel >= POSICIONES[i - 1].nivel),
  "el nivel no baja",
)

console.log("\n2. el espejo del color")
POSICIONES.forEach((p, i) => {
  check(
    p.nivel === nivelDe(thetas[i]),
    `la posición ${i} es de nivel ${nivelDe(thetas[i])} en el backend`,
    `(front: ${p.nivel})`,
  )
})

console.log("\n3. lo que viene del servidor")
check(POSICION_MAX === 8, "la última es la 8")
check(posicionInicial(null) === POSICION_DEFAULT, "null arranca en el medio")
check(posicionInicial(undefined) === POSICION_DEFAULT, "undefined también")
check(posicionInicial(3) === 3 && posicionInicial(0) === 0, "una válida se respeta")
check(
  posicionInicial(9) === POSICION_DEFAULT &&
    posicionInicial(-1) === POSICION_DEFAULT &&
    posicionInicial(1.5) === POSICION_DEFAULT,
  "una inválida cae al medio",
)
check(textoDeDificultad(null) === "Automática", "sin elegir dice Automática")
check(textoDeDificultad(0) === POSICIONES[0].formula, "elegida dice su fórmula")

console.log()
if (fallos > 0) {
  console.log(`${fallos} chequeos fallaron`)
  process.exit(1)
}
console.log("todos los chequeos pasaron")
