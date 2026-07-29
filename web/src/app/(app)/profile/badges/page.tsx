import { auth } from "@clerk/nextjs/server"
import { EmojiTreeScreen } from "../badge-tree-screen"

export default async function BadgesPage() {
  await auth.protect({ unauthenticatedUrl: "/sign-in" })

  return <EmojiTreeScreen />
}
