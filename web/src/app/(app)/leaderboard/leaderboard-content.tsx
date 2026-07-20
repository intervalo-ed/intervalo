"use client"

import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { CountUp } from "@/components/count-up"
import { XpDots } from "@/components/xp-dots"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { badgeWithCrown, CAREER_EMOJI } from "@/lib/career-emoji"
import { BELT_HEX } from "@/lib/catalog"
import { UNIVERSITY_TAG_BY_KEY } from "@/lib/university-tags"
import { ChevronDownIcon, LayersIcon, UsersIcon } from "lucide-react"
import { ALL, useLeaderboard } from "./UseLeaderboard"
import { useLeaderboardSummary } from "./UseLeaderboardSummary"
import { useUniversityLeaderboard } from "./UseUniversityLeaderboard"

// Color del nombre según el máximo cinturón del usuario (mismo color que los
// títulos de unidad en el inicio: variante onDark). Blanco para sin cinturón.
const BELT_TEXT: Record<string, string> = {
  white: BELT_HEX.white.onDark,
  blue: BELT_HEX.blue.onDark,
  violet: BELT_HEX.violet.onDark,
  brown: BELT_HEX.brown.onDark,
}

// Carreras en orden fijo + catch-all "Otra". Nombre completo, sin abreviar y
// sin emoji, tanto en el valor colapsado del filtro como en el desplegable.
const CAREER_META: { key: string; name: string }[] = [
  { key: "S", name: "Ciencia" },
  { key: "T", name: "Tecnología" },
  { key: "E", name: "Ingeniería" },
  { key: "M", name: "Matemáticas" },
  { key: "Otra", name: "Otra" },
]
const CAREER_NAME: Record<string, string> = Object.fromEntries(
  CAREER_META.map((c) => [c.key, c.name]),
)

// Tag por universidad (rivalidad): color de tinte único + la misma tipografía,
// peso y espaciado que usa cada una en el onboarding. Fuente única de verdad en
// @/lib/university-tags. El formato es el de los items del inicio: texto en
// color, borde "+99", fondo "+33".

type RankingView = "individual" | "university"

const fmt = (n: number) => n.toLocaleString("es")

export function LeaderboardContent() {
  const [view, setView] = useState<RankingView>("individual")
  const [career, setCareer] = useState<string>(ALL)
  const [uni, setUni] = useState<string>(ALL)

  const summary = useLeaderboardSummary({ university: uni, career })
  const universities = summary.data?.universities ?? []

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      {/* Cabecera: mismo agrupado/espaciado que el switcher + métricas de
          Repasar/Practicar (gap-2 entre filas, gap-4 hasta la lista). */}
      <div className="flex shrink-0 flex-col gap-2">
      {/* Fila 1: dos números generales (globales, no dependen de los filtros). */}
      <div className="grid grid-cols-2 gap-2">
        <Metric
          label="Estudiantes registrados"
          value={
            <span className="inline-flex items-center gap-1.5">
              {summary.data ? (
                <CountUp value={summary.data.total_students} format={fmt} />
              ) : (
                "…"
              )}
              <UsersIcon className="size-[0.85em] text-primary" />
            </span>
          }
        />
        <Metric
          label="Ejercicios completados"
          value={
            <span className="inline-flex items-center gap-1.5">
              {summary.data ? (
                <CountUp value={summary.data.total_exercises} format={fmt} />
              ) : (
                "…"
              )}
              <LayersIcon className="size-[0.85em] text-primary" />
            </span>
          }
        />
      </div>

      {/* Fila 2: selector de ranking + filtros de carrera y universidad. */}
      <div className="grid grid-cols-3 gap-2">
        <FilterBox
          label="Ranking"
          value={view}
          onChange={(v) => setView(v as RankingView)}
          display={(v) => (v === "individual" ? "Individual" : "Universitario")}
        >
          <SelectItem value="individual">Individual</SelectItem>
          <SelectItem value="university">Universitario</SelectItem>
        </FilterBox>

        <FilterBox
          label="Carrera"
          value={career}
          onChange={setCareer}
          display={(v) => (v === ALL ? "Todas" : (CAREER_NAME[v] ?? v))}
        >
          <SelectItem value={ALL}>Todas</SelectItem>
          {CAREER_META.map((c) => (
            <SelectItem key={c.key} value={c.key}>
              {c.name}
            </SelectItem>
          ))}
        </FilterBox>

        <FilterBox
          label="Universidad"
          value={uni}
          onChange={setUni}
          display={(v) => (v === ALL ? "Todas" : v)}
        >
          <SelectItem value={ALL}>Todas</SelectItem>
          {universities.map((u) => (
            <SelectItem key={u} value={u}>
              {u}
            </SelectItem>
          ))}
        </FilterBox>
      </div>
      </div>

      {view === "individual" ? (
        <IndividualRanking university={uni} career={career} />
      ) : (
        <UniversityRanking university={uni} career={career} />
      )}
    </div>
  )
}

