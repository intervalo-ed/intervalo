import { auth, currentUser } from "@clerk/nextjs/server"
import { SignOutButton } from "@clerk/nextjs"
import { redirect } from "next/navigation"
import Link from "next/link"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  // Backend has no `is_enrolled` field on /auth/me yet (gap #9). We track
  // onboarding completion in Clerk's unsafeMetadata, set by the wizard on
  // successful POST /user/enroll.
  const user = await currentUser()
  if (user?.unsafeMetadata?.onboarded !== true) redirect("/onboarding")

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b px-6 py-3">
        <Link href="/" className="font-semibold">
          Intervalo
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <SignOutButton>
            <button className="inline-flex h-8 items-center rounded-md border px-3">
              Cerrar sesión
            </button>
          </SignOutButton>
        </nav>
      </header>
      <div className="flex-1">{children}</div>
    </div>
  )
}
