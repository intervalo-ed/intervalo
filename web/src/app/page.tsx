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
      // Antes solo entraba acá sin enrollment NI progreso — pero eso dejaba
      // pasar a cuentas con progreso real (unit_states) que nunca llegaron a
      // enrolarse (ej. el bug de "Ya tengo una cuenta"), sin universidad ni
      // carrera para siempre. /onboarding/complete decide entre el wizard
      // completo o el formulario corto de recuperación según el caso.
      if (!status.enrolled) redirect("/onboarding/complete")
    }
  } catch {
    // Si el backend no responde, deja pasar al dashboard
  }

  return <DashboardEntry />
}
