export const queryKeys = {
  all: ["intervalo"] as const,

  authMe: () => [...queryKeys.all, "auth", "me"] as const,

  userStatus: () => [...queryKeys.all, "user", "status"] as const,

  userProgress: ({ course }: { course?: string } = {}) =>
    [...queryKeys.all, "user", "progress", course ?? "default"] as const,

  practiceStats: ({ course }: { course?: string } = {}) =>
    [...queryKeys.all, "user", "practice-stats", course ?? "default"] as const,

  notificationSettings: () =>
    [...queryKeys.all, "user", "notification-settings"] as const,

  emojiState: () => [...queryKeys.all, "user", "emoji-tree"] as const,

  leaderboard: ({
    university,
    career,
  }: { university?: string; career?: string } = {}) =>
    [...queryKeys.all, "leaderboard", university ?? "all", career ?? "all"] as const,

  universityLeaderboard: ({
    university,
    career,
  }: { university?: string; career?: string } = {}) =>
    [
      ...queryKeys.all,
      "leaderboard",
      "universities",
      university ?? "all",
      career ?? "all",
    ] as const,

  leaderboardSummary: () => [...queryKeys.all, "leaderboard", "summary"] as const,

  beltInfo: ({ courseId }: { courseId: number }) =>
    [...queryKeys.all, "course", courseId, "belts"] as const,

  sessionSummary: ({ sessionId }: { sessionId: string }) =>
    [...queryKeys.all, "session", sessionId, "summary"] as const,
}
