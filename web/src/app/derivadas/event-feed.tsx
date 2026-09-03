"use client"

// Historial de lo que va pasando en el juego, debajo del CTA.
//
// Es un feed SOLO del sistema: ninguna línea la escribe un usuario, así que no
// hay nada que moderar y no hay campo de texto. Lo que sí hay es criterio sobre
// qué merece aparecer, y ese vive en el servidor (backend/game/events.py).
//
// Lo nuevo entra ABAJO, como un chat: se lee de arriba hacia abajo y lo último
// que pasó queda al pie. Eso obliga a dos cosas que un feed al revés no
// necesita —quedarse pegado al fondo cuando entra algo, y NO robarle el scroll
// a quien se fue a leer más arriba— y las dos viven en `EventFeed`.

import { useLayoutEffect, useRef, useState } from "react"
import { outOfFocus } from "./out-of-focus"
import { AnimatePresence, motion } from "motion/react"
import { cn } from "@/lib/utils"
import { Hueco } from "@/components/skeleton-barra"
import { levelColor } from "./game-colors"
import { useGameEvents, type GameEvent } from "./UseGameLeaderboard"

// A cuántos píxeles del fondo se sigue considerando "pegado abajo".
const STICK_SLACK_PX = 24

// Cuánto del historial entra en el panel. El servidor manda hasta 40; acá se
// recorta a lo que se puede leer sin que el panel se vuelva un pozo de scroll.
const SHOWN = 12

/** «recién» / «12 min» / «3 h» / «2 d». Lo usa también el chat, que muestra la
 *  misma clase de renglón. */
