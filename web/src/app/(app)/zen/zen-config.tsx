"use client"

import { Wordmark } from "@/components/wordmark"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Screen,
  ScreenBody,
  ScreenFooter,
  ScreenHeader,
} from "@/components/ui/screen"
import { Spinner } from "@/components/ui/spinner"
import { Toggle } from "@/components/ui/toggle"
import { useSfx } from "@/lib/audio/useSfx"
import { BELT_ORDER, beltInfo, type BeltKey } from "@/lib/catalog"
import { useUser } from "@clerk/nextjs"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  useQueryState,
} from "nuqs"
import { useStartZen } from "./UseStartZen"

const ctaCls =
  "h-12 w-full rounded-md bg-white text-black hover:bg-white/90 hover:text-black"

export default function ZenConfig() {
  const { user } = useUser()
  const router = useRouter()
  const startZen = useStartZen()
  const sfx = useSfx()

  const [belts, setBelts] = useQueryState(
    "belts",
    parseAsArrayOf(parseAsString).withDefault([]),
  )
  const [count, setCount] = useQueryState(
    "count",
    parseAsInteger.withDefault(10),
  )

  function toggleBelt(belt: BeltKey) {
    sfx.iterate()
    setBelts(
      belts.includes(belt) ? belts.filter((b) => b !== belt) : [...belts, belt],
    )
  }

  function adjustCount(delta: number) {
    sfx.iterate()
    setCount(Math.max(1, Math.min(50, (count ?? 10) + delta)))
  }

  function onStart() {
    if (belts.length === 0 || (count ?? 0) < 1) return
    sfx.start()
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
      <ScreenHeader innerClassName="relative justify-center">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Volver"
          nativeButton={false}
          render={<Link href="/" />}
          className="absolute left-0 inset-y-0 my-auto transition-none active:translate-y-0"
        >
          <ChevronLeft />
        </Button>
        <Link href="/" aria-label="Intervalo">
          <Wordmark textClass="text-[15px]" barClass="h-[3px]" />
        </Link>
      </ScreenHeader>

      <ScreenBody className="gap-4 py-4">
        <section className="flex flex-col gap-0.5 rounded-md border border-white/10 p-4">
          <h2 className="font-sans text-lg font-semibold leading-tight">Zen</h2>
          <p className="text-sm text-foreground/60">
            Práctica libre. No actualiza tu progreso, pero suma XP.
          </p>
        </section>

        <section className="flex flex-col gap-3 rounded-md border border-white/10 p-4">
          <div className="flex flex-col gap-0.5">
            <h2 className="font-sans text-lg font-semibold leading-tight">
              Unidades
            </h2>
            <p className="text-sm text-foreground/60">
              Elegí de qué unidades querés practicar.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {BELT_ORDER.map((belt) => (
              <Toggle
                key={belt}
                variant="outline"
                size="lg"
                pressed={belts.includes(belt)}
                onPressedChange={() => toggleBelt(belt)}
                className="rounded-md aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground aria-pressed:hover:bg-primary/90 aria-pressed:hover:text-primary-foreground data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
              >
                {beltInfo({ belt }).headline}
              </Toggle>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-3 rounded-md border border-white/10 p-4">
          <div className="flex flex-col gap-0.5">
            <h2 className="font-sans text-lg font-semibold leading-tight">
              Cantidad
            </h2>
            <p className="text-sm text-foreground/60">
              Cuántos ejercicios vas a resolver.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="lg"
                className="rounded-md"
                onClick={() => adjustCount(-10)}
              >
                −10
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="rounded-md"
                onClick={() => adjustCount(-1)}
              >
                −1
              </Button>
            </div>
            <div className="flex-1 text-center text-2xl font-semibold tabular-nums">
              {count ?? 10}
            </div>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="lg"
                className="rounded-md"
                onClick={() => adjustCount(1)}
              >
                +1
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="rounded-md"
                onClick={() => adjustCount(10)}
              >
                +10
              </Button>
            </div>
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
          className={ctaCls}
          onClick={onStart}
          disabled={!canStart || startZen.isPending}
        >
          {startZen.isPending ? <Spinner /> : null}
          {startZen.isPending ? "Cargando…" : "Comenzar"}
        </Button>
      </ScreenFooter>
    </Screen>
  )
}
