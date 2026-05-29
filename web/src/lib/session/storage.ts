import type { SessionStartResponse } from "@/lib/api/types"

const KEY_PREFIX = "intervalo:session:"

// SessionStartResponse holds the full exercise list. Backend has no
// GET /session/{id}, so we cache here for refresh-resume. Tracked as gap #4.
export function stashSession({
  id,
  payload,
}: {
  id: string
  payload: SessionStartResponse
}) {
  if (typeof window === "undefined") return
  sessionStorage.setItem(KEY_PREFIX + id, JSON.stringify(payload))
}

export function readSession({
  id,
}: {
  id: string
}): SessionStartResponse | null {
  if (typeof window === "undefined") return null
  const raw = sessionStorage.getItem(KEY_PREFIX + id)
  if (!raw) return null
  try {
    return JSON.parse(raw) as SessionStartResponse
  } catch {
    return null
  }
}

export function clearSession({ id }: { id: string }) {
  if (typeof window === "undefined") return
  sessionStorage.removeItem(KEY_PREFIX + id)
}
