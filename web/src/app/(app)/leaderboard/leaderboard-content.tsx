"use client"

import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { CountUp } from "@/components/count-up"
import { XpDots } from "@/components/xp-dots"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"
import { LeaderboardSkeleton } from "@/components/tab-skeletons"
import { Metric, ScopeFilters, fmtCount } from "@/components/leaderboard-chrome"
import { cn } from "@/lib/utils"
import { badgeWithCrown, CAREER_EMOJI } from "@/lib/career-emoji"
import { BELT_UNIT_TEXT_COLORS } from "@/lib/catalog"
import { UniTag } from "@/components/university-tag"
import { LayersIcon, UsersIcon } from "lucide-react"
// El verde y el glifo de WhatsApp salen del minijuego: son la misma acción y
// tienen que verse igual en los dos lados. Se importan, no se copian.
import {
  VERDE,
  VERDE_TINTA_OSCURA,
  WhatsappGlyph,
  shareLink,
  shareUrl,
} from "@/app/derivadas/cafecito-cta"
import { useRecruits } from "./UseRecruits"
import { ALL, useLeaderboard } from "./UseLeaderboard"
import { useLeaderboardSummary } from "./UseLeaderboardSummary"
import { useUniversityLeaderboard } from "./UseUniversityLeaderboard"

// Color del nombre según el máximo cinturón real del usuario (mismo color que
// los títulos de unidad en practicar/repasar). Blanco para sin cinturón.
const BELT_TEXT: Record<string, string> = BELT_UNIT_TEXT_COLORS

// Tag por universidad (rivalidad): color de tinte único + la misma tipografía,
// peso y espaciado que usa cada una en el onboarding. Fuente única de verdad en
// @/lib/university-tags. El formato es el de los items del inicio: texto en
// color, borde "+99", fondo "+33".

type RankingView = "individual" | "university" | "recruits"

const fmt = fmtCount

export function LeaderboardContent() {
  const [view, setView] = useState<RankingView>("individual")
  const [career, setCareer] = useState<string>(ALL)
  const [uni, setUni] = useState<string>(ALL)

  const summary = useLeaderboardSummary({ university: uni, career })
  const universities = summary.data?.universities ?? []

  if (!summary.data) {
    return <LeaderboardSkeleton />
  }

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
              <CountUp value={summary.data.total_students} format={fmt} />
              <UsersIcon className="size-[0.85em] text-primary" />
            </span>
          }
        />
        <Metric
          label="Ejercicios completados"
          value={
            <span className="inline-flex items-center gap-1.5">
              <CountUp value={summary.data.total_exercises} format={fmt} />
              <LayersIcon className="size-[0.85em] text-primary" />
            </span>
          }
        />
      </div>

      {/* Fila 2: selector de ranking + filtros de carrera y universidad. */}
      <ScopeFilters
        view={view}
        withRecruits
        onViewChange={setView}
        career={career}
        onCareerChange={setCareer}
        university={uni}
        onUniversityChange={setUni}
        universities={universities}
        // Los reclutas son tuyos, no de una universidad ni de una carrera:
        // filtrarlos por scope no querría decir nada.
        scopeDisabled={view === "recruits"}
      />
      </div>

      {view === "recruits" ? (
        <RecruitsRanking />
      ) : view === "individual" ? (
        <IndividualRanking university={uni} career={career} />
      ) : (
        <UniversityRanking university={uni} career={career} />
      )}
    </div>
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
                style={{
                  color: BELT_TEXT[entry.belt] ?? BELT_TEXT.white,
                }}
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


/** Los reclutas propios: quiénes entraron por tu link y cuánto te generaron.
 *
 *  Los contadores de arriba cuentan a TODOS, la lista muestra solo a los que ya
 *  aportaron algo. Es la misma asimetría que el ranking del minijuego: "trajiste
 *  a 8" es la noticia aunque 3 no hayan arrancado, y una lista con renglones en
 *  cero se lee como un reproche. */
function RecruitsRanking() {
  const { data, isLoading } = useRecruits()
  const link = shareLink(data?.handle)

  if (isLoading) return <div className="py-10 text-center text-sm text-muted-foreground">Cargando…</div>

  const entries = data?.entries ?? []
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-2">
        <Metric label="Reclutas" value={fmt(data?.total_recruits ?? 0)} />
        <Metric label="Te aportaron" value={fmt(data?.total_xp_given ?? 0)} />
      </div>

      <p className="text-sm leading-relaxed text-muted-foreground">
        Quien entre por tu link te deja el{" "}
        <span className="font-medium text-foreground">
          {data?.share_percent ?? 10}%
        </span>{" "}
        de todo lo que sume, acá y en el minijuego. No se le descuenta nada: esa
        XP se acuña.
      </p>

      {/* Un <a> de verdad y no un window.open: wa.me es otro origen y tiene que
          salir al navegador, que adentro de la PWA instalada es la diferencia
          entre abrir WhatsApp y quedarse trabado en una ventana sin barra. */}
      <a
        href={shareUrl(data?.handle)}
        target="_blank"
        rel="noopener noreferrer"
        className="flex h-12 w-full items-center justify-center gap-2 rounded-md font-semibold"
        style={{ backgroundColor: VERDE, color: VERDE_TINTA_OSCURA }}
      >
        Reclutar
        <WhatsappGlyph size={18} />
      </a>
      <p className="text-center text-xs text-muted-foreground">{link}</p>

      {entries.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          Todavía no entró nadie por tu link.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {entries.map((e) => (
            <div
              key={e.rank}
              className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3 text-sm"
            >
              <span className="truncate">@{e.username}</span>
              <span className="flex items-center gap-2">
                {e.university ? (
                  <span className="text-xs text-muted-foreground">{e.university}</span>
                ) : null}
                <span className="font-semibold tabular-nums" style={{ color: VERDE }}>
                  {fmt(e.xp_given)}
                </span>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
