"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { AnimatePresence, motion } from "motion/react"
import { useQueryClient } from "@tanstack/react-query"
import posthog from "posthog-js"
import { CoffeeIcon } from "lucide-react"
// El marrón y la URL salen del minijuego: es la misma acción de los dos lados y
// tiene que verse igual. `solid` es la variante con contraste suficiente para
// texto blanco encima.
import {
  CAFECITO_URL,
  VERDE,
  VERDE_TINTA_OSCURA,
  WhatsappGlyph,
  shareLink,
  shareUrl,
} from "@/app/derivadas/cafecito-cta"
import { BELT_HEX } from "@/lib/catalog"
import { XpDots } from "@/components/xp-dots"
import { ChargeBall, Confetti, ConfettiRain } from "@/components/confetti"
import { Alert, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Screen, ScreenBody } from "@/components/ui/screen"
import { centerInViewportPercent, cn } from "@/lib/utils"
import { queryKeys } from "@/lib/query/keys"
import { clearSession } from "@/lib/session/storage"
import { useApi } from "@/lib/api/useApi"
import { setRankingNews } from "@/lib/nav/ranking-news"
import { getLastKnownRank, setLastKnownRank } from "@/lib/nav/ranking-rank"
import { setProfileNews } from "@/lib/nav/profile-news"
import {
  getNotifyHintContext,
  markNotifyHintSeen,
  shouldShowNotifyHint,
  type NotifyHintContext,
} from "@/lib/nav/notify-hint-seen"
import { isPushSupported } from "@/lib/push/register"
import {
  getPlatform,
  isStandalone,
  needsInstallForPush,
} from "@/lib/platform/detect"
import { useNotificationSettingsQuery } from "@/app/(app)/profile/UseNotificationSettings"
import { useSfx, useTick } from "@/lib/audio/useSfx"
import { usePostOnboardingRankingVariant } from "@/lib/experiments/UsePostOnboardingRanking"
import type { components } from "@/lib/api/schema"
import {
  NOTIFY_CTA_COOLDOWN_MS,
  NotifyHintAction,
  NotifyHintPane,
} from "./notify-hint-pane"
import { InstallHintPane } from "@/components/install-hint-pane"
import { SLIDE_TRANSITION, slideVariants } from "./slide-variants"
import { useSummary } from "./UseSummary"

const ctaCls =
  "h-[var(--cta-h)] w-full rounded-md bg-white text-black hover:bg-white/90 hover:text-black"

// ── Ajustes del conteo (XP, ejercicios correctos y días de racha) ─────────────
// Un salto por unidad, acelerando: cada salto dura RAMP_DECAY veces lo que el
// anterior, hasta el piso RAMP_MIN_MS. La duración total deja de ser fija y
// depende de cuánto haya que contar.
const RAMP_FIRST_MS = 260 // espera antes del primer salto
const RAMP_DECAY = 0.82 // factor de duración entre saltos consecutivos
const RAMP_MIN_MS = 55 // tope de velocidad: ningún salto baja de acá
// Tope de saltos. Por debajo de esto el conteo es literalmente de a uno; por
// encima, cada salto suma de a varios para que el total no se eternice (una
// sesión de práctica puede dar miles de XP, y de a uno serían minutos). El
// ritmo y la aceleración son los mismos en los dos casos.
const RAMP_MAX_STEPS = 30

// Conteo con la mecánica de arriba. Devuelve el número que va mostrando.
// `onStep` recibe el avance (0→1) para el pitch del tick.
function useRampCount({
  total,
  start,
  onStep,
  onDone,
  maxSteps = RAMP_MAX_STEPS,
}: {
  total: number
  // El conteo no arranca hasta que esto pase a true.
  start: boolean
  onStep?: (progress: number) => void
  onDone?: () => void
  maxSteps?: number
}): number {
  const [n, setN] = useState(0)
  // En refs para que un cambio de identidad de los callbacks no re-dispare el
  // efecto (eso reiniciaría el conteo a mitad de camino).
  const onStepRef = useRef(onStep)
  onStepRef.current = onStep
  const onDoneRef = useRef(onDone)
  onDoneRef.current = onDone

  useEffect(() => {
    if (!start) return
    const target = Math.max(0, Math.round(total))
    const inc = target > 0 ? Math.max(1, Math.ceil(target / maxSteps)) : 1
    const steps = target > 0 ? Math.ceil(target / inc) : 1
    setN(0)
    let k = 0
    let delay = RAMP_FIRST_MS
    let timer: ReturnType<typeof setTimeout>
    const run = () => {
      k++
      setN(k >= steps ? target : k * inc)
      onStepRef.current?.(steps <= 1 ? 1 : (k - 1) / (steps - 1))
      if (k >= steps) {
        onDoneRef.current?.()
        return
      }
      delay = Math.max(RAMP_MIN_MS, delay * RAMP_DECAY)
      timer = setTimeout(run, delay)
    }
    timer = setTimeout(run, delay)
    return () => clearTimeout(timer)
  }, [start, total, maxSteps])

  return n
}

