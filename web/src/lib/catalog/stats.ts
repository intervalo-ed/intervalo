import type { components } from "@/lib/api/schema"
import { BELT_ORDER, getBelt, type BeltKey } from "./index"

type TopicProgress = components["schemas"]["TopicProgress"]
type TopicStates = Record<string, TopicProgress>

export interface TopicCounts {
  total: number
  unlocked: number
  nuevos: number
  aprendiendo: number
  dominados: number
  pendientes: number
}

export type BeltStats = TopicCounts

export interface TopicStat extends TopicCounts {
  topic: string
}

function emptyCounts(): TopicCounts {
  return {
    total: 0,
    unlocked: 0,
    nuevos: 0,
    aprendiendo: 0,
    dominados: 0,
    pendientes: 0,
  }
}

function accumulateTopic({
  counts,
  state,
}: {
  counts: TopicCounts
  state: TopicProgress | undefined
}): void {
  counts.total++
  if (!state) return
  counts.unlocked++
  if (state.is_pending) counts.pendientes++
  if (state.status === "nuevo") counts.nuevos++
  else if (state.status === "aprendiendo") counts.aprendiendo++
  else if (state.status === "dominado") counts.dominados++
}

export function beltStats({
  belt,
  topicStates,
}: {
  belt: BeltKey
  topicStates: TopicStates
}): BeltStats {
  const cat = getBelt({ key: belt })
  const out = emptyCounts()
  if (!cat) return out

  for (const topic of cat.topics) {
    accumulateTopic({ counts: out, state: topicStates[topic.key] })
  }
  return out
}

export function beltTopicStats({
  belt,
  topicStates,
}: {
  belt: BeltKey
  topicStates: TopicStates
}): TopicStat[] {
  const cat = getBelt({ key: belt })
  if (!cat) return []
  return cat.topics.map((topic) => {
    const counts = emptyCounts()
    accumulateTopic({ counts, state: topicStates[topic.key] })
    return { topic: topic.key, ...counts }
  })
}

// Heuristic for which belt the user is "currently working on": first belt in
// the canonical order that's been started but not fully mastered. Falls back
// to the highest unlocked belt (e.g. if everything is mastered already).
export function currentBelt({
  topicStates,
}: {
  topicStates: TopicStates
}): BeltKey | null {
  let lastUnlocked: BeltKey | null = null
  for (const belt of BELT_ORDER) {
    const s = beltStats({ belt, topicStates })
    if (s.unlocked === 0) continue
    lastUnlocked = belt
    if (s.dominados < s.total) return belt
  }
  return lastUnlocked
}
