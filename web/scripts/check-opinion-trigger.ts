// Chequeo del disparador de las dos encuestas del juego.
//
// Corre con: bun run check:opinion
//
// Lo mismo que sus gemelos de reclutas e instalación: es una cuenta de módulo y
// un valor de localStorage, y equivocarse no se ve jugando sino semanas después,
// cuando la pregunta le salió a diez personas en vez de a cien.
//
// Las propiedades que la hacen soportable:
//
//   · cae donde se eligió, y la escalera crece como dice la tabla;
//   · las dos preguntas alternan y ninguna se come el turno de la otra;
//   · deja de insistirle a quien no contesta —y solo a esa persona—;
//   · no le corre el turno a los pedidos que convierten.
//
// **Lo que este chequeo ya NO asserta, y conviene saber por qué.** Hasta el
// 24/09 acá vivía «la cadencia tiene que ser más larga que la ventana del
// servidor», porque el ajuste de θ mira 20 respuestas hacia atrás y dos votos
// más cerca que eso se calculaban sobre evidencia compartida. Esa protección
// ahora es del servidor y es estructural: la ventana arranca en el último voto
// que cobró (`game_difficulty_votes.corte_ejercicio_id`). La sección 3 dejó
// escrito que la tabla DEPENDE de eso, así que si esa columna desaparece este
// chequeo es la miga de pan.

import { readOpinionSaltos } from "../src/app/derivadas/game-storage"
import {
  OPINION_CADENCIAS,
  OPINION_PRIMERA,
  OPINION_SALTOS_PARA_CORTAR,
  OPINION_SEPARACION,
  PREGUNTAS_DE_DIFICULTAD_AL_PRINCIPIO,
  anotarRespuesta,
  cadenciaDeOpinion,
  marcarPreguntaMostrada,
  preguntaDelTurno,
  tocaPreguntar,
} from "../src/app/derivadas/opinion-trigger"
import {
  INSTALAR_PRIMERA,
  marcarInstalarMostrado,
  tocaInstalar,
} from "../src/app/derivadas/instalacion-trigger"
import {
  ENCUESTA_EN,
  marcarEncuestaMostrada,
  tocaEncuesta,
} from "../src/app/derivadas/encuesta-trigger"
import {
  marcarRegistroMostrado,
  tocaRegistro,
} from "../src/app/derivadas/hitos-del-juego"
import {
  marcarReglasMostradas,
  tocaReglas,
} from "../src/app/derivadas/reglas-trigger"
import {
  RECLUTAS_CADA,
  RECLUTAS_RESTO,
  marcarReclutasMostrado,
  tocaReclutar,
} from "../src/app/derivadas/reclutas-trigger"
import {
  CAFECITO_EVERY,
  CAFECITO_PRIMERA,
  elegirTriggerDeCafecito,
  markCafecitoShown,
  shouldShowCafecito,
} from "../src/app/derivadas/cafecito-cta"

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

// El café con las funciones REALES del juego y no una copia de su regla, para
// poder simular el ladder entero y no solo la parte que toca este archivo.
//
// Era una copia hasta el 18/09, y el día que `shouldShowCafecito` sumó una
// condición —mantener distancia también de la pantalla de instalar, que no
// consume el cooldown compartido— la copia siguió contestando lo de antes. Una
// simulación que no llama al código que simula no prueba nada sobre él.
function tocaCafecito(total: number, esRecord = false): boolean {
  return shouldShowCafecito(
    total,
    elegirTriggerDeCafecito({ isRecord: esRecord, delta: 0, totalCorrectas: total }),
  )
}

/** La escalera sola, sin el resto del ladder, contestando siempre. */
function escalera(hasta: number): { n: number; que: string }[] {
  limpio()
  const turnos: { n: number; que: string }[] = []
  for (let n = 1; n <= hasta; n++) {
    const que = tocaPreguntar(n)
    if (que === null) continue
    turnos.push({ n, que })
    marcarPreguntaMostrada(n)
    anotarRespuesta(true)
  }
  return turnos
}

// La ventana del servidor (game/opinion.py :: VENTANA). Está escrita acá porque
// aquello es Python.
const VENTANA_DEL_SERVIDOR = 20

