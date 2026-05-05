import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import Link from "next/link"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  // TODO (Phase 3): check enrollment status and redirect to /onboarding if missing.
  // Backend has no "is enrolled" endpoint — pick from /auth/me display_name or
  // /user/progress skill_states being empty. Decide during onboarding implementation.

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b px-6 py-3">
        <Link href="/" className="font-semibold">
          Intervalo
        </Link>
        <nav className="flex items-center gap-4 text-sm">{/* level chip slot */}</nav>
      </header>
      <div className="flex-1">{children}</div>
    </div>
  )
}
