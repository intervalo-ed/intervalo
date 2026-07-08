"use client"

import { SmartBarGate } from "@/components/smart-bar"
import { SplashGate } from "@/components/splash-gate"
import { NewsController } from "@/app/news-controller"

export default function AppChrome({
  children,
  splash,
}: {
  children: React.ReactNode
  splash: boolean
}) {
  return (
    <div className="app-shell flex h-dvh flex-col">
      <SmartBarGate />
      {splash && <NewsController />}
      <div className="min-h-0 flex-1">{children}</div>
      {splash && <SplashGate />}
    </div>
  )
}
