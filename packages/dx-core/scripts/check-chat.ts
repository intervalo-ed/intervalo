// Chequeo de lo puro del chat: el intercalado, el enfriamiento, el texto de las
// novedades y las marcas de visto.
//
// Corre con: bun run scripts/check-chat.ts

import { intercalar, MAX_POR_MINUTO, restanteDe, textoPlano, VENTANA_MS } from "../src/juego/chat"
import { contarSinVer, ultimoIdDe } from "../src/juego/UseNovedades"

let fallos = 0
function ok(cond: boolean, que: string) {
  if (!cond) {
    fallos++
    console.log(`FALLA: ${que}`)
  }
}

const ev = (id: number, at: number) =>
  ({ id, at, text: "{a} ayudó a {u0}", emoji: "", actor_alias: null, actor_b_alias: null, universities: ["UTN"], seconds_ago: 0 }) as never
const msg = (id: number, at: number) =>
  ({ id, at, alias: "x", level: 1, university: null, text: "hola", is_mine: false, seconds_ago: 0 }) as never

const lineas = intercalar({ events: [ev(2, 300), ev(1, 100)], messages: [msg(5, 200)] })
ok(lineas.map((l) => l.clave).join(",") === "e1,m5,e2", "intercala de la más vieja a la más nueva")

ok(textoPlano({ text: "{a} y {b} por {u0}/{u1}", actor_alias: "ana", actor_b_alias: null, universities: ["UBA"] }) === "ana y alguien por UBA/", "reemplaza marcadores")

const ahora = 1_000_000
ok(restanteDe({ envios: [], ahora }) === 0, "sin envíos no hay espera")
const llenos = Array.from({ length: MAX_POR_MINUTO }, (_, i) => ahora - 10_000 + i)
ok(restanteDe({ envios: llenos, ahora }) === Math.ceil((VENTANA_MS - 10_000) / 1000), "ventana llena espera al más viejo")
ok(restanteDe({ envios: llenos.map((t) => t - VENTANA_MS), ahora }) === 0, "los viejos se caen de la cuenta")

ok(ultimoIdDe([]) === null && ultimoIdDe([{ id: 3 }, { id: 7 }, { id: 5 }]) === 7, "último id")
ok(contarSinVer({ items: [{ id: 3 }, { id: 7 }], visto: null }) === 0, "sin marca no hay sin ver")
ok(contarSinVer({ items: [{ id: 3 }, { id: 7 }, { id: 9 }], visto: 3 }) === 2, "cuenta por encima de la marca")

console.log(fallos === 0 ? "todo ok" : `${fallos} fallos`)
process.exit(fallos === 0 ? 0 : 1)
