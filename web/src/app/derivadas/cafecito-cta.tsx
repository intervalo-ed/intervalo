"use client"

// CTA de Cafecito: el propósito del juego. Un botón fijo discreto siempre
// visible + una card en hitos de dopamina (récord de puesto, subida grande,
// cada tantas resueltas) con cooldown para no espantar.

import posthog from "posthog-js"
import { Coffee, Share2, Table2 as TableIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  readCafecitoLastShownAt,
  saveCafecitoLastShownAt,
} from "./game-storage"

// Perfil propio del juego, separado del de Intervalo. `/intervalo` no existe
// más —devuelve "esta página no está disponible"—, así que mientras apuntó ahí
// todo el que quiso donar cayó en un 404.
export const CAFECITO_URL = "https://cafecito.app/derivadas"

// Hitos: cada cuántas resueltas se considera mostrar la card, y cuántas
// resueltas tienen que pasar entre dos cards (cooldown).
export const CAFECITO_EVERY = 25
export const CAFECITO_COOLDOWN = 10

export type CafecitoTrigger = "record" | "big_climb" | "milestone"

export function shouldShowCafecito(
  solvedCount: number,
  trigger: CafecitoTrigger | null,
): boolean {
  if (!trigger) return false
  return solvedCount - readCafecitoLastShownAt() >= CAFECITO_COOLDOWN
}

export function markCafecitoShown(solvedCount: number, trigger: CafecitoTrigger) {
  saveCafecitoLastShownAt(solvedCount)
  posthog.capture("game_cafecito_impression", { trigger })
}

export function CafecitoButton({
  placement,
  className,
}: {
  placement: string
  className?: string
}) {
  return (
    <a
      href={CAFECITO_URL}
      target="_blank"
      rel="noreferrer"
      aria-label="Invitar un cafecito"
      onClick={() => posthog.capture("game_cafecito_click", { placement })}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border border-[#A8703C]/60 px-2.5 py-1.5 text-sm text-[#A8703C] transition-colors hover:bg-[#A8703C]/10",
        className,
      )}
    >
      <Coffee size={15} />
      <span className="hidden sm:inline">cafecito</span>
    </a>
  )
}

// Compartir por WhatsApp: el canal por el que llega casi todo el mundo.
const SHARE_TEXT = "¿Cuántas derivadas aguantás? 🧠 https://www.intervalo.xyz/derivadas"
export const SHARE_URL = `https://wa.me/?text=${encodeURIComponent(SHARE_TEXT)}`

export function ShareButton({
  placement,
  className,
}: {
  placement: string
  className?: string
}) {
  return (
    <a
      href={SHARE_URL}
      target="_blank"
      rel="noreferrer"
      aria-label="Compartir por WhatsApp"
      onClick={() => posthog.capture("game_share_click", { placement })}
      className={cn(
        "inline-flex items-center rounded-md border border-border px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent",
        className,
      )}
    >
      <Share2 size={15} />
    </a>
  )
}

// Abre la tabla de derivadas (da vuelta la card del ejercicio). Vive con los
// otros dos del header por forma, no por familia: es el tercer botón de esa
// esquina y tiene que pesar lo mismo que compartir.
export function TableButton({
  open,
  onToggle,
  className,
}: {
  open: boolean
  onToggle: () => void
  className?: string
}) {
  return (
    <button
      type="button"
      aria-label={open ? "Volver al ejercicio" : "Ver la tabla de derivadas"}
      aria-pressed={open}
      onClick={onToggle}
      className={cn(
        "inline-flex items-center rounded-md border px-2.5 py-1.5 text-sm transition-colors",
        open
          ? "border-foreground/40 bg-accent text-foreground"
          : "border-border text-muted-foreground hover:bg-accent",
        className,
      )}
    >
      <TableIcon size={15} />
    </button>
  )
}

const TRIGGER_COPY: Record<CafecitoTrigger, { title: string; sub: string }> = {
  record: {
    title: "¡Récord personal!",
    sub: "Nunca estuviste tan arriba en el ranking.",
  },
  big_climb: {
    title: "¡Qué escalada!",
    sub: "Subiste varios puestos de una sola derivada.",
  },
  milestone: {
    title: "Seguís derivando",
    sub: "Ya resolviste un buen montón.",
  },
}

export function CafecitoCard({ trigger }: { trigger: CafecitoTrigger }) {
  const copy = TRIGGER_COPY[trigger]
  return (
    <div className="rounded-lg border border-border bg-card p-4 text-center">
      <Coffee size={26} className="mx-auto text-[#A8703C]" />
      <p className="mt-2 font-medium">{copy.title}</p>
      <p className="mt-0.5 text-sm text-muted-foreground">{copy.sub}</p>
      <p className="mt-3 text-sm leading-relaxed text-foreground/90">
        ¿Te está gustando? Este juego se banca a cafecito.
      </p>
      <a
        href={CAFECITO_URL}
        target="_blank"
        rel="noreferrer"
        onClick={() =>
          posthog.capture("game_cafecito_click", { placement: `card_${trigger}` })
        }
        className="mt-3 block rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
      >
        Invitar un cafecito
      </a>
    </div>
  )
}
