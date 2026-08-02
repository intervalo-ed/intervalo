"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { AnimatePresence, motion } from "motion/react"
import { useQueryClient } from "@tanstack/react-query"
import { BellIcon, ClockIcon, DownloadIcon } from "lucide-react"
import { CountUp } from "@/components/count-up"
import { XpDots } from "@/components/xp-dots"
import { Alert, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { InstallDialog } from "@/components/install-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Screen, ScreenBody } from "@/components/ui/screen"
import { cn } from "@/lib/utils"
import { BELT_VIVID_COLORS } from "@/lib/catalog"
import { queryKeys } from "@/lib/query/keys"
import { clearSession } from "@/lib/session/storage"
import { setRankingNews } from "@/lib/nav/ranking-news"
import { setProfileNews } from "@/lib/nav/profile-news"
import { markNotifyHintSeen, useNotifyHintUnseen } from "@/lib/nav/notify-hint-seen"
import { isPushSupported } from "@/lib/push/register"
import {
  DEFAULT_REMINDER_TIME,
  REMINDER_TIME_OPTIONS,
  useEnableNotifications,
} from "@/lib/push/UseEnableNotifications"
import { useNotificationSettingsQuery } from "@/app/(app)/profile/UseNotificationSettings"
import { isStandalone, usePlatform } from "@/lib/platform/detect"
import { useSfx, useTick } from "@/lib/audio/useSfx"
import type { components } from "@/lib/api/schema"
import { useSummary } from "./UseSummary"

const ctaCls =
  "h-[var(--cta-h)] w-full rounded-md bg-white text-black hover:bg-white/90 hover:text-black"

// Mismo deslizamiento horizontal que entre ejercicios de la sesión (ver
// session-runner.tsx): cada fase (resumen → racha → notificaciones) entra
// desde la derecha, sin fundido.
const slideVariants = {
  enter: { x: "100%", opacity: 1 },
  center: { x: "0%", opacity: 1 },
  exit: { x: "-100%", opacity: 1 },
}

export default function SessionSummary({ sessionId }: { sessionId: string }) {
  const { data, isError, error } = useSummary({ sessionId })
  const qc = useQueryClient()
  const router = useRouter()
  const sfx = useSfx()
  const tick = useTick() // reloj — conteo de XP y de ejercicios (mismo sonido)
  // Si no se respondió ningún ejercicio bien, los conteos no hacen tick (sí
  // suena el `end`).
  const noCorrect = data ? data.first_try_correct === 0 : false
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
  // Panel de racha: aparece tras Continuar, solo si esta sesión fue la primera
  // completada hoy (`counted_today`, una vez por día de actividad). El de
  // notificaciones lo sigue, pero solo una vez por dispositivo, si el
  // navegador soporta push y todavía no están activadas.
  const [phase, setPhase] = useState<"summary" | "streak" | "notify">("summary")
  const [pushSupported, setPushSupported] = useState(false)
  useEffect(() => {
    setPushSupported(isPushSupported())
  }, [])
  const notifyUnseen = useNotifyHintUnseen()
  const settings = useNotificationSettingsQuery()
  const notifAlreadyEnabled = settings.data?.enabled === true
  const shouldShowStreak = data?.streak.counted_today === true
  const shouldShowNotify = pushSupported && notifyUnseen && !notifAlreadyEnabled
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

  // El botón Continuar queda gris 3s al entrar a la pestaña de notificaciones,
  // salvo que el usuario ya las haya activado ahí mismo (`notifJustEnabled`).
  const [notifWaiting, setNotifWaiting] = useState(false)
  const [notifJustEnabled, setNotifJustEnabled] = useState(false)
  useEffect(() => {
    if (phase !== "notify") return
    setNotifWaiting(true)
    const t = setTimeout(() => setNotifWaiting(false), 4000)
    return () => clearTimeout(t)
  }, [phase])
  const notifyButtonDisabled =
    phase === "notify" && notifWaiting && !notifJustEnabled

  function onContinue() {
    if (phase === "summary") {
      sfx.continue()
      if (shouldShowStreak) {
        setPhase("streak")
      } else if (shouldShowNotify) {
        setPhase("notify")
      } else {
        goHome()
      }
      return
    }
    if (phase === "streak") {
      if (shouldShowNotify) {
        sfx.continue()
        setPhase("notify")
        return
      }
      goHome()
      return
    }
    // Desde la pestaña de notificaciones el destino es Perfil, donde se puede
    // ajustar el horario (o activar, si se instaló la app recién).
    markNotifyHintSeen()
    sfx.continue()
    router.push("/profile")
    router.refresh()
  }

  function goHome() {
    sfx.continue()
    // La sesión de práctica vuelve a Practicar; el resto (repaso, test)
    // vuelve a Repasar. En ambos casos, al curso en el que se estaba.
    const base = data?.mode === "practice" ? "/practice" : "/"
    const dest = data?.course ? `${base}?course=${data.course}` : base
    router.push(dest)
    // Bust the App Router segment cache so the destination RSC re-runs on arrival.
    router.refresh()
  }

  // Once the summary lands the session is finished server-side; clear stash
  // and refresh dashboard data on the way back. `refetchType: "all"` forces
  // refetch even though no observer is mounted yet — without it the dashboard
  // hits its cache on return and shows stale state.
  useEffect(() => {
    if (!data) return
    clearSession({ id: sessionId })
    // Terminó la sesión → cambió tu XP/posición (ranking) y podés tener un badge
    // nuevo desbloqueable (perfil): reaparecen ambos puntitos.
    setRankingNews(true)
    setProfileNews(true)
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
        {/* Cada fase (resumen → racha → notificaciones) entra deslizándose
            desde la derecha, igual que entre ejercicios de la sesión — salvo la
            fase inicial (resumen), que no desliza (aparece tal cual, como
            siempre). Ojo: NO usar `initial={false}` en el AnimatePresence acá,
            porque ese flag suprime la animación de entrada de TODOS los
            motion.* anidados en su primer render (el spring de "¡Listo!" y las
            cards dejarían de animar y sus onAnimationComplete no dispararían
            nunca, colgando el resumen). En cambio, el propio wrapper de fase
            recibe `initial={false}` solo quando es la fase "summary" — eso
            únicamente apaga SU animación de deslizamiento, sin afectar a sus
            hijos. */}
        {/* `min-h-full` fija la altura de la fila al espacio disponible, igual
            que en session-runner.tsx: sin esto, el cambio de fase (contenidos
            de distinta altura) resizea la fila del grid y el contenido
            saliente se ve "saltar" verticalmente antes de deslizar. */}
        <div className="grid min-h-full w-full grid-cols-1 items-center">
          <AnimatePresence mode="sync">
            <motion.div
              key={phase}
              variants={slideVariants}
              initial={phase === "summary" ? false : "enter"}
              animate="center"
              exit="exit"
              transition={{ duration: 0.28, ease: "easeInOut" }}
              className="col-start-1 row-start-1 w-full"
            >
              {phase === "streak" && data && (
                <StreakPane streak={data.streak} tick={tick} />
              )}
              {phase === "notify" && (
                <NotifyHintPane
                  settingsLoading={settings.isLoading}
                  onEnabled={() => setNotifJustEnabled(true)}
                />
              )}
              {phase === "summary" && (
                <div className="relative w-full -translate-y-[15px]">
                  {data && exploded && (
            <>
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
              <motion.p
                className="mt-1.5 text-center text-sm text-foreground/60"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, ease: "easeOut", delay: 0.15 }}
              >
                Completaste tu sesión número {data.session_number}.
              </motion.p>
            </>
          )}

          {data && showCards && (
            <div className="absolute inset-x-0 top-full mt-2 grid translate-y-[9px] grid-cols-2 gap-2">
              {/* Carga primero la card izquierda (aparece + cuenta) y, al
                  terminar su conteo, recién aparece la derecha. */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: "easeOut" }}
              >
                <Metric
                  label={
                    <>
                      Experiencia
                      <br />
                      obtenida
                    </>
                  }
                  value={
                    <span className="inline-flex items-center gap-1.5">
                      <CountUp
                        variant="steps"
                        value={data.xp_earned}
                        duration={1300}
                        // Menos ticks cuando hay poca XP: <6 → 3, <12 → 4, resto 7.
                        steps={
                          data.xp_earned < 6 ? 3 : data.xp_earned < 12 ? 4 : 7
                        }
                        // Saltos que arrancan lentos y se aceleran (estirados):
                        // cada salto dispara un tick del reloj con pitch
                        // ascendente, sincronizado con el número que sube.
                        stepEase={(x) => 1 - Math.pow(1 - x, 1.7)}
                        onStep={(step, total) => {
                          if (noCorrect) return
                          tick(0.9 + ((step - 1) / Math.max(1, total - 1)) * 0.6)
                        }}
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
                          duration={1300}
                          steps={7}
                          // Mismo sonido y ritmo que el conteo de XP: tick de
                          // reloj con pitch ascendente, arrancando lento y
                          // acelerando (estirado), sincronizado con el número.
                          stepEase={(x) => 1 - Math.pow(1 - x, 1.7)}
                          onStep={(step, total) => {
                            if (noCorrect) return
                            tick(
                              0.9 + ((step - 1) / Math.max(1, total - 1)) * 0.6,
                            )
                          }}
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
              )}
            </motion.div>
          </AnimatePresence>
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
            onClick={onContinue}
            disabled={!showButton || notifyButtonDisabled}
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

// Energía retenida en cada rebote contra los bordes de la pantalla (0-1): más
// bajo = pierde más velocidad por choque, hasta casi frenar en x.
const WALL_RESTITUTION = 0.65

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
        let nx = p.x + p.vx * dt
        const ny = p.y + p.vy * dt
        // Frenado del aire para que la explosión sea veloz al inicio y se calme.
        const drag = Math.pow(0.12, dt)
        let vx = p.vx * drag
        // Rebote en las paredes (bordes de la pantalla): refleja posición y
        // velocidad, perdiendo energía en cada choque (WALL_RESTITUTION) para
        // que no rebote para siempre.
        if (nx < 0) {
          nx = -nx
          vx = -vx * WALL_RESTITUTION
        } else if (nx > 100) {
          nx = 200 - nx
          vx = -vx * WALL_RESTITUTION
        }
        const alive = ny < 120
        if (alive) anyAlive = true
        return {
          ...p,
          x: nx,
          y: ny,
          vx,
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

type StreakInfo = components["schemas"]["StreakInfo"]

// Panel de racha diaria: mismo lenguaje visual que el resumen (número grande
// con spring, card Metric, conteo con ticks). Aparece una vez por día, tras la
// primera sesión completada.
function StreakPane({
  streak,
  tick,
}: {
  streak: StreakInfo
  tick: (rate: number) => void
}) {
  const [showCount, setShowCount] = useState(false)
  const [showRight, setShowRight] = useState(false)
  const [showFooter, setShowFooter] = useState(false)
  const dayWord = streak.days_to_next === 1 ? "día" : "días"
  return (
    <div className="flex w-full translate-y-[15px] flex-col items-center gap-8">
      {/* Misma mecánica que las cards de "Experiencia obtenida"/"Ejercicios
          correctos" del resumen: nada montado al arrancar. El container
          izquierdo aparece (fade + slide-up) mostrando el multiplicador en
          ×0.0 y, recién cuando termina de entrar (onAnimationComplete),
          arranca el conteo con ruido; al terminar (con sus tramos si
          corresponde), se monta y aparece el derecho. */}
      <div className="grid w-full grid-cols-2 gap-2">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          onAnimationComplete={() => setShowCount(true)}
        >
          <Metric
            label={
              <>
                Multiplicador
                <br />
                de XP
              </>
            }
            value={
              <MultiplierCount
                value={streak.multiplier}
                tick={tick}
                start={showCount}
                onDone={() => setShowRight(true)}
              />
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
                  Días de
                  <br />
                  actividad
                </>
              }
              value={
                <CountUp
                  variant="steps"
                  value={streak.days}
                  duration={1000}
                  steps={Math.min(5, Math.max(2, streak.days))}
                  stepEase={(x) => 1 - Math.pow(1 - x, 1.7)}
                  onStep={(step, total) => {
                    tick(0.9 + ((step - 1) / Math.max(1, total - 1)) * 0.6)
                  }}
                  onDone={() => setShowFooter(true)}
                />
              }
            />
          </motion.div>
        )}
      </div>

      {/* Siempre montado (solo cambia la opacidad): si apareciera recién al
          final, su alto empujaría las cards hacia arriba al entrar. */}
      <motion.p
        className="max-w-[21rem] text-center text-sm leading-relaxed text-foreground/60"
        initial={{ opacity: 0 }}
        animate={{ opacity: showFooter ? 1 : 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        {streak.is_max ? (
          <>
            Alcanzaste la{" "}
            <span className="font-medium text-foreground">racha máxima</span>.
            Volvé mañana para mantenerla.
          </>
        ) : (
          <>
            {streak.days_to_next === 1 ? "Te falta " : "Te faltan "}
            <span className="font-medium text-foreground">
              {streak.days_to_next} {dayWord}
            </span>{" "}
            de actividad para desbloquear{" "}
            <span className="font-medium text-foreground">
              ×{streak.next_multiplier?.toFixed(1)}
            </span>
            . Volvé mañana y sumás el próximo.
          </>
        )}
      </motion.p>
    </div>
  )
}

// Décimas entre dos tramos consecutivos de racha (×1.0, ×1.2, ×1.4…).
const STREAK_TIER_STEP = 2

// Multiplicador: arranca en 0 y da un salto por cada tramo alcanzado
// (0 → ×1.0 la primera vez; 0 → ×1.0 → ×1.2 → ×1.4… si ya escaló tramos), con
// el mismo tick de reloj ascendente del conteo de XP. Se cuenta en décimas para
// no arrastrar error de punto flotante.
function MultiplierCount({
  value,
  tick,
  onDone,
  start,
}: {
  value: number
  tick: (rate: number) => void
  onDone?: () => void
  // El conteo no arranca hasta que este flag pase a true (recién cuando
  // terminó de entrar el container, no a un delay fijo en paralelo con el
  // fade).
  start: boolean
}) {
  const [tenths, setTenths] = useState(0)
  const tickRef = useRef(tick)
  tickRef.current = tick
  const onDoneRef = useRef(onDone)
  onDoneRef.current = onDone

  useEffect(() => {
    if (!start) return
    const target = Math.round(value * 10)
    const stops: number[] = []
    for (let t = 10; t <= target; t += STREAK_TIER_STEP) stops.push(t)
    if (stops.length === 0) stops.push(target)

    setTenths(0)
    const duration = Math.min(1300, 450 * stops.length)
    const ease = (x: number) => 1 - Math.pow(1 - x, 1.7)
    let k = 0
    let timer: ReturnType<typeof setTimeout>
    const run = () => {
      setTenths(stops[k])
      tickRef.current(0.9 + (k / Math.max(1, stops.length - 1)) * 0.6)
      k++
      if (k >= stops.length) {
        onDoneRef.current?.()
        return
      }
      schedule()
    }
    const start_ = performance.now()
    const schedule = () => {
      const at = ease((k + 1) / stops.length) * duration
      timer = setTimeout(run, Math.max(0, at - (performance.now() - start_)))
    }
    run()
    return () => clearTimeout(timer)
  }, [value, start])

  return <>×{(tenths / 10).toFixed(1)}</>
}

// Pestaña de notificaciones: una única vez por dispositivo (ver
// notify-hint-seen.ts), solo si el navegador soporta push. Instalada como PWA
// permite activar los recordatorios acá mismo (elegir horario + suscribirse);
// desde el navegador, push no funciona todavía, así que ofrece los pasos de
// instalación en el diálogo compartido. El CTA "Continuar" del summary lleva a
// Perfil en ambos casos.
function NotifyHintPane({
  settingsLoading,
  onEnabled,
}: {
  settingsLoading: boolean
  onEnabled: () => void
}) {
  const platform = usePlatform()
  const needsInstall = platform !== null && !isStandalone()
  const [time, setTime] = useState(DEFAULT_REMINDER_TIME)
  const [installOpen, setInstallOpen] = useState(false)
  const enable = useEnableNotifications({ onSuccess: onEnabled })

  return (
    <div className="flex w-full translate-y-[15px] flex-col items-center gap-5 text-center">
      <motion.div
        className="flex size-14 items-center justify-center rounded-full bg-primary/15 text-primary"
        initial={{ opacity: 0, scale: 0.4 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 600, damping: 18 }}
      >
        {/* Campanazo: entra con el spring de arriba y, ya asentada, "suena"
            una vez (delay ≈ cuando termina el spring) en vez de agitarse en
            loop todo el tiempo que la pestaña está visible. */}
        <motion.div
          animate={{ rotate: [0, -15, 12, -8, 5, 0] }}
          transition={{ duration: 0.5, delay: 0.4, ease: "easeInOut" }}
        >
          <BellIcon className="size-7" />
        </motion.div>
      </motion.div>
      <motion.div
        className="flex flex-col gap-1.5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <p className="text-base font-medium">Activá los recordatorios</p>
        <p className="max-w-[21rem] text-sm leading-relaxed text-foreground/60">
          {needsInstall
            ? "Primero agregá Intervalo a tu pantalla de inicio para poder recibir recordatorios."
            : "Un solo recordatorio por día, a la hora que elijas."}
        </p>
      </motion.div>
      <motion.div
        className="flex w-full max-w-[21rem] flex-col gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        {needsInstall ? (
          <>
            <Button
              variant="outline"
              size="lg"
              className="h-12 w-full rounded-md"
              onClick={() => setInstallOpen(true)}
            >
              <DownloadIcon className="size-5" />
              Agregar
            </Button>
            <InstallDialog
              platform={platform ?? "all"}
              open={installOpen}
              onOpenChange={setInstallOpen}
            />
          </>
        ) : (
          <>
            <div className="flex h-12 w-full items-center justify-between gap-3 rounded-md border border-input px-3">
              <span className="flex items-center gap-2 text-sm">
                <ClockIcon className="size-5" />
                Recordarme a las
              </span>
              <Select
                value={time}
                onValueChange={(value) => {
                  if (!value) return
                  setTime(value)
                }}
              >
                <SelectTrigger size="sm" disabled={enable.isPending}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REMINDER_TIME_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              size="lg"
              className="h-12 w-full rounded-md"
              disabled={enable.isPending || settingsLoading}
              onClick={() => enable.mutate(time)}
            >
              <BellIcon className="size-5" />
              Activar notificaciones
            </Button>
          </>
        )}
      </motion.div>
    </div>
  )
}
