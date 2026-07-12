"use client"

import { BottomNav } from "@/components/bottom-nav"
import MathText from "@/components/math-text"
import { CountUp } from "@/components/count-up"
import { XpDots } from "@/components/xp-dots"
import {
  BeltGrid,
  ITEM_COLORS,
  topicToCells,
  type BeltGridRow,
} from "@/components/belt-grid"
import { Metric } from "@/components/metric-card"
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
import { useSfx } from "@/lib/audio/useSfx"
import { cn } from "@/lib/utils"
import type { components } from "@/lib/api/schema"
import {
  beltOrderFor,
  BELT_HEX,
  COURSE_ORDER,
  getBelt,
  type BeltKey,
  type CourseId,
} from "@/lib/catalog"
import type { Topic } from "@/lib/catalog/analisis.generated"
import {
  actionableUnitCount,
  beltStats,
  courseUnitTotals,
  pendingUnitCount,
} from "@/lib/catalog/stats"
import { useSplash } from "@/app/splash-context"
import { CourseSwitcher } from "@/components/course-switcher"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { topicShortLabel } from "@/lib/catalog"
import { useUser } from "@clerk/nextjs"
import { CheckIcon, InfoIcon, RotateCcwIcon } from "lucide-react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"
import { CourseEditorRow, type TopicEditState } from "./course-editor-row"
import { LearningCountStepper } from "./learning-count-stepper"
import { useCourseEditor } from "./UseCourseEditor"
import { useLeaderboard } from "./(app)/leaderboard/UseLeaderboard"
import { useStartSession } from "./UseStartSession"
import { useUserProgress } from "./UseUserProgress"

const LAST_COURSE_KEY = "intervalo:last_course"

function isCourseId(v: unknown): v is CourseId {
  return typeof v === "string" && (COURSE_ORDER as string[]).includes(v)
}

type TopicStates = Record<string, components["schemas"]["TopicProgress"]>

const ctaCls =
  "h-12 w-full rounded-md bg-white text-black hover:bg-white/90 hover:text-black"

// Variante del CTA: fondo blanco con texto violeta (modo práctica libre).
const practiceCls =
  "h-12 w-full rounded-md bg-white text-[#3B1E73] hover:bg-white/90 hover:text-[#3B1E73]"

// Botones del modo editor: rojo (reiniciar curso) y verde (cerrar edición), con
// el mismo lenguaje visual que los botones outline del perfil.
const resetCourseCls =
  "h-12 w-full justify-center rounded-md border-red-500/30 bg-transparent text-red-400 hover:bg-red-500/10 hover:text-red-400"
const saveEditCls =
  "h-12 w-full justify-center rounded-md border-green-500/30 bg-transparent text-green-400 hover:bg-green-500/10 hover:text-green-400"

// Color del título de cada unidad, tomado del cinturón correspondiente
// (variante `onDark`, legible sobre el fondo oscuro).
const BELT_COLOR: Record<BeltKey, string> = {
  white: BELT_HEX.white.onDark,
  blue: BELT_HEX.blue.onDark,
  violet: BELT_HEX.violet.onDark,
  brown: BELT_HEX.brown.onDark,
}

