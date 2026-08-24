import { auth, currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { fetchUserStatus } from "@/lib/api/user-status"
import OnboardingWizard from "./onboarding-wizard"

export default async function OnboardingPage() {
  const user = await currentUser()
  if (user?.unsafeMetadata?.onboarded === true) redirect("/")

  // Alguien logueado que llega acá (típicamente por "Ya tengo una cuenta" en
  // el step 0, ver Slide0) pero sin enrollment real en la DB es una cuenta
  // nueva creada al paso, no un usuario recurrente. La DB manda sobre el flag
  // de Clerk, igual que en /onboarding/complete y en la home.
  // Los redirect() van FUERA del try de fetchUserStatus: tiran NEXT_REDIRECT
  // y un catch se los traga, que es como este gate quedó apagado.
  let alreadySignedIn = false
  if (user) {
    const { getToken } = await auth()
    const status = await fetchUserStatus(getToken)
    if (status?.enrolled) redirect("/")
    // Progreso real sin Enrollment: no lo hacemos repetir el onboarding
    // entero, /onboarding/complete le muestra el formulario corto de
    // recuperación (solo carrera + universidad).
    if (status?.has_progress) redirect("/onboarding/complete")
    alreadySignedIn = status !== null
  }

  return <OnboardingWizard alreadySignedIn={alreadySignedIn} />
}
