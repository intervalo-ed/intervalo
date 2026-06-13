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
import { useSfx } from "@/lib/audio/useSfx"
import { useSummary } from "./UseSummary"

const ctaCls =
  "h-12 w-full rounded-md bg-white text-black hover:bg-white/90 hover:text-black"

export default function SessionSummary({ sessionId }: { sessionId: string }) {
  const { data, isError, error } = useSummary({ sessionId })
  const qc = useQueryClient()
  const router = useRouter()
  const sfx = useSfx()
  const [showCards, setShowCards] = useState(false)
  const [showRight, setShowRight] = useState(false)
  const [showButton, setShowButton] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)

  function goHome() {
    sfx.continue()
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
        {showConfetti && <Confetti />}
        <div className="relative w-full -translate-y-[15px]">
          {data && (
            <motion.span
              className="block text-center text-3xl font-bold tracking-tight"
              initial={{ opacity: 0, scale: 0.4 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 600, damping: 18 }}
              onAnimationStart={() => setShowConfetti(true)}
              onAnimationComplete={() => setShowCards(true)}
            >
              ¡Listo!
            </motion.span>
          )}

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

// Colores de los cinturones (blanco, azul, violeta, marrón, negro), avivados
// un poco para que resalten sobre el fondo oscuro.
const BELT_COLORS = [
  "#EDE9DC", // blanco
  "#3B6FE0", // azul
  "#9B4DD6", // violeta
  "#B5733F", // marrón
  "#C9CDD6", // negro (gris claro para que se vea)
]

type Particle = {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  color: string
  size: number
  rot: number
  vrot: number
  alive: boolean
}

// Explosión radial: todas las partículas nacen en el centro de la pantalla y
// salen disparadas en todas direcciones a gran velocidad, con algo de gravedad
// y rotación. Animado con requestAnimationFrame, sin dependencias externas.
function Confetti() {
  const stateRef = useRef<Particle[]>(
    Array.from({ length: 110 }, (_, i) => {
      const angle = Math.random() * Math.PI * 2
      const speed = 90 + Math.random() * 150 // % de viewport por segundo
      return {
        id: i,
        x: 50,
        y: 50,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: BELT_COLORS[i % BELT_COLORS.length],
        size: 6 + Math.random() * 9,
        rot: Math.random() * 360,
        vrot: (Math.random() - 0.5) * 900,
        alive: true,
      }
    }),
  )
  const [, setTick] = useState(0)
  const rafRef = useRef<number | null>(null)
  const lastRef = useRef<number | null>(null)

  useEffect(() => {
    const animate = (ts: number) => {
      if (lastRef.current === null) lastRef.current = ts
      const dt = Math.min((ts - lastRef.current) / 1000, 0.05)
      lastRef.current = ts
      let anyAlive = false
      stateRef.current = stateRef.current.map((p) => {
        if (!p.alive) return p
        const nx = p.x + p.vx * dt
        const ny = p.y + p.vy * dt
        // Frenado del aire para que la explosión sea veloz al inicio y se calme.
        const drag = Math.pow(0.12, dt)
        const alive = nx > -15 && nx < 115 && ny < 120
        if (alive) anyAlive = true
        return {
          ...p,
          x: nx,
          y: ny,
          vx: p.vx * drag,
          vy: p.vy * drag + 90 * dt,
          rot: p.rot + p.vrot * dt,
          alive,
        }
      })
      setTick((t) => t + 1)
      if (anyAlive) rafRef.current = requestAnimationFrame(animate)
    }
    rafRef.current = requestAnimationFrame(animate)
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {stateRef.current
        .filter((p) => p.alive)
        .map((p) => (
          <div
            key={p.id}
            className="absolute rounded-[2px]"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.size,
              height: p.size,
              background: p.color,
              transform: `rotate(${p.rot}deg)`,
            }}
          />
        ))}
    </div>
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
