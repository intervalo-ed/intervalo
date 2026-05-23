"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "motion/react"
import { useQueryClient } from "@tanstack/react-query"
import { Alert, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Item, ItemActions, ItemContent, ItemGroup, ItemTitle } from "@/components/ui/item"
import { Progress } from "@/components/ui/progress"
import { Spinner } from "@/components/ui/spinner"
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
      <main className="mx-auto flex max-w-2xl items-center gap-2 px-6 py-12 text-sm text-muted-foreground">
        <Spinner />
        <span>Cargando resumen…</span>
      </main>
    )
  }

  if (isError || !data) {
    return (
      <main className="mx-auto flex max-w-md flex-col items-center gap-4 px-6 py-16 text-center">
        <Alert variant="destructive">
          <AlertTitle>
            {error?.message ?? "No pudimos cargar el resumen"}
          </AlertTitle>
        </Alert>
        <Button variant="outline" onClick={goHome}>
          Volver al inicio
        </Button>
      </main>
    )
  }

  const accuracy = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-8">
      <div>
        <h1 className="text-2xl font-semibold">Resumen</h1>
        <p className="mt-1 text-sm text-muted-foreground">
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

      <Card>
        <CardContent className="flex flex-col gap-3">
          <div className="text-sm font-medium">XP ganada</div>
          <div className="text-2xl font-semibold">+{data.xp_earned}</div>
          <div className="text-xs text-muted-foreground">
            Nivel {data.level_info.level} · {data.level_info.xp_in_level}/
            {data.level_info.xp_required} XP
          </div>
          <Progress value={data.level_info.progress_pct} />
        </CardContent>
      </Card>

      {data.belt_progress.promoted && (
        <Alert className="border-yellow-500/40 bg-yellow-500/10">
          <AlertTitle>¡Cinturón promocionado!</AlertTitle>
        </Alert>
      )}

      <section>
        <h2 className="mb-2 text-sm font-medium text-muted-foreground">Ítems</h2>
        <ItemGroup>
          {data.items.map((item, i) => (
            <Item key={i} variant="outline" size="sm">
              <ItemContent>
                <ItemTitle>
                  {topicLabel({ topic: item.topic })} · {skillLabel({ skill: item.skill })}
                </ItemTitle>
              </ItemContent>
              <ItemActions>
                <span className={item.correct ? "text-green-600" : "text-red-500"}>
                  {item.correct ? "✓" : "✗"}
                </span>
              </ItemActions>
            </Item>
          ))}
        </ItemGroup>
      </section>

      <Button size="lg" onClick={goHome}>
        Volver al inicio
      </Button>
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
    <Card size="sm">
      <CardContent className="text-center">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className={`mt-1 text-2xl font-semibold ${cls}`}>{value}</div>
      </CardContent>
    </Card>
  )
}
