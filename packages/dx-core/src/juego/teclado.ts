// El teclado del juego, sin dibujo: qué teclas hay, qué inserta cada una, en
// qué orden van y cuáles se ven según lo que el servidor desbloqueó (la rampa).
// Lo comparten la web (web/src/app/derivadas/math-keyboard.tsx) y la app
// nativa (mobile/components/juego/math-keyboard.tsx); cada una pone su dibujo.
//
// Son dos zonas:
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
//     estudiante ya tiene aprendida en el dedo.
//   · Una fila DINÁMICA arriba con lo que ESTE ejercicio necesita más un par de
//     distractores de la misma familia. La calcula el backend a partir de la
//     derivada esperada (backend/game/keyboard.py) y viene en `keys`.

/** El color del glifo, por rol: la misma operación tiene siempre el mismo
 *  color, así la vista la encuentra sin leer. */
export type Tono =
  | "plain"
  | "add"
  | "sub"
  | "unknown"
  | "mul"
  | "paren"
  | "nav"
  | "clear"
  | "erase"

/** Tamaño relativo del glifo. Los símbolos necesitan más cuerpo que los dígitos
 *  para leerse igual de bien: en KaTeX un `+` ocupa mucho menos alto que un `7`. */
export type Tamano = "dyn" | "sm" | "md" | "lg" | "num"

/** Las teclas que no son matemática sino acciones del editor se dibujan con un
 *  ícono, y cada plataforma pone el suyo. */
export type IconoDeTecla = "izquierda" | "derecha" | "borrar"

export type Key = {
  // LaTeX del glifo. Las que no lo tienen llevan `icono`.
  tex?: string
  // La versión larga, con el argumento a completar: `sen(□)` en vez de `sen`.
  // Es la que dice de verdad qué hace la tecla y es la que se usa donde hay
  // ancho. En el teléfono la tecla es un botón para el pulgar y ahí queda la
  // corta.
  texWide?: string
  icono?: IconoDeTecla
  // El glifo como texto plano (unicode), para donde no se compone LaTeX.
  texto: string
  insert?: string
  cmd?: string
  action?: "clear"
  tone?: Tono
  size?: Tamano
  // Solo escritorio. `fisica` son los `e.key` del teclado físico que hacen lo
  // mismo que esta tecla: cuando se aprieta uno, la tecla de pantalla pulsa.
  // `atajo` es el texto del chip que lo muestra, y una tecla con chip ocupa
  // `ancho` columnas de la tira.
  fisica?: readonly string[]
  atajo?: string
  ancho?: number
}

/** Qué hace una tecla al tocarla, sin importar quién dibuja el campo. */
export type AccionDeTecla =
  | { tipo: "insert"; latex: string }
  | { tipo: "cmd"; cmd: string }
  | { tipo: "clear" }

export function accionDeTecla({ key }: { key: Key }): AccionDeTecla | null {
  if (key.action === "clear") return { tipo: "clear" }
  if (key.cmd) return { tipo: "cmd", cmd: key.cmd }
  if (key.insert) return { tipo: "insert", latex: key.insert }
  return null
}

// Hueco de los argumentos que faltan. `\square` es el mismo cuadrado hueco que
// usa la notación de libro para un lugar a completar.
const BOX = "\\square"

// Izquierda: lo que estructura la expresión y lo que mueve el cursor.
export const LEFT: Key[] = [
  { tex: "(", texto: "(", insert: "(", tone: "paren", size: "lg" },
  { tex: ")", texto: ")", insert: ")", tone: "paren", size: "lg" },
  { icono: "izquierda", texto: "←", cmd: "moveToPreviousChar", tone: "nav" },
  { icono: "derecha", texto: "→", cmd: "moveToNextChar", tone: "nav" },
]

// Centro: la incógnita y las cuatro operaciones.
//
// Los tres operadores van en `\boldsymbol`: en la fuente matemática de KaTeX el
// `+`, el `−` y sobre todo el `·` son trazos finos pensados para leerse DENTRO
// de una fórmula. Solos en el centro de una tecla se veían desvaídos y el punto
// directamente desaparecía. La negrita es solo del glifo: lo que insertan sigue
// siendo el símbolo normal.
export const CENTER: Key[] = [
  { tex: "x", texto: "x", insert: "x", tone: "unknown", size: "lg" },
  { tex: "\\boldsymbol{+}", texto: "+", insert: "+", tone: "add", size: "lg" },
  { tex: "\\boldsymbol{-}", texto: "−", insert: "-", tone: "sub", size: "lg" },
  // `∙` (el operador) y no `·`: en texto plano el punto medio es un punto de
  // tipografía y en la tecla no se ve, que es lo mismo que pasaba con KaTeX.
  { tex: "\\boldsymbol{\\cdot}", texto: "∙", insert: "\\cdot", tone: "mul", size: "lg" },
]

