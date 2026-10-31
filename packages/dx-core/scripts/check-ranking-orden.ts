// Chequeo de la aritmética del reacomodo del ranking.
//
// Corre con: bun run check:ranking-orden
//
// `swapsToReach` devuelve los cruces entre vecinos que llevan de un orden al
// otro. Lo que se fija: aplicarlos llega EXACTAMENTE al destino, sin cruces de
// más (un bubble sort hace tantos como inversiones haya), y nada si ya está.

import { memoriaEnBlanco, mismoOrden, swapsToReach } from "../src/juego/ranking-orden"

let fallos = 0
function check(ok: boolean, label: string) {
  console.log(`  [${ok ? "ok" : "FAIL"}] ${label}`)
  if (!ok) fallos++
}

function aplicar(orden: readonly number[], pasos: number[]): number[] {
  const arr = [...orden]
  for (const i of pasos) [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]]
  return arr
}

function inversiones(orden: readonly number[], destino: readonly number[]): number {
  const pos = new Map(destino.map((id, i) => [id, i]))
  let n = 0
  for (let i = 0; i < orden.length; i++)
    for (let j = i + 1; j < orden.length; j++)
      if ((pos.get(orden[i]) ?? 0) > (pos.get(orden[j]) ?? 0)) n++
  return n
}

const casos: [number[], number[]][] = [
  [[1, 2, 3], [1, 2, 3]],
  [[2, 1, 3], [1, 2, 3]],
  [[5, 4, 3, 2, 1], [1, 2, 3, 4, 5]],
  [[10, 20, 30, 40], [40, 10, 20, 30]],
  [[7, 3, 9, 1, 4], [1, 9, 3, 4, 7]],
  [[], []],
]

for (const [desde, hasta] of casos) {
  const pasos = swapsToReach(desde, hasta)
  check(
    mismoOrden(aplicar(desde, pasos), hasta),
    `[${desde}] → [${hasta}] llega con ${pasos.length} cruce(s)`,
  )
  check(
    pasos.length === inversiones(desde, hasta),
    `[${desde}] → [${hasta}] sin cruces de más (${inversiones(desde, hasta)} inversiones)`,
  )
}

check(swapsToReach([1, 2, 3], [1, 2, 3]).length === 0, "ya ordenado: ningún cruce")
check(!mismoOrden([1, 2], [1, 2, 3]), "largos distintos no son el mismo orden")
check(!mismoOrden([1, 2, 3], [1, 3, 2]), "mismo conjunto, otro orden")

const m = memoriaEnBlanco()
check(m.mano === false && m.top === 0, "la memoria en blanco no se acuerda de nada")
check(memoriaEnBlanco() !== m, "cada memoria en blanco es un objeto nuevo")

console.log(
  fallos === 0 ? "\ntodos los chequeos pasaron" : `\n${fallos} chequeos fallaron`,
)
process.exit(fallos === 0 ? 0 : 1)
