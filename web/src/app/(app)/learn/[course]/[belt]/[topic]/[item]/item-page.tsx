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
  const beltKey = VALID_BELTS.includes(belt as BeltKey) ? (belt as BeltKey) : null
  const topicCatalog = beltKey ? getTopic({ belt: beltKey, topic }) : null
  const skillExists = topicCatalog?.skills.includes(item) ?? false
  const { data } = useUserProgress()

  if (!beltKey || !topicCatalog || !skillExists) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-8">
        <p className="text-red-500">Ítem no encontrado</p>
      </main>
    )
  }

  const { status, pending } = itemStatus({
    topic: topicCatalog.key,
    skill: item,
    skillStates: data?.skill_states ?? {},
  })

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-8">
      <div>
        <Link
          href={`/learn/${course}/${beltKey}/${topicCatalog.key}`}
          className="text-sm text-foreground/60 hover:text-foreground"
        >
          ← {topicLabel({ topic: topicCatalog.key })}
        </Link>
        <div className="mt-1 flex items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold">{skillLabel({ skill: item })}</h1>
          <StatusBadge status={status} pending={pending} />
        </div>
        <p className="mt-1 text-xs text-foreground/50">
          {beltLabel({ belt: beltKey })} · {topicLabel({ topic: topicCatalog.key })}
        </p>
      </div>

      <article className="rounded-lg border p-4 text-sm leading-relaxed text-foreground/85">
        <MathText text={topicCatalog.tooltip} />
      </article>

      <button
        type="button"
        disabled
        title="Endpoint pendiente — backend gap #3"
        className="inline-flex h-11 items-center justify-center rounded-md bg-foreground font-medium text-background opacity-50 disabled:cursor-not-allowed"
      >
        Practicar (próximamente)
      </button>
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
