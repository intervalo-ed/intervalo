// Chequeo del disparador de la pregunta abierta.
//
// Corre con: bun run check:encuesta
//
// Lo mismo que sus tres gemelos (reclutas, instalación, opinión): es una cuenta
// de módulo y un valor de localStorage, y equivocarse no se ve jugando sino
// semanas después.
//
// Pero esta tiene una propiedad que las otras no, y es la que más importa:
// **sale UNA vez en la vida y no hay segunda oportunidad**. Un disparador que se
// pierde el turno acá no lo recupera nunca, así que lo que hay que probar no es
// solo «cae donde se eligió» sino «cae aunque el casillero venga ocupado».
//
// Y una segunda: **no consume el cooldown compartido**, que es lo que deja al
// cafecito de la 20 en su lugar. Esa línea es un `saveUltimoPedidoAt` que no
// está, o sea exactamente la clase de cosa que alguien agrega de buena fe
// leyendo el comentario de opinion-trigger.ts. La sección 6 existe para que esa
// buena fe rompa un check en vez de una oferta.

import {
  PEDIDO_ENCUESTA,
  clearGameIdentity,
  readPedidoState,
  readUltimoPedidoAt,
  saveUltimoPedidoAt,
} from "../src/app/derivadas/game-storage"
import {
  ENCUESTA_EN,
  ENCUESTA_SEPARACION,
  marcarEncuestaMostrada,
  tocaEncuesta,
} from "../src/app/derivadas/encuesta-trigger"
import {
  RECLUTAS_CADA,
  RECLUTAS_RESTO,
} from "../src/app/derivadas/reclutas-trigger"
import {
  CAFECITO_COOLDOWN,
  CAFECITO_EVERY,
} from "../src/app/derivadas/cafecito-cta"
import { HITO_PERFIL, HITO_REGISTRO } from "../src/app/derivadas/hitos-del-juego"

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

console.log("1. cae en la derivada elegida y ni una antes")
limpio()
for (let k = 1; k < ENCUESTA_EN; k++) {
  if (tocaEncuesta(k)) {
    check(false, `no tendría que salir en la ${k}`)
    break
  }
}
check(!tocaEncuesta(ENCUESTA_EN - 1), `en la ${ENCUESTA_EN - 1} todavía no`)
check(tocaEncuesta(ENCUESTA_EN), `en la ${ENCUESTA_EN} sí`)

console.log("2. una sola vez en la vida")
limpio()
marcarEncuestaMostrada(ENCUESTA_EN)
check(!tocaEncuesta(ENCUESTA_EN), "no vuelve en la misma")
check(!tocaEncuesta(ENCUESTA_EN + 1), "ni en la siguiente")
check(!tocaEncuesta(ENCUESTA_EN * 10), "ni diez veces más tarde")
check(readPedidoState(PEDIDO_ENCUESTA).vistas === 1, "y queda anotada una sola vez")

console.log("3. se marca al MOSTRARLA, no al contestarla")
// Quien la cierra sin escribir no la vuelve a ver. Si solo contara la
// respuesta, a esa persona le aparecería en la siguiente derivada y para
// siempre, que es la definición de peaje.
limpio()
check(tocaEncuesta(ENCUESTA_EN), "sale")
marcarEncuestaMostrada(ENCUESTA_EN)
check(!tocaEncuesta(ENCUESTA_EN + 1), "y no insiste aunque nadie haya contestado")

console.log("4. el casillero está libre de verdad")
// Ninguno de los hitos del juego cae en la misma derivada. Es lo que hace que
// la pregunta no se apile con otra pantalla, y es lo primero que se rompe el
// día que alguien mueve uno de esos números.
const ocupados: [number, string][] = [
  [HITO_PERFIL, "perfil"],
  [HITO_REGISTRO, "registro"],
  [CAFECITO_EVERY, "cafecito"],
]
for (const [n, quien] of ocupados) {
  check(ENCUESTA_EN !== n, `no comparte derivada con ${quien} (${n})`)
}
check(
  ENCUESTA_EN % RECLUTAS_CADA !== RECLUTAS_RESTO,
  `no comparte derivada con reclutas (${RECLUTAS_RESTO} cada ${RECLUTAS_CADA})`,
)

