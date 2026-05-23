"use client"

import Link from "next/link"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

export default function SessionError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-6 py-16 text-center">
      <Alert variant="destructive">
        <AlertTitle>La sesión se interrumpió</AlertTitle>
        <AlertDescription>{error.message}</AlertDescription>
      </Alert>
      <div className="flex justify-center gap-2">
        <Button variant="outline" onClick={reset}>
          Reintentar
        </Button>
        <Button render={<Link href="/" />}>Volver al inicio</Button>
      </div>
    </div>
  )
}
