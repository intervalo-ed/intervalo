import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import OnboardingWizard from "./onboarding-wizard"

export default async function OnboardingPage() {
  const user = await currentUser()
  if (user?.unsafeMetadata?.onboarded === true) redirect("/")
  return <OnboardingWizard />
}
