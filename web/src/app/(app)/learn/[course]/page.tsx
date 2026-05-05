import CourseOverview from "./course-overview"

export default async function CoursePage({
  params,
}: {
  params: Promise<{ course: string }>
}) {
  const { course } = await params
  return <CourseOverview course={course} />
}
