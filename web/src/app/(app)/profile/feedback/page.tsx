import { auth } from "@clerk/nextjs/server"
import { FeedbackFlow } from "./feedback-flow"

export default async function FeedbackPage() {
  await auth.protect({ unauthenticatedUrl: "/sign-in" })

  return <FeedbackFlow />
}
