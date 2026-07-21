"use client"

import { Wordmark } from "@/components/wordmark"
import { Screen, ScreenBody, ScreenHeader } from "@/components/ui/screen"
import { DashboardSkeleton } from "@/components/tab-skeletons"
import Link from "next/link"

// Mismo shell (Screen/ScreenHeader/ScreenBody) y skeleton que dashboard-entry.tsx
// muestra una vez montado: cero movimiento al pasar de este fallback de ruteo
// (server, mientras corre el chequeo de onboarding) al skeleton real del cliente.
export default function Loading() {
  return (
    <Screen>
      <ScreenHeader innerClassName="justify-center">
        <Link href="/" aria-label="Intervalo">
          <Wordmark textClass="text-[15px]" barClass="h-[3px]" />
        </Link>
      </ScreenHeader>
      <ScreenBody className="gap-4 py-4 no-scrollbar">
        <DashboardSkeleton />
      </ScreenBody>
    </Screen>
  )
}
