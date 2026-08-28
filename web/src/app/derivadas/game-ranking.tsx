"use client"

// El ranking del juego, con el mismo formato que el de Intervalo: dos números
// arriba, los tres selectores y las filas con badge de carrera, tag de
// universidad y XP.
//
// Es también el marcador del juego —el único contador de XP que queda— así que
// hace tres cosas más:
//
//   · Scroll infinito por baches hacia arriba y hacia abajo, anclando la
//     posición al cargar hacia arriba para que la lista no pegue saltos.
//   · Vuelve a acomodar la fila propia sola —a cuatro filas del techo, no en el
//     centro— a los 10 s sin tocar la rueda, o cuando el layout lo pide.
//   · Muestra el XP en vuelo mientras el confeti se recolecta (`liveXp`), y
//     recién cuando termina llega el orden nuevo y sube con un FLIP de motion.

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { motion } from "motion/react"
import { ArrowDown, ArrowUp, LayersIcon, UsersIcon } from "lucide-react"
import { CountUp } from "@/components/count-up"
import { ALL_SCOPE, Metric, ScopeFilters, fmtCount } from "@/components/leaderboard-chrome"
import { Spinner } from "@/components/ui/spinner"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { UniTag } from "@/components/university-tag"
import { XpDots } from "@/components/xp-dots"
import { badgeWithCrown, CAREER_EMOJI } from "@/lib/career-emoji"
import { BELT_HEX, BELT_ORDER, BELT_UNIT_TEXT_COLORS } from "@/lib/catalog"
import { cn } from "@/lib/utils"
import {
  useGameBoosts,
  useGameLeaderboard,
  useGameLeaderboardSummary,
  useGameUniversityLeaderboard,
  type GameBoost,
  type GameLeaderboardEntry,
  type GameUniversityRow,
  type Scope,
} from "./UseGameLeaderboard"

// Ritmo de la escalada: cada paso pasa a un jugador. El total está acotado para
// que una escalada larga no se eternice.
const CLIMB_TOTAL_MS = 1600
const CLIMB_STEP_MIN_MS = 80
const CLIMB_STEP_MAX_MS = 220

// Cuánto se acerca el scroll a la posición de descanso en cada paso de la
// escalada. Menos de 1 a propósito: el scroll acompaña con retraso, así se ve
// que la fila trepa por la pantalla en vez de quedarse clavada en su lugar.
const CLIMB_SCROLL_FOLLOW = 0.4

// Filas que quedan por encima de la propia cuando la lista descansa. No es el
// centro: se mira hacia arriba, a quién falta pasar, más que hacia abajo.
const ROWS_ABOVE = 4

// El ámbar del cafecito, el mismo que pinta las filas con empuje y la diapo de
// la pausa: en el juego, marrón = cafecito, en todos lados.
const AMBAR = BELT_HEX.brown.onDark
// Para el chip propio, aclarado hasta que se lee como oro sobre el fondo.
const ORO_CHIP = `color-mix(in oklab, ${AMBAR} 55%, #FFFFFF)`

// Cuántos empujes entran en el cartel. Cuatro y no tres: van de a DOS por fila,
// así que un número impar deja siempre un hueco al lado del último. Con dos
// filas llenas el cartel sigue siendo una cabecera; de ahí para arriba se
// convierte en una lista y le come el lugar a lo que la gente vino a mirar.
const BOOSTS_SHOWN = 4

// Espejo de backend/game/boosts.py :: MIN_PLAYERS_RANKED. Acá solo se usa para
// escribir cuántos jugadores le faltan a una universidad; quién entra al ranking lo
// decide el server y viaja en `row.ranked`.
const MIN_PLAYERS_RANKED = 10

// Espejo de backend/game/boosts.py. El empuje más flojo que existe es ×1,1 —un
// solo cafecito— y el techo es ×3, al que solo se llega entre varios. Esos dos
// números son los extremos de la escala de brillo del chip.
const BOOST_MIN_MULTIPLIER = 1.1
const BOOST_MAX_MULTIPLIER = 3.0

/** 0 para el empuje más flojo, 1 para el techo. Es lo que hace que un ×3 se vea
 *  de lejos y un ×1,1 apenas se insinúe: la fuerza del café se lee sin leer el
 *  número. */
function boostStrength(multiplier: number): number {
  const t = (multiplier - BOOST_MIN_MULTIPLIER) / (BOOST_MAX_MULTIPLIER - BOOST_MIN_MULTIPLIER)
  return Math.min(1, Math.max(0, t))
}

const fmtMultiplier = (m: number) => `×${m.toFixed(1).replace(".", ",")}`

