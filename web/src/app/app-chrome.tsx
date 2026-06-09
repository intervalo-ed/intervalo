"use client"

import { SmartBarGate } from "@/components/smart-bar"

export default function AppChrome({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-dvh flex-col">
      <SmartBarGate />
      <div className="min-h-0 flex-1">{children}</div>
    </div>
  )
}
