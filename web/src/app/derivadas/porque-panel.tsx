"use client"

// El «¿Por qué?»: de dónde salía la derivada que se pedía.
//
// Es la misma pieza que las sesiones de repaso de Intervalo abren con ese
// nombre (session-runner.tsx), y a propósito: quien juega y quien estudia son la
// misma persona, y el botón que explica tiene que llamarse igual y verse igual
// en los dos lados. Lo único distinto es de dónde sale el texto. Allá está
// escrito a mano en el banco (campo `explanation`); acá lo construye el servidor
// a partir de la derivada concreta que se sirvió (backend/game/explain.py),
// porque estos ejercicios se generan al azar y no hay nada escrito que mostrar.
//
// El mismo componente sirve para las dos vistas: en escritorio es el DORSO de la
// card del ejercicio y en el teléfono es una pantalla propia. Por eso scrollea
// adentro de su caja en vez de empujar a lo que lo contiene — en escritorio la
// columna tiene alto fijo, y una explicación de un tier 5 lo pasa cómoda.

import { useCallback, useEffect, useRef, useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import dynamic from "next/dynamic"
import { LINE_COLOR, SECOND_LINE_COLOR } from "@/components/math-graph-colors"
import MathText from "@/components/math-text"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { KeyCap, WRONG } from "./exercise-card"
import { enCampoDeTexto } from "./teclas"

// El gráfico se baja recién cuando hay uno que dibujar.
//
// `mafs` + `mathjs` pesan ~975 KB y entraban en el bundle INICIAL de /derivadas
// por esta sola importación: todo el mundo pagaba casi un mega antes de ver la
// intro, para una pantalla que solo existe en el teléfono, solo adentro del
// «¿Por qué?» y solo después de haber errado una derivada.
//
// `ssr: false` porque Mafs mide el DOM al montarse; no hay nada que prerenderizar.
const MathGraph = dynamic(() => import("@/components/math-graph"), {
  ssr: false,
  // Del alto del gráfico se encarga el propio contenedor, así que un hueco vacío
  // alcanza: sin él, la explicación daría un salto cuando el chunk aterriza.
  loading: () => <div className="h-48 w-full rounded-md border bg-white/5" />,
})

// El gris del botón abierto ("Volver"). Sólido y no una mezcla de opacidad
// como el estado cerrado (`bg-foreground/[0.14]`): ese cambia de tono según
// lo que tenga detrás —la card oscura en un lado, el hint blanco-y-verde del
// primer acierto en el otro— y acá hace falta el MISMO gris en los dos.
const GRIS_VOLVER = "#A1A1AA"

// El parrafito que ABRE el gráfico (va antes, no después: invita a mirarlo,
// no lo resume una vez que ya se vio). Fijo y sin parámetros a propósito —
// mismo criterio que las imágenes de REGLAS en explain.py: la relación entre
// f y f' (dónde una sube, qué signo tiene la otra) es la misma para
// cualquier función que el juego sirva, así que decirla una vez alcanza. No
// afirma que ESTE gráfico puntual muestre un máximo o un cruce por cero —
// una f sin extremos en su ventana (una exponencial pura, por ejemplo) es
// tan válida como cualquier otra— sino qué relación mirar en general.
//
// La entrada da vuelta la lectura de arriba —qué dice f' sobre f, no qué
// mirar EN f— con la definición (la derivada como pendiente) primero, para
// que los tres casos de GRAPH_POINTS ya sepan a qué se refieren. Van en
// bullets y no seguidos en la misma oración: son tres casos PARALELOS —crece,
// decrece, ni una cosa ni la otra— y una lista los deja leer de un vistazo,
// en vez de contar tres cláusulas dentro de un mismo párrafo.
//
// $f(x)$/$f'(x)$ van en LaTeX y no como texto —es la misma notación que el
// resto de la explicación, `MathText` los resuelve igual, línea por línea— y
// lo que responde cada caso (el signo, o el cero) va en negrita: es el dato
// nuevo de cada oración, el resto es la condición que ya se venía leyendo.
const GRAPH_INTRO =
  "En el siguiente gráfico están $f(x)$ y $f'(x)$ juntas. Como la derivada " +
  "de una función representa la **pendiente**, observamos lo siguiente:"

const GRAPH_POINTS = [
  "Cuando $f(x)$ crece, $f'(x)$ es **positiva**.",
  "Cuando $f(x)$ decrece, $f'(x)$ es **negativa**.",
  "Cuando en $f(x)$ hay un máximo, un mínimo o una meseta, $f'(x)$ es " +
    "igual a **0**.",
]

// Cuánto se desplaza por click o por tecla. Ni un scroll de a línea (se
// sentiría lento contra un tier 5 largo) ni un salto de a pantalla completa
// (perdería de vista dónde se estaba parado): un tercio de caja, más o menos.
const SCROLL_STEP_PX = 180

// Animado a mano y no con `scrollBy({behavior:"smooth"})`: el nativo no deja
// elegir duración ni curva, y salía bastante más rápido y seco de lo que se
// pidió acá. Con `requestAnimationFrame` se controlan las dos cosas.
const SCROLL_DURATION_MS = 550

// Sale rápido y llega despacio — así se siente "suave" y no un salto con los
// bordes limados. La misma curva que ya usa el resto del juego para las
// entradas (`ease-out`), pasada a número para animar un scalar en vez de una
// transición CSS.
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

// Cuánto tardan en esconderse solas las flechas después del último uso: son
// un recordatorio de que `w`/`s` existen, no un control fijo que tenga que
// quedarse tapando la esquina del gráfico todo el tiempo.
const OCULTAR_BOTONES_MS = 900

// El pulso blanco que marca cuál flecha (o tecla) acaba de actuar. Golpe
// rápido y salida lenta — mismo criterio que el destello de Revisar en
// exercise-card.tsx (`FLASH_IN`/`FLASH_OUT`): así se lee como un pulso y no
// como un cambio de estado que se queda.
const PULSO_MS = 120
const PULSO_IN = "40ms"
const PULSO_OUT = "260ms"

// Misma mecánica que `useMoment` en exercise-card.tsx: activo mientras el
// último pulso no se haya "asentado". Al no depender de un booleano externo
// que cambie, alcanza con que `seq` no sea el inicial (0 = todavía ningún
// pulso) y no coincida con el último asentado — así una segunda pulsada de
// la MISMA flecha reinicia la animación en vez de quedarse sin disparar,
// que es lo que pasaría si el estado "activo" no cambiara de valor.
function usePulsoActivo(seq: number, ms: number): boolean {
  const [asentado, setAsentado] = useState(0)
  const activo = seq !== 0 && asentado !== seq
  useEffect(() => {
    if (!activo) return
    const t = setTimeout(() => setAsentado(seq), ms)
    return () => clearTimeout(t)
  }, [activo, seq, ms])
  return activo
}

// El gráfico de cierre: f y f' en los mismos ejes. Lo manda siempre el
// servidor (game/explain.py :: Explanation); las dos vistas lo pintan, cada
// una pasando este prop desde su propio estado (mobile-flow.tsx y
// desktop-layout.tsx guardan el mismo objeto por separado, porque cada una
// tiene su propio ciclo de vida de "qué ejercicio es este").
export type PorQueGraph = {
  fn: string
  fn2: string
  // La MISMA f y f' de arriba, en LaTeX: solo para la leyenda, que si no
  // diría un genérico "f(x)"/"f'(x)" en vez de la fórmula real.
  fnLatex: string
  fn2Latex: string
  view: [number, number, number, number]
}

// La letra del atajo, al lado del botón. Inicial de lo que hace, que es la
// razón por la que se la pidió prestada al panel de estadísticas —que pasó a
// `m`, ver elo-stats-panel.tsx :: TECLA_ESTADISTICAS—.
export const TECLA_PORQUE = "p"

// Un esqueleto y no un "cargando...": el pedido tarda lo que tarda un viaje de
// red, y una palabra que aparece y desaparece en 200 ms se lee como un
// parpadeo. Tres renglones de distinto largo, que es la forma que tiene un
// párrafo.
function Esqueleto() {
  return (
    <div aria-hidden className="flex flex-col gap-3 p-1">
      {["w-full", "w-11/12", "w-2/3", "w-5/6", "w-1/2"].map((w, i) => (
        <div key={i} className={cn("h-4 animate-pulse rounded bg-foreground/10", w)} />
      ))}
    </div>
  )
}

export function PorQuePanel({
  explanation,
  isPending,
  isError,
  onRetry,
  graph = null,
  bare = false,
  scrollButtons = false,
  className,
}: {
  explanation: string | null
  isPending: boolean
  isError: boolean
  onRetry: () => void
  // Ver `PorQueGraph` arriba.
  graph?: PorQueGraph | null
  // Sin marco ni relleno propios: en escritorio esto es el DORSO de la card del
  // ejercicio, que ya trae su borde y su padding, y dibujar otro recuadro
  // adentro deja una caja dentro de una caja separadas por unos milímetros —que
  // es exactamente lo que no hace ninguna otra cara del juego—.
  bare?: boolean
  // El par de flechas para desplazarse sin mouse, solo en escritorio: ahí el
  // dorso tiene alto FIJO (compite con el resto de la card) y el juego se
  // juega de teclado, así que hace falta una forma de bajar sin soltar las
  // manos. En el teléfono ya se scrollea con el dedo y no hay teclado que
  // atajar — de ahí que sea un prop y no algo que el componente decida solo.
  scrollButtons?: boolean
  className?: string
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  // El frame en curso, para poder cortarlo si llega otro pedido antes de que
  // termine —sostener la flecha del teclado dispara un `scroll()` por cada
  // repetición— y arrancar el próximo desde donde quedó, no desde cero.
  const scrollAnimRef = useRef<number | null>(null)
  // Las flechas están a la vista o recién se escondieron. Arrancan visibles
  // —es como se descubre que existen— y cada uso las vuelve a mostrar.
  const [botonesVisibles, setBotonesVisibles] = useState(true)
  const ocultarTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const marcarUso = useCallback(() => {
    setBotonesVisibles(true)
    if (ocultarTimerRef.current !== null) clearTimeout(ocultarTimerRef.current)
    ocultarTimerRef.current = setTimeout(() => setBotonesVisibles(false), OCULTAR_BOTONES_MS)
  }, [])
  // Qué flecha pulsa —o "ambas", el pulso de bienvenida—. `seq` y no un
  // booleano: dos usos seguidos de la MISMA flecha tienen que reiniciar el
  // pulso, y un booleano que ya vale `true` no dispara una transición al
  // volver a ponerlo en `true` (ver `usePulsoActivo`).
  //
  // Arranca en `seq: 1` (no 0) A PROPÓSITO: es el estado inicial y no el
  // resultado de un efecto, así que las dos laten solas apenas el panel
  // aparece —sin esperar ningún scroll— y sin que un `useEffect` tenga que
  // llamar `setState` en su cuerpo para lograrlo.
  const [pulso, setPulso] = useState<{ dir: "up" | "down" | "ambas"; seq: number }>({
    dir: "ambas",
    seq: 1,
  })
  const pulsando = usePulsoActivo(pulso.seq, PULSO_MS)
  const scroll = useCallback((delta: number) => {
    const el = scrollRef.current
    if (!el) return
    if (scrollAnimRef.current !== null) cancelAnimationFrame(scrollAnimRef.current)
    const from = el.scrollTop
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / SCROLL_DURATION_MS)
      el.scrollTop = from + delta * easeOutCubic(t)
      scrollAnimRef.current = t < 1 ? requestAnimationFrame(tick) : null
    }
    scrollAnimRef.current = requestAnimationFrame(tick)
    setPulso((p) => ({ dir: delta < 0 ? "up" : "down", seq: p.seq + 1 }))
    marcarUso()
  }, [marcarUso])

  useEffect(() => {
    return () => {
      if (scrollAnimRef.current !== null) cancelAnimationFrame(scrollAnimRef.current)
      if (ocultarTimerRef.current !== null) clearTimeout(ocultarTimerRef.current)
    }
  }, [])

  // Arrancan visibles —el `useState(true)` de arriba ya las deja así, sin
  // necesidad de tocar el estado acá— y se esconden solas si nadie las usa:
  // el mismo timer que dispara `marcarUso`, para que la primera aparición se
  // comporte igual que cualquier otro uso.
  useEffect(() => {
    if (!scrollButtons) return
    const t = setTimeout(() => setBotonesVisibles(false), OCULTAR_BOTONES_MS)
    ocultarTimerRef.current = t
    return () => clearTimeout(t)
  }, [scrollButtons])

  useEffect(() => {
    if (!scrollButtons) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return
      const tecla = e.key.toLowerCase()
      // `w`/`s` y no las flechas: es el mismo par que ya mueve la cámara en
      // cualquier juego, y acá la mano ya está sobre las letras jugando de
      // teclado. `w` es la misma tecla de Reclutas en el resto del juego,
      // pero sin choque real: ese atajo YA se apaga con `porqueOpen`
      // (ver el listener de TECLA_RECLUTAS más abajo), que es justo la
      // ventana en la que este panel existe.
      if (tecla !== "w" && tecla !== "s") return
      if (enCampoDeTexto(e.target)) return
      e.preventDefault()
      e.stopPropagation()
      scroll(tecla === "w" ? -SCROLL_STEP_PX : SCROLL_STEP_PX)
    }
    document.addEventListener("keydown", onKeyDown, true)
    return () => document.removeEventListener("keydown", onKeyDown, true)
  }, [scrollButtons, scroll])

  return (
    // `relative` para anclar el par de flechas arriba a la derecha del
    // contenedor, sin que se vayan con el scroll del contenido.
    <div className={cn("relative flex min-h-0 flex-1 flex-col", className)}>
      {/* `no-scrollbar` y no una barra visible: es el mismo criterio que la tabla
          de derivadas, que vive en el otro dorso y se lee igual.
          `overflow-x-hidden` explícito por la misma razón que en math-text.tsx:
          sin él, la spec computa el eje libre como `auto`, y este contenedor
          quedaría con un scroll horizontal de arrastre que nadie pidió — el
          único scroll de todo el panel es este, y es vertical. */}
      <div
        ref={scrollRef}
        className="no-scrollbar flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto"
      >
        {/* `m-auto` y no `justify-center` en el scroller: centra mientras el texto
            entre —una constante se explica en cuatro renglones y quedaba pegada
            arriba, con media columna vacía debajo— y cuando no entra se apoya
            arriba y scrollea. Con `justify-center`, en cambio, un texto más alto
            que su caja se centra igual y el navegador recorta el principio sin
            dejar scrollear hasta él. */}
        <div
          className={cn(
            "m-auto flex w-full shrink-0 flex-col gap-3 leading-relaxed",
            bare
              // En escritorio esto flota suelto dentro del dorso de la card
              // (que ya trae su propio `p-5`): un poco más de aire a los
              // costados —encima del que ya pone el dorso— y la fuente un
              // toque más grande, que acá se lee un párrafo entero seguido y
              // no una fórmula corta.
              ? "px-3 text-[17px]"
              // Sin contorno: el teléfono no tiene otra caja alrededor —es su
              // propia pantalla, no el dorso de nada— pero un borde ahí no
              // enmarcaba nada, solo repetía el límite que ya pone la
              // pantalla. Se queda el padding, que sigue haciendo falta.
              : "p-4",
          )}
        >
          {isError ? (
          <div className="flex flex-col items-start gap-3 text-sm text-muted-foreground">
            <span>No pudimos traer la explicación.</span>
            <Button variant="outline" size="sm" onClick={onRetry}>
              Probar de nuevo
            </Button>
          </div>
        ) : isPending || explanation === null ? (
          <Esqueleto />
        ) : (
          <>
            {/* El mismo renderer que las explicaciones del banco: prosa con
                `$…$` y bloques `$$…$$`. Las fórmulas largas —un cociente ya
                sustituido— desbordan a lo ancho, y `MathText` las deja
                scrollear por su cuenta. */}
            <MathText text={explanation} />
            {graph && (
              // `mt-2` de más, encima del `gap-3` que ya pone el contenedor:
              // el parrafito del gráfico abre una idea nueva —ya no es la
              // derivación de arriba— y el gap de siempre entre párrafos se
              // leía como una continuación más de la misma explicación.
              <div className="mt-2 flex flex-col gap-1.5">
                {/* GRAPH_INTRO + GRAPH_POINTS van ACÁ, antes del gráfico:
                    invitan a mirarlo ("en el siguiente gráfico...") en vez
                    de resumir algo que ya se vio. Mismo `MathText` (mismo
                    tamaño, color e interlineado) que el resto de la
                    explicación de arriba, uno por renglón de la lista.

                    `gap-2`/`space-y-2` propios y no el `gap-1.5` del
                    contenedor: son CUATRO afirmaciones distintas —la entrada
                    y los tres casos— y con el gap chico de siempre se leían
                    pegadas, como si fueran un solo bloque en vez de cuatro
                    ideas separadas. */}
                <div className="flex flex-col gap-2">
                  <MathText text={GRAPH_INTRO} />
                  <ul className="list-disc space-y-2 pl-5">
                    {GRAPH_POINTS.map((punto) => (
                      <li key={punto}>
                        <MathText text={punto} />
                      </li>
                    ))}
                  </ul>
                </div>
                {/* Leyenda de colores, ANTES del gráfico: sin ella, dos
                    curvas nuevas en un componente pensado para una sola no
                    dicen cuál es cuál, y puesta debajo se leía como un pie de
                    foto que hay que ir a buscar después de mirar — arriba se
                    lee primero y ya se sabe qué es cada curva desde el
                    primer vistazo. La fórmula real y no un genérico
                    "f(x)"/"f'(x)": con dos curvas en los mismos ejes, lo que
                    identifica a cada una es la cuenta, no una letra que no
                    cambia entre ejercicios.

                    `mt-4` propio: ninguno de los dos componentes toma
                    className, así que el aire entre los bullets y esta
                    leyenda se agrega acá y no en el `gap-1.5` del
                    contenedor —que también separa la leyenda del gráfico de
                    abajo, y esa distancia no había que tocarla. */}
                <div className="mt-4 flex items-center justify-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <span
                      aria-hidden
                      className="h-1.5 w-3 shrink-0 rounded-full"
                      style={{ backgroundColor: LINE_COLOR }}
                    />
                    <MathText text={`$${graph.fnLatex}$`} />
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span
                      aria-hidden
                      className="h-1.5 w-3 shrink-0 rounded-full"
                      style={{ backgroundColor: SECOND_LINE_COLOR }}
                    />
                    <MathText text={`$${graph.fn2Latex}$`} />
                  </span>
                </div>
                <MathGraph
                  graphFn={graph.fn}
                  graphFn2={graph.fn2}
                  graphView={graph.view}
                  graphFreeAspect
                />
              </div>
            )}
          </>
        )}
        </div>
      </div>
      {scrollButtons && (
        <div
          className={cn(
            "absolute right-2 top-2 flex flex-col gap-1 transition-opacity duration-300",
            botonesVisibles ? "opacity-100" : "pointer-events-none opacity-0",
          )}
        >
          <button
            type="button"
            onClick={() => scroll(-SCROLL_STEP_PX)}
            aria-label="Subir"
            className="relative flex items-center overflow-hidden rounded border border-white/10 bg-background/80 p-1.5 text-muted-foreground transition-colors hover:text-foreground"
          >
            {/* El pulso blanco: mismo mecanismo que `flashing` en
                exercise-card.tsx, con `z-10` en el ícono y la tecla para que
                el pulso quede DETRÁS de lo que hay que seguir leyendo.
                "ambas" es el pulso de bienvenida: las dos flechas laten
                juntas apenas aparece la explicación. */}
            <span
              aria-hidden
              className="absolute inset-0 bg-white"
              style={{
                opacity: pulsando && (pulso.dir === "up" || pulso.dir === "ambas") ? 0.7 : 0,
                transitionProperty: "opacity",
                transitionDuration:
                  pulsando && (pulso.dir === "up" || pulso.dir === "ambas") ? PULSO_IN : PULSO_OUT,
              }}
            />
            <ChevronUp size={18} className="relative z-10" />
            <KeyCap className="relative z-10 ml-1">w</KeyCap>
          </button>
          <button
            type="button"
            onClick={() => scroll(SCROLL_STEP_PX)}
            aria-label="Bajar"
            className="relative flex items-center overflow-hidden rounded border border-white/10 bg-background/80 p-1.5 text-muted-foreground transition-colors hover:text-foreground"
          >
            <span
              aria-hidden
              className="absolute inset-0 bg-white"
              style={{
                opacity: pulsando && (pulso.dir === "down" || pulso.dir === "ambas") ? 0.7 : 0,
                transitionProperty: "opacity",
                transitionDuration:
                  pulsando && (pulso.dir === "down" || pulso.dir === "ambas") ? PULSO_IN : PULSO_OUT,
              }}
            />
            <ChevronDown size={18} className="relative z-10" />
            <KeyCap className="relative z-10 ml-1">s</KeyCap>
          </button>
        </div>
      )}
    </div>
  )
}

