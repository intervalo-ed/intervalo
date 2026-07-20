"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { Wordmark } from "@/components/wordmark"
import { Screen, ScreenBody, ScreenHeader } from "@/components/ui/screen"
import {
  LeaderboardSkeleton,
  PracticeSkeleton,
  ProfileSkeleton,
} from "@/components/tab-skeletons"

// Mismo shell y skeleton que cada pantalla muestra una vez montada, elegido por
// pathname (server no sabe todavía a cuál de las 3 rutas del grupo se entra):
// cero movimiento al pasar de este fallback de ruteo al skeleton real.
export default function Loading() {
  const pathname = usePathname()
  const isPractice = pathname === "/practice"
  const body = isPractice ? (
    <PracticeSkeleton />
  ) : pathname === "/profile" ? (
    <ProfileSkeleton />
  ) : (
    <LeaderboardSkeleton />
  )

  return (
    <Screen>
      <ScreenHeader innerClassName="justify-center">
        <Link href="/" aria-label="Intervalo">
          <Wordmark textClass="text-[15px]" barClass="h-[3px]" />
        </Link>
      </ScreenHeader>
      <ScreenBody className={isPractice ? "gap-4 py-4" : undefined}>
        {body}
      </ScreenBody>
    </Screen>
  )
}
