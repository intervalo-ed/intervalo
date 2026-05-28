import { BottomNav } from "@/components/bottom-nav"
import { Screen, ScreenBody, ScreenHeader } from "@/components/ui/screen"

export default function LeaderboardPage() {
  return (
    <Screen>
      <ScreenHeader>
        <h1 className="text-lg font-semibold">Ranking</h1>
      </ScreenHeader>
      <ScreenBody />
      <BottomNav />
    </Screen>
  )
}
