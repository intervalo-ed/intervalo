"use client"

// Teclado del juego. No es solo un input: es la heurística que dice qué hacer,
// así que mostrar todo el vocabulario matemático de golpe abruma en vez de
// ayudar. Son dos zonas:
//
//   · Un bloque FIJO que nunca cambia de forma — numérico a la IZQUIERDA (con
//     el borrar-todo a la izquierda del 0 y el retroceso a su derecha), y a su
//     derecha los paréntesis y las flechas, con las cuatro operaciones contra
//     el borde.
//
//     Ese orden no es una preferencia de diseño: es el de la calculadora
//     científica que todo el mundo tuvo en la mano antes de llegar acá (una
//     Casio fx-991 o cualquiera de sus clones). Ahí los dígitos ocupan las tres
//     columnas de la izquierda y `× ÷ + −` son las dos columnas del borde
//     derecho, y esa es la única disposición de teclas matemáticas que un
//     estudiante ya tiene aprendida en el dedo. Estaba espejada, y hacerle
//     buscar el `+` es cobrarle un impuesto por algo que ya sabía.
//   · Una fila DINÁMICA arriba con lo que ESTE ejercicio necesita más un par de
//     distractores de la misma familia. La calcula el backend a partir de la
//     derivada esperada (backend/game/keyboard.py) y viene en `keys`.
//
// La fila conserva su alto aunque venga vacía: si el teclado cambiara de tamaño
// entre ejercicios, todo lo de abajo saltaría.
//
// Las teclas se dibujan con KaTeX, el mismo motor que compone el enunciado (ver
// components/math-text.tsx). No es un capricho tipográfico: con glifos de la
// fuente de interfaz, la `x` del teclado y la `x` de la fórmula son dos letras
// distintas, y el `·` y el `−` ni siquiera son los mismos caracteres que usa
// LaTeX. Escritas en KaTeX, la tecla y lo que aparece en el campo son la misma
// cosa, que es lo único que hace que el teclado se lea como matemática.
//
// El color va por rol y no de adorno: la misma operación tiene siempre el mismo
// color, así la vista la encuentra sin leer. La fila dinámica va en blanco —
// teñirla la separaba del resto sin que ese corte significara nada.
//
// El teclado físico sigue funcionando en paralelo (lo maneja MathLive).

import { useEffect, useMemo, useState } from "react"
import { motion, useReducedMotion } from "motion/react"
import katex from "katex"
// Lo importa también math-text.tsx, y el bundler lo deduplica; va acá igual
// porque este módulo no debería depender de que otro haya cargado la hoja.
import "katex/dist/katex.min.css"
import { ArrowLeft, ArrowRight, Delete } from "lucide-react"
import { cn } from "@/lib/utils"
import { useSfx } from "@/lib/audio/useSfx"
import { KeyCap } from "./exercise-card"
import type { MathInputHandle } from "./math-input"
import { PulsoBlanco } from "./pulso"
import { enCampoHtml } from "./teclas"

export type Key = {
  // LaTeX del glifo, o un nodo suelto para las teclas que no son matemática
  // (las flechas de navegación y el retroceso, que son acciones del editor).
  tex?: string
  // La versión larga, con el argumento a completar: `sen(□)` en vez de `sen`.
  // Es la que dice de verdad qué hace la tecla —inserta la función Y su
  // paréntesis con el hueco adentro— y es la que se usa en escritorio, donde hay
  // ancho. En el teléfono la tecla es un botón para el pulgar y ahí no entra:
  // queda la corta.
  texWide?: string
  node?: React.ReactNode
  insert?: string
  cmd?: string
  action?: "clear"
  // Color del glifo. El fondo es siempre el mismo: teñir la tecla entera
  // convertiría el teclado en un semáforo.
  tone?: keyof typeof TONES
  // Tamaño relativo del glifo. Los símbolos necesitan más cuerpo que los
  // dígitos para leerse igual de bien: en KaTeX un `+` ocupa mucho menos alto
  // que un `7`.
  size?: keyof typeof SIZES
  // Solo escritorio. `fisica` son los `e.key` del teclado físico que hacen lo
  // mismo que esta tecla: cuando se aprieta uno, la tecla de pantalla pulsa en
  // blanco (pulso.tsx). `atajo` es el texto del chip que lo muestra, y una
  // tecla con chip ocupa `ancho` columnas de la tira (dos) para que el glifo y
  // el chip entren uno al lado del otro.
  //
  // Es la respuesta a lo que escribió la gente en la varita: «no tenés la
  // opción de poner la potencia o la división» (en escritorio esas dos solo
  // aparecían al desbloquearse) y «cuando escribo potencias se pone la llave»
  // (no sabían salir del exponente). El teclado físico ya hacía todo eso; lo
  // que faltaba era que se viera.
  fisica?: readonly string[]
  atajo?: string
  ancho?: number
}

// Color a media asta. Los tonos originales (#4ADE80, #F87171, #C084FC…) eran
// puros de paleta y al lado de un enunciado en KaTeX el teclado parecía de otra
// aplicación; bajarlos hasta el tinte casi blanco fue pasarse de largo y el rol
// de cada tecla dejaba de leerse. Esta franja —claridad ~68%, saturación ~55%—
// es la que conserva el color sin gritar.
const TONES = {
  plain: "text-foreground",
  add: "text-[#7ECE9F]",
  sub: "text-[#E08E85]",
  unknown: "text-[#B99CE2]",
  mul: "text-[#81AADA]",
  paren: "text-[#DCBA74]",
  // Las flechas no son matemática sino navegación: van con el tono que el tema
  // ya usa para todo lo secundario.
  nav: "text-muted-foreground",
  clear: "text-[#DCBA74]",
  erase: "text-[#E08E85]",
} as const

const SIZES = {
  // Las dinámicas de escritorio. Es el cuerpo que hace entrar al glifo MÁS ANCHO
  // del vocabulario en una tecla de la grilla de diez: medido, `log_□` pedía
  // 45.7 px sobre una tecla de 39.4 y se salía. A 0.95rem mide 34.7 y le sobran
  // un par de píxeles de cada lado. Si algún día se suma una tecla más ancha que
  // esa, hay que volver a medir acá.
  dyn: "text-[0.95rem]",
  sm: "text-[1.05rem]",
  md: "text-[1.25rem]",
  lg: "text-[1.5rem]",
  // Los dígitos, un punto más chicos en escritorio. En el teléfono se quedan
  // como estaban: ahí la tecla ya es chica y el número es lo único que la hace
  // legible de un vistazo.
  num: "text-[1.25rem] md:text-[1.1rem]",
} as const

// El HTML de KaTeX para un glifo depende solo del LaTeX, y el teclado repite
// las mismas teclas ejercicio tras ejercicio: se cachea a nivel módulo para no
// re-renderizar veinte fórmulas en cada cambio de ejercicio.
const GLYPH_CACHE = new Map<string, string>()

function glyph(tex: string): string {
  const cached = GLYPH_CACHE.get(tex)
  if (cached !== undefined) return cached
  const html = katex.renderToString(tex, { throwOnError: false, displayMode: false })
  GLYPH_CACHE.set(tex, html)
  return html
}

