"use client"

import { BottomNav } from "@/components/bottom-nav"
import { CountUp } from "@/components/count-up"
import { XpDots } from "@/components/xp-dots"
import {
  BeltGrid,
  ITEM_COLORS,
  topicToCells,
  type BeltGridRow,
} from "@/components/belt-grid"
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
  beltInfo,
  beltLabel,
  BELT_ORDER,
  getBelt,
  type BeltKey,
} from "@/lib/catalog"
import {
  actionableUnitCount,
  beltStats,
  courseUnitTotals,
  pendingUnitCount,
} from "@/lib/catalog/stats"
import { useSplash } from "@/app/splash-context"
import { useUser } from "@clerk/nextjs"
import { InfoIcon } from "lucide-react"
import { motion, useReducedMotion } from "motion/react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { useLeaderboard } from "./(app)/leaderboard/UseLeaderboard"
import { useStartSession } from "./UseStartSession"
import { useUserProgress } from "./UseUserProgress"

type TopicStates = Record<string, components["schemas"]["TopicProgress"]>

const ctaCls =
  "h-12 w-full rounded-md bg-white text-black hover:bg-white/90 hover:text-black"

// Variante del CTA blanco con un leve tinte violeta (modo Zen / práctica libre).
const zenCls =
  "h-12 w-full rounded-md bg-[#E9E3FB] text-[#3B1E73] hover:bg-[#E1D8FA] hover:text-[#3B1E73]"

// Color del título de cada unidad, tomado del cinturón correspondiente.
const BELT_COLOR: Record<BeltKey, string> = {
  white: "#E5E7EB",
  blue: "#2563EB",
  violet: "#A78BFA",
  brown: "#693F1C",
  black: "#9CA3AF",
}

export default function DashboardEntry() {
  const { data, isLoading, isError, error } = useUserProgress()
  const leaderboard = useLeaderboard()
  const { user } = useUser()
  const router = useRouter()
  const startSession = useStartSession()
  const sfx = useSfx()
  const { markReady } = useSplash()
  const reduceMotion = useReducedMotion()

  const totals = data
    ? BELT_ORDER.reduce(
        (acc, belt) => {
          const s = beltStats({ belt, topicStates: data.topic_states })
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

  const totalXp = leaderboard.data?.entries.find((e) => e.is_current_user)
    ?.total_xp
  const unitTotals = data
    ? courseUnitTotals({ topicStates: data.topic_states })
    : null
  const pendingNew = data
    ? actionableUnitCount({ topicStates: data.topic_states })
    : 0
  const pendingItems = data
    ? pendingUnitCount({ topicStates: data.topic_states })
    : 0

  // Cuando el home ya tiene todo para pintarse, avisamos al splash para que haga
  // su fade-out y deje ver el contenido (sin pasar por los skeletons).
  const contentReady = !!(data && totals && unitTotals)
  useEffect(() => {
    if (contentReady) markReady()
  }, [contentReady, markReady])

  function onRepasar() {
    sfx.continue()
    startSession.mutate(
      { userName: user?.fullName ?? user?.firstName ?? "" },
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
                    {unitTotals.unlocked}
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
                  <CountUp variant="ease" value={pendingNew} duration={1000} />
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

            {canRepasar ? (
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
                className={zenCls}
                nativeButton={false}
                onClick={() => sfx.continue()}
                render={<Link href="/zen" />}
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

            <div className="flex flex-col gap-4">
              {BELT_ORDER.map((belt) => (
                <BeltSection
                  key={belt}
                  belt={belt}
                  topicStates={data.topic_states}
                />
              ))}
            </div>
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

function Metric({
  label,
  value,
  accent,
}: {
  label: string
  value: React.ReactNode
  accent?: string
}) {
  return (
    <div
      className="flex flex-col gap-1 rounded-md border border-white/10 bg-white/5 p-3"
      style={
        accent
          ? {
              color: accent,
              borderColor: `${accent}99`,
              backgroundColor: `${accent}33`,
            }
          : undefined
      }
    >
      <span className="text-lg font-semibold tabular-nums leading-none">
        {value}
      </span>
      <span
        className={cn(
          "text-[0.7rem] leading-tight",
          accent ? "opacity-80" : "text-foreground/60",
        )}
      >
        {label}
      </span>
    </div>
  )
}

function BeltSection({
  belt,
  topicStates,
}: {
  belt: BeltKey
  topicStates: TopicStates
}) {
  const cat = getBelt({ key: belt })
  const stats = beltStats({ belt, topicStates })
  const info = beltInfo({ belt })
  const isActive = stats.unlocked > 0

  // Ocultamos temas sin ejercicios todavía (p.ej. Módulo): se mostrarán recién
  // cuando su banco esté cargado.
  const rows: BeltGridRow[] = (cat?.topics ?? [])
    .filter((topic) => topic.exercise_types.length > 0)
    .map((topic) => ({
      topic,
      cells: topicToCells({
        topic: topicStates[topic.key],
        types: topic.exercise_types,
      }),
    }))

  return (
    <section
      className={cn(
        "flex flex-col gap-3 rounded-md border p-4",
        isActive ? "border-white/10" : "border-white/15 bg-white/5 opacity-60",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <span
            className="text-lg font-semibold leading-tight"
            style={{ color: BELT_COLOR[belt] }}
          >
            {info.headline}
          </span>
        </div>
        <BeltInfoDialog
          beltName={beltLabel({ belt })}
          headline={info.headline}
          description={info.description}
        />
      </div>

      {rows.length > 0 && <BeltGrid rows={rows} showState />}
    </section>
  )
}

function BeltInfoDialog({
  beltName,
  headline,
  description,
}: {
  beltName: string
  headline: string
  description: string
}) {
  return (
    <Dialog>
      <DialogTrigger
        render={<Button variant="ghost" size="icon-sm" />}
        aria-label={`Información de ${beltName}`}
      >
        <InfoIcon className="size-4 text-muted-foreground" />
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader className="gap-0.5">
          <DialogTitle className="font-sans text-sm font-semibold text-foreground">
            {headline}
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed text-foreground/80">
            {description}
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  )
}
