"use client"

import type { ReactElement, ReactNode } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import type { Platform } from "@/lib/platform/detect"
import { MoreVerticalIcon, ShareIcon } from "lucide-react"

type Step = { text: string; icon?: ReactNode }

// El 4º paso (volver a abrir desde la pantalla de inicio) solo se muestra cuando
// `withReopenStep` está activo (pantalla post-registro), no en el diálogo normal.
const REOPEN_STEP: Step = {
  text: "Cerrá tu navegador y abrí Intervalo desde tu pantalla de inicio.",
}

const PLATFORM_STEPS: Record<
  Exclude<Platform, "desktop"> | "desktop",
  { title: string; steps: Step[] }
> = {
  ios: {
    title: "iPhone / iPad (Safari)",
    steps: [
      { text: "Tocá el botón Compartir", icon: <ShareIcon className="size-4" /> },
      { text: "Elegí «Agregar a inicio»." },
      { text: "Confirmá tocando «Agregar»." },
    ],
  },
  android: {
    title: "Android (Chrome)",
    steps: [
      { text: "Abrí el menú", icon: <MoreVerticalIcon className="size-4" /> },
      { text: "Elegí «Agregar a la pantalla principal»." },
      { text: "Confirmá tocando «Agregar»." },
    ],
  },
  desktop: {
    title: "Computadora",
    steps: [
      {
        text: "En Chrome o Edge, tocá el ícono de instalar en la barra de direcciones y confirmá.",
      },
    ],
  },
}

function StepList({
  steps,
  withReopenStep,
}: {
  steps: Step[]
  withReopenStep?: boolean
}) {
  const all = withReopenStep ? [...steps, REOPEN_STEP] : steps
  return (
    <ol className="flex flex-col gap-1 text-sm/relaxed text-muted-foreground">
      {all.map((step, i) => (
        <li key={i} className="flex items-center gap-2">
          {i + 1}. {step.text}
          {step.icon}
        </li>
      ))}
    </ol>
  )
}

export function InstallInstructions({
  platform,
  withReopenStep,
}: {
  platform: Platform | "all"
  withReopenStep?: boolean
}) {
  const keys: (keyof typeof PLATFORM_STEPS)[] =
    platform === "all" ? ["ios", "android", "desktop"] : [platform]

  return (
    <div className="flex flex-col gap-4">
      {keys.map((key) => (
        <div key={key} className="flex flex-col gap-1.5">
          <p className="text-sm font-medium text-foreground">
            {PLATFORM_STEPS[key].title}
          </p>
          <StepList
            steps={PLATFORM_STEPS[key].steps}
            withReopenStep={withReopenStep && key !== "desktop"}
          />
        </div>
      ))}
    </div>
  )
}

export function InstallDialog({
  platform = "all",
  trigger,
  open,
  onOpenChange,
}: {
  platform?: Platform | "all"
  trigger?: ReactElement
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger ? <DialogTrigger render={trigger} /> : null}
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-sans">Instalar Intervalo</DialogTitle>
          <DialogDescription>
            Agregá Intervalo a tu pantalla de inicio para abrirlo como una app.
          </DialogDescription>
        </DialogHeader>
        <InstallInstructions platform={platform} withReopenStep />
      </DialogContent>
    </Dialog>
  )
}
