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

  // Cuentas sin enrollment van a /onboarding/complete, que decide entre el
  // wizard completo o el formulario corto de recuperación según tengan o no
  // progreso. OJO: redirect() funciona tirando una excepción NEXT_REDIRECT,
  // así que tiene que quedar FUERA del try — adentro, el catch se la tragaba
  // y este gate fue un no-op desde que se escribió (usuarios 137/172 pasaron
  // por acá sin perfil).
  let enrolled = true
  try {
    const token = await getToken()
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/user/status`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    })
    if (res.ok) {
      const status = await res.json()
      enrolled = Boolean(status.enrolled)
    }
  } catch (err) {
    // Si el backend no responde, deja pasar al dashboard — DashboardEntry
    // re-chequea del lado del cliente. El log queda para poder ver en Railway
    // con qué frecuencia este chequeo falla en silencio.
    console.error("[home-gate] /user/status check failed:", err)
  }
  if (!enrolled) redirect("/onboarding/complete")

  return <DashboardEntry />
}
