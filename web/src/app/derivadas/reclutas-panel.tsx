"use client"

// La diapo del reclutamiento: el otro momento en que el juego pide algo.
//
// Gemela de la del cafecito (cafecito-panel.tsx) y a propósito: mismo lugar
// —ocupa la tarjeta del ejercicio y entra con el mismo volteo—, misma anatomía
// —ícono, título con signos de pregunta, una oración que explica, un botón que
// hace algo y otro que sale— y las mismas dos decisiones que parecen fricción:
//
// · El botón de seguir tarda unos segundos en habilitarse cuando la diapo la
//   sacó el juego. A esta altura la persona lleva varias derivadas despachadas a
//   golpe de Enter: sin la espera, la diapo se salta antes de verse. Cuando la
//   abrió ella misma no hay espera, porque nadie la interrumpió.
// · Reclutar es `shift + enter`. Enter sigue significando lo de siempre, así que
//   al único lugar al que se llega sin querer es al próximo ejercicio.
//
// Lo que sí es distinto es lo que ofrece. El cafecito pide plata y devuelve un
// multiplicador para toda una universidad; esto no pide nada más que un mensaje
// y devuelve un porcentaje de lo que hagan otros, para siempre. Por eso la lista
// de reclutas va ADENTRO de la diapo en el teléfono: es lo único que convierte
// "el 10% de lo que sumen" en algo que se puede mirar.

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { useSfx } from "@/lib/audio/useSfx"
import { shareUrl, VERDE, VERDE_TINTA_OSCURA, WhatsappGlyph } from "./cafecito-cta"
import { KeyCap } from "./exercise-card"
import { useCta } from "./game-telemetry"
import { ListaDeReclutas } from "./reclutas-list"
import { useTeclas } from "./teclas"
import { useCachedPlayer } from "./UseGamePlayer"
import { useGameRecruits } from "./UseGameLeaderboard"

// Cuánto tarda en habilitarse el botón de salir cuando la diapo la sacó el
// juego. Dos segundos menos que la del cafecito: allá hay una barra que mover y
// un número que mirar antes de decidir, acá hay tres renglones y un botón.
const ESPERA_S = 8

// El porcentaje que se muestra mientras el servidor no contestó todavía. Es el
// mismo valor que `SHARE_PERCENT` en backend/game/referrals.py; la respuesta lo
// trae y pisa a este, así que si algún día cambia allá, acá solo queda un
// parpadeo del valor viejo y no un número mentiroso permanente.
const PORCENTAJE_POR_DEFECTO = 10

export type ReclutasTrigger = "pedido" | "record"

/** La abrió la persona con el botón de la barra. Cambia dos cosas: no hay cuenta
 *  regresiva para salir —nadie la interrumpió, así que retenerla sería cobrarle
 *  por haber venido— y al salir vuelve a SU ejercicio en vez de pedir uno
 *  nuevo. */
const LO_PIDIO = (t: ReclutasTrigger) => t === "pedido"

/** La cuenta regresiva del botón de salir. Devuelve los segundos que faltan, y
 *  cero cuando ya se puede. El intervalo se limpia solo al desmontar: la diapo
 *  vive lo que dura la decisión y nada más. */
function useEspera(segundos: number) {
  const [restante, setRestante] = useState(segundos)
  useEffect(() => {
    if (segundos === 0) return
    const t = setInterval(() => setRestante((s) => (s <= 1 ? 0 : s - 1)), 1000)
    return () => clearInterval(t)
  }, [segundos])
  return restante
}

