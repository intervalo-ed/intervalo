"use client"

// La diapo del reclutamiento: el otro momento en que el juego pide algo.
//
// Gemela de la del cafecito (cafecito-panel.tsx) y a propósito: mismo lugar
// —ocupa la tarjeta del ejercicio y entra con el mismo volteo—, casi la misma
// anatomía —ícono, título con signos de pregunta, texto que explica, un botón
// que hace algo y otro que sale— y las mismas dos decisiones que parecen
// fricción:
//
// · El botón de seguir tarda unos segundos en habilitarse cuando la diapo la
//   sacó el juego. A esta altura la persona lleva varias derivadas despachadas a
//   golpe de Enter: sin la espera, la diapo se salta antes de verse. Cuando la
//   abrió ella misma no hay espera, porque nadie la interrumpió.
// · Reclutar es `shift + enter`. Enter sigue significando lo de siempre, así que
//   al único lugar al que se llega sin querer es al próximo ejercicio.
//
// La diferencia de anatomía es una sola: acá no hay subtítulo. El del café
// justifica la interrupción (que Intervalo se sostiene con donaciones de
// estudiantes) y esta diapo no necesita justificarse, así que ese renglón lo
// ocupa lo primero que hay que decir.
//
// Lo que sí es distinto es lo que ofrece. El cafecito pide plata y devuelve un
// multiplicador para toda una universidad; esto no pide nada más que un mensaje
// y devuelve un porcentaje de lo que hagan otros, para siempre. Por eso la lista
// de reclutas va ADENTRO de la diapo en el teléfono: es lo único que convierte
// "el 10% de lo que sumen" en algo que se puede mirar.

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { useSfx } from "@/lib/audio/useSfx"
import {
  abrirWhatsapp,
  ReclutarButton,
  VERDE,
  WhatsappGlyph,
} from "./cafecito-cta"
import { KeyCap } from "./exercise-card"
import { useCta } from "./game-telemetry"
import { ListaDeReclutas } from "./reclutas-list"
import { CLASE_ACCION_EN_EL_PIE, claseDeSalida, Salida } from "./slide-salida"
import { enCampoDeTexto, useTeclas } from "./teclas"
import { useCachedPlayer } from "./UseGamePlayer"
import { useGameRecruits } from "./UseGameLeaderboard"

// Cuánto tarda en habilitarse el botón de salir cuando la diapo la sacó el
// juego. Dos segundos menos que la del cafecito: allá hay una barra que mover y
// un número que mirar antes de decidir, acá hay tres renglones y un botón.
//
// En cero en desarrollo — misma guarda que COOLDOWN_S en cafecito-panel.tsx.
const EN_DESARROLLO = process.env.NODE_ENV === "development"
const ESPERA_S = EN_DESARROLLO ? 0 : 8

// El porcentaje que se muestra mientras el servidor no contestó todavía. Es el
// mismo valor que `SHARE_PERCENT` en backend/game/referrals.py; la respuesta lo
// trae y pisa a este, así que si algún día cambia allá, acá solo queda un
// parpadeo del valor viejo y no un número mentiroso permanente.
const PORCENTAJE_POR_DEFECTO = 10