console.log("5. sale aunque venga de un pedido reciente, pero no pegada")
limpio()
saveUltimoPedidoAt(ENCUESTA_EN - 1)
check(!tocaEncuesta(ENCUESTA_EN), "pegada al pedido anterior, no")
limpio()
saveUltimoPedidoAt(ENCUESTA_EN - ENCUESTA_SEPARACION)
check(tocaEncuesta(ENCUESTA_EN), `a ${ENCUESTA_SEPARACION} de distancia, sí`)
// Y el caso real: reclutas sale en la 10 y escribe el cooldown compartido. Con
// la separación de diez esta pregunta no existiría — se caería a la 20, que es
// donde está el café.
limpio()
saveUltimoPedidoAt(RECLUTAS_RESTO)
check(
  tocaEncuesta(ENCUESTA_EN),
  `sale igual con reclutas en la ${RECLUTAS_RESTO} (el caso real)`,
)

console.log("6. NO consume el cooldown compartido")
// Esta es la sección importante. Si la pregunta escribiera `ultimoPedidoAt`, el
// cafecito de la 20 pediría 20 - 18 = 2 >= 10 y no saldría; y como su
// disparador de hito es múltiplo de CAFECITO_EVERY, no se correría a la 24 sino
// hasta la 40. Una pregunta que se hace una vez en la vida no puede costar una
// oferta de tres.
limpio()
saveUltimoPedidoAt(RECLUTAS_RESTO)
marcarEncuestaMostrada(ENCUESTA_EN)
check(
  readUltimoPedidoAt() === RECLUTAS_RESTO,
  `el último pedido sigue siendo el de la ${RECLUTAS_RESTO} (quedó en ${readUltimoPedidoAt()})`,
)
const proximoCafe = CAFECITO_EVERY
check(
  proximoCafe - readUltimoPedidoAt() >= CAFECITO_COOLDOWN,
  `y el cafecito de la ${proximoCafe} sigue saliendo`,
)

console.log("7. cerrar sesión la devuelve")
// El segundo invitado de este navegador es otra persona y merece que le
// pregunten. Mismo motivo que las otras cajas de pedido.
limpio()
marcarEncuestaMostrada(ENCUESTA_EN)
clearGameIdentity()
check(tocaEncuesta(ENCUESTA_EN), "el próximo jugador de este aparato la recibe")

console.log("8. con localStorage bloqueado no se rompe, pero insiste")
// El síntoma que hay que conocer: en un navegador que tira al escribir, la
// pregunta sale en cada respuesta a partir de la 18 porque nunca se puede
// anotar que salió. Es molesto y es preferible a que reviente la partida, que
// es lo que haría si `savePedidoState` no tragara el error.
const roto = {
  getItem: () => null,
  setItem: () => {
    throw new Error("bloqueado")
  },
  removeItem: () => {},
}
Object.assign(globalThis, { window: { localStorage: roto } })
let reventó = false
try {
  marcarEncuestaMostrada(ENCUESTA_EN)
} catch {
  reventó = true
}
check(!reventó, "marcar no tira")
check(tocaEncuesta(ENCUESTA_EN), "y la pregunta sigue apareciendo (el síntoma)")
Object.assign(globalThis, {
  window: {
    localStorage: {
      getItem: (k: string) => guardado.get(k) ?? null,
      setItem: (k: string, v: string) => void guardado.set(k, v),
      removeItem: (k: string) => void guardado.delete(k),
    },
  },
})

console.log(
  fallos === 0 ? "\ntodos los chequeos pasaron" : `\n${fallos} chequeos fallaron`,
)
process.exit(fallos === 0 ? 0 : 1)
