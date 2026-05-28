import { BottomNav } from "@/components/bottom-nav"
import { Screen, ScreenBody, ScreenHeader } from "@/components/ui/screen"

export default function SettingsPage() {
  return (
    <Screen>
      <ScreenHeader>
        <h1 className="text-lg font-semibold">Ajustes</h1>
      </ScreenHeader>
      <ScreenBody />
      <BottomNav />
    </Screen>
  )
}
