"use client"

import Link from "next/link"
import MathText from "@/components/math-text"
import {
  beltLabel,
  getTopic,
  skillLabel,
  topicLabel,
  type BeltKey,
} from "@/lib/catalog"
import { itemStatus, type ItemStatus } from "@/lib/catalog/stats"
import { useUserProgress } from "@/app/UseUserProgress"

const VALID_BELTS: BeltKey[] = ["white", "blue", "violet", "brown", "black"]

export default function TopicOverview({
  course,
  belt,
  topic,
}: {
  course: string
  belt: string
  topic: string
}) {
  const beltKey = VALID_BELTS.includes(belt as BeltKey) ? (belt as BeltKey) : null
  const topicCatalog = beltKey ? getTopic({ belt: beltKey, topic }) : null
  const { data } = useUserProgress()

  if (!beltKey || !topicCatalog) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-8">
        <p className="text-red-500">Tema no encontrado</p>
      </main>
    )
  }

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-8">
      <div>
        <Link
          href={`/learn/${course}/${beltKey}`}
          className="text-sm text-foreground/60 hover:text-foreground"
        >
          ← Cinturón {beltLabel({ belt: beltKey })}
        </Link>
        <h1 className="mt-1 text-2xl font-semibold">
          {topicLabel({ topic: topicCatalog.key })}
        </h1>
      </div>

      <article className="rounded-lg border p-4 text-sm leading-relaxed text-foreground/85">
        <MathText text={topicCatalog.tooltip} />
      </article>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-foreground/70">Ítems</h2>
        <ul className="flex flex-col gap-2">
          {topicCatalog.skills.map((skill) => {
            const { status, pending } = itemStatus({
              topic: topicCatalog.key,
              skill,
              skillStates: data?.skill_states ?? {},
            })
            return (
              <li key={skill}>
                <Link
                  href={`/learn/${course}/${beltKey}/${topicCatalog.key}/${skill}`}
                  className="flex items-center justify-between rounded-lg border p-3 transition hover:bg-foreground/5"
                >
                  <span className="font-medium">{skillLabel({ skill })}</span>
                  <StatusBadge status={status} pending={pending} />
                </Link>
              </li>
            )
          })}
        </ul>
      </section>
    </main>
  )
}

function StatusBadge({ status, pending }: { status: ItemStatus; pending: boolean }) {
  const map = {
    locked: { label: "Bloqueado", cls: "bg-foreground/10 text-foreground/60" },
    nuevo: { label: "Nuevo", cls: "bg-blue-500/15 text-blue-700 dark:text-blue-300" },
    aprendiendo: { label: "Aprendiendo", cls: "bg-green-500/15 text-green-700 dark:text-green-300" },
    graduado: { label: "Graduado", cls: "bg-green-700/15 text-green-800 dark:text-green-200" },
  }[status]
  return (
    <span className="flex items-center gap-1.5">
      {pending && (
        <span className="rounded bg-orange-500/15 px-1.5 py-0.5 text-xs text-orange-700 dark:text-orange-300">
          pendiente
        </span>
      )}
      <span className={`rounded px-2 py-0.5 text-xs ${map.cls}`}>{map.label}</span>
    </span>
  )
}