// El botón. Contorno fino sobre el fondo, igual que Saltear y que el ¿Por qué?
// de las sesiones (session-runner.tsx :: la rama `solved`): es la acción
// secundaria del pie, al lado de la principal.
//
// El signo de apertura va puesto. Es como se escribe, y es además lo que lo
// distingue de un botón que dijera "Por qué" a secas, que se leería como un
// título y no como una pregunta que se está haciendo la persona.
export function PorQueButton({
  onClick,
  disabled,
  showKeyHint = false,
  // Si el dorso ya está mostrando la explicación: cambia la etiqueta a
  // "Volver" y el relleno pasa de la mezcla translúcida a un color sólido,
  // para que quede claro que tocarlo de nuevo saca de ahí y no abre otra cosa.
  open = false,
  // Ya se equivocó una vez: el botón se pinta del mismo lima amarillento que
  // marca una respuesta incorrecta en el resto del juego (`WRONG`,
  // exercise-card.tsx) — diga "¿Por qué?" o "Volver", abierto o cerrado—, así
  // que la explicación queda visualmente atada al error que la motivó desde
  // que aparece, no recién al abrirla.
  wrong = false,
  // Solo lo pide AnswerField (exercise-card.tsx), para el botón que
  // reemplaza al campo entero al acertar: ahí es blanco con letra negra,
  // igual que Continuar —sin veredicto en el color, a propósito: es el lugar
  // que ocupaba el campo, con su propio borde de color, y ya alcanza—, no el
  // relleno sólido de gris/lima que usa este botón en el pie.
  blanco = false,
  className,
}: {
  onClick: () => void
  disabled?: boolean
  // El chip de la tecla solo donde hay tecla. En el teléfono se toca, y una `p`
  // impresa al lado sería prometer un atajo que no existe.
  showKeyHint?: boolean
  open?: boolean
  wrong?: boolean
  blanco?: boolean
  className?: string
}) {
  return (
    <Button
      size="lg"
      variant="outline"
      disabled={disabled}
      onClick={onClick}
      style={
        blanco
          ? { backgroundColor: "#fff", color: "#000" }
          : // `wrong` manda sobre `open`: el lima marca el error, no el estado
            // del panel. El texto pasa a NEGRO con el lima —más claro que el
            // violeta que tenía antes, blanco encima ya no se leía bien—; el
            // gris sólido de "Volver" ya se quedaba con negro por lo mismo.
            wrong
            ? { backgroundColor: WRONG, color: "#000" }
            : open
              ? { backgroundColor: GRIS_VOLVER, color: "#000" }
              : undefined
      }
      className={cn(
        // Gris, pero gris LLENO, que es distinto de gris apagado.
        //
        // Los tres botones del renglón tienen que distinguirse de un vistazo y
        // ninguno de los dos extremos servía. Con el mismo contorno que Saltear
        // eran dos botones iguales con textos distintos; bajándole el texto a
        // `muted-foreground` para separarlos, este quedaba tan atrás que parecía
        // deshabilitado — y es la ayuda, o sea justo lo que alguien trabado
        // tiene que encontrar sin buscar.
        //
        // La salida es cambiar de FAMILIA en vez de bajar el volumen: Revisar es
        // blanco lleno, Saltear es contorno sobre el fondo, y este es un relleno
        // gris (o lima, si hay un error). Tres formas distintas, tres pesos
        // distintos, y el del medio se ve sin competirle al blanco.
        //
        // `font-bold` y no el `font-normal` de antes: la misma negrita que ya
        // tiene Revisar/Continuar (`AnswerButton`, que hereda `font-bold` del
        // variant `default` del Button base). Los dos botones que pueden
        // quedar pintados de un color de veredicto tienen el mismo peso.
        "h-[var(--cta-h)] shrink-0 rounded-md border-transparent font-bold transition-colors",
        !wrong &&
          !open &&
          !blanco &&
          "bg-foreground/[0.14] px-5 text-foreground hover:bg-foreground/25 dark:bg-foreground/[0.14] dark:hover:bg-foreground/25",
        (wrong || open || blanco) && "px-5 hover:opacity-90",
        className,
      )}
    >
      {open ? "Volver" : "¿Por qué?"}
      {showKeyHint && <KeyCap>{TECLA_PORQUE}</KeyCap>}
    </Button>
  )
}
