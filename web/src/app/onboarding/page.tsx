import { auth, currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import OnboardingWizard from "./onboarding-wizard"

export default async function OnboardingPage() {
  const user = await currentUser()
  if (user?.unsafeMetadata?.onboarded === true) redirect("/")

  // Alguien logueado que llega acá (típicamente por "Ya tengo una cuenta" en
  // el step 0, ver Slide0) pero sin enrollment real en la DB es una cuenta
  // nueva creada al paso, no un usuario recurrente. La DB manda sobre el flag
  // de Clerk, igual que en /onboarding/complete y en la home.
  let alreadySignedIn = false
  if (user) {
    try {
      const { getToken } = await auth()
      const token = await getToken()
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/user/status`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      })
      if (res.ok) {
        const status = await res.json()
        if (status.enrolled || status.has_progress) redirect("/")
        alreadySignedIn = true
      }
    } catch {
      // Si el backend no responde, dejamos pasar como flujo normal
    }
  }

  return <OnboardingWizard alreadySignedIn={alreadySignedIn} />
}
