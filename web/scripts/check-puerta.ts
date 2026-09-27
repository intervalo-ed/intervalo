// Chequeo de las reglas de la puerta, y de que no haya un sorteo colgado.
//
// Corre con: bun run check:puerta
//
// Lo que se fija acá es de la clase que no se ve jugando. Una explicación rota
// no falla: la pantalla se dibuja igual y las filas se guardan igual, solo que
// la persona no se enteró de cómo funciona el juego — o se enteró tres veces.
//
// La puerta dice una sola regla, en imperativo, y las otras tres llegan juntas
// en una diapo después del primer ranking. Eso no se apoya en nada del
// servidor: es una cuenta de módulo y un valor de localStorage, que es
// exactamente la forma de los otros disparadores de este juego y por eso tienen
// el mismo tipo de chequeo (check-opinion-trigger.ts y sus gemelos).
//
// **La sección 1 es nueva y es la que importa más ahora.** `dx-puerta-2` cerró
// el 27/09 y no quedó ningún experimento corriendo, así que lo que hay que
// cuidar ya no es que los brazos se llamen bien sino lo contrario: que no se
// esté sorteando a nadie ni escribiendo la etiqueta de un experimento cerrado.
// Eso es invisible desde adentro del juego y envenena el panel en silencio —un
// brazo que crece y otro congelado es peor que no tener el dato—.

import {
  PEDIDO_REGLAS,
  PEDIDO_REGLAS_V1,
  clearGameIdentity,
  readPedidoState,
  readUltimoPedidoAt,
  savePedidoState,
  saveUltimoPedidoAt,
} from "../src/app/derivadas/game-storage"
import { CAFECITO_PRIMERA } from "../src/app/derivadas/cafecito-cta"
import { INSTALAR_PRIMERA } from "../src/app/derivadas/instalacion-trigger"
import { HITO_PERFIL, HITO_REGISTRO } from "../src/app/derivadas/hitos-del-juego"
import { RECLUTAS_CADA, RECLUTAS_RESTO } from "../src/app/derivadas/reclutas-trigger"
import {
  REGLAS_DE_LA_DIAPO,
  REGLAS_TRAS,
  marcarReglasMostradas,
  reglasDichas,
  tocaReglas,
} from "../src/app/derivadas/reglas-trigger"
import {
  EN_CURSO,
  brazoDelJuego,
  variantDelJuego,
} from "../src/lib/experiments/UseGameVariant"

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
  `valores: experimento en curso ${EN_CURSO === null ? "(ninguno)" : EN_CURSO.clave}, ` +
    `la diapo sale tras ${REGLAS_TRAS} correcta(s) con [${REGLAS_DE_LA_DIAPO.join(", ")}]`,
)

console.log("1. el sorteo está apagado y no escribe la etiqueta de un experimento cerrado")
// Si `EN_CURSO` quedara apuntando a un experimento ya leído, cada jugador nuevo
// entraría a su brazo control y sus números seguirían moviéndose para siempre.
// Al abrir el próximo experimento este bloque se vuelve al revés: lo que hay
// que chequear entonces es que la etiqueta NO sea null.
check(EN_CURSO === null, "no hay experimento declarado en el front")
check(brazoDelJuego() === null, "así que no se sortea a nadie")
check(variantDelJuego() === null, "y `variant` viaja en null al backend")

console.log("2. la regla 1 no se dice dos veces")
// La 1 la dice la puerta (`INSTRUCCION_MINIMA`, en imperativo) y es la derivada
// que la persona acaba de resolver. Repetirla es contarle lo que hizo.
check(!REGLAS_DE_LA_DIAPO.includes(0), "la diapo no la incluye")
check(
  new Set(REGLAS_DE_LA_DIAPO).size === REGLAS_DE_LA_DIAPO.length,
  `y ninguna repetida ([${REGLAS_DE_LA_DIAPO.join(", ")}])`,
)

console.log("3. la diapo no le pisa el turno a ningún otro hito")
// Dos pantallas en el mismo acierto es una pila, y la diapo es la que llega
// primera de todas. Los números salen de sus módulos y no escritos a mano: el
// 20 del cafecito estuvo clavado acá una vez y se movió a la 14 sin que este
// chequeo se enterara.
const ocupados = [
  HITO_PERFIL,
  HITO_REGISTRO,
  CAFECITO_PRIMERA,
  INSTALAR_PRIMERA,
  ...[0, 1, 2].map((k) => k * RECLUTAS_CADA + RECLUTAS_RESTO),
]
check(
  !ocupados.includes(REGLAS_TRAS),
  `la ${REGLAS_TRAS} está libre (ocupadas: ${[...new Set(ocupados)].sort((a, b) => a - b).join(", ")})`,
)
check(
  REGLAS_TRAS < Math.min(...ocupados),
  `y llega antes que todos (el primero es la ${Math.min(...ocupados)})`,
)

