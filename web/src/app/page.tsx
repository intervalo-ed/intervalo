import { auth } from "@clerk/nextjs/server"
import MarketingHome from "./marketing-home"
import DashboardEntry from "./dashboard-entry"

export default async function Home() {
  const { userId } = await auth()
  return userId ? <DashboardEntry /> : <MarketingHome />
}
