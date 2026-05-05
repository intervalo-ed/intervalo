import { catalog, type Belt, type BeltKey, type Topic } from "./analisis-1.generated"

export { catalog }
export type { Belt, BeltKey, Topic }

const BELT_ASSET: Record<BeltKey, string> = {
  white: "/belt_white.png",
  blue: "/belt_blue.png",
  violet: "/belt_purple.png",
  brown: "/belt_brown.png",
  black: "/belt_black.png",
}

const BELT_LABEL: Record<BeltKey, string> = {
  white: "Blanco",
  blue: "Azul",
  violet: "Violeta",
  brown: "Marrón",
  black: "Negro",
}

export const BELT_ORDER: BeltKey[] = ["white", "blue", "violet", "brown", "black"]

export function beltAssetPath({ belt }: { belt: BeltKey }): string {
  return BELT_ASSET[belt]
}

export function beltLabel({ belt }: { belt: BeltKey }): string {
  return BELT_LABEL[belt]
}

export function getBelt({ key }: { key: BeltKey }): Belt | undefined {
  return catalog.belts.find((b) => b.key === key)
}

export function getTopic({
  belt,
  topic,
}: {
  belt: BeltKey
  topic: string
}): Topic | undefined {
  return getBelt({ key: belt })?.topics.find((t) => t.key === topic)
}

// An "item" = (topic, skill) pair. Catalog stores skills as an array per topic;
// this materializes the cartesian product so callers can iterate items directly.
export function getTopicItems({
  belt,
  topic,
}: {
  belt: BeltKey
  topic: string
}): { topic: Topic; skill: string }[] {
  const t = getTopic({ belt, topic })
  if (!t) return []
  return t.skills.map((skill) => ({ topic: t, skill }))
}

// Matches the backend's `${belt}/${topic}/${skill}` skill_states key shape.
export function itemKey({
  belt,
  topic,
  skill,
}: {
  belt: BeltKey
  topic: string
  skill: string
}): string {
  return `${belt}/${topic}/${skill}`
}
