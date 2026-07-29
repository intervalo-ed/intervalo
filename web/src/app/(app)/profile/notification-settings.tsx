"use client"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useApi } from "@/lib/api/useApi"
import {
  getTimezone,
  isPushSupported,
  unsubscribeFromPush,
} from "@/lib/push/register"
import {
  DEFAULT_REMINDER_TIME,
  REMINDER_TIME_OPTIONS,
  useEnableNotifications,
} from "@/lib/push/UseEnableNotifications"
import { queryKeys } from "@/lib/query/keys"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useNotificationSettingsQuery } from "./UseNotificationSettings"
import { BellIcon, BellOffIcon } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

// iOS (iPhone/iPad/iPod). Incluye los iPad recientes, que reportan UA de Mac pero
// son táctiles. Solo se llama en el cliente (post-mount), tras chequear navigator.
function detectIOS(): boolean {
  if (typeof navigator === "undefined") return false
  const ua = navigator.userAgent
  const iOSDevice = /iPad|iPhone|iPod/.test(ua)
  const iPadOS = /Macintosh/.test(ua) && navigator.maxTouchPoints > 1
  return iOSDevice || iPadOS
}

export function NotificationSettings() {
  const api = useApi()
  const queryClient = useQueryClient()
  const [supported, setSupported] = useState(true)
  const [time, setTime] = useState(DEFAULT_REMINDER_TIME)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    setSupported(isPushSupported())
    setIsIOS(detectIOS())
  }, [])

  const settings = useNotificationSettingsQuery()

  useEffect(() => {
    if (settings.data?.time) setTime(settings.data.time)
  }, [settings.data?.time])

  const enabled = settings.data?.enabled ?? false

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.notificationSettings() })

  const enable = useEnableNotifications()

  const disable = useMutation({
    mutationFn: async () => {
      const endpoint = await unsubscribeFromPush()
      if (endpoint) {
        await api.DELETE("/push/subscribe", { body: { endpoint } })
      }
      const { error } = await api.PUT("/user/notification-settings", {
        body: { enabled: false, time: null, timezone: null },
      })
      if (error) throw error
    },
    onSuccess: () => {
      invalidate()
      toast.success("Recordatorios desactivados")
    },
    onError: () => toast.error("No pudimos desactivar los recordatorios."),
  })

  const updateTime = useMutation({
    mutationFn: async (chosenTime: string) => {
      const { error } = await api.PUT("/user/notification-settings", {
        body: { enabled: true, time: chosenTime, timezone: getTimezone() },
      })
      if (error) throw error
    },
    onSuccess: () => {
      invalidate()
      toast.success("Horario actualizado")
    },
    onError: () => toast.error("No pudimos guardar el horario."),
  })

  if (!supported) {
    return (
      <p className="text-sm text-muted-foreground">
        Tu navegador no soporta notificaciones push.
      </p>
    )
  }

  const busy = enable.isPending || disable.isPending || updateTime.isPending

  return (
    <div className="flex flex-col gap-3">
      {!enabled ? (
        <Button
          variant="outline"
          size="lg"
          className="h-12 w-full justify-start rounded-md"
          disabled={busy || settings.isLoading}
          onClick={() => enable.mutate(time)}
        >
          <BellIcon className="size-5" />
          Activar notificaciones
        </Button>
      ) : (
        <>
          <div className="flex h-12 w-full items-center justify-between gap-3 rounded-md border border-input px-3">
            <span className="flex items-center gap-2 text-sm">
              <BellIcon className="size-5" />
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
              <SelectTrigger size="sm" disabled={busy}>
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
            variant="ghost"
            size="lg"
            className="h-12 w-full justify-start rounded-md text-muted-foreground"
            disabled={busy}
            onClick={() => disable.mutate()}
          >
            <BellOffIcon className="size-5" />
            Desactivar recordatorios
          </Button>
        </>
      )}
      <p className="text-xs/relaxed text-muted-foreground">
        Te enviamos una sola notificación por día, y únicamente si tenés temas
        pendientes para repasar.
        {isIOS &&
          " En iPhone, primero agregá Intervalo a la pantalla de inicio."}
      </p>
    </div>
  )
}
