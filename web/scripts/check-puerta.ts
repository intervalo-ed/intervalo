// Chequeo del brazo `derivada-primero` del experimento de la puerta.
//
// Corre con: bun run check:puerta
//
// Lo que se fija acá es de la clase que no se ve jugando. Un experimento roto no
// falla: sigue dibujando la pantalla y sigue guardando filas, solo que el brazo
// test dejó de ser lo que se escribió. Después se comparan dos montones que no
// son los brazos y la conclusión es peor que no haber experimentado.
//
// El brazo mueve tres piezas —la puerta, el @ y las reglas— y las dos primeras
// tienen dónde apoyarse: la puerta es una constante de texto y el @ se apaga
// solo cuando el servidor deja de decir `alias_is_generated`. Las reglas no
// tienen nada de eso: son una cuenta de módulo y un valor de localStorage, que
// es exactamente la forma de los otros disparadores de este juego y por eso
// tienen el mismo tipo de chequeo (check-opinion-trigger.ts y sus gemelos).

import {
  PEDIDO_REGLAS,
  clearGameIdentity,
  readPedidoState,
  readUltimoPedidoAt,
  saveUltimoPedidoAt,
} from "../src/app/derivadas/game-storage"
import {
  REGLAS_DESDE,
  REGLAS_TRAS,
  marcarReglasMostradas,
  tocaReglas,
} from "../src/app/derivadas/reglas-trigger"
import { BRAZOS, EXPERIMENTO } from "../src/lib/experiments/UseGameVariant"

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
function check(ok: boolean, label: string, detalle = "") {
  console.log(`  [${ok ? "ok" : "FAIL"}] ${label} ${detalle}`.trimEnd())
  if (!ok) fallos++
}

function limpio() {
  guardado.clear()
}

console.log(
  `valores: ${EXPERIMENTO} brazos [${BRAZOS.join(", ")}], ` +
    `reglas tras ${REGLAS_TRAS} correcta(s), desde la ${REGLAS_DESDE + 1}`,
)

console.log("1. el brazo test sigue existiendo con el nombre que se analiza")
// Si alguien renombra el brazo, el panel y las consultas de `game_players.variant`
// siguen funcionando y devuelven cero — que se lee como «el test no cambió nada».
check(BRAZOS[0] === "control", `el control es el índice 0 (${BRAZOS[0]})`)
check(
  BRAZOS[1] === "derivada-primero",
  `y el test es "derivada-primero" (${BRAZOS[1]})`,
)

console.log("2. las reglas empiezan en la 2, nunca en la 1")
// La 1 la dice la puerta (`INSTRUCCION_MINIMA`, en imperativo). Con REGLAS_DESDE
// en 0 se repetiría lo que la persona acaba de hacer; en 2, se perdería una
// regla entera sin que nada lo denuncie — las dos fallas son mudas.
check(REGLAS_DESDE === 1, `arranca en la regla 2 (desde=${REGLAS_DESDE})`)

console.log("3. sale una sola vez, y después nunca más")
limpio()
const salen: number[] = []
for (let n = 1; n <= 60; n++) {
  if (tocaReglas(n)) {
    salen.push(n)
    marcarReglasMostradas(n)
  }
}
check(salen.length === 1, `sale una sola vez (${salen.length})`)
check(salen[0] === REGLAS_TRAS, `y es en la ${REGLAS_TRAS} (${salen[0]})`)

console.log("4. antes de la primera correcta no sale")
limpio()
check(!tocaReglas(0), "no sale con cero correctas")
check(!tocaReglas(-2), "ni con un número negativo")

console.log("5. a quien ya venía jugando se le explican igual")
// El brazo se estrenó con otra forma (las reglas repartidas en los aciertos 1, 2
// y 5). Quien estaba en el medio tiene correctas acumuladas y ninguna marca, y
// tiene que recibirlas en su próximo acierto en vez de quedarse sin ellas para
// siempre.
limpio()
check(tocaReglas(37), "con 37 correctas y sin marca, salen")

console.log("6. no le come el turno a los pedidos")
// Las reglas no son un pedido —no piden plata, ni un contacto, ni una cuenta—
// así que no consumen el cooldown compartido. Si lo consumieran, el primer
// cafecito y el primer reclutamiento se correrían por una pantalla que no pide
// nada.
limpio()
saveUltimoPedidoAt(4)
marcarReglasMostradas(REGLAS_TRAS)
check(
  readUltimoPedidoAt() === 4,
  `el cooldown compartido queda donde estaba (${readUltimoPedidoAt()})`,
)

console.log("7. cerrar sesión las devuelve")
// `clearGameIdentity` borra el token de invitado: después de eso el próximo
// jugador de este aparato es OTRO, arranca en cero correctas y tiene que ver la
// explicación. Sin limpiar esta clave, el segundo invitado del mismo navegador
// entraría al brazo test y nunca se enteraría de cómo funciona el juego.
limpio()
marcarReglasMostradas(REGLAS_TRAS)
check(readPedidoState(PEDIDO_REGLAS).vistas === 1, "quedaron anotadas")
clearGameIdentity()
check(tocaReglas(1), "y después de cerrar sesión vuelven a salir")

console.log("8. si no se puede anotar, se siguen ofreciendo")
// localStorage bloqueado (modo privado, permisos). Acá el lado hacia el que se
// yerra ni siquiera cuesta nada: sin localStorage tampoco hay `guest_token`
// guardado, así que cada carga de página es un jugador nuevo con cero
// correctas, y «una vez por carga» es «una vez por jugador».
limpio()
const store = (
  globalThis as unknown as { window: { localStorage: { setItem: unknown } } }
).window.localStorage
const setItem = store.setItem
store.setItem = () => {
  throw new Error("QuotaExceeded")
}
marcarReglasMostradas(REGLAS_TRAS)
check(tocaReglas(1), "siguen ofreciéndose si no se pudo anotar")
store.setItem = setItem

console.log(fallos === 0 ? "\ntodos los chequeos pasaron" : `\n${fallos} fallos`)
process.exit(fallos === 0 ? 0 : 1)
