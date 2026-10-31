// Metro inlinea `process.env.EXPO_PUBLIC_*` solo si se lee con punto y nombre
// literal, así que cada variable va escrita entera acá y en ningún otro lado.

export const env = {
  apiUrl: process.env.EXPO_PUBLIC_API_URL ?? "",
  clerkPublishableKey: process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "",
  posthogKey: process.env.EXPO_PUBLIC_POSTHOG_KEY ?? "",
  posthogHost: process.env.EXPO_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
  // Para las páginas que siguen siendo de la web (privacidad, términos).
  webUrl: process.env.EXPO_PUBLIC_WEB_URL || "https://www.intervalo.xyz",
}
