import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId, getToken } = await auth()
  if (!userId) redirect("/sign-in")

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
    // Si el backend no responde, deja pasar
  }

  return <>{children}</>
}
