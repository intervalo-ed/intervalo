"use client"

import { useState } from "react"
import { motion } from "motion/react"
import { BellIcon, ClockIcon, DownloadIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { InstallDialog } from "@/components/install-dialog"
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
import { isStandalone, usePlatform, type Platform } from "@/lib/platform/detect"

// El CTA "Continuar" del summary queda gris este rato al entrar a la pestaña,
// para que el pedido de notificaciones se lea antes de poder saltearlo. Vive
// acá, al lado de la pestaña que protege, aunque el botón sea del summary.
export const NOTIFY_CTA_COOLDOWN_MS = 5000

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

// Pestaña de notificaciones: una única vez por dispositivo (ver
// notify-hint-seen.ts), solo si el navegador soporta push. Instalada como PWA
// permite activar los recordatorios acá mismo (elegir horario + suscribirse);
// desde el navegador, push no funciona todavía, así que ofrece los pasos de
// instalación en el diálogo compartido. El CTA "Continuar" del summary lleva a
// Perfil en ambos casos.
export function NotifyHintPane({
  settingsLoading,
  onEnabled,
  preview,
}: {
  settingsLoading: boolean
  onEnabled: () => void
  preview?: NotifyHintPreview
}) {
  const detected = usePlatform()
  const platform = preview?.platform ?? detected
  const standalone = preview?.standalone ?? isStandalone()
  const needsInstall = platform !== null && !standalone
  const [time, setTime] = useState(DEFAULT_REMINDER_TIME)
  const [installOpen, setInstallOpen] = useState(false)
  // Dos pasos: primero se activa (con el horario por defecto) y recién ahí
  // aparece el selector de hora, que ya persiste solo. Antes se pedían las dos
  // cosas juntas, pero elegir horario para algo que todavía no aceptaste es
  // pedir una decisión de más.
  const [justEnabled, setJustEnabled] = useState(false)
  const enable = useEnableNotifications({
    onSuccess: () => {
      setJustEnabled(true)
      onEnabled()
    },
  })
  const updateTime = useUpdateReminderTime()
  const enabled = preview?.enabled ?? justEnabled
  const pending = preview?.pending ?? (enable.isPending || updateTime.isPending)

  return (
    // Alto completo, un único grupo centrado: campana, texto y controles se
    // leen como una sola pila, con el botón inmediatamente debajo del texto
    // en vez de anclado al pie contra el CTA "Continuar" externo.
    <div className="flex h-full w-full flex-col items-center justify-center gap-5 text-center">
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
        {needsInstall ? (
          <>
            <Button
              variant="outline"
              size="lg"
              className="h-[var(--cta-h)] w-full rounded-md"
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
          // se ajusta después, si el usuario quiere.
          <Button
            size="lg"
            className="h-[var(--cta-h)] w-full rounded-md"
            disabled={pending || settingsLoading}
            onClick={() => enable.mutate(time)}
          >
            Activar
            <BellIcon className="size-5" />
          </Button>
        )}
      </motion.div>
    </div>
  )
}
