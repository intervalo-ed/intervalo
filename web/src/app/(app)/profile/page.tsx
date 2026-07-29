import { Wordmark } from "@/components/wordmark"
import { Screen, ScreenBody, ScreenHeader } from "@/components/ui/screen"
import { auth } from "@clerk/nextjs/server"
import Link from "next/link"
import { ProfileContent } from "./profile-content"

export default async function ProfilePage() {
  await auth.protect({ unauthenticatedUrl: "/sign-in" })

  return (
    <Screen>
      <ScreenHeader innerClassName="justify-center">
        <Link href="/" aria-label="Intervalo">
          <Wordmark textClass="text-[15px]" barClass="h-[3px]" />
        </Link>
      </ScreenHeader>
      <ScreenBody>
        <ProfileContent />
      </ScreenBody>
    </Screen>
  )
}