// Hueco de los argumentos que faltan. `\square` es el mismo cuadrado hueco que
// usa la notación de libro para un lugar a completar.
const BOX = "\\square"

// Izquierda: lo que estructura la expresión y lo que mueve el cursor.
const LEFT: Key[] = [
  { tex: "(", insert: "(", tone: "paren", size: "lg" },
  { tex: ")", insert: ")", tone: "paren", size: "lg" },
  { node: <ArrowLeft size={19} />, cmd: "moveToPreviousChar", tone: "nav" },
  { node: <ArrowRight size={19} />, cmd: "moveToNextChar", tone: "nav" },
]

// Centro: la incógnita y las cuatro operaciones.
//
// Los tres operadores van en `\boldsymbol`: en la fuente matemática de KaTeX el
// `+`, el `−` y sobre todo el `·` son trazos finos pensados para leerse DENTRO
// de una fórmula, rodeados de letras. Solos en el centro de una tecla se veían
// desvaídos al lado de la `x` y de los dígitos, y el punto directamente
// desaparecía. La negrita es solo del glifo de la tecla: lo que insertan sigue
// siendo el símbolo normal.
const CENTER: Key[] = [
  { tex: "x", insert: "x", tone: "unknown", size: "lg" },
  { tex: "\\boldsymbol{+}", insert: "+", tone: "add", size: "lg" },
  { tex: "\\boldsymbol{-}", insert: "-", tone: "sub", size: "lg" },
  { tex: "\\boldsymbol{\\cdot}", insert: "\\cdot", tone: "mul", size: "lg" },
]

// Las mismas ocho teclas fijas, ya intercaladas para el pad del teléfono: los
// dos bloques de dos columnas se fundieron en una grilla de cuatro, y el orden
// de lectura que había —( ) x + arriba, ← → − · abajo— se conserva alternando
// las listas de a dos.
//
// Bajan a `md`: eran `lg` porque ocupaban el doble de alto que un dígito, y a
// igual tamaño que el numérico ese cuerpo las hacía ver desproporcionadas.
const PAD_FIXED: Key[] = [
  ...LEFT.slice(0, 2),
  ...CENTER.slice(0, 2),
  ...LEFT.slice(2),
  ...CENTER.slice(2),
].map((key) => ({ ...key, size: "md" as const }))

const NUM = (d: string): Key => ({ tex: d, insert: d, size: "num" })

const CLEAR_KEY: Key = { tex: "\\mathrm{C}", action: "clear", tone: "clear" }
const ERASE_KEY: Key = { node: <Delete size={19} />, cmd: "deleteBackward", tone: "erase" }

const NUMPAD: Key[] = [
  NUM("7"), NUM("8"), NUM("9"),
  NUM("4"), NUM("5"), NUM("6"),
  NUM("1"), NUM("2"), NUM("3"),
  { ...CLEAR_KEY, size: "num" },
  NUM("0"),
  ERASE_KEY,
]

// Vocabulario dinámico. Las claves son los ids que manda el backend; cualquier
// id desconocido se ignora, así agregar teclas en v2 no rompe clientes viejos.
export const DYNAMIC: Record<string, Key> = {
  pow: { tex: `${BOX}^{${BOX}}`, insert: "#@^{#?}", atajo: "^", fisica: ["^"] },
  sq: { tex: `${BOX}^{2}`, insert: "#@^{2}" },
  sqrt: { tex: `\\sqrt{${BOX}}`, insert: "\\sqrt{#?}" },
  // `#@` y no `#?` en el numerador: es el token de argumento implícito de
  // MathLive —"comete lo que está justo antes del cursor"— y es lo que hace que
  // escribir `1` y tocar esta tecla dé `1/□` con el cursor abajo, en vez de
  // dejar el 1 al costado de una fracción vacía. `pow` y `sq` ya lo usaban;
  // esta era la única que se había quedado con dos huecos.
  //
  // De paso, la tecla y la barra `/` física pasan a hacer lo mismo: aquella ya
  // se comportaba así (ver el consejo de escritorio en math-input.tsx).
  //
  // `sqrt` NO lleva `#@` a propósito: `\sqrt{#@}` no deja ningún hueco, así que
  // el cursor terminaría fuera del radical en vez de adentro, que es al revés
  // de lo que se quiere en el caso común de querer escribir una raíz.
  frac: { tex: `\\frac{${BOX}}{${BOX}}`, insert: "\\frac{#@}{#?}", atajo: "/", fisica: ["/"] },
  e: { tex: "e", insert: "e" },
  expx: { tex: `e^{${BOX}}`, insert: "e^{#?}" },
  ln: {
    tex: "\\ln",
    texWide: `\\ln\\left(${BOX}\\right)`,
    insert: "\\ln\\left(#?\\right)",
  },
  log: {
    tex: `\\log_{${BOX}}`,
    texWide: `\\log_{${BOX}}\\left(${BOX}\\right)`,
    insert: "\\log_{#?}\\left(#?\\right)",
  },
  sen: {
    tex: "\\operatorname{sen}",
    texWide: `\\operatorname{sen}\\left(${BOX}\\right)`,
    insert: "\\operatorname{sen}\\left(#?\\right)",
  },
  cos: {
    tex: "\\cos",
    texWide: `\\cos\\left(${BOX}\\right)`,
    insert: "\\cos\\left(#?\\right)",
  },
  // El id sigue siendo `tg` —viaja al backend y está guardado en
  // `game_players.unlocked_keys`, así que renombrarlo dejaría a todo el mundo
  // sin su tecla— pero lo que se ve y lo que inserta es `tan`.
  tg: {
    tex: "\\tan",
    texWide: `\\tan\\left(${BOX}\\right)`,
    insert: "\\tan\\left(#?\\right)",
  },
}

// Alto de fila del bloque fijo, en una variable CSS porque cambia por tamaño de
// pantalla. En escritorio baja a 2.05rem: con teclas de doble alto a la
// izquierda y al centro, el bloque medía cuatro filas de blanco de más. En el
// teléfono se queda en 2.5rem — ahí no sobra alto, pero la tecla se toca con el
// pulgar y achicarla la vuelve imposible de acertar.
const ROW_MIN = "var(--kb-row)"
// `--kb-strip` es el alto de las filas de ESCRITORIO (inventario y tiras). En
// una ventana baja —una notebook de 768 px con la barra del navegador, un zoom
// al 125%— bajan apenas, a 2,5rem: el grueso lo pone el `zoom` de la caja en
// desktop-layout.tsx, que achica todo lo de adentro junto. El corte es el
// mismo.
export const ROW_VARS =
  "[--kb-row:2.5rem] md:[--kb-row:2.05rem] [--kb-strip:2.6rem] [@media(max-height:700px)]:[--kb-strip:2.5rem]"

