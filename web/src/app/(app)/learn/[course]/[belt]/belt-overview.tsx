"use client"

export default function BeltOverview({
  course,
  belt,
}: {
  course: string
  belt: string
}) {
  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <h1 className="text-xl font-semibold">
        Cinturón: {belt} <span className="text-foreground/40">· {course}</span>
      </h1>
      <p className="mt-2 text-foreground/70">Topics list placeholder.</p>
    </div>
  )
}
