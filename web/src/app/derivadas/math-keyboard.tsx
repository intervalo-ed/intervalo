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

import { useMemo } from "react"
import { motion, useReducedMotion } from "motion/react"
import katex from "katex"
// Lo importa también math-text.tsx, y el bundler lo deduplica; va acá igual
// porque este módulo no debería depender de que otro haya cargado la hoja.
import "katex/dist/katex.min.css"
import { ArrowLeft, ArrowRight, Delete } from "lucide-react"
import { cn } from "@/lib/utils"
import { useSfx } from "@/lib/audio/useSfx"
import type { MathInputHandle } from "./math-input"

type Key = {
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
const DYNAMIC: Record<string, Key> = {
  pow: { tex: `${BOX}^{${BOX}}`, insert: "#@^{#?}" },
  sq: { tex: `${BOX}^{2}`, insert: "#@^{2}" },
  sqrt: { tex: `\\sqrt{${BOX}}`, insert: "\\sqrt{#?}" },
  frac: { tex: `\\frac{${BOX}}{${BOX}}`, insert: "\\frac{#?}{#?}" },
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
const ROW_VARS = "[--kb-row:2.5rem] md:[--kb-row:2.05rem]"

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
const PAD_DYNAMIC_SLOTS = PAD_COLS * PAD_ROWS - 8

// En escritorio las tres filas miden lo MISMO: el teclado se lee como una
// grilla pareja. La dinámica supo ser más alta —era la que cambiaba entre
// ejercicios— pero ahora es un inventario que crece, y con una sola tecla
// desbloqueada esa fila más alta se veía como un botón suelto de otro tamaño.
// El alto alcanza para los glifos compuestos (√□, e^□ miden 30 px).
const DYNAMIC_ROW = "2.75rem"
const DYNAMIC_ROW_DESKTOP = "2.6rem"
export const STRIP_ROW = "2.6rem"

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

/** Cuántas teclas tiene cada tira de escritorio. Derivado y no escrito a mano:
 *  lo lee el esqueleto de carga (desktop-layout.tsx :: ExerciseSkeleton) para
 *  dibujar las mismas celdas, y con un literal ahí las dos cosas se separaban en
 *  cuanto alguien sumara una tecla. */
export const LARGOS_DE_TIRA = [STRIP_WRITE.length, STRIP_EDIT.length]

/** En qué columna arranca la tecla `indice` de una tira de `total`, para que la
 *  tira quede centrada en las diez columnas. La usan el teclado y su esqueleto:
 *  si el centrado se calculara dos veces, alcanzaría con tocar una para que las
 *  teclas del esqueleto dejaran de caer donde caen las de verdad. */
export function columnaDeTira({ total, indice }: { total: number; indice: number }) {
  return Math.floor((GRID_COLS - total) / 2) + 1 + indice
}
const STRIP: Key[] = [...STRIP_EDIT, ...STRIP_WRITE]

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
const DYN_ONE_ROW_MAX = 7

// Ancho del contenido, tanto acá como en la card del ejercicio: las teclas y el
// campo donde se escribe la respuesta comparten el mismo canal centrado, así el
// panel entero se lee como una columna y no como tres cajas de anchos
// distintos. Ver ExerciseCard :: PANEL_CONTENT.
export const CONTENT_WIDTH = "mx-auto w-full max-w-[32rem]"

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
        opts?.className,
      )}
    >
      {key.tex !== undefined ? (
        <span
          className={GLYPH_CLASS}
          dangerouslySetInnerHTML={{ __html: glyph(key.tex) }}
        />
      ) : (
        key.node
      )}
    </motion.button>
  )

  // El inventario desbloqueado, en orden canónico y con la tecla cruda: el
  // glifo que se usa —corto o largo— lo elige cada destino, porque la misma
  // tecla se dibuja distinto en el pad (donde la celda mide 39 px) que en la
  // fila ancha (donde puede decir `sen(□)`).
  const dynamic = useMemo(
    () =>
      keys
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
    [keys, newKeys],
  )

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
        bare ? "px-4 pb-8 pt-4" : "rounded-lg border border-border bg-card p-2",
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
          pasa de ese ancho cuando de verdad hace falta. */}
      {(numpad ? (wideDynamic.length > 0 ? [wideDynamic] : []) : dynDesktopRows).map(
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
      {numpad ? (
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
        (dynDesktopRows.length > 1 ? [STRIP] : [STRIP_WRITE, STRIP_EDIT]).map(
          (fila, f) => (
            <div
              key={`tira-${f}`}
              className={cn("grid shrink-0 gap-1.5", CONTENT_WIDTH)}
              style={stripGrid}
            >
              {fila.map((key, i) =>
                button(strip(key), `strip-${f}-${i}`, {
                  style: {
                    gridColumnStart: columnaDeTira({ total: fila.length, indice: i }),
                  },
                }),
              )}
            </div>
          ),
        )
      )}
      </div>
    </div>
  )
}
