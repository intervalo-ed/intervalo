// Chequeo de los brazos del experimento de la puerta.
//
// Corre con: bun run check:puerta
//
// Lo que se fija acá es de la clase que no se ve jugando. Un experimento roto no
// falla: sigue dibujando la pantalla y sigue guardando filas, solo que el brazo
// test dejó de ser lo que se escribió. Después se comparan dos montones que no
// son los brazos y la conclusión es peor que no haber experimentado.
//
// `dx-puerta-2` mueve dos piezas y las dos se apoyan en cosas distintas. El @ se
// apaga solo cuando el servidor deja de decir `alias_is_generated`, así que se
// cuida solo. Las reglas no tienen nada de eso: son una cuenta de módulo y un
// valor de localStorage, que es exactamente la forma de los otros disparadores
// de este juego y por eso tienen el mismo tipo de chequeo
// (check-opinion-trigger.ts y sus gemelos).

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
  CALENDARIO,
  ESPACIO_MINIMO,
  REGLAS_DE_LA_DIAPO,
  REGLAS_TRAS,
  marcarReglaDicha,
  marcarReglasMostradas,
  proximaRegla,
  reglasDichas,
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

/** Corre una partida entera y devuelve en qué correcta salió cada regla. */
function repartir(desde: number, hasta: number): { en: number; regla: number }[] {
  const salidas: { en: number; regla: number }[] = []
  let dichas = 0
  for (let n = desde; n <= hasta; n++) {
    const regla = proximaRegla(n, dichas)
    if (regla !== null) {
      salidas.push({ en: n, regla })
      marcarReglaDicha(dichas, n)
      dichas++
    }
  }
  return salidas
}

console.log(
  `valores: ${EXPERIMENTO} brazos [${BRAZOS.join(", ")}], ` +
    `control tras ${REGLAS_TRAS} correcta(s) con [${REGLAS_DE_LA_DIAPO.join(", ")}], ` +
    `sin-peaje en [${CALENDARIO.map((p) => p.tras).join(", ")}]`,
)

console.log("1. los brazos siguen llamándose como los analiza el panel")
// Si alguien renombra un brazo, el panel y las consultas de
// `game_players.variant` siguen funcionando y devuelven cero — que se lee como
// «el test no cambió nada».
check(BRAZOS[0] === "control", `el control es el índice 0 (${BRAZOS[0]})`)
check(BRAZOS[1] === "sin-peaje", `y el test es "sin-peaje" (${BRAZOS[1]})`)

console.log("2. la regla 1 no se dice dos veces")
// La 1 la dice la puerta (`INSTRUCCION_MINIMA`, en imperativo) y es la derivada
// que la persona acaba de resolver. Repetirla es contarle lo que hizo.
check(!REGLAS_DE_LA_DIAPO.includes(0), "la diapo del control no la incluye")
check(
  !CALENDARIO.some((p) => p.regla === 0),
  "y el calendario de sin-peaje tampoco",
)

console.log("3. entre los dos brazos se dicen las mismas reglas")
// Si un brazo explicara menos que el otro, la diferencia de profundidad que el
// experimento mide sería la de una explicación faltante y no la del momento en
// que llega, que es lo único que se quiere comparar.
const delCalendario = CALENDARIO.map((p) => p.regla).sort()
check(
  JSON.stringify(delCalendario) === JSON.stringify([...REGLAS_DE_LA_DIAPO].sort()),
  `las mismas tres, en otro orden ([${delCalendario.join(", ")}])`,
)
check(
  new Set(delCalendario).size === CALENDARIO.length,
  "y ninguna repetida en el calendario",
)

console.log("4. control: salen una sola vez, y después nunca más")
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

console.log("5. control: antes de la primera correcta no salen")
limpio()
check(!tocaReglas(0), "no sale con cero correctas")
check(!tocaReglas(-2), "ni con un número negativo")

console.log("6. control: a quien ya venía jugando se le explican igual")
// Quien estaba en el medio cuando cambió la forma tiene correctas acumuladas y
// ninguna marca, y tiene que recibirlas en su próximo acierto en vez de quedarse
// sin ellas para siempre.
limpio()
check(tocaReglas(37), "con 37 correctas y sin marca, salen")

