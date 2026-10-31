// Chequeo de las reglas de la puerta, y de que no haya un sorteo colgado.
//
// Corre con: bun run check:puerta
//
// Lo que se fija acá es de la clase que no se ve jugando. Una explicación rota
// no falla: la pantalla se dibuja igual y las filas se guardan igual, solo que
// la persona no se enteró de cómo funciona el juego — o se enteró tres veces.
//
// La puerta dice una sola regla, en imperativo, la tabla se explica antes de la
// primera derivada y el Elo llega en una diapo después del ranking. Eso no se apoya en nada del
// servidor: es una cuenta de módulo y un valor de localStorage, que es
// exactamente la forma de los otros disparadores de este juego y por eso tienen
// el mismo tipo de chequeo (check-opinion-trigger.ts y sus gemelos).

import {
  PEDIDO_REGLAS,
  PEDIDO_REGLAS_V1,
  clearGameIdentity,
  readPedidoState,
  readUltimoPedidoAt,
  savePedidoState,
  saveUltimoPedidoAt,
} from "@intervalo/dx-core/juego/game-storage"
import { CAFECITO_PRIMERA } from "../src/app/derivadas/cafecito-cta"
import { INSTALAR_PRIMERA } from "../src/app/derivadas/instalacion-trigger"
import { HITO_PERFIL, HITO_REGISTRO } from "@intervalo/dx-core/juego/hitos-del-juego"
import { RECLUTAS_CADA, RECLUTAS_RESTO } from "@intervalo/dx-core/juego/reclutas-trigger"
import {
  REGLAS_DE_LA_DIAPO,
  REGLAS_MAX,
  REGLAS_TRAS,
  TABLA,
  marcarReglasMostradas,
  reglasDichas,
  tocaReglas,
} from "@intervalo/dx-core/juego/reglas-trigger"
import {
  EN_CURSO,
  brazoDelJuego,
  variantDelJuego,
} from "../src/lib/experiments/UseGameVariant"
import {
  crearAlmacenEnMemoria,
  instalarAlmacen,
} from "@intervalo/dx-core/almacen/key-value-store"

// `game-storage` lee del almacén que se le instale; acá, uno en memoria.
const guardado = new Map<string, string>()
const memoria = crearAlmacenEnMemoria({ datos: guardado })
instalarAlmacen({ store: memoria })

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
    `reglas tras ${REGLAS_TRAS} [${REGLAS_DE_LA_DIAPO.join(", ")}]`,
)

console.log("0. el sorteo está apagado y no escribe la etiqueta de un experimento cerrado")
// Si `EN_CURSO` quedara apuntando a un experimento ya leído, cada jugador nuevo
// entraría a su brazo control y sus números seguirían moviéndose para siempre.
// Al abrir el próximo experimento este bloque se vuelve al revés: lo que hay
// que chequear entonces es que la etiqueta NO sea null.
check(EN_CURSO === null, "no hay experimento declarado en el front")
check(brazoDelJuego() === null, "así que no se sortea a nadie")
check(variantDelJuego() === null, "y `variant` viaja en null al backend")

console.log("1. la regla 1 no se dice dos veces")
// La 1 la dice la puerta (`INSTRUCCION_MINIMA`, en imperativo) y es la derivada
// que la persona acaba de resolver. Repetirla es contarle lo que hizo.
check(!REGLAS_DE_LA_DIAPO.includes(0), "la diapo no la incluye")
check(
  new Set(REGLAS_DE_LA_DIAPO).size === REGLAS_DE_LA_DIAPO.length,
  `y ninguna repetida ([${REGLAS_DE_LA_DIAPO.join(", ")}])`,
)
// La tabla se explica UNA vez: antes de la primera derivada
// (herramientas-slide.tsx). En la diapo también sería decírselo dos veces.
check(!REGLAS_DE_LA_DIAPO.includes(TABLA), "ni la de la tabla, que ya se explicó antes de jugar")
check(
  REGLAS_DE_LA_DIAPO.length >= 1 && REGLAS_DE_LA_DIAPO.length <= REGLAS_MAX,
  `no pasa de ${REGLAS_MAX}, que es lo que anota la marca`,
)

console.log("2. la diapo no le pisa el turno a ningún otro hito")
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
check(
  reglasDichas() === REGLAS_MAX,
  `queda anotada la marca entera (${reglasDichas()})`,
)

