import { auth, currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"

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

  return <>{children}</>
}
