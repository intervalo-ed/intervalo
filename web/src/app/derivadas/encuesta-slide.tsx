"use client"

// La única pregunta del juego que no tiene opciones.
//
// Todo lo demás que el juego sabe lo sabe porque lo midió: θ y β salen de los
// aciertos, el embudo sale de las derivadas resueltas, y la encuesta de
// dificultad (opinion-slide.tsx) tiene tres respuestas posibles y las tres las
// elegimos nosotros. Esta es la única pantalla que puede devolver algo que no se
// nos ocurrió preguntar.
//
// **No hay botón de saltar, y el campo no valida nada.** Las dos mitades son la
// misma decisión y sacarle una la rompe. Sin botón, salir cuesta un acto
// deliberado y eso sube muchísimo cuánta gente contesta de verdad; sin
// validación, ese acto sale barato —un punto alcanza— y la pantalla no se
// convierte en un peaje. El día que alguien le agregue un largo mínimo o un
// «escribí algo más», la salida se cierra y esto pasa a ser la puerta que
// `dx-puerta-1` demostró que cuesta 668 respuestas.
//
// El "." se guarda igual que cualquier otra respuesta: es la forma que tiene
// alguien de decir que no, y el servidor lo clasifica al LEER y no al escribir
// (backend/game/encuesta.py :: es_salto).

import { useEffect, useRef, useState } from "react"
import posthog from "posthog-js"

import { cn } from "@/lib/utils"
import { useSfx } from "@/lib/audio/useSfx"

import { useGameApi } from "./UseGameApi"
import { KeyCap } from "./exercise-card"
import { Salida } from "./slide-salida"
import { enCampoDeTexto, useTeclas } from "./teclas"

/** La clave de la pregunta, gemela de `backend/game/encuesta.py :: VARITA`.
 *
 * Viaja en el POST para que la respuesta quede atada a lo que la persona
 * realmente leyó: el enunciado se puede retocar sin que eso quiera decir que la
 * pregunta es otra, y el día que SÍ sea otra, las dos tandas quedan separadas. */
export const PREGUNTA = "varita_v1"

// El mismo tope que `encuesta.MAX_LARGO`. Cortar acá y no solo allá es lo que
// hace que el contador no mienta: si el campo dejara escribir 900 y el servidor
// guardara 500, la persona vería desaparecer el final de lo que escribió.
const MAX_LARGO = 500

