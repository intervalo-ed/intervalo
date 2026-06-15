"use client"

import { SmartBarGate } from "@/components/smart-bar"
import { SplashGate } from "@/components/splash-gate"

export default function AppChrome({
  children,
  splash,
}: {
  children: React.ReactNode
  splash: boolean
}) {
  return (
    <div className="flex h-dvh flex-col">
      <SmartBarGate />
      <div className="min-h-0 flex-1">{children}</div>
      {splash && <SplashGate />}
    </div>
  )
}
