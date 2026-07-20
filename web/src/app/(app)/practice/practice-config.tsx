"use client"

import { CountUp } from "@/components/count-up"
import { CourseSwitcher } from "@/components/course-switcher"
import MathText from "@/components/math-text"
import { Metric, accuracyColor } from "@/components/metric-card"
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
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"
import { useSfx } from "@/lib/audio/useSfx"
import { cn } from "@/lib/utils"
import {
  BELT_HEX,
  beltOrderFor,
  COURSE_ORDER,
  getBelt,
  topicShortLabel,
  type BeltKey,
  type CourseId,
  type Topic,
} from "@/lib/catalog"
import { useUser } from "@clerk/nextjs"
import { CheckIcon, ChevronDown, Info, RotateCcwIcon, SettingsIcon, X } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { parseAsInteger, parseAsStringLiteral, useQueryState } from "nuqs"
import { useMemo, useState, useSyncExternalStore } from "react"
import { EditorStepper } from "@/app/editor-stepper"
import { usePracticeStats } from "./UsePracticeStats"
import { useStartPractice } from "./UseStartPractice"

const ctaCls =
  "h-12 w-full shrink-0 rounded-md bg-white text-black hover:bg-white/90 hover:text-black"

const DEFAULT_COUNT = 10

// Mismo lenguaje visual que el modo editor de repaso (dashboard-entry.tsx):
// rojo para restablecer, verde para guardar/cerrar.
const resetConfigCls =
  "h-9 w-full justify-center rounded-md border-red-500/30 bg-transparent text-red-400 hover:bg-red-500/10 hover:text-red-400"
const saveConfigCls =
  "h-9 w-full justify-center rounded-md border-green-500/30 bg-transparent text-green-400 hover:bg-green-500/10 hover:text-green-400"

const EXPANDED_STORAGE_KEY = "intervalo:practice-units-expanded"
const EXPANDED_EVENT = "intervalo:practice-units-expanded-change"
const HINT_STORAGE_KEY = "intervalo:practice-topics-hint-seen"
const HINT_EVENT = "intervalo:practice-topics-hint-seen-change"

const EMPTY_EXPANDED = new Set<string>()

function topicKey(belt: BeltKey, topic: string): string {
  return `${belt}/${topic}`
}

function MetricSkeleton() {
  return (
    <div className="flex flex-col gap-1.5 rounded-md border border-white/10 bg-white/5 p-3">
      <Skeleton className="h-[1.125rem] w-8" />
      <Skeleton className="h-[0.7rem] w-16" />
    </div>
  )
}

// Qué unidades están expandidas, persistido entre visitas. Se lee del
// localStorage vía useSyncExternalStore (no en un efecto con setState) para
// no romper la hidratación: el server siempre ve EMPTY_EXPANDED.
let expandedCache: { raw: string; set: Set<string> } | null = null

function getExpandedSnapshot(): Set<string> {
  const raw = window.localStorage.getItem(EXPANDED_STORAGE_KEY) ?? "[]"
  if (!expandedCache || expandedCache.raw !== raw) {
    try {
      expandedCache = { raw, set: new Set(JSON.parse(raw)) }
    } catch {
      expandedCache = { raw, set: new Set() }
    }
  }
  return expandedCache.set
}

function setExpandedGlobal(next: Set<string>): void {
  window.localStorage.setItem(EXPANDED_STORAGE_KEY, JSON.stringify([...next]))
  window.dispatchEvent(new Event(EXPANDED_EVENT))
}

function subscribeExpanded(callback: () => void): () => void {
  window.addEventListener(EXPANDED_EVENT, callback)
  window.addEventListener("storage", callback)
  return () => {
    window.removeEventListener(EXPANDED_EVENT, callback)
    window.removeEventListener("storage", callback)
  }
}

function useExpandedUnits(): Set<string> {
  return useSyncExternalStore(
    subscribeExpanded,
    getExpandedSnapshot,
    () => EMPTY_EXPANDED,
  )
}

function hasSeenTopicsHint(): boolean {
  return window.localStorage.getItem(HINT_STORAGE_KEY) === "1"
}

function dismissTopicsHintGlobal(): void {
  window.localStorage.setItem(HINT_STORAGE_KEY, "1")
  window.dispatchEvent(new Event(HINT_EVENT))
}

function subscribeHint(callback: () => void): () => void {
  window.addEventListener(HINT_EVENT, callback)
  window.addEventListener("storage", callback)
  return () => {
    window.removeEventListener(HINT_EVENT, callback)
    window.removeEventListener("storage", callback)
  }
}

function useTopicsHintDismissed(): boolean {
  return useSyncExternalStore(subscribeHint, hasSeenTopicsHint, () => false)
}

