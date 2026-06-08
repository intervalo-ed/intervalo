"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "motion/react"
import { useQueryClient } from "@tanstack/react-query"
import { CountUp } from "@/components/count-up"
import { XpDots } from "@/components/xp-dots"
import { Alert, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Screen, ScreenBody } from "@/components/ui/screen"
import { cn } from "@/lib/utils"
import { queryKeys } from "@/lib/query/keys"
import { clearSession } from "@/lib/session/storage"
import { useSummary } from "./UseSummary"

const ctaCls =
  "h-12 w-full rounded-md bg-white text-black hover:bg-white/90 hover:text-black"

export default function SessionSummary({ sessionId }: { sessionId: string }) {
  const { data, isError, error } = useSummary({ sessionId })
  const qc = useQueryClient()
  const router = useRouter()
  const [showCards, setShowCards] = useState(false)
  const [showRight, setShowRight] = useState(false)
  const [showButton, setShowButton] = useState(false)

  function goHome() {
    router.push("/")
    // Bust the App Router segment cache so the / RSC re-runs on arrival.
    router.refresh()
  }

  // Once the summary lands the session is finished server-side; clear stash
  // and refresh dashboard data on the way back. `refetchType: "all"` forces
  // refetch even though no observer is mounted yet — without it the dashboard
  // hits its cache on return and shows stale state.
  useEffect(() => {
    if (!data) return
    clearSession({ id: sessionId })
    qc.invalidateQueries({
      queryKey: queryKeys.userProgress(),
      refetchType: "all",
    })
  }, [data, sessionId, qc])

  if (isError) {
    return (
      <Screen>
        <ScreenBody className="items-center justify-center text-center">
          <div className="flex flex-col items-center gap-4">
            <Alert variant="destructive">
              <AlertTitle>
                {error?.message ?? "No pudimos cargar el resumen"}
              </AlertTitle>
            </Alert>
            <Button variant="outline" onClick={goHome}>
              Volver al inicio
            </Button>
          </div>
        </ScreenBody>
      </Screen>
    )
  }

  return (
    <Screen>
      <ScreenBody className="items-center justify-center">
        {/* El título queda centrado en pantalla y fijo; las cards aparecen
            posicionadas en absoluto debajo, sin re-centrar el título. */}
        <div className="relative w-full -translate-y-[15px]">
          <Typewriter
            text="¡Listo!"
            start={!!data}
            className="block text-center text-3xl font-bold tracking-tight"
            onDone={() => setShowCards(true)}
          />

          {data && showCards && (
            <div className="absolute inset-x-0 top-full mt-8 grid translate-y-[35px] grid-cols-2 gap-2">
              {/* Carga primero la card izquierda (aparece + cuenta) y, al
                  terminar su conteo, recién aparece la derecha. */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: "easeOut" }}
              >
                <Metric
                  label="Experiencia obtenida"
                  value={
                    <span className="inline-flex items-center gap-1.5">
                      <CountUp
                        variant="steps"
                        value={data.xp_earned}
                        duration={700}
                        steps={7}
                        onDone={() => setShowRight(true)}
                      />
                      <XpDots className="size-[0.85em] text-primary" />
                    </span>
                  }
                />
              </motion.div>

              {showRight && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, ease: "easeOut" }}
                >
                  <Metric
                    label={
                      <>
                        Ejercicios
                        <br />
                        correctos
                      </>
                    }
                    value={
                      <>
                        <CountUp
                          variant="steps"
                          value={data.first_try_correct}
                          duration={700}
                          steps={7}
                          onDone={() => setShowButton(true)}
                        />
                        <span className="text-[0.75em] text-foreground/60">
                          {" "}
                          / {data.total}
                        </span>
                      </>
                    }
                  />
                </motion.div>
              )}
            </div>
          )}
        </div>
      </ScreenBody>

      <div className="shrink-0 p-5">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: showButton ? 1 : 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="mx-auto w-full max-w-2xl"
        >
          <Button
            size="lg"
            className={ctaCls}
            onClick={goHome}
            disabled={!showButton}
          >
            Continuar
          </Button>
        </motion.div>
      </div>
    </Screen>
  )
}

function Typewriter({
  text,
  speed = 110,
  start = true,
  className,
  onDone,
}: {
  text: string
  speed?: number
  start?: boolean
  className?: string
  onDone?: () => void
}) {
  const [count, setCount] = useState(0)
  const doneRef = useRef(false)
  useEffect(() => {
    if (!start) return
    if (count >= text.length) {
      if (!doneRef.current) {
        doneRef.current = true
        onDone?.()
      }
      return
    }
    const id = setTimeout(() => setCount((c) => c + 1), speed)
    return () => clearTimeout(id)
  }, [start, count, text.length, speed, onDone])

  const done = start && count >= text.length
  return (
    <span className={className}>
      {text.slice(0, count)}
      {!done && (
        <motion.span
          aria-hidden
          className="ml-1 inline-block h-[0.85em] w-[3px] translate-y-[1px] bg-current align-middle"
          animate={{ opacity: [1, 1, 0, 0] }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: "linear",
            times: [0, 0.5, 0.5, 1],
          }}
        />
      )}
    </span>
  )
}

function Metric({
  label,
  value,
}: {
  label: React.ReactNode
  value: React.ReactNode
}) {
  return (
    <div className="flex min-h-[168px] flex-col items-center justify-center gap-4 rounded-md border border-white/10 bg-white/5 p-4 text-center">
      <span className="text-3xl font-semibold tabular-nums leading-none">
        {value}
      </span>
      <span className={cn("text-sm leading-tight text-foreground/60")}>
        {label}
      </span>
    </div>
  )
}