export default function SessionSummary({ sessionId }: { sessionId: string }) {
  const { data, isError, error } = useSummary({ sessionId })
  const qc = useQueryClient()
  const api = useApi()
  const router = useRouter()
  const sfx = useSfx()
  // Resuelve en <2.5s; las animaciones del resumen tardan más que eso, así que
  // para cuando Continuar es tocable el brazo ya está. Si no, control.
  const abVariant = usePostOnboardingRankingVariant()
  const tick = useTick() // reloj — conteo de XP y de ejercicios (mismo sonido)
  // Si no se respondió ningún ejercicio bien, los conteos no hacen tick (sí
  // suena el `end`).
  const noCorrect = data ? data.first_try_correct === 0 : false
  const [showCards, setShowCards] = useState(false)
  const [showRight, setShowRight] = useState(false)
  const [showButton, setShowButton] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  // Festejo del panel de racha: lo dispara StreakPane al terminar su conteo,
  // pero se renderiza acá arriba (ver comentario en el JSX).
  const [streakConfetti, setStreakConfetti] = useState<{
    x: number
    y: number
  } | null>(null)
  // Secuencia, medida desde que se monta el resumen (≈ desde el tap, que dispara
  // el sonido de "carga" ascendente):
  //   t=1000ms → aparece la bolita blanca cargando energía + arranca el sonido `end`
  //   t=1800ms → la bolita explota en el confeti + "¡Listo!" + las cards
  const [showBall, setShowBall] = useState(false)
  const [exploded, setExploded] = useState(false)
  // Panel de racha: aparece tras Continuar, solo si esta sesión fue la primera
  // completada hoy (`counted_today`, una vez por día de actividad). El de
  // notificaciones lo sigue, todavía sin activar y según la cadencia de
  // notify-hint-seen. El soporte de push importa distinto según el modo: para
  // "activá" tiene que funcionar acá mismo, pero para "instalá" NO — Safari en
  // iOS solo expone la Push API a la app instalada, así que en el navegador
  // isPushSupported() da false justo cuando más hace falta invitar a instalar.
  const [phase, setPhase] = useState<
    "summary" | "streak" | "pedido" | "notify" | "install"
  >("summary")
  const settings = useNotificationSettingsQuery()
  const notifAlreadyEnabled = settings.data?.enabled === true
  const shouldShowStreak = data?.streak.counted_today === true
  // El pedido de esta pantalla —un cafecito o que recluta— lo decide el
  // servidor entero (ver backend/summary_asks.py); acá solo se elige DÓNDE cae.
  //
  // En el festejo va INCRUSTADO en la pantalla de racha, debajo del "¡Desbloqueaste
  // el multiplicador ×1,2!": la persona acaba de recibir algo y el pedido llega
  // en la misma respiración. Fuera del festejo no hay nada a lo que pegarse, así
  // que se lleva su propia pantalla, igual que el pedido de notificaciones.
  const pedido = data?.pedido ?? null
  const pedidoEnElFestejo =
    pedido === "cafecito" && shouldShowStreak && data?.streak.tier_reached === true
  const pedidoAparte = pedido !== null && !pedidoEnElFestejo
  // La decisión de mostrar la pestaña se resuelve una sola vez (en el primer
  // Continuar, ya con `data`) y queda congelada: si se recalculara, marcarla
  // como vista la apagaría con el usuario mirándola. Vive en un ref que solo
  // se escribe desde handlers — nunca durante el render — así un render
  // descartado de React no puede dejar un estado a medias.
  const notifyHintRef = useRef<{
    context: NotifyHintContext
    sessionNumber: number
    show: boolean
    shows: number
  } | null>(null)
  function resolveNotifyHint() {
    if (notifyHintRef.current === null && data) {
      const context = getNotifyHintContext()
      const sessionNumber = data.session_number
      // El soporte de push importa distinto según el modo: para "activá" tiene
      // que funcionar acá mismo, pero para "instalá" NO — Safari en iOS solo
      // expone la Push API a la app instalada, así que en el navegador
      // isPushSupported() da false justo cuando más hace falta invitar a
      // instalar.
      const installContext = needsInstallForPush({
        platform: getPlatform(),
        standalone: isStandalone(),
      })
      notifyHintRef.current = {
        context,
        sessionNumber,
        show:
          (isPushSupported() || installContext) &&
          shouldShowNotifyHint({ context, sessionNumber }),
        shows: 0,
      }
    }
    return notifyHintRef.current
  }
  // Marca la vista al ENTRAR, no al salir: los pasos de instalación terminan en
  // "cerrá tu navegador", así que el recorrido más valioso nunca pasa por
  // Continuar — sin esto, la cadencia y el tope jamás corrían para esa gente y
  // el pedido reaparecía todas las sesiones.
  function enterNotify() {
    const hint = resolveNotifyHint()
    if (hint) {
      const state = markNotifyHintSeen({
        context: hint.context,
        sessionNumber: hint.sessionNumber,
      })
      hint.shows = state.shows
    }
    setPhase("notify")
  }
  const sfxRef = useRef(sfx)
  sfxRef.current = sfx
  const tickRef = useRef(tick)
  tickRef.current = tick

  // Los dos conteos del resumen encadenados: la XP arranca al aparecer su card
  // y, al terminar, aparece la de ejercicios correctos y arranca la suya.
  const xpCount = useRampCount({
    total: data?.xp_earned ?? 0,
    start: showCards,
    onStep: (p) => {
      if (noCorrect) return
      tickRef.current(0.9 + p * 0.6)
    },
    onDone: () => setShowRight(true),
  })
  const correctCount = useRampCount({
    total: data?.first_try_correct ?? 0,
    start: showRight,
    onStep: (p) => {
      if (noCorrect) return
      tickRef.current(0.9 + p * 0.6)
    },
    onDone: () => setShowButton(true),
  })
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

  // El botón Continuar queda gris NOTIFY_CTA_COOLDOWN_MS al entrar a la pestaña
  // de notificaciones, salvo que el usuario ya las haya activado ahí mismo
  // (`notifJustEnabled`).
  // La slide de instalación arranca su propio cooldown: el efecto se vuelve a
  // correr al cambiar de fase, así que los pasos también se leen antes de poder
  // saltearlos.
  const [notifWaiting, setNotifWaiting] = useState(false)
  const [notifJustEnabled, setNotifJustEnabled] = useState(false)
  // Festejo al activar los recordatorios: explota desde el botón Activar
  // (origen medido por el pane) en la paleta del hito de racha.
  const [notifConfetti, setNotifConfetti] = useState<{
    x: number
    y: number
  } | null>(null)
  const inNotifyFlow = phase === "notify" || phase === "install"
  useEffect(() => {
    if (phase !== "notify" && phase !== "install") return
    setNotifWaiting(true)
    const t = setTimeout(() => setNotifWaiting(false), NOTIFY_CTA_COOLDOWN_MS)
    return () => clearTimeout(t)
  }, [phase])
  const notifyButtonDisabled = inNotifyFlow && notifWaiting && !notifJustEnabled

  function onContinue() {
    // Cada rama toca sfx.continue() una sola vez: goHome ya lo hace por su
    // cuenta, así que las ramas que caen ahí no lo repiten.
    // El orden de las pantallas es el orden de las ramas: racha → pedido →
    // notificaciones. El pedido va después del festejo (nunca antes) y antes de
    // las notificaciones, que es lo único que se puede activar sin salir de la
    // app y por eso cierra.
    if (phase === "summary") {
      if (shouldShowStreak) {
        sfx.continue()
        setPhase("streak")
      } else if (pedidoAparte) {
        sfx.continue()
        setPhase("pedido")
      } else if (resolveNotifyHint()?.show && !notifAlreadyEnabled) {
        sfx.continue()
        enterNotify()
      } else {
        goHome()
      }
      return
    }
    if (phase === "streak") {
      if (pedidoAparte) {
        sfx.continue()
        setPhase("pedido")
        return
      }
      if (resolveNotifyHint()?.show && !notifAlreadyEnabled) {
        sfx.continue()
        enterNotify()
        return
      }
      goHome()
      return
    }
    if (phase === "pedido") {
      if (resolveNotifyHint()?.show && !notifAlreadyEnabled) {
        sfx.continue()
        enterNotify()
        return
      }
      goHome()
      return
    }
    // Saliendo de la pestaña de notificaciones (o de la de pasos, que sale de
    // ella). El skip solo cuenta desde la de notificaciones: quien abrió los
    // pasos ya emitió install_steps_open y su desenlace es el pwa_install
    // posterior, no este tap.
    const hint = notifyHintRef.current
    if (phase === "notify" && hint && !notifJustEnabled) {
      posthog.capture("notify_hint_action", {
        action: "skipped",
        context: hint.context,
        platform: getPlatform(),
        session_number: hint.sessionNumber,
        shows: hint.shows,
      })
    }
    // Perfil solo si ahí se puede hacer algo (ajustar horario / activar); en un
    // navegador sin push esa pantalla dice "no soportado" — contradictorio con
    // lo que acabamos de pedir — así que ahí se vuelve a casa.
    if (isPushSupported()) {
      sfx.continue()
      router.push("/profile")
      router.refresh()
    } else {
      goHome()
    }
  }

  function goHome() {
    sfx.continue()
    // Experimento post-onboarding-ranking: el brazo test vuelve SIEMPRE al
    // ranking después del resumen (repaso y práctica por igual), para ver su
    // posición recién movida. El modo test de QA queda afuera, y si el flag
    // todavía no resolvió (null) se cae al flujo de control. La rama que va a
    // /profile tras activar notificaciones no pasa por acá a propósito:
    // interrumpir la elección del horario romperia el setup de push.
    if (abVariant === "test" && data && data.mode !== "test") {
      posthog.capture("summary_exit", {
        variant: abVariant,
        destination: "/leaderboard",
        mode: data.mode,
      })
      router.push("/leaderboard")
      router.refresh()
      return
    }
    // La sesión de práctica vuelve a Practicar; el resto (repaso, test)
    // vuelve a Repasar. En ambos casos, al curso en el que se estaba.
    const base = data?.mode === "practice" ? "/practice" : "/"
    const dest = data?.course ? `${base}?course=${data.course}` : base
    if (data && data.mode !== "test") {
      posthog.capture("summary_exit", {
        variant: abVariant ?? "unresolved",
        destination: base,
        mode: data.mode,
      })
    }
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
    // Terminó la sesión → podés tener un badge nuevo desbloqueable (perfil):
    // ese puntito siempre reaparece. El de ranking, en cambio, solo reaparece
    // si de verdad avanzaste lugares respecto de la última posición conocida
    // (ver ranking-rank.ts) — si no mejoraste, no hay novedad que mostrar.
    const previousRank = getLastKnownRank()
    api
      .GET("/leaderboard", { params: { query: { around_me: true } } })
      .then(({ data: lb, error: lbError }) => {
        if (lbError) return
        const newRank = lb.me.rank
        if (typeof newRank !== "number") return
        if (typeof previousRank === "number" && newRank < previousRank) {
          setRankingNews(true)
        }
        setLastKnownRank(newRank)
      })
    setProfileNews(true)
    qc.invalidateQueries({
      // Prefijo de progreso (todos los cursos), no la clave "default": ningún
      // consumidor usa esa clave, así que invalidarla no matcheaba nada.
      queryKey: queryKeys.userProgressAll(),
      refetchType: "all",
    })
  }, [data, sessionId, qc, api])

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
        {/* La lluvia releva a cada explosión con la paleta de su momento (entra
            por arriba unos segundos después, ver RAIN_DELAY_MS), y se limita a
            su fase para no superponer las dos. */}
        {showConfetti && phase === "summary" && <ConfettiRain />}
        {/* Festejo del hito. Va acá y no dentro de StreakPane a propósito:
            Confetti es `fixed inset-0`, y el slide de la fase tiene transform
            de Framer — un ancestro transformado hace que `fixed` se posicione
            contra ÉL y no contra el viewport, así que adentro quedaba encerrado
            en la tarjeta en vez de ocupar la pantalla. */}
        {streakConfetti && (
          <>
            <Confetti
              count={TIER_CONFETTI}
              colors={TIER_CONFETTI_COLORS}
              origin={streakConfetti}
            />
            {phase === "streak" && (
              <ConfettiRain colors={TIER_CONFETTI_COLORS} />
            )}
          </>
        )}
        {/* Ídem para el festejo de recordatorios activados: explosión desde el
            botón y, unos segundos después, la lluvia leve mientras se sigue en
            la pestaña. */}
        {notifConfetti && (
          <>
            <Confetti
              count={TIER_CONFETTI}
              colors={TIER_CONFETTI_COLORS}
              origin={notifConfetti}
            />
            {phase === "notify" && (
              <ConfettiRain colors={TIER_CONFETTI_COLORS} />
            )}
          </>
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
              transition={SLIDE_TRANSITION}
              // Las pestañas de notificaciones e instalación ocupan todo el
              // alto: necesitan apoyar sus controles contra el pie. `self-stretch`
              // (y no `h-full`) porque el `items-center` de la grilla la dejaría
              // del alto de su contenido y el 100% no tendría contra qué medir.
              className={cn(
                "col-start-1 row-start-1 w-full",
                inNotifyFlow && "self-stretch",
              )}
            >
              {phase === "streak" && data && (
                <StreakPane
                  streak={data.streak}
                  ofrecerCafecito={pedidoEnElFestejo}
                  tick={tick}
                  onCountDone={(origin) => {
                    if (data.streak.tier_reached) {
                      setStreakConfetti(origin ?? { x: 50, y: 50 })
                    }
                  }}
                />
              )}
              {phase === "pedido" && pedido && (
                <PedidoPane
                  clase={pedido}
                  handle={data?.handle ?? null}
                  porcentaje={data?.share_percent ?? 10}
                />
              )}
              {phase === "notify" && (
                <NotifyHintPane
                  context={notifyHintRef.current?.context}
                  sessionNumber={notifyHintRef.current?.sessionNumber}
                  shows={notifyHintRef.current?.shows}
                />
              )}
              {phase === "install" && (
                <InstallHintPane />
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
                      {xpCount}
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
                        {correctCount}
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
          className="mx-auto flex w-full max-w-2xl flex-col gap-2"
        >
          {/* La acción de la pestaña de notificaciones se apila acá, arriba de
              Continuar (misma pila que el fin del onboarding), no dentro de la
              slide: comparten contenedor, ancho y separación. */}
          {phase === "notify" && (
            <NotifyHintAction
              settingsLoading={settings.isLoading}
              onEnabled={(origin) => {
                setNotifJustEnabled(true)
                setNotifConfetti(origin ?? { x: 50, y: 70 })
              }}
              onInstall={() => setPhase("install")}
              context={notifyHintRef.current?.context}
              sessionNumber={notifyHintRef.current?.sessionNumber}
              shows={notifyHintRef.current?.shows}
            />
          )}
          <Button
            size="lg"
            className={ctaCls}
            onClick={onContinue}
            disabled={!showButton || notifyButtonDisabled}
          >
            {/* En la pestaña de instalación no se sigue a ningún lado: los pasos
                se hacen en el menú del navegador, así que el botón acusa recibo
                en vez de prometer un paso siguiente. Mismo texto que la sheet de
                la smart bar (install-sheet.tsx), que muestra estos mismos pasos. */}
            {phase === "install" ? "Entendido" : "Continuar"}
          </Button>
        </motion.div>
      </div>
    </Screen>
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

// Tween con el que la barra persigue al contador de días. Si es mayor que el
// intervalo entre saltos, la barra queda suavizada (va detrás del número pero
// llega pareja) en vez de saltar escalonada.
const DAY_BAR_TWEEN_S = 0.12

// El número de días se va tiñendo del blanco del texto al azul-violeta de marca
// a medida que sube la racha, saturando a los DAY_COLOR_MAX días (el último
// tramo de multiplicador, ×2.0 — ver STREAK_TIERS en algorithm/xp.py). Sale de
// los tokens con color-mix en vez de hardcodear los extremos, así sigue al tema.
const DAY_COLOR_MAX = 45

// Festejo al alcanzar un hito: misma explosión que la del resumen, pero en la
// escala de color de la racha (del blanco del texto al azul-violeta de marca)
// en vez de los colores de cinturón.
const TIER_CONFETTI = 45
const TIER_CONFETTI_COLORS = Array.from(
  { length: 6 },
  (_, i) =>
    `color-mix(in oklab, var(--primary) ${i * 20}%, var(--foreground))`,
)

// Panel de racha diaria: mismo lenguaje visual que el resumen (número grande,
// conteo con ticks). Aparece una vez por día, tras la primera sesión completada.
const CAFE_SOLIDO = BELT_HEX.brown.solid

function StreakPane({
  streak,
  tick,
  onCountDone,
  ofrecerCafecito = false,
}: {
  streak: StreakInfo
  ofrecerCafecito?: boolean
  tick: (rate: number) => void
  onCountDone?: (origin: { x: number; y: number } | null) => void
}) {
  const [showCount, setShowCount] = useState(false)
  const [showFooter, setShowFooter] = useState(false)
  const dayWord = streak.days_to_next === 1 ? "día" : "días"

  const tickRef = useRef(tick)
  tickRef.current = tick
  const onCountDoneRef = useRef(onCountDone)
  onCountDoneRef.current = onCountDone

  // Mismo conteo que la XP y los ejercicios del resumen. Tope de saltos más
  // alto: la racha máxima con tramo propio es de 45 días y se quiere que a esa
  // altura siga contando de a un día.
  // El confeti del hito explota desde el número, no desde el centro de la
  // pantalla: se mide al terminar el conteo y se pasa en % de viewport, que es
  // la unidad en la que Confetti posiciona sus partículas.
  const numberRef = useRef<HTMLSpanElement>(null)
  const shownDays = useRampCount({
    total: streak.days,
    start: showCount,
    maxSteps: 60,
    onStep: (p) => tickRef.current(0.9 + p * 0.6),
    onDone: () => {
      setShowFooter(true)
      onCountDoneRef.current?.(centerInViewportPercent(numberRef.current))
    },
  })

  // La barra va de 0 días a un techo, y sigue al contador salto a salto en vez
  // de llenarse de una al final.
  //
  // El día que se alcanza un hito el techo es ese mismo hito, así que la barra
  // cierra al 100% sobre el multiplicador recién desbloqueado: el logro se ve
  // completo. Recién al día siguiente se re-escala hacia el próximo tramo y
  // vuelve a arrancar baja.
  //
  // El resto de los días el techo es el próximo hito, contando desde 0 días (no
  // desde el piso del tramo vigente) para que quien ya escaló tramos la vea
  // arrancar con buena parte hecha. En el tramo máximo, sin hito que alcanzar,
  // no hay barra.
  const barTop = streak.tier_reached ? streak.days : streak.next_threshold
  const showBar = !!barTop && (streak.tier_reached || !streak.is_max)
  const pct = barTop ? Math.min(100, (shownDays / barTop) * 100) : 0
  // En un hito, los extremos son el tramo que se acaba de completar: del
  // multiplicador anterior al recién ganado.
  const barFrom = streak.tier_reached ? streak.prev_multiplier : streak.multiplier
  const barTo = streak.tier_reached ? streak.multiplier : streak.next_multiplier
  const dayColorPct = Math.min(100, (shownDays / DAY_COLOR_MAX) * 100)

  return (
    <div className="flex w-full translate-y-[15px] flex-col items-center gap-8">
      {/* Contador y barra entran juntos (fade + slide-up) y recién cuando
          terminan de entrar (onAnimationComplete) arranca el conteo con ruido.
          La barra tiene que estar montada y vacía desde antes: si entrara
          después del conteo aparecería ya llena, sin llenarse a la vista. */}
      <motion.div
        className="flex w-full flex-col items-center gap-8"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        onAnimationComplete={() => setShowCount(true)}
      >
        <div className="flex flex-col items-center gap-2">
          <span
            ref={numberRef}
            className="text-5xl font-semibold tabular-nums leading-none"
            style={{
              color: `color-mix(in oklab, var(--primary) ${dayColorPct}%, var(--foreground))`,
              transition: `color ${DAY_BAR_TWEEN_S}s ease-out`,
            }}
          >
            {shownDays}
          </span>
          <span className="text-sm text-foreground/60">Días de actividad</span>
        </div>

        {showBar && (
          <div className="flex w-full items-center gap-3">
            {/* El multiplicador vigente va apagado y el próximo resaltado: el
                extremo que importa es hacia dónde va, no dónde está. */}
            <span className="inline-flex shrink-0 items-center gap-1 text-sm tabular-nums text-foreground/75">
              ×{barFrom?.toFixed(1)}
              <XpDots className="size-[0.9em] text-primary/75" />
            </span>
            {/* Misma barra que la de progreso de la sesión (session-runner.tsx),
                pero con un tween mucho más corto: acá se retarget en cada día
                contado, no una vez sola. */}
            <div className="h-3 flex-1 overflow-hidden rounded-full bg-border">
              <motion.div
                className="h-full rounded-full bg-primary"
                initial={{ width: "0%" }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: DAY_BAR_TWEEN_S, ease: [0.32, 0.72, 0, 1] }}
              />
            </div>
            <span className="inline-flex shrink-0 items-center gap-1 text-sm font-medium tabular-nums">
              ×{barTo?.toFixed(1)}
              <XpDots className="size-[0.9em] text-primary" />
            </span>
          </div>
        )}
      </motion.div>

      {/* Siempre montado (solo cambia la opacidad): si apareciera recién al
          final, su alto empujaría las cards hacia arriba al entrar. */}
      <motion.p
        className="max-w-[21rem] text-center text-sm leading-relaxed text-foreground/60"
        initial={{ opacity: 0 }}
        animate={{ opacity: showFooter ? 1 : 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        {streak.tier_reached ? (
          // Justo hoy cayó en el piso de un tramo: el multiplicador vigente es
          // el que se acaba de desbloquear, así que se muestra ese y no el próximo.
          <>
            <span className="block">
              ¡Desbloqueaste el multiplicador{" "}
              <span className="font-medium text-foreground">
                ×{streak.multiplier.toFixed(1)}
              </span>{" "}
              de XP{streak.is_max ? ", el máximo" : ""}!
            </span>
            <span className="mt-3 block font-medium text-foreground">
              {streak.is_max
                ? "Volvé mañana para mantenerlo."
                : "A partir de ahora, todo lo que resuelvas vale más."}
            </span>
          </>
        ) : streak.is_max ? (
          <>
            <span className="block">
              Alcanzaste la{" "}
              <span className="font-medium text-foreground">racha máxima</span>:
              tu{" "}
              <span className="font-medium text-foreground">
                multiplicador de XP
              </span>{" "}
              está al tope.
            </span>
            <span className="mt-3 block font-medium text-foreground">
              Volvé mañana para mantenerlo.
            </span>
          </>
        ) : (
          <>
            <span className="block">
              {streak.days_to_next === 1 ? "Te falta " : "Te faltan "}
              <span className="font-medium text-foreground">
                {streak.days_to_next} {dayWord}
              </span>{" "}
              de actividad para mejorar tu{" "}
              <span className="font-medium text-foreground">
                multiplicador de XP
              </span>
              .
            </span>
            <span className="mt-3 block font-medium text-foreground">
              Volvé mañana y sumás el próximo.
            </span>
          </>
        )}
      </motion.p>

      {/* El pedido va DESPUÉS del festejo y no antes: la persona acaba de ver
          subir su multiplicador, o sea que acaba de recibir algo. Pedir ahí es
          distinto de pedir en frío, y por eso el café aprovecha este momento
          además de su cadencia de cada seis sesiones.

          Este bloque es SOLO el del hito; fuera de un hito el pedido se lleva su
          propia pantalla (ver PedidoPane). Y aparece solo cuando el servidor dice
          que corresponde —instaló la PWA, va por su tercer día y no hubo otro
          pedido en la sesión anterior—, que es lo que evita que quien todavía
          está probando la app reciba un pedido de plata como tercera pantalla.

          El <a> es real y sale al navegador: cafecito.app es otro origen, y
          adentro de una webview standalone Mercado Pago pierde las tarjetas
          guardadas y los redirects de 3DS. */}
      {ofrecerCafecito && (
        <motion.div
          className="mt-6 flex flex-col items-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <p className="text-center text-sm text-muted-foreground">
            Un cafecito multiplica el XP de toda tu universidad por un día.
          </p>
          <a
            href={CAFECITO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-11 items-center justify-center gap-2 rounded-md px-5 text-sm font-semibold"
            style={{ backgroundColor: CAFE_SOLIDO, color: "#FFFFFF" }}
          >
            Invitar un cafecito
            <CoffeeIcon className="size-4" />
          </a>
        </motion.div>
      )}
    </div>
  )
}

/** La pantalla de un pedido suelto: el cafecito fuera de un festejo, o reclutar.
 *
 *  Los dos pedidos comparten pantalla —y no una cada uno— porque nunca salen
 *  juntos: el servidor devuelve UNO, alternándolos y con al menos dos sesiones
 *  de por medio (ver backend/summary_asks.py). Lo único que cambia entre ellos
 *  es el color, el ícono y qué se gana; la forma es la misma, y que lo sea es
 *  parte del punto: son las dos maneras de ayudar, no dos cosas distintas.
 *
 *  Los dos anclas son `<a target="_blank">` de verdad y no un window.open:
 *  cafecito.app y wa.me son otro origen y tienen que salir al navegador, que
 *  adentro de la PWA instalada es la diferencia entre abrir WhatsApp (o Mercado
 *  Pago con las tarjetas guardadas) y quedarse trabado en una ventana sin barra
 *  de direcciones ni botón de atrás. */
function PedidoPane({
  clase,
  handle,
  porcentaje,
}: {
  clase: "cafecito" | "reclutas"
  handle: string | null
  porcentaje: number
}) {
  const cafe = clase === "cafecito"
  const color = cafe ? CAFE_SOLIDO : VERDE
  // El verde de WhatsApp es tan claro que el texto blanco encima no llega al
  // contraste mínimo; el marrón del cafecito sí. Cada uno lleva su tinta.
  const tinta = cafe ? "#FFFFFF" : VERDE_TINTA_OSCURA
  // Sin @ el link saldría con el `?r=` vacío y no atribuiría a nadie, así que el
  // botón se apaga. `aria-disabled` y no `disabled`: un ancla no tiene ese
  // atributo. Misma guarda que en la vista de Reclutas del ranking.
  const sinHandle = !cafe && !handle

  return (
    <div className="flex w-full translate-y-[15px] flex-col items-center gap-6">
      <motion.div
        className="flex flex-col items-center gap-6"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      >
        <span
          className="flex size-16 items-center justify-center rounded-full"
          style={{ backgroundColor: `${color}1F`, color }}
        >
          {cafe ? <CoffeeIcon className="size-8" /> : <WhatsappGlyph size={32} />}
        </span>

        <div className="flex flex-col items-center gap-3">
          <span className="text-center text-2xl font-semibold tracking-tight">
            {cafe
              ? "¿Nos invitás un cafecito?"
              : "Traé a alguien de tu universidad"}
          </span>
          <p className="max-w-[21rem] text-center text-sm leading-relaxed text-foreground/60">
            {cafe ? (
              <>
                Multiplica el XP de{" "}
                <span className="font-medium text-foreground">
                  toda tu universidad
                </span>{" "}
                durante un día entero. El tuyo también.
              </>
            ) : (
              <>
                Quien entre por tu link te deja el{" "}
                <span className="font-medium text-foreground">{porcentaje}%</span>{" "}
                de todo lo que sume, acá y en el minijuego. No se le descuenta
                nada: esa XP se acuña.
              </>
            )}
          </p>
        </div>
      </motion.div>

      <motion.div
        className="flex w-full max-w-[21rem] flex-col items-center gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <a
          href={cafe ? CAFECITO_URL : shareUrl(handle)}
          target="_blank"
          rel="noopener noreferrer"
          aria-disabled={sinHandle}
          className={cn(
            "flex h-12 w-full items-center justify-center gap-2 rounded-md text-sm font-semibold transition-opacity",
            sinHandle && "pointer-events-none opacity-50",
          )}
          style={{ backgroundColor: color, color: tinta }}
        >
          {cafe ? "Invitar un cafecito" : "Reclutar"}
          {cafe ? <CoffeeIcon className="size-4" /> : <WhatsappGlyph size={18} />}
        </a>
        {/* El link a la vista, para quien prefiera copiarlo a mano antes que
            pasar por WhatsApp. Igual que en el ranking. */}
        {!cafe && (
          <p className="text-center text-xs break-all text-muted-foreground">
            {shareLink(handle)}
          </p>
        )}
      </motion.div>
    </div>
  )
}