export default function PracticeConfig() {
  const { user } = useUser()
  const router = useRouter()
  const startPractice = useStartPractice()
  const sfx = useSfx()

  const [count, setCount] = useQueryState(
    "count",
    parseAsInteger.withDefault(DEFAULT_COUNT),
  )
  const [editing, setEditing] = useState(false)
  const [course, setCourse] = useQueryState(
    "course",
    parseAsStringLiteral(COURSE_ORDER).withDefault("analisis"),
  )
  const beltOrder = useMemo(() => beltOrderFor({ course }), [course])

  const statsQuery = usePracticeStats({ course })
  const sessionsCompleted = statsQuery.data?.sessions_completed ?? 0
  const answered = statsQuery.data?.exercises_answered ?? 0
  const exercisesCorrect = statsQuery.data?.exercises_correct ?? 0
  const accuracyPct = answered
    ? Math.round((exercisesCorrect / answered) * 100)
    : 0

  // Todas las unidades de todos los cinturones del curso activo (mismo patrón
  // que dashboard-entry.tsx), filtradas a las que tienen al menos un tema con
  // ejercicios. Se puede combinar temas de varias unidades/cinturones a la vez.
  const unitEntries = useMemo(
    () =>
      beltOrder
        .flatMap((belt) => {
          const cat = getBelt({ key: belt, course })
          return (cat?.units ?? []).map((unit) => ({
            belt,
            unit,
            topics: unit.topics.filter((t) => t.skills.length > 0),
          }))
        })
        .filter((e) => e.topics.length > 0),
    [beltOrder, course],
  )

  // Temas tildados, como claves compuestas `${belt}/${topic}` (el topic.key no
  // es único entre cinturones, ej. "definition" existe en white/blue/brown).
  const [enabled, setEnabled] = useState<Set<string>>(() => new Set())

  function toggleTopic(belt: BeltKey, topic: string) {
    sfx.iterate()
    const key = topicKey(belt, topic)
    setEnabled((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function toggleUnit(belt: BeltKey, topics: Topic[]) {
    sfx.iterate()
    const keys = topics.map((t) => topicKey(belt, t.key))
    const anyOn = keys.some((k) => enabled.has(k))
    setEnabled((prev) => {
      const next = new Set(prev)
      for (const k of keys) {
        if (anyOn) next.delete(k)
        else next.add(k)
      }
      return next
    })
  }

  // Qué unidades están expandidas, persistido entre visitas.
  const expanded = useExpandedUnits()

  function toggleExpanded(id: string) {
    const next = new Set(expanded)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setExpandedGlobal(next)
  }

  const hintDismissed = useTopicsHintDismissed()

  function dismissHint() {
    dismissTopicsHintGlobal()
  }

  function selectCourse(next: CourseId) {
    sfx.iterate()
    setCourse(next)
    // Los temas dependen del curso: limpiamos la selección para no arrastrar
    // temas de otro curso.
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

  const selectedItems = unitEntries.flatMap(({ belt, topics }) =>
    topics
      .filter((t) => enabled.has(topicKey(belt, t.key)))
      .map((t) => ({ belt, topic: t.key })),
  )
  const canStart = selectedItems.length > 0 && (count ?? 0) >= 1

  function onStart() {
    if (!canStart) return
    sfx.start()
    startPractice.mutate(
      {
        userName: user?.fullName ?? user?.firstName ?? "",
        items: selectedItems,
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
          <CourseSwitcher
            course={course}
            onPrev={prevCourse}
            onNext={nextCourse}
            editing={editing}
            onToggleEdit={() => setEditing((v) => !v)}
          />

          {editing ? (
            <EditorStepper
              label="Ejercicios por sesión"
              help="Cuántos ejercicios entran en cada sesión de práctica que arranques."
              value={count ?? DEFAULT_COUNT}
              max={50}
              busy={false}
              onChange={setCount}
            />
          ) : statsQuery.isPending ? (
            <div className="grid grid-cols-3 gap-2">
              <MetricSkeleton />
              <MetricSkeleton />
              <MetricSkeleton />
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              <Metric
                label="Sesiones completadas"
                value={
                  <CountUp variant="ease" value={sessionsCompleted} duration={1000} />
                }
              />
              <Metric
                label="Ejercicios completados"
                value={<CountUp variant="ease" value={answered} duration={1000} />}
              />
              <Metric
                label="Ejercicios acertados"
                value={
                  <span style={{ color: accuracyColor(accuracyPct) }}>
                    <CountUp variant="ease" value={accuracyPct} duration={1000} />%
                  </span>
                }
              />
            </div>
          )}
        </div>

        {editing ? (
          <div className="grid grid-cols-2 gap-2">
            <Button
              size="lg"
              variant="outline"
              className={resetConfigCls}
              onClick={() => setCount(DEFAULT_COUNT)}
            >
              <RotateCcwIcon className="size-4" />
              Restablecer
            </Button>
            <Button
              size="lg"
              variant="outline"
              className={saveConfigCls}
              onClick={() => setEditing(false)}
            >
              <CheckIcon className="size-4" />
              Guardar
            </Button>
          </div>
        ) : (
          <Button
            size="lg"
            className={ctaCls}
            onClick={onStart}
            disabled={!canStart || startPractice.isPending}
          >
            {startPractice.isPending ? <Spinner /> : null}
            {startPractice.isPending ? "Cargando…" : "Practicar"}
          </Button>
        )}

        {!hintDismissed && (
          <div className="flex items-start justify-between gap-3 rounded-md border border-white/10 bg-white/[0.01] p-4">
            <p className="text-sm text-foreground/60">
              Elegí los temas que querés practicar. Ajustá en{" "}
              <SettingsIcon className="inline size-3.5 align-middle" /> la cantidad
              de ejercicios.
            </p>
            <button
              type="button"
              aria-label="Cerrar"
              className="shrink-0 text-foreground/40 outline-none transition-colors hover:text-foreground/70"
              onClick={dismissHint}
            >
              <X className="size-4" />
            </button>
          </div>
        )}

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={course}
            className="flex flex-col gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {unitEntries.map(({ belt, unit, topics }) => {
              const id = `${course}:${belt}/${unit.key}`
              const checked = topics.some((t) => enabled.has(topicKey(belt, t.key)))
              return (
                <PracticeUnitCard
                  key={id}
                  belt={belt}
                  course={course}
                  unit={unit}
                  topics={topics}
                  checked={checked}
                  onToggleUnit={() => toggleUnit(belt, topics)}
                  expanded={expanded.has(id)}
                  onToggleExpanded={() => toggleExpanded(id)}
                  enabled={enabled}
                  onToggleTopic={(topic) => toggleTopic(belt, topic)}
                />
              )
            })}
          </motion.div>
        </AnimatePresence>

        {startPractice.isError && (
          <Alert variant="destructive">
            <AlertDescription>{startPractice.error.message}</AlertDescription>
          </Alert>
        )}
      </ScreenBody>
    </Screen>
  )
}

function PracticeUnitCard({
  belt,
  course,
  unit,
  topics,
  checked,
  onToggleUnit,
  expanded,
  onToggleExpanded,
  enabled,
  onToggleTopic,
}: {
  belt: BeltKey
  course: CourseId
  unit: { key: string; name: string; description?: string }
  topics: Topic[]
  checked: boolean
  onToggleUnit: () => void
  expanded: boolean
  onToggleExpanded: () => void
  enabled: Set<string>
  onToggleTopic: (topic: string) => void
}) {
  return (
    <div className="flex flex-col rounded-md border border-white/10 bg-white/[0.01]">
      <div className="flex items-center gap-2 p-4">
        <span
          className="text-base font-semibold leading-tight"
          style={{ color: BELT_HEX[belt].onDark }}
        >
          {unit.name}
        </span>
        {unit.description && (
          <Dialog>
            <DialogTrigger
              aria-label={`Información de ${unit.name}`}
              className="text-foreground/40 outline-none transition-colors hover:text-foreground/70"
            >
              <Info className="size-3.5" />
            </DialogTrigger>
            <DialogContent className="max-h-[80vh] overflow-y-auto">
              <DialogHeader className="gap-0.5">
                <DialogTitle className="font-sans text-sm font-semibold text-foreground">
                  {unit.name}
                </DialogTitle>
                <DialogDescription className="whitespace-pre-line text-sm leading-relaxed text-foreground/80">
                  <MathText text={unit.description} />
                </DialogDescription>
              </DialogHeader>
            </DialogContent>
          </Dialog>
        )}
        <div className="flex-1" />
        <Switch checked={checked} onCheckedChange={onToggleUnit} />
        <button
          type="button"
          aria-label={expanded ? "Contraer" : "Expandir"}
          className="text-foreground/40 outline-none transition-colors hover:text-foreground/70"
          onClick={onToggleExpanded}
        >
          <ChevronDown
            className={cn("size-4 transition-transform", expanded && "rotate-180")}
          />
        </button>
      </div>
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-1 border-t border-white/10 px-4 pb-4 pt-3">
              {topics.map((t) => (
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
                    checked={enabled.has(topicKey(belt, t.key))}
                    onCheckedChange={() => onToggleTopic(t.key)}
                  />
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
