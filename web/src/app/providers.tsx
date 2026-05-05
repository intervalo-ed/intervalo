"use client"

import { ClerkProvider } from "@clerk/nextjs"
import { SoundProvider } from "@web-kits/audio/react"
import { isServer, QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { NuqsAdapter } from "nuqs/adapters/next/app"

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
  if (isServer) return makeQueryClient()
  if (!browserQueryClient) browserQueryClient = makeQueryClient()
  return browserQueryClient
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient()

  return (
    <ClerkProvider>
      <QueryClientProvider client={queryClient}>
        <NuqsAdapter>
          <SoundProvider>{children}</SoundProvider>
        </NuqsAdapter>
      </QueryClientProvider>
    </ClerkProvider>
  )
}
