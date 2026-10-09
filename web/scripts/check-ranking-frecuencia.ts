// Chequeo de la frecuencia del ranking y de su diapo.
//
// Corre con: bun run check:frecuencia
//
// Dos cosas distintas en un módulo: la REGLA (después de qué correctas se
// muestra el ranking según la preferencia) y el DISPARADOR de la diapo que la
// ofrece (derivada 15, una vez, sin correr a la varita de la 18). Equivocarse
// en la primera se ve jugando; en la segunda, semanas después.

import {
  PEDIDO_RANKING_FRECUENCIA,
  readPedidoState,
  readUltimaPantalla,
  readUltimoPedidoAt,
  saveUltimoPedidoAt,
} from "../src/app/derivadas/game-storage"
import {
  FRECUENCIAS,
  FRECUENCIA_DEFAULT,
  FRECUENCIA_EN,
  RANKING_CADA_N,
  marcarFrecuenciaMostrada,
  readFrecuenciaRanking,
  saveFrecuenciaRanking,
  siguienteFrecuencia,
  tocaPreguntarFrecuencia,
  tocaRanking,
} from "../src/app/derivadas/ranking-frecuencia"
import {
  ENCUESTA_EN,
  marcarEncuestaMostrada,
  tocaEncuesta,
} from "../src/app/derivadas/encuesta-trigger"
import {
  RECLUTAS_CADA,
  RECLUTAS_RESTO,
} from "../src/app/derivadas/reclutas-trigger"
import {
  CAFECITO_EVERY,
  CAFECITO_PRIMERA,
} from "../src/app/derivadas/cafecito-cta"
import {
  HITO_PERFIL,
  HITO_REGISTRO,
  REGISTRO_REPITE,
} from "../src/app/derivadas/hitos-del-juego"
import { INSTALAR_PRIMERA } from "../src/app/derivadas/instalacion-trigger"

// `game-storage` habla con localStorage y esto corre en bun, sin navegador.
const guardado = new Map<string, string>()
Object.assign(globalThis, {
  window: {
    localStorage: {
      getItem: (k: string) => guardado.get(k) ?? null,
      setItem: (k: string, v: string) => void guardado.set(k, v),
      removeItem: (k: string) => void guardado.delete(k),
    },
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => true,
  },
  Event: class {},
})

let fallos = 0
function check(ok: boolean, label: string) {
  console.log(`  [${ok ? "ok" : "FAIL"}] ${label}`)
  if (!ok) fallos++
}
function limpio() {
  guardado.clear()
}

console.log("1. la regla: cada derivada")
for (let n = 1; n <= 12; n++) {
  if (!tocaRanking({ frecuencia: "cada", totalCorrectas: n, subio: false })) {
    check(false, `con «cada» tendría que salir en la ${n}`)
    break
  }
}
check(tocaRanking({ frecuencia: "cada", totalCorrectas: 7, subio: null }), "sale aunque no haya puestos")

console.log(`2. la regla: cada ${RANKING_CADA_N}`)
const salen = Array.from({ length: 20 }, (_, i) => i + 1).filter((n) =>
  tocaRanking({ frecuencia: "cada5", totalCorrectas: n, subio: true }),
)
check(
  salen.join(",") === [5, 10, 15, 20].join(","),
  `en 20 correctas sale en ${salen.join(", ")}`,
)
check(
  !tocaRanking({ frecuencia: "cada5", totalCorrectas: 1, subio: true }),
  "la primera correcta no lo muestra aunque suba",
)

console.log("3. la regla: solo cuando subo")
check(tocaRanking({ frecuencia: "subo", totalCorrectas: 4, subio: true }), "subió, sale")
check(!tocaRanking({ frecuencia: "subo", totalCorrectas: 4, subio: false }), "no subió, no sale")
check(
  tocaRanking({ frecuencia: "subo", totalCorrectas: 4, subio: null }),
  "sin puestos del servidor, ante la duda sale",
)

console.log("4. la preferencia: default, guardado y rotación")
limpio()
check(readFrecuenciaRanking() === FRECUENCIA_DEFAULT, `sin nada guardado es «${FRECUENCIA_DEFAULT}»`)
check(FRECUENCIA_DEFAULT === "cada", "y el default es lo que el juego hizo siempre")
saveFrecuenciaRanking("subo")
check(readFrecuenciaRanking() === "subo", "lo guardado se lee")
guardado.set("intervalo:game:ranking-frecuencia", "cualquiera")
check(readFrecuenciaRanking() === FRECUENCIA_DEFAULT, "un valor desconocido cae al default")
let v = FRECUENCIAS[0].valor
const vistos = new Set([v])
for (let i = 0; i < FRECUENCIAS.length - 1; i++) {
  v = siguienteFrecuencia(v)
  vistos.add(v)
}
check(vistos.size === FRECUENCIAS.length, "la rotación de Ajustes pasa por las tres")
check(siguienteFrecuencia(v) === FRECUENCIAS[0].valor, "y vuelve a la primera")

