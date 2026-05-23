"use client"

import { SignOutButton, useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import Link from "next/link"
import BeltCard from "./belt-card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Spinner } from "@/components/ui/spinner"
import { BELT_ORDER } from "@/lib/catalog"
import { beltStats } from "@/lib/catalog/stats"
import { useUserProgress } from "./UseUserProgress"
import { useStartSession } from "./UseStartSession"

export default function DashboardEntry() {
  const { data, isLoading, isError, error } = useUserProgress()
  const { user } = useUser()
  const router = useRouter()
  const startSession = useStartSession()

  const totals = data
    ? BELT_ORDER.reduce(
        (acc, belt) => {
          const s = beltStats({ belt, skillStates: data.skill_states })
          acc.pendientes += s.pendientes
          acc.nuevos += s.nuevos
          acc.aprendiendo += s.aprendiendo
          acc.unlocked += s.unlocked
          return acc
        },
        { pendientes: 0, nuevos: 0, aprendiendo: 0, unlocked: 0 },
      )
    : null

  // Always allow starting; the backend's first /session/start unlocks the
  // initial batch of items for fresh users.
  const canRepasar = totals !== null

  function onRepasar() {
    startSession.mutate(
      { userName: user?.fullName ?? user?.firstName ?? "" },
      {
        onSuccess: (payload) => router.push(`/session/${payload.session_id}`),
      },
    )
  }

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-12">
      <div className="flex items-start justify-between">
        <div>
          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Spinner />
              <span>Cargando progreso…</span>
            </div>
          )}
          {isError && (
            <Alert variant="destructive">
              <AlertDescription>
                No pudimos cargar tu progreso: {error.message}
              </AlertDescription>
            </Alert>
          )}
          {data && (
            <>
              <h1 className="text-2xl font-semibold">
                Nivel {data.level_info.level}
              </h1>
              <p className="mt-2 text-muted-foreground">
                {data.level_info.xp_in_level} / {data.level_info.xp_required} XP
              </p>
              <Progress
                value={data.level_info.progress_pct}
                className="mt-3 w-64"
              />
            </>
          )}
        </div>
        <SignOutButton>
          <Button variant="outline" size="sm">
            Cerrar sesión
          </Button>
        </SignOutButton>
      </div>

      {totals && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button
            size="lg"
            className="h-12 flex-1"
            onClick={onRepasar}
            disabled={!canRepasar || startSession.isPending}
          >
            {startSession.isPending && <Spinner />}
            {startSession.isPending
              ? "Cargando…"
              : totals.pendientes > 0
                ? `Repasar (${totals.pendientes} pendientes)`
                : totals.unlocked === 0
                  ? "Empezar mi primera sesión"
                  : "Empezar sesión"}
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="h-12"
            render={<Link href="/zen" />}
          >
            Modo Zen
          </Button>
        </div>
      )}

      {startSession.isError && (
        <Alert variant="destructive">
          <AlertDescription>
            No pudimos iniciar la sesión: {startSession.error.message}
          </AlertDescription>
        </Alert>
      )}

      {data && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">Cinturones</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {BELT_ORDER.map((belt) => (
              <BeltCard
                key={belt}
                belt={belt}
                skillStates={data.skill_states}
              />
            ))}
          </div>
        </section>
      )}
    </main>
  )
}
