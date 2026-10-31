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
import {
  DYNAMIC_ROW_REM,
  DYN_ONE_ROW_MAX,
  GRID_COLS,
  NUMPAD,
  PAD_DYNAMIC_SLOTS,
  PAD_FIXED,
  PAD_ROWS,
  RAMPA_FILAS_APRETADO,
  RAMPA_GAP_REM,
  RAMPA_ROW_REM,
  STRIP,
  STRIP_EDIT_ATAJOS,
  STRIP_WRITE_ATAJOS,
  accionDeTecla,
  columnasDeRampaDibujada,
  columnasDeTira,
  filasDelPad,
  inventarioDinamico,
  rampaDibujada,
  type EntradaDeTecla,
  type IconoDeTecla,
  type Key,
  type Tamano,
  type Tono,
} from "@intervalo/dx-core/juego/teclado"
import { cn } from "@/lib/utils"
import { useSfx } from "@/lib/audio/useSfx"
import { KeyCap } from "./exercise-card"
import type { MathInputHandle } from "./math-input"
import { PulsoBlanco } from "./pulso"
import { enCampoHtml } from "./teclas"

// El catálogo de teclas, la rampa y los repartos viven en dx-core
// (packages/dx-core/src/juego/teclado.ts), compartidos con la app nativa. Acá
// queda el dibujo.
export { ANCHOS_DE_TIRA, GRID_COLS, columnasDeTira } from "@intervalo/dx-core/juego/teclado"

// Si cambia un tono acá, cambia en `TONO_HEX` de dx-core (la app nativa).
const TONES: Record<Tono, string> = {
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
}

const SIZES: Record<Tamano, string> = {
  // Las dinámicas de escritorio. Es el cuerpo que hace entrar al glifo MÁS ANCHO
  // del vocabulario en una tecla de la grilla de diez: medido, `log_□` pedía
  // 45.7 px sobre una tecla de 39.4 y se salía. A 0.95rem mide 34.7.
  dyn: "text-[0.95rem]",
  sm: "text-[1.05rem]",
  md: "text-[1.25rem]",
  lg: "text-[1.5rem]",
  // Los dígitos, un punto más chicos en escritorio. En el teléfono se quedan
  // como estaban: ahí la tecla ya es chica y el número es lo único que la hace
  // legible de un vistazo.
  num: "text-[1.25rem] md:text-[1.1rem]",
}

const ICONOS: Record<IconoDeTecla, React.ReactNode> = {
  izquierda: <ArrowLeft size={19} />,
  derecha: <ArrowRight size={19} />,
  borrar: <Delete size={19} />,
}

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

// Alto de fila del bloque fijo, en una variable CSS porque cambia por tamaño de
// pantalla. En escritorio baja a 2.05rem; en el teléfono se queda en 2.5rem
// (`KB_ROW_TELEFONO_REM` de dx-core: `check:teclado` verifica que coincidan).
const ROW_MIN = "var(--kb-row)"
// `--kb-strip` es el alto de las filas de ESCRITORIO (inventario y tiras). En
// una ventana baja bajan apenas, a 2,5rem: el grueso lo pone el `zoom` de la
// caja en desktop-layout.tsx.
export const ROW_VARS =
  "[--kb-row:2.5rem] md:[--kb-row:2.05rem] [--kb-strip:2.6rem] [@media(max-height:700px)]:[--kb-strip:2.5rem]"

const RAMPA_ROW = `${RAMPA_ROW_REM}rem`
const RAMPA_ROW_APRETADO = ROW_MIN
const DYNAMIC_ROW = `${DYNAMIC_ROW_REM}rem`
const DYNAMIC_ROW_DESKTOP = "var(--kb-strip)"
export const STRIP_ROW = "var(--kb-strip)"

// Ancho del contenido, tanto acá como en la card del ejercicio: las teclas y el
// campo donde se escribe la respuesta comparten el mismo canal centrado. Ver
// ExerciseCard :: PANEL_CONTENT.
export const CONTENT_WIDTH = "mx-auto w-full max-w-[32rem]"

/** El ancho de una tecla del teclado empaquetado, como porcentaje del canal.
 *
 *  Se calcula en CSS y no en JS a propósito: el canal cambia con el teléfono y
 *  con el `max-w` de la card, y medirlo desde JS pediría un ResizeObserver y un
 *  primer render sin ancho. */
function anchoDeTecla(columnas: number) {
  return `calc((100% - ${((columnas - 1) * RAMPA_GAP_REM).toFixed(3)}rem) / ${columnas})`
}

function altoDeRampa(filas: number) {
  return filas >= RAMPA_FILAS_APRETADO ? RAMPA_ROW_APRETADO : RAMPA_ROW
}

function anchoDeRampa(filas: EntradaDeTecla[][]) {
  return anchoDeTecla(columnasDeRampaDibujada(filas))
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
  fijas = [],
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
  // Las teclas FIJAS desbloqueadas, que manda el backend con cada ejercicio.
  //
  // Solo tiene efecto CON numérico, o sea en el teléfono. En escritorio no hay
  // dígitos que recortar —se tipean— y el teclado físico sigue funcionando en
  // paralelo, así que la rampa ahí no significaría nada. Que esa condición viva
  // en una sola línea es a propósito: es lo que hace que «el teclado es palanca
  // de teléfono» sea verificable y no una convención repartida.
  fijas?: string[]
  // Las fijas recién desbloqueadas, para que solo esas nazcan con animación.
  // Aparte de `newKeys` porque son otra familia de ids y otra fila.
  newFijas?: string[]
  className?: string
}) {
  const sfx = useSfx()
  const reduceMotion = useReducedMotion()

  const press = (key: Key) => {
    sfx.select()
    const accion = accionDeTecla({ key })
    if (accion?.tipo === "clear") {
      input.current?.clear()
      input.current?.focus()
    } else if (accion?.tipo === "cmd") input.current?.command(accion.cmd)
    else if (accion?.tipo === "insert") input.current?.insert(accion.latex)
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
        <span className="relative z-10 flex">{key.icono && ICONOS[key.icono]}</span>
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
    () => inventarioDinamico({ keys, newKeys, numpad }),
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

  // ¿El teclado está en rampa? Hace falta que ESTE teclado tenga numérico (o
  // sea que sea el del teléfono) y que todavía falte alguna tecla.
  // Cuando el bloque fijo se completa, el teclado vuelve a ser el de siempre sin
  // ningún caso especial.
  //
  // Y que el empaquetado todavía ocupe menos que el definitivo: cuando pediría
  // sus mismas cuatro filas, va el definitivo (ver `RAMPA_FILAS_A_DEFINITIVO`).
  const filasRampaONada = useMemo(
    () =>
      numpad ? rampaDibujada(fijas, dynamic, newFijas) : null,
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

  const { dinamicas: padDinFilas, altoDeFija: padFijasAlto } = filasDelPad({
    dinamicasEnElPad: padDynamic.length,
  })
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
