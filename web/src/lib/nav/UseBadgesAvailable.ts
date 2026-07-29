"use client"

import { useEmojiState } from "@/app/(app)/profile/UseEmojiState"
import { unlockedDepth } from "@/lib/emoji-tree"
import { useBadgesSeenDepth } from "./badges-seen"

// True si el usuario desbloqueó (automáticamente, por XP) un hito de badges
// más profundo que el último que vio en la pantalla de badges. Maneja el
// puntito de "hito nuevo sin ver".
export function useBadgesAvailable(): boolean {
  const { data } = useEmojiState()
  const seenDepth = useBadgesSeenDepth()
  if (!data) return false
  return unlockedDepth(data.total_xp ?? 0) > seenDepth
}
