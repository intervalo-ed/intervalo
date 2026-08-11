"use client"

import { ClerkProvider } from "@clerk/nextjs"
import { esUY } from "@clerk/localizations"
import { environmentManager, QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { NuqsAdapter } from "nuqs/adapters/next/app"
import { ThemeProvider } from "@/components/theme-provider"
import { PostHogUser } from "@/app/posthog-user"
import { SplashProvider } from "@/app/splash-context"
import { Toaster } from "@/components/ui/sonner"

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
      },
    },
  })
}

let browserQueryClient: QueryClient | undefined

function getQueryClient() {
  // Server: a fresh client per request so state never leaks between users.
  // Browser: a singleton so re-renders (or a Suspense throw during the first
  // render) don't blow away the cache.
  if (environmentManager.isServer()) return makeQueryClient()
  if (!browserQueryClient) browserQueryClient = makeQueryClient()
  return browserQueryClient
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient()

  return (
    <ClerkProvider localization={esUY}>
      <PostHogUser />
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <QueryClientProvider client={queryClient}>
          <NuqsAdapter>
            <SplashProvider>{children}</SplashProvider>
          </NuqsAdapter>
          {/* Arriba, no abajo: el fondo de la pantalla está ocupado por la tab
              bar y por los CTA fijos (--nav-* / --cta-*), y un toast ahí taparía
              justo el botón que el usuario está por tocar. El offset suma la
              safe-area superior para no meterse bajo el notch en la PWA. */}
          <Toaster
            position="top-center"
            offset={{ top: "calc(env(safe-area-inset-top, 0px) + 1rem)" }}
            mobileOffset={{
              top: "calc(env(safe-area-inset-top, 0px) + 0.75rem)",
              left: "0.75rem",
              right: "0.75rem",
            }}
          />
      </ThemeProvider>
    </ClerkProvider>
  )
}
