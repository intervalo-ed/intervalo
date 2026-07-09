import type { components } from "@/lib/api/schema"
import { beltOrderFor, getBelt, type BeltKey, type CourseId } from "./index"

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
  course = "analisis",
}: {
  belt: BeltKey
  topicStates: TopicStates
  course?: CourseId
}): BeltStats {
  const cat = getBelt({ key: belt, course })
  const out = emptyCounts()
  if (!cat) return out

  for (const topic of cat.units.flatMap((u) => u.topics)) {
    accumulateTopic({ counts: out, state: topicStates[`${belt}/${topic.key}`] })
  }
  return out
}

export function beltTopicStats({
  belt,
  topicStates,
  course = "analisis",
}: {
  belt: BeltKey
  topicStates: TopicStates
  course?: CourseId
}): TopicStat[] {
  const cat = getBelt({ key: belt, course })
  if (!cat) return []
  return cat.units.flatMap((u) => u.topics).map((topic) => {
    const counts = emptyCounts()
    accumulateTopic({ counts, state: topicStates[`${belt}/${topic.key}`] })
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
  topic: { skills: string[] }
  state: TopicProgress | undefined
}): void {
  totals.total += topic.skills.length
  if (!state) return
  totals.unlocked += state.skills.length
  totals.dominados += state.skills.filter((u) => u.state === "dominado").length
}

// Conteo a nivel ítem (unit) para todo el curso.
export function courseUnitTotals({
  topicStates,
  course = "analisis",
}: {
  topicStates: TopicStates
  course?: CourseId
}): UnitTotals {
  const out = emptyUnitTotals()
  for (const belt of beltOrderFor({ course })) {
    const cat = getBelt({ key: belt, course })
    if (!cat) continue
    for (const topic of cat.units.flatMap((u) => u.topics)) {
      accumulateUnits({ totals: out, topic, state: topicStates[`${belt}/${topic.key}`] })
    }
  }
  return out
}

// Conteo a nivel ítem (unit) para un cinturón.
export function beltUnitTotals({
  belt,
  topicStates,
  course = "analisis",
}: {
  belt: BeltKey
  topicStates: TopicStates
  course?: CourseId
}): UnitTotals {
  const out = emptyUnitTotals()
  const cat = getBelt({ key: belt, course })
  if (!cat) return out
  for (const topic of cat.units.flatMap((u) => u.topics)) {
    accumulateUnits({ totals: out, topic, state: topicStates[`${belt}/${topic.key}`] })
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
  course = "analisis",
}: {
  topicStates: TopicStates
  course?: CourseId
}): number {
  let count = 0
  for (const belt of beltOrderFor({ course })) {
    const cat = getBelt({ key: belt, course })
    if (!cat) continue
    for (const topic of cat.units.flatMap((u) => u.topics)) {
      const state = topicStates[`${belt}/${topic.key}`]
      if (!state) continue
      for (const unit of state.skills) {
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
  course = "analisis",
}: {
  topicStates: TopicStates
  course?: CourseId
}): number {
  let count = 0
  for (const belt of beltOrderFor({ course })) {
    const cat = getBelt({ key: belt, course })
    if (!cat) continue
    for (const topic of cat.units.flatMap((u) => u.topics)) {
      const state = topicStates[`${belt}/${topic.key}`]
      if (!state) continue
      count += state.skills.filter(
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
  course = "analisis",
}: {
  topicStates: TopicStates
  course?: CourseId
}): BeltKey | null {
  let lastUnlocked: BeltKey | null = null
  for (const belt of beltOrderFor({ course })) {
    const s = beltStats({ belt, topicStates, course })
    if (s.unlocked === 0) continue
    lastUnlocked = belt
    if (s.dominados < s.total) return belt
  }
  return lastUnlocked
}
