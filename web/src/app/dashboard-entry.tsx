"use client"

import { SignOutButton, useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import Link from "next/link"
import BeltCard from "@/components/belt-card"
import { BELT_ORDER } from "@/lib/catalog"
import { beltStats } from "@/lib/catalog/stats"
import { useUserProgress } from "./UseUserProgress"
import { useStartSession } from "./UseStartSession"

const COURSE = "analisis-1"

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
          {isLoading && <p className="text-foreground/60">Cargando progreso…</p>}
          {isError && (
            <p className="text-red-500">
              No pudimos cargar tu progreso: {error.message}
            </p>
          )}
          {data && (
            <>
              <h1 className="text-2xl font-semibold">
                Nivel {data.level_info.level}
              </h1>
              <p className="mt-2 text-foreground/70">
                {data.level_info.xp_in_level} / {data.level_info.xp_required} XP
              </p>
              <div className="mt-3 h-2 w-64 overflow-hidden rounded bg-foreground/10">
                <div
                  className="h-full bg-foreground"
                  style={{ width: `${data.level_info.progress_pct}%` }}
                />
              </div>
            </>
          )}
        </div>
        <SignOutButton>
          <button className="inline-flex h-9 items-center rounded-md border px-3 text-sm">
            Cerrar sesión
          </button>
        </SignOutButton>
      </div>

      {totals && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={onRepasar}
            disabled={!canRepasar || startSession.isPending}
            className="inline-flex h-12 flex-1 items-center justify-center rounded-md bg-foreground font-medium text-background disabled:opacity-50"
          >
            {startSession.isPending
              ? "Cargando…"
              : totals.pendientes > 0
                ? `Repasar (${totals.pendientes} pendientes)`
                : totals.unlocked === 0
                  ? "Empezar mi primera sesión"
                  : "Empezar sesión"}
          </button>
          <Link
            href="/zen"
            className="inline-flex h-12 items-center justify-center rounded-md border px-4 font-medium"
          >
            Modo Zen
          </Link>
        </div>
      )}

      {startSession.isError && (
        <p className="text-sm text-red-500">
          No pudimos iniciar la sesión: {startSession.error.message}
        </p>
      )}

      {data && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">Cinturones</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {BELT_ORDER.map((belt) => (
              <BeltCard
                key={belt}
                belt={belt}
                course={COURSE}
                skillStates={data.skill_states}
              />
            ))}
          </div>
        </section>
      )}
    </main>
  )
}
