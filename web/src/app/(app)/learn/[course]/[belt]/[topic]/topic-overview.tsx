"use client"

export default function TopicOverview({
  course,
  belt,
  topic,
}: {
  course: string
  belt: string
  topic: string
}) {
  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <h1 className="text-xl font-semibold">
        Tema: {topic}{" "}
        <span className="text-foreground/40">
          · {belt} · {course}
        </span>
      </h1>
      <p className="mt-2 text-foreground/70">Items grid placeholder.</p>
    </div>
  )
}