// Las mismas ocho teclas fijas, ya intercaladas para el pad del teléfono: los
// dos bloques de dos columnas se fundieron en una grilla de cuatro, y el orden
// de lectura que había —( ) x + arriba, ← → − · abajo— se conserva alternando
// las listas de a dos. Bajan a `md`: a igual tamaño que el numérico, `lg` las
// hacía ver desproporcionadas.
export const PAD_FIXED: Key[] = [
  ...LEFT.slice(0, 2),
  ...CENTER.slice(0, 2),
  ...LEFT.slice(2),
  ...CENTER.slice(2),
].map((key) => ({ ...key, size: "md" as const }))

const NUM = (d: string): Key => ({ tex: d, texto: d, insert: d, size: "num" })

export const CLEAR_KEY: Key = { tex: "\\mathrm{C}", texto: "C", action: "clear", tone: "clear" }
export const ERASE_KEY: Key = { icono: "borrar", texto: "⌫", cmd: "deleteBackward", tone: "erase" }

export const NUMPAD: Key[] = [
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
  pow: { tex: `${BOX}^{${BOX}}`, texto: "□ⁿ", insert: "#@^{#?}", atajo: "^", fisica: ["^"] },
  sq: { tex: `${BOX}^{2}`, texto: "□²", insert: "#@^{2}" },
  sqrt: { tex: `\\sqrt{${BOX}}`, texto: "√□", insert: "\\sqrt{#?}" },
  // `#@` y no `#?` en el numerador: es el token de argumento implícito de
  // MathLive —"comete lo que está justo antes del cursor"— y es lo que hace que
  // escribir `1` y tocar esta tecla dé `1/□` con el cursor abajo, en vez de
  // dejar el 1 al costado de una fracción vacía.
  //
  // `sqrt` NO lleva `#@` a propósito: `\sqrt{#@}` no deja ningún hueco, así que
  // el cursor terminaría fuera del radical en vez de adentro.
  frac: {
    tex: `\\frac{${BOX}}{${BOX}}`,
    texto: "□/□",
    insert: "\\frac{#@}{#?}",
    atajo: "/",
    fisica: ["/"],
  },
  e: { tex: "e", texto: "e", insert: "e" },
  expx: { tex: `e^{${BOX}}`, texto: "e□", insert: "e^{#?}" },
  ln: {
    tex: "\\ln",
    texWide: `\\ln\\left(${BOX}\\right)`,
    texto: "ln",
    insert: "\\ln\\left(#?\\right)",
  },
  log: {
    tex: `\\log_{${BOX}}`,
    texWide: `\\log_{${BOX}}\\left(${BOX}\\right)`,
    texto: "log□",
    insert: "\\log_{#?}\\left(#?\\right)",
  },
  sen: {
    tex: "\\operatorname{sen}",
    texWide: `\\operatorname{sen}\\left(${BOX}\\right)`,
    texto: "sen",
    insert: "\\operatorname{sen}\\left(#?\\right)",
  },
  cos: {
    tex: "\\cos",
    texWide: `\\cos\\left(${BOX}\\right)`,
    texto: "cos",
    insert: "\\cos\\left(#?\\right)",
  },
  // El id sigue siendo `tg` —viaja al backend y está guardado en
  // `game_players.unlocked_keys`, así que renombrarlo dejaría a todo el mundo
  // sin su tecla— pero lo que se ve y lo que inserta es `tan`.
  tg: {
    tex: "\\tan",
    texWide: `\\tan\\left(${BOX}\\right)`,
    texto: "tan",
    insert: "\\tan\\left(#?\\right)",
  },
}

// ── Las medidas ─────────────────────────────────────────────────────────────
//
// En rem, para que cada plataforma las traduzca a su unidad (la web las pone en
// CSS; la app las multiplica por 16).

/** El alto de fila del numérico en el teléfono (`--kb-row` de la web). La tecla
 *  se toca con el pulgar y achicarla la vuelve imposible de acertar. */
export const KB_ROW_TELEFONO_REM = 2.5

/** El alto de la fila ancha del inventario en el teléfono. */
export const DYNAMIC_ROW_REM = 2.75

/** El hueco entre teclas, en rem. Es el `gap-1.5` de las filas. */
export const RAMPA_GAP_REM = 0.375

