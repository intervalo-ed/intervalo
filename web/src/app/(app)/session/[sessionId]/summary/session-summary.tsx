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
import { BELT_VIVID_COLORS } from "@/lib/catalog"
import { queryKeys } from "@/lib/query/keys"
import { clearSession } from "@/lib/session/storage"
import { useSfx, useTick } from "@/lib/audio/useSfx"
import { useSummary } from "./UseSummary"

const ctaCls =
  "h-[var(--cta-h)] w-full rounded-md bg-white text-black hover:bg-white/90 hover:text-black"

export default function SessionSummary({ sessionId }: { sessionId: string }) {
  const { data, isError, error } = useSummary({ sessionId })
  const qc = useQueryClient()
  const router = useRouter()
  const sfx = useSfx()
  const tick = useTick() // reloj — conteo de XP
  const tickEx = useTick("/tick_clink.mp3") // click mecánico — conteo de ejercicios
  const [showCards, setShowCards] = useState(false)
  const [showRight, setShowRight] = useState(false)
  const [showButton, setShowButton] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  // Secuencia, medida desde que se monta el resumen (≈ desde el tap, que dispara
  // el sonido de "carga" ascendente):
  //   t=1000ms → aparece la bolita blanca cargando energía + arranca el sonido `end`
  //   t=1800ms → la bolita explota en el confeti + "¡Listo!" + las cards
  const [showBall, setShowBall] = useState(false)
  const [exploded, setExploded] = useState(false)
  const sfxRef = useRef(sfx)
  sfxRef.current = sfx
  useEffect(() => {
    const t1 = setTimeout(() => {
      setShowBall(true)
      sfxRef.current.end()
    }, 1000)
    const t2 = setTimeout(() => setExploded(true), 1800)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [])

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
        {showBall && !exploded && <ChargeBall />}
        {/* El doble de la XP obtenida, acotado para cuidar el rendimiento. */}
        {showConfetti && (
          <Confetti
            count={Math.min(140, Math.max(10, (data?.xp_earned ?? 0) * 2))}
          />
        )}
        <div className="relative w-full -translate-y-[15px]">
          {data && exploded && (
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
                        duration={1000}
                        steps={7}
                        // Saltos que arrancan lentos y terminan rápidos: cada
                        // salto dispara un tick del reloj con pitch ascendente,
                        // sincronizado con el número que sube.
                        stepEase={(x) => 1 - Math.pow(1 - x, 1.7)}
                        onStep={(step, total) =>
                          tick(0.9 + ((step - 1) / Math.max(1, total - 1)) * 0.6)
                        }
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
                          // Cada ejercicio contado dispara el click mecánico con
                          // pitch ascendente, sincronizado con el número.
                          onStep={(step, total) =>
                            tickEx(
                              0.9 + ((step - 1) / Math.max(1, total - 1)) * 0.6,
                            )
                          }
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

      <div className="shrink-0 px-5 pt-[var(--cta-pt)] pb-[var(--cta-pb)]">
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

// Cuadradito que "carga energía": crece su área en 7 ticks discretos (no inflándose
// suave) desde apenas visible hasta su máximo, repartidos en ~0.8 s, justo antes
// de explotar en el confeti. En cada tick salta de tamaño, rota un poco más y
// cambia de color secuencialmente con los mismos colores del confeti (BELT_COLORS).
// Nace centrado, igual que el confeti.
const CHARGE_SCALES = [
  0.08, 0.13, 0.18, 0.24, 0.3, 0.36, 0.42, 0.48, 0.54, 0.6, 0.66,
]

function ChargeBall() {
  const [step, setStep] = useState(0)
  useEffect(() => {
    const last = CHARGE_SCALES.length - 1
    const stepMs = 800 / last
    let k = 0
    const id = setInterval(() => {
      k++
      setStep(k)
      if (k >= last) clearInterval(id)
    }, stepMs)
    return () => clearInterval(id)
  }, [])
  const i = Math.min(step, CHARGE_SCALES.length - 1)
  return (
    <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center">
      <div
        style={{
          width: 28,
          height: 28,
          background: BELT_COLORS[i % BELT_COLORS.length],
          transform: `scale(${CHARGE_SCALES[i]}) rotate(${i * 35}deg)`,
        }}
      />
    </div>
  )
}

// Colores de los cinturones, avivados para que resalten sobre el fondo oscuro.
const BELT_COLORS = BELT_VIVID_COLORS

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
  grav: number
  alive: boolean
}

// Explosión radial: todas las partículas (cuadraditos) nacen en el centro de la
// pantalla y salen disparadas en todas direcciones a gran velocidad, con algo de
// gravedad y rotación. RAF puro, sin dependencias.
function Confetti({ count }: { count: number }) {
  const stateRef = useRef<Particle[]>(
    Array.from({ length: count }, (_, i) => {
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
        // Gravedad propia de cada partícula: unas caen pesado, otras flotan.
        grav: 45 + Math.random() * 130,
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
          vy: p.vy * drag + p.grav * dt,
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
              mixBlendMode: "screen",
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
