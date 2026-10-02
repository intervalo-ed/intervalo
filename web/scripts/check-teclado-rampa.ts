// Chequeo del teclado que crece (`dx-rampa-1`).
//
// Corre con: bun run check:teclado
//
// El backend desbloquea teclas por NECESIDAD: la derivada de 9/x es −9/x², así
// que al servir ese ejercicio `keyboard.py :: unlock` suma `frac` y `sq` y las
// manda en `keys`. Si el teclado no las dibuja, la persona recibe un ejercicio
// que no puede contestar y no hay nada en pantalla que explique por qué.
//
// Eso pasó. El inventario desbloqueado se dibujaba en DOS lugares —las primeras
// ocho adentro del pad, el resto en la fila ancha de arriba— y la rampa
// reemplaza el pad entero, así que quien estaba en un brazo tratado con ocho
// teclas o menos no veía NINGUNA. Son tres de cada cuatro jugadores nuevos
// (`rampa.con_rampa`: teclado, ayudas y bienvenida).
//
// Lo que se fija acá, en orden de importancia:
//
//   1. **No se pierde ninguna tecla.** Para todo inventario posible, lo que se
//      dibuja es exactamente lo que el servidor mandó. Es el chequeo que
//      hubiera frenado el bug.
//   2. **Ninguna se dibuja dos veces.** Es el modo de fallar del arreglo: si el
//      inventario entra a las filas empaquetadas Y a la fila ancha, aparece
//      duplicado.
//   3. **El teclado entra en la card.** Ningún estado puede pasar del alto que
//      deja una pantalla de 667, porque la card es `overflow-hidden` y lo que
//      se recorta es el marcador de arriba de la fórmula — un síntoma que no
//      señala al teclado.
//   4. **Los ids del backend tienen dibujo.** Un id sin entrada en el mapa se
//      descarta en silencio, que es la otra forma de servir un ejercicio sin
//      con qué escribirlo.

import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import {
  DYNAMIC,
  DYN_ONE_ROW_MAX,
  FIJA_A_TECLAS,
  FIJAS_TOTAL,
  PAD_DYNAMIC_SLOTS,
  RAMPA_FILAS_APRETADO,
  RAMPA_FILAS_MAX,
  RAMPA_GAP_REM,
  RAMPA_MIN_COL,
  RAMPA_ROW,
  RAMPA_ROW_APRETADO,
  ROW_VARS,
  altoDeRampa,
  anchoDeRampa,
  filasDeRampa,
  rampaDibujada,
  RAMPA_FILAS_A_DEFINITIVO,
  type EntradaDeTecla,
} from "../src/app/derivadas/math-keyboard"

let fallos = 0
function check(ok: boolean, label: string) {
  console.log(`  [${ok ? "ok" : "FAIL"}] ${label}`)
  if (!ok) fallos++
}

// ── Las medidas, todas en píxeles y todas con de dónde salen ────────────────
//
// El presupuesto es lo que la card le deja al teclado en la pantalla chica de
// referencia (iPhone SE / iPhone 8, 375×667), medido en el navegador:
//
//   card                                    448
//   − pt-4 16 − marcador 36 − gap 12
//     − fórmula (PROMPT_H, mínimo) 80
//     − gap 12 − campo (CAMPO_H) 80         −236
//   ────────────────────────────────────────────
//   para el teclado                          212
//
// Los 80 de la fórmula son su PISO (`min-h-20` en exercise-card.tsx): es el
// único elemento elástico, así que el teclado le come alto hasta ahí y de ahí
// en adelante `overflow-hidden` recorta.
const PRESUPUESTO = 212
// El `pt-2 pb-4` que el teclado se pone a sí mismo en pantallas de hasta 700 px
// de alto (la variante `[@media(max-height:700px)]` de math-keyboard.tsx).
const AIRE_PROPIO = 8 + 16
const PX_POR_REM = 16
const GAP = RAMPA_GAP_REM * PX_POR_REM

