"use client"

export default function SessionRunner({ sessionId }: { sessionId: string }) {
  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <h1 className="text-xl font-semibold">Sesión {sessionId}</h1>
      <p className="mt-2 text-foreground/70">SessionRunner placeholder.</p>
    </div>
  )
}