// En escritorio todas las filas comparten una grilla de DIEZ columnas: caen en
// las mismas verticales, que es lo que hace que se lean como un teclado y no
// como tres tiras sueltas.
//
// Eran ocho, y con el inventario completo —once teclas— eso daba dos filas
// dinámicas (6+5) más las dos fijas: cuatro filas, que ya no entran en la card y
// se desbordaban sobre el botón. Con diez, las fijas se juntan en UNA sola y el
// teclado vuelve a medir tres filas incluso con todo desbloqueado.
export const GRID_COLS = 10

// El pad del teléfono: las cuatro columnas de la DERECHA, al lado del numérico.
// Antes eran dos bloques de dos columnas con las teclas a DOBLE alto
// —ocho teclas ocupando las cuatro filas del numérico— y el inventario vivía
// arriba, en filas propias. Con el vocabulario completo eso eran dos filas de
// más y el teclado se comía media pantalla.
//
// Ahora las fijas miden lo mismo que un dígito y el pad tiene 4×4 = 16 lugares:
// ocho para las fijas y OCHO para el inventario, que así no necesita filas
// aparte. Solo las que no entran suben a la fila ancha de arriba.
const PAD_COLS = 4
// Cuatro filas, las mismas que el numérico: es lo que hace que los dos bloques
// midan igual.
const PAD_ROWS = 4
export const PAD_DYNAMIC_SLOTS = PAD_COLS * PAD_ROWS - 8

// En escritorio las tres filas miden lo MISMO: el teclado se lee como una
// grilla pareja. La dinámica supo ser más alta —era la que cambiaba entre
// ejercicios— pero ahora es un inventario que crece, y con una sola tecla
// desbloqueada esa fila más alta se veía como un botón suelto de otro tamaño.
// El alto alcanza para los glifos compuestos (√□, e^□ miden 30 px).
// El alto de una tecla del teclado empaquetado. Más que las del numérico
// (2.5rem) porque con pocas teclas sobra alto y una tecla grande es más fácil de
// acertar con el pulgar, que es justo lo que la rampa viene a resolver.
//
// "Con pocas teclas" es la condición, y hasta ahora no estaba escrita en ningún
// lado: con el inventario casi completo son cuatro filas, y a 2,9rem el teclado
// pide 252 px contra los 212 que deja la card en una pantalla de 667. Lo que
// sobra lo recorta `overflow-hidden`, y lo que se recorta es el marcador.
// Desde la cuarta fila la tecla vuelve al alto del numérico.
export const RAMPA_ROW = "2.9rem"
export const RAMPA_ROW_APRETADO = "var(--kb-row)"
export const RAMPA_FILAS_APRETADO = 4

const DYNAMIC_ROW = "2.75rem"
const DYNAMIC_ROW_DESKTOP = "var(--kb-strip)"
export const STRIP_ROW = "var(--kb-strip)"

// La fila fija de escritorio, espejada por el mismo motivo que el pad del
// teléfono: en escritorio no hay numérico —los dígitos se tipean— pero sí están
// las cuatro operaciones, y en la calculadora esas viven contra el borde
// DERECHO. Acá abrían la fila, que es el lugar exactamente opuesto.
//
// Se espeja el orden de los GRUPOS, no el contenido de cada uno: `( )` no se
// vuelve `) (` ni las flechas apuntan al revés. Lo que cambia es dónde cae cada
// grupo, y el resultado es que la fila TERMINA en `+ − ·`, igual que la
// columna de la derecha de la Casio.
const STRIP_WRITE: Key[] = [...LEFT.slice(0, 2), ...CENTER]
const STRIP_EDIT: Key[] = [CLEAR_KEY, ERASE_KEY, ...LEFT.slice(2)]

// Las mismas tiras, con el atajo físico a la vista: las teclas que tienen un
// carácter propio en el teclado real ocupan dos columnas y llevan el chip. Las
// que no lo tienen —la C— o cuyo glifo YA es la tecla —las flechas, la x, el +
// y el −— quedan de una columna, pulsan igual.
//
// «Salir» es el Tab de MathLive (moveToNextGroup, ver math-input.tsx): sale
// del exponente o del denominador y sigue en el renglón. Es la mitad del «se me
// pone la llave»: la otra mitad es saber que existe.
const conAtajo = (key: Key, atajo: string, fisica: readonly string[]): Key => ({
  ...key,
  atajo,
  fisica,
  ancho: 2,
})
const SALIR_KEY: Key = {
  tex: `${BOX}\\!\\rightarrow`,
  cmd: "moveToNextGroup",
  tone: "nav",
  size: "sm",
}
const STRIP_WRITE_ATAJOS: Key[] = [
  conAtajo(LEFT[0], "(", ["("]),
  conAtajo(LEFT[1], ")", [")"]),
  { ...CENTER[0], fisica: ["x"] },
  { ...CENTER[1], fisica: ["+"] },
  { ...CENTER[2], fisica: ["-"] },
  conAtajo(CENTER[3], "*", ["*"]),
]
const STRIP_EDIT_ATAJOS: Key[] = [
  CLEAR_KEY,
  conAtajo(ERASE_KEY, "⌫", ["Backspace"]),
  { ...LEFT[2], fisica: ["ArrowLeft"] },
  { ...LEFT[3], fisica: ["ArrowRight"] },
  conAtajo(SALIR_KEY, "tab", ["Tab"]),
]

/** Cuántas columnas ocupa cada tecla de cada tira de escritorio. Derivado y no
 *  escrito a mano: lo lee el esqueleto de carga (desktop-layout.tsx ::
 *  ExerciseSkeleton) para dibujar las mismas celdas, y con un literal ahí las
 *  dos cosas se separaban en cuanto alguien sumara una tecla. */
export const ANCHOS_DE_TIRA: number[][] = [STRIP_WRITE_ATAJOS, STRIP_EDIT_ATAJOS].map(
  (fila) => fila.map((key) => key.ancho ?? 1),
)

/** En qué columna arranca cada tecla de una tira, para que la tira quede
 *  centrada en las diez columnas. Lo usan el teclado y su esqueleto: si el
 *  centrado se calculara dos veces, alcanzaría con tocar una para que las
 *  teclas del esqueleto dejaran de caer donde caen las de verdad. */
export function columnasDeTira(anchos: readonly number[]): number[] {
  const total = anchos.reduce((suma, a) => suma + a, 0)
  let columna = Math.floor((GRID_COLS - total) / 2) + 1
  return anchos.map((a) => {
    const inicio = columna
    columna += a
    return inicio
  })
}
// La tira única, para cuando el inventario pide dos filas: ahí no hay lugar
// para los chips y las teclas vuelven a una columna. Las que tienen atajo
// siguen pulsando.
const STRIP: Key[] = [...STRIP_EDIT, ...STRIP_WRITE]

// En escritorio la potencia y la fracción están SIEMPRE, desbloqueadas o no:
// se tipean con `^` y `/`, y una tecla que muestra ese atajo enseña más de lo
// que distrae. En el teléfono siguen siendo del inventario.
const SIEMPRE_EN_ESCRITORIO = ["pow", "frac"]

