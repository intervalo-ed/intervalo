import { auth, currentUser } from "@clerk/nextjs/server"
import type { Metadata } from "next"
import { redirect } from "next/navigation"
import MarketingHome from "./marketing-home"
import DashboardEntry from "./dashboard-entry"

export async function generateMetadata(): Promise<Metadata> {
  return {}
}

export default async function Home() {
  const { userId } = await auth()
  if (!userId) return <MarketingHome />

  const user = await currentUser()
  if (user?.unsafeMetadata?.onboarded !== true) redirect("/onboarding/complete")

  return <DashboardEntry />
}
