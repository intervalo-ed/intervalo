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
import { FlagTriangleRightIcon, TrendingUpIcon } from "lucide-react"
import { ALL, useLeaderboard } from "./UseLeaderboard"

// Tag por universidad (rivalidad): color de tinte único + la misma tipografía,
// peso y espaciado que usa cada una en el onboarding (UNI_FONT). El formato es
// el de los items del inicio: texto en color, borde "+99", fondo "+33".
// Monocromático como los items del inicio (texto en color, borde "+99",
// fondo "+33"). Colores un poco brillantes + la tipografía de cada uni.
type UniTagStyle = { color: string; font: React.CSSProperties }
const UNI_TAG: Record<string, UniTagStyle> = {
  UBA: {
    color: "#4F76E0", // azul UBA (royal, término medio con el navy)
    font: { fontFamily: "var(--font-uba)", fontWeight: 500, letterSpacing: "0.06em" },
  },
  UTN: {
    color: "#EC4869", // rojo UTN (crimson/frambuesa, brillante)
    font: { fontFamily: "var(--font-utn)", fontWeight: 600, letterSpacing: "0.1em" },
  },
  UNSAM: {
    color: "#4D90F2", // celeste azulado (más azul, menos turquesa)
    font: { fontFamily: "var(--font-unsam)", fontWeight: 500, letterSpacing: "0.02em" },
  },
}

