"use client"

import { CourseSwitcher } from "@/components/course-switcher"
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
  BELT_HEX,
  beltInfo,
  beltOrderFor,
  COURSE_ORDER,
  topicsForBelt,
  topicShortLabel,
  type BeltKey,
  type CourseId,
} from "@/lib/catalog"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { parseAsStringLiteral, useQueryState } from "nuqs"
import { useMemo, useState } from "react"
import { useStartTest, type TestItem } from "./UseStartTest"

const ctaCls =
  "h-[var(--cta-h)] w-full rounded-md bg-white text-black hover:bg-white/90 hover:text-black"

function itemId({ belt, topic, exercise_type }: TestItem) {
  return `${belt}/${topic}/${exercise_type}`
}

// All (belt, topic, exercise_type) items in the catalog for a course, flattened.
function allItems({ course }: { course: CourseId }): TestItem[] {
  const out: TestItem[] = []
  for (const belt of beltOrderFor({ course })) {
    for (const t of topicsForBelt({ belt, course })) {
      for (const et of t.skills) {
        out.push({ belt, topic: t.key, exercise_type: et })
      }
    }
  }
  return out
}

export default function TestConfig() {
  const router = useRouter()
  const startTest = useStartTest()

  const [course, setCourse] = useQueryState(
    "course",
    parseAsStringLiteral(COURSE_ORDER).withDefault("analisis"),
  )
  const items = useMemo(() => allItems({ course }), [course])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [shuffle, setShuffle] = useState(true)
  const [onlyMath, setOnlyMath] = useState(false)
  const [onlyGraph, setOnlyGraph] = useState(false)

  function selectCourse(next: CourseId) {
    setCourse(next)
    // Los items dependen del curso: limpiamos la selección para no arrastrar
    // items de otro curso.
    setSelected(new Set())
  }

  function prevCourse() {
    const idx = COURSE_ORDER.indexOf(course)
    selectCourse(COURSE_ORDER[(idx - 1 + COURSE_ORDER.length) % COURSE_ORDER.length])
  }

  function nextCourse() {
    const idx = COURSE_ORDER.indexOf(course)
    selectCourse(COURSE_ORDER[(idx + 1) % COURSE_ORDER.length])
  }

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
      {
        items: selectedItems,
        shuffle,
        filters: { has_math: onlyMath, has_graph: onlyGraph },
        course,
      },
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
        <CourseSwitcher course={course} onPrev={prevCourse} onNext={nextCourse} />

        <section className="flex flex-col gap-3 rounded-md border border-white/10 p-4">
          <div className="flex flex-col gap-0.5">
            <h2 className="font-sans text-lg font-semibold leading-tight">
              Test de contenido
            </h2>
            <p className="text-sm text-foreground/60">
              Elegí items, una skill de un tema. Sin tracking de progreso.
            </p>
          </div>
          <div className="flex flex-col gap-1.5 border-t border-white/10 pt-3 text-sm">
            <label className="flex items-center gap-2 text-foreground/80">
              <input
                type="checkbox"
                checked={shuffle}
                onChange={(e) => setShuffle(e.target.checked)}
              />
              Orden aleatorio
            </label>
            <label className="flex items-center gap-2 text-foreground/80">
              <input
                type="checkbox"
                checked={onlyMath}
                onChange={(e) => setOnlyMath(e.target.checked)}
              />
              Solo ítems con LaTeX
            </label>
            <label className="flex items-center gap-2 text-foreground/80">
              <input
                type="checkbox"
                checked={onlyGraph}
                onChange={(e) => setOnlyGraph(e.target.checked)}
              />
              Solo ítems con gráfico
            </label>
          </div>
        </section>

        {beltOrderFor({ course }).map((belt) => {
          const topics = topicsForBelt({ belt, course }).filter(
            (t) => t.skills.length > 0,
          )
          if (topics.length === 0) return null
          return (
            <section
              key={belt}
              className="flex flex-col gap-3 rounded-md border border-white/10 p-4"
            >
              <h3
                className="font-sans text-base font-semibold leading-tight"
                style={{ color: BELT_HEX[belt].onDark }}
              >
                {beltInfo({ belt, course }).headline}
              </h3>
              <div className="flex flex-col gap-3">
                {topics.map((t) => {
                  const topicItems: TestItem[] = t.skills.map((et) => ({
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
                        {topicShortLabel({ topic: t.key, course, fallback: t.name })}
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
                              {exerciseTypeInfo({ type: it.exercise_type, course }).label}
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
