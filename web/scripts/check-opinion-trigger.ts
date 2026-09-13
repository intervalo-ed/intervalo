// Chequeo del disparador de la encuesta de dificultad.
//
// Corre con: bun run check:opinion
//
// Lo mismo que sus gemelos de reclutas e instalación: es una cuenta de módulo y
// un valor de localStorage, y equivocarse no se ve jugando sino semanas después,
// cuando la pregunta le salió a diez personas en vez de a cien.
//
// Las tres propiedades que la hacen soportable son las de siempre —cae donde se
// eligió, deja de insistir, y no le corre el turno a los pedidos que convierten—
// más una propia: **la cadencia tiene que ser más larga que la ventana con la
// que el servidor calcula el ajuste**, o dos votos seguidos se calcularían sobre
// las mismas respuestas.

import {
  readUltimoPedidoAt,
  saveUltimoPedidoAt,
} from "../src/app/derivadas/game-storage"
import {
  OPINION_CADA,
  OPINION_MAX,
  OPINION_PRIMERA,
  OPINION_SEPARACION,
  marcarOpinionMostrada,
  tocaOpinion,
} from "../src/app/derivadas/opinion-trigger"
import {
  RECLUTAS_CADA,
  RECLUTAS_RESTO,
  marcarReclutasMostrado,
  tocaReclutar,
} from "../src/app/derivadas/reclutas-trigger"
import { CAFECITO_COOLDOWN, CAFECITO_EVERY } from "../src/app/derivadas/cafecito-cta"

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

function tocaCafecito(total: number, esRecord = false): boolean {
  const porHito = total > 0 && total % CAFECITO_EVERY === 0
  if (!porHito && !esRecord) return false
  return total - readUltimoPedidoAt() >= CAFECITO_COOLDOWN
}

// La ventana del servidor (game/opinion.py :: VENTANA). Está escrita acá porque
// aquello es Python: el chequeo la compara contra la cadencia y falla si alguna
// de las dos se mueve sin la otra.
const VENTANA_DEL_SERVIDOR = 20

console.log(
  `valores: opinión en ${OPINION_PRIMERA} y cada ${OPINION_CADA} ` +
    `(máximo ${OPINION_MAX}, separación ${OPINION_SEPARACION}), ` +
    `reclutas cada ${RECLUTAS_CADA} resto ${RECLUTAS_RESTO}, café cada ${CAFECITO_EVERY}`,
)

console.log("1. cae en los números elegidos y deja de insistir")
limpio()
const salen: number[] = []
for (let n = 1; n <= 300; n++) {
  if (tocaOpinion(n)) {
    salen.push(n)
    marcarOpinionMostrada(n)
  }
}
check(salen.length === OPINION_MAX, `sale ${OPINION_MAX} veces y no más (${salen.length})`)
check(salen[0] === OPINION_PRIMERA, `la primera es en la ${OPINION_PRIMERA} (${salen[0]})`)
check(
  salen.every((n, i) => i === 0 || n - salen[i - 1] === OPINION_CADA),
  `separadas por ${OPINION_CADA} (${salen.join(", ")})`,
)

console.log("2. antes de la primera no sale")
limpio()
check(!tocaOpinion(0), "no sale en cero")
check(!tocaOpinion(-3), "ni con un número negativo")
check(
  Array.from({ length: OPINION_PRIMERA - 1 }, (_, i) => !tocaOpinion(i + 1)).every(Boolean),
  `no sale antes de la ${OPINION_PRIMERA}`,
)

console.log("3. la cadencia le deja lugar a la ventana del servidor")
// Si volviera antes de 20 respuestas, el segundo voto se calcularía sobre
// derivadas que el primero ya cobró y el ajuste se aplicaría dos veces por la
// misma evidencia.
check(
  OPINION_CADA > VENTANA_DEL_SERVIDOR,
  `vuelve cada ${OPINION_CADA}, más que las ${VENTANA_DEL_SERVIDOR} de la ventana`,
)

console.log("4. no le corre el turno a reclutar ni al café")
// El ladder entero en el orden real: la encuesta va ÚLTIMA y no consume el
// cooldown compartido. Las dos cosas juntas son lo que garantiza que no le
// saque nada a los pedidos que sí convierten.
limpio()
const pedidos: { n: number; que: string }[] = []
for (let n = 1; n <= 200; n++) {
  const esRecord = n % 23 === 0
  if (tocaCafecito(n, esRecord)) {
    pedidos.push({ n, que: "cafecito" })
    saveUltimoPedidoAt(n)
    continue
  }
  if (tocaReclutar(n)) {
    pedidos.push({ n, que: "reclutas" })
    marcarReclutasMostrado(n)
    continue
  }
  if (tocaOpinion(n)) {
    pedidos.push({ n, que: "opinion" })
    marcarOpinionMostrada(n)
  }
}
const reclutas = pedidos.filter((p) => p.que === "reclutas").map((p) => p.n)
check(
  reclutas.includes(RECLUTAS_RESTO),
  `reclutar sigue saliendo en la ${RECLUTAS_RESTO} (${reclutas.slice(0, 4).join(", ")})`,
)
const cafes = pedidos.filter((p) => p.que === "cafecito").map((p) => p.n)
check(cafes.length > 0, `el café sale igual (${cafes.slice(0, 4).join(", ")})`)
const opiniones = pedidos.filter((p) => p.que === "opinion").map((p) => p.n)
check(
  opiniones.length === OPINION_MAX,
  `y la encuesta sale sus ${OPINION_MAX} veces dentro del ladder (${opiniones.join(", ")})`,
)
// Ninguna respuesta muestra dos diapos: cada una ocupa el turno sola.
check(
  new Set(pedidos.map((p) => p.n)).size === pedidos.length,
  "ninguna derivada dispara dos pedidos a la vez",
)

console.log("5. mostrarla la anota, contestarla no hace falta")
// Se marca al MOSTRARLA. Si solo contara el voto, a quien la saltea se le
// aparecería en la derivada siguiente y para siempre.
limpio()
check(tocaOpinion(OPINION_PRIMERA), "sale la primera vez")
marcarOpinionMostrada(OPINION_PRIMERA)
check(
  !tocaOpinion(OPINION_PRIMERA + 1),
  "y no vuelve en la siguiente aunque no se haya contestado",
)

console.log("6. si no se puede anotar, se sigue ofreciendo")
// localStorage puede estar bloqueado (modo privado, permisos). El lado hacia el
// que conviene errar es mostrarla una vez de más.
limpio()
const store = (
  globalThis as unknown as { window: { localStorage: { setItem: unknown } } }
).window.localStorage
const setItem = store.setItem
store.setItem = () => {
  throw new Error("QuotaExceeded")
}
marcarOpinionMostrada(OPINION_PRIMERA)
check(tocaOpinion(OPINION_PRIMERA), "sigue ofreciéndose si no se pudo anotar")
store.setItem = setItem

console.log(fallos === 0 ? "\ntodos los chequeos pasaron" : `\n${fallos} fallos`)
process.exit(fallos === 0 ? 0 : 1)
