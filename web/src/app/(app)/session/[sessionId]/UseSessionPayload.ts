"use client"

import { useEffect, useState } from "react"
import { readSession } from "@/lib/session/storage"
import type { SessionStartResponse } from "@/lib/api/types"

// undefined = SSR / not yet read; null = expired / missing; SessionStartResponse = ok.
export function useSessionPayload({ id }: { id: string }) {
  const [payload, setPayload] = useState<SessionStartResponse | null | undefined>(
    undefined,
  )
  useEffect(() => {
    setPayload(readSession({ id }))
  }, [id])
  return payload
}