function FilterBox({
  label,
  value,
  onChange,
  display,
  children,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  display: (v: string) => React.ReactNode
  children: React.ReactNode
}) {
  return (
    <Select value={value} onValueChange={(v) => v && onChange(v)}>
      <SelectTrigger
        aria-label={label}
        className="flex h-auto! w-full flex-col items-stretch justify-center gap-1 rounded-md border border-white/10 bg-white/5 px-3 py-[10px] text-foreground shadow-none [&>svg]:hidden"
      >
        <SelectValue className="truncate text-left text-[0.75rem] font-semibold leading-none tabular-nums">
          {display}
        </SelectValue>
        <span className="flex items-center justify-between gap-1 text-[0.65rem] leading-tight text-foreground/60">
          <span className="truncate whitespace-nowrap">{label}</span>
          <ChevronDownIcon className="size-3 shrink-0" />
        </span>
      </SelectTrigger>
      <SelectContent>{children}</SelectContent>
    </Select>
  )
}

function IndividualRanking({
  university,
  career,
}: {
  university: string
  career: string
}) {
  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    fetchPreviousPage,
    hasPreviousPage,
    isFetchingPreviousPage,
  } = useLeaderboard({ university, career })

  const scrollRef = useRef<HTMLDivElement | null>(null)
  const topSentinelRef = useRef<HTMLDivElement | null>(null)
  const bottomSentinelRef = useRef<HTMLDivElement | null>(null)
  const didCenterRef = useRef(false)
  const prevTopRankRef = useRef<number | null>(null)
  const prevHeightRef = useRef(0)

  const rows = data?.pages.flatMap((p) => p.entries) ?? []

  // Al cambiar de scope (universidad o carrera) se reinicia la query: recentrar.
  useEffect(() => {
    didCenterRef.current = false
    prevTopRankRef.current = null
    prevHeightRef.current = 0
  }, [university, career])

  useLayoutEffect(() => {
    const el = scrollRef.current
    if (!el || rows.length === 0) return
    const firstRank = rows[0]?.rank ?? null
    if (!didCenterRef.current) {
      const meEl = el.querySelector<HTMLElement>("[data-current='true']")
      if (meEl) {
        el.scrollTop =
          meEl.offsetTop - el.clientHeight / 2 + meEl.offsetHeight / 2
      }
      didCenterRef.current = true
    } else if (
      prevTopRankRef.current !== null &&
      firstRank !== null &&
      firstRank < prevTopRankRef.current
    ) {
      el.scrollTop += el.scrollHeight - prevHeightRef.current
    }
    prevTopRankRef.current = firstRank
    prevHeightRef.current = el.scrollHeight
  })

  useEffect(() => {
    const root = scrollRef.current
    if (!root) return
    const observers: IntersectionObserver[] = []
    if (topSentinelRef.current && hasPreviousPage) {
      const io = new IntersectionObserver(
        (e) => {
          if (e[0].isIntersecting && !isFetchingPreviousPage)
            void fetchPreviousPage()
        },
        { root, rootMargin: "300px" },
      )
      io.observe(topSentinelRef.current)
      observers.push(io)
    }
    if (bottomSentinelRef.current && hasNextPage) {
      const io = new IntersectionObserver(
        (e) => {
          if (e[0].isIntersecting && !isFetchingNextPage) void fetchNextPage()
        },
        { root, rootMargin: "300px" },
      )
      io.observe(bottomSentinelRef.current)
      observers.push(io)
    }
    return () => observers.forEach((o) => o.disconnect())
  }, [
    hasPreviousPage,
    hasNextPage,
    isFetchingPreviousPage,
    isFetchingNextPage,
    fetchPreviousPage,
    fetchNextPage,
    rows.length,
  ])

  if (isLoading) {
    return <ListSkeleton />
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          No pudimos cargar el ranking: {error.message}
        </AlertDescription>
      </Alert>
    )
  }

  const first = data?.pages[0]
  if (!first || first.total_count === 0) {
    return (
      <p className="text-sm text-muted-foreground">Todavía no hay ranking.</p>
    )
  }

  return (
    <div
      ref={scrollRef}
      className="no-scrollbar relative -mx-1 min-h-0 flex-1 overflow-y-auto px-1"
    >
      {hasPreviousPage && (
        <div ref={topSentinelRef} aria-hidden className="h-px" />
      )}
      {isFetchingPreviousPage && (
        <div className="flex justify-center py-2">
          <Spinner />
        </div>
      )}

      <ol className="flex flex-col gap-2 py-1">
        {rows.map((entry) => (
          <li
            key={entry.user_id}
            data-current={entry.is_current_user ? "true" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-4 py-3 ring-1 ring-foreground/10",
              entry.is_current_user && "bg-primary/10 ring-primary/30",
            )}
          >
            <span className="w-4 shrink-0 text-center text-sm font-semibold tabular-nums text-muted-foreground">
              {entry.rank}
            </span>
            <span className="flex min-w-0 flex-1 items-center gap-1.5">
              <span
                className="truncate text-sm font-medium"
                style={{ color: BELT_TEXT[entry.belt] }}
              >
                {entry.username ?? entry.name}
              </span>
              {(() => {
                const resolved =
                  entry.emoji ?? (entry.career ? CAREER_EMOJI[entry.career] : undefined)
                const emoji = badgeWithCrown({
                  username: entry.username,
                  resolved,
                  career: entry.career,
                })
                return (
                  emoji && (
                    <span className="shrink-0 text-sm leading-none">{emoji}</span>
                  )
                )
              })()}
            </span>
            {entry.university && <UniTag university={entry.university} />}
            <span className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold tabular-nums">
              <CountUp value={entry.total_xp} format={fmt} />
              <XpDots className="size-[0.85em] text-white" />
            </span>
          </li>
        ))}
      </ol>

      {isFetchingNextPage && (
        <div className="flex justify-center py-2">
          <Spinner />
        </div>
      )}
      {hasNextPage && (
        <div ref={bottomSentinelRef} aria-hidden className="h-px" />
      )}
    </div>
  )
}