/** Los rem de una medida CSS, resolviendo `var(--kb-row)` contra `ROW_VARS`.
 *
 *  El alto apretado es una variable CSS a propósito —el teclado de escritorio
 *  usa otra— así que para sumar píxeles hay que resolverla, y resolverla contra
 *  la declaración de verdad y no contra un número copiado acá. */
function aPx(medida: string): number {
  if (medida === "var(--kb-row)") {
    const m = ROW_VARS.match(/\[--kb-row:([\d.]+)rem\]/)
    if (!m) throw new Error(`ROW_VARS no declara --kb-row: ${ROW_VARS}`)
    return Number(m[1]) * PX_POR_REM
  }
  const m = medida.match(/^([\d.]+)rem$/)
  if (!m) throw new Error(`medida que no sé convertir: ${medida}`)
  return Number(m[1]) * PX_POR_REM
}

function altoTotal(filas: EntradaDeTecla[][]): number {
  const alto = aPx(altoDeRampa(filas.length))
  return AIRE_PROPIO + filas.length * alto + Math.max(0, filas.length - 1) * GAP
}

/** El ancho de tecla que resulta, en una pantalla de 375.
 *
 *  El canal son los 375 menos el `px-4` del teclado (32) y el `px-5` del flujo
 *  del teléfono (`mobile-flow.tsx`, 2×17 por el centrado de la card): 309 px
 *  medidos en el navegador, no deducidos. */
const CANAL_375 = 309
function anchoPx(filas: EntradaDeTecla[][]): number {
  const cols = Math.max(RAMPA_MIN_COL, ...filas.map((f) => f.length))
  return (CANAL_375 - (cols - 1) * GAP) / cols
}

const IDS_FIJOS = Object.keys(FIJA_A_TECLAS)
const IDS_DINAMICOS = Object.keys(DYNAMIC)

function dinamicas(n: number): EntradaDeTecla[] {
  return IDS_DINAMICOS.slice(0, n).map((id) => ({
    id,
    key: DYNAMIC[id],
    nueva: false,
  }))
}

/** Las teclas que el servidor mandó, como multiconjunto de ids.
 *
 *  `f:()` cuenta DOS veces: es un solo id que dibuja el paréntesis que abre y el
 *  que cierra. Las tres de corregir —retroceso y las dos flechas— van con id
 *  vacío porque no se desbloquean nunca. */
function esperadas(fijas: string[], dins: EntradaDeTecla[]): string[] {
  const out: string[] = []
  for (const id of IDS_FIJOS) {
    if (fijas.includes(id)) out.push(...FIJA_A_TECLAS[id].map(() => id))
  }
  for (const d of dins) out.push(d.id)
  out.push("", "", "")
  return out.sort()
}

function dibujadas(filas: EntradaDeTecla[][]): string[] {
  return filas.flat().map((e) => e.id).sort()
}

const iguales = (a: string[], b: string[]) =>
  a.length === b.length && a.every((v, i) => v === b[i])

// ── 1 · Ninguna tecla se pierde ni se repite ────────────────────────────────
//
// Exhaustivo sobre los 65.534 inventarios de fijas posibles (todos los
// subconjuntos propios no vacíos de los dieciséis ids: con los dieciséis el
// teclado deja de estar en rampa). Dos cantidades de inventario dinámico, que
// son los dos lados de la costura que se rompió: cero —donde el bug no se veía—
// y dos, que es lo que desbloquea la derivada de 9/x.
console.log("1. para todo inventario, se dibuja exactamente lo que el servidor mandó")
let malCobertura: string | null = null
let estados = 0
for (let mascara = 1; mascara < (1 << IDS_FIJOS.length) - 1; mascara++) {
  const fijas = IDS_FIJOS.filter((_, i) => mascara & (1 << i))
  for (const nDin of [0, 2]) {
    const dins = dinamicas(nDin)
    const filas = filasDeRampa(fijas, dins)
    estados++
    if (!iguales(dibujadas(filas), esperadas(fijas, dins))) {
      malCobertura ??= `${fijas.join(",")} + ${nDin} dinámicas`
    }
  }
}
check(malCobertura === null, `${estados} inventarios y ni una tecla de más o de menos${malCobertura ? ` (falla: ${malCobertura})` : ""}`)

