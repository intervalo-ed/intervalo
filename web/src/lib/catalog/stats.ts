import type { components } from "@/lib/api/schema"
import { getBelt, itemKey, type BeltKey } from "./index"

type SkillState = components["schemas"]["SkillState"]
type SkillStates = Record<string, SkillState>

export type ItemStatus = "locked" | "nuevo" | "aprendiendo" | "graduado"

export interface BeltStats {
  total: number
  unlocked: number
  nuevos: number
  aprendiendo: number
  graduados: number
  pendientes: number
}

export function itemStatus({
  topic,
  skill,
  skillStates,
}: {
  topic: string
  skill: string
  skillStates: SkillStates
}): { status: ItemStatus; pending: boolean } {
  const state = skillStates[itemKey({ topic, skill })]
  if (!state) return { status: "locked", pending: false }
  return {
    status: (state.status as ItemStatus) ?? "nuevo",
    pending: state.is_pending,
  }
}

export function beltStats({
  belt,
  skillStates,
}: {
  belt: BeltKey
  skillStates: SkillStates
}): BeltStats {
  const cat = getBelt({ key: belt })
  const out: BeltStats = {
    total: 0,
    unlocked: 0,
    nuevos: 0,
    aprendiendo: 0,
    graduados: 0,
    pendientes: 0,
  }
  if (!cat) return out

  for (const topic of cat.topics) {
    for (const skill of topic.skills) {
      out.total++
      const state = skillStates[itemKey({ topic: topic.key, skill })]
      if (!state) continue
      out.unlocked++
      if (state.is_pending) out.pendientes++
      if (state.status === "nuevo") out.nuevos++
      else if (state.status === "aprendiendo") out.aprendiendo++
      else if (state.status === "graduado") out.graduados++
    }
  }
  return out
}
