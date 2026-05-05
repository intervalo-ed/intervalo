"use client"

import Link from "next/link"

export default function SessionError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="mx-auto max-w-md px-6 py-16 text-center">
      <h2 className="text-lg font-semibold">La sesión se interrumpió</h2>
      <p className="mt-2 text-sm text-foreground/70">{error.message}</p>
      <div className="mt-4 flex justify-center gap-2">
        <button
          onClick={reset}
          className="inline-flex h-9 items-center rounded-md border px-4 text-sm"
        >
          Reintentar
        </button>
        <Link
          href="/"
          className="inline-flex h-9 items-center rounded-md bg-foreground px-4 text-sm text-background"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  )
}
