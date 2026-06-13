"use client"

import { createContext, useCallback, useContext, useState } from "react"

type SplashContextValue = {
  ready: boolean
  markReady: () => void
}

const SplashContext = createContext<SplashContextValue | null>(null)

export function SplashProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false)
  const markReady = useCallback(() => setReady(true), [])

  return (
    <SplashContext.Provider value={{ ready, markReady }}>
      {children}
    </SplashContext.Provider>
  )
}

export function useSplash() {
  const ctx = useContext(SplashContext)
  if (!ctx) throw new Error("useSplash debe usarse dentro de SplashProvider")
  return ctx
}
