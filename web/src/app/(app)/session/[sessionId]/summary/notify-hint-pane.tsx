"use client"

import { useEffect, useRef, useState } from "react"
import { motion } from "motion/react"
import posthog from "posthog-js"
import { BellIcon, ClockIcon, SquarePlusIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { centerInViewportPercent } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DEFAULT_REMINDER_TIME,
  REMINDER_TIME_OPTIONS,
  useEnableNotifications,
  useUpdateReminderTime,
} from "@/lib/push/UseEnableNotifications"
import {
  isStandalone,
  needsInstallForPush,
  readStandaloneSignals,
  usePlatform,
  type Platform,
} from "@/lib/platform/detect"

// El CTA "Continuar" del summary queda gris este rato al entrar a la pestaña,
// para que el pedido de notificaciones se lea antes de poder saltearlo. Vive
// acá, al lado de la pestaña que protege, aunque el botón sea del summary.
export const NOTIFY_CTA_COOLDOWN_MS = 5000

// Confeti del campanazo: piezas que salen disparadas del contorno superior de
// la campana (0° = arriba). Specs fijos y determinísticos — mismos valores en
// cada render, así un re-render a mitad del vuelo no reinicia la animación.
// `a` ángulo de salida, `s` impulso en px, `w×h` tamaño de la pieza, `spin`
// giro durante el vuelo, `shade` índice en la mini paleta (la misma escala
// blanco→índigo del confeti grande del resumen).
const SPARK_R0 = 20
// Toda la familia del índigo, sin llegar al blanco: primario, el índigo claro
// de la marca y una mezcla que sigue siendo claramente violácea.
const SPARK_COLORS = [
  "var(--primary)",
  "var(--chart-5)",
  "color-mix(in oklab, var(--primary) 55%, var(--foreground))",
]
// Vuelo corto: las piezas se desvanecen en el aire cerca de la campana, no
// escapan de la pantalla. `fall` es cuánto cae cada una en el último tramo.
const SPARKS = [
  { a: -76, s: 38, w: 5, h: 8, spin: -230, fall: 12, shade: 0 },
  { a: -54, s: 50, w: 4, h: 6, spin: 190, fall: 18, shade: 2 },
  { a: -31, s: 42, w: 6, h: 6, spin: -160, fall: 10, shade: 1 },
  { a: -10, s: 56, w: 4, h: 7, spin: 250, fall: 8, shade: 0 },
  { a: 12, s: 46, w: 5, h: 5, spin: -210, fall: 10, shade: 2 },
  { a: 34, s: 54, w: 4, h: 8, spin: 170, fall: 14, shade: 1 },
  { a: 57, s: 40, w: 6, h: 5, spin: -190, fall: 20, shade: 0 },
  { a: 77, s: 48, w: 4, h: 6, spin: 220, fall: 16, shade: 1 },
]

// Lo que normalmente sale del entorno o del recorrido del usuario (qué
// dispositivo es, si corre instalada, si ya activó, si hay una mutación en
// vuelo). Solo lo pisa /dev/notify-pane para poder mirar las variantes desde
// cualquier navegador: en la app real va siempre undefined.
export type NotifyHintPreview = {
  platform?: Platform
  standalone?: boolean
  enabled?: boolean
  pending?: boolean
}

