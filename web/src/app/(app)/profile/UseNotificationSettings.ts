"use client"

import { useQuery } from "@tanstack/react-query"
import { useApi } from "@/lib/api/useApi"
import { queryKeys } from "@/lib/query/keys"

// Estado de los recordatorios push del usuario. Compartido entre la tarjeta de
// ajustes y el gate de carga del perfil (misma queryKey → una sola request).
export function useNotificationSettingsQuery() {
  const api = useApi()
  return useQuery({
    queryKey: queryKeys.notificationSettings(),
    queryFn: async () => {
      const { data, error } = await api.GET("/user/notification-settings")
      if (error) throw error
      return data
    },
  })
}