// El teclado de escritorio mide SIEMPRE tres filas, y lo que se acomoda para
// lograrlo es el bloque fijo: con el inventario chico ocupa dos filas —lo que se
// escribe arriba, lo que se edita abajo, que es su agrupación natural— y cuando
// el inventario crece hasta pedir dos filas propias, las junta en una sola.
//
// El alto del teclado no cambia nunca, entonces, y lo que se ve crecer es el
// inventario ocupando el lugar de lo fijo. Las teclas se reordenan en el camino
// —de eso se trata: la posición final se alcanza con el vocabulario completo.
//
// Dónde se corta, con los anchos MEDIDOS de cada glifo y no a ojo. El canal es
// el de la card menos su margen: 456,8 px.
//
//   compactas (□^□ □² √□ □/□ e e^□)   ~265
//   + ln(□) 76                        ~347   ← el corte
//   + log_□(□) 97                     ~450   (entra por 7 px: demasiado justo)
//   + sen(□) 87                       ~543   ✗
//
// Y del otro lado, las cuatro que quedan —log, sen, cos, tan— suman ~375. Las
// dos filas quedan casi iguales (377 y 375) sin que ninguna roce el borde.
//
// Se probó partir por la mitad (6 y 5): la segunda fila pedía 457 contra 456,8
// y envolvía por dos décimas de píxel, o sea tres filas de inventario y cuatro
// en total. El reparto por cantidad no sirve acá porque las teclas no miden lo
// mismo: las compactas entran de a seis y las funciones de a cuatro.
export const DYN_ONE_ROW_MAX = 7

// Ancho del contenido, tanto acá como en la card del ejercicio: las teclas y el
// campo donde se escribe la respuesta comparten el mismo canal centrado, así el
// panel entero se lee como una columna y no como tres cajas de anchos
// distintos. Ver ExerciseCard :: PANEL_CONTENT.
export const CONTENT_WIDTH = "mx-auto w-full max-w-[32rem]"

// ── La rampa del bloque fijo (`dx-rampa-1`, ver backend/game/rampa.py) ──────
//
// Hasta acá el bloque fijo estaba SIEMPRE completo y lo único que crecía era el
// inventario de arriba. La rampa lo mete en el mismo mecanismo: el teclado
// arranca con lo que la primera respuesta necesita —la derivada de `x` es `1`,
// así que con una tecla alcanza— y crece.
//
// Los ids son los del backend (`keyboard.py :: FIJAS_ORDER`) y el mapa vive acá
// porque es donde vive el dibujo. Un id desconocido se ignora, igual que en el
// vocabulario dinámico.
//
// El retroceso y las flechas NO están en el mapa y no es un olvido: no se
// desbloquean nunca. Son lo que hace falta para corregir, y un teclado del que
// no se puede volver atrás no es una rampa, es una trampa.
export const FIJA_A_TECLAS: Record<string, Key[]> = {
  ...Object.fromEntries("0123456789".split("").map((d) => [`f:${d}`, [NUM(d)]])),
  "f:x": [CENTER[0]],
  "f:+": [CENTER[1]],
  "f:-": [CENTER[2]],
  "f:*": [CENTER[3]],
  "f:()": [LEFT[0], LEFT[1]],
  "f:C": [CLEAR_KEY],
}

/** Cuántas fijas hay en total. Derivado y no escrito a mano: con el literal, el
 *  día que el backend sume una tecla el teclado se quedaría en modo rampa para
 *  siempre, porque nunca alcanzaría el total. */
export const FIJAS_TOTAL = Object.keys(FIJA_A_TECLAS).length

// Lo que se escribe arriba y lo que se edita abajo, que es la MISMA agrupación
// que usan las tiras de escritorio (STRIP_WRITE / STRIP_EDIT). Reusarla no es
// ahorro de código: es que el teclado incompleto y el de escritorio se lean como
// el mismo objeto, porque los dos son "las teclas que hay, ordenadas", sin la
// grilla de calculadora que solo tiene sentido con el numérico entero.
const ORDEN_ESCRIBIR = [
  ...("0123456789".split("").map((d) => `f:${d}`)),
  "f:x", "f:+", "f:-", "f:*", "f:()",
]
const ORDEN_EDITAR = ["f:C"]

// Cuántas teclas entran en una fila del teclado empaquetado.
//
// La cuenta vieja daba cinco, y estaba hecha sobre el ancho equivocado: medía
// contra los 358 px de la CARD en una pantalla de 390 e ignoraba el `px-4` del
// propio teclado. El canal real es 326 ahí, y 309 en una pantalla de 375.
//
// Ahora la tecla no mide 52 px fijos sino `1fr` del canal (ver `anchoDeTecla`),
// así que lo que hay que decidir no es cuántas ENTRAN a un ancho dado sino a
// partir de qué ancho la tecla se vuelve chica para el pulgar. A seis columnas
// la tecla mide 46,5 px en una pantalla de 375 y 44,3 en una de 360, que es el
// ancho de casi todo Android desde 2016. Con cinco, la misma fila dejaba 85 px
// sin usar Y metía una fila de más: doce teclas salían 4+4+4 en vez de 6+6, y
// esa cuarta fila es la que recortaba el marcador arriba de la fórmula.
export const RAMPA_MAX_COL = 6

/** El piso de columnas. Con muy pocas teclas la fila no se estira hasta el
 *  borde: tres teclas repartidas en todo el canal dan botones de 99 px que se
 *  leen como otra cosa, no como un teclado. Con el piso quedan en 57 px —más
 *  grandes que las de antes, que es lo que la rampa quiere— y centradas. */
export const RAMPA_MIN_COL = 5

/** El hueco entre teclas, en rem. Es el `gap-1.5` de las filas, escrito acá
 *  porque `anchoDeTecla` tiene que restarlo y dos números que se tienen que
 *  mover juntos no pueden vivir en dos lugares. */
export const RAMPA_GAP_REM = 0.375

/** El ancho de una tecla del teclado empaquetado, como porcentaje del canal.
 *
 *  Se calcula en CSS y no en JS a propósito: el canal cambia con el teléfono y
 *  con el `max-w` de la card, y medirlo desde JS pediría un ResizeObserver y un
 *  primer render sin ancho. Con `calc` las teclas de TODAS las filas miden lo
 *  mismo —la fila corta queda centrada por el `justify-center` del contenedor—
 *  y la fila llena llega exacta a los dos bordes. */
function anchoDeTecla(columnas: number) {
  return `calc((100% - ${((columnas - 1) * RAMPA_GAP_REM).toFixed(3)}rem) / ${columnas})`
}

/** Cuántas filas aguanta el teclado empaquetado antes de recortar la card.
 *
 *  Cuatro, medido: con cinco filas a 2,5rem el teclado pide 248 px contra los
 *  212 que deja una pantalla de 667, y lo que `overflow-hidden` se come es el
 *  marcador de arriba de la fórmula. Bajar más el alto no es salida: cinco
 *  filas dentro del presupuesto dan teclas de 32,8 px, que ya no son teclas. */
export const RAMPA_FILAS_MAX = 4

