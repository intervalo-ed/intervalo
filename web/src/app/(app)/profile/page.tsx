import { BottomNav } from "@/components/bottom-nav"
import { Wordmark } from "@/components/wordmark"
import { Screen, ScreenBody, ScreenHeader } from "@/components/ui/screen"
import Link from "next/link"
import { ProfileContent } from "./profile-content"

export default function ProfilePage() {
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
      <BottomNav />
    </Screen>
  )
}
