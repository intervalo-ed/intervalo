import ItemPage from "./item-page"

export default async function Page({
  params,
}: {
  params: Promise<{
    course: string
    belt: string
    topic: string
    item: string
  }>
}) {
  const { course, belt, topic, item } = await params
  return <ItemPage course={course} belt={belt} topic={topic} item={item} />
}
