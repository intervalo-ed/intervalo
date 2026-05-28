import type { components } from "./schema"

export type TopicProgress = components["schemas"]["TopicProgress"]
export type TopicStates = Record<string, TopicProgress>
export type LevelInfo = components["schemas"]["LevelInfo"]
export type LevelInfoWithMissing = components["schemas"]["LevelInfoWithMissing"]
export type SessionExercise = components["schemas"]["SessionExercise"]
export type SessionStartResponse = components["schemas"]["SessionStartResponse"]
export type SessionSummaryResponse = components["schemas"]["SessionSummaryResponse"]
export type AnswerRequest = components["schemas"]["AnswerRequest"]
export type UserProgressResponse = components["schemas"]["UserProgressResponse"]
export type UserResponse = components["schemas"]["UserResponse"]
export type BeltProgressInfo = components["schemas"]["BeltProgressInfo"]
