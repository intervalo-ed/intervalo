"use client"

import { isStandalone } from "@/lib/platform/detect"

// El pedido de instalar/activar notificaciones se muestra al terminar una
// sesión, pero el estado "ya lo vio" NO puede ser un único booleano: el mismo
// dispositivo pasa por dos momentos distintos, y cada uno pide una cosa
// distinta.
//
//   navegador  → "agregá Intervalo a tu pantalla de inicio"
//   instalada  → "activá los recordatorios"
//
// Con un flag global, quien ve el primero nunca llega al segundo. En Android el
// PWA instalado comparte localStorage con Chrome, así que el flag viaja y la
// persona jamás activa notificaciones; en iOS el almacenamiento está
// particionado y reaparece de casualidad. Guardar el estado por contexto hace
// que las dos plataformas se comporten igual.
export type NotifyHintContext = "browser" | "standalone"

// Cada cuántas sesiones vuelve a aparecer para quien no aceptó, y cuántas veces
// como máximo: pasado ese tope dejamos de insistir.
const CADENCE = 3
const MAX_SHOWS = 4

const STORAGE_PREFIX = "intervalo:notify-hint"

type HintState = { shows: number; lastSession: number }

export function getNotifyHintContext(): NotifyHintContext {
  return isStandalone() ? "standalone" : "browser"
}

function storageKey(context: NotifyHintContext): string {
  return `${STORAGE_PREFIX}:${context}`
}

function readState(context: NotifyHintContext): HintState | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(storageKey(context))
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<HintState>
    if (
      typeof parsed?.shows !== "number" ||
      typeof parsed?.lastSession !== "number"
    ) {
      return null
    }
    return { shows: parsed.shows, lastSession: parsed.lastSession }
  } catch {
    return null
  }
}

export function shouldShowNotifyHint({
  context,
  sessionNumber,
}: {
  context: NotifyHintContext
  sessionNumber: number
}): boolean {
  const state = readState(context)
  if (!state) return true
  if (state.shows >= MAX_SHOWS) return false
  return sessionNumber - state.lastSession >= CADENCE
}

// Devuelve el estado resultante para que quien muestra la pestaña pueda
// reportar en telemetría qué número de aparición fue (1ª invitación vs 4ª
// insistencia).
export function markNotifyHintSeen({
  context,
  sessionNumber,
}: {
  context: NotifyHintContext
  sessionNumber: number
}): HintState {
  const state = typeof window === "undefined" ? null : readState(context)
  const next: HintState = {
    shows: (state?.shows ?? 0) + 1,
    lastSession: sessionNumber,
  }
  if (typeof window === "undefined") return next
  try {
    window.localStorage.setItem(storageKey(context), JSON.stringify(next))
  } catch {
    // Modo privado / cuota llena: perder el registro solo hace que el pedido
    // vuelva a aparecer, que es preferible a romper el summary.
  }
  return next
}
