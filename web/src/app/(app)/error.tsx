"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-6 py-16 text-center">
      <Alert variant="destructive">
        <AlertTitle>Algo salió mal</AlertTitle>
        <AlertDescription>{error.message}</AlertDescription>
      </Alert>
      <Button variant="outline" onClick={reset}>
        Reintentar
      </Button>
    </div>
  )
}
