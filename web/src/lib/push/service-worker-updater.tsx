"use client"

import { useEffect } from "react"
import { getRegistration, isPushSupported } from "@/lib/push/register"

// Chequea actualizaciones del service worker en cada carga de la app. Sin
// esto, un dispositivo que ya está suscripto a notificaciones nunca vuelve a
// pedir sw.js — el único lugar que lo registraba era el flujo de "activar
// notificaciones" (una sola vez), así que un fix en sw.js podía quedar sin
// efecto en dispositivos ya suscriptos indefinidamente.
export function ServiceWorkerUpdater() {
  useEffect(() => {
    if (!isPushSupported()) return
    getRegistration().catch(() => {})
  }, [])

  return null
}