export function LeaderboardContent() {
  const [uni, setUni] = useState<string>(ALL)
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
  } = useLeaderboard({ university: uni })

  const scrollRef = useRef<HTMLDivElement | null>(null)
  const topSentinelRef = useRef<HTMLDivElement | null>(null)
  const bottomSentinelRef = useRef<HTMLDivElement | null>(null)
  // Centrado inicial (una vez por scope) + anclaje del scroll al anteponer filas.
  const didCenterRef = useRef(false)
  const prevTopRankRef = useRef<number | null>(null)
  const prevHeightRef = useRef(0)

  // Filas cargadas (todas las páginas, en orden). El rank ya viene del backend,
  // calculado sobre el set completo del scope.
  const rows = data?.pages.flatMap((p) => p.entries) ?? []

  // Al cambiar de universidad se reinicia la query: hay que volver a centrar.
  useEffect(() => {
    didCenterRef.current = false
    prevTopRankRef.current = null
    prevHeightRef.current = 0
  }, [uni])

  // Centrado inicial en el usuario y, al cargar filas hacia arriba, anclaje del
  // viewport (scroll anchoring) para que la lista no salte.
  useLayoutEffect(() => {
    const el = scrollRef.current
    if (!el || rows.length === 0) return
    const firstRank = rows[0]?.rank ?? null
    if (!didCenterRef.current) {
      const meEl = el.querySelector<HTMLElement>("[data-current='true']")
      if (meEl) {
        // Para los primeros del ranking el resultado da negativo y para los
        // últimos se pasa del máximo: el navegador acota scrollTop a su rango,
        // así arrancan pegados arriba/abajo (la vista de antes del cambio).
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

  // Scroll infinito bidireccional: centinelas arriba/abajo dentro del contenedor
  // de la lista. Al entrar en viewport piden la página previa/siguiente.
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
    return <LeaderboardSkeleton />
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

  // Universidades presentes (las da el backend), en el orden preferido de UNI_TAG.
  const universities = Object.keys(UNI_TAG).filter((u) =>
    first.universities.includes(u),
  )

  // "Posición actual", "XP para subir" y totales: del scope completo (backend).
  const myRank = first.me.rank ?? undefined
  const xpToNext = first.me.xp_to_next ?? undefined
  const totalXp = first.total_xp
  const totalExercises = first.total_exercises

  return (
    <div className="flex h-full min-h-0 flex-col gap-2.5">
      <div className="grid shrink-0 grid-cols-2 gap-2">
        <Metric
          label="Ejercicios hechos"
          value={
            <span className="inline-flex items-center gap-1.5">
              <CountUp
                value={totalExercises}
                format={(n) => n.toLocaleString("es")}
              />
              <TrendingUpIcon className="size-[0.85em] text-primary" />
            </span>
          }
        />
        <Metric
          label="XP acumulado"
          value={
            <span className="inline-flex items-center gap-1.5">
              <CountUp
                value={totalXp}
                format={(n) => n.toLocaleString("es")}
              />
              <XpDots className="size-[0.85em] text-primary" />
            </span>
          }
        />
      </div>

      <div className="grid shrink-0 grid-cols-3 gap-2">
        <Metric
          label={"Posición\nactual"}
          value={
            myRank ? (
              <CountUp value={myRank} format={(n) => `#${n.toLocaleString("es")}`} />
            ) : (
              "-"
            )
          }
        />
        <Metric
          label={"XP para\nsubir"}
          value={
            xpToNext == null ? (
              "-"
            ) : (
              <span className="inline-flex items-center gap-1.5">
                <CountUp value={xpToNext} format={(n) => n.toLocaleString("es")} />
                <FlagTriangleRightIcon className="size-[0.72em] text-[#EC4869]" />
              </span>
            )
          }
        />
        <div className="flex flex-col gap-1 rounded-md border border-white/10 bg-white/5 p-3">
          <Select value={uni} onValueChange={(v) => v && setUni(v)}>
            <SelectTrigger
              aria-label="Filtrar por universidad"
              className="h-auto! w-full justify-start gap-1.5 border-0 bg-transparent p-0 text-lg font-semibold leading-none tabular-nums text-foreground shadow-none focus-visible:ring-0 dark:bg-transparent dark:hover:bg-transparent"
            >
              <SelectValue className="flex-none!">
                {(value: string) => (value === ALL ? "-" : value)}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>-</SelectItem>
              {universities.map((u) => (
                <SelectItem key={u} value={u}>
                  {u}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="whitespace-pre-line text-[0.7rem] leading-tight text-foreground/60">
            Universidad
          </span>
        </div>
      </div>

      {/* La lista es su propio contenedor scrolleable: carga con el usuario
          centrado y agrega filas al llegar arriba o abajo (scroll infinito). */}
      <div
        ref={scrollRef}
        className="relative -mx-1 min-h-0 flex-1 overflow-y-auto px-1"
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
                <span className="truncate text-sm font-medium">
                  {entry.username ?? entry.name}
                </span>
                {(() => {
                  // El emoji vestido (entry.emoji) reemplaza al de bucket; si no
                  // eligió ninguno, cae al emoji del bucket de carrera. La corona
                  // pisa el icono por defecto para el usuario coronado.
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
                <CountUp
                  value={entry.total_xp}
                  format={(n) => n.toLocaleString("es")}
                />
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
    <div className="flex flex-col gap-1 rounded-md border border-white/10 bg-white/5 p-3">
      <span className="text-lg font-semibold leading-none tabular-nums">
        {value}
      </span>
      <span className="whitespace-pre-line text-[0.7rem] leading-tight text-foreground/60">
        {label}
      </span>
    </div>
  )
}

function LeaderboardSkeleton() {
  const nameW = ["w-24", "w-32", "w-28", "w-36", "w-24", "w-32"]
  return (
    <div className="flex animate-pulse flex-col gap-2.5">
      {/* 2 indicadores arriba */}
      <div className="grid grid-cols-2 gap-2">
        {[0, 1].map((i) => (
          <div
            key={i}
            className="flex flex-col gap-1 rounded-md border border-white/10 bg-white/5 p-3"
          >
            <div className="h-[18px] w-16 rounded bg-white/10" />
            <div className="h-3.5 w-3/4 rounded bg-white/10" />
          </div>
        ))}
      </div>

      {/* 3 indicadores abajo (posición, XP para subir, filtro) */}
      <div className="grid grid-cols-3 gap-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="flex flex-col gap-1 rounded-md border border-white/10 bg-white/5 p-3"
          >
            <div className="h-[18px] w-12 rounded bg-white/10" />
            <div className="h-3.5 w-3/4 rounded bg-white/10" />
          </div>
        ))}
      </div>

      {/* Lista: misma estructura/clases que el <li> real para que el alto de cada
          fila quede idéntico (el alto lo fija la línea del tag + py-3). */}
      <div className="flex flex-col gap-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-lg px-4 py-3 ring-1 ring-foreground/10"
          >
            {/* rank */}
            <span className="w-4 shrink-0 text-center text-sm">
              <span className="inline-block h-3.5 w-3 rounded bg-white/10 align-middle" />
            </span>
            {/* nombre */}
            <span className="flex min-w-0 flex-1 items-center text-sm">
              <span
                className={cn(
                  "inline-block h-3.5 rounded bg-white/10 align-middle",
                  nameW[i % nameW.length],
                )}
              />
            </span>
            {/* tag de universidad: réplica exacta de UniTag (fija el alto) */}
            <span className="inline-flex shrink-0 items-center justify-center rounded-md border border-transparent bg-white/10 px-1 py-1 text-center text-[0.55rem] leading-none">
              <span className="invisible">UNSAM</span>
            </span>
            {/* xp */}
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
  const cfg = UNI_TAG[university]
  if (!cfg) {
    return (
      <span className="inline-flex shrink-0 items-center justify-center rounded bg-white/10 px-1 py-1 text-center text-[0.55rem] leading-none text-foreground/70">
        {university}
      </span>
    )
  }
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-md border px-1 py-1 text-center text-[0.55rem] leading-none"
      style={{
        color: cfg.color,
        borderColor: `${cfg.color}99`,
        backgroundColor: `${cfg.color}33`,
        ...cfg.font,
      }}
    >
      {university}
    </span>
  )
}