// En escritorio todas las filas comparten una grilla de DIEZ columnas: caen en
// las mismas verticales, que es lo que hace que se lean como un teclado y no
// como tres tiras sueltas.
export const GRID_COLS = 10

// El pad del teléfono: las cuatro columnas de la DERECHA, al lado del numérico.
// Las fijas miden lo mismo que un dígito y el pad tiene 4×4 = 16 lugares: ocho
// para las fijas y OCHO para el inventario, que así no necesita filas aparte.
// Solo las que no entran suben a la fila ancha de arriba.
export const PAD_COLS = 4
// Cuatro filas, las mismas que el numérico: es lo que hace que los dos bloques
// midan igual.
export const PAD_ROWS = 4
export const PAD_DYNAMIC_SLOTS = PAD_COLS * PAD_ROWS - 8

/** Cómo se reparte el alto del pad del teléfono, en unidades de fila del
 *  numérico. Siempre suma `PAD_ROWS`: las filas que pide el inventario valen
 *  una unidad cada una, y las dos fijas se reparten lo que sobra —
 *
 *    sin teclas   → 0 + 2 filas de 2 unidades  (las grandes de siempre)
 *    hasta cuatro → 1 + 2 filas de 1,5
 *    hasta ocho   → 2 + 2 filas de 1           (todas del alto de un dígito)
 *
 *  — y el bloque nunca deja un hueco al lado del numérico ni crece de alto. */
export function filasDelPad({ dinamicasEnElPad }: { dinamicasEnElPad: number }) {
  const dinamicas = Math.ceil(dinamicasEnElPad / PAD_COLS)
  return { dinamicas, altoDeFija: (PAD_ROWS - dinamicas) / 2 }
}

// La fila fija de escritorio, espejada por el mismo motivo que el pad del
// teléfono: en la calculadora las operaciones viven contra el borde DERECHO.
// Se espeja el orden de los GRUPOS, no el contenido de cada uno.
export const STRIP_WRITE: Key[] = [...LEFT.slice(0, 2), ...CENTER]
export const STRIP_EDIT: Key[] = [CLEAR_KEY, ERASE_KEY, ...LEFT.slice(2)]

// Las mismas tiras, con el atajo físico a la vista: las teclas que tienen un
// carácter propio en el teclado real ocupan dos columnas y llevan el chip.
//
// «Salir» es el Tab de MathLive (moveToNextGroup): sale del exponente o del
// denominador y sigue en el renglón.
const conAtajo = (key: Key, atajo: string, fisica: readonly string[]): Key => ({
  ...key,
  atajo,
  fisica,
  ancho: 2,
})
export const SALIR_KEY: Key = {
  tex: `${BOX}\\!\\rightarrow`,
  texto: "□→",
  cmd: "moveToNextGroup",
  tone: "nav",
  size: "sm",
}
export const STRIP_WRITE_ATAJOS: Key[] = [
  conAtajo(LEFT[0], "(", ["("]),
  conAtajo(LEFT[1], ")", [")"]),
  { ...CENTER[0], fisica: ["x"] },
  { ...CENTER[1], fisica: ["+"] },
  { ...CENTER[2], fisica: ["-"] },
  conAtajo(CENTER[3], "*", ["*"]),
]
export const STRIP_EDIT_ATAJOS: Key[] = [
  CLEAR_KEY,
  conAtajo(ERASE_KEY, "⌫", ["Backspace"]),
  { ...LEFT[2], fisica: ["ArrowLeft"] },
  { ...LEFT[3], fisica: ["ArrowRight"] },
  conAtajo(SALIR_KEY, "tab", ["Tab"]),
]

/** Cuántas columnas ocupa cada tecla de cada tira de escritorio. Derivado y no
 *  escrito a mano: lo lee el esqueleto de carga (desktop-layout.tsx ::
 *  ExerciseSkeleton) para dibujar las mismas celdas. */
export const ANCHOS_DE_TIRA: number[][] = [STRIP_WRITE_ATAJOS, STRIP_EDIT_ATAJOS].map(
  (fila) => fila.map((key) => key.ancho ?? 1),
)

/** En qué columna arranca cada tecla de una tira, para que la tira quede
 *  centrada en las diez columnas. */
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
// para los chips y las teclas vuelven a una columna.
export const STRIP: Key[] = [...STRIP_EDIT, ...STRIP_WRITE]

// En escritorio la potencia y la fracción están SIEMPRE, desbloqueadas o no:
// se tipean con `^` y `/`, y una tecla que muestra ese atajo enseña más de lo
// que distrae. En el teléfono siguen siendo del inventario.
export const SIEMPRE_EN_ESCRITORIO = ["pow", "frac"]

