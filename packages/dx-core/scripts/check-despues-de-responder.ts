// Chequeo de la escalera de después de responder.
//
// Corre con: bun run check:despues
//
// La escalera salió de mobile-flow.tsx para que la app nativa recorra el mismo
// orden. Lo que se fija acá es ese orden: qué sale en cada hito, qué le gana a
// qué, y las dos cosas que la app nativa cambia —no hay cafecito, y no siempre
// se puede ofrecer instalar ni pedir avisos— sin correr nada de lo demás.

import {
  NOVEDADES_MINIMAS,
  despuesDeResponder,
  type EntradaDespuesDeResponder,
  type PasoDespuesDeResponder,
} from "../src/juego/despues-de-responder"
import { HITO_PERFIL, HITO_REGISTRO } from "../src/juego/hitos-del-juego"
import { REGLAS_DE_LA_DIAPO, REGLAS_TRAS } from "../src/juego/reglas-trigger"
import { INSTALAR_PRIMERA } from "../src/juego/instalacion-trigger"
import { RECLUTAS_RESTO } from "../src/juego/reclutas-trigger"
import { FRECUENCIA_EN, marcarFrecuenciaMostrada } from "../src/juego/ranking-frecuencia"
import { ENCUESTA_EN } from "../src/juego/encuesta-trigger"
import { OPINION_PRIMERA } from "../src/juego/opinion-trigger"
import { marcarPwaDesde, readPwaDesde } from "../src/juego/game-storage"
import { crearAlmacenEnMemoria, instalarAlmacen } from "../src/almacen/key-value-store"

const guardado = new Map<string, string>()
instalarAlmacen({ store: crearAlmacenEnMemoria({ datos: guardado }) })

let fallos = 0
function check(ok: boolean, label: string) {
  console.log(`  [${ok ? "ok" : "FAIL"}] ${label}`)
  if (!ok) fallos++
}

type Args = Parameters<typeof despuesDeResponder>[0]
type Opciones = Omit<Partial<Args>, "respuesta" | "jugador"> & {
  respuesta?: Partial<Args["respuesta"]>
  jugador?: Partial<NonNullable<Args["jugador"]>> | null
}

// Lo de base no dispara nada por sí solo: registrado, con @ elegido y con
// universidad, las reglas ya vistas, sin novedades y sin cafecito.
function decidir({ respuesta, jugador, ...resto }: Opciones = {}) {
  return despuesDeResponder({
    entrada: null,
    yaPreguntoUsername: false,
    reglasMostradas: true,
    yaPreguntoPerfil: false,
    yaPreguntoRegistro: false,
    sinVer: 0,
    frecuenciaRanking: "cada",
    cafecito: null,
    puedeOfrecerInstalar: true,
    puedeOfrecerNotificaciones: false,
    ...resto,
    respuesta: {
      correct: true,
      rank_before: null,
      rank_after: null,
      exercises_correct: 1,
      correct_today: 1,
      ...respuesta,
    },
    jugador:
      jugador === null
        ? null
        : { is_guest: false, alias_is_generated: false, university: "UBA", ...jugador },
  })
}

const total = (n: number) => ({ respuesta: { exercises_correct: n } })
const invitado = { jugador: { is_guest: true, alias_is_generated: true } }
const pasos = (o: Opciones) => decidir(o).paso

