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

import { useEffect, useMemo, useState } from "react"
import { XpDots } from "@/components/xp-dots"
import { UniTag } from "@/components/university-tag"
import { cn } from "@/lib/utils"
import { fmtMultiplier } from "@/app/derivadas/cafecito-cta"
import { AMBAR, boostStrength } from "@/app/derivadas/game-colors"

/** Un empuje vigente, ya agregado por universidad. `university` nulo = global.
 *
 *  Estructural y no un `components["schemas"][...]`: los dos productos mandan
 *  este mismo objeto por dos endpoints distintos (GameBoostOut y BoostTramo),
 *  que son la misma proyección de `game.boosts.BoostView`. Atarlo a uno de los
 *  dos nombres haría que el otro tenga que convertir para nada. */
export type EmpujeVigente = {
  university?: string | null
  multiplier: number
  cafecitos: number
  donor_name?: string | null
  expires_in_seconds: number
  /** Parte del multiplicador la puso el aforo del día y no una donación
   *  (backend game/aforo.py). `cafecitos` cuenta SOLO los donados, así que un
   *  empuje de aforo puro llega con cafecitos=0 y esta bandera en true. */
  aforo?: boolean
}

/** Qué dice el globito del chip. Son tres casos y no dos, desde que el empuje
 *  puede venir del aforo del día: solo donaciones, solo aforo, o las dos
 *  sumadas. Decir "0 cafecito(s)" en el caso del medio sería peor que no decir
 *  nada, porque el multiplicador está ahí a la vista. */
function tituloDe(boost: EmpujeVigente): string {
  const invitados = boost.cafecitos > 0
    ? boost.donor_name
      ? `${boost.donor_name} invitó ${boost.cafecitos} cafecito(s)`
      : `${boost.cafecitos} cafecito(s)`
    : null
  // Sin el número: el umbral vive en el backend (aforo.UMBRAL_PERSONAS) y
  // espejarlo acá es la misma trampa en la que ya cayeron las constantes del
  // cafecito. El feed sí lo dice, porque lo escribe el server con el conteo real.
  const porAforo = boost.aforo ? "las personas que entraron hoy" : null
  return [invitados, porAforo].filter(Boolean).join(" + ") || "Empuje vigente"
}

// Para el chip propio, aclarado hasta que se lee como oro sobre el fondo.
const ORO_CHIP = `color-mix(in oklab, ${AMBAR} 55%, #FFFFFF)`

// Cuántos empujes entran en el cartel. Cuatro y no tres: van de a DOS por fila,
// así que un número impar deja siempre un hueco al lado del último. Con dos
// filas llenas el cartel sigue siendo una cabecera; de ahí para arriba se
// convierte en una lista y le come el lugar a lo que la gente vino a mirar.
const BOOSTS_SHOWN = 4

// Un solo formato, siempre HH:MM:SS ("23:40:12", "00:18:24").
//
// Antes eran dos regímenes: "23h 40m" arriba de la hora y "18:24" abajo. Se
// unificó porque el cambio de formato a mitad de la cuenta es lo que hace dudar
// del número — el cartel pasaba de una etiqueta a un reloj sin avisar, y el
// mismo empuje se leía de dos maneras según cuándo lo mirabas. Con un solo
// formato el ancho tampoco salta, así que los cuatro chips quedan alineados en
// una vertical de punta a punta de la cuenta.
//
// Y el segundero corre siempre. La objeción vieja era que "un segundero cuando
// faltan veinte horas promete una urgencia que no existe": es cierto que no hay
// urgencia, pero un reloj que no se mueve no se lee como calma sino como algo
// que se colgó.
export function fmtRemaining(seconds: number): string {
  const s = Math.max(0, seconds)
  const dosDigitos = (n: number) => String(n).padStart(2, "0")
  return [
    dosDigitos(Math.floor(s / 3600)),
    dosDigitos(Math.floor((s % 3600) / 60)),
    dosDigitos(s % 60),
  ].join(":")
}

/** Lo que queda, en palabras: `{ texto: "23 horas", enHoras: true }`.
 *
 * Vive al lado de `fmtRemaining` porque las dos tienen que decir lo MISMO. El
 * copy del cafecito y el de Practicar tenían cada uno su versión, las dos con
 * `Math.round`: con hora y media restante decían "2 horas" mientras el chip del
 * ranking, en la misma pantalla del producto, decía "1h 30m". Redondear para
 * arriba promete tiempo que no hay, así que las tres truncan.
 *
 * Devuelve las piezas y no la frase armada porque el artículo cambia con la
 * unidad ("las próximas 23 horas" contra "los próximos 40 minutos"), y eso lo
 * resuelve mejor cada copy que un parámetro más acá. */