export default function DashboardEntry() {
  const leaderboard = useLeaderboard()
  const { user } = useUser()
  const router = useRouter()
  const searchParams = useSearchParams()
  const startSession = useStartSession()
  const sfx = useSfx()
  const { markReady } = useSplash()
  const reduceMotion = useReducedMotion()

  // Prefetch de ambos cursos: React Query cachea por queryKey y ambos hooks se
  // resuelven en paralelo. Cambiar de curso solo alterna qué `data` se lee.
  const analisisQuery = useUserProgress({ course: "analisis" })
  const probabilidadQuery = useUserProgress({ course: "probabilidad" })

  // Curso activo: URL param → last_course del back → localStorage → analisis.
  // Se persiste en localStorage como fallback cuando el back todavía no expone
  // `last_course`.
  const urlCourse = searchParams.get("course")
  const lastCourseFromApi =
    analisisQuery.data?.last_course ?? probabilidadQuery.data?.last_course ?? null
  const storedCourse =
    typeof window !== "undefined" ? window.localStorage.getItem(LAST_COURSE_KEY) : null

  const course: CourseId = isCourseId(urlCourse)
    ? urlCourse
    : isCourseId(lastCourseFromApi)
      ? lastCourseFromApi
      : isCourseId(storedCourse)
        ? storedCourse
        : "analisis"

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(LAST_COURSE_KEY, course)
    }
  }, [course])

  const activeQuery = course === "analisis" ? analisisQuery : probabilidadQuery
  const { data, isLoading, isError, error } = activeQuery

  const [editing, setEditing] = useState(false)
  const editor = useCourseEditor(course)

  const setCourse = useCallback(
    ({ next }: { next: CourseId }) => {
      sfx.iterate()
      const params = new URLSearchParams(searchParams.toString())
      params.set("course", next)
      router.replace(`/?${params.toString()}`)
    },
    [router, searchParams, sfx],
  )

  const goPrev = useCallback(() => {
    const idx = COURSE_ORDER.indexOf(course)
    const next = COURSE_ORDER[(idx - 1 + COURSE_ORDER.length) % COURSE_ORDER.length]
    setCourse({ next })
  }, [course, setCourse])

  const goNext = useCallback(() => {
    const idx = COURSE_ORDER.indexOf(course)
    const next = COURSE_ORDER[(idx + 1) % COURSE_ORDER.length]
    setCourse({ next })
  }, [course, setCourse])

  const beltOrder = useMemo(() => beltOrderFor({ course }), [course])

  const totals = data
    ? beltOrder.reduce(
        (acc, belt) => {
          const s = beltStats({ belt, topicStates: data.topic_states, course })
          acc.pendientes += s.pendientes
          acc.unlocked += s.unlocked
          return acc
        },
        { pendientes: 0, unlocked: 0 },
      )
    : null

  // One main session per day, but the user can keep reviewing while there are
  // still pending (due) items. Fresh users (no session yet) can always start.
  const mainSessionDoneToday = data?.main_session_done_today ?? false
  const canRepasar =
    totals !== null && (!mainSessionDoneToday || totals.pendientes > 0)

  const totalXp = leaderboard.data?.pages[0]?.me.total_xp
  const unitTotals = data
    ? courseUnitTotals({ topicStates: data.topic_states, course })
    : null
  const pendingNew = data
    ? actionableUnitCount({ topicStates: data.topic_states, course })
    : 0
  const pendingItems = data
    ? pendingUnitCount({ topicStates: data.topic_states, course })
    : 0

  // Cuando el home ya tiene todo para pintarse, avisamos al splash para que haga
  // su fade-out y deje ver el contenido (sin pasar por los skeletons).
  const contentReady = !!(data && totals && unitTotals)
  useEffect(() => {
    if (contentReady) markReady()
  }, [contentReady, markReady])

  function onRepasar() {
    sfx.start()
    startSession.mutate(
      { userName: user?.fullName ?? user?.firstName ?? "", course },
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

      <ScreenBody className="gap-4 py-4 no-scrollbar">
        {isLoading && <DashboardSkeleton />}
        {isError && (
          <Alert variant="destructive">
            <AlertDescription>
              No pudimos cargar tu progreso: {error.message}
            </AlertDescription>
          </Alert>
        )}

        {data && totals && unitTotals && (
          <motion.div
            className="flex flex-col gap-4"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}
          >
            <div className="flex flex-col gap-2">
            <CourseSwitcher
              course={course}
              onPrev={goPrev}
              onNext={goNext}
              editing={editing}
              onToggleEdit={() => setEditing((v) => !v)}
            />

            {editing ? (
              <LearningCountStepper
                value={data.active_cap}
                total={data.total_items}
                busy={editor.setCap.isPending}
                applyCap={(v) => editor.setCap.mutate(v)}
              />
            ) : (
              <div className="grid grid-cols-3 gap-2">
              <Metric
                label="Experiencia total"
                value={
                  totalXp !== undefined ? (
                    <span className="inline-flex items-center gap-1.5">
                      {totalXp.toLocaleString("es")}
                      <XpDots className="size-[0.85em] text-primary" />
                    </span>
                  ) : (
                    "…"
                  )
                }
              />
              <Metric
                label="Ítems desbloqueados"
                value={
                  <>
                    <CountUp
                      variant="ease"
                      value={unitTotals.unlocked}
                      duration={1000}
                    />
                    <span className="text-[0.75em] text-foreground/60">
                      {" "}
                      / {unitTotals.total}
                    </span>
                  </>
                }
              />
              <Metric
                label="Ítems pendientes"
                value={
                  <CountUp
                    variant="ease"
                    value={pendingNew}
                    duration={1000}
                  />
                }
                accent={
                  pendingItems > 0
                    ? ITEM_COLORS.pendiente
                    : pendingNew > 0
                      ? ITEM_COLORS.nuevo
                      : undefined
                }
              />
              </div>
            )}
            </div>

            {editing ? (
              <div className="flex flex-col gap-2">
                <AlertDialog>
                  <AlertDialogTrigger
                    render={
                      <Button size="lg" variant="outline" className={resetCourseCls}>
                        <RotateCcwIcon className="size-5" />
                        Reiniciar curso
                      </Button>
                    }
                  />
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-center font-sans">
                        ¿Reiniciar el curso?
                      </AlertDialogTitle>
                      <AlertDialogDescription className="text-center">
                        Tu progreso actual se archiva y empezás de cero. Tu cinturón va
                        a reflejar el nuevo progreso. El historial anterior se conserva.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogAction
                        className="h-10 w-full rounded-md border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-400"
                        onClick={() =>
                          editor.resetCourse.mutate(undefined, {
                            onSuccess: () => setEditing(false),
                          })
                        }
                      >
                        Reiniciar
                      </AlertDialogAction>
                      <AlertDialogCancel className="h-10 w-full rounded-md bg-background dark:bg-background">
                        Cancelar
                      </AlertDialogCancel>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <Button
                  size="lg"
                  variant="outline"
                  className={saveEditCls}
                  onClick={() => setEditing(false)}
                >
                  <CheckIcon className="size-5" />
                  Guardar cambios
                </Button>
              </div>
            ) : canRepasar ? (
              <Button
                size="lg"
                className={ctaCls}
                onClick={onRepasar}
                disabled={startSession.isPending}
              >
                {startSession.isPending && <Spinner />}
                {startSession.isPending
                  ? "Cargando…"
                  : totals.unlocked === 0
                    ? "Empezar mi primera sesión"
                    : totals.pendientes > 0
                      ? "Repasar"
                      : "Empezar sesión"}
              </Button>
            ) : (
              <Button
                size="lg"
                className={practiceCls}
                nativeButton={false}
                onClick={() => sfx.continue()}
                render={<Link href={`/practice?course=${course}`} />}
              >
                Practicar
              </Button>
            )}

            {startSession.isError && (
              <Alert variant="destructive">
                <AlertDescription>
                  No pudimos iniciar la sesión: {startSession.error.message}
                </AlertDescription>
              </Alert>
            )}

            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={`belts-${course}`}
                className="flex flex-col gap-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                {beltOrder.flatMap((belt) => {
                  const cat = getBelt({ key: belt, course })
                  return (cat?.units ?? []).map((unit) => (
                    <UnitSection
                      key={`${belt}/${unit.key}`}
                      belt={belt}
                      unit={unit}
                      course={course}
                      topicStates={data.topic_states}
                      editing={editing}
                      editor={editor}
                    />
                  ))
                })}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        )}
      </ScreenBody>

      {contentReady && (
        <motion.div
          className="shrink-0"
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut", delay: 0.18 }}
        >
          <BottomNav />
        </motion.div>
      )}
    </Screen>
  )
}

