"use client"

import { BottomNav } from "@/components/bottom-nav"
import { Accordion } from "@/components/ui/accordion"
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
import { Progress } from "@/components/ui/progress"
import { Screen, ScreenBody, ScreenHeader } from "@/components/ui/screen"
import { Spinner } from "@/components/ui/spinner"
import { useSfx } from "@/lib/audio/UseSfx"
import { BELT_ORDER } from "@/lib/catalog"
import { beltStats, currentBelt } from "@/lib/catalog/stats"
import { useUser } from "@clerk/nextjs"
import { HelpCircle } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Logo } from "@/components/logo"
import BeltCard from "./belt-card"
import { useStartSession } from "./UseStartSession"
import { useUserProgress } from "./UseUserProgress"

export default function DashboardEntry() {
  const { data, isLoading, isError, error } = useUserProgress()
  const { user } = useUser()
  const router = useRouter()
  const startSession = useStartSession()
  const sfx = useSfx()

  const totals = data
    ? BELT_ORDER.reduce(
        (acc, belt) => {
          const s = beltStats({ belt, topicStates: data.topic_states })
          acc.pendientes += s.pendientes
          acc.nuevos += s.nuevos
          acc.aprendiendo += s.aprendiendo
          acc.unlocked += s.unlocked
          return acc
        },
        { pendientes: 0, nuevos: 0, aprendiendo: 0, unlocked: 0 },
      )
    : null

  // Disable starting when the user has unlocked topics but nothing is due —
  // they need to wait until the next repetition. Fresh users (unlocked === 0)
  // can still start: the backend's first /session/start seeds initial topics.
  const waitingForNextRepetition =
    totals !== null && totals.unlocked > 0 && totals.pendientes === 0
  const mainSessionDoneToday = data?.main_session_done_today ?? false
  const canRepasar =
    totals !== null && !waitingForNextRepetition && !mainSessionDoneToday

  function onRepasar() {
    sfx.start()
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
          <Logo className="h-6 w-auto" />
        </Link>
      </ScreenHeader>

      <ScreenBody className="gap-8">
        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Spinner />
            <span>Cargando progreso…</span>
          </div>
        )}
        {isError && (
          <Alert variant="destructive">
            <AlertDescription>
              No pudimos cargar tu progreso: {error.message}
            </AlertDescription>
          </Alert>
        )}
        {data && (
          <div>
            <h1 className="text-3xl font-semibold">
              Nivel {data.level_info.level}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {data.level_info.xp_in_level} / {data.level_info.xp_required} XP
            </p>
            <Progress
              value={data.level_info.progress_pct}
              className="mt-3 w-64"
            />
          </div>
        )}

        {totals && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button
                size="lg"
                className="h-12 sm:flex-1"
                onClick={onRepasar}
                disabled={!canRepasar || startSession.isPending}
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
              <Button
                variant="outline"
                size="lg"
                className="h-12"
                nativeButton={false}
                render={<Link href="/zen" />}
              >
                Modo Zen
              </Button>
            </div>
            {!canRepasar && !startSession.isPending && (
              <Dialog>
                <DialogTrigger
                  render={
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 self-start text-sm text-muted-foreground transition-colors hover:text-foreground"
                    />
                  }
                >
                  <HelpCircle className="size-4" />
                  ¿Por qué no puedo repasar?
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Nada para repasar por hoy</DialogTitle>
                    <DialogDescription>
                      Ya completaste todo lo que tenías que repasar hoy. Volvé
                      mañana para tu próxima sesión, o usá el Modo Zen para
                      practicar libremente cuando quieras.
                    </DialogDescription>
                  </DialogHeader>
                </DialogContent>
              </Dialog>
            )}
          </div>
        )}

        {startSession.isError && (
          <Alert variant="destructive">
            <AlertDescription>
              No pudimos iniciar la sesión: {startSession.error.message}
            </AlertDescription>
          </Alert>
        )}

        {data && (
          <section className="flex flex-col gap-3">
            <h2 className="text-xl font-semibold">Cinturones</h2>
            <Accordion
              multiple
              defaultValue={(() => {
                const cur = currentBelt({ topicStates: data.topic_states })
                return cur ? [cur] : []
              })()}
              className="flex flex-col"
            >
              {BELT_ORDER.map((belt) => (
                <BeltCard
                  key={belt}
                  belt={belt}
                  topicStates={data.topic_states}
                />
              ))}
            </Accordion>
          </section>
        )}
      </ScreenBody>

      <BottomNav />
    </Screen>
  )
}
