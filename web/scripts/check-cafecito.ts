// Chequeo de lo que un cafecito compra de verdad.
//
// Corre con: bun run check:cafecito
//
// Existe por un caso de producción. El cartel prometía un multiplicador
// calculado con la donación SOLA —`min(2,0; 1 + n×0,1)`— sin mirar el empuje que
// ya estuviera corriendo. Pero los cafecitos vigentes se SUMAN y el total se
// corta en ×3, así que con la universidad ya en el techo una donación no mueve
// el multiplicador ni un décimo: lo que hace es sostenerlo más tiempo.
//
// El mayor donante del juego donó cinco veces en un día y dos de esas cayeron
// con su universidad ya en ×3. Escribió preguntando si el límite era ×3. Tenía
// razón, y no había forma de que lo supiera antes de pagar.
//
// Lo que este chequeo fija, entonces, son dos cosas:
//
//   1. que los números del front sigan diciendo lo mismo que boosts.py, que era
//      lo que nadie ataba —el ×2,0 del cartel no existía en el backend—; y
//   2. que en el techo el impacto se cuente en TIEMPO y no en altura.

import {
  APORTE_MAX,
  CAFECITO_STEP,
  MAX_MULTIPLIER,
  SLIDER_MAX,
  aporteDe,
  horasDe,
  impactoDelCafecito,
} from "../src/app/derivadas/impacto-del-cafecito"

let fallos = 0
function check(ok: boolean, label: string) {
  console.log(`  [${ok ? "ok" : "FAIL"}] ${label}`)
  if (!ok) fallos++
}
const casi = (a: number, b: number) => Math.abs(a - b) < 1e-6

console.log("\nlos números son los del backend")
// Si alguno de estos cambia allá y no acá, el cartel promete una cosa y el
// server hace otra — que es exactamente lo que pasó.
check(CAFECITO_STEP === 0.1, `cada cafecito suma ${CAFECITO_STEP}`)
check(MAX_MULTIPLIER === 3.0, `el techo del juego es ×${MAX_MULTIPLIER}`)
check(
  casi(APORTE_MAX, SLIDER_MAX * CAFECITO_STEP),
  `una donación aporta como mucho +${APORTE_MAX} (${SLIDER_MAX} × ${CAFECITO_STEP})`,
)
check(APORTE_MAX < MAX_MULTIPLIER - 1, "al techo no se llega con una sola donación")

console.log("\nel aporte de una donación sola")
check(casi(aporteDe(1), 0.1), `un cafecito aporta +${aporteDe(1).toFixed(1)}`)
check(casi(aporteDe(10), 1.0), `diez aportan +${aporteDe(10).toFixed(1)}`)
check(casi(aporteDe(30), 1.0), "treinta aportan lo mismo que diez: el tope es por donación")
check(casi(aporteDe(0), 0) && casi(aporteDe(-5), 0), "cero y negativo no aportan nada")

console.log("\ndesde cero, el cafecito sube el multiplicador")
{
  const i = impactoDelCafecito(10, 1, 0)
  check(i.sube, "sin empuje corriendo, diez cafecitos suben")
  check(casi(i.destino, 2.0), `y llegan a ×${i.destino.toFixed(1)}, no más`)
}
{
  const i = impactoDelCafecito(1, 1, 0)
  check(casi(i.destino, 1.1), `un cafecito solo deja el juego en ×${i.destino.toFixed(1)}`)
}

console.log("\nsobre un empuje que ya corre, se suma")
{
  // La segunda donación del día: la universidad venía de ×2,0.
  const i = impactoDelCafecito(10, 2.0, 3600)
  check(i.sube && casi(i.destino, 3.0), `de ×2,0 se llega al techo (dio ×${i.destino.toFixed(1)})`)
}

console.log("\nEN EL TECHO no sube: lo que se compra es tiempo")
// EL TESTIGO. Este es el caso exacto que motivó todo: la UBA estaba en ×3,0 con
// cinco horas y media por delante, y llegó una donación de diez cafecitos.
{
  const restan = 5.47 * 3600
  const i = impactoDelCafecito(10, 3.0, restan)
  check(!i.sube, "con la universidad en ×3, una donación NO sube el multiplicador")
  check(casi(i.destino, 3.0), `el destino sigue siendo ×${i.destino.toFixed(1)}`)
  check(
    i.segundosGanados > 0,
    `pero estira el final ${Math.round(i.segundosGanados / 60)} min, que es lo que sí compró`,
  )
  check(
    casi(i.segundosGanados, horasDe(10) * 3600 - restan),
    "y lo ganado es la diferencia contra lo que ya quedaba, no la duración entera",
  )
}

console.log("\ndonar cuando ya queda más tiempo del que compra no estira nada")
{
  // Diez cafecitos duran seis horas. Con ocho por delante, el final no se mueve.
  const i = impactoDelCafecito(10, 3.0, 8 * 3600)
  check(i.segundosGanados === 0, "no se gana tiempo, y el número no puede salir negativo")
  check(!i.sube, "y tampoco altura: sigue siendo el techo")
}

console.log("\nla duración sigue bajando de a pares")
check(horasDe(10) === 6, `diez cafecitos duran ${horasDe(10)} horas`)
check(horasDe(9) === 6 && horasDe(8) === 5, "nueve y diez duran lo mismo; ocho, una menos")
check(horasDe(1) === 2, `el cafecito suelto dura ${horasDe(1)} horas`)
check(horasDe(0) === 1 && horasDe(-3) === 1, "y nada raro con cero o negativo")

console.log("\nel cartel nunca puede prometer más que el techo")
let excedido = 0
for (let actual = 1; actual <= 3; actual += 0.1) {
  for (let n = 0; n <= 40; n++) {
    if (impactoDelCafecito(n, actual, 0).destino > MAX_MULTIPLIER + 1e-9) excedido++
  }
}
check(excedido === 0, `ninguna combinación se pasa de ×${MAX_MULTIPLIER}`)

console.log()
if (fallos > 0) {
  console.log(`${fallos} chequeo(s) fallaron`)
  process.exit(1)
}
console.log("todo ok")