export function ReclutasPanel({
  trigger,
  // La lista va adentro de la diapo solo donde no hay ranking a la vista. En
  // escritorio el ranking es la columna de la izquierda y ya se conmutó a
  // "Reclutas" al abrir esto: repetir la lista acá sería mostrarla dos veces en
  // la misma pantalla.
  conLista = false,
  onContinue,
  // En escritorio el juego se maneja con el teclado y la diapo lo respeta. En el
  // teléfono no hay tecla que mostrar.
  keyboard = false,
  className,
}: {
  trigger: ReclutasTrigger
  conLista?: boolean
  onContinue: () => void
  keyboard?: boolean
  className?: string
}) {
  const cta = useCta()
  const sfx = useSfx()
  const teclas = useTeclas()
  const player = useCachedPlayer()
  // Solo donde la lista se va a dibujar: en escritorio la pide el ranking.
  const reclutas = useGameRecruits(conLista)
  const porcentaje = reclutas.data?.share_percent ?? PORCENTAJE_POR_DEFECTO

  const restante = useEspera(LO_PIDIO(trigger) ? 0 : ESPERA_S)
  const listo = restante === 0

  useEffect(() => {
    cta("share", "impression", { placement: trigger })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger])

  const reclutar = () => {
    sfx.select()
    cta("share", "click", {
      placement: trigger,
      props: { reclutas: reclutas.data?.entries.length ?? 0 },
    })
    window.open(shareUrl(player?.alias), "_blank", "noopener,noreferrer")
  }

  // Los atajos, con el mismo pestillo que la diapo del cafecito: el volteo dura
  // ~380 ms y durante ese rato la diapo que se va sigue montada junto a la que
  // entra, así que sin esto un Enter en ese instante lo escuchan las dos y se
  // piden DOS derivadas.
  const reclutarRef = useRef(reclutar)
  useEffect(() => {
    reclutarRef.current = reclutar
  })
  const seguidoRef = useRef(false)
  useEffect(() => {
    if (!keyboard) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter") return
      e.preventDefault()
      if (e.shiftKey) {
        reclutarRef.current()
        return
      }
      if (!listo || seguidoRef.current) return
      seguidoRef.current = true
      onContinue()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [keyboard, listo, onContinue])

  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col justify-center rounded-lg border p-6 text-center",
        className,
      )}
      style={{
        // Verde muy diluido de fondo, igual que el marrón del cafecito: alcanza
        // para que la diapo se lea como otra cosa que el resto del juego sin
        // dejar de ser la misma tarjeta.
        backgroundColor: `color-mix(in oklab, ${VERDE} 12%, var(--card))`,
        borderColor: `color-mix(in oklab, ${VERDE} 45%, transparent)`,
      }}
    >
      <div className="mx-auto w-full max-w-sm">
        <div className="mx-auto w-fit" style={{ color: VERDE }}>
          <WhatsappGlyph size={34} />
        </div>
        <p className="mt-2 text-2xl font-medium">¿Reclutas?</p>
        <p className="mt-3 text-sm text-muted-foreground">Traé a otros a derivar.</p>

        <p className="mt-4 text-sm leading-relaxed text-foreground/90">
          Te llevás el{" "}
          <span className="font-semibold tabular-nums" style={{ color: VERDE }}>
            {porcentaje}%
          </span>{" "}
          de todo el XP que sumen los que entren por tu link. Para siempre.
        </p>

        {conLista && (
          <ListaDeReclutas
            className="mt-5"
            entries={reclutas.data?.entries ?? []}
          />
        )}

        <button
          type="button"
          onClick={reclutar}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-md px-4 py-3 text-base font-semibold transition-opacity hover:opacity-90"
          style={{ backgroundColor: VERDE, color: VERDE_TINTA_OSCURA }}
        >
          {/* El logo va DESPUÉS de la palabra, como la taza del cafecito: el
              botón se lee "reclutar" y el ícono cierra la frase diciendo por
              dónde, en vez de anunciarla. */}
          Reclutar
          <WhatsappGlyph size={18} />
          {keyboard && <KeyCap>{teclas.shiftEnter}</KeyCap>}
        </button>

        <button
          type="button"
          disabled={!listo}
          onClick={() => {
            sfx.select()
            onContinue()
          }}
          className="mt-3 flex w-full items-center justify-center rounded-md border border-border px-4 py-3 text-base text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-45"
        >
          {LO_PIDIO(trigger) ? "Volver" : listo ? "Ahora no" : `Ahora no (${restante})`}
          {keyboard && listo && <KeyCap>{teclas.enter}</KeyCap>}
        </button>
      </div>
    </div>
  )
}