console.log(
  `valores: opinión desde la ${OPINION_PRIMERA}, cadencias ` +
    `[${OPINION_CADENCIAS.join(", ")}] (separación ${OPINION_SEPARACION}, ` +
    `corta a los ${OPINION_SALTOS_PARA_CORTAR} salteos, ` +
    `${PREGUNTAS_DE_DIFICULTAD_AL_PRINCIPIO} de dificultad al principio), ` +
    `reclutas cada ${RECLUTAS_CADA} resto ${RECLUTAS_RESTO}, ` +
    `café primera en ${CAFECITO_PRIMERA} y después cada ${CAFECITO_EVERY}, ` +
    `instalar desde la ${INSTALAR_PRIMERA}, varita en la ${ENCUESTA_EN}`,
)

console.log("1. la escalera cae donde dice la tabla y no se detiene")
const turnos = escalera(600)
const huecos = turnos.slice(1).map((t, i) => t.n - turnos[i].n)
// Los huecos esperados salen de la tabla y no están escritos a mano: si alguien
// cambia `OPINION_CADENCIAS`, esto sigue siendo verdad y lo que cambia es dónde
// caen los turnos. Lo que se está fijando es que la función USE la tabla.
const esperados = turnos.slice(1).map((_, i) => cadenciaDeOpinion(i + 1))
check(turnos[0]?.n === OPINION_PRIMERA, `la primera es en la ${OPINION_PRIMERA} (${turnos[0]?.n})`)
check(
  huecos.length === esperados.length && huecos.every((h, i) => h === esperados[i]),
  `los huecos siguen la tabla (${huecos.join(", ")})`,
)
check(
  turnos.length > OPINION_CADENCIAS.length,
  `y no hay tope de vidas: ${turnos.length} turnos en 600 derivadas`,
)
// El último valor de la tabla se repite para siempre, así que a partir de ahí
// los huecos tienen que ser todos iguales. Sin esto, un `min` mal puesto podría
// dejar la escalera creciendo sin límite y la pregunta no volvería nunca más.
const cola = huecos.slice(OPINION_CADENCIAS.length - 1)
check(
  cola.length > 1 && cola.every((h) => h === OPINION_CADENCIAS.at(-1)),
  `y en régimen vuelve cada ${OPINION_CADENCIAS.at(-1)} (${cola.join(", ")})`,
)
check(
  OPINION_CADENCIAS.every((c, i) => i === 0 || c >= OPINION_CADENCIAS[i - 1]),
  "la tabla nunca se aprieta: cada hueco es mayor o igual al anterior",
)

console.log("2. antes de la primera no sale")
limpio()
check(tocaPreguntar(0) === null, "no sale en cero")
check(tocaPreguntar(-3) === null, "ni con un número negativo")
check(
  Array.from({ length: OPINION_PRIMERA - 1 }, (_, i) => tocaPreguntar(i + 1) === null).every(
    Boolean,
  ),
  `no sale antes de la ${OPINION_PRIMERA}`,
)

console.log("3. la tabla arranca más corta que la ventana, y eso es deliberado")
// **Esto era al revés hasta el 24/09.** El primer hueco es de 10 y la ventana
// del ajuste mira hasta 20, así que las dos primeras votadas se calcularían
// sobre evidencia compartida si el servidor no cortara la ventana en el último
// voto que cobró (`router._corte_cobrado`).
//
// Queda asserted en esta dirección para que se lea como lo que es: una
// dependencia. Si alguien vuelve `_tanda_reciente` a un `LIMIT 20` sin piso,
// este chequeo sigue en verde y el bug vuelve — por eso el comentario nombra el
// archivo. Lo que sí se puede fijar de este lado es que en régimen el problema
// no existe ni con el corte apagado.
check(
  OPINION_CADENCIAS[0] < VENTANA_DEL_SERVIDOR,
  `el primer hueco (${OPINION_CADENCIAS[0]}) es menor que la ventana ` +
    `(${VENTANA_DEL_SERVIDOR}): depende del corte del servidor`,
)
check(
  (OPINION_CADENCIAS.at(-1) ?? 0) >= VENTANA_DEL_SERVIDOR,
  `pero en régimen (${OPINION_CADENCIAS.at(-1)}) ya no se pisa con la ventana`,
)