// Minutos Y segundos, con el segundero siempre a la vista: "18:24".
//
// Antes decía "18 min" a secas, y un cartel que dice lo mismo durante sesenta
// segundos no parece un reloj sino una etiqueta. Con los segundos corriendo se
// lee lo que es —algo que se está por terminar— que es justo lo que hace mirar
// cuánto sale sumarle tiempo.
function fmtRemaining(seconds: number): string {
  const s = Math.max(0, seconds)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`
}

/** Cuenta regresiva de un empuje.
 *
 * Arranca de los segundos que mandó el servidor y descuenta sola, así el reloj
 * no necesita que le manden un instante con zona horaria.
 *
 * La resincronización NO se hace acá adentro: el chip se remonta con una `key`
 * que incluye los segundos del pulso, y al remontarse este `useState` se
 * reinicializa solo. Es el reset de estado por key de siempre, y evita el
 * `setLeft(initialSeconds)` sincrónico dentro del efecto, que el compilador de
 * React no permite (react-hooks/set-state-in-effect). */
function useCountdown(initialSeconds: number): number {
  const [left, setLeft] = useState(initialSeconds)
  useEffect(() => {
    if (initialSeconds <= 0) return
    const id = setInterval(() => setLeft((s) => (s <= 1 ? 0 : s - 1)), 1000)
    return () => clearInterval(id)
  }, [initialSeconds])
  return left
}

function BoostChip({ boost, mine }: { boost: GameBoost; mine: boolean }) {
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
      // cafecito tiene un color en este juego: pintar unos sí y otros no hacía
      // parecer que fueran dos cosas distintas.
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
      title={
        boost.donor_name
          ? `${boost.donor_name} invitó ${boost.cafecitos} cafecito(s)`
          : `${boost.cafecitos} cafecito(s)`
      }
    >
      {/* Sin sigla es el empuje GLOBAL: la donación que no se pudo atribuir a
          ninguna universidad y termina cobrándola todo el juego. */}
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
      <span className={cn("ml-auto", mine && "opacity-80")}>{fmtRemaining(left)}</span>
    </span>
  )
}

/** Siglas con empuje vigente. Se calcula una vez por lista y se pasa a las
 * filas: llamar al hook adentro de cada fila serían cientos de suscripciones
 * al mismo caché para leer el mismo dato. */
function useBoostMultipliers(): Map<string, number> {
  const boosts = useGameBoosts()
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
 * Va acá y no en cada layout para que la vista individual, la universitaria,
 * el escritorio y el teléfono lo hereden de una. Y muestra los empujes de las
 * OTRAS universidades a propósito: ver que otra está en ×1,6 mientras la tuya está
 * en nada es exactamente el motor de esta mecánica. */
function BoostBanner({ myUniversity }: { myUniversity: string | null }) {
  const boosts = useGameBoosts()
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
    <div className="grid shrink-0 grid-cols-2 gap-1.5">
      {shown.map((b) => (
        <BoostChip
          // Los segundos van en la key a propósito: cada latido del pulso
          // remonta el chip y su cuenta regresiva vuelve a arrancar del valor
          // del servidor (ver useCountdown).
          key={`${b.university}:${b.expires_in_seconds}`}
          boost={b}
          mine={b.university === myUniversity}
        />
      ))}
    </div>
  )
}

// El `py-1` de la lista, que no forma parte de ninguna fila.
const LIST_TOP_PADDING = 4

// Sin tocar la rueda por este tiempo, la lista vuelve sola a la fila propia:
// mirar el ranking ajeno está bien, perderse en él no.
const IDLE_RECENTER_MS = 10_000

// El juego no tiene cinturones: el color del nombre lo da el nivel que el Elo le
// reconoce al jugador (backend/game/elo.py :: level_of), o sea qué tan difícil
// resuelve — no cuánta XP juntó, que ya está en el número de al lado.
export function levelColor(level: number): string {
  const belt = BELT_ORDER[Math.min(level, BELT_ORDER.length - 1)]
  return BELT_UNIT_TEXT_COLORS[belt] ?? BELT_UNIT_TEXT_COLORS.white
}

// Dónde tiene que quedar el scroll para que la fila marcada como propia
// descanse a ROWS_ABOVE del techo. Lo usan las dos vistas —la individual con la
// fila del jugador, la universitaria con la de su universidad— así que la lista
// se comporta igual en las dos.
function restingScrollTopFor(el: HTMLElement | null): number | null {
  const mine = el?.querySelector<HTMLElement>("[data-current='true']")
  if (!el || !mine) return null
  const rows = Array.from(el.querySelectorAll<HTMLElement>("li"))
  const index = rows.indexOf(mine)
  if (index < 0) return null
  const anchor = rows[Math.max(0, index - ROWS_ABOVE)]
  return Math.max(0, anchor.offsetTop - LIST_TOP_PADDING)
}

// Resaltado de "esta fila sos vos": el mismo en las dos vistas.
const MINE_ROW_CLASS = "bg-primary/10 ring-primary/30"

export type GameRankingProps = {
  // Puesto anterior: si viene y es peor que el actual, se anima la escalada.
  climbFrom?: number | null
  enabled?: boolean
  // XP a mostrar en la fila propia mientras el confeti la va llenando.
  liveXp?: number | null
  // Mientras el conteo está en curso, `liveXp` manda sobre el dato del ranking.
  counting?: boolean
  // Nodo destino del imán del confeti (el número de XP de la fila propia).
  attachXpTarget?: (node: HTMLElement | null) => void
  // Cambiar este número vuelve a centrar la fila propia con animación.
  centerKey?: number
  // La carrera del jugador. Solo se usa para saber si un filtro puesto es EL
  // SUYO y por lo tanto no hay que soltarlo al acertar.
  myCareer?: string | null
  // Universidad del jugador: se resalta en la vista universitaria igual que su
  // fila en la individual.
  myUniversity?: string | null
  className?: string
}

export function GameRanking({
  climbFrom = null,
  enabled = true,
  liveXp = null,
  counting = false,
  attachXpTarget,
  centerKey = 0,
  myUniversity = null,
  myCareer = null,
  className,
}: GameRankingProps) {
  // ── El ranking vuelve solo a donde el XP puede caer ────────────────────────
  // Al acertar, la XP entra en la fila propia. Si en ese momento se estaba
  // mirando el ranking de universidades —o el individual filtrado por OTRA
  // carrera o universidad— esa fila no está en pantalla, y el festejo termina en
  // una lista donde el número que sube no es de nadie que se vea.
  //
  // Así que el ranking se acomoda solo: vuelve al individual, y suelta los
  // filtros SALVO los propios. Filtrar por la carrera o la universidad de uno no
  // es irse a mirar otra cosa: es la misma competencia recortada, la fila propia
  // sigue ahí y sigue recibiendo la XP. Sacar ese filtro sería sacar a la persona
  // del ranking en el que estaba compitiendo.
  //
  // `centerKey` es la señal, y no una prop nueva: la bumpea el layout justo al
  // acertar, para que el ranking devuelva la fila propia a su lugar antes de que
  // llegue el imán. Es exactamente el mismo momento.
  //
  // Derivado de la clave en vez de un setState en un efecto —que el compilador de
  // React no permite— igual que el paso de la escalada.
  const [elegido, setElegido] = useState<{
    key: number
    view: "individual" | "university"
    career: string
    university: string
  }>({ key: centerKey, view: "individual", career: ALL_SCOPE, university: ALL_SCOPE })

  const acaboDeAcertar = elegido.key !== centerKey
  const propio = (valor: string, mio: string | null) =>
    mio !== null && valor === mio ? valor : ALL_SCOPE

  const view = acaboDeAcertar ? "individual" : elegido.view
  const career = acaboDeAcertar ? propio(elegido.career, myCareer) : elegido.career
  const university = acaboDeAcertar
    ? propio(elegido.university, myUniversity)
    : elegido.university
  const scope: Scope = { university, career }

  // Los setters guardan SIEMPRE la clave del momento: así lo que se elija después
  // de un acierto queda, en vez de volver a reiniciarse en el siguiente render.
  const setView = (v: "individual" | "university") =>
    setElegido({ key: centerKey, view: v, career, university })
  const setCareer = (v: string) =>
    setElegido({ key: centerKey, view, career: v, university })
  const setUniversity = (v: string) =>
    setElegido({ key: centerKey, view, career, university: v })

  const summary = useGameLeaderboardSummary(scope, enabled)

  // Sin alto propio: lo acota quien lo usa (una columna flex en escritorio, la
  // slide en el teléfono). Con `h-full` acá, una cadena de padres sin `min-h-0`
  // lo dejaba crecer más que la pantalla y las últimas filas quedaban cortadas.
  return (
    <div className={cn("flex min-h-0 flex-col gap-3", className)}>
      <div className="flex shrink-0 flex-col gap-2">
        <div className="grid grid-cols-2 gap-2">
          <Metric
            label="Estudiantes"
            value={
              <span className="inline-flex items-center gap-1.5">
                <CountUp value={summary.data?.players ?? 0} format={fmtCount} />
                <UsersIcon className="size-[0.85em] text-primary" />
              </span>
            }
          />
          <Metric
            label="Derivadas"
            value={
              <span className="inline-flex items-center gap-1.5">
                <CountUp value={summary.data?.exercises ?? 0} format={fmtCount} />
                <LayersIcon className="size-[0.85em] text-primary" />
              </span>
            }
          />
        </div>
        <ScopeFilters
          view={view}
          onViewChange={setView}
          career={career}
          onCareerChange={setCareer}
          university={university}
          onUniversityChange={setUniversity}
          universities={summary.data?.universities ?? []}
        />
        <BoostBanner myUniversity={myUniversity} />
      </div>

      {view === "individual" ? (
        <IndividualRanking
          scope={scope}
          enabled={enabled}
          climbFrom={climbFrom}
          liveXp={liveXp}
          counting={counting}
          attachXpTarget={attachXpTarget}
          centerKey={centerKey}
        />
      ) : (
        <UniversityRanking scope={scope} enabled={enabled} myUniversity={myUniversity} />
      )}
    </div>
  )
}

function IndividualRanking({
  scope,
  enabled,
  climbFrom,
  liveXp,
  counting,
  attachXpTarget,
  centerKey,
}: {
  scope: Scope
  enabled: boolean
  climbFrom: number | null
  liveXp: number | null
  counting: boolean
  attachXpTarget?: (node: HTMLElement | null) => void
  centerKey: number
}) {
  const boostByUni = useBoostMultipliers()
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    fetchPreviousPage,
    hasPreviousPage,
    isFetchingPreviousPage,
  } = useGameLeaderboard(scope, enabled)

  // Al refrescar tras sumar XP, la ventana `around_me` se corre y puede repetir
// Cada cuánto se aplica UN reordenamiento. El pulso trae los datos cada 10 s, así
// que hay lugar de sobra para desarmar una tanda en varios pasos sin que se
// solape con la siguiente.
const SWAP_MS = 420

// Más que esto no es una historia, es un revuelo: cuando la tanda trae demasiados
// cruces, se aplica de una. Verlos de a uno tardaría más que el próximo pulso y
// además nadie sigue catorce movimientos seguidos.
const MAX_SWAPS = 14

/** La secuencia de intercambios ENTRE VECINOS que lleva de un orden al otro.
 *
 * Es un bubble sort contra la posición de destino: cada paso devuelve el índice
 * `i` donde hay que cruzar `i` con `i+1`. Se eligió así y no "sacar y meter"
 * porque un cruce entre vecinos es exactamente lo que se lee como "este pasó a
 * aquel" — que es lo que el ranking tiene para contar. */
function swapsToReach(current: readonly number[], target: readonly number[]): number[] {
  const pos = new Map(target.map((id, i) => [id, i]))
  const arr = [...current]
  const out: number[] = []
  for (let end = arr.length - 1; end > 0; end--) {
    let moved = false
    for (let i = 0; i < end; i++) {
      if ((pos.get(arr[i]) ?? 0) > (pos.get(arr[i + 1]) ?? 0)) {
        const t = arr[i]
        arr[i] = arr[i + 1]
        arr[i + 1] = t
        out.push(i)
        moved = true
      }
    }
    if (!moved) break
  }
  return out
}

/** Muestra la lista aplicando UN reordenamiento por vez.
 *
 * Los datos llegan todos juntos con cada pulso —la XP de cada fila se actualiza
 * al toque— pero el ORDEN se acomoda de a un cruce, con una pausa entre uno y
 * otro. Sin esto, una tanda con cinco cambios mueve cinco filas a la vez y no se
 * entiende quién pasó a quién; de a uno, cada movimiento se lee.
 *
 * Solo se escalona el orden. Si cambia el CONJUNTO de jugadores (entró o salió
 * alguien de la ventana, o se cambió de filtro) no hay cruces que contar y se
 * aplica de una: un alta no es un sobrepaso. */
function useStagedOrder(entries: GameLeaderboardEntry[]): GameLeaderboardEntry[] {
  const [orderIds, setOrderIds] = useState<number[]>([])
  const targetRef = useRef<number[]>([])
  const orderRef = useRef<number[]>([])
  const queueRef = useRef<number[]>([])

  const byId = useMemo(
    () => new Map(entries.map((e) => [e.player_id, e])),
    [entries],
  )

  // El orden efectivo: hasta que el intervalo lo llene, el que viene del
  // servidor. Derivado y no un setState en efecto —que el compilador rechaza— y
  // de paso evita que la lista parpadee vacía en el primer render.
  const shownIds = orderIds.length > 0 ? orderIds : entries.map((e) => e.player_id)

  useEffect(() => {
    targetRef.current = entries.map((e) => e.player_id)
    orderRef.current = shownIds
  })

  useEffect(() => {
    const id = setInterval(() => {
      const target = targetRef.current
      const actual = orderRef.current
      if (target.length === 0) return

      // ¿Cambió el conjunto? Entonces no hay cruces: se aplica entero.
      const mismoConjunto =
        target.length === actual.length && target.every((x) => actual.includes(x))
      if (!mismoConjunto) {
        queueRef.current = []
        setOrderIds(target)
        return
      }

      if (queueRef.current.length === 0) {
        const pasos = swapsToReach(actual, target)
        if (pasos.length === 0) return
        if (pasos.length > MAX_SWAPS) {
          setOrderIds(target)
          return
        }
        queueRef.current = pasos
      }

      const i = queueRef.current.shift() as number
      setOrderIds((prev) => {
        const base = prev.length > 0 ? prev : actual
        if (i + 1 >= base.length) return base
        const next = [...base]
        const t = next[i]
        next[i] = next[i + 1]
        next[i + 1] = t
        return next
      })
    }, SWAP_MS)
    return () => clearInterval(id)
  }, [])

  // Los datos son SIEMPRE los últimos; lo único escalonado es el orden.
  return useMemo(
    () => shownIds.map((id) => byId.get(id)).filter((e): e is GameLeaderboardEntry => !!e),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [shownIds.join(","), byId],
  )
}

  // a alguien que otra página ya traía: sin deduplicar, React vería dos filas
  // con la misma key.
  const rawEntries = useMemo(() => {
    const seen = new Set<number>()
    const out: GameLeaderboardEntry[] = []
    for (const entry of data?.pages.flatMap((p) => p.entries) ?? []) {
      if (seen.has(entry.player_id)) continue
      seen.add(entry.player_id)
      out.push(entry)
    }
    return out
  }, [data])

  // El orden llega de a un cruce por vez; los datos, todos juntos.
  const entries = useStagedOrder(rawEntries)

  const meIndex = entries.findIndex((e) => e.is_current_player)
  const myRank = meIndex >= 0 ? entries[meIndex].rank : null
  const climbing = climbFrom !== null && myRank !== null && climbFrom > myRank

  // ── Escalada puesto por puesto ─────────────────────────────────────────────
  // No es un salto del puesto viejo al nuevo: la fila propia va pasando a uno
  // por vez, y en cada paso las dos tarjetas permutan con el FLIP de motion. Es
  // lo que hace que se vea a quién superaste, en vez de aparecer más arriba.
  const distance = climbing ? climbFrom - (myRank as number) : 0

  // Identidad de la escalada en curso. Derivar el paso de esta clave (en vez de
  // resetearlo con un setState sincrónico en un efecto) evita el render en
  // cascada que marca el linter.
  const climbKey = climbing
    ? `${climbFrom}:${entries.map((e) => e.player_id).join(",")}`
    : null
  const [climbState, setClimbState] = useState<{ key: string | null; step: number }>({
    key: null,
    step: 0,
  })
  const step = climbState.key === climbKey ? climbState.step : 0
  const remaining = Math.max(0, distance - step)
  const settled = !climbing || remaining === 0

  // Duración de cada paso, con el total acotado: una escalada de tres puestos se
  // saborea, una de treinta no puede durar diez segundos.
  const stepMs =
    distance > 0
      ? Math.max(CLIMB_STEP_MIN_MS, Math.min(CLIMB_STEP_MAX_MS, Math.round(CLIMB_TOTAL_MS / distance)))
      : 0

  useEffect(() => {
    if (!climbing || remaining === 0) return
    const t = setTimeout(() => setClimbState({ key: climbKey, step: step + 1 }), stepMs)
    return () => clearTimeout(t)
  }, [climbing, climbKey, remaining, step, stepMs])

  // ── Scroll: centrado, anclaje al prepend y carga por baches ────────────────
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const centeredRef = useRef(false)
  const prevTopRankRef = useRef<number | null>(null)
  const prevHeightRef = useRef(0)

  // Posición de descanso de la fila propia: a ROWS_ABOVE filas del techo, no en
  // el centro exacto. Se ancla contando filas y no con aritmética de píxeles
  // para que no dependa del alto de la caja: la fila propia queda siempre la
  // quinta, entren ocho filas o quince.
  const restingScrollTop = useCallback(() => restingScrollTopFor(scrollRef.current), [])

  const snapToMe = useCallback(
    (smooth: boolean) => {
      const el = scrollRef.current
      const top = restingScrollTop()
      if (!el || top === null) return
      if (Math.abs(el.scrollTop - top) < 4) return
      el.scrollTo({ top, behavior: smooth ? "smooth" : "auto" })
    },
    [restingScrollTop],
  )

  // Cambiar de scope reinicia la query: hay que volver a acomodar la lista.
  useEffect(() => {
    centeredRef.current = false
    prevTopRankRef.current = null
    prevHeightRef.current = 0
  }, [scope.university, scope.career])

  useLayoutEffect(() => {
    const el = scrollRef.current
    if (!el || entries.length === 0) return
    const firstRank = entries[0]?.rank ?? null
    if (!centeredRef.current) {
      snapToMe(false)
      centeredRef.current = true
    } else if (
      prevTopRankRef.current !== null &&
      firstRank !== null &&
      firstRank < prevTopRankRef.current
    ) {
      // Llegó un bache por arriba: la lista creció hacia atrás, así que hay que
      // compensar el scroll o el contenido salta bajo el cursor.
      el.scrollTop += el.scrollHeight - prevHeightRef.current
    }
    prevTopRankRef.current = firstRank
    prevHeightRef.current = el.scrollHeight
  })

  // El scroll acompaña la escalada, con retraso. Se acerca solo una fracción del
  // camino en cada paso, así se ve que la fila trepa por la pantalla en vez de
  // quedar clavada en el centro mientras el resto desfila. Lo único que no se
  // negocia es que la tarjeta propia nunca se salga de la vista: por eso el
  // resultado se acota a la franja donde sigue entera en pantalla.
  useLayoutEffect(() => {
    if (!climbing) return
    const el = scrollRef.current
    const mine = el?.querySelector<HTMLElement>("[data-current='true']")
    if (!el || !mine) return
    const resting = restingScrollTop()
    if (resting === null) return
    const margin = mine.offsetHeight
    const lowest = mine.offsetTop + mine.offsetHeight + margin - el.clientHeight
    const highest = mine.offsetTop - margin
    const followed = el.scrollTop + (resting - el.scrollTop) * CLIMB_SCROLL_FOLLOW
    el.scrollTop = Math.max(Math.min(followed, highest), lowest)
  }, [step, climbing, restingScrollTop])

  // Al terminar de escalar, el retraso acumulado se salda: la fila vuelve a su
  // posición de descanso con un scroll suave.
  useEffect(() => {
    if (!climbing || !settled) return
    snapToMe(true)
  }, [climbing, settled, climbKey, snapToMe])

  // Cambiar de puesto siempre reacomoda, escales vos o te pasen los demás:
  // mientras resolvés el ranking sigue moviéndose, y sin esto la fila propia se
  // iría yendo de la vista sola.
  useEffect(() => {
    if (myRank === null || !settled) return
    snapToMe(true)
  }, [myRank, settled, snapToMe])

  // Recentrado a pedido del layout (al resolver) — con animación.
  const firstCenterKey = useRef(centerKey)
  useEffect(() => {
    if (centerKey === firstCenterKey.current) return
    snapToMe(true)
  }, [centerKey, snapToMe])

  // Recentrado por inactividad: el timer se reinicia con cada rueda.
  // `entries.length` en las dependencias no es decorativo: en el primer render
  // la lista todavía es el esqueleto y `scrollRef` está vacío, así que sin un
  // dato que cambie al llegar las filas el efecto no volvería a correr y el
  // listener no se ataría nunca.
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    let timer: ReturnType<typeof setTimeout>
    const arm = () => {
      clearTimeout(timer)
      timer = setTimeout(() => snapToMe(true), IDLE_RECENTER_MS)
    }
    el.addEventListener("scroll", arm, { passive: true })
    arm()
    return () => {
      clearTimeout(timer)
      el.removeEventListener("scroll", arm)
    }
  }, [snapToMe, entries.length])

  const topSentinelRef = useRef<HTMLDivElement | null>(null)
  const bottomSentinelRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    const root = scrollRef.current
    if (!root) return
    const observers: IntersectionObserver[] = []
    const watch = (node: HTMLElement | null, enabledPage: boolean, load: () => void) => {
      if (!node || !enabledPage) return
      const io = new IntersectionObserver(
        (e) => {
          if (e[0].isIntersecting) load()
        },
        { root, rootMargin: "300px" },
      )
      io.observe(node)
      observers.push(io)
    }
    watch(topSentinelRef.current, hasPreviousPage && !isFetchingPreviousPage, () =>
      fetchPreviousPage(),
    )
    watch(bottomSentinelRef.current, hasNextPage && !isFetchingNextPage, () => fetchNextPage())
    return () => observers.forEach((o) => o.disconnect())
  }, [
    hasPreviousPage,
    hasNextPage,
    isFetchingPreviousPage,
    isFetchingNextPage,
    fetchPreviousPage,
    fetchNextPage,
    entries.length,
  ])

  if (isLoading) return <ListSkeleton />
  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground">Todavía no hay ranking.</p>
  }

  // Orden de este paso: la fila propia todavía a `remaining` puestos de su lugar.
  const ordered =
    remaining === 0 || meIndex < 0
      ? entries
      : (() => {
          const rows = [...entries]
          const [mine] = rows.splice(meIndex, 1)
          rows.splice(Math.min(rows.length, meIndex + remaining), 0, mine)
          return rows
        })()

  return (
    // `relative` no es decorativo: hace que el scroller sea el `offsetParent` de
    // las filas. Sin él, `offsetTop` se mide contra el ancestro posicionado de
    // más arriba y arrastra el alto de los indicadores y los filtros, así que el
    // centrado se pasaba de largo y la fila propia quedaba pegada al techo.
    // La lista llena la card. Tuvo un tope de 516 px —diez filas exactas, para
    // que al llegar al final no asomara media por el techo— pero ese número no
    // se lleva con una card que mide lo que mide la ventana: en cuanto la
    // pantalla daba para más, sobraban ochenta y pico de píxeles muertos abajo,
    // y como la vista de universidades nunca tuvo tope, el hueco aparecía y
    // desaparecía al cambiar de vista. Una fila cortada arriba dice "hay más
    // gente encima", que es cierto; un hueco al pie no dice nada.
    <div
      ref={scrollRef}
      className="no-scrollbar relative -mx-1 min-h-0 flex-1 overflow-y-auto px-1"
    >
      {hasPreviousPage && <div ref={topSentinelRef} aria-hidden className="h-px" />}
      {isFetchingPreviousPage && (
        <div className="flex justify-center py-2">
          <Spinner />
        </div>
      )}
      <ol className="flex flex-col gap-2 py-1">
        {ordered.map((entry) => (
          <Row
            key={entry.player_id}
            entry={entry}
            // Durante la escalada el puesto propio va bajando de a uno, igual
            // que la fila.
            shownRank={
              entry.is_current_player ? entry.rank + remaining : entry.rank
            }
            // Mientras cae el confeti manda el conteo (aunque la lista ya
            // tenga el total); una vez que terminó, el mayor de los dos, para
            // que el número no retroceda si el ranking viene atrasado.
            xp={
              entry.is_current_player && liveXp !== null
                ? counting
                  ? liveXp
                  : Math.max(liveXp, entry.xp)
                : entry.xp
            }
            // También la fila propia: si mientras resolvías te pasaron, la
            // flecha tiene que bajar o darse vuelta como la de cualquiera.
            delta={entry.rank_delta}
            boostMultiplier={
              entry.university ? boostByUni.get(entry.university) ?? null : null
            }
            attachXpTarget={entry.is_current_player ? attachXpTarget : undefined}
          />
        ))}
      </ol>
      {isFetchingNextPage && (
        <div className="flex justify-center py-2">
          <Spinner />
        </div>
      )}
      {hasNextPage && <div ref={bottomSentinelRef} aria-hidden className="h-px" />}
    </div>
  )
}

// La fila de alguien cuya universidad tiene un empuje corriendo. Era un ☕ al
// lado de la sigla —un ícono más en un renglón que ya tiene cinco cosas— y ahí
// no lo miraba nadie. Ahora se pinta la fila ENTERA: un ámbar de café con luz
// arriba, borde dorado y un resplandor tibio alrededor.
//
// El objetivo es la envidia, no la información. Un ícono dice "esta persona
// tiene un empuje"; una fila que brilla entre diez apagadas dice "esta persona
// está subiendo más rápido que vos", que es lo que hace que alguien mire cuánto
// sale un cafecito. Por eso el color va en el fondo y no en el texto: se ve
// desde el rabillo del ojo, sin leer.
//
// Todo en un solo `style` y no en clases porque los valores derivan del mismo
// marrón de marca (BELT_HEX.brown), como el resto de lo que toca el cafecito en
// el juego.

/** La misma fila, con la intensidad atada a la fuerza del empuje de su
 *  universidad: la de alguien de una universidad en ×3 se ve más encendida que
 *  la de alguien en ×1,1.
 *
 *  El recorrido es CORTO a propósito: el relleno se mueve 5 puntos de punta a
 *  punta (7→12%) contra los 12 del chip. Son veinte filas a la vez y no cuatro
 *  chips, así que lo que allá es una escala legible acá sería una pared. Y los
 *  valores se mueven ALREDEDOR de los que ya estaban afinados a ojo —9% de
 *  relleno, 68% de borde—, no desde cero. */
function filaConEmpuje(multiplier: number): React.CSSProperties {
  const f = boostStrength(multiplier)
  return {
    backgroundColor: `color-mix(in oklab, ${AMBAR} ${7 + 5 * f}%, transparent)`,
    "--tw-ring-color": `color-mix(in oklab, ${AMBAR} ${60 + 18 * f}%, transparent)`,
  } as React.CSSProperties
}

function Row({
  entry,
  shownRank,
  xp,
  delta,
  boostMultiplier,
  attachXpTarget,
}: {
  entry: GameLeaderboardEntry
  shownRank: number
  xp: number
  // Puestos que ganó (+) o perdió (−) en los últimos minutos. 0 = sin flecha.
  delta: number
  // Su universidad tiene un empuje de cafecitos corriendo. Se marca en la fila
  // para que quede claro por qué esta persona está sumando más rápido: el
  // multiplicador se ve, no se esconde.
  // Multiplicador de su universidad, o null si no tiene empuje corriendo.
  boostMultiplier: number | null
  attachXpTarget?: (node: HTMLElement | null) => void
}) {
  const mine = entry.is_current_player
  const emoji = badgeWithCrown({
    username: entry.alias,
    resolved: entry.career ? CAREER_EMOJI[entry.career] : undefined,
    career: entry.career,
  })
  return (
    <motion.li
      layout
      transition={{ type: "spring", stiffness: 320, damping: 32 }}
      data-current={mine ? "true" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-lg px-4 py-3 ring-1 ring-foreground/10",
        mine && MINE_ROW_CLASS,
      )}
      style={boostMultiplier === null ? undefined : filaConEmpuje(boostMultiplier)}
    >
      <span className="w-4 shrink-0 text-center text-sm font-semibold tabular-nums text-muted-foreground">
        {shownRank}
      </span>
      <span className="flex min-w-0 flex-1 items-center gap-1.5">
        <span
          className="truncate text-sm font-medium"
          style={{ color: levelColor(entry.level) }}
        >
          {entry.alias}
        </span>
        {emoji && <span className="shrink-0 text-sm leading-none">{emoji}</span>}
      </span>
      {delta !== 0 && (
        <span
          className={cn(
            "inline-flex shrink-0 items-center gap-0.5 text-xs font-medium tabular-nums",
            delta > 0 ? "text-green-400" : "text-orange-400",
          )}
          aria-label={`${delta > 0 ? "subió" : "bajó"} ${Math.abs(delta)} puestos`}
        >
          {delta > 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
          {Math.abs(delta)}
        </span>
      )}
      {entry.university && (
        <span className="inline-flex shrink-0 items-center gap-1">
          <UniTag university={entry.university} />
        </span>
      )}
      <span
        ref={attachXpTarget}
        className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold tabular-nums"
      >
        {fmtCount(xp)}
        <XpDots className="size-[0.85em] text-white" />
      </span>
    </motion.li>
  )
}

// Cuánto espera el cartel antes de cerrarse al salir con el mouse. El contenido
// se dibuja en un PORTAL, o sea que no es hijo del disparador: sin esta demora,
// ir del número al cartel dispara el `mouseleave` del primero antes del
// `mouseenter` del segundo y el cartel parpadea en el camino.
const CIERRE_MS = 120

/** El Elo de una universidad, con la explicación de qué mide.
 *
 * Abre con el mouse encima Y con click, las dos cosas. El click no se puede
 * perder: en el teléfono —donde más se mira el ranking— no hay hover, y era la
 * única forma de leer esto. Pero pedir un click en escritorio para una aclaración
 * de dos renglones es pedir de más.
 *
 * Sigue siendo un Popover y no un tooltip por lo mismo de siempre: el tooltip
 * abre solo con hover. */
function EloDeUniversidad({ row }: { row: GameUniversityRow }) {
  const [abierto, setAbierto] = useState(false)
  const cierreRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abrir = () => {
    if (cierreRef.current) clearTimeout(cierreRef.current)
    setAbierto(true)
  }
  const cerrar = () => {
    if (cierreRef.current) clearTimeout(cierreRef.current)
    cierreRef.current = setTimeout(() => setAbierto(false), CIERRE_MS)
  }
  useEffect(() => () => {
    if (cierreRef.current) clearTimeout(cierreRef.current)
  }, [])

  return (
    <Popover open={abierto} onOpenChange={setAbierto}>
      <PopoverTrigger
        onMouseEnter={abrir}
        onMouseLeave={cerrar}
        className="inline-flex shrink-0 items-baseline gap-1 rounded text-sm font-semibold tabular-nums outline-none transition-opacity hover:opacity-80"
        aria-label={`Qué mide el Elo de ${row.university}`}
      >
        {row.ranked ? (
          <CountUp value={row.rating_avg} format={fmtCount} />
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
        {/* Versalita con `tracking`: en mayúscula y a 0,7em las letras se
            amontonan, y "ELO" pegado se lee como una sola mancha. */}
        <span className="text-[0.7em] font-normal tracking-wider text-muted-foreground">
          ELO
        </span>
      </PopoverTrigger>
      <PopoverContent
        onMouseEnter={abrir}
        onMouseLeave={cerrar}
        className="text-left text-xs leading-relaxed"
      >
              {row.ranked ? (
                <>
                  <p>
                    <span className="font-semibold text-foreground">
                      {fmtCount(row.rating_avg)} de Elo
                    </span>{" "}
                    es el promedio de los{" "}
                    <span className="font-semibold text-foreground">
                      {row.rated_players} estudiantes
                    </span>{" "}
                    de {row.university} que ya jugaron lo suficiente.
                  </p>
                  <p className="mt-2 text-muted-foreground">
                    El Elo mide qué tan difíciles son las derivadas que
                    resolvés, no cuánto jugaste: se ajusta con tus respuestas,
                    sube con los aciertos y baja con los errores.
                  </p>
                </>
              ) : (
                <>
                  <p>
                    {row.university} todavía no entra al promedio: hacen falta{" "}
                    <span className="font-semibold text-foreground">
                      {MIN_PLAYERS_RANKED} estudiantes
                    </span>{" "}
                    que hayan jugado lo suficiente y por ahora son{" "}
                    <span className="font-semibold text-foreground">
                      {row.rated_players}
                    </span>
                    .
                  </p>
                  <p className="mt-2 text-muted-foreground">
                    Con menos, un solo jugador con suerte manda la universidad al
                    tope y la tabla mide suerte en vez de nivel.
                  </p>
                </>
              )}
      </PopoverContent>
    </Popover>
  )
}

function UniversityRanking({
  scope,
  enabled,
  myUniversity,
}: {
  scope: Scope
  enabled: boolean
  myUniversity: string | null
}) {
  const { data, isLoading } = useGameUniversityLeaderboard(scope, enabled)
  const boostByUni = useBoostMultipliers()
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const placedRef = useRef(false)

  // La universidad propia se acomoda igual que la fila propia de la vista
  // individual: a cuatro filas del techo. Sin esto, entrar a "Universitario"
  // dejaba la tuya fuera de pantalla y había que buscarla scrolleando.
  useEffect(() => {
    placedRef.current = false
  }, [scope.university, scope.career, myUniversity])

  useLayoutEffect(() => {
    if (placedRef.current || !data || data.rows.length === 0) return
    const top = restingScrollTopFor(scrollRef.current)
    if (top === null) return
    scrollRef.current?.scrollTo({ top, behavior: "auto" })
    placedRef.current = true
  })

  if (isLoading) return <ListSkeleton />
  if (!data || data.rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Todavía no hay ranking de universidades.
      </p>
    )
  }

  return (
    <div
      ref={scrollRef}
      className="no-scrollbar relative -mx-1 min-h-0 flex-1 overflow-y-auto px-1"
    >
      <ol className="flex flex-col gap-2 py-1">
        {data.rows.map((row, index) => {
          const mine = myUniversity !== null && row.university === myUniversity
          return (
          <li
            key={row.university}
            data-current={mine ? "true" : undefined}
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 py-3 ring-1 ring-foreground/10",
              mine && MINE_ROW_CLASS,
              !row.ranked && "opacity-55",
            )}
            // Misma pintura que en la vista individual: la universidad con
            // empuje se ve, no se marca con un ícono.
            style={
              boostByUni.has(row.university)
                ? filaConEmpuje(boostByUni.get(row.university) as number)
                : undefined
            }
          >
            <span className="w-4 shrink-0 text-center text-sm font-semibold tabular-nums text-muted-foreground">
              {row.ranked ? index + 1 : "—"}
            </span>
            <span className="flex min-w-0 flex-1 items-center gap-1">
              <UniTag university={row.university} />

            </span>
            <span className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold tabular-nums">
              <CountUp value={row.players} format={fmtCount} />
              <UsersIcon className="size-[0.9em] text-white" />
            </span>
            {/* Elo promedio, que es por lo que ordena la tabla: mostrar un
                número distinto del que ordena se lee como un bug. Va con el
                rótulo "Elo" porque un 1240 pelado no dice qué mide, y sin los
                puntitos de XP justamente para que no se confunda con ella. */}
            <EloDeUniversidad row={row} />
          </li>
          )
        })}
      </ol>
    </div>
  )
}

function ListSkeleton() {
  const widths = ["w-24", "w-32", "w-28", "w-36", "w-24", "w-32"]
  return (
    <div className="no-scrollbar min-h-0 flex-1 overflow-hidden">
      <div className="flex animate-pulse flex-col gap-2 py-1">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-lg px-4 py-3 ring-1 ring-foreground/10"
          >
            <span className="inline-block h-3.5 w-3 shrink-0 rounded bg-white/10" />
            <span className={cn("inline-block h-3.5 flex-1 rounded bg-white/10", widths[i % widths.length])} />
            <span className="inline-block h-3.5 w-10 shrink-0 rounded bg-white/10" />
          </div>
        ))}
      </div>
    </div>
  )
}
