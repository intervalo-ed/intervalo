import type { components } from "./schema"

export type TopicProgress = components["schemas"]["TopicProgress"]
export type TopicStates = Record<string, TopicProgress>
export type SessionExercise = components["schemas"]["SessionExercise"]
export type SessionStartResponse = components["schemas"]["SessionStartResponse"]
export type AnswerRequest = components["schemas"]["AnswerRequest"]
export type FeedbackRequest = components["schemas"]["FeedbackRequest"]
export type SessionFeedbackRequest = components["schemas"]["SessionFeedbackRequest"]
export type SessionFeedbackResponse = components["schemas"]["SessionFeedbackResponse"]
export type UserProgressResponse = components["schemas"]["UserProgressResponse"]
