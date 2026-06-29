"use client"

import { Button } from "@/components/ui/button"

export default function OnboardingError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-background px-4 text-center">
      <div className="flex flex-col items-center gap-2">
        <h2 className="font-sans text-2xl font-bold tracking-tight">Algo salió mal</h2>
        <p className="text-sm text-muted-foreground">{error.message}</p>
      </div>
      <Button
        size="lg"
        className="h-12 w-full max-w-xs rounded-md bg-white text-black hover:bg-white/90 hover:text-black"
        onClick={reset}
      >
        Reintentar
      </Button>
    </main>
  )
}
