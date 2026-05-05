"use client"

export default function CourseOverview({ course }: { course: string }) {
  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <h1 className="text-xl font-semibold">Curso: {course}</h1>
      <p className="mt-2 text-foreground/70">Belts grid placeholder.</p>
    </div>
  )
}
