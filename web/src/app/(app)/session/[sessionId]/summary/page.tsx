import { auth } from "@clerk/nextjs/server"
import SessionSummary from "./session-summary"

export default async function SummaryPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  await auth.protect({ unauthenticatedUrl: "/sign-in" })

  const { sessionId } = await params
  return <SessionSummary sessionId={sessionId} />
}
