"use client"

import type { ReactNode } from "react"
import { Button } from "@/components/ui/button"

/**
 * Pantalla de error a página completa con acción de reintento.
 *
 * El mismo markup estaba repetido en los tres `error.tsx` y otra vez inline en
 * `/onboarding/complete`. Está acá para que las cuatro digan lo mismo y para
 * no escribir una quinta.
 */
export function ErrorState({
  message,
  onRetry,
  retryLabel = "Reintentar",
  secondary,
}: {
  message: string
  onRetry: () => void
  retryLabel?: string
  secondary?: ReactNode
}) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-background px-4 text-center">
      <div className="flex flex-col items-center gap-2">
        <h2 className="font-sans text-2xl font-bold tracking-tight">Algo salió mal</h2>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
      <div className="flex w-full max-w-xs flex-col items-center gap-3">
        <Button
          size="lg"
          className="h-12 w-full rounded-md bg-white text-black hover:bg-white/90 hover:text-black"
          onClick={onRetry}
        >
          {retryLabel}
        </Button>
        {secondary}
      </div>
    </main>
  )
}
