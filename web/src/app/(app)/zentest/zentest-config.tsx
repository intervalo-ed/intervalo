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
import { exerciseTypeInfo } from "@/lib/catalog/exercise-types"
import {
  BELT_ORDER,
  beltInfo,
  getBelt,
  topicShortLabel,
  type BeltKey,
} from "@/lib/catalog"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import { useStartTest, type TestItem } from "./UseStartTest"

const ctaCls =
  "h-12 w-full rounded-md bg-white text-black hover:bg-white/90 hover:text-black"

function itemId({ belt, topic, exercise_type }: TestItem) {
  return `${belt}/${topic}/${exercise_type}`
}

// All (belt, topic, exercise_type) items in the catalog, flattened.
function allItems(): TestItem[] {
  const out: TestItem[] = []
  for (const belt of BELT_ORDER) {
    for (const t of getBelt({ key: belt })?.topics ?? []) {
      for (const et of t.exercise_types) {
        out.push({ belt, topic: t.key, exercise_type: et })
      }
    }
  }
  return out
}

export default function ZentestConfig() {
  const router = useRouter()
  const startTest = useStartTest()

  const items = useMemo(allItems, [])
  const [selected, setSelected] = useState<Set<string>>(new Set())

  function toggle(it: TestItem) {
    const id = itemId(it)
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleTopic(topicItems: TestItem[]) {
    const ids = topicItems.map(itemId)
    const allOn = ids.every((id) => selected.has(id))
    setSelected((prev) => {
      const next = new Set(prev)
      for (const id of ids) {
        if (allOn) next.delete(id)
        else next.add(id)
      }
      return next
    })
  }

  const selectedItems = items.filter((it) => selected.has(itemId(it)))
  const canStart = selectedItems.length > 0

  function onStart() {
    if (!canStart) return
    startTest.mutate(
      { items: selectedItems },
      { onSuccess: (p) => router.push(`/session/${p.session_id}`) },
    )
  }

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
          <h2 className="font-sans text-lg font-semibold leading-tight">
            Test de contenido
          </h2>
          <p className="text-sm text-foreground/60">
            Elegí items, una skill de un tema, y la sesión incluye TODOS sus
            ejercicios, en orden. Sin tracking de progreso.
          </p>
        </section>

        {BELT_ORDER.map((belt) => {
          const topics = (getBelt({ key: belt })?.topics ?? []).filter(
            (t) => t.exercise_types.length > 0,
          )
          if (topics.length === 0) return null
          return (
            <section
              key={belt}
              className="flex flex-col gap-3 rounded-md border border-white/10 p-4"
            >
              <h3 className="font-sans text-base font-semibold leading-tight">
                {beltInfo({ belt }).headline}
              </h3>
              <div className="flex flex-col gap-3">
                {topics.map((t) => {
                  const topicItems: TestItem[] = t.exercise_types.map((et) => ({
                    belt,
                    topic: t.key,
                    exercise_type: et,
                  }))
                  return (
                    <div key={t.key} className="flex flex-col gap-1.5">
                      <button
                        onClick={() => toggleTopic(topicItems)}
                        className="text-left text-sm font-medium text-foreground/80"
                      >
                        {topicShortLabel({ topic: t.key })}
                      </button>
                      <div className="flex flex-wrap gap-1.5">
                        {topicItems.map((it) => {
                          const on = selected.has(itemId(it))
                          return (
                            <button
                              key={it.exercise_type}
                              onClick={() => toggle(it)}
                              className={
                                "rounded-md border px-2.5 py-1 text-xs transition-colors " +
                                (on
                                  ? "border-white bg-white text-black"
                                  : "border-white/15 text-foreground/70 hover:border-white/40")
                              }
                            >
                              {exerciseTypeInfo({ type: it.exercise_type }).label}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )
        })}

        {startTest.isError && (
          <Alert variant="destructive">
            <AlertDescription>{startTest.error.message}</AlertDescription>
          </Alert>
        )}
      </ScreenBody>

      <ScreenFooter>
        <Button
          size="lg"
          className={ctaCls}
          onClick={onStart}
          disabled={!canStart || startTest.isPending}
        >
          {startTest.isPending ? <Spinner /> : null}
          {startTest.isPending
            ? "Cargando…"
            : canStart
              ? `Probar (${selectedItems.length} ${selectedItems.length === 1 ? "item" : "items"})`
              : "Elegí al menos un item"}
        </Button>
      </ScreenFooter>
    </Screen>
  )
}
