import { auth } from "@clerk/nextjs/server"
import PracticeConfig from "./practice-config"

export default async function PracticePage() {
  await auth.protect({ unauthenticatedUrl: "/sign-in" })

  return <PracticeConfig />
}
