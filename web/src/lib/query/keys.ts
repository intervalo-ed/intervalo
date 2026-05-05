export const queryKeys = {
  all: ["intervalo"] as const,

  authMe: () => [...queryKeys.all, "auth", "me"] as const,

  userProgress: () => [...queryKeys.all, "user", "progress"] as const,

  beltInfo: ({ courseId }: { courseId: number }) =>
    [...queryKeys.all, "course", courseId, "belts"] as const,

  sessionSummary: ({ sessionId }: { sessionId: string }) =>
    [...queryKeys.all, "session", sessionId, "summary"] as const,
}