console.log("7. sin-peaje: ninguna antes de la tercera correcta")
// Es la condición que hace legible el experimento. La métrica primaria es llegar
// a tres correctas: una regla que saliera antes estaría ADENTRO de lo que se
// está midiendo, y el brazo dejaría de aislar lo único que cambia.
const primera = Math.min(...CALENDARIO.map((p) => p.tras))
check(
  primera > HITO_PERFIL,
  `la primera sale en la ${primera}, después del hito de perfil (${HITO_PERFIL})`,
)

console.log("8. sin-peaje: no le pisa el turno a ningún otro hito")
// Dos pantallas en el mismo acierto es exactamente la pila que este brazo existe
// para no tener, así que las paradas del calendario se comparan contra todas las
// respuestas donde el juego ya interrumpe. Los números salen de sus módulos y no
// escritos a mano: el 20 del cafecito estaba clavado acá y se movió a la 14 sin
// que este chequeo se enterara.
const ocupados = [
  HITO_PERFIL,
  HITO_REGISTRO,
  CAFECITO_PRIMERA,
  INSTALAR_PRIMERA,
  ...[0, 1, 2].map((k) => k * RECLUTAS_CADA + RECLUTAS_RESTO),
]
for (const paso of CALENDARIO) {
  check(
    !ocupados.includes(paso.tras),
    `la regla ${paso.regla} cae en la ${paso.tras}, que está libre`,
  )
}

console.log("9. sin-peaje: se reparten de a una y en orden")
limpio()
const partida = repartir(1, 40)
check(partida.length === CALENDARIO.length, `salen las tres (${partida.length})`)
check(
  JSON.stringify(partida.map((s) => s.en)) ===
    JSON.stringify(CALENDARIO.map((p) => p.tras)),
  `cada una en la suya ([${partida.map((s) => s.en).join(", ")}])`,
)
check(
  JSON.stringify(partida.map((s) => s.regla)) ===
    JSON.stringify(CALENDARIO.map((p) => p.regla)),
  `y en el orden del calendario ([${partida.map((s) => s.regla).join(", ")}])`,
)

console.log("10. sin-peaje: nunca dos seguidas")
const juntas = partida.filter((s, i) => i > 0 && s.en - partida[i - 1].en < ESPACIO_MINIMO)
check(juntas.length === 0, `ningún par a menos de ${ESPACIO_MINIMO} correctas`)

console.log("11. sin-peaje: el que vuelve con la partida empezada no las cobra de golpe")
// Alguien que jugó antes del deploy —o que tenía localStorage bloqueado y lo
// desbloqueó— llega con 30 correctas y ninguna regla dicha. Sin `ESPACIO_MINIMO`
// se comería las tres en tres respuestas seguidas, que es la pila de vuelta.
limpio()
const atrasado = repartir(30, 60)
check(atrasado.length === CALENDARIO.length, `igual recibe las tres (${atrasado.length})`)
check(atrasado[0].en === 30, `la primera, en la que estaba (${atrasado[0].en})`)
const apretadas = atrasado.filter(
  (s, i) => i > 0 && s.en - atrasado[i - 1].en < ESPACIO_MINIMO,
)
check(apretadas.length === 0, `y las otras espaciadas ([${atrasado.map((s) => s.en).join(", ")}])`)

console.log("12. no le comen el turno a los pedidos")
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
limpio()
saveUltimoPedidoAt(4)
marcarReglaDicha(0, CALENDARIO[0].tras)
check(readUltimoPedidoAt() === 4, "tampoco las sueltas")

console.log("13. cerrar sesión las devuelve")
// `clearGameIdentity` borra el token de invitado: después de eso el próximo
// jugador de este aparato es OTRO, arranca en cero correctas y tiene que ver la
// explicación. Sin limpiar esta clave, el segundo invitado del mismo navegador
// nunca se enteraría de cómo funciona el juego.
limpio()
marcarReglasMostradas(REGLAS_TRAS)
check(readPedidoState(PEDIDO_REGLAS).vistas === 3, "quedaron anotadas")
clearGameIdentity()
check(tocaReglas(1), "y después de cerrar sesión vuelven a salir")
check(proximaRegla(CALENDARIO[0].tras, reglasDichas()) !== null, "las sueltas también")