/** Reparte una tira en filas de largo PAREJO, nunca de más de `columnas`.
 *
 *  Parejo y no "llenar hasta el tope y que sobre": nueve teclas salen 5+4 y no
 *  5+4-por-desborde, que es la diferencia entre un bloque y una fila con un
 *  resto colgando. */
function repartir<T>(items: T[], columnas: number): T[][] {
  if (items.length === 0) return []
  const filas = Math.ceil(items.length / columnas)
  const por = Math.ceil(items.length / filas)
  return Array.from({ length: filas }, (_, i) => items.slice(i * por, (i + 1) * por))
}

/** Con cuántas columnas se reparte este teclado.
 *
 *  Seis mientras alcance; siete cuando con seis el bloque se pasaría de
 *  `RAMPA_FILAS_MAX`. El caso es real y no teórico: con el inventario casi
 *  completo —quince fijas y un par de funciones— son diecinueve teclas, que a
 *  seis columnas salen 4+4 filas y a siete, 3+1. La tecla pasa de 46,5 px a
 *  39,0 en una pantalla de 375, que es exactamente lo que ya mide la celda del
 *  pad completo: no se inventa un tamaño nuevo, se vuelve al de siempre. */
function columnasDeRampa(escribir: number, editar: number) {
  const filas = (c: number) => Math.ceil(escribir / c) + Math.ceil(editar / c)
  let c = RAMPA_MAX_COL
  while (filas(c) > RAMPA_FILAS_MAX && c < escribir + editar) c += 1
  return c
}

/** Una tecla dibujada, con el id del que salió.
 *
 *  El id viaja al lado de la tecla y no se reconstruye desde `key.insert`: el
 *  `·` inserta "\\cdot", los paréntesis son DOS teclas de un solo id y la C no
 *  inserta nada, así que ir para atrás desde lo que inserta se rompe en tres de
 *  los dieciséis. Las de corregir —retroceso y flechas— llevan id vacío: no se
 *  desbloquean nunca, así que no hay de qué id venir. */
export type EntradaDeTecla = { id: string; key: Key; nueva: boolean }

/** Las filas del teclado empaquetado, dado lo que el servidor desbloqueó.
 *
 *  Función pura y fuera del componente para que `check:teclado` pueda recorrer
 *  TODOS los estados del inventario. Es el único lugar donde se decide qué
 *  teclas ve alguien en rampa, y la forma de fallar no es dibujar feo sino
 *  dibujar de menos: una tecla que el servidor mandó y que no se dibuja es un
 *  ejercicio que no se puede contestar. */
export function filasDeRampa(
  fijas: string[],
  dinamicas: EntradaDeTecla[],
  newFijas: string[] = [],
): EntradaDeTecla[][] {
  const tiene = new Set(fijas)
  const teclas = (orden: string[]): EntradaDeTecla[] =>
    orden
      .filter((id) => tiene.has(id))
      .flatMap((id) =>
        (FIJA_A_TECLAS[id] ?? []).map((key) => ({
          id,
          key,
          nueva: newFijas.includes(id),
        })),
      )
  // **El inventario va ADENTRO de estas filas, y no en la fila ancha de
  // arriba.** En rampa el pad no se dibuja, y las primeras ocho dinámicas viven
  // adentro del pad (`padDynamic`), así que mientras el inventario tuviera ocho
  // teclas o menos no se dibujaba NINGUNA: el servidor desbloqueaba `frac` y
  // `sq` al servir 9/x —cuya derivada es −9/x²— y el ejercicio llegaba sin con
  // qué escribir la respuesta.
  //
  // Adentro y no en una fila propia porque una fila aparte cuesta 50 px (44 de
  // tecla más el hueco) y con doce fijas o más eso recorta el marcador.
  // Repartidas, las mismas teclas entran en las filas que ya hay.
  //
  // Primero, que es donde el pad también las pone: el inventario arriba y el
  // bloque fijo abajo. Y en cuerpo `dyn` por lo mismo que en el pad —`log_□` no
  // entra con el cuerpo de un dígito—, que acá sobra: la tecla de la rampa mide
  // más que la celda del pad.
  const escribir: EntradaDeTecla[] = [
    ...dinamicas.map((entrada) => ({
      ...entrada,
      key: { ...entrada.key, size: "dyn" as const },
    })),
    ...teclas(ORDEN_ESCRIBIR),
  ]
  // El retroceso y las flechas siempre están: son las de corregir, y nunca se
  // desbloquean, así que no pueden destellar.
  const editar: EntradaDeTecla[] = [
    ...teclas(ORDEN_EDITAR),
    ...[ERASE_KEY, ...LEFT.slice(2)].map((key) => ({ id: "", key, nueva: false })),
  ]
  // **Siempre DOS tiras, aunque entren en una.** Hubo una version que las
  // juntaba mientras sumaran seis o menos, para no dejar una fila de una sola
  // tecla arriba de otra de tres. El costo era peor que el sintoma: el teclado
  // empezaba con una fila, pasaba a dos en cuanto se desbloqueaba la segunda
  // tecla y el bloque entero saltaba de alto en medio de la partida. Partidas
  // desde el principio, lo que crece son las teclas de adentro y el teclado se
  // queda quieto donde esta.
  //
  // Y son dos tiras y no dos filas cualesquiera: arriba lo que escribe, abajo lo
  // que corrige. Esa separacion es la misma del teclado completo y la que hace
  // que el retroceso este siempre en el mismo lugar.
  const cols = columnasDeRampa(escribir.length, editar.length)
  return [...repartir(escribir, cols), ...repartir(editar, cols)]
}

/** A partir de cuántas filas el teclado empaquetado se rinde y pasa al
 *  definitivo, con el numérico.
 *
 *  Cuatro, que es lo que mide el definitivo: el empaquetado existe para ocupar
 *  MENOS que él mientras hay pocas teclas. Cuando ya pide las mismas cuatro
 *  filas no ahorra alto, y lo que se veía era lo peor de los dos —una grilla de
 *  seis columnas sin orden de calculadora, con el 5 al lado del 8 porque el 6 y
 *  el 7 todavía no estaban— a un paso de reacomodarse entera. Ahí va
 *  directamente la estructura final: el dedo aprende de una vez dónde queda
 *  cada tecla, y el teclado no vuelve a moverse.
 *
 *  El costo, asumido: en el definitivo se ven TODAS las fijas, también las que
 *  el calendario todavía no había soltado. La rampa se termina un poco antes
 *  para quien ya llegó hasta acá. */
export const RAMPA_FILAS_A_DEFINITIVO = 4

/** Las filas del teclado empaquetado, o `null` si toca el definitivo.
 *
 *  Es lo que decide qué teclado se dibuja en rampa. Pura y exportada por lo
 *  mismo que `filasDeRampa`: para que `check:teclado` la recorra. */
export function rampaDibujada(
  fijas: string[],
  dinamicas: EntradaDeTecla[],
  newFijas: string[] = [],
): EntradaDeTecla[][] | null {
  if (fijas.length >= FIJAS_TOTAL) return null
  const filas = filasDeRampa(fijas, dinamicas, newFijas)
  return filas.length >= RAMPA_FILAS_A_DEFINITIVO ? null : filas
}