console.log("4. las dos preguntas alternan")
// Las tres primeras son de dificultad porque a esa altura la repetición todavía
// no pasó (2,4% en las primeras diez, contra 23-27% sobre 200). Desde ahí
// alternan, empezando por repetitividad.
const cuales = turnos.map((t) => t.que)
check(
  cuales.slice(0, PREGUNTAS_DE_DIFICULTAD_AL_PRINCIPIO).every((q) => q === "dificultad"),
  `las primeras ${PREGUNTAS_DE_DIFICULTAD_AL_PRINCIPIO} son de dificultad (${cuales
    .slice(0, PREGUNTAS_DE_DIFICULTAD_AL_PRINCIPIO)
    .join(", ")})`,
)
check(
  cuales[PREGUNTAS_DE_DIFICULTAD_AL_PRINCIPIO] === "repetitividad",
  "la primera de repetitividad es la que sigue",
)
const despues = cuales.slice(PREGUNTAS_DE_DIFICULTAD_AL_PRINCIPIO)
check(
  despues.every((q, i) => q !== despues[i - 1] || i === 0),
  `y desde ahí no se repiten dos seguidas (${despues.join(", ")})`,
)
check(
  cuales.filter((q) => q === "dificultad").length >
    cuales.filter((q) => q === "repetitividad").length,
  "dificultad sale más veces, que es lo que la ventaja de arranque compra",
)
// La función de turno es pura y tiene que poder leerse sola, sin localStorage.
check(
  Array.from({ length: 40 }, (_, i) => preguntaDelTurno(i)).filter(
    (q) => q === "repetitividad",
  ).length > 0,
  "preguntaDelTurno reparte los dos tipos sin tocar el storage",
)

console.log("5. deja de insistirle a quien no contesta, y solo a esa persona")
limpio()
// Tres salteos seguidos y se apaga. Es el reemplazo del tope de tres
// apariciones, y la diferencia es que este cuenta lo que la persona IGNORA.
let vistas = 0
for (let n = 1; n <= 300 && vistas < 10; n++) {
  if (tocaPreguntar(n) === null) continue
  vistas++
  marcarPreguntaMostrada(n)
  anotarRespuesta(false)
}
check(
  vistas === OPINION_SALTOS_PARA_CORTAR,
  `salteando siempre, sale ${OPINION_SALTOS_PARA_CORTAR} veces y se apaga (${vistas})`,
)
check(readOpinionSaltos() === OPINION_SALTOS_PARA_CORTAR, "la racha quedó anotada")
// Y una respuesta la borra entera: no es un tope de vidas disfrazado.
anotarRespuesta(true)
check(readOpinionSaltos() === 0, "una respuesta borra la racha entera")
check(
  escalera(600).length > OPINION_SALTOS_PARA_CORTAR,
  "a quien contesta no se le apaga nunca",
)
// El caso mixto: saltea dos, contesta una, saltea dos. Nunca llega a tres
// seguidos, así que nunca se apaga.
limpio()
let mixtas = 0
const patron = [false, false, true, false, false, true]
for (let n = 1; n <= 600 && mixtas < 12; n++) {
  if (tocaPreguntar(n) === null) continue
  marcarPreguntaMostrada(n)
  anotarRespuesta(patron[mixtas % patron.length])
  mixtas++
}
// El tope es cuántos turnos caben en 600 derivadas, no doce: con la escalera
// creciente son los mismos que le salen a quien contesta siempre. Lo que se
// prueba es que salteando de a dos no se apaga NUNCA, y la vara es esa.
check(
  mixtas === escalera(600).length,
  `saltear de a dos no la apaga (${mixtas} turnos, los mismos que contestando)`,
)