// `record` sigue reservado para el cafecito: la diapo de reclutar que sale sola
// lo hace por conteo, y "hito" es lo que la distingue de la que abrió la persona.
export type ReclutasTrigger = "pedido" | "hito"

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
  // Dónde dibujar el botón de salir. En escritorio es el pie de la columna, para
  // que quede en el mismo lugar donde estaba Revisar; en el teléfono no viene y
  // el botón se queda adentro de la diapo. Ver slide-salida.tsx.
  slotSalida,
  // Ídem para el botón de color. Solo lo manda el teléfono: en escritorio se
  // queda adentro de la caja, que es donde se lo diseñó.
  slotAccion,
  // En escritorio el juego se maneja con el teclado y la diapo lo respeta. En el
  // teléfono no hay tecla que mostrar.
  keyboard = false,
  // Gemelo del de cafecito-panel.tsx: solo lo manda el teléfono, donde el
  // tinte de fondo pasó a cubrir toda la pantalla (ver mobile-flow.tsx), así
  // que acá se dibuja sin caja propia. En escritorio sigue siendo la card.
  fullBleed = false,
  className,
}: {
  trigger: ReclutasTrigger
  conLista?: boolean
  onContinue: () => void
  slotSalida?: HTMLElement | null
  slotAccion?: HTMLElement | null
  keyboard?: boolean
  fullBleed?: boolean
  className?: string
}) {
  const cta = useCta()
  const sfx = useSfx()
  const teclas = useTeclas()
  const player = useCachedPlayer()
  // Con universidad, el copy la nombra: "tu universidad" en abstracto es más
  // débil que la sigla concreta que esta persona ya eligió.
  const university = player?.university ?? null
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
    abrirWhatsapp(player?.alias)
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
      // Escribiendo en el chat, un Enter es un Enter. Este listener vive en
      // `document` y la diapo puede estar abierta con el aside volteado al chat,
      // así que sin esto un shift+enter a mitad de una palabra abría WhatsApp.
      if (enCampoDeTexto(e.target)) return
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
        "flex min-h-0 flex-1 flex-col justify-center p-6 text-center",
        !fullBleed && "rounded-lg border",
        className,
      )}
      style={
        fullBleed
          ? undefined
          : {
              // Verde muy diluido de fondo, igual que el marrón del cafecito:
              // alcanza para que la diapo se lea como otra cosa que el resto
              // del juego sin dejar de ser la misma tarjeta.
              backgroundColor: `color-mix(in oklab, ${VERDE} 12%, var(--card))`,
              borderColor: `color-mix(in oklab, ${VERDE} 45%, transparent)`,
            }
      }
    >
      <div className="mx-auto w-full max-w-sm">
        <div className="mx-auto w-fit" style={{ color: VERDE }}>
          <WhatsappGlyph size={34} />
        </div>
        <p className="mt-2 text-2xl font-medium">¿Reclutas?</p>

        {/* Sin subtítulo, al revés que la diapo del café.
            Decía «Traé a otros a derivar», que es la misma orden que da el
            primero de estos dos párrafos, y apiladas con un renglón de aire en
            el medio se leían como una repetición. El subtítulo estaba escrito
            para ser lo único entre el título y la explicación; en cuanto la
            explicación arranca hablando de lo mismo, sobra.

            Y son DOS párrafos y no una oración larga porque dicen dos cosas
            distintas: el primero es el motivo —lo que le pasa a algo más grande
            que uno— y el segundo es lo que se cobra. Juntas en una sola oración,
            el motivo quedaba de excusa del cobro. */}
        {/* Con universidad, el primer párrafo la nombra y el segundo hace
            explícito el circuito completo (el 10% viaja a esta persona, y por
            eso también a su universidad) en vez de solo su parte ("te llevás
            el 10%"). Sin universidad no hay nada que nombrar, así que se queda
            con la versión genérica de siempre. */}
        {university ? (
          <>
            <p className="mt-4 text-sm leading-relaxed text-foreground/90">
              La{" "}
              <span className="font-semibold" style={{ color: VERDE }}>
                {university}
              </span>{" "}
              crece y escala más rápido el ranking con cada compañero que
              traigas.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-foreground/90">
              Quienes ingresen con tu link generan un{" "}
              <span className="font-semibold tabular-nums" style={{ color: VERDE }}>
                {porcentaje}%
              </span>{" "}
              más de XP, el cual va{" "}
              <span className="font-semibold" style={{ color: VERDE }}>
                para vos
              </span>{" "}
              y por lo tanto a la{" "}
              <span className="font-semibold" style={{ color: VERDE }}>
                {university}
              </span>{" "}
              también.
            </p>
          </>
        ) : (
          <>
            <p className="mt-4 text-sm leading-relaxed text-foreground/90">
              Tu universidad crece con cada persona que traigas.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-foreground/90">
              Te llevás el{" "}
              <span className="font-semibold tabular-nums" style={{ color: VERDE }}>
                {porcentaje}%
              </span>{" "}
              de todo el XP que generen quienes practiquen gracias a vos.
            </p>
          </>
        )}

        {conLista && (
          <ListaDeReclutas
            className="mt-5"
            entries={reclutas.data?.entries ?? []}
            university={university}
            // Tres y no cinco: acá la lista viene detrás del copy y del botón, y
            // cinco renglones empujaban el botón fuera de la pantalla.
            ejemplos={3}
          />
        )}

        <Salida slot={slotAccion}>
          <ReclutarButton
            alias={player?.alias}
            placement={trigger}
            telemetryProps={{ reclutas: reclutas.data?.entries.length ?? 0 }}
            className={
              slotAccion
                ? CLASE_ACCION_EN_EL_PIE
                : "mt-5 w-full rounded-md px-4 py-3"
            }
            keycap={keyboard ? <KeyCap>{teclas.shiftEnter}</KeyCap> : null}
          />
        </Salida>

        <Salida slot={slotSalida}>
          <button
            type="button"
            disabled={!listo}
            onClick={() => {
              sfx.select()
              onContinue()
            }}
            className={cn(
              claseDeSalida(!!slotSalida),
              // Gemelo del de cafecito-panel.tsx: solo en `fullBleed`, para
              // que `disabled:opacity-45` no mezcle el color propio de este
              // botón (ver `style`) con lo que haya detrás mientras corre la
              // cuenta. Se apaga el texto en vez del botón entero.
              fullBleed && "disabled:opacity-100 disabled:text-muted-foreground/50",
            )}
            style={
              fullBleed
                ? {
                    // Gemelo del de cafecito-panel.tsx: ni el gris de siempre
                    // ni el verde de la oferta, el 70% del 6% que tiñe toda
                    // la pantalla (fondoDeSlide, mobile-flow.tsx).
                    backgroundColor: `color-mix(in oklab, ${VERDE} 4.2%, var(--background))`,
                  }
                : undefined
            }
          >
            {LO_PIDIO(trigger) ? "Volver" : listo ? "Ahora no" : `Ahora no (${restante})`}
            {keyboard && listo && <KeyCap>{teclas.enter}</KeyCap>}
          </button>
        </Salida>
      </div>
    </div>
  )
}
