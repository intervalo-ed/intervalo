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
import { UniTag } from "@/components/university-tag"
import { XpDots } from "@/components/xp-dots"
import { badgeWithCrown, CAREER_EMOJI } from "@/lib/career-emoji"
import { BELT_ORDER, BELT_UNIT_TEXT_COLORS } from "@/lib/catalog"
import { cn } from "@/lib/utils"
import {
  useGameLeaderboard,
  useGameLeaderboardSummary,
  useGameUniversityLeaderboard,
  type GameLeaderboardEntry,
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

// El `py-1` de la lista, que no forma parte de ninguna fila.
const LIST_TOP_PADDING = 4

// Sin tocar la rueda por este tiempo, la lista vuelve sola a la fila propia:
// mirar el ranking ajeno está bien, perderse en él no.
const IDLE_RECENTER_MS = 10_000

// El juego no tiene cinturones: el color del nombre lo da el nivel que el Elo le
// reconoce al jugador (backend/game/elo.py :: level_of), o sea qué tan difícil
// resuelve — no cuánta XP juntó, que ya está en el número de al lado.
function levelColor(level: number): string {
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
  className,
}: GameRankingProps) {
  const [view, setView] = useState<"individual" | "university">("individual")
  const [career, setCareer] = useState(ALL_SCOPE)
  const [university, setUniversity] = useState(ALL_SCOPE)
  const scope: Scope = { university, career }

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
  // a alguien que otra página ya traía: sin deduplicar, React vería dos filas
  // con la misma key.
  const entries = useMemo(() => {
    const seen = new Set<number>()
    const out: GameLeaderboardEntry[] = []
    for (const entry of data?.pages.flatMap((p) => p.entries) ?? []) {
      if (seen.has(entry.player_id)) continue
      seen.add(entry.player_id)
      out.push(entry)
    }
    return out
  }, [data])

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

function Row({
  entry,
  shownRank,
  xp,
  delta,
  attachXpTarget,
}: {
  entry: GameLeaderboardEntry
  shownRank: number
  xp: number
  // Puestos que ganó (+) o perdió (−) en los últimos minutos. 0 = sin flecha.
  delta: number
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
      {entry.university && <UniTag university={entry.university} />}
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
            )}
          >
            <span className="w-4 shrink-0 text-center text-sm font-semibold tabular-nums text-muted-foreground">
              {index + 1}
            </span>
            <span className="flex min-w-0 flex-1 items-center">
              <UniTag university={row.university} />
            </span>
            <span className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold tabular-nums">
              <CountUp value={row.players} format={fmtCount} />
              <UsersIcon className="size-[0.9em] text-white" />
            </span>
            <span className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold tabular-nums">
              <CountUp value={row.xp} format={fmtCount} />
              <XpDots className="size-[0.85em] text-white" />
            </span>
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
