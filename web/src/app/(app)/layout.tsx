import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { Suspense } from "react"

// El chequeo de enrollment/progress pega al backend sin cache (`no-store`):
// si viviera inline en AppLayout, Next bloquea TODA la navegación hasta que
// resuelve y ningún loading.tsx de los hijos lo puede cubrir (loading.tsx
// vive por debajo del layout en el árbol). Aislado en su propio Suspense,
// esta pieza puede tardar sin bloquear el resto del layout ni a los hijos,
// que quedan libres de mostrar su propio loading.tsx mientras tanto.
async function EnrollmentGate() {
  const { getToken } = await auth()
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
  return null
}

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await auth.protect({ unauthenticatedUrl: "/sign-in" })

  return (
    <>
      <Suspense fallback={null}>
        <EnrollmentGate />
      </Suspense>
      {children}
    </>
  )
}
