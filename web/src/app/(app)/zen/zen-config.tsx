"use client"

import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { parseAsArrayOf, parseAsInteger, parseAsString, useQueryState } from "nuqs"
import { BELT_ORDER, beltLabel, type BeltKey } from "@/lib/catalog"
import { useStartZen } from "./UseStartZen"

export default function ZenConfig() {
  const { user } = useUser()
  const router = useRouter()
  const startZen = useStartZen()

  const [belts, setBelts] = useQueryState(
    "belts",
    parseAsArrayOf(parseAsString).withDefault([...BELT_ORDER]),
  )
  const [count, setCount] = useQueryState(
    "count",
    parseAsInteger.withDefault(10),
  )

  function toggleBelt(belt: BeltKey) {
    setBelts(
      belts.includes(belt) ? belts.filter((b) => b !== belt) : [...belts, belt],
    )
  }

  function adjustCount(delta: number) {
    setCount(Math.max(1, Math.min(50, (count ?? 10) + delta)))
  }

  function onStart() {
    if (belts.length === 0 || (count ?? 0) < 1) return
    startZen.mutate(
      {
        userName: user?.fullName ?? user?.firstName ?? "",
        belts,
        count: count ?? 10,
      },
      {
        onSuccess: (payload) => router.push(`/session/${payload.session_id}`),
      },
    )
  }

  const canStart = belts.length > 0 && (count ?? 0) >= 1

  return (
    <main className="mx-auto flex max-w-md flex-col gap-6 px-6 py-8">
      <div>
        <h1 className="text-2xl font-semibold">Modo Zen</h1>
        <p className="mt-1 text-sm text-foreground/60">
          Práctica libre. No actualiza tu progreso.
        </p>
      </div>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium">Cinturones</h2>
        <div className="grid grid-cols-2 gap-2">
          {BELT_ORDER.map((belt) => {
            const active = belts.includes(belt)
            return (
              <button
                key={belt}
                type="button"
                onClick={() => toggleBelt(belt)}
                className={`flex h-10 items-center justify-center rounded-md border text-sm transition ${
                  active
                    ? "border-foreground bg-foreground text-background"
                    : "border-foreground/15 hover:bg-foreground/5"
                }`}
              >
                {beltLabel({ belt })}
              </button>
            )
          })}
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium">Cantidad</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => adjustCount(-10)}
            className="h-10 w-12 rounded-md border text-sm"
          >
            −10
          </button>
          <button
            type="button"
            onClick={() => adjustCount(-1)}
            className="h-10 w-10 rounded-md border text-sm"
          >
            −1
          </button>
          <div className="flex-1 text-center text-2xl font-semibold">
            {count ?? 10}
          </div>
          <button
            type="button"
            onClick={() => adjustCount(1)}
            className="h-10 w-10 rounded-md border text-sm"
          >
            +1
          </button>
          <button
            type="button"
            onClick={() => adjustCount(10)}
            className="h-10 w-12 rounded-md border text-sm"
          >
            +10
          </button>
        </div>
      </section>

      {startZen.isError && (
        <p className="text-sm text-red-500">{startZen.error.message}</p>
      )}

      <button
        type="button"
        onClick={onStart}
        disabled={!canStart || startZen.isPending}
        className="inline-flex h-12 items-center justify-center rounded-md bg-foreground font-medium text-background disabled:opacity-50"
      >
        {startZen.isPending ? "Cargando…" : "Empezar"}
      </button>
    </main>
  )
}
