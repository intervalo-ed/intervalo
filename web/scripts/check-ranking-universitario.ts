// Chequeo de la vuelta universitaria: cada 3 derivadas bien resueltas, la XP se
// cuenta sobre la universidad en vez de sobre la tarjeta propia.
//
// Corre con: bun run check:universitario
//
// Es una cuenta de módulo, y equivocarse no se ve jugando: hay que resolver tres
// derivadas para enterarse de si salió cuando tenía que salir, y nueve para
// enterarse de si el ritmo es el que se prometió. Lo que se comprueba no es que
// aparezca sino las tres cosas que la hacen soportable:
//
//   1. Que caiga exactamente en los múltiplos de tres y en ninguno más.
//   2. Que no dependa de nada que se pierda al recargar.
//   3. Que no le coma el lugar a ninguno de los pedidos de la escalera —café,
//      reclutas, instalar, notificaciones—, que son los que sí interrumpen.

import {
  VUELTA_UNIVERSITARIA_CADA,
  esVueltaUniversitaria,
  vistaInicialDelRanking,
} from "../src/app/derivadas/vuelta-universitaria"
import { RECLUTAS_CADA, RECLUTAS_RESTO } from "../src/app/derivadas/reclutas-trigger"
import { CAFECITO_EVERY } from "../src/app/derivadas/cafecito-cta"
import { HITO_PERFIL, HITO_REGISTRO } from "../src/app/derivadas/hitos-del-juego"
import {
  INSTALAR_CADA,
  INSTALAR_PRIMERA,
  NOTIF_CADA,
  NOTIF_PRIMERA,
} from "../src/app/derivadas/instalacion-trigger"

let fallos = 0
function check(ok: boolean, label: string) {
  console.log(`  [${ok ? "ok" : "FAIL"}] ${label}`)
  if (!ok) fallos++
}

const HASTA = 200
const correctas = Array.from({ length: HASTA }, (_, i) => i + 1)

console.log("1. Cae en los múltiplos de tres y en ninguno más")

const UNI = "ITBA"
const cayeron = correctas.filter((n) => esVueltaUniversitaria(n, UNI))
const esperadas = correctas.filter((n) => n % VUELTA_UNIVERSITARIA_CADA === 0)
check(
  cayeron.length === esperadas.length && cayeron.every((n, i) => n === esperadas[i]),
  `en ${HASTA} correctas cayó ${cayeron.length} veces, todas múltiplo de ${VUELTA_UNIVERSITARIA_CADA}`,
)
check(
  cayeron.slice(0, 5).join(",") === "3,6,9,12,15",
  `las primeras cinco son 3, 6, 9, 12 y 15 (dio ${cayeron.slice(0, 5).join(",")})`,
)
check(!esVueltaUniversitaria(0, UNI), "con cero correctas no cae: no hay festejo que mover")
check(
  correctas.every((n) => esVueltaUniversitaria(n, UNI) === (n % 3 === 0)),
  "y no hay ningún número suelto que se cuele",
)

console.log("2. Dos de cada tres siguen siendo sobre la tarjeta propia")

// El ritmo importa tanto como la regla: si cayera cada dos, el ranking
// individual —que es lo que la persona vino a mirar— pasaría a ser la excepción.
const proporcion = cayeron.length / HASTA
check(
  proporcion > 0.3 && proporcion < 0.4,
  `una de cada ${VUELTA_UNIVERSITARIA_CADA} (${(proporcion * 100).toFixed(0)}% de los aciertos)`,
)

console.log("3. No le come el lugar a ningún pedido de la escalera")

// La vuelta universitaria NO es una diapo: es una propiedad de la vista del
// ranking, que en el teléfono es la diapo que ya venía después de acertar y en
// escritorio es una columna que está siempre montada. Así que no compite por el
// turno con nada — y esto lo fija, porque la forma de romperlo en el futuro es
// convertirla en diapo.
//
// Se listan igual todos los números en los que la escalera SÍ interrumpe, para
// que quede escrito que se solapan a propósito y no por olvido: en la derivada
// 12 hay pedido de registro Y vuelta universitaria, y las dos cosas pasan.
const interrumpen = (n: number) =>
  n === HITO_PERFIL ||
  n === HITO_REGISTRO ||
  n % CAFECITO_EVERY === 0 ||
  n % RECLUTAS_CADA === RECLUTAS_RESTO ||
  n === INSTALAR_PRIMERA ||
  (n - INSTALAR_PRIMERA) % INSTALAR_CADA === 0 ||
  n === NOTIF_PRIMERA ||
  (n - NOTIF_PRIMERA) % NOTIF_CADA === 0

