"use client"

import { usePathname } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { useUser } from "@clerk/nextjs"
import posthog from "posthog-js"
import { AppIcon } from "@/components/app-icon"
import { Button } from "@/components/ui/button"
import { InstallSheet } from "@/components/install-sheet"
import { getPlatform, isStandalone, type Platform } from "@/lib/platform/detect"

// Rutas donde NO debe verse la smart bar (marketing queda fuera porque ahí el
// usuario está deslogueado).
const HIDDEN_PREFIXES = ["/onboarding", "/sign-in", "/sso-callback"]

// El resumen de sesión encadena animaciones (conteo de XP, de ejercicios
// correctos, de días de racha) y termina en las slides de notificaciones e
// instalación: una barra blanca arriba las ensucia y les come alto. Va por
// sufijo porque la ruta es /session/<id>/summary.
const HIDDEN_SUFFIXES = ["/summary"]

function SmartBar({ platform }: { platform: Platform }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  // Cuándo se abrió la sheet, para medir cuánto duró abierta al cerrarse. Es la
  // diferencia entre quien la cerró en dos segundos (no lo convenció el título)
  // y quien estuvo veinte y no instaló igual (los pasos no se entienden, o no
  // estaba frente al menú del navegador). Son dos problemas distintos.
  const openedAtRef = useRef(0)

  return (
    <>
      <div className="shrink-0 border-b border-black/10 bg-white text-black">
        <div className="mx-auto flex w-full max-w-2xl items-center gap-3 px-5 py-2">
          <AppIcon className="size-9 shrink-0" />
          <span className="flex-1 text-sm font-medium">¡Utilizá la app!</span>
          <Button
            size="sm"
            className="rounded-[4px] bg-[#5457E5] px-3 font-mono text-xs font-medium uppercase tracking-[0.1em] text-[#F6F8FC] transition-none hover:bg-[#7E80F7] active:translate-y-0"
            onClick={() => {
              posthog.capture("install_banner_tap", {
                platform,
                page: pathname,
              })
              openedAtRef.current = Date.now()
              setOpen(true)
            }}
          >
            AÑADIR
          </Button>
        </div>
      </div>
      {/* El cierre se mide acá y no en la sheet (que queda presentacional) para
          que el evento salga igual por el botón, por Escape o por el gesto de
          atrás: los tres pasan por onOpenChange. Si instaló o no lo dice el
          pwa_install posterior (ver instrumentation-client.ts), no este evento. */}
      <InstallSheet
        platform={platform}
        open={open}
        onOpenChange={(next) => {
          if (!next && open) {
            posthog.capture("install_sheet_dismiss", {
              platform,
              page: pathname,
              ms_open: Date.now() - openedAtRef.current,
            })
          }
          setOpen(next)
        }}
      />
    </>
  )
}

export function SmartBarGate() {
  const { isLoaded, isSignedIn } = useUser()
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  const [standalone, setStandalone] = useState(false)
  const [platform, setPlatform] = useState<Platform>("desktop")

  // Clerk puede reportar `isLoaded: false` un instante durante navegaciones
  // que disparan un round-trip de `auth.protect()` en el server (p. ej. entrar
  // a /practice desde afuera del grupo (app)), aunque la sesión siga
  // vigente — eso hacía parpadear/desaparecer la barra (la tab bar no sufre
  // esto porque solo depende del pathname). Una vez que vimos al usuario
  // logueado, lo dejamos "enganchado" y no volvemos a ocultar la barra por
  // esta razón.
  const everSignedInRef = useRef(false)
  if (isLoaded && isSignedIn) everSignedInRef.current = true

  useEffect(() => {
    // Detección post-montaje (standalone/instalada) para evitar mismatch SSR.
    /* eslint-disable react-hooks/set-state-in-effect */
    setMounted(true)
    setStandalone(isStandalone())
    setPlatform(getPlatform())
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [])

  // En escritorio no se ofrece instalar: Chrome y Edge mandan push sin PWA, así
  // que la barra solo ocuparía lugar.
  if (!mounted || !everSignedInRef.current || standalone) return null
  if (platform === "desktop") return null
  if (HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) return null
  if (HIDDEN_SUFFIXES.some((s) => pathname.endsWith(s))) return null

  return <SmartBar platform={platform} />
}
