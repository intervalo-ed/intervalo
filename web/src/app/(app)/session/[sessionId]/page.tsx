import { auth } from "@clerk/nextjs/server"
import SessionRunner from "./session-runner"

export default async function SessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  await auth.protect({ unauthenticatedUrl: "/sign-in" })

  const { sessionId } = await params
  return <SessionRunner sessionId={sessionId} />
}