export function EncuestaSlide({
  onContinue,
  slotSalida,
  keyboard = false,
  fullBleed = false,
  className,
}: {
  onContinue: () => void
  slotSalida?: HTMLElement | null
  /** Escritorio: enciende el chip de tecla del Continuar. **Enter no envía**,
   *  porque acá Enter es un salto de línea — ver el listener más abajo. */
  keyboard?: boolean
  /** Gemelo del de opinion-slide.tsx: solo lo manda el teléfono, donde el fondo
   *  lo pinta la pantalla entera. */
  fullBleed?: boolean
  className?: string
}) {
  const api = useGameApi()
  const sfx = useSfx()
  const teclas = useTeclas()
  const [texto, setTexto] = useState("")
  const campoRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    posthog.capture("game_encuesta_shown", { pregunta: PREGUNTA })
    // La impresión también va a la base: una pregunta mostrada y no contestada
    // es información sobre la pregunta, y acá más que en ninguna otra, porque es
    // la única que cuesta escribir. Sin await ni manejo de error, como toda la
    // telemetría — que falle no puede frenar la partida.
    void api
      .POST("/game/derivemos/encuesta", {
        body: { accion: "impression", pregunta: PREGUNTA },
      })
      .catch(() => {})
    // Una sola vez por aparición.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // El foco se pide con `preventScroll`, y no con el atributo `autoFocus`, que
  // no admite la opción. Sin eso la diapo entra DE GOLPE mientras el resto se
  // desliza: el foco se pide con la diapo todavía en `x: 100%`, el navegador
  // sube hasta el ancestro scrolleable para traerla a la vista y el
  // deslizamiento se colapsa a su estado final. Está contado con todas las
  // letras en username-slide.tsx y en cafecito-panel.tsx.
  useEffect(() => {
    campoRef.current?.focus({ preventScroll: true })
  }, [])

  const puedeSeguir = texto.trim().length > 0

  // Un solo envío por aparición: un doble toque mandaría dos respuestas, y la
  // segunda no tendría impresión que contestar.
  const enviadoRef = useRef(false)

  async function enviar() {
    if (enviadoRef.current || !puedeSeguir) return
    enviadoRef.current = true
    sfx.continue()
    posthog.capture("game_encuesta_answered", {
      pregunta: PREGUNTA,
      largo: texto.trim().length,
    })
    // Se sigue SIN esperar la respuesta. Lo que la persona escribió ya está
    // escrito, y hacerla mirar un spinner para que el juego confirme que lo
    // guardó es cobrarle dos veces por el mismo favor.
    void api
      .POST("/game/derivemos/encuesta", {
        body: { accion: "answer", pregunta: PREGUNTA, texto: texto.trim() },
      })
      .catch(() => {})
    onContinue()
  }

  const enviarRef = useRef(enviar)
  useEffect(() => {
    enviarRef.current = enviar
  })

  useEffect(() => {
    if (!keyboard) return
    const onKey = (e: KeyboardEvent) => {
      // **Enter solo, no.** El campo es de varias líneas y alguien escribiendo
      // dos oraciones va a apretar Enter en el medio; mandar ahí sería comerse
      // la mitad de la respuesta. Ctrl/Cmd+Enter es el gesto que ya significa
      // «mandar» en cualquier caja de texto.
      if (!(e.key === "Enter" && (e.metaKey || e.ctrlKey))) return
      // Y si el foco está en el chat del aside, este Enter no es para nosotros.
      if (enCampoDeTexto(e.target) && e.target !== campoRef.current) return
      e.preventDefault()
      void enviarRef.current()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [keyboard])

  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col justify-center gap-5 p-6",
        // `bg-card` y no solo el borde, por lo mismo que la diapo de opinión:
        // sin fondo la caja se recorta sobre la grilla del tablero y se lee como
        // un hueco en la pantalla en vez de como una card.
        !fullBleed && "rounded-lg border border-border bg-card",
        className,
      )}
    >
      <div className="space-y-2 text-center">
        <h2 className="text-xl font-semibold">
          Si tuvieras una varita mágica, ¿qué le cambiarías o le agregarías al
          juego?
        </h2>
        <p className="text-sm text-muted-foreground">
          Lo lee una persona, no un robot.
        </p>
      </div>

      <div className="mx-auto w-full max-w-sm">
        <textarea
          ref={campoRef}
          value={texto}
          onChange={(e) => setTexto(e.target.value.slice(0, MAX_LARGO))}
          rows={4}
          maxLength={MAX_LARGO}
          // Sin `placeholder` que sugiera qué contestar: cualquier ejemplo que
          // pongamos se vuelve la respuesta más frecuente, y entonces la
          // pregunta deja de averiguar nada.
          className="w-full resize-none rounded-lg border border-border bg-background p-3 text-base outline-none transition-colors placeholder:text-muted-foreground focus:border-chart-5"
          aria-label="Tu respuesta"
        />
        {/* El contador aparece solo cerca del techo. Desde el primer caracter
            sería un límite anunciado, y un límite anunciado acorta respuestas
            que nadie iba a alargar. */}
        <div className="min-h-4 pt-1 text-right text-xs text-muted-foreground">
          {texto.length > MAX_LARGO - 100 && `${texto.length} / ${MAX_LARGO}`}
        </div>
      </div>

      <Salida slot={slotSalida}>
        <button
          type="button"
          onClick={() => void enviar()}
          disabled={!puedeSeguir}
          // Blanco, como el Continuar del resto del juego: acá no hay una
          // segunda opción compitiendo al lado a la que bajarle el volumen.
          //
          // Deshabilitado mientras el campo está vacío, y ESA es toda la
          // obligatoriedad: no hay una segunda puerta escondida, hay un botón
          // que espera. Se destraba con cualquier cosa, incluido un punto.
          className={cn(
            "flex w-full items-center justify-center rounded-md bg-white text-base font-semibold text-black transition-colors hover:bg-white/90",
            "disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white",
            slotSalida ? "h-[var(--cta-h)]" : "mt-3 px-4 py-3",
          )}
        >
          Continuar
          {keyboard && <KeyCap>{teclas.modEnter}</KeyCap>}
        </button>
      </Salida>
    </div>
  )
}
