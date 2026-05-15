"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "motion/react"
import { useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/lib/query/keys"
import { skillLabel, topicLabel } from "@/lib/catalog"
import { clearSession } from "@/lib/session/storage"
import { useSummary } from "./UseSummary"

export default function SessionSummary({ sessionId }: { sessionId: string }) {
  const { data, isLoading, isError, error } = useSummary({ sessionId })
  const qc = useQueryClient()
  const router = useRouter()

  function goHome() {
    router.push("/")
    // Bust the App Router segment cache so the / RSC re-runs on arrival.
    router.refresh()
  }

  // Once the summary lands the session is finished server-side; clear stash
  // and refresh dashboard data on the way back. `refetchType: "all"` forces
  // refetch even though no observer is mounted yet — without it the dashboard
  // hits its cache on return and shows stale state.
  useEffect(() => {
    if (!data) return
    clearSession({ id: sessionId })
    qc.invalidateQueries({
      queryKey: queryKeys.userProgress(),
      refetchType: "all",
    })
  }, [data, sessionId, qc])

  if (isLoading) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-12">
        <p className="text-foreground/60">Cargando resumen…</p>
      </main>
    )
  }

  if (isError || !data) {
    return (
      <main className="mx-auto max-w-md px-6 py-16 text-center">
        <p className="text-red-500">
          {error?.message ?? "No pudimos cargar el resumen"}
        </p>
        <button
          onClick={goHome}
          className="mt-4 inline-flex h-10 items-center rounded-md border px-4 text-sm"
        >
          Volver al inicio
        </button>
      </main>
    )
  }

  const accuracy = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-8">
      <div>
        <h1 className="text-2xl font-semibold">Resumen</h1>
        <p className="mt-1 text-sm text-foreground/60">
          {data.user_name && `${data.user_name} · `}
          {accuracy}% de aciertos
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-3 gap-3"
      >
        <Stat label="Total" value={data.total} />
        <Stat label="Correctas" value={data.correct} tone="green" />
        <Stat label="Falladas" value={data.incorrect} tone="red" />
      </motion.div>

      <div className="rounded-lg border p-4">
        <div className="text-sm font-medium">XP ganada</div>
        <div className="mt-1 text-2xl font-semibold">+{data.xp_earned}</div>
        <div className="mt-3 text-xs text-foreground/60">
          Nivel {data.level_info.level} · {data.level_info.xp_in_level}/
          {data.level_info.xp_required} XP
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded bg-foreground/10">
          <motion.div
            className="h-full bg-foreground"
            initial={{ width: 0 }}
            animate={{ width: `${data.level_info.progress_pct}%` }}
            transition={{ duration: 0.6, delay: 0.2 }}
          />
        </div>
      </div>

      {data.belt_progress.promoted && (
        <div className="rounded-lg border border-yellow-500/40 bg-yellow-500/10 p-4 text-sm">
          ¡Cinturón promocionado!
        </div>
      )}

      <section>
        <h2 className="mb-2 text-sm font-medium text-foreground/70">Ítems</h2>
        <ul className="flex flex-col gap-1">
          {data.items.map((item, i) => (
            <li
              key={i}
              className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
            >
              <span>
                {topicLabel({ topic: item.topic })} · {skillLabel({ skill: item.skill })}
              </span>
              <span className={item.correct ? "text-green-600" : "text-red-500"}>
                {item.correct ? "✓" : "✗"}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <button
        onClick={goHome}
        className="mt-2 inline-flex h-11 items-center justify-center rounded-md bg-foreground font-medium text-background"
      >
        Volver al inicio
      </button>
    </main>
  )
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone?: "green" | "red"
}) {
  const cls =
    tone === "green"
      ? "text-green-600"
      : tone === "red"
        ? "text-red-500"
        : "text-foreground"
  return (
    <div className="rounded-lg border p-3 text-center">
      <div className="text-xs text-foreground/60">{label}</div>
      <div className={`mt-1 text-2xl font-semibold ${cls}`}>{value}</div>
    </div>
  )
}
