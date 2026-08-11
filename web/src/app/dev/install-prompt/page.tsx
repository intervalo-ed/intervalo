"use client"

import { notFound } from "next/navigation"
import { useState } from "react"
import { OnboardingInstallPrompt } from "@/app/onboarding/complete/install-prompt"
import type { Platform } from "@/lib/platform/detect"

const OPTIONS: Platform[] = ["ios", "android", "desktop"]

// Vista suelta de la pantalla "¡Una cosa más!" para poder mirarla sin rehacer
// todo el onboarding (normalmente solo aparece una vez, justo después del
// registro). Solo existe en `next dev`: en producción la ruta es 404.
//
// El selector de arriba fuerza la plataforma, que si no en escritorio siempre
// caería en los pasos de "Computadora".
export default function DevInstallPromptPage() {
  const [platform, setPlatform] = useState<Platform | undefined>(undefined)

  if (process.env.NODE_ENV === "production") notFound()

  return (
    <>
      <div className="fixed top-2 right-2 z-50 flex gap-1 rounded-md border border-white/10 bg-background/90 p-1 text-xs">
        {OPTIONS.map((p) => (
          <button
            key={p}
            type="button"
            className={
              platform === p
                ? "rounded bg-white px-2 py-1 text-black"
                : "rounded px-2 py-1 text-foreground/60"
            }
            onClick={() => setPlatform(platform === p ? undefined : p)}
          >
            {p}
          </button>
        ))}
      </div>
      <OnboardingInstallPrompt
        key={platform ?? "auto"}
        platformOverride={platform}
      />
    </>
  )
}
