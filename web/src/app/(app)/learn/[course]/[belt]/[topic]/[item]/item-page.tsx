"use client"

export default function ItemPage({
  course,
  belt,
  topic,
  item,
}: {
  course: string
  belt: string
  topic: string
  item: string
}) {
  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <h1 className="text-xl font-semibold">
        Ítem: {item}{" "}
        <span className="text-foreground/40">
          · {topic} · {belt} · {course}
        </span>
      </h1>
      <p className="mt-2 text-foreground/70">
        Item explanation + Practicar button placeholder.
      </p>
    </div>
  )
}
