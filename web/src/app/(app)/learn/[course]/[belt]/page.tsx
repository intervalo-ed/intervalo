import BeltOverview from "./belt-overview"

export default async function BeltPage({
  params,
}: {
  params: Promise<{ course: string; belt: string }>
}) {
  const { course, belt } = await params
  return <BeltOverview course={course} belt={belt} />
}
