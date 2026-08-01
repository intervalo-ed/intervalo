"use client"

import Link from "next/link"
import { Wordmark } from "@/components/wordmark"
import { Screen, ScreenBody, ScreenHeader } from "@/components/ui/screen"
import {
  DashboardSkeleton,
  LeaderboardSkeleton,
  PracticeSkeleton,
  ProfileSkeleton,
} from "@/components/tab-skeletons"

export type TabRoute = "/" | "/practice" | "/leaderboard" | "/profile"

// Mismo shell (Screen/ScreenHeader/ScreenBody) + skeleton que cada pantalla
// de la tab bar muestra una vez montada: cero movimiento al pasar de este
// fallback al skeleton real del cliente. Compartido entre los loading.tsx de
// ruteo y el overlay de transición entre tabs (ver tab-transition.ts) para
// que ambos queden siempre idénticos.
export function TabLoadingShell({ tab }: { tab: TabRoute }) {
  const body =
    tab === "/practice" ? (
      <PracticeSkeleton />
    ) : tab === "/profile" ? (
      <ProfileSkeleton />
    ) : tab === "/leaderboard" ? (
      <LeaderboardSkeleton />
    ) : (
      <DashboardSkeleton />
    )

  return (
    <Screen>
      <ScreenHeader innerClassName="justify-center">
        <Link href="/" aria-label="Intervalo">
          <Wordmark textClass="text-[15px]" barClass="h-[3px]" />
        </Link>
      </ScreenHeader>
      <ScreenBody
        className={
          tab === "/practice" || tab === "/"
            ? "gap-4 py-4 no-scrollbar"
            : "py-4"
        }
      >
        {body}
      </ScreenBody>
    </Screen>
  )
}
