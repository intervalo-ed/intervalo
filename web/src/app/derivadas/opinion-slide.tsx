"use client"

// La diapo que pregunta cómo viene resultando el juego.
//
// Es la única vez que el juego pregunta algo en vez de medirlo. Todo lo demás
// que sabe sale de los aciertos —θ y β— y los aciertos no saben si alguien se
// está aburriendo.
//
// Como la de instalar, no pide nada: un toque, se sale sin contestar, y lo que
// devuelve es que el juego se le acomode. Por eso no tiene botón de color ni
// cuenta regresiva.
//
// Las tres opciones y sus emojis son los MISMOS que la micro-encuesta de
// Intervalo clásico (survey-pane.tsx, canal A), y los valores que viajan también
// (game/opinion.py :: VOTOS). Dos productos preguntando lo mismo tienen que
// poder compararse sin una tabla de traducción en el medio.

import { useEffect, useState } from "react"
import posthog from "posthog-js"

import { cn } from "@/lib/utils"

import { useGameApi } from "./UseGameApi"
import { claseDeSalida, Salida } from "./slide-salida"

export type VotoDificultad = "muy_facil" | "justo" | "muy_dificil"

const OPCIONES: { voto: VotoDificultad; emoji: string; texto: string }[] = [
  { voto: "muy_facil", emoji: "😴", texto: "Muy fáciles" },
  { voto: "justo", emoji: "👌", texto: "Justas" },
  { voto: "muy_dificil", emoji: "🤯", texto: "Muy difíciles" },
]

/** Qué se le dice después de votar.
 *
 * Tres líneas cortas y ninguna promesa. El ajuste solo sale cuando el registro
 * de la persona respalda lo que dijo, así que «anotado» es la respuesta más
 * frecuente y tiene que poder leerse como una respuesta completa y no como un
 * consuelo.
 *
 * Sin mencionar XP jamás, que es la regla de context/writing-voice.md: agradecer
 * con una recompensa convierte la encuesta en un trámite pago y arruina el dato.
 */
function respuesta(delta: number): string {
  if (delta > 0) return "Te subimos la vara."
  if (delta < 0) return "Te bajamos un poco la vara."
  return "Anotado."
}

export function OpinionSlide({
  onContinue,
  slotSalida,
  fullBleed = false,
  className,
}: {
  onContinue: () => void
  slotSalida?: HTMLElement | null
  /** Gemelo del de pedido-instalar.tsx: solo lo manda el teléfono, donde el
   *  fondo lo pinta la pantalla entera. */
  fullBleed?: boolean
  className?: string
}) {
  const api = useGameApi()
  const [votado, setVotado] = useState<VotoDificultad | null>(null)
  const [linea, setLinea] = useState<string | null>(null)

  useEffect(() => {
    posthog.capture("game_opinion_shown")
    // La impresión también va a la base: una pregunta mostrada y no contestada
    // es información sobre la pregunta, y sin registrarla no hay manera de saber
    // cuánta gente la ignora. Sin await ni manejo de error, como toda la
    // telemetría — que falle no puede frenar la partida.
    void api
      .POST("/game/derivemos/opinion", { body: { accion: "impression" } })
      .catch(() => {})
    // Una sola vez por aparición.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function votar(voto: VotoDificultad) {
    if (votado) return
    setVotado(voto)
    posthog.capture("game_opinion_answered", { voto })
    try {
      const { data } = await api.POST("/game/derivemos/opinion", {
        body: { accion: "answer", voto },
      })
      setLinea(respuesta(data?.delta_theta ?? 0))
    } catch {
      // Si el POST se pierde, el voto se perdió y no hay nada que prometer.
      setLinea("Anotado.")
    }
  }

  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col justify-center gap-6 p-6",
        !fullBleed && "rounded-lg border",
        className,
      )}
    >
      <div className="space-y-2 text-center">
        <h2 className="text-xl font-semibold">¿Cómo te vienen resultando?</h2>
        <p className="text-sm text-muted-foreground">
          Nos sirve para elegir mejor qué mostrarte.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {OPCIONES.map((o) => (
          <button
            key={o.voto}
            type="button"
            disabled={votado !== null}
            onClick={() => void votar(o.voto)}
            className={cn(
              "flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors",
              votado === null && "hover:border-chart-5 hover:bg-accent/40",
              votado === o.voto && "border-chart-5 bg-accent/40",
              votado !== null && votado !== o.voto && "opacity-40",
            )}
          >
            <span aria-hidden className="text-2xl">
              {o.emoji}
            </span>
            <span className="font-medium">{o.texto}</span>
          </button>
        ))}
      </div>

      {/* El alto se reserva desde el principio: sin esto, la línea de respuesta
          aparece y empuja los tres botones justo cuando la persona acaba de
          tocar uno. */}
      <p className="min-h-5 text-center text-sm text-muted-foreground">
        {linea}
      </p>

      <Salida slot={slotSalida}>
        <button
          type="button"
          onClick={onContinue}
          className={claseDeSalida(Boolean(slotSalida))}
        >
          Continuar
        </button>
      </Salida>
    </div>
  )
}
