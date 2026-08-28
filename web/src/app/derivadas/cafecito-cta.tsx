"use client"

// CTA de Cafecito: el propósito del juego. Un botón fijo discreto siempre
// visible + una card en hitos de dopamina (récord de puesto, subida grande,
// cada tantas resueltas) con cooldown para no espantar.

import { useEffect } from "react"
import { Coffee, Share2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { UNIVERSITY_TAG_BY_KEY } from "@/lib/university-tags"
import { useCafecitoIntent } from "./UseGameLeaderboard"
import { useCachedPlayer } from "./UseGamePlayer"
import {
  readCafecitoLastShownAt,
  saveCafecitoLastShownAt,
} from "./game-storage"
import { useCta } from "./game-telemetry"

// Perfil propio del juego, separado del de Intervalo. Ojo con este valor: ya
// una vez apuntó a `/intervalo`, que había dejado de existir, y durante todo ese
// tiempo el que quería donar caía en un 404 sin que nadie se enterara.
export const CAFECITO_URL = "https://cafecito.app/intervalo"

// Hitos: cada cuántas resueltas se considera mostrar la diapo, y cuántas
// resueltas tienen que pasar entre dos (cooldown).
//
// Veinte y no veinticinco: la diapo dejó de ser un cartel al costado y ahora
// detiene el juego, así que el pedido tiene que llegar cuando la partida
// todavía está viva. Veinte derivadas son unos pocos minutos de juego y ya
// alcanzan para que se entienda de qué se trata.
//
// EN DESARROLLO sale en cada acierto. Con los valores de producción, trabajar en
// esta diapo pide veinte derivadas bien resueltas para verla UNA vez, y otras
// diez para volver a verla: cualquier ajuste de una línea cuesta varios minutos
// de jugar en serio. Va atado a NODE_ENV —la misma guarda que usa el resto del
// proyecto para lo que no puede llegar a producción— y no bajando los números a
// mano, que es lo que después se commitea sin querer.
const EN_DESARROLLO = process.env.NODE_ENV === "development"
export const CAFECITO_EVERY = EN_DESARROLLO ? 1 : 20
export const CAFECITO_COOLDOWN = EN_DESARROLLO ? 0 : 10

export type CafecitoTrigger = "record" | "big_climb" | "milestone"

export function shouldShowCafecito(
  solvedCount: number,
  trigger: CafecitoTrigger | null,
): boolean {
  if (!trigger) return false
  return solvedCount - readCafecitoLastShownAt() >= CAFECITO_COOLDOWN
}

/** Anota el cooldown. La impresión NO se registra acá: la registra la propia
 *  card al montarse (ver `CafecitoCard`), que es cuando el cartel existe de
 *  verdad y además sabe si tiene universidad y por lo tanto si hay un camino a
 *  Cafecito o solo un pedido de datos. Registrarla en los dos lados contaría
 *  dos veces la misma impresión. */
export function markCafecitoShown(solvedCount: number) {
  saveCafecitoLastShownAt(solvedCount)
}

export function CafecitoButton({
  placement,
  compact = false,
  className,
}: {
  placement: string
  // Solo el ícono. En escritorio la cabecera ya lleva el botón de la tabla con
  // su rótulo y su tecla, y tres botones con texto se pisaban entre sí.
  //
  // Fuera de escritorio no se usa: ahí la palabra ya la esconde el `sm` de
  // abajo en un teléfono, y en una tablet —que entra por MobileFlow, porque el
  // layout se elige por user agent y no por ancho— sobra lugar para mostrarla.
  // Y mostrarla es lo que se quiere: es el propósito del juego, no un adorno.
  compact?: boolean
  className?: string
}) {
  const cta = useCta()
  // El botón de la cabecera está SIEMPRE a la vista, así que su impresión no es
  // por render sino una por partida: «esta persona tuvo el cafecito adelante».
  // Ese es justo el denominador que hace falta para poder decir qué fracción de
  // los que jugaron llegó a tocarlo.
  useEffect(() => {
    cta("cafecito", "impression", { placement })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const intent = useCafecitoIntent()
  return (
    <a
      href={CAFECITO_URL}
      target="_blank"
      rel="noreferrer"
      aria-label="Invitar un cafecito"
      onClick={() => {
        cta("cafecito", "click", { placement })
        // Antes de irse: es lo único que le dice al servidor de qué
        // universidad viene el cafecito que quizás llegue en un rato.
        intent.mutate()
      }}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border border-[#A8703C]/60 px-2.5 py-1.5 text-sm text-[#A8703C] transition-colors hover:bg-[#A8703C]/10",
        className,
      )}
    >
      <Coffee size={15} />
      {!compact && <span className="hidden sm:inline">cafecito</span>}
    </a>
  )
}

// Compartir por WhatsApp: el canal por el que llega casi todo el mundo.
//
// El mensaje es el LINK primero y la arenga después, en dos renglones:
//
//     https://www.intervalo.xyz/derivadas?r=nvrancovich
//     ¡Vengan a bancar a la UBA!
//
// El link va primero porque es lo que se toca. La vista previa la arma WhatsApp
// pidiendo la URL tal cual, así que el `?r=` no la cambia —la ruta sigue siendo
// /derivadas, con sus mismos tags Open Graph— y lo que se ve es la misma tarjeta
// para todos.
const SHARE_BASE = "https://www.intervalo.xyz/derivadas"

/** El link con el @ de quien comparte, que es lo que después permite contar
 *  cuánta gente entró por cada persona (ver FIRST_REFERRER en
 *  lib/analytics/attribution.ts). Sin alias, el link pelado. */
export function shareLink(alias?: string | null) {
  return alias ? `${SHARE_BASE}?r=${encodeURIComponent(alias)}` : SHARE_BASE
}

// "a la UBA" pero "al ITBA": la contracción sale de si el nombre completo
// empieza con "Instituto", que es la misma regla que `article_for()` en el
// backend (universities.py). Si la sigla no está en el catálogo del front —que
// es más corto que el de noventa del backend— gana "la", que es el caso de
// casi todas.
function bancarA(university: string) {
  const nombre = UNIVERSITY_TAG_BY_KEY[university]?.fullName
  return nombre?.startsWith("Instituto") ? `al ${university}` : `a la ${university}`
}

/** El mensaje entero. Sin universidad elegida va SOLO el link: la arenga sin
 *  destinatario ("¡Vengan a bancar a la …!") no se puede escribir, y un pedido
 *  de bancar a nadie es peor que no pedir nada. */
export function shareText({
  alias,
  university,
}: {
  alias?: string | null
  university?: string | null
}) {
  const link = shareLink(alias)
  return university ? `${link}
¡Vengan a bancar ${bancarA(university)}!` : link
}

export function shareUrl(player: { alias?: string | null; university?: string | null }) {
  return `https://wa.me/?text=${encodeURIComponent(shareText(player))}`
}

export function ShareButton({
  placement,
  className,
}: {
  placement: string
  className?: string
}) {
  const cta = useCta()
  // Del caché, sin pedir nada: el jugador ya lo trajo el bootstrap y este botón
  // solo necesita mirarlo para saber a qué universidad arengar.
  const player = useCachedPlayer()
  useEffect(() => {
    cta("share", "impression", { placement })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return (
    <a
      href={shareUrl({ alias: player?.alias, university: player?.university })}
      target="_blank"
      rel="noreferrer"
      aria-label="Compartir por WhatsApp"
      onClick={() =>
        cta("share", "click", {
          placement,
          // Para poder separar el boca a boca con arenga del link pelado.
          props: { university: player?.university ?? null },
        })
      }
      className={cn(
        "inline-flex items-center rounded-md border border-border px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent",
        className,
      )}
    >
      <Share2 size={15} />
    </a>
  )
}

// El multiplicador siempre con la coma decimal de acá y una sola cifra: es el
// mismo formato en el slider, en el cartel del ranking y en el marcador de la
// card, así que vive en un solo lugar.
export const fmtMultiplier = (m: number) => `×${m.toFixed(1).replace(".", ",")}`
