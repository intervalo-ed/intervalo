"use client"

import { useEmojiState } from "@/app/(app)/profile/UseEmojiState"
import { DEPTH_XP, findNode, getRoot } from "@/lib/emoji-tree"

// True si el usuario tiene al menos un badge desbloqueable ahora mismo: en la
// frontera (hijos del último nodo elegido) hay opciones y le alcanza la XP para
// el umbral de esa profundidad. Maneja el puntito de "badges disponibles".
export function useBadgesAvailable(): boolean {
  const { data } = useEmojiState()
  if (!data) return false
  const root = getRoot(data.bucket)
  if (!root) return false

  const path = data.path ?? []
  const tipId = path.length ? path[path.length - 1] : root.id
  const tip = findNode(data.bucket, tipId)
  const children = tip?.children ?? []
  if (children.length === 0) return false

  // Los hijos de la frontera están a profundidad path.length + 1.
  const threshold = DEPTH_XP[path.length + 1]
  if (threshold == null) return false
  return (data.total_xp ?? 0) >= threshold
}