console.log("\n1. errada y correcta")
guardado.clear()
{
  const r = decidir({ respuesta: { correct: false } })
  check(r.paso === "siguiente-ejercicio", `errada → ${r.paso}`)
  check(!r.saltaRanking, "y no saltea un ranking que no le tocaba")
}
{
  const r = decidir({ respuesta: { rank_before: 10, rank_after: 7 } })
  check(r.paso === "ranking", `correcta con «cada» → ${r.paso}`)
  check(!r.saltaRanking, "sin saltear")
  check(
    r.paso === "ranking" &&
      r.subida?.desde === 10 &&
      r.subida.hasta === 7 &&
      r.subida.delta === 3,
    "subió de 10 a 7: la subida va con desde, hasta y delta",
  )
}
{
  const r = decidir({ respuesta: { rank_before: 7, rank_after: 9 } })
  check(r.paso === "ranking" && r.subida === null, "bajó: ranking sin subida")
  const s = decidir({})
  check(s.paso === "ranking" && s.subida === null, "sin puesto: ranking sin subida")
}
check(
  pasos({ ...invitado, respuesta: { correct: false, exercises_correct: 1 } }) ===
    "siguiente-ejercicio",
  "errada de un invitado con @ generado: no pide el @",
)

console.log("\n2. la frecuencia que saltea el ranking")
guardado.clear()
{
  const r = decidir({ frecuenciaRanking: "cada5", ...total(3) })
  check(r.saltaRanking, "«cada5» en la 3 saltea el ranking")
  check(r.paso === "siguiente-ejercicio", `y sigue → ${r.paso}`)
  const c = decidir({ frecuenciaRanking: "cada5", ...total(5) })
  check(!c.saltaRanking && c.paso === "ranking", "«cada5» en la 5 pasa por el ranking")
  const b = decidir({
    frecuenciaRanking: "subo",
    respuesta: { rank_before: 4, rank_after: 6 },
  })
  check(b.saltaRanking, "«subo» sin subir saltea")
  const s = decidir({
    frecuenciaRanking: "subo",
    respuesta: { rank_before: 6, rank_after: 4 },
  })
  check(!s.saltaRanking && s.paso === "ranking", "«subo» subiendo pasa")
}
{
  const r = decidir({ frecuenciaRanking: "subo", ...invitado, respuesta: { rank_before: 4, rank_after: 6 } })
  check(
    r.saltaRanking && r.paso === "username",
    `salteado, sigue como si saliera del ranking: el @ → ${r.paso}`,
  )
  const g = decidir({ frecuenciaRanking: "cada5", reglasMostradas: false, ...total(REGLAS_TRAS) })
  check(g.saltaRanking && g.paso === "reglas", `y las reglas en su hito → ${g.paso}`)
  const n = decidir({ frecuenciaRanking: "cada5", sinVer: NOVEDADES_MINIMAS, ...total(1) })
  check(n.saltaRanking && n.paso === "novedades", `y las novedades → ${n.paso}`)
  const e = decidir({ frecuenciaRanking: "cada5", respuesta: { correct: false } })
  check(!e.saltaRanking, "una errada nunca «saltea» el ranking")
}

console.log("\n3. el @, después del ranking")
guardado.clear()
check(pasos({ entrada: "ranking", ...invitado }) === "username", "invitado con @ generado → username")
check(
  pasos({ entrada: "ranking", ...invitado, yaPreguntoUsername: true }) !== "username",
  "ya preguntado en la sesión: no vuelve",
)
check(
  pasos({ entrada: "ranking", jugador: { is_guest: true, alias_is_generated: false } }) !==
    "username",
  "con @ elegido: no",
)
check(
  pasos({ entrada: "ranking", jugador: { is_guest: false, alias_is_generated: true } }) !==
    "username",
  "registrado: no",
)
check(pasos({ entrada: "ranking", jugador: null }) !== "username", "sin jugador: no")

console.log("\n4. las reglas")
guardado.clear()
{
  const r = decidir({ entrada: "ranking", reglasMostradas: false, ...total(REGLAS_TRAS) })
  check(r.paso === "reglas", `en la ${REGLAS_TRAS}, al salir del ranking → ${r.paso}`)
  check(
    r.paso === "reglas" && r.cuales === REGLAS_DE_LA_DIAPO,
    "con las reglas de la diapo",
  )
}
check(pasos({ reglasMostradas: false, entrada: "ranking", ...total(REGLAS_TRAS - 1) }) !== "reglas", `en la ${REGLAS_TRAS - 1} todavía no`)
check(
  pasos({ entrada: "ranking", ...total(REGLAS_TRAS) }) !== "reglas",
  "ya mostradas en la sesión: no",
)
check(
  pasos({ reglasMostradas: false, entrada: "novedades", ...total(REGLAS_TRAS) }) !== "reglas",
  "solo al salir del ranking",
)
check(
  pasos({ reglasMostradas: false, entrada: "ranking", ...invitado, ...total(REGLAS_TRAS) }) === "username",
  "el @ le gana a las reglas",
)

