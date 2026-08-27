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
//   · Vuelve a centrar la fila propia sola: a los 10 s sin tocar la rueda, o
//     cuando el layout lo pide (al resolver un ejercicio).
//   · Muestra el XP en vuelo mientras el confeti se recolecta (`liveXp`), y
//     recién cuando termina llega el orden nuevo y sube con un FLIP de motion.

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { motion } from "motion/react"
import { ArrowUp, LayersIcon, UsersIcon } from "lucide-react"
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

const CLIMB_DELAY_MS = 650
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
  className?: string
}

export function GameRanking({
  climbFrom = null,
  enabled = true,
  liveXp = null,
  counting = false,
  attachXpTarget,
  centerKey = 0,
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
            label="Jugadores"
            value={
              <span className="inline-flex items-center gap-1.5">
                <CountUp value={summary.data?.players ?? 0} format={fmtCount} />
                <UsersIcon className="size-[0.85em] text-primary" />
              </span>
            }
          />
          <Metric
            label="Derivadas resueltas"
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
        <UniversityRanking scope={scope} enabled={enabled} />
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

  // Orden inicial de la animación: la fila propia colocada donde estaba antes.
  const staged = useMemo(() => {
    if (!climbing || meIndex < 0) return entries
    const rows = [...entries]
    const [mine] = rows.splice(meIndex, 1)
    // climbFrom es un rank absoluto: convertirlo a índice dentro de lo cargado,
    // saturando al fondo de lo visible.
    const targetIndex = Math.min(rows.length, meIndex + (climbFrom - (myRank as number)))
    rows.splice(targetIndex, 0, mine)
    return rows
  }, [entries, climbing, meIndex, climbFrom, myRank])

  // Identidad de la escalada en curso: cuando el timer la marca como asentada,
  // el orden real reemplaza al sintetizado y el FLIP hace el resto. Derivar
  // `settled` (en vez de setearlo sincrónico en un effect) evita el render en
  // cascada que marca el linter.
  const climbKey = climbing
    ? `${climbFrom}:${entries.map((e) => e.player_id).join(",")}`
    : null
  const [settledKey, setSettledKey] = useState<string | null>(null)
  const settled = !climbing || settledKey === climbKey
  useEffect(() => {
    if (!climbing || settledKey === climbKey) return
    const t = setTimeout(() => setSettledKey(climbKey), CLIMB_DELAY_MS)
    return () => clearTimeout(t)
  }, [climbing, climbKey, settledKey])

  // ── Scroll: centrado, anclaje al prepend y carga por baches ────────────────
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const centeredRef = useRef(false)
  const prevTopRankRef = useRef<number | null>(null)
  const prevHeightRef = useRef(0)

  const centerOnMe = useCallback((smooth: boolean) => {
    const el = scrollRef.current
    const mine = el?.querySelector<HTMLElement>("[data-current='true']")
    if (!el || !mine) return
    const top = mine.offsetTop - el.clientHeight / 2 + mine.offsetHeight / 2
    if (Math.abs(el.scrollTop - top) < 4) return
    el.scrollTo({ top, behavior: smooth ? "smooth" : "auto" })
  }, [])

  // Cambiar de scope reinicia la query: hay que volver a centrar.
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
      centerOnMe(false)
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

  // Recentrado a pedido del layout (al resolver) — con animación.
  const firstCenterKey = useRef(centerKey)
  useEffect(() => {
    if (centerKey === firstCenterKey.current) return
    centerOnMe(true)
  }, [centerKey, centerOnMe])

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
      timer = setTimeout(() => centerOnMe(true), IDLE_RECENTER_MS)
    }
    el.addEventListener("scroll", arm, { passive: true })
    arm()
    return () => {
      clearTimeout(timer)
      el.removeEventListener("scroll", arm)
    }
  }, [centerOnMe, entries.length])

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

  const ordered = settled ? entries : staged

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
            // Durante la escalada la fila propia muestra el puesto viejo.
            shownRank={
              entry.is_current_player && !settled && climbFrom !== null
                ? climbFrom
                : entry.rank
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
            climbed={entry.is_current_player && climbing && settled}
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
  climbed,
  attachXpTarget,
}: {
  entry: GameLeaderboardEntry
  shownRank: number
  xp: number
  climbed: boolean
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
        mine && "bg-primary/10 ring-primary/30",
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
      {entry.university && <UniTag university={entry.university} />}
      <span
        ref={attachXpTarget}
        className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold tabular-nums"
      >
        {fmtCount(xp)}
        <XpDots className="size-[0.85em] text-white" />
        {climbed && <ArrowUp size={14} className="text-green-400" />}
      </span>
    </motion.li>
  )
}

function UniversityRanking({ scope, enabled }: { scope: Scope; enabled: boolean }) {
  const { data, isLoading } = useGameUniversityLeaderboard(scope, enabled)

  if (isLoading) return <ListSkeleton />
  if (!data || data.rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Todavía no hay ranking de universidades.
      </p>
    )
  }

  return (
    <div className="no-scrollbar relative -mx-1 min-h-0 flex-1 overflow-y-auto px-1">
      <ol className="flex flex-col gap-2 py-1">
        {data.rows.map((row, index) => (
          <li
            key={row.university}
            className="flex items-center gap-2 rounded-lg px-4 py-3 ring-1 ring-foreground/10"
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
        ))}
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