console.log("4. antes del umbral no sale")
limpio()
check(!tocaReglas(0), "no sale con cero correctas")
check(!tocaReglas(-2), "ni con un número negativo")
check(!tocaReglas(REGLAS_TRAS - 1), `ni una antes del umbral (${REGLAS_TRAS - 1})`)

console.log("5. a quien ya venía jugando se le explica igual")
// Quien estaba en el medio cuando cambió la forma tiene correctas acumuladas y
// ninguna marca, y tiene que recibirla en su próximo acierto en vez de quedarse
// sin ella para siempre.
limpio()
check(tocaReglas(37), "con 37 correctas y sin marca, sale")

console.log("6. no le comen el turno a los pedidos")
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
// nunca se enteraría de cómo funciona el juego.
limpio()
marcarReglasMostradas(REGLAS_TRAS)
check(
  readPedidoState(PEDIDO_REGLAS).vistas === REGLAS_MAX,
  "quedaron anotadas",
)
clearGameIdentity()
check(tocaReglas(REGLAS_TRAS), "y después de cerrar sesión vuelven a salir")

console.log("8. si no se puede anotar, se siguen ofreciendo")
// localStorage bloqueado (modo privado, permisos). El lado hacia el que se
// yerra no cuesta nada: sin localStorage tampoco hay `guest_token` guardado, así
// que cada carga de página es un jugador nuevo con cero correctas y «una vez por
// carga» es exactamente «una vez por jugador».
limpio()
instalarAlmacen({
  store: {
    ...memoria,
    set: () => {
      throw new Error("QuotaExceeded")
    },
  },
})
marcarReglasMostradas(REGLAS_TRAS)
check(tocaReglas(REGLAS_TRAS), "se siguen ofreciendo si no se pudo anotar")
instalarAlmacen({ store: memoria })

console.log("9. quien ya la vio con el esquema viejo no la vuelve a ver")
// La caja vieja guardaba `vistas: 1` queriendo decir «las tres salieron», porque
// salían juntas. Del 18 al 27/09 el brazo `sin-peaje` las contó de a una, así que
// ese 1 pasó a decir «salió una». El brazo se fue, pero la caja vieja sigue
// existiendo en los navegadores de esa semana, y sin la traducción a esa gente le
// volvería una diapo que ya vio. Es la clase de error que no se encuentra
// jugando: hay que volver con un localStorage de la semana pasada.
limpio()
savePedidoState(PEDIDO_REGLAS_V1, { vistas: 1, ultima: 1 })
check(
  reglasDichas() === REGLAS_MAX,
  `la marca vieja vale por la diapo entera (${reglasDichas()})`,
)
check(!tocaReglas(REGLAS_TRAS), "así que la diapo no se repite")

console.log("10. pero la caja nueva manda sobre la vieja")
// Un aparato puede tener las dos: la vieja de cuando las reglas salían juntas y
// la nueva de después. La que cuenta es la nueva.
limpio()
savePedidoState(PEDIDO_REGLAS_V1, { vistas: 1, ultima: 1 })
savePedidoState(PEDIDO_REGLAS, { vistas: 3, ultima: REGLAS_TRAS })
check(reglasDichas() === 3, `gana la nueva (${reglasDichas()})`)
check(!tocaReglas(REGLAS_TRAS), "y tampoco se repite")

console.log("11. cerrar sesión borra las dos cajas")
// Si quedara la vieja, el segundo invitado de este navegador arrancaría con «las
// tres ya salieron» y no se enteraría nunca de cómo funciona el juego. Es el
// mismo motivo de la sección 7, sobre la clave que ya no se escribe.
limpio()
savePedidoState(PEDIDO_REGLAS_V1, { vistas: 1, ultima: 1 })
savePedidoState(PEDIDO_REGLAS, { vistas: 3, ultima: 15 })
clearGameIdentity()
check(reglasDichas() === 0, `no queda rastro de ninguna (${reglasDichas()})`)
check(tocaReglas(REGLAS_TRAS), "y el próximo jugador de este aparato las recibe")

console.log(fallos === 0 ? "\ntodos los chequeos pasaron" : `\n${fallos} fallos`)
process.exit(fallos === 0 ? 0 : 1)
