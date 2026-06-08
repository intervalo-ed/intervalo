import { BottomNav } from "@/components/bottom-nav"
import { Wordmark } from "@/components/wordmark"
import { Screen, ScreenBody, ScreenHeader } from "@/components/ui/screen"
import Link from "next/link"
import { LeaderboardContent } from "./leaderboard-content"

export default function LeaderboardPage() {
  return (
    <Screen>
      <ScreenHeader innerClassName="justify-center">
        <Link href="/" aria-label="Intervalo">
          <Wordmark textClass="text-[15px]" barClass="h-[3px]" />
        </Link>
      </ScreenHeader>
      <ScreenBody>
        <LeaderboardContent />
      </ScreenBody>
      <BottomNav />
    </Screen>
  )
}