// El inventario dinámico completo, contra el fijo casi completo: es el estado
// que más teclas tiene sin salir de la rampa.
const casiTodo = IDS_FIJOS.slice(0, FIJAS_TOTAL - 1)
const todasLasDin = dinamicas(IDS_DINAMICOS.length)
check(
  iguales(
    dibujadas(filasDeRampa(casiTodo, todasLasDin)),
    esperadas(casiTodo, todasLasDin),
  ),
  `con ${casiTodo.length} fijas y las ${IDS_DINAMICOS.length} dinámicas tampoco`,
)

// El caso que rompió, dicho con nombre y apellido.
const NUEVE_SOBRE_X = ["f:9", "f:x", "f:-", "f:2"]
const FRAC_Y_SQ = ["frac", "sq"].map((id) => ({ id, key: DYNAMIC[id], nueva: true }))
const dibujoReal = dibujadas(filasDeRampa(NUEVE_SOBRE_X, FRAC_Y_SQ))
check(
  dibujoReal.includes("frac") && dibujoReal.includes("sq"),
  "la derivada de 9/x es −9/x² y el teclado dibuja `frac` y `sq`",
)

// Y que la comparación de arriba no sea vacía. Un chequeo exhaustivo que
// compara mal pasa siempre, y pasar siempre es indistinguible de estar bien: si
// al dibujo le falta una tecla, esto tiene que notarlo.
const mutilado = filasDeRampa(NUEVE_SOBRE_X, FRAC_Y_SQ).map((fila) => fila.slice(1))
check(
  !iguales(dibujadas(mutilado), esperadas(NUEVE_SOBRE_X, FRAC_Y_SQ)),
  "y si al dibujo le sacamos una tecla por fila, la comparación lo ve",
)

// **Siempre dos tiras.** Lo que escribe arriba, lo que corrige abajo, aunque
// entren todas en una fila. Juntarlas mientras entraran hacia que el teclado
// saltara de una fila a dos en medio de la partida, con la segunda tecla
// desbloqueada.
check(
  filasDeRampa(["f:1"], []).length === 2,
  `con una sola tecla ya son dos tiras (dio ${filasDeRampa(["f:1"], []).length})`,
)
check(
  IDS_FIJOS.filter((id) => id !== "f:C").every(
    (id) => filasDeRampa([id], []).length === 2,
  ),
  "y con cualquiera de las quince que escriben, tambien",
)
// `f:C` es la excepcion y no un agujero: es la unica que vive en la tira de
// CORREGIR, asi que con ella sola la tira de escribir esta vacia y no hay dos
// cosas que separar. No es alcanzable igual: el calendario la suelta junto con
// los operadores (keyboard.py :: ESCALONES).
check(
  filasDeRampa(["f:C"], []).length === 1,
  "con la C sola hay una tira: no hay nada que escribir todavia",
)

// ── 2 · El destello cae donde tiene que caer ────────────────────────────────
console.log("\n2. solo destella lo recién desbloqueado")
const conDestello = filasDeRampa(NUEVE_SOBRE_X, FRAC_Y_SQ, ["f:9"])
const nuevas = conDestello.flat().filter((e) => e.nueva).map((e) => e.id).sort()
check(
  iguales(nuevas, ["f:9", "frac", "sq"]),
  `destellan las tres recién llegadas y nada más (dio ${nuevas.join(",") || "ninguna"})`,
)
check(
  conDestello.flat().every((e) => e.id !== "" || !e.nueva),
  "el retroceso y las flechas no destellan: no se desbloquean nunca",
)

