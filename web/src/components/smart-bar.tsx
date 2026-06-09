"use client"

import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { useUser } from "@clerk/nextjs"
import { AppIcon } from "@/components/app-icon"
import { Button } from "@/components/ui/button"
import { InstallDialog } from "@/components/install-dialog"
import { getPlatform, isStandalone, type Platform } from "@/lib/platform/detect"

// Rutas donde NO debe verse la smart bar (marketing queda fuera porque ahí el
// usuario está deslogueado).
const HIDDEN_PREFIXES = ["/onboarding", "/sign-in", "/sso-callback"]

function SmartBar() {
  const [open, setOpen] = useState(false)
  const [platform, setPlatform] = useState<Platform>("desktop")

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPlatform(getPlatform())
  }, [])

  return (
    <>
      <div className="shrink-0 border-b border-black/10 bg-white text-black">
        <div className="mx-auto flex w-full max-w-2xl items-center gap-3 px-5 py-2">
          <AppIcon className="size-9 shrink-0" />
          <span className="flex-1 text-sm font-medium">¡Utilizá la app!</span>
          <Button
            size="sm"
            className="rounded-[4px] bg-[#5457E5] px-3 font-mono text-xs font-medium uppercase tracking-[0.1em] text-[#F6F8FC] transition-none hover:bg-[#7E80F7] active:translate-y-0"
            onClick={() => setOpen(true)}
          >
            ABRIR
          </Button>
        </div>
      </div>
      <InstallDialog platform={platform} open={open} onOpenChange={setOpen} />
    </>
  )
}

export function SmartBarGate() {
  const { isLoaded, isSignedIn } = useUser()
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  const [standalone, setStandalone] = useState(false)

  useEffect(() => {
    // Detección post-montaje (standalone/instalada) para evitar mismatch SSR.
    /* eslint-disable react-hooks/set-state-in-effect */
    setMounted(true)
    setStandalone(isStandalone())
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [])

  if (!mounted || !isLoaded || !isSignedIn || standalone) return null
  if (HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) return null

  return <SmartBar />
}
