import posthog from "posthog-js"

posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
  api_host: "https://us.i.posthog.com",
  // Enables automatic pageview + pageleave capture for the App Router.
  defaults: "2026-01-30",
})