console.log("6. no le corre el turno a reclutar ni al café")
// El ladder entero en el orden real: las encuestas van ÚLTIMAS y no consumen el
// cooldown compartido. Las dos cosas juntas son lo que garantiza que no le
// saquen nada a los pedidos que sí convierten.
limpio()
const pedidos: { n: number; que: string }[] = []
// El orden es el de `advanceAfterAnswer` en mobile-flow.tsx, escalón por
// escalón: reglas, registro, instalar, café, reclutas, varita y por último las
// dos de la escalera. Hasta el 24/09 acá solo estaban café y reclutas, y por eso
// el número que imprimía no era el que se ve jugando.
//
// Brazo `control` (las tres reglas juntas en la 1) y jugador invitado en un
// teléfono, que es el caso con MÁS pantallas y por lo tanto el peor para las
// colisiones. `puedeOfrecerInstalar` no se llama porque necesita navegador: el
// trigger se puede correr solo, que es justo para lo que se lo separó.
for (let n = 1; n <= 200; n++) {
  const esRecord = n % 23 === 0
  if (tocaReglas(n)) {
    pedidos.push({ n, que: "reglas" })
    marcarReglasMostradas(n)
    continue
  }
  if (tocaRegistro(n)) {
    pedidos.push({ n, que: "registro" })
    marcarRegistroMostrado(n)
    continue
  }
  if (tocaInstalar(n)) {
    pedidos.push({ n, que: "instalar" })
    marcarInstalarMostrado(n)
    continue
  }
  if (tocaCafecito(n, esRecord)) {
    pedidos.push({ n, que: "cafecito" })
    markCafecitoShown(n)
    continue
  }
  if (tocaReclutar(n)) {
    pedidos.push({ n, que: "reclutas" })
    marcarReclutasMostrado(n)
    continue
  }
  if (tocaEncuesta(n)) {
    pedidos.push({ n, que: "varita" })
    marcarEncuestaMostrada(n)
    continue
  }
  const que = tocaPreguntar(n)
  if (que !== null) {
    pedidos.push({ n, que })
    marcarPreguntaMostrada(n)
    anotarRespuesta(true)
  }
}
console.log(`    ladder: ${pedidos.map((p) => `${p.n}:${p.que}`).join(" ")}`)
const reclutas = pedidos.filter((p) => p.que === "reclutas").map((p) => p.n)
check(
  reclutas.includes(RECLUTAS_RESTO),
  `reclutar sigue saliendo en la ${RECLUTAS_RESTO} (${reclutas.slice(0, 4).join(", ")})`,
)
const cafes = pedidos.filter((p) => p.que === "cafecito").map((p) => p.n)
check(cafes.length > 0, `el café sale igual (${cafes.slice(0, 4).join(", ")})`)
const encuestas = pedidos.filter(
  (p) => p.que === "dificultad" || p.que === "repetitividad",
)
check(
  encuestas.length > 3,
  `y las encuestas salen varias veces dentro del ladder (${encuestas
    .map((p) => `${p.n}:${p.que.slice(0, 3)}`)
    .join(", ")})`,
)
// El número que documenta context/features-catalog.md. Si se mueve, el mapa de
// hitos de ese documento quedó mintiendo.
check(
  encuestas[0]?.n === 28,
  `la primera cae en la 28 como dice el mapa de hitos (${encuestas[0]?.n})`,
)
// Ninguna respuesta muestra dos diapos: cada una ocupa el turno sola. Es la
// regla 3 del mapa de hitos, y con la escalera corta es la que más riesgo corre.
check(
  new Set(pedidos.map((p) => p.n)).size === pedidos.length,
  "ninguna derivada dispara dos pedidos a la vez",
)
// Y tampoco tres pantallas en tres derivadas seguidas, que es lo que el mapa
// existe para no tener.
const seguidas = pedidos.filter(
  (p, i) => i >= 2 && p.n - pedidos[i - 2].n === 2,
)
check(seguidas.length === 0, "ni tres pantallas en tres derivadas seguidas")

console.log("7. mostrarla la anota, contestarla no hace falta")
// Se marca al MOSTRARLA. Si solo contara el voto, a quien la saltea se le
// aparecería en la derivada siguiente y para siempre.
limpio()
check(tocaPreguntar(OPINION_PRIMERA) !== null, "sale la primera vez")
marcarPreguntaMostrada(OPINION_PRIMERA)
check(
  tocaPreguntar(OPINION_PRIMERA + 1) === null,
  "y no vuelve en la siguiente aunque no se haya contestado",
)

console.log("8. si no se puede anotar, se sigue ofreciendo")
// localStorage puede estar bloqueado (modo privado, permisos). El lado hacia el
// que conviene errar es mostrarla una vez de más — y, con la racha, NO apagarla.
limpio()
const store = (
  globalThis as unknown as { window: { localStorage: { setItem: unknown } } }
).window.localStorage
const setItem = store.setItem
store.setItem = () => {
  throw new Error("QuotaExceeded")
}
marcarPreguntaMostrada(OPINION_PRIMERA)
anotarRespuesta(false)
check(tocaPreguntar(OPINION_PRIMERA) !== null, "sigue ofreciéndose si no se pudo anotar")
check(readOpinionSaltos() === 0, "y una racha que no se pudo guardar no apaga nada")
store.setItem = setItem

console.log(fallos === 0 ? "\ntodos los chequeos pasaron" : `\n${fallos} fallos`)
process.exit(fallos === 0 ? 0 : 1)
