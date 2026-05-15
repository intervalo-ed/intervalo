import type { components } from "@/lib/api/schema"
import { getBelt, itemKey, type BeltKey } from "./index"

type SkillState = components["schemas"]["SkillState"]
type SkillStates = Record<string, SkillState>

export interface BeltStats {
  total: number
  unlocked: number
  nuevos: number
  aprendiendo: number
  graduados: number
  pendientes: number
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
