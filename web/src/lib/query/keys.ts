export const queryKeys = {
  all: ["intervalo"] as const,

  authMe: () => [...queryKeys.all, "auth", "me"] as const,

  userProgress: ({ course }: { course?: string } = {}) =>
    [...queryKeys.all, "user", "progress", course ?? "default"] as const,

  // Prefijos para invalidar TODOS los scopes de una familia. `userProgress()`
  // sin curso NO sirve para eso: es la clave concreta del scope "default", que
  // ningún consumidor usa (todos pasan un curso), así que el match por prefijo
  // nunca pega.
  userProgressAll: () => [...queryKeys.all, "user", "progress"] as const,

  leaderboardAll: () => [...queryKeys.all, "leaderboard"] as const,

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

  leaderboardSummary: ({
    university,
    career,
  }: { university?: string; career?: string } = {}) =>
    [
      ...queryKeys.all,
      "leaderboard",
      "summary",
      university ?? "all",
      career ?? "all",
    ] as const,

  publicUniversityLeaderboard: () =>
    [...queryKeys.all, "public", "university-leaderboard"] as const,

  sessionSummary: ({ sessionId }: { sessionId: string }) =>
    [...queryKeys.all, "session", sessionId, "summary"] as const,
}