console.log("\n5. las novedades")
guardado.clear()
check(
  pasos({ entrada: "ranking", sinVer: NOVEDADES_MINIMAS }) === "novedades",
  `${NOVEDADES_MINIMAS} sin ver → novedades`,
)
check(
  pasos({ entrada: "ranking", sinVer: NOVEDADES_MINIMAS - 1 }) !== "novedades",
  `${NOVEDADES_MINIMAS - 1} no alcanzan`,
)
check(
  pasos({ reglasMostradas: false, entrada: "ranking", sinVer: NOVEDADES_MINIMAS, ...total(REGLAS_TRAS) }) === "reglas",
  "las reglas le ganan a las novedades",
)
check(
  pasos({ entrada: "novedades", sinVer: 99 }) !== "novedades",
  "recién cerradas no se reabren",
)

console.log("\n6. perfil y registro")
guardado.clear()
const sinUni = { jugador: { university: null } }
check(
  pasos({ entrada: "ranking", ...sinUni, ...total(HITO_PERFIL) }) === "perfil",
  `sin universidad en la ${HITO_PERFIL} → perfil`,
)
check(
  pasos({ entrada: "ranking", ...sinUni, ...total(HITO_PERFIL - 1) }) !== "perfil",
  `en la ${HITO_PERFIL - 1} todavía no`,
)
check(
  pasos({ entrada: "ranking", ...sinUni, yaPreguntoPerfil: true, ...total(HITO_PERFIL) }) !==
    "perfil",
  "ya preguntado en la sesión: no",
)
check(
  pasos({ entrada: "cafecito", ...sinUni, ...total(HITO_PERFIL) }) !== "perfil",
  "al salir de otra diapo que no es ranking ni novedades: no",
)
check(
  pasos({ entrada: "novedades", ...sinUni, ...total(HITO_PERFIL) }) === "perfil",
  "al salir de las novedades: sí",
)
const guest = { jugador: { is_guest: true } }
check(
  pasos({ entrada: "ranking", ...guest, ...total(HITO_REGISTRO) }) === "registro",
  `invitado en la ${HITO_REGISTRO} → registro`,
)
check(
  pasos({ entrada: "ranking", ...total(HITO_REGISTRO) }) !== "registro",
  "registrado: no",
)
check(
  pasos({ entrada: "ranking", ...guest, yaPreguntoRegistro: true, ...total(HITO_REGISTRO) }) !==
    "registro",
  "ya preguntado en la sesión: no",
)
check(
  pasos({ entrada: "ranking", jugador: { is_guest: true, university: null }, ...total(HITO_REGISTRO) }) ===
    "perfil",
  "el perfil le gana al registro",
)

