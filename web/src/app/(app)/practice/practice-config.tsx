"use client"

import { BottomNav } from "@/components/bottom-nav"
import { CourseSwitcher } from "@/components/course-switcher"
import MathText from "@/components/math-text"
import { Wordmark } from "@/components/wordmark"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Screen, ScreenBody, ScreenHeader } from "@/components/ui/screen"
import { Spinner } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"
import { useSfx } from "@/lib/audio/useSfx"
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
import { useUser } from "@clerk/nextjs"
import { ChevronLeft, ChevronRight, Info } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { parseAsInteger, parseAsStringLiteral, useQueryState } from "nuqs"
import { useMemo, useState } from "react"
import { useStartPractice } from "./UseStartPractice"

const ctaCls =
  "h-[var(--cta-h)] w-full rounded-md bg-white text-black hover:bg-white/90 hover:text-black"

// Topics with at least one exercise type are the only ones that yield exercises.
function playableTopics({ belt, course }: { belt: BeltKey; course: CourseId }) {
  return topicsForBelt({ belt, course }).filter((t) => t.skills.length > 0)
}

export default function PracticeConfig() {
  const { user } = useUser()
  const router = useRouter()
  const startPractice = useStartPractice()
  const sfx = useSfx()

  const [count, setCount] = useQueryState(
    "count",
    parseAsInteger.withDefault(10),
  )
  const [course, setCourse] = useQueryState(
    "course",
    parseAsStringLiteral(COURSE_ORDER).withDefault("analisis"),
  )
  const beltOrder = useMemo(() => beltOrderFor({ course }), [course])

  const [beltIdx, setBeltIdx] = useState(0)
  const belt = beltOrder[Math.min(beltIdx, beltOrder.length - 1)]
  const topics = useMemo(() => playableTopics({ belt, course }), [belt, course])

  // Topics enabled for the current unit. Default: all off.
  const [enabled, setEnabled] = useState<Set<string>>(() => new Set())

  function selectBelt(nextIdx: number) {
    sfx.iterate()
    setBeltIdx(nextIdx)
    setEnabled(new Set())
  }

  function prevBelt() {
    selectBelt((beltIdx - 1 + beltOrder.length) % beltOrder.length)
  }

  function nextBelt() {
    selectBelt((beltIdx + 1) % beltOrder.length)
  }

  function selectCourse(next: CourseId) {
    sfx.iterate()
    setCourse(next)
    // Los temas dependen del curso: volvemos a la primera unidad y limpiamos la
    // selección para no arrastrar temas de otro curso.
    setBeltIdx(0)
    setEnabled(new Set())
  }

  function prevCourse() {
    const idx = COURSE_ORDER.indexOf(course)
    selectCourse(COURSE_ORDER[(idx - 1 + COURSE_ORDER.length) % COURSE_ORDER.length])
  }

  function nextCourse() {
    const idx = COURSE_ORDER.indexOf(course)
    selectCourse(COURSE_ORDER[(idx + 1) % COURSE_ORDER.length])
  }

  function toggleTopic(key: string) {
    sfx.iterate()
    setEnabled((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function adjustCount(delta: number) {
    sfx.iterate()
    setCount(Math.max(1, Math.min(50, (count ?? 10) + delta)))
  }

  const selectedTopics = topics
    .filter((t) => enabled.has(t.key))
    .map((t) => t.key)
  const canStart = selectedTopics.length > 0 && (count ?? 0) >= 1

  function onStart() {
    if (!canStart) return
    sfx.start()
    startPractice.mutate(
      {
        userName: user?.fullName ?? user?.firstName ?? "",
        belt,
        topics: selectedTopics,
        count: count ?? 10,
        course,
      },
      {
        onSuccess: (payload) => router.push(`/session/${payload.session_id}`),
      },
    )
  }

  return (
    <Screen>
      <ScreenHeader innerClassName="justify-center">
        <Link href="/" aria-label="Intervalo">
          <Wordmark textClass="text-[15px]" barClass="h-[3px]" />
        </Link>
      </ScreenHeader>

      <ScreenBody className="gap-4 py-4">
        <div className="flex flex-col gap-2">
          <CourseSwitcher course={course} onPrev={prevCourse} onNext={nextCourse} />
          <Button
            size="lg"
            className={ctaCls}
            onClick={onStart}
            disabled={!canStart || startPractice.isPending}
          >
            {startPractice.isPending ? <Spinner /> : null}
            {startPractice.isPending ? "Cargando…" : "Comenzar"}
          </Button>
        </div>

        <section className="flex flex-col gap-3 rounded-md border border-white/10 p-4">
          <div className="flex flex-col gap-0.5">
            <h2 className="font-sans text-lg font-semibold leading-tight">
              Temas
            </h2>
            <p className="text-sm text-foreground/60">
              Elegí los temas de una unidad. Solo podés combinar temas de la
              misma unidad.
            </p>
          </div>

          <div className="flex items-center justify-between gap-2">
            <Button
              variant="outline"
              size="icon"
              aria-label="Unidad anterior"
              className="rounded-md"
              onClick={prevBelt}
            >
              <ChevronLeft />
            </Button>
            <div
              className="flex-1 text-center text-base font-semibold"
              style={{ color: BELT_HEX[belt].onDark }}
            >
              {beltInfo({ belt, course }).headline}
            </div>
            <Button
              variant="outline"
              size="icon"
              aria-label="Unidad siguiente"
              className="rounded-md"
              onClick={nextBelt}
            >
              <ChevronRight />
            </Button>
          </div>

          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={`${course}-${belt}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col gap-1"
            >
              {topics.length === 0 ? (
                <p className="py-2 text-sm text-foreground/50">
                  Esta unidad todavía no tiene ejercicios.
                </p>
              ) : (
                topics.map((t) => (
                  <div
                    key={t.key}
                    className="flex items-center justify-between gap-3 rounded-md px-1 py-2"
                  >
                    <Dialog>
                      <DialogTrigger
                        aria-label={`Más sobre ${topicShortLabel({ topic: t.key, course, fallback: t.name })}`}
                        className="flex flex-1 items-center gap-1.5 text-left outline-none"
                      >
                        <span className="text-sm">
                          {topicShortLabel({ topic: t.key, course, fallback: t.name })}
                        </span>
                        <Info className="size-3.5 shrink-0 text-foreground/40" />
                      </DialogTrigger>
                      <DialogContent className="max-h-[80vh] overflow-y-auto">
                        <DialogHeader className="gap-0.5">
                          <DialogTitle className="font-sans text-sm font-semibold text-foreground">
                            {topicShortLabel({ topic: t.key, course, fallback: t.name })}
                          </DialogTitle>
                          <DialogDescription className="text-sm leading-relaxed text-foreground/80">
                            <MathText text={t.tooltip} />
                          </DialogDescription>
                        </DialogHeader>
                      </DialogContent>
                    </Dialog>
                    <Switch
                      checked={enabled.has(t.key)}
                      onCheckedChange={() => toggleTopic(t.key)}
                    />
                  </div>
                ))
              )}
            </motion.div>
          </AnimatePresence>
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

        {startPractice.isError && (
          <Alert variant="destructive">
            <AlertDescription>{startPractice.error.message}</AlertDescription>
          </Alert>
        )}
      </ScreenBody>

      <BottomNav />
    </Screen>
  )
}