// Pestaña de notificaciones: aparece cada tantas sesiones mientras no estén
// activadas (ver notify-hint-seen.ts). Instalada como PWA (o en escritorio,
// donde push anda sin instalar) permite activar los recordatorios acá mismo;
// en el navegador de un celular invita a instalar — en iOS porque push no
// existe fuera de la app, y en Android por decisión de producto: el navegador
// soporta push, pero lo que se busca es la app instalada. El CTA "Continuar"
// del summary lleva a Perfil cuando push funciona acá, si no a casa.
export function NotifyHintPane({
  settingsLoading,
  onEnabled,
  onInstall,
  context,
  sessionNumber,
  shows,
  preview,
}: {
  settingsLoading: boolean
  // El origen es el centro del botón Activar en % de viewport (la unidad de
  // Confetti), medido justo antes de que el selector de hora lo reemplace:
  // el festejo sale de donde el usuario acaba de tocar.
  onEnabled: (origin: { x: number; y: number } | null) => void
  // "Agregar" no abre un diálogo: avanza a la slide con los pasos (ver
  // install-hint-pane.tsx), que el summary anima como una más.
  onInstall: () => void
  context?: string
  sessionNumber?: number
  // Qué número de aparición es (1 = primera invitación): distingue en los
  // eventos la primera vez de la cuarta insistencia.
  shows?: number
  preview?: NotifyHintPreview
}) {
  const detected = usePlatform()
  const platform = preview?.platform ?? detected
  const standalone = preview?.standalone ?? isStandalone()
  const needsInstall = needsInstallForPush({ platform, standalone })
  const [time, setTime] = useState(DEFAULT_REMINDER_TIME)
  // Dos pasos: primero se activa (con el horario por defecto) y recién ahí
  // aparece el selector de hora, que ya persiste solo. Antes se pedían las dos
  // cosas juntas, pero elegir horario para algo que todavía no aceptaste es
  // pedir una decisión de más.
  const [justEnabled, setJustEnabled] = useState(false)
  const enableButtonRef = useRef<HTMLButtonElement>(null)
  const enable = useEnableNotifications({
    onSuccess: () => {
      setJustEnabled(true)
      posthog.capture("notify_hint_action", {
        action: "enabled",
        context,
        platform,
        session_number: sessionNumber,
        shows,
      })
      // Se mide acá, con el botón todavía montado: el setJustEnabled de arriba
      // recién lo reemplaza en el próximo render.
      onEnabled(centerInViewportPercent(enableButtonRef.current))
    },
  })
  const updateTime = useUpdateReminderTime()
  const enabled = preview?.enabled ?? justEnabled
  const pending = preview?.pending ?? (enable.isPending || updateTime.isPending)

  // Se emite recién con la plataforma resuelta: antes de montar no sabemos si
  // toca el modo "instalar" o el "activar", que es justo lo que queremos medir.
  const shownRef = useRef(false)
  useEffect(() => {
    if (preview || platform === null || shownRef.current) return
    shownRef.current = true
    // Las dos señales crudas viajan sueltas porque ya nos mintieron una vez
    // (ver isStandalone): si el modo no cuadra con el contexto, acá se ve cuál
    // de las dos falló.
    const signals = readStandaloneSignals()
    posthog.capture("notify_hint_shown", {
      mode: needsInstall ? "install" : "enable",
      context,
      platform,
      session_number: sessionNumber,
      shows,
      standalone_mql: signals.mql,
      standalone_navigator: signals.iosStandalone,
    })
  }, [preview, platform, needsInstall, context, sessionNumber, shows])

  return (
    // Alto completo, un único grupo centrado: campana, texto y controles se
    // leen como una sola pila, con el botón inmediatamente debajo del texto
    // en vez de anclado al pie contra el CTA "Continuar" externo.
    <div className="flex h-full w-full flex-col items-center justify-center gap-5 text-center">
      {/* Campana sin disco de fondo: entra con spring y, ya asentada, "suena"
          oscilando desde su punto de anclaje (transformOrigin arriba, como una
          campana colgada) mientras dos ondas nacen en ella y se expanden
          desvaneciéndose — el "ping" de una notificación. Todo pasa una vez;
          nada queda latiendo en loop mientras la pestaña está visible. */}
      <motion.div
        className="relative flex size-14 items-center justify-center text-primary"
        initial={{ opacity: 0, scale: 0.4 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 600, damping: 18 }}
      >
        {/* Mini confeti disparado desde el contorno de la campana al "sonar" —
            el mismo lenguaje que el Confetti grande del resumen, así el
            campanazo anticipa el festejo de activar. Trayectoria balística en
            keyframes: arranca rápido (easeOut), pierde impulso y la última
            parte cae (SPARK_FALL), girando todo el vuelo. */}
        {SPARKS.map((p, i) => {
          const rad = (p.a * Math.PI) / 180
          // Dirección de salida medida desde la vertical: 0° es "hacia arriba".
          const dx = Math.sin(rad)
          const dy = -Math.cos(rad)
          return (
            <motion.span
              key={i}
              aria-hidden
              style={{
                width: p.w,
                height: p.h,
                marginLeft: -p.w / 2,
                marginTop: -p.h / 2,
                borderRadius: 1,
                backgroundColor: SPARK_COLORS[p.shade],
              }}
              className="absolute left-1/2 top-1/2"
              initial={{ opacity: 0 }}
              animate={{
                x: [dx * SPARK_R0, dx * (SPARK_R0 + p.s * 0.65), dx * (SPARK_R0 + p.s)],
                y: [
                  dy * SPARK_R0,
                  dy * (SPARK_R0 + p.s * 0.65) - 6,
                  dy * (SPARK_R0 + p.s) + p.fall,
                ],
                // Plenas la mayor parte del vuelo y desvanecidas en el aire
                // sobre el final, ya lejos de la campana.
                opacity: [0, 1, 1, 0],
                rotate: [p.a, p.a + p.spin],
              }}
              // El override por-valor de framer REEMPLAZA la transición entera
              // para esa propiedad (no la extiende): sin repetir duration y
              // delay acá, la opacidad corría sola al montar con los defaults
              // y las piezas morían antes de arrancar el vuelo.
              transition={{
                duration: 0.95,
                delay: 0.45 + i * 0.04,
                ease: "easeOut",
                opacity: {
                  duration: 0.95,
                  delay: 0.45 + i * 0.04,
                  times: [0, 0.08, 0.65, 1],
                  ease: "linear",
                },
              }}
            />
          )
        })}
        {/* Mismos 0.9s pero con más oscilaciones adentro: campanazo rápido que
            se amortigua, no un vaivén lento. */}
        <motion.div
          style={{ transformOrigin: "50% 12%" }}
          animate={{ rotate: [0, -24, 20, -16, 12, -8, 5, -2, 0] }}
          transition={{ duration: 0.9, delay: 0.4, ease: "easeInOut" }}
        >
          <BellIcon className="size-9" />
        </motion.div>
      </motion.div>
      <motion.div
        className="flex flex-col gap-1.5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <p className="text-lg font-medium">Activá los recordatorios</p>
        <p className="max-w-[21rem] text-base leading-relaxed text-foreground/60">
          {needsInstall
            ? "Primero agregá Intervalo a tu pantalla de inicio."
            : "Te van a llegar a la hora que elijas."}
        </p>
      </motion.div>
      <motion.div
        className="flex w-full max-w-[21rem] flex-col gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        {platform === null ? (
          // Sin plataforma resuelta no sabemos qué pedir: dejamos el hueco del
          // botón para no mostrar "Activar" y que salte a "Agregar" en mobile.
          <div className="h-[var(--cta-h)]" />
        ) : needsInstall ? (
          // Mismo azul que el "Activar" de la variante instalada: es la acción
          // principal de la pestaña, no una alternativa.
          <Button
            size="lg"
            className="h-[var(--cta-h)] w-full rounded-md"
            onClick={() => {
              posthog.capture("notify_hint_action", {
                action: "install_steps_open",
                context,
                platform,
                session_number: sessionNumber,
                shows,
              })
              onInstall()
            }}
          >
            Agregar
            <SquarePlusIcon className="size-5" />
          </Button>
        ) : enabled ? (
          // Ya activadas: el botón deja su lugar al selector, que a partir de
          // acá guarda cada cambio solo (los recordatorios ya están andando).
          // Selector, botón y CTA comparten --cta-h para leerse como una pila
          // pareja.
          <div className="flex h-[var(--cta-h)] w-full items-center justify-center gap-3 rounded-md border border-input px-3">
            <span className="flex items-center gap-2 text-sm">
              <ClockIcon className="size-5" />
              Recordarme a las
            </span>
            <Select
              value={time}
              onValueChange={(value) => {
                if (!value) return
                setTime(value)
                updateTime.mutate(value)
              }}
            >
              <SelectTrigger size="sm" disabled={pending}>
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
        ) : (
          // Un solo paso para decir que sí; el horario arranca en el default y
          // se ajusta después, si el usuario quiere. Mientras corre (permiso
          // del sistema + suscripción, que puede tardar unos segundos) la
          // campanita cede su lugar a un spinner para que se vea que algo
          // está pasando.
          <Button
            ref={enableButtonRef}
            size="lg"
            className="h-[var(--cta-h)] w-full rounded-md"
            disabled={pending || settingsLoading}
            onClick={() => enable.mutate(time)}
          >
            Activar
            {pending ? (
              <Spinner className="size-5" />
            ) : (
              <BellIcon className="size-5" />
            )}
          </Button>
        )}
      </motion.div>
    </div>
  )
}