console.log("14. si no se puede anotar, se siguen ofreciendo")
// localStorage bloqueado (modo privado, permisos). En el control el lado hacia el
// que se yerra no cuesta nada: sin localStorage tampoco hay `guest_token`
// guardado, así que cada carga de página es un jugador nuevo con cero correctas.
//
// En `sin-peaje` NO alcanza, y por eso los layouts llevan un ref además de esto:
// la partida sigue viva, el contador del servidor sigue subiendo, y sin esa
// memoria de pestaña la misma regla volvería en cada correcta. Lo que se fija acá
// es el síntoma, para que el día que alguien saque el ref se vea por qué estaba.
limpio()
const store = (
  globalThis as unknown as { window: { localStorage: { setItem: unknown } } }
).window.localStorage
const setItem = store.setItem
store.setItem = () => {
  throw new Error("QuotaExceeded")
}
marcarReglasMostradas(REGLAS_TRAS)
check(tocaReglas(1), "el control las sigue ofreciendo si no se pudo anotar")
marcarReglaDicha(0, CALENDARIO[0].tras)
check(
  proximaRegla(CALENDARIO[0].tras + 1, 0) !== null,
  "y la suelta también, que es lo que el ref del layout tapa",
)
store.setItem = setItem

console.log("15. quien ya vio las tres con el esquema viejo no las vuelve a ver")
// La caja vieja guardaba `vistas: 1` queriendo decir «las tres salieron», porque
// salían juntas. Leído con el idioma nuevo ese 1 dice «salió una», y a quien
// volviera le saldrían de nuevo la tabla en la 8 y los cafecitos en la 15 — dos
// pantallas que ya vio, y justo en el brazo que existe para sacar pantallas del
// medio. Es la clase de error que no se ve jugando: hay que volver con un
// localStorage de la semana pasada para encontrarlo.
limpio()
savePedidoState(PEDIDO_REGLAS_V1, { vistas: 1, ultima: 1 })
check(reglasDichas() === 3, `la marca vieja vale por las tres (${reglasDichas()})`)
check(!tocaReglas(1), "así que el control no las repite")
check(
  proximaRegla(CALENDARIO[CALENDARIO.length - 1].tras, reglasDichas()) === null,
  "y sin-peaje tampoco, en ninguna de sus tres paradas",
)

console.log("16. pero la caja nueva manda sobre la vieja")
// Un aparato puede tener las dos: la vieja de cuando las reglas salían juntas y
// la nueva de después. La que cuenta es la nueva, o la traducción pisaría el
// progreso real de alguien que está en la mitad del calendario.
limpio()
savePedidoState(PEDIDO_REGLAS_V1, { vistas: 1, ultima: 1 })
savePedidoState(PEDIDO_REGLAS, { vistas: 1, ultima: CALENDARIO[0].tras })
check(reglasDichas() === 1, `va una dicha, no tres (${reglasDichas()})`)
check(
  proximaRegla(CALENDARIO[1].tras, reglasDichas()) === CALENDARIO[1].regla,
  "y la próxima es la segunda del calendario",
)

console.log("17. cerrar sesión borra las dos cajas")
// Si quedara la vieja, el segundo invitado de este navegador arrancaría con «las
// tres ya salieron» y no se enteraría nunca de cómo funciona el juego. Es el
// mismo motivo de la sección 13, sobre la clave que ya no se escribe.
limpio()
savePedidoState(PEDIDO_REGLAS_V1, { vistas: 1, ultima: 1 })
savePedidoState(PEDIDO_REGLAS, { vistas: 3, ultima: 15 })
clearGameIdentity()
check(reglasDichas() === 0, `no queda rastro de ninguna (${reglasDichas()})`)
check(tocaReglas(1), "y el próximo jugador de este aparato las recibe")

console.log(fallos === 0 ? "\ntodos los chequeos pasaron" : `\n${fallos} fallos`)
process.exit(fallos === 0 ? 0 : 1)
