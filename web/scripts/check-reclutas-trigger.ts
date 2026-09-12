// Chequeo del disparador de la diapo de reclutar.
//
// Corre con: bun run check:reclutas
//
// Son dos cuentas de módulo y un valor de localStorage, y equivocarse no se ve
// jugando: hay que resolver diez derivadas para enterarse de si salió cuando
// tenía que salir. Lo que importa comprobar no es que aparezca sino las dos
// cosas que la hacen soportable — que caiga en los números que le tocan, y que
// nunca salga pegada a la del cafecito.

import { readUltimoPedidoAt, saveUltimoPedidoAt } from "../src/app/derivadas/game-storage"
import {
  RECLUTAS_CADA,
  RECLUTAS_COOLDOWN,
  RECLUTAS_RESTO,
  marcarReclutasMostrado,
  tocaReclutar,
} from "../src/app/derivadas/reclutas-trigger"
import { CAFECITO_COOLDOWN, CAFECITO_EVERY } from "../src/app/derivadas/cafecito-cta"
import {
  CARACTERES_VALIDOS,
  LARGO_MAXIMO,
  POOL_DE_EJEMPLO,
  sortearAliasDeEjemplo,
} from "../src/components/reclutas-ejemplos"

// `game-storage` habla con localStorage y esto corre en bun, sin navegador.
const guardado = new Map<string, string>()
Object.assign(globalThis, {
  window: {
    localStorage: {
      getItem: (k: string) => guardado.get(k) ?? null,
      setItem: (k: string, v: string) => void guardado.set(k, v),
      removeItem: (k: string) => void guardado.delete(k),
    },
  },
})

let fallos = 0
function check(ok: boolean, label: string) {
  console.log(`  [${ok ? "ok" : "FAIL"}] ${label}`)
  if (!ok) fallos++
}

function limpio() {
  guardado.clear()
}

// El café con los mismos valores que usa el juego, para poder simular el ladder
// entero y no solo la mitad que estoy tocando.
function tocaCafecito(total: number, esRecord = false): boolean {
  const porHito = total > 0 && total % CAFECITO_EVERY === 0
  if (!porHito && !esRecord) return false
  return total - readUltimoPedidoAt() >= CAFECITO_COOLDOWN
}

console.log(
  `valores: reclutas cada ${RECLUTAS_CADA} resto ${RECLUTAS_RESTO} ` +
    `(cooldown ${RECLUTAS_COOLDOWN}), café cada ${CAFECITO_EVERY} (cooldown ${CAFECITO_COOLDOWN})`,
)

console.log("1. cae en los números que le tocan")
limpio()
const salen: number[] = []
for (let n = 1; n <= 100; n++) {
  if (tocaReclutar(n)) {
    salen.push(n)
    marcarReclutasMostrado(n)
  }
}
const esperados = Array.from({ length: 100 }, (_, i) => i + 1).filter(
  (n) => n % RECLUTAS_CADA === RECLUTAS_RESTO,
)
check(
  JSON.stringify(salen) === JSON.stringify(esperados),
  `sale en ${esperados.slice(0, 5).join(", ")}… (dio ${salen.slice(0, 5).join(", ")}…)`,
)
check(salen[0] === RECLUTAS_RESTO, `el primero llega a las ${RECLUTAS_RESTO} (dio ${salen[0]})`)

console.log("2. nunca sale pegada a la del cafecito")
// El ladder de verdad: se revisa el café primero, y el que sale marca el
// contador compartido para los dos.
limpio()
const pedidos: { n: number; que: string }[] = []
for (let n = 1; n <= 200; n++) {
  // Un récord cada tanto, en números que no son múltiplos de nada: es lo que
  // rompe el entrelazado por aritmética y por lo que hace falta el cooldown.
  const esRecord = n % 23 === 0
  if (tocaCafecito(n, esRecord)) {
    pedidos.push({ n, que: "café" })
    saveUltimoPedidoAt(n)
  } else if (tocaReclutar(n)) {
    pedidos.push({ n, que: "reclutas" })
    marcarReclutasMostrado(n)
  }
}
let minimo = Infinity
for (let i = 1; i < pedidos.length; i++) {
  minimo = Math.min(minimo, pedidos[i].n - pedidos[i - 1].n)
}
const cooldown = Math.min(RECLUTAS_COOLDOWN, CAFECITO_COOLDOWN)
check(pedidos.length > 4, `hubo pedidos que comparar (${pedidos.length})`)
check(minimo >= cooldown, `entre dos pedidos hay al menos ${minimo} derivadas`)
check(
  pedidos.some((p) => p.que === "reclutas") && pedidos.some((p) => p.que === "café"),
  "y salen los dos tipos, no uno solo comiéndose el turno del otro",
)

