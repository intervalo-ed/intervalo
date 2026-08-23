"use client"

import { useApi } from "@/lib/api/useApi"
import { getTimezone, subscribeToPush } from "@/lib/push/register"
import { queryKeys } from "@/lib/query/keys"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import posthog from "posthog-js"
import { toast } from "sonner"

export const DEFAULT_REMINDER_TIME = "19:00"

// Horarios de recordatorio: en punto, de 08:00 a 22:00 (paso de 1 hora).
export const REMINDER_TIME_OPTIONS: string[] = Array.from(
  { length: 22 - 8 + 1 },
  (_, i) => `${String(8 + i).padStart(2, "0")}:00`,
)

// Activación de recordatorios push (permiso del navegador + suscripción +
// persistencia). Compartida entre los ajustes del perfil y la pestaña de
// notificaciones del resumen de sesión.
export function useEnableNotifications({
  onSuccess,
}: { onSuccess?: () => void } = {}) {
  const api = useApi()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (chosenTime: string) => {
      const sub = await subscribeToPush()
      const subRes = await api.POST("/push/subscribe", { body: sub })
      if (subRes.error) throw subRes.error
      const { error } = await api.PUT("/user/notification-settings", {
        body: { enabled: true, time: chosenTime, timezone: getTimezone() },
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.notificationSettings(),
      })
      toast.success("Recordatorios activados")
      onSuccess?.()
    },
    onError: (err: Error) => {
      // Los errores del backend llegan como body {detail}, no como Error. Sin
      // este evento una falla de persistencia es invisible en PostHog: la
      // semana del 18/8 hubo 22 permisos otorgados que terminaban en un 400
      // del PUT y ninguna señal del lado del cliente.
      const detail = (err as Error & { detail?: unknown }).detail
      posthog.capture("notify_enable_failed", {
        reason: err.message || JSON.stringify(detail) || "unknown",
      })
      if (err.message === "permission-denied") {
        toast.error("Tenés que permitir las notificaciones en el navegador.")
      } else if (err.message === "unsupported") {
        toast.error("Tu navegador no soporta notificaciones.")
      } else {
        toast.error("No pudimos activar los recordatorios.")
      }
    },
  })
}

// Cambio de horario con los recordatorios YA activos: no toca la suscripción
// push, solo persiste la hora nueva. Compartida entre los ajustes del perfil y
// la pestaña de notificaciones del resumen, donde el selector aparece recién
// después de activar.
export function useUpdateReminderTime() {
  const api = useApi()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (chosenTime: string) => {
      const { error } = await api.PUT("/user/notification-settings", {
        body: { enabled: true, time: chosenTime, timezone: getTimezone() },
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.notificationSettings(),
      })
      toast.success("Horario actualizado")
    },
    onError: () => toast.error("No pudimos guardar el horario."),
  })
}
