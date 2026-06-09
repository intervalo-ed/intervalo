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

export interface UnitTotals {
  total: number // todas las units del catálogo (suma de exercise_types por tema)
  unlocked: number // units ya desbloqueadas (presentes en topic_states)
  dominados: number // units en estado "dominado"
}

function emptyUnitTotals(): UnitTotals {
  return { total: 0, unlocked: 0, dominados: 0 }
}

function accumulateUnits({
  totals,
  topic,
  state,
}: {
  totals: UnitTotals
  topic: { exercise_types: string[] }
  state: TopicProgress | undefined
}): void {
  totals.total += topic.exercise_types.length
  if (!state) return
  totals.unlocked += state.units.length
  totals.dominados += state.units.filter((u) => u.state === "dominado").length
}

// Conteo a nivel ítem (unit) para todo el curso.
export function courseUnitTotals({
  topicStates,
}: {
  topicStates: TopicStates
}): UnitTotals {
  const out = emptyUnitTotals()
  for (const belt of BELT_ORDER) {
    const cat = getBelt({ key: belt })
    if (!cat) continue
    for (const topic of cat.topics) {
      accumulateUnits({ totals: out, topic, state: topicStates[topic.key] })
    }
  }
  return out
}

// Conteo a nivel ítem (unit) para un cinturón.
export function beltUnitTotals({
  belt,
  topicStates,
}: {
  belt: BeltKey
  topicStates: TopicStates
}): UnitTotals {
  const out = emptyUnitTotals()
  const cat = getBelt({ key: belt })
  if (!cat) return out
  for (const topic of cat.topics) {
    accumulateUnits({ totals: out, topic, state: topicStates[topic.key] })
  }
  return out
}

// Parsea "YYYY-MM-DD" como fecha LOCAL a medianoche. `new Date("YYYY-MM-DD")` la
// interpreta como UTC, lo que en husos negativos (ej. Argentina) corre el día uno
// para atrás y haría que "mañana" cuente como vencido hoy.
function parseLocalDate(s: string): Date {
  const [y, m, d] = s.slice(0, 10).split("-").map(Number)
  return new Date(y, m - 1, d)
}

// ¿La unit tiene su próximo repaso vencido (hoy o antes)?
function unitDue(nextReview: string | null | undefined): boolean {
  if (!nextReview) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = parseLocalDate(nextReview)
  return target.getTime() <= today.getTime()
}

// Conteo de ítems (units) desbloqueados accionables hoy: nuevos (sin empezar) +
// pendientes (con repaso vencido por unit). Espeja los pills azules + naranjas.
export function actionableUnitCount({
  topicStates,
}: {
  topicStates: TopicStates
}): number {
  let count = 0
  for (const belt of BELT_ORDER) {
    const cat = getBelt({ key: belt })
    if (!cat) continue
    for (const topic of cat.topics) {
      const state = topicStates[topic.key]
      if (!state) continue
      for (const unit of state.units) {
        if (unit.state === "sin_empezar") count++
        else if (unitDue(unit.next_review)) count++
      }
    }
  }
  return count
}

// Conteo de ítems (units) pendientes: unit ya empezada con repaso vencido
// (los pills naranjas de la grilla).
export function pendingUnitCount({
  topicStates,
}: {
  topicStates: TopicStates
}): number {
  let count = 0
  for (const belt of BELT_ORDER) {
    const cat = getBelt({ key: belt })
    if (!cat) continue
    for (const topic of cat.topics) {
      const state = topicStates[topic.key]
      if (!state) continue
      count += state.units.filter(
        (u) => u.state !== "sin_empezar" && unitDue(u.next_review),
      ).length
    }
  }
  return count
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
