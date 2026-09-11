// Chequeo de la aritmética del salto del ranking.
//
// Corre con: bun run check:salto
//
// Existe por una regresión concreta. La animación anterior subía la fila de a un
// puesto por vez y prometía un tope de 1600 ms en una constante llamada
// `CLIMB_TOTAL_MS`, pero el piso de 140 ms por paso lo rompía: treinta puestos
// duraban 4200 ms. La promesa estaba escrita en el nombre de la constante y en
// un comentario, que es exactamente donde una promesa no se verifica sola.
//
// Así que ahora el tope es una afirmación con prueba, y el testigo de la
// regresión —la fórmula vieja, calculada acá abajo— está fijado para que el bug
// no pueda volver en silencio.

import {
  ALTO_FILA_PX,
  FILAS_TOPE,
  RAMPA,
  SALTO_MS_MAX,
  SALTO_MS_MIN,
  V_TOPE_PX_S,
  curvaDelSalto,
  duracionDelSalto,
  filasDelSalto,
  velocidadDelSalto,
} from "../src/app/derivadas/salto-ranking"

let fallos = 0
function check(ok: boolean, label: string) {
  console.log(`  [${ok ? "ok" : "FAIL"}] ${label}`)
  if (!ok) fallos++
}

console.log("\nel tope de tres segundos")
// La afirmación central del cambio, sobre todo el rango que puede llegar: el
// ranking tiene miles de cuentas y una cuenta nueva puede saltar cientos.
const largos = Array.from({ length: 10_000 }, (_, i) => i + 1)
const peor = Math.max(...largos.map((d) => duracionDelSalto(d)))
check(peor <= SALTO_MS_MAX, `ningún salto pasa de ${SALTO_MS_MAX} ms (el peor dio ${peor})`)
check(duracionDelSalto(1e6) <= SALTO_MS_MAX, "ni uno absurdo de un millón de puestos")

// El testigo: la fórmula de antes, para que quede escrito qué se rompió.
const vieja = (d: number) => Math.max(140, Math.min(220, Math.round(1600 / d))) * d
check(vieja(30) === 4200, `la fórmula vieja daba ${vieja(30)} ms en 30 puestos`)
const primerRoto = largos.find((d) => vieja(d) > SALTO_MS_MAX)
check(primerRoto === 22, `y se pasaba de los 3 s a partir de ${primerRoto} puestos`)

console.log("\nla duración")
check(duracionDelSalto(0) === 0, "bajar no es saltar: distancia 0 → 0 ms")
check(duracionDelSalto(-7) === 0, "una distancia negativa tampoco (motion no acepta duración negativa)")
check(duracionDelSalto(NaN) === 0, "ni un NaN")
check(duracionDelSalto(1) === SALTO_MS_MIN, `un puesto solo dura el piso (${duracionDelSalto(1)} ms)`)
const creciente = largos.slice(1).every((d) => duracionDelSalto(d) >= duracionDelSalto(d - 1))
check(creciente, "no decreciente: más puestos nunca duran menos")
check(
  duracionDelSalto(FILAS_TOPE + 1) === duracionDelSalto(FILAS_TOPE) &&
    duracionDelSalto(FILAS_TOPE + 1000) === duracionDelSalto(FILAS_TOPE),
  `satura en FILAS_TOPE=${FILAS_TOPE} (${duracionDelSalto(FILAS_TOPE)} ms)`,
)

console.log("\nla ventana cargada")
// La lista es infinita por baches: el puesto del que venís puede no estar
// cargado, y entonces el viaje real es más corto que la distancia nominal.
check(
  duracionDelSalto(40, 12) === duracionDelSalto(12),
  "venir de 40 con 12 filas cargadas dura lo que dura un salto de 12",
)
check(duracionDelSalto(5, 40) === duracionDelSalto(5), "tener filas de sobra no cambia nada")
check(duracionDelSalto(30, 0) === 0, "sin filas debajo no hay salto")
const invariante = largos
  .slice(0, 200)
  .every((d) => [0, 3, 12, 41, 90].every((disp) => filasDelSalto(d, disp) <= Math.min(disp, FILAS_TOPE)))
check(invariante, "filasDelSalto nunca pasa ni las disponibles ni FILAS_TOPE")

console.log("\nla curva")
check(curvaDelSalto(0) === 0 && curvaDelSalto(1) === 1, "va de 0 a 1")
check(curvaDelSalto(-1) === 0 && curvaDelSalto(2) === 1, "y fuera de rango se acota")
check(Math.abs(curvaDelSalto(0.5) - 0.5) < 1e-12, "simétrica: a mitad de tiempo, mitad de camino")

const N = 1000
const muestras = Array.from({ length: N + 1 }, (_, i) => curvaDelSalto(i / N))
check(
  muestras.every((v, i) => i === 0 || v > muestras[i - 1]),
  "estrictamente creciente: la fila nunca retrocede",
)
check(
  muestras.every((v) => v >= 0 && v <= 1),
  "acotada en [0,1]: sin sobrepaso (un resorte se pasaba, y sobre 2000 px eso son 60 px de ida y vuelta)",
)
// Las dos rodillas del trapecio: donde termina de acelerar y donde empieza a
// frenar. Un salto ahí se vería como un tirón.
for (const t of [RAMPA, 1 - RAMPA]) {
  const salto = Math.abs(curvaDelSalto(t + 1e-9) - curvaDelSalto(t - 1e-9))
  check(salto < 1e-8, `continua en la rodilla t=${t} (salto ${salto.toExponential(1)})`)
}
const h = 1e-3
check(curvaDelSalto(h) / h < 0.05, "arranca quieta: «acelera» dicho con números")
check((1 - curvaDelSalto(1 - h)) / h < 0.05, "y termina quieta: «desacelera» también")

console.log("\nla curva y la duración dicen lo mismo")
// Lo que ata los dos archivos. La fórmula de la duración supone que el pico de
// velocidad es 1/(1-RAMPA) veces la media; si alguien cambia la curva sin tocar
// la fórmula, el tope de px/s deja de ser cierto y en pantalla no se nota.
const pico = Math.max(...muestras.slice(1).map((v, i) => (v - muestras[i]) * N))
check(
  Math.abs(pico - 1 / (1 - RAMPA)) < 1e-3,
  `el pico de velocidad es 1/(1-RAMPA)=${(1 / (1 - RAMPA)).toFixed(3)} (midió ${pico.toFixed(3)})`,
)
const rapido = Math.max(...largos.map((d) => velocidadDelSalto(d)))
check(
  rapido <= V_TOPE_PX_S,
  `ningún salto pasa de ${V_TOPE_PX_S} px/s (el más rápido dio ${rapido.toFixed(1)})`,
)
check(
  FILAS_TOPE === Math.floor(((1 - RAMPA) * V_TOPE_PX_S * SALTO_MS_MAX) / (1000 * ALTO_FILA_PX)),
  `FILAS_TOPE sale de los otros topes, no está elegido a mano (${FILAS_TOPE})`,
)

console.log("\nla tabla, para leerla de un vistazo")
for (const d of [1, 3, 10, 20, 30, FILAS_TOPE, FILAS_TOPE + 50]) {
  console.log(
    `  ${String(d).padStart(3)} puestos → ${String(duracionDelSalto(d)).padStart(4)} ms` +
      ` · ${velocidadDelSalto(d).toFixed(0).padStart(3)} px/s`,
  )
}

console.log(fallos === 0 ? "\ntodo ok" : `\n${fallos} fallos`)
process.exit(fallos === 0 ? 0 : 1)
