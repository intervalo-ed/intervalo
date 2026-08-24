import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { Suspense } from "react"
import { fetchUserStatus } from "@/lib/api/user-status"
import { ServiceWorkerUpdater } from "@/lib/push/service-worker-updater"

// El chequeo de enrollment/progress pega al backend sin cache (`no-store`):
// si viviera inline en AppLayout, Next bloquea TODA la navegación hasta que
// resuelve y ningún loading.tsx de los hijos lo puede cubrir (loading.tsx
// vive por debajo del layout en el árbol). Aislado en su propio Suspense,
// esta pieza puede tardar sin bloquear el resto del layout ni a los hijos,
// que quedan libres de mostrar su propio loading.tsx mientras tanto.
async function EnrollmentGate() {
  const { getToken } = await auth()
  // Ver comentario equivalente en app/page.tsx: no alcanza con "sin
  // progreso", hay cuentas con progreso real pero sin Enrollment. Y el
  // redirect() va FUERA de cualquier try: tira NEXT_REDIRECT, así que un
  // catch se lo traga y el gate queda apagado — que es lo que pasaba acá.
  const status = await fetchUserStatus(getToken)
  if (status && !status.enrolled) redirect("/onboarding/complete")
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
      <ServiceWorkerUpdater />
      {children}
    </>
  )
}
