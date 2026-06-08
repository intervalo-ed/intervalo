"use client"

import { Button } from "@/components/ui/button"
import { Screen, ScreenBody } from "@/components/ui/screen"

const ctaCls =
  "h-12 w-full rounded-md bg-white text-black hover:bg-white/90 hover:text-black"

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <Screen>
      <ScreenBody className="items-center justify-center text-center">
        <div className="flex flex-col items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight">Algo salió mal</h1>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </div>
      </ScreenBody>
      <div className="shrink-0 p-5">
        <div className="mx-auto w-full max-w-2xl">
          <Button size="lg" className={ctaCls} onClick={reset}>
            Reintentar
          </Button>
        </div>
      </div>
    </Screen>
  )
}
