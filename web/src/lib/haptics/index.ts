"use client"

import { WebHaptics } from "web-haptics"

export type HapticPreset =
  | "success"
  | "warning"
  | "error"
  | "light"
  | "medium"
  | "heavy"
  | "soft"
  | "rigid"
  | "selection"
  | "nudge"
  | "buzz"

let instance: WebHaptics | null = null

function getHaptics(): WebHaptics {
  if (!instance) instance = new WebHaptics()
  return instance
}

export function haptic({ preset }: { preset: HapticPreset }): void {
  void getHaptics().trigger(preset)
}
