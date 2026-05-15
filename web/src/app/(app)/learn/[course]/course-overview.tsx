"use client"

import BeltCard from "@/components/belt-card"
import { BELT_ORDER } from "@/lib/catalog"
import { useUserProgress } from "@/app/UseUserProgress"

export default function CourseOverview({ course }: { course: string }) {
  const { data, isLoading, isError, error } = useUserProgress()

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-8">
      <h1 className="text-2xl font-semibold">Análisis 1</h1>

      {isLoading && <p className="text-foreground/60">Cargando…</p>}
      {isError && <p className="text-red-500">Error: {error.message}</p>}
      {data && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {BELT_ORDER.map((belt) => (
            <BeltCard
              key={belt}
              belt={belt}
              course={course}
              skillStates={data.skill_states}
            />
          ))}
        </div>
      )}
    </main>
  )
}