function UniversityRanking({
  university,
  career,
}: {
  university: string
  career: string
}) {
  const { data, isLoading, isError, error } = useUniversityLeaderboard({
    university,
    career,
  })

  if (isLoading) {
    return <ListSkeleton />
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          No pudimos cargar el ranking: {error.message}
        </AlertDescription>
      </Alert>
    )
  }

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
              <CountUp value={row.students} format={fmt} />
              <UsersIcon className="size-[0.9em] text-white" />
            </span>
            <span className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold tabular-nums">
              <CountUp value={row.total_xp} format={fmt} />
              <XpDots className="size-[0.85em] text-white" />
            </span>
          </li>
        ))}
      </ol>
    </div>
  )
}

function Metric({
  label,
  value,
}: {
  label: React.ReactNode
  value: React.ReactNode
}) {
  return (
    <div className="flex flex-col justify-center gap-1 rounded-md border border-white/10 bg-white/5 px-3 py-[14px]">
      <span className="text-lg font-semibold leading-none tabular-nums">
        {value}
      </span>
      <span className="whitespace-nowrap text-[0.7rem] leading-tight text-foreground/60">
        {label}
      </span>
    </div>
  )
}

function ListSkeleton() {
  const nameW = ["w-24", "w-32", "w-28", "w-36", "w-24", "w-32"]
  return (
    <div className="no-scrollbar min-h-0 flex-1 overflow-hidden">
      <div className="flex animate-pulse flex-col gap-2 py-1">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-lg px-4 py-3 ring-1 ring-foreground/10"
          >
            <span className="w-4 shrink-0 text-center text-sm">
              <span className="inline-block h-3.5 w-3 rounded bg-white/10 align-middle" />
            </span>
            <span className="flex min-w-0 flex-1 items-center text-sm">
              <span
                className={cn(
                  "inline-block h-3.5 rounded bg-white/10 align-middle",
                  nameW[i % nameW.length],
                )}
              />
            </span>
            <span className="inline-flex shrink-0 items-center justify-center rounded-md border border-transparent bg-white/10 px-1 py-1 text-center text-[0.55rem] leading-none">
              <span className="invisible">UNSAM</span>
            </span>
            <span className="shrink-0 text-sm">
              <span className="inline-block h-3.5 w-10 rounded bg-white/10 align-middle" />
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function UniTag({ university }: { university: string }) {
  const cfg = UNIVERSITY_TAG_BY_KEY[university]
  if (!cfg) {
    return (
      <span className="inline-flex shrink-0 items-center justify-center rounded bg-white/10 px-1 py-1 text-center text-[0.55rem] leading-none text-foreground/70">
        {university}
      </span>
    )
  }
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-md border px-1 py-1 text-center leading-none"
      style={{
        color: cfg.color,
        borderColor: `${cfg.color}99`,
        backgroundColor: `${cfg.color}33`,
        fontSize: cfg.tagFontSize,
        transform: cfg.tagDy ? `translateY(${cfg.tagDy}px)` : undefined,
        ...cfg.font,
      }}
    >
      {university}
    </span>
  )
}