// ── 3 · El teclado entra en la card ─────────────────────────────────────────
//
// El alto depende solo de CUÁNTAS teclas hay, no de cuáles, así que acá se
// recorre el espacio de cantidades y no el de subconjuntos: todas las
// combinaciones de inventario fijo (contando el paréntesis doble) por todas las
// cantidades de inventario dinámico.
console.log("\n3. ningún inventario pasa del alto que deja la card")
let peorAlto = 0
let peorFilas = 0
let peorAncho = Infinity
let malAlto: string | null = null
let malFilas: string | null = null
for (let nFijas = 1; nFijas < FIJAS_TOTAL; nFijas++) {
  // El peor caso por cantidad es el que incluye `f:()`, que dibuja dos teclas.
  for (const conParentesis of [false, true]) {
    const base = IDS_FIJOS.filter((id) => id !== "f:()")
    const fijas = conParentesis
      ? ["f:()", ...base.slice(0, nFijas - 1)]
      : base.slice(0, nFijas)
    if (fijas.length !== nFijas) continue
    for (let nDin = 0; nDin <= IDS_DINAMICOS.length; nDin++) {
      const filas = filasDeRampa(fijas, dinamicas(nDin))
      const alto = altoTotal(filas)
      const ancho = anchoPx(filas)
      if (alto > peorAlto) peorAlto = alto
      if (filas.length > peorFilas) peorFilas = filas.length
      if (ancho < peorAncho) peorAncho = ancho
      if (alto > PRESUPUESTO) malAlto ??= `${nFijas} fijas + ${nDin} dinámicas → ${alto} px`
      if (filas.length > RAMPA_FILAS_MAX) {
        malFilas ??= `${nFijas} fijas + ${nDin} dinámicas → ${filas.length} filas`
      }
    }
  }
}
check(
  malAlto === null,
  `el peor estado pide ${peorAlto.toFixed(1)} px de los ${PRESUPUESTO} disponibles${malAlto ? ` (falla: ${malAlto})` : ""}`,
)
check(
  malFilas === null,
  `y ninguno pasa de ${RAMPA_FILAS_MAX} filas (el peor da ${peorFilas})${malFilas ? ` (falla: ${malFilas})` : ""}`,
)
// El piso de ancho no es un presupuesto sino una alarma: si baja de acá, el
// reparto está metiendo columnas para no crecer de alto y la tecla dejó de ser
// un botón para el pulgar. 28 px es el ancho del área táctil mínima que Apple y
// Material piden (44 y 48 px de ALTO, que acá los pone `altoDeRampa`).
check(
  peorAncho >= 28,
  `la tecla más angosta mide ${peorAncho.toFixed(1)} px en una pantalla de 375`,
)
// Lo que se DIBUJA nunca llega a cuatro filas: ahí el empaquetado ya no ahorra
// alto contra el definitivo, y va el definitivo. `filasDeRampa` sigue pudiendo
// dar cuatro —es la cuenta—; `rampaDibujada` es la que decide.
{
  const pocas = rampaDibujada(["f:1", "f:2", "f:x"], [])
  check(
    pocas !== null && pocas.length < RAMPA_FILAS_A_DEFINITIVO,
    `con tres teclas va el empaquetado (dio ${pocas?.length ?? "definitivo"} filas)`,
  )
  const muchas = ["0", "1", "2", "3", "4", "5", "8", "9"].map((d) => `f:${d}`)
  const inventario = [...muchas, "f:x", "f:+", "f:-", "f:*", "f:()", "f:C"]
  const crudas = filasDeRampa(inventario, dinamicas(4))
  check(
    crudas.length >= RAMPA_FILAS_A_DEFINITIVO &&
      rampaDibujada(inventario, dinamicas(4)) === null,
    `y cuando pediría ${crudas.length} filas va el definitivo con numérico`,
  )
}

// Y que el alto apretado se use de verdad: si `RAMPA_FILAS_APRETADO` se fuera
// por encima del tope de filas, la rampa nunca apretaría y los números de
// arriba cambiarían sin que nada avisara.
check(
  RAMPA_FILAS_APRETADO <= RAMPA_FILAS_MAX,
  `el alto apretado entra en juego antes del tope de filas (${RAMPA_FILAS_APRETADO} ≤ ${RAMPA_FILAS_MAX})`,
)
check(
  aPx(RAMPA_ROW_APRETADO) < aPx(RAMPA_ROW),
  `y aprieta de verdad: ${aPx(RAMPA_ROW)} px pasa a ${aPx(RAMPA_ROW_APRETADO)}`,
)

