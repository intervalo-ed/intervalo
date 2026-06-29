import { auth } from "@clerk/nextjs/server"
import type { Metadata } from "next"
import { redirect } from "next/navigation"
import MarketingHome from "./marketing-home"
import DashboardEntry from "./dashboard-entry"

export async function generateMetadata(): Promise<Metadata> {
  return {}
}

export default async function Home() {
  const { userId, getToken } = await auth()
  if (!userId) return <MarketingHome />

  try {
    const token = await getToken()
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/user/status`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    })
    if (res.ok) {
      const status = await res.json()
      if (!status.enrolled && !status.has_progress) redirect("/onboarding/complete")
    }
  } catch {
    // Si el backend no responde, deja pasar al dashboard
  }

  return <DashboardEntry />
}