/** El alto de la tecla empaquetada, según cuántas filas haya.
 *
 *  Desde que cuatro filas pasan al definitivo (`rampaDibujada`), lo que se
 *  dibuja empaquetado tiene tres como mucho y la rama «apretada» no se usa. Se
 *  queda porque `filasDeRampa` sigue siendo la cuenta completa y `check:teclado`
 *  la recorre entera: si mañana el umbral sube, el alto ya está resuelto. */
export function altoDeRampa(filas: number) {
  return filas >= RAMPA_FILAS_APRETADO ? RAMPA_ROW_APRETADO : RAMPA_ROW
}

/** El ancho de la tecla empaquetada.
 *
 *  Las columnas salen de la fila MÁS LARGA y no de cada fila: así las teclas de
 *  todas las filas miden lo mismo y el bloque se lee como un teclado y no como
 *  dos tiras de botones de tamaños distintos. */
export function anchoDeRampa(filas: EntradaDeTecla[][]) {
  return anchoDeTecla(
    Math.max(RAMPA_MIN_COL, ...filas.map((fila) => fila.length)),
  )
}

const KEY_CLASS =
  "flex select-none items-center justify-center rounded-md bg-background leading-none transition-colors active:bg-accent"

// KaTeX mete su propio tamaño (`.katex { font-size: 1.21em }`) y un poco de
// aire vertical pensado para texto corrido; acá el glifo tiene que ocupar la
// tecla y nada más.
const GLYPH_CLASS = "[&_.katex]:text-[1em] [&_.katex]:leading-none"

