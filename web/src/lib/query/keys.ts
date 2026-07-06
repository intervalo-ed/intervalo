export const queryKeys = {
  all: ["intervalo"] as const,

  authMe: () => [...queryKeys.all, "auth", "me"] as const,

  userStatus: () => [...queryKeys.all, "user", "status"] as const,

  userProgress: () => [...queryKeys.all, "user", "progress"] as const,

  notificationSettings: () =>
    [...queryKeys.all, "user", "notification-settings"] as const,

  emojiState: () => [...queryKeys.all, "user", "emoji-tree"] as const,

  leaderboard: ({ university }: { university?: string } = {}) =>
    [...queryKeys.all, "leaderboard", university ?? "all"] as const,

  universityLeaderboard: () =>
    [...queryKeys.all, "leaderboard", "universities"] as const,

  beltInfo: ({ courseId }: { courseId: number }) =>
    [...queryKeys.all, "course", courseId, "belts"] as const,

  sessionSummary: ({ sessionId }: { sessionId: string }) =>
    [...queryKeys.all, "session", sessionId, "summary"] as const,
}