// El teclado de escritorio mide SIEMPRE tres filas: con el inventario chico el
// bloque fijo ocupa dos, y cuando el inventario pide dos filas propias las
// junta en una sola. El corte está medido con los anchos de cada glifo:
//
//   compactas (□^□ □² √□ □/□ e e^□)   ~265
//   + ln(□) 76                        ~347   ← el corte
//   + log_□(□) 97                     ~450   (entra por 7 px: demasiado justo)
//   + sen(□) 87                       ~543   ✗
export const DYN_ONE_ROW_MAX = 7

/** Una tecla dibujada, con el id del que salió.
 *
 *  El id viaja al lado de la tecla y no se reconstruye desde `key.insert`: el
 *  `·` inserta "\\cdot", los paréntesis son DOS teclas de un solo id y la C no
 *  inserta nada. Las de corregir —retroceso y flechas— llevan id vacío: no se
 *  desbloquean nunca. */
export type EntradaDeTecla = { id: string; key: Key; nueva: boolean }

/** El inventario dinámico desbloqueado, en orden canónico y con la tecla cruda:
 *  el glifo que se usa —corto o largo— lo elige cada destino.
 *
 *  Un id desconocido se descarta acá, ANTES de numerar: si el índice se leyera
 *  después contra `keys`, la columna quedaría corrida a partir de ahí. */
export function inventarioDinamico({
  keys,
  newKeys = [],
  numpad,
}: {
  keys: readonly string[]
  newKeys?: readonly string[]
  numpad: boolean
}): EntradaDeTecla[] {
  const ids = numpad
    ? keys
    : [...SIEMPRE_EN_ESCRITORIO, ...keys.filter((id) => !SIEMPRE_EN_ESCRITORIO.includes(id))]
  return ids
    .filter((id) => DYNAMIC[id] !== undefined)
    .map((id) => ({ id, key: DYNAMIC[id], nueva: newKeys.includes(id) }))
}

// ── La rampa del bloque fijo (ver backend/game/keyboard.py) ─────────────────
//
// El teclado arranca con lo que la primera respuesta necesita —la derivada de
// `x` es `1`, así que con una tecla alcanza— y crece. Los ids son los del
// backend (`keyboard.py :: FIJAS_ORDER`). Un id desconocido se ignora.
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

// Lo que se escribe arriba y lo que se edita abajo, la MISMA agrupación que las
// tiras de escritorio: el teclado incompleto y el de escritorio se leen como el
// mismo objeto.
const ORDEN_ESCRIBIR = [
  ...("0123456789".split("").map((d) => `f:${d}`)),
  "f:x", "f:+", "f:-", "f:*", "f:()",
]
const ORDEN_EDITAR = ["f:C"]

// Cuántas teclas entran en una fila del teclado empaquetado. A seis columnas la
// tecla mide 46,5 px en una pantalla de 375 y 44,3 en una de 360, que es el
// ancho de casi todo Android desde 2016.
export const RAMPA_MAX_COL = 6

/** El piso de columnas. Con muy pocas teclas la fila no se estira hasta el
 *  borde: tres teclas repartidas en todo el canal dan botones de 99 px que se
 *  leen como otra cosa, no como un teclado. */
export const RAMPA_MIN_COL = 5

/** Cuántas filas aguanta el teclado empaquetado antes de recortar la card. */
export const RAMPA_FILAS_MAX = 4

/** El alto de una tecla del teclado empaquetado. Más que las del numérico
 *  porque con pocas teclas sobra alto y una tecla grande es más fácil de
 *  acertar con el pulgar. Desde la cuarta fila vuelve al alto del numérico. */
export const RAMPA_ROW_REM = 2.9
export const RAMPA_FILAS_APRETADO = 4

/** Reparte una tira en filas de largo PAREJO, nunca de más de `columnas`:
 *  nueve teclas salen 5+4 y no 6+3. */
function repartir<T>(items: T[], columnas: number): T[][] {
  if (items.length === 0) return []
  const filas = Math.ceil(items.length / columnas)
  const por = Math.ceil(items.length / filas)
  return Array.from({ length: filas }, (_, i) => items.slice(i * por, (i + 1) * por))
}

/** Seis columnas mientras alcance; siete cuando con seis el bloque se pasaría
 *  de `RAMPA_FILAS_MAX`. */
function columnasDeRampa(escribir: number, editar: number) {
  const filas = (c: number) => Math.ceil(escribir / c) + Math.ceil(editar / c)
  let c = RAMPA_MAX_COL
  while (filas(c) > RAMPA_FILAS_MAX && c < escribir + editar) c += 1
  return c
}

