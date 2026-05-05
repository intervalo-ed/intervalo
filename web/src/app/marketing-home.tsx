import Link from "next/link"

export default function MarketingHome() {
  return (
    <main className="mx-auto flex max-w-2xl flex-col items-center justify-center gap-6 px-6 py-24 text-center">
      <h1 className="text-4xl font-semibold tracking-tight">Intervalo</h1>
      <p className="text-balance text-lg text-foreground/70">
        Aprendé matemática con repetición espaciada. Sesiones cortas que se adaptan a vos.
      </p>
      <Link
        href="/sign-in"
        className="inline-flex h-11 items-center rounded-md bg-foreground px-6 font-medium text-background"
      >
        Empezar
      </Link>
    </main>
  )
}
