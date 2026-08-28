"use client"

// CTA de Cafecito: el propósito del juego. Un botón fijo discreto siempre
// visible + una card en hitos de dopamina (récord de puesto, subida grande,
// cada tantas resueltas) con cooldown para no espantar.

import { useEffect } from "react"
import { Coffee, Share2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { UNIVERSITY_TAG_BY_KEY } from "@/lib/university-tags"
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

// Por qué apareció la diapo. Los tres primeros los decide el juego después de
// una respuesta; `pedido` es cuando la persona la abrió ella misma con el botón
// de la barra, y eso cambia dos cosas: no se la felicita por un hito que no
// acaba de pasar, y al salir vuelve a SU ejercicio en vez de pedir uno nuevo.
export type CafecitoTrigger = "record" | "big_climb" | "milestone" | "pedido"

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

// Lugares cuya impresión ya se registró en esta carga de página.
//
// Los dos botones de la barra anotan su impresión al montarse, y el comentario
// de abajo dice —con razón— que eso tiene que ser una por partida. En escritorio
// lo era, porque la barra vive fuera de los volteos. En el teléfono no: la barra
// está adentro del contenedor con `key` que se remonta en cada cambio de slide,
// así que responder → ranking → continuar → ejercicio anotaba CUATRO impresiones
// y cuatro POST por ejercicio. Además de gastar datos de un plan medido, eso
// inflaba por un orden de magnitud el denominador del embudo del cafecito, que
// es con lo que se decide si el juego se sostiene.
//
// Módulo y no ref: la idea es "esta persona tuvo el cafecito adelante", que no
// depende de cuántas veces React haya montado el botón.
const impresionesAnotadas = new Set<string>()

function useImpresionPorPartida(
  cta: ReturnType<typeof useCta>,
  tipo: "cafecito" | "share",
  placement: string,
) {
  useEffect(() => {
    const clave = `${tipo}:${placement}`
    if (impresionesAnotadas.has(clave)) return
    impresionesAnotadas.add(clave)
    cta(tipo, "impression", { placement })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}

export function CafecitoButton({
  placement,
  onOpen,
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
  // Abre la diapo del cafecito, en vez de mandar directo a Cafecito.
  //
  // Antes esto era un enlace que abría Cafecito en otra pestaña y anotaba la
  // intención de paso. Eso dejaba DOS caminos al mismo lugar —este y la diapo—
  // con la mitad de las cosas cada uno: el botón se saltaba el slider (o sea que
  // nadie veía cuánto multiplica lo que está por invitar) y, sobre todo, se
  // saltaba la pantalla de vuelta, así que quien donaba por acá volvía a
  // encontrar todo igual que como lo había dejado.
  //
  // Ahora el botón solo abre la diapo, y la diapo hace lo que ya sabía hacer:
  // anotar la intención, abrir Cafecito y contarle a la persona qué pasó cuando
  // vuelve. Un solo camino, y todo lo que se arregla se arregla una vez.
  onOpen: () => void
  className?: string
}) {
  const cta = useCta()
  // El botón de la cabecera está SIEMPRE a la vista, así que su impresión no es
  // por render sino una por partida: «esta persona tuvo el cafecito adelante».
  // Ese es justo el denominador que hace falta para poder decir qué fracción de
  // los que jugaron llegó a tocarlo.
  useImpresionPorPartida(cta, "cafecito", placement)
  return (
    <button
      type="button"
      aria-label="Invitar un cafecito"
      onClick={() => {
        cta("cafecito", "click", { placement })
        onOpen()
      }}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border border-[#A8703C]/60 px-2.5 py-1.5 text-sm text-[#A8703C] transition-colors hover:bg-[#A8703C]/10",
        className,
      )}
    >
      <Coffee size={15} />
      {!compact && <span className="hidden sm:inline">cafecito</span>}
    </button>
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
  useImpresionPorPartida(cta, "share", placement)
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
