// Exercise-type metadata (label + description) is course content, defined in
// the catalog so each course can declare its own. See course.json.

import { type ExerciseType } from "./analisis.generated"
import { CATALOGS, type CourseId } from "./index"

const BY_ID: Record<CourseId, Record<string, ExerciseType>> = Object.fromEntries(
  Object.entries(CATALOGS).map(([course, catalog]) => [
    course,
    Object.fromEntries(catalog.exercise_types.map((t) => [t.id, t])),
  ]),
) as Record<CourseId, Record<string, ExerciseType>>

export function exerciseTypeInfo({
  type,
  course = "analisis",
}: {
  type: string
  course?: CourseId
}): ExerciseType {
  return BY_ID[course][type] ?? { id: type, label: type, description: "" }
}