// ── 4 · Fuera de la rampa tampoco se pierde inventario ──────────────────────
//
// El teclado completo reparte el inventario en dos: las primeras entran al pad
// y las que sobran suben a la fila ancha. En escritorio son una o dos tiras. Las
// dos particiones tienen que cubrirlo entero, y la de escritorio tiene techo.
console.log("\n4. el teclado completo tampoco pierde teclas")
check(
  IDS_DINAMICOS.length <= 2 * DYN_ONE_ROW_MAX,
  `en escritorio entran las ${IDS_DINAMICOS.length} en dos tiras de ${DYN_ONE_ROW_MAX}`,
)
check(
  PAD_DYNAMIC_SLOTS > 0 && PAD_DYNAMIC_SLOTS < IDS_DINAMICOS.length + 1,
  `el pad se queda con las primeras ${PAD_DYNAMIC_SLOTS} y el resto sube a la fila ancha`,
)

// ── 5 · Todo id del backend tiene dibujo ────────────────────────────────────
//
// El mapa del front descarta en silencio lo que no conoce —a propósito: es lo
// que deja agregar teclas sin romper clientes viejos— así que un id nuevo del
// lado del servidor no rompe nada, no se dibuja, y el ejercicio que lo necesita
// llega sin con qué escribirse. Se leen las listas de keyboard.py en vez de
// copiarlas acá por el mismo motivo que `check_openapi_sync` lee el contrato.
console.log("\n5. los ids que manda el backend tienen dibujo en el front")
const KEYBOARD_PY = fileURLToPath(
  new URL("../../backend/game/keyboard.py", import.meta.url),
)
const fuente = readFileSync(KEYBOARD_PY, "utf-8")

// Las tuplas de keyboard.py no listan strings sino los nombres de las
// constantes (`KEY_POW`, `FIJA_X`), así que hay que resolverlos primero.
const CONSTANTES: Record<string, string> = Object.fromEntries(
  [...fuente.matchAll(/^(KEY_\w+|FIJA_\w+)\s*=\s*"([^"]+)"/gm)].map((m) => [
    m[1],
    m[2],
  ]),
)

function tupla(nombre: string): string[] {
  const m = fuente.match(
    new RegExp(`^${nombre}[^=]*=\\s*\\(([\\s\\S]*?)^\\)`, "m"),
  )
  if (!m) throw new Error(`no encontré ${nombre} en keyboard.py`)
  return [...m[1].matchAll(/\b(KEY_\w+|FIJA_\w+)\b/g)]
    .map((x) => CONSTANTES[x[1]])
    .filter((id): id is string => id !== undefined)
}

const backendDin = tupla("CANONICAL_ORDER")
// `FIJAS_ORDER` arma los dígitos con un comprehension, así que los literales de
// la tupla son solo los otros seis.
const backendFij = [
  ...Array.from({ length: 10 }, (_, d) => `f:${d}`),
  ...tupla("FIJAS_ORDER"),
]
const faltanDin = backendDin.filter((id) => !(id in DYNAMIC))
const faltanFij = backendFij.filter((id) => !(id in FIJA_A_TECLAS))
check(
  faltanDin.length === 0,
  `las ${backendDin.length} dinámicas de CANONICAL_ORDER están en DYNAMIC${faltanDin.length ? ` (faltan ${faltanDin.join(",")})` : ""}`,
)
check(
  faltanFij.length === 0,
  `las ${backendFij.length} fijas de FIJAS_ORDER están en FIJA_A_TECLAS${faltanFij.length ? ` (faltan ${faltanFij.join(",")})` : ""}`,
)
// Y al revés, que es lo que hace que la rampa pueda terminar: si el front
// conociera una fija que el backend no desbloquea nunca, `fijas.length` jamás
// llegaría a `FIJAS_TOTAL` y el teclado se quedaría empaquetado para siempre.
check(
  FIJAS_TOTAL === backendFij.length,
  `y son las mismas ${FIJAS_TOTAL}, así que la rampa termina`,
)

console.log()
if (fallos > 0) {
  console.log(`${fallos} chequeo(s) fallaron`)
  process.exit(1)
}
console.log("todos los chequeos pasaron")