export function restanteEnPalabras(seconds: number): {
  texto: string
  enHoras: boolean
} {
  const s = Math.max(0, seconds)
  if (s >= 3600) {
    const h = Math.max(1, Math.floor(s / 3600))
    return { texto: `${h} ${h === 1 ? "hora" : "horas"}`, enHoras: true }
  }
  const m = Math.max(1, Math.floor(s / 60))
  return { texto: `${m} ${m === 1 ? "minuto" : "minutos"}`, enHoras: false }
}

/** Cuenta regresiva de un empuje.
 *
 * Arranca de los segundos que mandó el servidor y descuenta sola, así el reloj
 * no necesita que le manden un instante con zona horaria.
 *
 * Descuenta contra un VENCIMIENTO absoluto, no restándole el paso a un
 * contador. Los dos motivos son la misma cosa —lo que se muestra tiene que ser
 * el tiempo que falta de verdad— vista desde dos lados:
 *
 *  · Un tick por segundo, siempre. Hubo un paso de 30 s arriba de la hora,
 *    cuando el formato de ese tramo no mostraba segundos; ahora los muestra
 *    (ver `fmtRemaining`), así que un paso más largo dejaría el segundero
 *    saltando de a treinta y el reloj se leería roto.
 *  · El navegador estrangula los timers de las pestañas de fondo. Restando el
 *    paso, cada tick que no corre es tiempo que el cartel nunca descuenta;
 *    leyendo el reloj en cada tick, volver a la pestaña muestra el número
 *    correcto sin importar cuántos se perdieron.
 *
 * La resincronización contra el servidor NO se hace acá adentro: el chip se
 * remonta con una `key` que incluye los segundos que mandó, y al remontarse
 * estos `useState` se reinicializan solos. Es el reset de estado por key de
 * siempre, y evita el `setLeft(...)` sincrónico dentro del efecto que el
 * compilador de React no permite (react-hooks/set-state-in-effect). */
export function useCountdown(initialSeconds: number): number {
  const [vence] = useState(() => Date.now() + Math.max(0, initialSeconds) * 1000)
  const [left, setLeft] = useState(() => Math.max(0, initialSeconds))

  useEffect(() => {
    if (left <= 0) return
    // `setTimeout` y no `setInterval`: el efecto se re-arma en cada tick, así
    // que el próximo se agenda recién cuando el anterior terminó y dos ticks no
    // se pueden encimar si el navegador se atrasa.
    const id = setTimeout(
      () => setLeft(Math.max(0, Math.round((vence - Date.now()) / 1000))),
      1_000,
    )
    return () => clearTimeout(id)
  }, [left, vence])

  return left
}

export function BoostChip({
  boost,
  mine,
}: {
  boost: EmpujeVigente
  mine: boolean
}) {
  const left = useCountdown(boost.expires_in_seconds)
  if (left <= 0) return null
  const fuerza = boostStrength(boost.multiplier)
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
        backgroundColor: `color-mix(in oklab, ${AMBAR} ${10 + 12 * fuerza}%, transparent)`,
        color: mine
          ? ORO_CHIP
          : `color-mix(in oklab, ${AMBAR} ${68 + 22 * fuerza}%, #FFFFFF)`,
        "--tw-ring-color": `color-mix(in oklab, ${AMBAR} ${45 + 35 * fuerza}%, transparent)`,
        // El halo solo aparece de verdad en la mitad de arriba de la escala: a
        // fuerza baja queda en nada, que es lo que se quiere. Sin él, la
        // diferencia entre ×2 y ×3 era solo un poco más de relleno.
        boxShadow: `0 0 ${6 + 10 * fuerza}px color-mix(in oklab, ${AMBAR} ${13 * fuerza}%, transparent)`,
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

/** Siglas con empuje vigente y su multiplicador, para pintar las filas.
 *
 * Se calcula una vez por lista y se pasa a las filas: recorrer esta lista
 * adentro de cada fila sería hacer el mismo trabajo veinte veces para leer el
 * mismo dato. */
export function useBoostMultipliers(
  boosts: EmpujeVigente[],
): Map<string, number> {
  // El empuje global no entra: acá se marcan las filas de las universidades
  // impulsadas, y si le tocara a TODAS la marca dejaría de distinguir nada —
  // sería una pared encendida en vez de una comparación. El chip de "TODOS" ya
  // lo cuenta por su lado.
  return useMemo(() => {
    const m = new Map<string, number>()
    for (const b of boosts) if (b.university) m.set(b.university, b.multiplier)
    return m
  }, [boosts])
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
  const shown = useMemo(() => {
    if (boosts.length === 0) return []
    // La propia primero aunque tenga el multiplicador más bajo: es la que la
    // persona necesita ver, y la que decide si le conviene donar.
    const ordered = [...boosts].sort((a, b) => {
      const am = a.university === myUniversity ? 1 : 0
      const bm = b.university === myUniversity ? 1 : 0
      return bm - am || b.multiplier - a.multiplier
    })
    return ordered.slice(0, BOOSTS_SHOWN)
  }, [boosts, myUniversity])

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