function DashboardSkeleton() {
  // Filas por contenedor, como los primeros cinturones reales (Funciones=7, Límites=6).
  const beltRows = [7, 6]
  return (
    <div className="flex animate-pulse flex-col gap-4">
      {/* 3 indicadores (mismo card: p-3, valor text-lg + label 2 líneas) */}
      <div className="grid grid-cols-3 gap-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="flex flex-col gap-1 rounded-md border border-white/10 bg-white/5 p-3"
          >
            <div className="h-[18px] w-12 rounded bg-white/10" />
            <div className="flex flex-col gap-2">
              <div className="h-2.5 w-full rounded bg-white/10" />
              <div className="h-2.5 w-2/3 rounded bg-white/10" />
            </div>
          </div>
        ))}
      </div>

      {/* botón Repasar */}
      <div className="h-12 w-full rounded-md bg-white/10" />

      {/* contenedores de unidad (p-4, gap-3; header título + ícono info) */}
      {beltRows.map((nRows, b) => (
        <div
          key={b}
          className="flex flex-col gap-3 rounded-md border border-white/10 p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="h-[18px] w-32 rounded bg-white/10" />
            <div className="size-7 rounded bg-white/10" />
          </div>
          <div className="flex flex-col gap-2.5">
            {Array.from({ length: nRows }).map((_, r) => (
              <div
                key={r}
                className="flex items-center justify-between gap-3"
              >
                <div className="h-3.5 w-24 rounded bg-white/10" />
                <div className="flex gap-1">
                  {[0, 1, 2].map((p) => (
                    <div key={p} className="h-6 w-9 rounded-md bg-white/10" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function topicEditState(ts: TopicStates[string] | undefined): TopicEditState {
  if (!ts) return "locked"
  if (ts.suspended) return "suspended"
  return "unlocked"
}

function UnitSection({
  belt,
  unit,
  topicStates,
  course = "analisis",
  editing = false,
  editor,
}: {
  belt: BeltKey
  unit: { key: string; name: string; description?: string; topics: Topic[] }
  topicStates: TopicStates
  course?: CourseId
  editing?: boolean
  editor?: ReturnType<typeof useCourseEditor>
}) {
  const playable = unit.topics.filter((topic) => topic.skills.length > 0)

  // Modo editor: mostrar TODOS los temas (incluidos bloqueados y suspendidos)
  // con sus tres acciones.
  if (editing && editor) {
    return (
      <section className="flex flex-col gap-3 rounded-md border border-white/10 p-4">
        <div className="flex items-start justify-between gap-3">
          <span
            className="text-lg font-semibold leading-tight"
            style={{ color: BELT_COLOR[belt] }}
          >
            {unit.name}
          </span>
          {unit.description && (
            <UnitInfoDialog name={unit.name} description={unit.description} />
          )}
        </div>
        <div className="flex flex-col gap-2.5">
          {playable.map((topic) => (
            <CourseEditorRow
              key={topic.key}
              label={topicShortLabel({ topic: topic.key, course, fallback: topic.name })}
              description={topic.short_description ?? topic.tooltip}
              state={topicEditState(topicStates[`${belt}/${topic.key}`])}
              onAdvance={() => editor.advance.mutate({ belt, topic: topic.key })}
              onSuspend={() => editor.suspend.mutate({ belt, topic: topic.key })}
              onReset={() => editor.resetTopic.mutate({ belt, topic: topic.key })}
            />
          ))}
        </div>
      </section>
    )
  }

  // Modo normal: ocultar temas suspendidos; si la unidad entera quedó suspendida,
  // no renderizar su contenedor.
  const visible = playable.filter(
    (topic) => !topicStates[`${belt}/${topic.key}`]?.suspended,
  )
  const anySuspended = playable.some(
    (topic) => topicStates[`${belt}/${topic.key}`]?.suspended,
  )
  if (visible.length === 0 && anySuspended) return null

  const rows: BeltGridRow[] = visible.map((topic) => ({
    topic,
    cells: topicToCells({
      topic: topicStates[`${belt}/${topic.key}`],
      types: topic.skills,
    }),
  }))

  const isActive = rows.some(({ cells }) =>
    cells.some((c) => c.cell.kind !== "empty"),
  )

  return (
    <section
      className={cn(
        "flex flex-col gap-3 rounded-md border p-4",
        isActive ? "border-white/10" : "border-white/15 bg-white/5 opacity-60",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className="text-lg font-semibold leading-tight"
          style={{ color: BELT_COLOR[belt] }}
        >
          {unit.name}
        </span>
        {unit.description && (
          <UnitInfoDialog name={unit.name} description={unit.description} />
        )}
      </div>

      {rows.length > 0 && <BeltGrid rows={rows} showState />}
    </section>
  )
}

function UnitInfoDialog({
  name,
  description,
}: {
  name: string
  description: string
}) {
  return (
    <Dialog>
      <DialogTrigger
        render={<Button variant="ghost" size="icon-sm" />}
        aria-label={`Información de ${name}`}
      >
        <InfoIcon className="size-4 text-muted-foreground" />
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader className="gap-0.5">
          <DialogTitle className="font-sans text-sm font-semibold text-foreground">
            {name}
          </DialogTitle>
          <DialogDescription className="whitespace-pre-line text-sm leading-relaxed text-foreground/80">
            <MathText text={description} />
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  )
}
