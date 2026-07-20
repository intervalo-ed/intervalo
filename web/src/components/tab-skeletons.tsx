import { Skeleton } from "@/components/ui/skeleton"

// Skeletons de página completa para las 4 tabs (Repasar/Practicar/Ranking/
// Perfil), fieles al tamaño real de cada contenedor para que no se perciba
// movimiento al pasar del fallback de ruteo (loading.tsx) al skeleton propio
// de la pantalla ya montada — son literalmente el mismo componente en los dos
// lugares.

// Mismas medidas que CourseSwitcher (`h-9`, botones `icon-sm` = `size-7`).
export function CourseSwitcherSkeleton() {
  return (
    <div className="flex h-9 shrink-0 items-center justify-between gap-2 rounded-md border border-white/10 bg-white/[0.03] px-1">
      <Skeleton className="size-7 rounded-none" />
      <Skeleton className="h-4 w-20" />
      <Skeleton className="size-7 rounded-none" />
    </div>
  )
}

// Misma forma que Metric (metric-card.tsx): p-3, valor text-lg + label de 2
// líneas.
export function MetricCardSkeleton() {
  return (
    <div className="flex flex-col gap-1 rounded-md border border-white/10 bg-white/5 p-3">
      <Skeleton className="h-[18px] w-12" />
      <div className="flex flex-col gap-2">
        <Skeleton className="h-2.5 w-full" />
        <Skeleton className="h-2.5 w-2/3" />
      </div>
    </div>
  )
}

export function DashboardSkeleton() {
  // Filas por contenedor, como los primeros cinturones reales (Funciones=7, Límites=6).
  const beltRows = [7, 6]
  return (
    <div className="flex flex-col gap-4">
      <CourseSwitcherSkeleton />

      <div className="grid grid-cols-3 gap-2">
        {[0, 1, 2].map((i) => (
          <MetricCardSkeleton key={i} />
        ))}
      </div>

      {/* botón Repasar */}
      <Skeleton className="h-12 w-full" />

      {/* contenedores de unidad (p-4, gap-3; header título + ícono info) */}
      {beltRows.map((nRows, b) => (
        <div
          key={b}
          className="flex flex-col gap-3 rounded-md border border-white/10 p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <Skeleton className="h-[18px] w-32" />
            <Skeleton className="size-7" />
          </div>
          <div className="flex flex-col gap-2.5">
            {Array.from({ length: nRows }).map((_, r) => (
              <div key={r} className="flex items-center justify-between gap-3">
                <Skeleton className="h-3.5 w-24" />
                <div className="flex gap-1">
                  {[0, 1, 2].map((p) => (
                    <Skeleton key={p} className="h-6 w-9 rounded-md" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export function PracticeSkeleton() {
  const unitRows = [1, 1, 1, 1, 1]
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <CourseSwitcherSkeleton />
        <div className="grid grid-cols-3 gap-2">
          {[0, 1, 2].map((i) => (
            <MetricCardSkeleton key={i} />
          ))}
        </div>
      </div>

      {/* botón Practicar */}
      <Skeleton className="h-12 w-full shrink-0" />

      {/* tarjetas de unidad (p-4; título + switch + chevron) */}
      {unitRows.map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.01] p-4"
        >
          <Skeleton className="h-[18px] w-28" />
          <div className="flex-1" />
          <Skeleton className="h-6 w-11 rounded-full" />
          <Skeleton className="size-4" />
        </div>
      ))}
    </div>
  )
}

// Mismas medidas que Metric del leaderboard (px-3 py-[14px]) y las filas de
// la lista (rank + nombre + tag + xp).
export function LeaderboardSkeleton() {
  const nameW = ["w-24", "w-32", "w-28", "w-36", "w-24", "w-32", "w-28", "w-20"]
  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="flex shrink-0 flex-col gap-2">
        <div className="grid grid-cols-2 gap-2">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="flex flex-col justify-center gap-1 rounded-md border border-white/10 bg-white/5 px-3 py-[14px]"
            >
              <Skeleton className="h-[1.125rem] w-10" />
              <Skeleton className="h-2.5 w-24" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-[52px] w-full" />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2 py-1">
        {nameW.map((w, i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-lg px-4 py-3 ring-1 ring-foreground/10"
          >
            <Skeleton className="h-3.5 w-3" />
            <Skeleton className={`h-3.5 ${w} flex-1`} />
            <Skeleton className="h-4 w-9 rounded-md" />
            <Skeleton className="h-3.5 w-10" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function ProfileSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3 rounded-md border border-white/10 bg-white/5 px-4 py-2.5">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="size-16 shrink-0" />
      </div>
      <Skeleton className="h-12 w-full rounded-md" />
      <Skeleton className="h-12 w-full rounded-md" />
      <Skeleton className="h-12 w-full rounded-md" />
      <Skeleton className="h-12 w-full rounded-md" />
    </div>
  )
}
