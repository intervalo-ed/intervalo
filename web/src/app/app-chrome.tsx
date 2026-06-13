"use client"

import { SmartBarGate } from "@/components/smart-bar"
import { SplashGate } from "@/components/splash-gate"

export default function AppChrome({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-dvh flex-col">
      <SmartBarGate />
      <div className="min-h-0 flex-1">{children}</div>
      <SplashGate />
    </div>
  )
}
