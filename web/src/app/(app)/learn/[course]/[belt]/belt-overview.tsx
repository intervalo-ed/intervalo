"use client"

import Link from "next/link"
import {
  beltLabel,
  getBelt,
  topicLabel,
  type BeltKey,
} from "@/lib/catalog"
import { itemStatus } from "@/lib/catalog/stats"
import { useUserProgress } from "@/app/UseUserProgress"

const VALID_BELTS: BeltKey[] = ["white", "blue", "violet", "brown", "black"]

export default function BeltOverview({
  course,
  belt,
}: {
  course: string
  belt: string
}) {
  const beltKey = VALID_BELTS.includes(belt as BeltKey) ? (belt as BeltKey) : null
  const beltCatalog = beltKey ? getBelt({ key: beltKey }) : null
  const { data } = useUserProgress()

  if (!beltKey || !beltCatalog) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-8">
        <p className="text-red-500">Cinturón no encontrado</p>
      </main>
    )
  }

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-8">
      <div>
        <Link
          href={`/learn/${course}`}
          className="text-sm text-foreground/60 hover:text-foreground"
        >
          ← Volver
        </Link>
        <h1 className="mt-1 text-2xl font-semibold">
          Cinturón {beltLabel({ belt: beltKey })}
        </h1>
      </div>

      <ul className="flex flex-col gap-2">
        {beltCatalog.topics.map((topic) => {
          const totalItems = topic.skills.length
          const counts = topic.skills.reduce(
            (acc, skill) => {
              const { status } = itemStatus({
                topic: topic.key,
                skill,
                skillStates: data?.skill_states ?? {},
              })
              acc[status]++
              return acc
            },
            { locked: 0, nuevo: 0, aprendiendo: 0, graduado: 0 },
          )

          return (
            <li key={topic.key}>
              <Link
                href={`/learn/${course}/${beltKey}/${topic.key}`}
                className="flex items-center justify-between rounded-lg border p-3 transition hover:bg-foreground/5"
              >
                <div>
                  <div className="font-medium">{topicLabel({ topic: topic.key })}</div>
                  <div className="mt-0.5 text-xs text-foreground/60">
                    {counts.graduado}/{totalItems} graduados
                  </div>
                </div>
                <div className="flex gap-1">
                  {topic.skills.map((skill) => {
                    const { status } = itemStatus({
                      topic: topic.key,
                      skill,
                      skillStates: data?.skill_states ?? {},
                    })
                    return <StatusDot key={skill} status={status} />
                  })}
                </div>
              </Link>
            </li>
          )
        })}
      </ul>
    </main>
  )
}

function StatusDot({ status }: { status: "locked" | "nuevo" | "aprendiendo" | "graduado" }) {
  const cls = {
    locked: "bg-foreground/15",
    nuevo: "bg-blue-500",
    aprendiendo: "bg-green-500",
    graduado: "bg-green-700",
  }[status]
  return <span className={`block h-2.5 w-2.5 rounded-full ${cls}`} />
}
