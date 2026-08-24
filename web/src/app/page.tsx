import { auth } from "@clerk/nextjs/server"
import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { fetchUserStatus } from "@/lib/api/user-status"
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
  // Si el backend no responde, fetchUserStatus devuelve null y dejamos pasar
  // al dashboard — DashboardEntry re-chequea del lado del cliente.
  const status = await fetchUserStatus(getToken)
  if (status && !status.enrolled) redirect("/onboarding/complete")

  return <DashboardEntry />
}
