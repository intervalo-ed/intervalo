"use client"

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="mx-auto max-w-md px-6 py-16 text-center">
      <h2 className="text-lg font-semibold">Algo salió mal</h2>
      <p className="mt-2 text-sm text-foreground/70">{error.message}</p>
      <button
        onClick={reset}
        className="mt-4 inline-flex h-9 items-center rounded-md border px-4 text-sm"
      >
        Reintentar
      </button>
    </div>
  )
}
