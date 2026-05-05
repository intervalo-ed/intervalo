import TopicOverview from "./topic-overview"

export default async function TopicPage({
  params,
}: {
  params: Promise<{ course: string; belt: string; topic: string }>
}) {
  const { course, belt, topic } = await params
  return <TopicOverview course={course} belt={belt} topic={topic} />
}
