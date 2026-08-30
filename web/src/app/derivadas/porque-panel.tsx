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

import { useCallback, useEffect, useRef } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import MathGraph, { LINE_COLOR, SECOND_LINE_COLOR } from "@/components/math-graph"
import MathText from "@/components/math-text"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { KeyCap, WRONG } from "./exercise-card"
import { enCampoDeTexto } from "./teclas"

// El gris del botón abierto ("Volver"). Sólido y no una mezcla de opacidad
// como el estado cerrado (`bg-foreground/[0.14]`): ese cambia de tono según
// lo que tenga detrás —la card oscura en un lado, el hint blanco-y-verde del
// primer acierto en el otro— y acá hace falta el MISMO gris en los dos.
const GRIS_VOLVER = "#A1A1AA"

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

// El gráfico de cierre: f y f' en los mismos ejes. Lo manda siempre el
// servidor (game/explain.py :: Explanation) pero solo lo pinta el teléfono
// —quien pase este prop—: en escritorio la explicación ya compite por
// espacio con el dorso volteado de la card, y ahí no entra otra cosa más.
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
  // Ver `PorQueGraph` arriba. `null`/ausente en escritorio a propósito.
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
  }, [])

  useEffect(() => {
    return () => {
      if (scrollAnimRef.current !== null) cancelAnimationFrame(scrollAnimRef.current)
    }
  }, [])

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
    // `relative` para anclar el par de flechas al pie del contenedor, sin que
    // se vayan con el scroll del contenido.
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
            !bare && "rounded-md border border-white/10 p-4",
            // Lugar para que las flechas floten en la esquina sin taparle la
            // última línea al texto que pasa por detrás mientras se scrollea.
            scrollButtons && "pr-8",
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
              <div className="flex flex-col gap-1.5">
                <MathGraph
                  graphFn={graph.fn}
                  graphFn2={graph.fn2}
                  graphView={graph.view}
                  graphFreeAspect
                />
                {/* Leyenda de colores: sin ella, dos curvas nuevas en un
                    componente pensado para una sola no dicen cuál es cuál.
                    La fórmula real y no un genérico "f(x)"/"f'(x)": con dos
                    curvas en los mismos ejes, lo que identifica a cada una es
                    la cuenta, no una letra que no cambia entre ejercicios. */}
                <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
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
              </div>
            )}
          </>
        )}
        </div>
      </div>
      {scrollButtons && (
        <div className="absolute bottom-2 right-2 flex flex-col gap-1">
          <button
            type="button"
            onClick={() => scroll(-SCROLL_STEP_PX)}
            aria-label="Subir"
            className="flex items-center rounded border border-white/10 bg-background/80 p-1 text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronUp size={14} />
            <KeyCap className="ml-1">w</KeyCap>
          </button>
          <button
            type="button"
            onClick={() => scroll(SCROLL_STEP_PX)}
            aria-label="Bajar"
            className="flex items-center rounded border border-white/10 bg-background/80 p-1 text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronDown size={14} />
            <KeyCap className="ml-1">s</KeyCap>
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
  // Ya se equivocó una vez: el "Volver" se pinta del mismo naranja que marca
  // una respuesta incorrecta en el resto del juego (`WRONG`, exercise-card.tsx),
  // así que el botón que lleva a la explicación queda visualmente atado al
  // error que la motivó.
  wrong = false,
  className,
}: {
  onClick: () => void
  disabled?: boolean
  // El chip de la tecla solo donde hay tecla. En el teléfono se toca, y una `p`
  // impresa al lado sería prometer un atajo que no existe.
  showKeyHint?: boolean
  open?: boolean
  wrong?: boolean
  className?: string
}) {
  return (
    <Button
      size="lg"
      variant="outline"
      disabled={disabled}
      onClick={onClick}
      style={open ? { backgroundColor: wrong ? WRONG : GRIS_VOLVER, color: "#000" } : undefined}
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
        // gris. Tres formas distintas, tres pesos distintos, y el del medio se
        // ve sin competirle al blanco.
        "h-[var(--cta-h)] shrink-0 rounded-md border-transparent font-normal transition-colors",
        !open &&
          "bg-foreground/[0.14] px-5 text-foreground hover:bg-foreground/25 dark:bg-foreground/[0.14] dark:hover:bg-foreground/25",
        open && "px-5 hover:opacity-90",
        className,
      )}
    >
      {open ? "Volver" : "¿Por qué?"}
      {showKeyHint && <KeyCap>{TECLA_PORQUE}</KeyCap>}
    </Button>
  )
}
