import { BottomNav } from "@/components/bottom-nav"
import { Screen, ScreenBody, ScreenHeader } from "@/components/ui/screen"
import { LeaderboardContent } from "./leaderboard-content"

export default function LeaderboardPage() {
  return (
    <Screen>
      <ScreenHeader>
        <h1 className="text-lg font-semibold">Ranking</h1>
      </ScreenHeader>
      <ScreenBody>
        <LeaderboardContent />
      </ScreenBody>
      <BottomNav />
    </Screen>
  )
}