console.log("4. salen una sola vez, y después nunca más")
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
check(
  reglasDichas() === REGLAS_DE_LA_DIAPO.length,
  `quedan anotadas las tres (${reglasDichas()})`,
)

console.log("5. antes de la primera correcta no salen")
limpio()
check(!tocaReglas(0), "no sale con cero correctas")
check(!tocaReglas(-2), "ni con un número negativo")

console.log("6. a quien ya venía jugando se le explican igual")
// Quien estaba en el medio cuando cambió la forma tiene correctas acumuladas y
// ninguna marca, y tiene que recibirlas en su próximo acierto en vez de quedarse
// sin ellas para siempre.
limpio()
check(tocaReglas(37), "con 37 correctas y sin marca, salen")

console.log("7. no le comen el turno a los pedidos")
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

console.log("8. cerrar sesión las devuelve")
// `clearGameIdentity` borra el token de invitado: después de eso el próximo
// jugador de este aparato es OTRO, arranca en cero correctas y tiene que ver la
// explicación. Sin limpiar esta clave, el segundo invitado del mismo navegador
// nunca se enteraría de cómo funciona el juego.
limpio()
marcarReglasMostradas(REGLAS_TRAS)
check(readPedidoState(PEDIDO_REGLAS).vistas === 3, "quedaron anotadas")
clearGameIdentity()
check(tocaReglas(1), "y después de cerrar sesión vuelven a salir")

console.log("9. si no se puede anotar, se siguen ofreciendo")
// localStorage bloqueado (modo privado, permisos). El lado hacia el que se
// yerra no cuesta nada: sin localStorage tampoco hay `guest_token` guardado, así
// que cada carga de página es un jugador nuevo con cero correctas y «una vez por
// carga» es exactamente «una vez por jugador».
limpio()
const store = (
  globalThis as unknown as { window: { localStorage: { setItem: unknown } } }
).window.localStorage
const setItem = store.setItem
store.setItem = () => {
  throw new Error("QuotaExceeded")
}
marcarReglasMostradas(REGLAS_TRAS)
check(tocaReglas(1), "se siguen ofreciendo si no se pudo anotar")
store.setItem = setItem

console.log("10. quien ya vio las tres con el esquema viejo no las vuelve a ver")
// La caja vieja guardaba `vistas: 1` queriendo decir «las tres salieron», porque
// salían juntas. Del 18 al 27/09 el brazo `sin-peaje` las contó de a una, así que
// ese 1 pasó a decir «salió una». El brazo se fue, pero la caja vieja sigue
// existiendo en los navegadores de esa semana, y sin la traducción a esa gente le
// volvería una diapo que ya vio. Es la clase de error que no se encuentra
// jugando: hay que volver con un localStorage de la semana pasada.
limpio()
savePedidoState(PEDIDO_REGLAS_V1, { vistas: 1, ultima: 1 })
check(reglasDichas() === 3, `la marca vieja vale por las tres (${reglasDichas()})`)
check(!tocaReglas(1), "así que la diapo no se repite")

console.log("11. pero la caja nueva manda sobre la vieja")
// Un aparato puede tener las dos: la vieja de cuando las reglas salían juntas y
// la nueva de después. La que cuenta es la nueva.
limpio()
savePedidoState(PEDIDO_REGLAS_V1, { vistas: 1, ultima: 1 })
savePedidoState(PEDIDO_REGLAS, { vistas: 3, ultima: REGLAS_TRAS })
check(reglasDichas() === 3, `gana la nueva (${reglasDichas()})`)
check(!tocaReglas(1), "y tampoco se repite")

console.log("12. cerrar sesión borra las dos cajas")
// Si quedara la vieja, el segundo invitado de este navegador arrancaría con «las
// tres ya salieron» y no se enteraría nunca de cómo funciona el juego. Es el
// mismo motivo de la sección 8, sobre la clave que ya no se escribe.
limpio()
savePedidoState(PEDIDO_REGLAS_V1, { vistas: 1, ultima: 1 })
savePedidoState(PEDIDO_REGLAS, { vistas: 3, ultima: 15 })
clearGameIdentity()
check(reglasDichas() === 0, `no queda rastro de ninguna (${reglasDichas()})`)
check(tocaReglas(1), "y el próximo jugador de este aparato las recibe")

console.log(fallos === 0 ? "\ntodos los chequeos pasaron" : `\n${fallos} fallos`)
process.exit(fallos === 0 ? 0 : 1)
