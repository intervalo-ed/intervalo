"use client"

import { useState } from "react"
import { AppIcon } from "@/components/app-icon"
import { Button } from "@/components/ui/button"
import { InstallInstructions } from "@/components/install-dialog"
import { useSfx } from "@/lib/audio/useSfx"
import { cn } from "@/lib/utils"
import { SmartphoneIcon } from "lucide-react"

const ctaCls =
  "h-12 w-full rounded-md bg-white text-black hover:bg-white/90 hover:text-black"

type Choice = "ios" | "android"

export function OnboardingInstallPrompt({
  onContinue,
}: {
  onContinue: () => void
}) {
  const sfx = useSfx()
  const [platform, setPlatform] = useState<Choice | null>(null)

  return (
    <main className="flex min-h-dvh flex-col bg-background px-4 py-8">
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-5">
        <div className="flex flex-col gap-3">
          <h2 className="text-2xl font-bold tracking-tight">¡Una cosa más!</h2>
          <p className="leading-relaxed text-foreground/85">
            Instalá la app para tener una mejor experiencia y poder establecer
            recordatorios para tus repasos.
          </p>
        </div>

        <div className="flex justify-center py-2">
          <AppIcon className="size-20 rounded-2xl" />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <PlatformButton
            label="Tengo iOS"
            active={platform === "ios"}
            onClick={() => {
              sfx.select()
              setPlatform("ios")
            }}
          />
          <PlatformButton
            label="Tengo Android"
            active={platform === "android"}
            onClick={() => {
              sfx.select()
              setPlatform("android")
            }}
          />
        </div>

        {platform && (
          <div className="rounded-md border border-white/10 bg-white/5 p-4">
            <InstallInstructions platform={platform} withReopenStep />
          </div>
        )}
      </div>

      <div className="mx-auto w-full max-w-sm shrink-0 pt-4">
        <Button
          size="lg"
          className={ctaCls}
          onClick={() => {
            sfx.continue()
            onContinue()
          }}
        >
          Continuar
        </Button>
      </div>
    </main>
  )
}

function PlatformButton({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <Button
      variant="outline"
      size="lg"
      className={cn("h-12 rounded-md", active && "border-white/40 bg-white/10")}
      aria-pressed={active}
      onClick={onClick}
    >
      <SmartphoneIcon className="size-5" />
      {label}
    </Button>
  )
}
