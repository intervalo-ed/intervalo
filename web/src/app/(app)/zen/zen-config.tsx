"use client"

import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { parseAsArrayOf, parseAsInteger, parseAsString, useQueryState } from "nuqs"
import { ArrowLeft } from "lucide-react"
import { BELT_ORDER, beltLabel, type BeltKey } from "@/lib/catalog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import { Screen, ScreenBody, ScreenFooter, ScreenHeader } from "@/components/ui/screen"
import { Spinner } from "@/components/ui/spinner"
import { Toggle } from "@/components/ui/toggle"
import Link from "next/link"
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
    <Screen>
      <ScreenHeader>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Volver"
          nativeButton={false}
          render={<Link href="/" />}
        >
          <ArrowLeft />
        </Button>
        <div className="flex flex-1 flex-col">
          <h1 className="text-lg font-semibold">Modo Zen</h1>
          <p className="text-xs text-muted-foreground">
            Práctica libre. No actualiza tu progreso.
          </p>
        </div>
      </ScreenHeader>

      <ScreenBody className="max-w-md gap-6">
        <section className="flex flex-col gap-2">
          <h2 className="text-base font-medium">Cinturones</h2>
          <div className="grid grid-cols-2 gap-2">
            {BELT_ORDER.map((belt) => (
              <Toggle
                key={belt}
                variant="outline"
                size="lg"
                pressed={belts.includes(belt)}
                onPressedChange={() => toggleBelt(belt)}
              >
                {beltLabel({ belt })}
              </Toggle>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-base font-medium">Cantidad</h2>
          <div className="flex items-center gap-2">
            <ButtonGroup>
              <Button
                variant="outline"
                size="lg"
                onClick={() => adjustCount(-10)}
              >
                −10
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => adjustCount(-1)}
              >
                −1
              </Button>
            </ButtonGroup>
            <div className="flex-1 text-center text-2xl font-semibold tabular-nums">
              {count ?? 10}
            </div>
            <ButtonGroup>
              <Button variant="outline" size="lg" onClick={() => adjustCount(1)}>
                +1
              </Button>
              <Button variant="outline" size="lg" onClick={() => adjustCount(10)}>
                +10
              </Button>
            </ButtonGroup>
          </div>
        </section>

        {startZen.isError && (
          <Alert variant="destructive">
            <AlertDescription>{startZen.error.message}</AlertDescription>
          </Alert>
        )}
      </ScreenBody>

      <ScreenFooter>
        <Button
          size="lg"
          className="h-12 w-full"
          onClick={onStart}
          disabled={!canStart || startZen.isPending}
        >
          {startZen.isPending ? <Spinner /> : null}
          {startZen.isPending ? "Cargando…" : "Empezar"}
        </Button>
      </ScreenFooter>
    </Screen>
  )
}