/** Las filas del teclado empaquetado, dado lo que el servidor desbloqueó.
 *
 *  Es el único lugar donde se decide qué teclas ve alguien en rampa, y la forma
 *  de fallar no es dibujar feo sino dibujar de menos: una tecla que el servidor
 *  mandó y que no se dibuja es un ejercicio que no se puede contestar
 *  (`check:teclado` recorre todos los inventarios). */
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
  // adentro del pad, así que mientras el inventario tuviera ocho teclas o menos
  // no se dibujaba NINGUNA: el servidor desbloqueaba `frac` y `sq` al servir
  // 9/x —cuya derivada es −9/x²— y el ejercicio llegaba sin con qué escribir.
  //
  // Primero, que es donde el pad también las pone, y en cuerpo `dyn` por lo
  // mismo que en el pad: `log_□` no entra con el cuerpo de un dígito.
  const escribir: EntradaDeTecla[] = [
    ...dinamicas.map((entrada) => ({
      ...entrada,
      key: { ...entrada.key, size: "dyn" as const },
    })),
    ...teclas(ORDEN_ESCRIBIR),
  ]
  const editar: EntradaDeTecla[] = [
    ...teclas(ORDEN_EDITAR),
    ...[ERASE_KEY, ...LEFT.slice(2)].map((key) => ({ id: "", key, nueva: false })),
  ]
  // **Siempre DOS tiras, aunque entren en una.** Juntarlas mientras sumaran
  // seis o menos hacía que el teclado pasara de una fila a dos en cuanto se
  // desbloqueaba la segunda tecla, y el bloque entero saltaba de alto en medio
  // de la partida. Arriba lo que escribe, abajo lo que corrige: es lo que hace
  // que el retroceso esté siempre en el mismo lugar.
  const cols = columnasDeRampa(escribir.length, editar.length)
  return [...repartir(escribir, cols), ...repartir(editar, cols)]
}

/** A partir de cuántas filas el teclado empaquetado se rinde y pasa al
 *  definitivo, con el numérico. Cuatro, que es lo que mide el definitivo:
 *  cuando ya pide las mismas cuatro filas no ahorra alto, y va directamente la
 *  estructura final. */
export const RAMPA_FILAS_A_DEFINITIVO = 4

/** Las filas del teclado empaquetado, o `null` si toca el definitivo. */
export function rampaDibujada(
  fijas: string[],
  dinamicas: EntradaDeTecla[],
  newFijas: string[] = [],
): EntradaDeTecla[][] | null {
  if (fijas.length >= FIJAS_TOTAL) return null
  const filas = filasDeRampa(fijas, dinamicas, newFijas)
  return filas.length >= RAMPA_FILAS_A_DEFINITIVO ? null : filas
}

/** El alto de la tecla empaquetada según cuántas filas haya, en rem. Desde que
 *  cuatro filas pasan al definitivo la rama «apretada» no se dibuja; se queda
 *  porque `filasDeRampa` sigue siendo la cuenta completa. */
export function altoDeRampaRem(filas: number): number {
  return filas >= RAMPA_FILAS_APRETADO ? KB_ROW_TELEFONO_REM : RAMPA_ROW_REM
}

/** Con cuántas columnas se mide la tecla empaquetada. Salen de la fila MÁS
 *  LARGA y no de cada fila: así las teclas de todas las filas miden lo mismo. */
export function columnasDeRampaDibujada(filas: EntradaDeTecla[][]): number {
  return Math.max(RAMPA_MIN_COL, ...filas.map((fila) => fila.length))
}

/** El color de cada rol, a media asta: los tonos puros de paleta al lado de un
 *  enunciado en KaTeX hacían ver al teclado de otra aplicación, y bajarlos al
 *  tinte casi blanco dejaba de leer el rol. Esta franja —claridad ~68%,
 *  saturación ~55%— conserva el color sin gritar. `plain` y `nav` son el
 *  `--foreground` y el `--muted-foreground` del tema (`TEMA` en game-colors.ts).
 *  La web los escribe como clases de Tailwind (math-keyboard.tsx :: TONES), que
 *  tienen que ser literales: si cambia uno, cambian los dos. */
export const TONO_HEX: Record<Tono, string> = {
  plain: "#f6f8fc",
  add: "#7ECE9F",
  sub: "#E08E85",
  unknown: "#B99CE2",
  mul: "#81AADA",
  paren: "#DCBA74",
  nav: "#a4b3c6",
  clear: "#DCBA74",
  erase: "#E08E85",
}
