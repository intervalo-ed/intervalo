"use client"

// El cartel de empujes de cafecito vigentes, y su chip.
//
// Vivía adentro de app/derivadas/game-ranking.tsx. Se saca acá porque ahora lo
// muestran los DOS rankings —el del minijuego y el de Intervalo clásico— y es
// literalmente el mismo cartel: el mismo cafecito, el mismo reloj, el mismo
// ámbar. Copiarlo habría dado dos relojes que se van desincronizando de a un
// ajuste por vez, que es exactamente lo que le pasó a la resolución de
// "de qué universidad es esta persona" y está documentado en xp_boost.py.
//
// Lo único que cambia entre los dos productos es DE DÓNDE salen los empujes: en
// el juego del pulso del ranking, en clásico del resumen del leaderboard. Por
// eso entran por parámetro y acá adentro no hay ningún hook de datos.

import { XpDots } from "@/components/xp-dots"
import { UniTag } from "@/components/university-tag"
import { cn } from "@/lib/utils"
import {
  fmtMultiplier,
  fmtRemaining,
  tituloDe,
  type EmpujeVigente,
} from "@intervalo/dx-core/juego/ranking-formato"
import { AMBAR, intensidadDelChip, ORO_CHIP_PCT } from "@intervalo/dx-core/juego/game-colors"
import { useCountdown, useEmpujesAMostrar } from "@intervalo/dx-core/juego/UseBoosts"

// El hook vive en dx-core (lo comparte la app nativa); se reexporta para
// los rankings que ya los importaban de acá.
export { useBoostMultipliers } from "@intervalo/dx-core/juego/UseBoosts"

const ORO_CHIP = `color-mix(in oklab, ${AMBAR} ${ORO_CHIP_PCT}%, #FFFFFF)`

export function BoostChip({
  boost,
  mine,
}: {
  boost: EmpujeVigente
  mine: boolean
}) {
  const left = useCountdown({ initialSeconds: boost.expires_in_seconds })
  if (left <= 0) return null
  const k = intensidadDelChip(boost.multiplier)
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs tabular-nums ring-1",
        mine && "font-semibold",
      )}
      // Todos marrones, no solo el propio. Un empuje ES un cafecito, y el
      // cafecito tiene un color en este producto: pintar unos sí y otros no
      // hacía parecer que fueran dos cosas distintas.
      //
      // El BRILLO lo decide el multiplicador, no de quién es: un ×3 se ve de
      // lejos y un ×1,1 apenas se insinúa, así que la fuerza del café se lee sin
      // leer el número. Al propio lo distinguen el peso de la letra y el dorado
      // del texto — si además fuera el más brillante, el brillo dejaría de
      // significar fuerza y pasaría a significar dos cosas a la vez.
      style={{
        backgroundColor: `color-mix(in oklab, ${AMBAR} ${k.fondo}%, transparent)`,
        color: mine
          ? ORO_CHIP
          : `color-mix(in oklab, ${AMBAR} ${k.texto}%, #FFFFFF)`,
        "--tw-ring-color": `color-mix(in oklab, ${AMBAR} ${k.borde}%, transparent)`,
        // El halo solo aparece de verdad en la mitad de arriba de la escala: a
        // fuerza baja queda en nada, que es lo que se quiere. Sin él, la
        // diferencia entre ×2 y ×3 era solo un poco más de relleno.
        boxShadow: `0 0 ${k.haloRadio}px color-mix(in oklab, ${AMBAR} ${k.haloOpacidad}%, transparent)`,
      } as React.CSSProperties}
      title={tituloDe(boost)}
    >
      {/* Sin sigla es el empuje GLOBAL: la donación que no se pudo atribuir a
          ninguna universidad y termina cobrándola todo el mundo. */}
      {boost.university ? (
        <UniTag university={boost.university} />
      ) : (
        <span className="font-semibold uppercase tracking-wide">todos</span>
      )}
      {/* El multiplicador con el ícono de XP pegado, que es lo que dice QUÉ se
          multiplica. Sin él, un "×1,2" suelto al lado de un reloj se puede leer
          como cualquier cosa. Van juntos y sin separación entre ellos, para que
          se lean como una sola unidad y no como dos datos. */}
      <span className="inline-flex items-center gap-0.5 font-semibold">
        {fmtMultiplier(boost.multiplier)}
        <XpDots className="size-[0.85em]" />
      </span>
      {/* `ml-auto`: el reloj se va contra el borde derecho de su caja en vez de
          quedar pegado al multiplicador. Como la grilla le da a todos los chips
          el mismo ancho, los cuatro relojes quedan en una vertical y se pueden
          comparar de un vistazo. */}
      <span className={cn("ml-auto", mine && "opacity-80")}>
        {fmtRemaining(left)}
      </span>
    </span>
  )
}

/** Cartel de empujes vigentes, arriba de todo el ranking.
 *
 * Muestra los empujes de las OTRAS universidades a propósito: ver que otra está
 * en ×1,6 mientras la tuya está en nada es exactamente el motor de esta
 * mecánica. */
export function BoostBanner({
  boosts,
  myUniversity,
  className,
}: {
  boosts: EmpujeVigente[]
  myUniversity: string | null
  className?: string
}) {
  const shown = useEmpujesAMostrar({ boosts, myUniversity })

  if (shown.length === 0) return null
  return (
    // Dos por fila, apilándose hacia abajo. Con `flex-wrap` los chips medían
    // cada uno lo suyo y la segunda fila arrancaba corrida respecto de la
    // primera: una escalera. En una grilla de dos columnas todos miden igual, se
    // alinean en dos verticales y agregar universidades solo agrega renglones.
    <div className={cn("grid shrink-0 grid-cols-2 gap-1.5", className)}>
      {shown.map((b) => (
        <BoostChip
          // Los segundos van en la key a propósito: cuando llega una respuesta
          // nueva del servidor el chip se remonta y su cuenta regresiva vuelve a
          // arrancar del valor de verdad (ver useCountdown).
          key={`${b.university}:${b.expires_in_seconds}`}
          boost={b}
          mine={b.university === myUniversity}
        />
      ))}
    </div>
  )
}
