import Image from "next/image"
import { beltAssetPath, beltLabel, type BeltKey } from "@/lib/catalog"
import { beltStats } from "@/lib/catalog/stats"
import type { SkillStates } from "@/lib/api/types"

export default function BeltCard({
  belt,
  skillStates,
}: {
  belt: BeltKey
  skillStates: SkillStates
}) {
  const stats = beltStats({ belt, skillStates })
  const isActive = stats.unlocked > 0

  return (
    <div className="flex items-center gap-3 rounded-lg border p-3">
      <Image
        src={beltAssetPath({ belt })}
        alt={beltLabel({ belt })}
        width={48}
        height={48}
        className={isActive ? "" : "opacity-30"}
      />
      <div className="flex-1">
        <div className="flex items-baseline justify-between">
          <span className="font-medium">Cinturón {beltLabel({ belt })}</span>
          <span className="text-xs text-foreground/60">
            {stats.unlocked}/{stats.total}
          </span>
        </div>
        {isActive ? (
          <div className="mt-1 flex flex-wrap gap-2 text-xs">
            <Chip label="nuevos" value={stats.nuevos} tone="blue" />
            <Chip label="pendientes" value={stats.pendientes} tone="orange" />
            <Chip label="aprendiendo" value={stats.aprendiendo} tone="green" />
            <Chip label="graduados" value={stats.graduados} tone="dark" />
          </div>
        ) : belt === "white" ? (
          <p className="mt-1 text-xs text-foreground/50">Sin iniciar</p>
        ) : (
          <p className="mt-1 text-xs text-foreground/50">Bloqueado</p>
        )}
      </div>
    </div>
  )
}

function Chip({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: "blue" | "orange" | "green" | "dark"
}) {
  if (value === 0) return null
  const cls = {
    blue: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
    orange: "bg-orange-500/15 text-orange-700 dark:text-orange-300",
    green: "bg-green-500/15 text-green-700 dark:text-green-300",
    dark: "bg-foreground/10 text-foreground/80",
  }[tone]
  return (
    <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 ${cls}`}>
      <span className="font-medium">{value}</span>
      <span>{label}</span>
    </span>
  )
}
