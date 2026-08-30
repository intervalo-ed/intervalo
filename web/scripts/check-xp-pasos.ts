// Chequeo de los pasos del conteo de XP.
//
// Corre con: bun run check:xp
//
// Lo que comprueba es invisible jugando. Un reparto que pierde o gana un punto se
// ve como nada —el número queda uno arriba o uno abajo del que el servidor
// otorgó, y quién lo va a notar— pero es el contador del juego mintiendo. Y el
// color de los orbes es una distribución: de a un festejo por vez no se puede
// ver si dice lo que promete.

import {
  abanicoDe,
  colorDeMadurez,
  coloresDelFestejo,
  madurezDe,
  pasosDe,
  repartir,
} from "../src/app/derivadas/xp-pasos"

let fallos = 0
function check(ok: boolean, label: string) {
  console.log(`  [${ok ? "ok" : "FAIL"}] ${label}`)
  if (!ok) fallos++
}

// Los aciertos que reparte el backend hoy: 8 al segundo intento, 25 al primero,
// y hasta unos 90 con el multiplicador de cafecitos de una universidad empujada.
const XP_REALES = [1, 2, 3, 4, 5, 8, 12, 21, 25, 33, 50, 75, 90, 137]

console.log("\nreparto")
{
  let exactos = true
  let sinCeros = true
  let parejos = true
  for (let xp = 1; xp <= 500; xp++) {
    const partes = repartir(xp, pasosDe(xp))
    if (partes.reduce((a, b) => a + b, 0) !== xp) exactos = false
    if (partes.some((p) => p <= 0)) sinCeros = false
    // Reparto parejo: entre el paso más grande y el más chico no puede haber
    // más de uno de diferencia, si no el conteo se sentiría a saltos.
    if (Math.max(...partes) - Math.min(...partes) > 1) parejos = false
  }
  check(exactos, "de 1 a 500 de XP, la suma de los pasos da exactamente la XP")
  check(sinCeros, "ningún paso suma cero (sonaría un tick sin número que suba)")
  check(parejos, "los pasos no difieren en más de 1 entre sí")
}

check(
  XP_REALES.every((xp) => pasosDe(xp) >= 1 && pasosDe(xp) <= 14),
  "los aciertos reales entran entre 1 y 14 pasos",
)
check(
  XP_REALES.filter((xp) => xp >= 4).every((xp) => pasosDe(xp) >= 4),
  "de 4 de XP para arriba, el festejo nunca baja de 4 pasos",
)
check(pasosDe(1) === 1 && pasosDe(2) === 2, "un acierto de 1 o 2 no inventa pasos vacíos")
check(pasosDe(25) === 8, "el acierto típico (25) se cuenta en 8 pasos")

// ── El color de los orbes ──────────────────────────────────────────────────
//
// Son sorteos, así que lo que hay que comprobar no es un color sino una FORMA:
// maduros y parejos cuando salió de una, amarillos y desparejos cuando costó.
// Se mide en montón —cuatrocientos orbes por caso— o no se mide.

const tono = (css: string) => Number(/hsl\(([\d.]+)/.exec(css)![1])
const luz = (css: string) => Number(/([\d.]+)%\)$/.exec(css)![1])

// Lo que paga cada camino, según backend/game/xp.py.
const PRIMERO_FACIL = 19 // 25 x 0.75 de dificultad
const PRIMERO = 25
const PRIMERO_DIFICIL = 40 // 25 x 1.6
const SEGUNDO = 8
const INSISTIENDO = 5

console.log("\nmadurez")
check(
  madurezDe({ xp: PRIMERO }) === 1 && madurezDe({ xp: PRIMERO_DIFICIL }) === 1,
  "resolverla de una llega al verde maduro (y de ahí no pasa)",
)
check(
  madurezDe({ xp: SEGUNDO }) < madurezDe({ xp: PRIMERO_FACIL }),
  "el segundo intento sale más amarillo que el primero, incluso el fácil",
)
check(
  madurezDe({ xp: INSISTIENDO }) < madurezDe({ xp: SEGUNDO }),
  "insistiendo sale todavía más amarillo",
)
check(
  madurezDe({ xp: 50, multiplicador: 2 }) === madurezDe({ xp: PRIMERO }),
  "el empuje de la universidad no madura nada: se descuenta",
)
{
  let creciente = true
  for (let xp = 1; xp < 60; xp++) {
    if (madurezDe({ xp }) < madurezDe({ xp: xp - 1 })) creciente = false
  }
  check(creciente, "más XP nunca da menos madurez")
}

console.log("\nrampa")
check(
  Math.round(tono(colorDeMadurez(0))) === 48 &&
    Math.round(tono(colorDeMadurez(1))) === 142,
  "va del amarillo (48°) al verde (142°)",
)
check(
  luz(colorDeMadurez(0)) === luz(colorDeMadurez(0.5)) &&
    luz(colorDeMadurez(0.5)) === luz(colorDeMadurez(1)),
  "a luminosidad constante: la rampa es de tono, no de brillo",
)
check(
  tono(colorDeMadurez(-3)) === tono(colorDeMadurez(0)) &&
    tono(colorDeMadurez(9)) === tono(colorDeMadurez(1)),
  "fuera de rango se acota en vez de salirse de la rampa",
)

console.log("\nabanico")
{
  const tonos = (xp: number, intento: number) =>
    coloresDelFestejo({ cuantos: 400, xp, intento }).map(tono)
  const rango = (t: number[]) => Math.max(...t) - Math.min(...t)
  const medio = (t: number[]) => t.reduce((a, b) => a + b, 0) / t.length

  const deUna = tonos(PRIMERO, 1)
  const facil = tonos(PRIMERO_FACIL, 1)
  const errando = tonos(SEGUNDO, 2)
  const insistiendo = tonos(INSISTIENDO, 3)

  check(
    abanicoDe(1) < abanicoDe(2) && abanicoDe(2) === abanicoDe(3),
    "el abanico se abre en cuanto hubo un error, y no más por insistir",
  )
  check(
    rango(deUna) < 12,
    `resuelta de una, todos casi del mismo verde (rango ${rango(deUna).toFixed(1)}°)`,
  )
  check(
    rango(errando) > 3 * rango(facil),
    `con un error el abanico es mucho más ancho (${rango(errando).toFixed(1)}° vs ${rango(facil).toFixed(1)}°)`,
  )
  check(
    medio(errando) < medio(facil),
    `y además más amarillo en promedio (${medio(errando).toFixed(0)}° vs ${medio(facil).toFixed(0)}°)`,
  )
  check(medio(insistiendo) < medio(errando), "insistiendo, más amarillo todavía")
  check(deUna.every((t) => t > 120), "una tanda limpia no tiene ni un orbe amarillo")
  check(
    coloresDelFestejo({ cuantos: 9, xp: PRIMERO, intento: 1 }).length === 9,
    "sale un color por orbe",
  )
}

console.log(fallos === 0 ? "\nTodo ok\n" : `\n${fallos} fallo(s)\n`)
process.exit(fallos === 0 ? 0 : 1)