console.log("5. la diapo cae en la derivada elegida y ni una antes")
limpio()
for (let k = 1; k < FRECUENCIA_EN; k++) {
  if (tocaPreguntarFrecuencia(k)) {
    check(false, `no tendría que salir en la ${k}`)
    break
  }
}
check(!tocaPreguntarFrecuencia(FRECUENCIA_EN - 1), `en la ${FRECUENCIA_EN - 1} todavía no`)
check(tocaPreguntarFrecuencia(FRECUENCIA_EN), `en la ${FRECUENCIA_EN} sí`)

console.log("6. una sola vez en la vida, marcada al mostrarla")
limpio()
marcarFrecuenciaMostrada(FRECUENCIA_EN)
check(!tocaPreguntarFrecuencia(FRECUENCIA_EN), "no vuelve en la misma")
check(!tocaPreguntarFrecuencia(FRECUENCIA_EN + 1), "ni en la siguiente")
check(!tocaPreguntarFrecuencia(FRECUENCIA_EN * 10), "ni diez veces más tarde")
check(readPedidoState(PEDIDO_RANKING_FRECUENCIA).vistas === 1, "queda anotada una sola vez")
check(readFrecuenciaRanking() === FRECUENCIA_DEFAULT, "y mostrarla no cambia la preferencia")

console.log("7. el casillero está libre de verdad")
const ocupados: [number, string][] = [
  [HITO_PERFIL, "perfil"],
  [HITO_REGISTRO, "registro"],
  [HITO_REGISTRO + REGISTRO_REPITE, "la re-oferta de registro"],
  [CAFECITO_PRIMERA, "el primer cafecito"],
  [CAFECITO_EVERY, "cafecito"],
  [ENCUESTA_EN, "la varita"],
  [INSTALAR_PRIMERA, "instalar"],
]
for (const [n, quien] of ocupados) {
  check(FRECUENCIA_EN !== n, `no comparte derivada con ${quien} (${n})`)
}
check(
  FRECUENCIA_EN % RECLUTAS_CADA !== RECLUTAS_RESTO,
  `no comparte derivada con reclutas (${RECLUTAS_RESTO} cada ${RECLUTAS_CADA})`,
)

console.log("8. no mira el cooldown compartido ni lo escribe")
// Reclutas sale en la 14 y escribe el cooldown. Con la separación de cuatro de
// la varita, esta diapo se caería a la 18 y le quitaría la respuesta a la varita
// (sección 9). Por eso mide solo la igualdad de pantalla, y este check es el
// que avisa si alguien le agrega la distancia de buena fe.
limpio()
saveUltimoPedidoAt(RECLUTAS_RESTO)
check(tocaPreguntarFrecuencia(FRECUENCIA_EN), `con reclutas en la ${RECLUTAS_RESTO}, igual sale en la ${FRECUENCIA_EN}`)
limpio()
saveUltimoPedidoAt(FRECUENCIA_EN)
check(!tocaPreguntarFrecuencia(FRECUENCIA_EN), "pero si un pedido tomó ESA respuesta, no se apila")
limpio()
const antes = readUltimoPedidoAt()
marcarFrecuenciaMostrada(FRECUENCIA_EN)
check(readUltimoPedidoAt() === antes, "mostrarla no mueve el cooldown compartido")

console.log(`9. no le corre el turno a la varita de la ${ENCUESTA_EN}`)
limpio()
saveUltimoPedidoAt(RECLUTAS_RESTO)
check(tocaPreguntarFrecuencia(FRECUENCIA_EN), "la diapo sale en su derivada")
marcarFrecuenciaMostrada(FRECUENCIA_EN)
check(tocaEncuesta(ENCUESTA_EN), `y la varita sigue saliendo en la ${ENCUESTA_EN}`)
check(readUltimaPantalla() === FRECUENCIA_EN, "pero la derivada 15 queda tomada como pantalla")
check(!tocaEncuesta(FRECUENCIA_EN), "así que la varita no se le apila encima")

console.log("10. y la varita tampoco se la corre a ella")
limpio()
marcarEncuestaMostrada(ENCUESTA_EN)
check(!tocaPreguntarFrecuencia(ENCUESTA_EN), "si por algún motivo cayeran juntas, la 18 ya es de la varita")

console.log("11. la diapo respeta la igualdad de pantalla, no solo la distancia")
limpio()
marcarEncuestaMostrada(FRECUENCIA_EN)
check(!tocaPreguntarFrecuencia(FRECUENCIA_EN), "con otra pantalla en la misma respuesta, no sale")
check(tocaPreguntarFrecuencia(FRECUENCIA_EN + 1), "y sale en la siguiente")

console.log(fallos === 0 ? "\nTodo bien." : `\n${fallos} fallo(s).`)
process.exit(fallos === 0 ? 0 : 1)