// Con los valores de DESARROLLO el cooldown es cero a propósito —las dos diapos
// salen alternadas en cada acierto para poder trabajarlas— así que las dos
// comprobaciones que siguen no aplican y decirlo es mejor que saltearlas en
// silencio.
console.log("3. el cooldown es compartido de verdad")
if (cooldown === 0) {
  console.log("  (salteado: con los valores de desarrollo el cooldown es 0)")
} else {
  check(minimo > 1, "y nunca dos pedidos en respuestas seguidas")
  limpio()
  // El café sale por un récord justo antes del hito de reclutar: eso tiene que
  // correr al reclutamiento, no dejarlo salir al toque.
  const hito = esperados.find((n) => n > 3)!
  saveUltimoPedidoAt(hito - 1)
  check(!tocaReclutar(hito), `con un pedido en ${hito - 1}, reclutar no sale en ${hito}`)
  limpio()
  saveUltimoPedidoAt(hito - RECLUTAS_COOLDOWN)
  check(tocaReclutar(hito), `y sí sale cuando ya pasaron ${RECLUTAS_COOLDOWN}`)
}

console.log("4. no sale antes de tiempo")
limpio()
check(!tocaReclutar(0), "con cero resueltas no sale")
check(!tocaReclutar(-3), "ni con un número imposible")

console.log("\nlos @ de los renglones de ejemplo")
// EL TESTIGO. Los tres de la diapo eran `cociente3196`, `tangente4626` y
// `escalar5925`: palabra de matemática más cuatro dígitos, que es el formato que
// el generador de invitados ABANDONÓ —el número delata que el nombre no lo
// eligió nadie, y la palabra viene del temario (game/aliases.py)—. O sea que la
// lista prometía reclutas con un @ que hoy no le toca a nadie.
const RETIRADO = /\d{4}$/
const conFormatoViejo = POOL_DE_EJEMPLO.filter((a) => RETIRADO.test(a))
check(
  conFormatoViejo.length === 0,
  `ninguno vuelve al formato retirado de cuatro dígitos (${conFormatoViejo.join(", ") || "ninguno"})`,
)

check(
  new Set(POOL_DE_EJEMPLO).size === POOL_DE_EJEMPLO.length,
  `los ${POOL_DE_EJEMPLO.length} del pool son distintos`,
)
const largos = POOL_DE_EJEMPLO.filter((a) => a.length > LARGO_MAXIMO)
check(
  largos.length === 0,
  `ninguno pasa los ${LARGO_MAXIMO} caracteres (${largos.join(", ") || "ninguno"})`,
)
const invalidos = POOL_DE_EJEMPLO.filter((a) => !CARACTERES_VALIDOS.test(a))
check(
  invalidos.length === 0,
  `todos podrían ser el @ de alguien de verdad (${invalidos.join(", ") || "ninguno"})`,
)

// Cinco es lo que muestra el panel del ranking; la diapo recorta a tres. Con el
// pozo en menos del doble, dos aperturas seguidas repetirían medio renglonero.
check(
  POOL_DE_EJEMPLO.length >= 10,
  `hay pozo para que dos aperturas seguidas no se parezcan (${POOL_DE_EJEMPLO.length})`,
)

const cinco = sortearAliasDeEjemplo(5)
check(
  cinco.length === 5 && new Set(cinco).size === 5,
  `un sorteo de cinco no repite (${cinco.join(", ")})`,
)
check(
  cinco.every((a) => (POOL_DE_EJEMPLO as readonly string[]).includes(a)),
  "y todos salen del pool",
)

// Pedir más de lo que hay no puede devolver huecos: la fila mostraría un nombre
// vacío al lado de un aporte en verde.
const todos = sortearAliasDeEjemplo(POOL_DE_EJEMPLO.length + 5)
check(
  todos.length === POOL_DE_EJEMPLO.length &&
    todos.every((a) => typeof a === "string" && a.length > 0),
  `pedir de más devuelve el pool entero y sin huecos (${todos.length})`,
)

// Con el sorteo inyectado el resultado es reproducible, que es lo que deja
// comprobar que el azar de verdad elige y no devuelve siempre la cabeza.
const primero = sortearAliasDeEjemplo(3, () => 0)
const ultimo = sortearAliasDeEjemplo(3, () => 0.999999)
check(
  primero[0] !== ultimo[0],
  `el sorteo mira el pool entero, no solo el principio (${primero[0]} vs ${ultimo[0]})`,
)
// Y el borde: un azar que devuelva 1 exacto no puede irse de rango.
const borde = sortearAliasDeEjemplo(3, () => 1)
check(
  borde.length === 3 && borde.every((a) => typeof a === "string" && a.length > 0),
  "con un azar que devuelve 1 exacto tampoco salen huecos",
)

console.log()
if (fallos > 0) {
  console.log(`${fallos} chequeo(s) fallaron`)
  process.exit(1)
}
console.log("todos los chequeos pasaron")