export function MathKeyboard({
  input,
  keys = [],
  newKeys = [],
  numpad = true,
  bare = false,
  fijas = null,
  newFijas = [],
  className,
}: {
  input: React.RefObject<MathInputHandle | null>
  // Inventario completo del jugador, en orden canónico.
  keys?: string[]
  // Las que se desbloquearon con ESTE ejercicio: son las únicas que nacen con
  // animación.
  newKeys?: string[]
  // Sin caja propia: en escritorio el teclado va dentro de la misma card que el
  // enunciado, separado apenas por una línea.
  bare?: boolean
  // El numérico solo hace falta donde no hay teclado físico. En escritorio los
  // dígitos se tipean, y un pad de doce teclas para eso era la mitad del alto
  // del panel ocupada por lo más fácil de escribir. Lo que queda es lo que la
  // botonera aporta de verdad: lo que uno no sabe cómo escribir.
  numpad?: boolean
  // Las teclas FIJAS desbloqueadas (`dx-rampa-1`). `null` = el bloque completo,
  // que es lo que ve el brazo control y lo que veía todo el mundo antes.
  //
  // Solo tiene efecto CON numérico, o sea en el teléfono. En escritorio no hay
  // dígitos que recortar —se tipean— y el teclado físico sigue funcionando en
  // paralelo, así que la rampa ahí no significaría nada. Que esa condición viva
  // en una sola línea es a propósito: es lo que hace que «el teclado es palanca
  // de teléfono» sea verificable y no una convención repartida.
  fijas?: string[] | null
  // Las fijas recién desbloqueadas, para que solo esas nazcan con animación.
  // Aparte de `newKeys` porque son otra familia de ids y otra fila.
  newFijas?: string[]
  className?: string
}) {
  const sfx = useSfx()
  const reduceMotion = useReducedMotion()

  const press = (key: Key) => {
    sfx.select()
    if (key.action === "clear") {
      input.current?.clear()
      input.current?.focus()
      return
    }
    if (key.cmd) input.current?.command(key.cmd)
    else if (key.insert) input.current?.insert(key.insert)
  }

  const button = (
    key: Key,
    id: string,
    opts?: { className?: string; style?: React.CSSProperties; nueva?: boolean },
  ) => (
    <motion.button
      key={id}
      type="button"
      // El mousedown robaría el foco del mathfield y el insert iría a la nada:
      // se previene y el click hace el trabajo.
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => press(key)}
      style={opts?.style}
      // `layout` es lo que hace que las teclas que ya estaban se corran solas
      // cuando entra una nueva, en vez de saltar a su lugar nuevo.
      layout={!reduceMotion}
      // Solo las recién desbloqueadas nacen: si todas animaran en cada
      // ejercicio, el teclado parpadearía todo el tiempo y el desbloqueo
      // dejaría de significar algo.
      initial={opts?.nueva && !reduceMotion ? { scale: 0.4, opacity: 0 } : false}
      animate={{ scale: 1, opacity: 1 }}
      transition={
        reduceMotion
          ? { duration: 0 }
          : { type: "spring", stiffness: 420, damping: 26 }
      }
      className={cn(
        KEY_CLASS,
        SIZES[key.size ?? "md"],
        TONES[key.tone ?? "plain"],
        key.fisica && !numpad && "relative overflow-hidden",
        key.atajo && !numpad && "gap-1.5 px-2",
        opts?.className,
      )}
    >
      {key.fisica && !numpad && <PulsoBlanco seq={pulsoDe(key)} />}
      {key.tex !== undefined ? (
        <span
          className={cn(GLYPH_CLASS, "relative z-10")}
          dangerouslySetInnerHTML={{ __html: glyph(key.tex) }}
        />
      ) : (
        <span className="relative z-10 flex">{key.node}</span>
      )}
      {key.atajo && !numpad && (
        <KeyCap className="relative z-10 ml-0 text-muted-foreground">{key.atajo}</KeyCap>
      )}
    </motion.button>
  )

  // El inventario desbloqueado, en orden canónico y con la tecla cruda: el
  // glifo que se usa —corto o largo— lo elige cada destino, porque la misma
  // tecla se dibuja distinto en el pad (donde la celda mide 39 px) que en la
  // fila ancha (donde puede decir `sen(□)`).
  const dynamic = useMemo(
    () =>
      (numpad
        ? keys
        : [...SIEMPRE_EN_ESCRITORIO, ...keys.filter((id) => !SIEMPRE_EN_ESCRITORIO.includes(id))]
      )
        // El id viaja junto a la tecla: un id desconocido se descarta, y si el
        // índice se leyera después contra `keys` la columna y la React key
        // quedarían corridas a partir de ahí.
        .map((id) => ({ id, key: DYNAMIC[id] }))
        .filter((entry) => entry.key !== undefined)
        .map((entry) => ({
          id: entry.id,
          key: entry.key,
          nueva: newKeys.includes(entry.id),
        })),
    [keys, newKeys, numpad],
  )

  // El pulso de cada tecla física, por `e.key`. Escucha en captura sobre el
  // documento porque el keydown nace en el editable del shadow DOM de MathLive
  // y de ahí sube compuesto; no se frena nada: la tecla física sigue haciendo
  // lo suyo en el campo y la de pantalla solo acusa recibo. Un campo HTML de
  // verdad —el chat— no cuenta: ahí un paréntesis es un paréntesis.
  const [pulsos, setPulsos] = useState<Record<string, number>>({})
  useEffect(() => {
    if (numpad) return
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return
      if (enCampoHtml(e.target)) return
      const k = e.key
      setPulsos((p) => ({ ...p, [k]: (p[k] ?? 0) + 1 }))
    }
    document.addEventListener("keydown", onKey, true)
    return () => document.removeEventListener("keydown", onKey, true)
  }, [numpad])
  const pulsoDe = (key: Key) =>
    key.fisica && !numpad
      ? Math.max(0, ...key.fisica.map((k) => pulsos[k] ?? 0))
      : 0

  // El reparto del teléfono. Las primeras entran al pad con el glifo corto; las
  // que sobran suben a la fila ancha con el largo.
  //
  // Cae solo donde tiene que caer: el orden canónico arranca con las compactas
  // (□^□, □², √□, □/□, e, e^□) y termina con las funciones, así que lo que queda
  // arriba es justamente lo que gana con la forma extendida —`sen(□)` dice que
  // inserta el paréntesis y el hueco; `sen` no dice nada— y lo que baja es lo
  // que entra sin apretarse en una celda del pad.
  const padDynamic = dynamic.slice(0, PAD_DYNAMIC_SLOTS)
  const wideDynamic = dynamic.slice(PAD_DYNAMIC_SLOTS)

  // Las teclas fijas de escritorio bajan de cuerpo: contra una fila dinámica
  // más alta, el `lg` de antes las hacía competir con lo que sí cambia.
  const strip = (key: Key): Key => ({ ...key, size: "md" })
  const stripGrid = {
    height: STRIP_ROW,
    gridTemplateColumns: `repeat(${GRID_COLS}, minmax(0, 1fr))`,
  }

  // El alto del pad se reparte SIEMPRE en las mismas cuatro unidades que el
  // numérico de al lado, y lo que cambia es cómo se dividen: las filas que pide
  // el inventario valen una unidad cada una, y las dos fijas se reparten lo que
  // sobra. De ahí sale toda la progresión sin ningún caso especial —
  //
  //   sin teclas   → 0 + 2 filas de 2 unidades  (las grandes de siempre)
  //   hasta cuatro → 1 + 2 filas de 1,5
  //   hasta ocho   → 2 + 2 filas de 1           (todas del alto de un dígito)
  //
  // — y el bloque nunca deja un hueco al lado del numérico ni crece de alto.
  // Se probó dejar que `1fr` repartiera solo: medido, las filas se quedan en su
  // mínimo y el sobrante queda al pie del bloque.
  // Las filas del inventario en ESCRITORIO: una sola mientras entren, dos
  // partidas por la mitad cuando no. Explícitas y no libradas al `flex-wrap`
  // porque de su cantidad depende cómo se dibuja el bloque fijo de abajo, y eso
  // hay que saberlo al renderizar, no después de medir.
  const dynDesktopRows = useMemo(() => {
    if (numpad || dynamic.length === 0) return []
    if (dynamic.length <= DYN_ONE_ROW_MAX) return [dynamic]
    return [dynamic.slice(0, DYN_ONE_ROW_MAX), dynamic.slice(DYN_ONE_ROW_MAX)]
  }, [dynamic, numpad])

  // ¿El teclado está en rampa? Hace falta que el backend haya mandado la lista
  // (o sea que la persona esté en un brazo tratado), que ESTE teclado tenga
  // numérico (o sea que sea el del teléfono) y que todavía falte alguna tecla.
  // Cuando el bloque fijo se completa, el teclado vuelve a ser el de siempre sin
  // ningún caso especial.
  //
  // Y que el empaquetado todavía ocupe menos que el definitivo: cuando pediría
  // sus mismas cuatro filas, va el definitivo (ver `RAMPA_FILAS_A_DEFINITIVO`).
  const filasRampaONada = useMemo(
    () =>
      fijas !== null && numpad ? rampaDibujada(fijas, dynamic, newFijas) : null,
    [fijas, numpad, dynamic, newFijas],
  )
  const enRampa = filasRampaONada !== null
  const filasRampa = filasRampaONada ?? []
  const anchoRampa = anchoDeRampa(filasRampa)

  // Qué teclas van a la fila ancha de arriba. En rampa, ninguna: el inventario
  // ya está adentro de `filasRampa`, y dibujarlo acá también sería dibujarlo dos
  // veces.
  const dinFilaAncha = enRampa ? [] : wideDynamic

  const altoRampa = altoDeRampa(filasRampa.length)

  const padDinFilas = Math.ceil(padDynamic.length / PAD_COLS)
  const padFijasAlto = (PAD_ROWS - padDinFilas) / 2
  const padRows = {
    gridTemplateRows: [
      padDinFilas > 0 ? `repeat(${padDinFilas}, minmax(${ROW_MIN}, 1fr))` : "",
      `repeat(2, minmax(calc(${ROW_MIN} * ${padFijasAlto}), 1fr))`,
    ]
      .filter(Boolean)
      .join(" "),
  }

  // `minmax(ROW_MIN, 1fr)` y no `1fr` pelado: en el teléfono el teclado va en
  // flujo natural (sin alto que repartir) y con 1fr las filas colapsarían a
  // cero; en escritorio hay alto de sobra y crecen.
  const numRows = { gridTemplateRows: `repeat(${PAD_ROWS}, minmax(${ROW_MIN}, 1fr))` }

  return (
    <div
      className={cn(
        "flex flex-col gap-1.5",
        // Sin caja propia va pegado al campo, sin línea que lo separe: el
        // teclado es con qué se escribe la respuesta, no una sección aparte.
        //
        // El teclado es dueño de sus DOS aires: el que lo separa del campo (la
        // card de arriba no lleva padding abajo cuando es `bare`) y el que lo
        // separa del fondo de la caja. El de abajo es más grande a propósito —
        // como la caja tiene alto fijo y el teclado está apoyado contra el
        // fondo, ese padding es lo único que lo levanta, y a él se le sube
        // también el campo. Lo que cede es la caja de la fórmula, que es la que
        // crece con lo que sobra.
        // `px-4` y no `px-2`: es el mismo margen lateral que la card de arriba
        // (exercise-card.tsx), así las teclas apoyan en la misma vertical que la
        // pastilla del marcador y la caja de la fórmula. Con 8 px de diferencia,
        // en el teléfono —donde el canal no llega al tope de 28rem y nada lo
        // empareja— se veían tres verticales distintas bajando por la pantalla.
        //
        // En una pantalla corta ese aire es lo primero que sobra. Con los 48 px
        // de `pt-4 pb-8`, la card de 667 queda 14 px corta y recorta el marcador
        // —tanto con el teclado completo como con el empaquetado de cuatro
        // filas, que dan los dos 226—. Con 24, los dos entran en los 212
        // disponibles. `max-height` y no `max-width`: lo que falta es alto, y hay
        // teléfonos anchos y cortos. 700 px es el corte porque un 667 entra y un
        // 812 no.
        bare
          ? "px-4 pt-4 pb-8 [@media(max-height:700px)]:pt-2 [@media(max-height:700px)]:pb-4"
          : "rounded-lg border border-border bg-card p-2",
        ROW_VARS,
        className,
      )}
    >
      <div className="flex min-h-0 flex-1 flex-col gap-1.5">
      {/* El inventario desbloqueado. Cada tecla entra con su propia animación y
          `layout` mueve a las que ya estaban, así desbloquear una se ve como que
          el teclado crece y no como que se redibuja de cero. Que se reacomoden
          al entrar una nueva es parte del trato: el orden canónico se respeta,
          pero la posición dentro de las filas se rearma hasta que el inventario
          está completo.

          Esta fila es la ÚNICA que se sale del canal de 28rem: crece a lo ancho
          de la card. Es lo que mantiene el teclado en TRES filas —dos de
          inventario y la tira fija— con las once teclas desbloqueadas. Con el
          tope de 28rem, las formas largas pedían ~783 px y envolvían en tres
          filas, que con la tira daban cuatro y desbordaban la card. Al crecer a
          lo ancho no se pierde alineación: la fila está centrada, así que con
          pocas teclas queda igual de angosta que el campo de arriba, y solo se
          pasa de ese ancho cuando de verdad hace falta.

          En rampa esta fila va VACÍA: ahí el inventario se dibuja adentro de las
          filas empaquetadas de abajo (`filasDeRampa`), que es lo único que lo
          mantiene dentro del alto de la card. */}
      {(numpad
        ? dinFilaAncha.length > 0
          ? [dinFilaAncha]
          : []
        : dynDesktopRows
      ).map(
        (fila, f) => (
          <div
            key={`din-${f}`}
            className="flex shrink-0 flex-wrap justify-center gap-1.5"
          >
            {fila.map((entry) =>
              button(
                {
                  ...entry.key,
                  tex: entry.key.texWide ?? entry.key.tex,
                  // Las que tienen forma larga —ln, log, sen, cos, tan— bajan de
                  // cuerpo. Son las únicas cuyo glifo es una PALABRA más un
                  // paréntesis con hueco adentro, así que al mismo tamaño que un
                  // `e` suelto pesan el doble y la fila se ve despareja. Y de
                  // paso miden ~10% menos, que es ancho que la fila agradece.
                  size: entry.key.texWide ? "dyn" : "sm",
                },
                `dyn-${entry.id}`,
                {
                  className: "min-w-[2.6rem] px-3",
                  style: { height: numpad ? DYNAMIC_ROW : DYNAMIC_ROW_DESKTOP },
                  nueva: entry.nueva,
                },
              ),
            )}
          </div>
        ),
      )}
      {enRampa ? (
        // El teclado INCOMPLETO no conserva la grilla de calculadora con huecos:
        // se empaqueta en filas centradas y parejas del mismo tamaño. La grilla
        // de la Casio existe para que el dedo encuentre el 7 sin mirar, y eso no
        // se puede cumplir con tres teclas; con huecos, además, el bloque se lee
        // como un teclado roto en vez de como uno que crece.
        //
        // El costo, asumido: las teclas se mueven de lugar mientras el
        // inventario crece. Es el mismo trato que ya tiene la fila dinámica
        // —«la posición final se alcanza con el vocabulario completo»— y es lo
        // que además libera el alto que la fila de ayudas ocupa abajo.
        filasRampa.map((fila, f) => (
          <div
            key={`rampa-${f}`}
            className="flex shrink-0 justify-center gap-1.5"
          >
            {fila.map((entry, i) =>
              button(entry.key, `rampa-${f}-${i}`, {
                style: { width: anchoRampa, height: altoRampa },
                nueva: entry.nueva,
              }),
            )}
          </div>
        ))
      ) : numpad ? (
        // El bloque de abajo SÍ va en el canal de 28rem, igual que el campo de
        // la respuesta y la caja de la fórmula (exercise-card.tsx ::
        // PANEL_CONTENT): es lo que hace que el panel se lea como una columna.
        // En un teléfono el canal no llega al tope y ocupa todo el ancho igual.
        <div className={cn("flex min-h-0 flex-1 gap-1.5", CONTENT_WIDTH)}>
          {/* El numérico va PRIMERO: es lo que lo pone a la izquierda, donde
              lo tiene la calculadora. Es el único cambio que hizo falta para
              espejar el teclado — el pad conserva sus columnas tal cual, y por
              eso las operaciones terminan contra el borde derecho de la
              pantalla en vez de contra el izquierdo. */}
          <div className="grid flex-[3] grid-cols-3 gap-1.5" style={numRows}>
            {NUMPAD.map((key, i) => button(key, `num-${i}`))}
          </div>
          {/* El pad: cuatro columnas con las fijas abajo y el inventario encima.

              Las filas se ESTIRAN para llenar el alto del numérico, y de ahí
              sale solo el comportamiento que se quiere: con el inventario vacío
              son dos filas de doble alto —las teclas grandes de siempre— y a
              medida que se desbloquean teclas las filas se reparten el mismo
              alto y van bajando hasta emparejarse con los dígitos. Nunca queda
              un hueco al lado del numérico, y el teclado no crece.

              Las dinámicas van a `dyn` (0.95rem) y no a `sm`: la celda mide
              39 px y `log_□` pedía 45.7 con el cuerpo grande. */}
          <div className="grid flex-[4] grid-cols-4 gap-1.5" style={padRows}>
            {padDynamic.map((entry) =>
              button({ ...entry.key, size: "dyn" }, `dyn-${entry.id}`, {
                nueva: entry.nueva,
              }),
            )}
            {PAD_FIXED.map((key, i) =>
              button(key, `pad-${i}`, {
                // La primera fija abre fila propia: si las dinámicas dejaron una
                // fila a medias, sin esto la siguiente tecla entraría en el
                // hueco que quedó y el bloque fijo se correría de lugar.
                style: i === 0 ? { gridColumn: 1 } : undefined,
              }),
            )}
          </div>
        </div>
      ) : (
        // Sin numérico no hay pad sino tiras, centradas dentro de las mismas
        // diez columnas: una sola cuando el inventario ya ocupa dos filas, y
        // partida en dos —lo que se escribe, lo que se edita— cuando ocupa una.
        // Es lo que mantiene el teclado en tres filas siempre (ver
        // DYN_ONE_ROW_MAX). Los dos repartos son pares y la grilla también, así
        // que las dos quedan centradas exactas.
        (dynDesktopRows.length > 1
          ? [STRIP]
          : [STRIP_WRITE_ATAJOS, STRIP_EDIT_ATAJOS]
        ).map((fila, f) => {
          const inicios = columnasDeTira(fila.map((key) => key.ancho ?? 1))
          return (
            <div
              key={`tira-${f}`}
              className={cn("grid shrink-0 gap-1.5", CONTENT_WIDTH)}
              style={stripGrid}
            >
              {fila.map((key, i) =>
                button(strip(key), `strip-${f}-${i}`, {
                  style: {
                    gridColumn: `${inicios[i]} / span ${key.ancho ?? 1}`,
                  },
                }),
              )}
            </div>
          )
        })
      )}
      </div>
    </div>
  )
}