console.log("\n7. el cafecito")
guardado.clear()
const cafe = { cafecito: { trigger: "milestone" as const, toca: true } }
{
  const r = decidir({ entrada: "ranking", ...cafe, respuesta: { exercises_correct: 20, correct_today: 7 } })
  check(
    r.paso === "cafecito" && r.trigger === "milestone" && r.correctToday === 7,
    `con motivo y turno → cafecito, con su motivo y las de hoy (${r.paso})`,
  )
}
check(
  pasos({ entrada: "ranking", cafecito: { trigger: "record", toca: false }, ...total(20) }) !==
    "cafecito",
  "con motivo y sin turno: no",
)
check(pasos({ entrada: "cafecito", ...cafe, ...total(20) }) !== "cafecito", "recién cerrado: no")
check(
  pasos({ entrada: "ranking", ...cafe, ...sinUni, ...total(20) }) !== "cafecito",
  "sin universidad y sin haberla preguntado: se calla",
)
check(
  pasos({ entrada: "ranking", ...cafe, ...sinUni, yaPreguntoPerfil: true, ...total(20) }) ===
    "cafecito",
  "sin universidad pero ya preguntada: sale igual",
)
{
  // Apagado (la app nativa) es exactamente lo mismo que «no le toca»: el resto
  // de la escalera no se entera.
  let iguales = true
  let nunca = true
  for (const entrada of ["ranking", null, "novedades", "reclutas"] as const) {
    for (let n = 1; n <= 80; n++) {
      for (const jugador of [{}, { university: null }, { is_guest: true }]) {
        guardado.clear()
        const apagado = decidir({ entrada, jugador, ...total(n) })
        const sinTurno = decidir({
          entrada,
          jugador,
          cafecito: { trigger: "milestone", toca: false },
          ...total(n),
        })
        const prendido = decidir({ entrada, jugador, ...cafe, ...total(n) })
        if (apagado.paso === "cafecito") nunca = false
        if (JSON.stringify(apagado) !== JSON.stringify(sinTurno)) iguales = false
        if (prendido.paso !== "cafecito" && JSON.stringify(prendido) !== JSON.stringify(apagado))
          iguales = false
      }
    }
  }
  check(nunca, "apagado (null) no da cafecito nunca, en 1..80")
  check(iguales, "y no cambia nada de lo que sale cuando el cafecito no está")
}

console.log("\n8. instalar y avisos")
// Adentro de la app instalada ya no hay nada que instalar.
const enLaApp = { puedeOfrecerInstalar: false, puedeOfrecerNotificaciones: true }
guardado.clear()
check(
  pasos({ entrada: "ranking", ...total(INSTALAR_PRIMERA) }) === "instalar",
  `en la ${INSTALAR_PRIMERA}, si se puede → instalar`,
)
check(
  pasos({ entrada: "instalar", ...total(INSTALAR_PRIMERA) }) !== "instalar",
  "recién cerrado: no",
)
{
  let nunca = true
  for (let n = 1; n <= 120; n++) {
    guardado.clear()
    if (pasos({ entrada: "ranking", puedeOfrecerInstalar: false, ...total(n) }) === "instalar")
      nunca = false
  }
  check(nunca, "sin poder ofrecerlo no sale nunca, en 1..120")
}
guardado.clear()
{
  const r = decidir({ entrada: "ranking", ...enLaApp, ...total(30) })
  check(r.anotarPwaDesde, "en la app instalada pide anotar desde cuándo")
  check(r.paso !== "notificaciones", "recién instalada no pide avisos")
  check(readPwaDesde() === null, "y no escribe: lo anota quien llama")
}
guardado.clear()
marcarPwaDesde(27)
{
  const r = decidir({ entrada: "ranking", ...enLaApp, ...total(30) })
  check(
    r.paso === "notificaciones" && r.enPwa === 3,
    `tres derivadas adentro de la app → avisos con enPwa 3 (${r.paso})`,
  )
  check(
    pasos({ entrada: "notificaciones", ...enLaApp, ...total(30) }) !==
      "notificaciones",
    "recién cerrado: no",
  )
}
{
  let nunca = true
  let sinAnotar = true
  for (let n = 1; n <= 120; n++) {
    guardado.clear()
    marcarPwaDesde(0)
    const r = decidir({ entrada: "ranking", puedeOfrecerInstalar: false, ...total(n) })
    if (r.paso === "notificaciones") nunca = false
    if (r.anotarPwaDesde) sinAnotar = false
  }
  check(nunca, "sin poder pedirlos no salen nunca, en 1..120")
  check(sinAnotar, "y tampoco pide anotar nada")
}

