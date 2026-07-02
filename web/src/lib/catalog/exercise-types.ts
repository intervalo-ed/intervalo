// Exercise-type metadata (label + description) is course content, defined in
// the catalog so each course can declare its own. See catalog.json.

import { catalog, type ExerciseType } from "./analisis.generated"

const BY_ID: Record<string, ExerciseType> = Object.fromEntries(
  catalog.exercise_types.map((t) => [t.id, t]),
)

export function exerciseTypeInfo({ type }: { type: string }): ExerciseType {
  return BY_ID[type] ?? { id: type, label: type, description: "" }
}
