import SessionSummary from "./session-summary"

export default async function SummaryPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const { sessionId } = await params
  return <SessionSummary sessionId={sessionId} />
}