console.log("\n9. los hitos del final")
guardado.clear()
const sinInstalar = { puedeOfrecerInstalar: false }
check(
  pasos({ entrada: "ranking", ...total(RECLUTAS_RESTO) }) === "reclutas",
  `en la ${RECLUTAS_RESTO} → reclutas`,
)
{
  const r = decidir({ entrada: "ranking", ...total(RECLUTAS_RESTO) })
  check(r.paso === "reclutas" && r.trigger === "hito", "con motivo «hito»")
}
check(pasos({ entrada: "reclutas", ...total(RECLUTAS_RESTO) }) !== "reclutas", "recién cerrado: no")
check(
  pasos({ entrada: "ranking", ...total(FRECUENCIA_EN) }) === "frecuencia",
  `en la ${FRECUENCIA_EN} → frecuencia`,
)
check(
  pasos({ entrada: "frecuencia", ...total(FRECUENCIA_EN) }) !== "frecuencia",
  "recién cerrado: no",
)
// La de frecuencia (en la 15) sigue pendiente en un almacén vacío y va antes.
marcarFrecuenciaMostrada(FRECUENCIA_EN)
check(
  pasos({ entrada: "ranking", ...total(ENCUESTA_EN) }) === "encuesta",
  `en la ${ENCUESTA_EN} → encuesta`,
)
check(pasos({ entrada: "encuesta", ...total(ENCUESTA_EN) }) !== "encuesta", "recién cerrado: no")
guardado.clear()
check(
  pasos({ entrada: "ranking", ...total(OPINION_PRIMERA) }) === "opinion",
  `en la ${OPINION_PRIMERA} → opinion (dificultad)`,
)
check(
  pasos({ entrada: "opinion", ...total(OPINION_PRIMERA) }) === "siguiente-ejercicio",
  "recién cerrada la de dificultad: ni ella ni la otra",
)
check(
  pasos({ entrada: "repetitividad", ...total(OPINION_PRIMERA) }) === "siguiente-ejercicio",
  "recién cerrada la de repetitividad: tampoco",
)
check(
  pasos({ entrada: "ranking", ...cafe, ...sinInstalar, ...total(RECLUTAS_RESTO) }) === "cafecito",
  "el cafecito le gana a reclutas en la misma respuesta",
)
check(
  pasos({ entrada: "ranking", ...cafe, ...total(INSTALAR_PRIMERA) }) === "instalar",
  "instalar le gana al cafecito",
)

console.log("\n10. lo que se acaba de cerrar no se vuelve a abrir")
{
  const mismo: Record<Exclude<EntradaDespuesDeResponder, null | "milestone">, PasoDespuesDeResponder["paso"][]> = {
    ranking: ["ranking"],
    username: ["username"],
    reglas: ["reglas"],
    novedades: ["novedades"],
    cafecito: ["cafecito"],
    reclutas: ["reclutas"],
    instalar: ["instalar"],
    notificaciones: ["notificaciones"],
    frecuencia: ["frecuencia"],
    encuesta: ["encuesta"],
    opinion: ["opinion", "repetitividad"],
    repetitividad: ["opinion", "repetitividad"],
  }
  for (const [entrada, prohibidos] of Object.entries(mismo)) {
    let ok = true
    for (let n = 1; n <= 80 && ok; n++) {
      for (const jugador of [{}, { is_guest: true, alias_is_generated: true, university: null }]) {
        guardado.clear()
        marcarPwaDesde(0)
        const r = decidir({
          entrada: entrada as EntradaDespuesDeResponder,
          jugador,
          ...cafe,
          puedeOfrecerNotificaciones: true,
          sinVer: 99,
          ...total(n),
        })
        if (prohibidos.includes(r.paso)) ok = false
      }
    }
    check(ok, `entrada «${entrada}» no reabre ${prohibidos.join(" ni ")}, en 1..80`)
  }
}

console.log(fallos === 0 ? "\ntodo ok" : `\n${fallos} fallos`)
process.exit(fallos === 0 ? 0 : 1)