export function fmtAgo(seconds: number): string {
  if (seconds < 60) return "recién"
  const min = Math.floor(seconds / 60)
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h} h`
  return `${Math.floor(h / 24)} d`
}

// Los marcadores que el servidor deja en el texto: el protagonista, un segundo
// protagonista ("{a} reclutó a {b}") y hasta dos siglas de universidad. Ver
// backend/game/events.py.
//
// Se parte con `split` y grupo de captura —que devuelve los separadores mezclados
// con el texto— en vez de iterar con `exec`: así no hay `lastIndex` que resetear,
// que además el compilador de React no deja tocar por ser una constante de módulo.
const SLOT = /(\{(?:a|b|u0|u1)\})/

/** El texto del evento, con cada marcador reemplazado por su pieza.
 *
 * La universidad se dibuja con la MISMA tag del ranking y el nombre con el MISMO
 * color de nivel, así el feed y la tabla hablan del mismo mundo: si en el
 * ranking la UBA es un chip celeste y un jugador violeta, acá también.
 *
 * El servidor manda la oración con agujeros justamente para esto. Resolverla
 * allá y después buscar las siglas con una regex acá sería adivinar: "UNT"
 * también puede aparecer dentro de una palabra, y el copy cambia. */
function EventText({ event }: { event: GameEvent }) {
  const level = event.actor_level
  return (
    <>
      {event.text.split(SLOT).map((chunk, i) => {
        if (chunk === "{a}") {
          return (
            <span
              key={i}
              className="font-semibold"
              // Sin nivel —quien invita un cafecito no es necesariamente un
              // jugador— el nombre va destacado pero sin robarle un color que no
              // le corresponde.
              style={level === null || level === undefined ? undefined : { color: levelColor(level) }}
            >
              {event.actor_alias}
            </span>
          )
        }
        if (chunk === "{b}") {
          // Sin color de nivel a propósito, como las siglas de universidad:
          // acá el protagonista es {a} (quien reclutó), y a este segundo
          // nombre le alcanza con destacarse, no con anunciar su rango.
          return event.actor_b_alias ? (
            <span key={i} className="font-semibold text-foreground/90">
              {event.actor_b_alias}
            </span>
          ) : null
        }
        if (chunk === "{u0}" || chunk === "{u1}") {
          const uni = event.universities?.[chunk === "{u0}" ? 0 : 1]
          // Sigla en texto, no la <UniTag>: el feed es una oración corrida —"la
          // UNSAM le pasó a la UNL"— y meterle dos chips de color adentro la
          // partía en pedazos en vez de dejarla leer. El artículo ("la"/"el") ya
          // viene en el texto del servidor, que es el único que sabe cuáles son
          // institutos.
          //
          // Si la sigla no vino, se cae el marcador: mejor una oración corta que
          // un "{u1}" crudo en pantalla.
          return uni ? (
            <span key={i} className="font-semibold text-foreground/90">
              {uni}
            </span>
          ) : null
        }
        return chunk
      })}
    </>
  )
}

function EventRow({ event }: { event: GameEvent }) {
  // Dos resaltados y no más: lo que hiciste vos y lo que le pasa a tu universidad.
  // Si todo se resalta, no se resalta nada.
  const highlight = event.is_mine || event.is_my_university
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={cn(
        "flex items-baseline gap-2 rounded-md px-2 py-1.5 text-xs leading-snug",
        highlight
          ? event.kind === "boost"
            ? "bg-[#A8703C]/12 text-foreground/90"
            : event.kind === "referral"
              ? "bg-[#25D366]/12 text-foreground/90"
              : "bg-primary/10 text-foreground/90"
          : "text-muted-foreground",
      )}
    >
      <span className="min-w-0 flex-1">
        <EventText event={event} /> <span aria-hidden>{event.emoji}</span>
      </span>
      <span className="shrink-0 tabular-nums text-[0.68rem] text-muted-foreground/70">
        {fmtAgo(event.seconds_ago)}
      </span>
    </motion.li>
  )
}

// El esqueleto del feed: calca a `EventRow` y a su lista, con las mismas clases.
// Antes acá había un "Cargando…" suelto, que además de no parecerse a nada movía
// el panel dos veces —una al aparecer el texto y otra al reemplazarlo la lista.
//
// `h-[1.375em]` sobre un `text-xs` es la caja de línea de `leading-snug`
// (0,75rem × 1,375 = 16,5 px), que es lo que le da alto a la línea real. No hay
// forma de escribirlo con una clase de la escala: el número existe porque el
// renglón de verdad mide eso.
//
// Cuatro líneas y no doce: el feed de escritorio mide poco más de cien píxeles y
// el `my-auto` —el mismo de la lista real— las deja centradas en el hueco que
// haya, sin apoyarse en el techo ni en el piso.
function FeedSkeleton() {
  const anchos = ["w-40", "w-52", "w-44", "w-36"]
  return (
    <ul className="my-auto flex animate-pulse flex-col gap-0.5" aria-hidden>
      {anchos.map((ancho, i) => (
        <li
          key={i}
          className="flex items-baseline gap-2 rounded-md px-2 py-1.5 text-xs leading-snug"
        >
          <Hueco alto="h-[1.375em]" className="min-w-0 flex-1" barra={cn("h-2.5", ancho)} />
          {/* El "hace 3 min" del final, que va en un cuerpo más chico. */}
          <Hueco
            alto="h-[1.375em]"
            className="w-8 shrink-0 text-[0.68rem]"
            barra="h-2.5 w-full"
          />
        </li>
      ))}
    </ul>
  )
}

export function EventFeed({
  enabled,
  className,
  veiled = false,
  paginado = false,
}: {
  enabled: boolean
  className?: string
  /** Fuera de foco: durante la intro el historial ya está puesto pero todavía
   *  no es de nadie (ver out-of-focus.ts). */
  veiled?: boolean
  /** Deja ver MÁS de las que entran en el primer pantallazo, de a tandas, al
   *  scrollear hacia arriba.
   *
   *  Apagado en escritorio a propósito: allá el historial es una franja de 107 px
   *  al pie de la columna, y ahí lo que corresponde es lo último y nada más. En
   *  el teléfono, en cambio, ocupa la pantalla entera después del ranking y
   *  cortarlo en doce era dejar la mitad del alto vacío. */
  paginado?: boolean
}) {
  const { data, isPending } = useGameEvents(enabled)
  // Cuántas se muestran. Crece de a tandas al llegar arriba, nunca al revés: lo
  // que ya se desplegó no se vuelve a plegar solo mientras se está leyendo.
  const [tope, setTope] = useState(SHOWN)
  const todas = data?.events ?? []
  // El servidor manda del más nuevo al más viejo; se recorta a lo que entra y
  // recién ahí se da vuelta, para quedarse con los ÚLTIMOS y no con los primeros.
  const events = todas.slice(0, paginado ? tope : SHOWN).reverse()
  const hayMas = paginado && todas.length > tope

  const scrollRef = useRef<HTMLDivElement | null>(null)
  // ¿La vista está pegada al fondo? Arranca en true para que el primer pintado
  // muestre lo último. Va en un ref y no en estado: cambia con cada scroll, y
  // redibujar el feed en cada rueda del mouse no tiene ningún sentido.
  const stuckRef = useRef(true)

  // Sin lista de dependencias a propósito: corre después de cada pintado, que es
  // exactamente cuando puede haber entrado una línea nueva. `scrollTop` directo y
  // no `scrollTo({behavior:"smooth"})`: un feed que se desliza solo cada ocho
  // segundos marea, y el suave además no corre con la pestaña oculta.
  useLayoutEffect(() => {
    const el = scrollRef.current
    if (!el || !stuckRef.current) return
    el.scrollTop = el.scrollHeight
  })

  return (
    <div
      className={cn(
        "flex min-h-0 flex-col overflow-hidden rounded-lg border border-border bg-card",
        className,
      )}
    >
      {/* Sin título: cada línea ya dice qué es, y un rótulo fijo se comía un
          renglón de los pocos que hay. */}
      <div
        ref={scrollRef}
        onScroll={(e) => {
          const el = e.currentTarget
          // Con margen de gracia: pedir el fondo exacto falla por el subpíxel de
          // un zoom o una pantalla HiDPI, y el feed dejaría de seguir sin que
          // nadie haya scrolleado.
          stuckRef.current =
            el.scrollHeight - el.scrollTop - el.clientHeight < STICK_SLACK_PX
          // Cerca del techo hay más para leer: se suelta otra tanda. El ancla no
          // hace falta —la lista crece HACIA ARRIBA y el navegador conserva el
          // scrollTop, así que lo que se está mirando no se mueve.
          if (hayMas && el.scrollTop < STICK_SLACK_PX) setTope((n) => n + SHOWN)
        }}
        className={cn(
          "no-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto px-1.5 py-1",
          outOfFocus(veiled),
        )}
      >
        {events.length === 0 && isPending ? (
          <FeedSkeleton />
        ) : events.length === 0 ? (
          <p className="px-2 py-3 text-xs text-muted-foreground">
            Todavía no pasó nada. Resolvé una y arrancá vos.
          </p>
        ) : (
          <ul className="my-auto flex flex-col gap-0.5">
            {/* `my-auto`: mientras las líneas no llenen el panel se quedan
                CENTRADAS, sin apoyarse ni en el techo ni en el piso. Estuvo un
                rato en `mt-auto` —apoyadas abajo, como un chat— pero con dos o
                tres novedades eso junta todo el sobrante de un solo lado y el
                panel se lee a medio llenar en vez de tranquilo.

                Los márgenes automáticos solo se reparten espacio LIBRE: en
                cuanto el contenido desborda valen cero, así que no le comen el
                techo al scroll ni pelean con el pegado al fondo.

                `mode="sync"`: con "wait" cada línea nueva esperaría a que se
                termine de ir la vieja, y el feed se movería a los saltos. */}
            <AnimatePresence mode="sync" initial={false}>
              {events.map((e) => (
                <EventRow key={e.id} event={e} />
              ))}
            </AnimatePresence>
          </ul>
        )}
      </div>
    </div>
  )
}