const solapados = correctas.filter((n) => esVueltaUniversitaria(n, UNI) && interrumpen(n))
check(
  solapados.length > 0,
  `se solapa con algún pedido en ${solapados.length} de ${cayeron.length} vueltas, y está bien: no compiten por el turno`,
)
check(
  esVueltaUniversitaria(HITO_REGISTRO, UNI) === (HITO_REGISTRO % 3 === 0),
  "el hito de registro no mueve la cuenta ni para un lado ni para el otro",
)

console.log("4. Sin universidad no hay vuelta, y eso incluye la primera")

// El juego pide la universidad en la derivada HITO_PERFIL, que es 3: o sea
// EXACTAMENTE cuando caería la primera vuelta universitaria. Antes de este
// chequeo la primera de todas caía sobre una lista en la que la persona todavía
// no estaba: sin fila propia, el número no trepaba en ningún lado y los orbes se
// apagaban a mitad de camino por falta de destino. Se vio en producción.
check(
  correctas.every((n) => !esVueltaUniversitaria(n, null)),
  "sin universidad cargada no cae nunca, en ninguna de las 200",
)
check(
  HITO_PERFIL % VUELTA_UNIVERSITARIA_CADA === 0,
  `el pedido de universidad (${HITO_PERFIL}) y la primera vuelta caen en el mismo número: por eso hace falta el guardia`,
)
check(
  !esVueltaUniversitaria(HITO_PERFIL, null) && esVueltaUniversitaria(2 * VUELTA_UNIVERSITARIA_CADA, UNI),
  `quien carga la universidad en la ${HITO_PERFIL} tiene su primera vuelta en la ${2 * VUELTA_UNIVERSITARIA_CADA}`,
)

console.log("5. El contador es del servidor")

// No hay estado que llevar: la función es pura y toma el acumulado que viene en
// la respuesta de /answer. Un contador por pestaña se reiniciaría al recargar y
// la persona vería dos vueltas seguidas, o ninguna en veinte derivadas.
const conStorage = Object.keys(globalThis).includes("localStorage")
check(
  !conStorage,
  "el módulo no necesita localStorage: corre sin navegador y sin estado",
)
check(
  esVueltaUniversitaria(9, UNI) && esVueltaUniversitaria(9, UNI),
  "llamarla dos veces con el mismo número da lo mismo: es pura",
)

console.log("6. En el teléfono la vuelta se dice eligiendo la lista inicial")

// El bug que motivó esta sección: la regla estaba bien y nadie la consumía. El
// teléfono le pasaba `universityRound` al ranking, pero esa prop solo hace algo
// cuando cambia `centerKey` sobre un componente que no se desmonta —el caso de
// escritorio—, y el teléfono ni siquiera manda `centerKey`. O sea que la vuelta
// universitaria no se vio NUNCA en el teléfono, aunque context/gamification.md
// la describía. Verificado en el navegador antes de arreglarla.
check(
  vistaInicialDelRanking(VUELTA_UNIVERSITARIA_CADA, UNI) === "university",
  `a las ${VUELTA_UNIVERSITARIA_CADA} el ranking del teléfono abre en universidades`,
)
check(
  correctas
    .filter((n) => n % VUELTA_UNIVERSITARIA_CADA !== 0)
    .every((n) => vistaInicialDelRanking(n, UNI) === "individual"),
  "y en todas las demás abre en la lista de personas",
)
check(
  correctas.every(
    (n) =>
      (vistaInicialDelRanking(n, UNI) === "university") === esVueltaUniversitaria(n, UNI),
  ),
  "la lista inicial y la regla dicen lo mismo en las 200: son la misma decisión",
)
check(
  correctas.every((n) => vistaInicialDelRanking(n, null) === "individual"),
  "sin universidad cargada nunca abre en universidades: esa lista no tendría fila propia",
)

console.log(fallos === 0 ? "\ntodo ok" : `\n${fallos} fallos`)
process.exit(fallos === 0 ? 0 : 1)
