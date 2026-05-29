"use client"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"
import { useLeaderboard } from "./UseLeaderboard"

export function LeaderboardContent() {
  const { data, isLoading, isError, error } = useLeaderboard()

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Spinner />
        <span>Cargando ranking…</span>
      </div>
    )
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

  if (!data || data.entries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">Todavía no hay ranking.</p>
    )
  }

  return (
    <ol className="flex flex-col gap-2">
      {data.entries.map((entry) => (
        <li
          key={entry.user_id}
          className={cn(
            "flex items-center gap-3 rounded-lg px-4 py-3 ring-1 ring-foreground/10",
            entry.is_current_user && "bg-primary/10 ring-primary/30",
          )}
        >
          <span className="w-7 shrink-0 text-center font-semibold tabular-nums text-muted-foreground">
            {entry.rank}
          </span>
          <span className="flex-1 truncate font-medium">{entry.name}</span>
          <span className="shrink-0 font-semibold tabular-nums">
            {entry.total_xp.toLocaleString("es")} XP
          </span>
        </li>
      ))}
    </ol>
  )
}
