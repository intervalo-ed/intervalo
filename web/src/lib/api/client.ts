/**
 * Typed API client for the Intervalo backend.
 *
 * Built on `openapi-fetch` + the generated `schema.ts`, so every request and
 * response is type-checked against the OpenAPI spec dumped from FastAPI.
 *
 * Auth is delegated to Clerk. The backend verifies the Clerk session JWT on
 * every protected endpoint (see `backend/auth.py`). This module doesn't know
 * or care how the token was obtained — callers inject a `getToken` function,
 * which Clerk provides in both runtimes:
 *
 *   // Client component
 *   "use client";
 *   import { useAuth } from "@clerk/nextjs";
 *   import { createApiClient } from "@/lib/api/client";
 *
 *   const { getToken } = useAuth();
 *   const api = useMemo(() => createApiClient(getToken), [getToken]);
 *   const { data } = await api.GET("/auth/me");
 *
 *   // Server component / Server Action / Route Handler
 *   import { auth } from "@clerk/nextjs/server";
 *   import { createApiClient } from "@/lib/api/client";
 *
 *   const { getToken } = await auth();
 *   const api = createApiClient(getToken);
 *   const { data } = await api.GET("/auth/me");
 *
 * For public endpoints (`/health`, `/course/{id}/belts`), use `publicApi`
 * or call `createApiClient()` with no argument.
 */

import createClient, { type Client, type Middleware } from "openapi-fetch"
import type { paths } from "./schema"

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

/**
 * Anything that resolves to a Clerk session token (or null when signed out).
 * Matches the shape of both `useAuth().getToken` and `auth().getToken`.
 */
export type TokenGetter = () => string | null | Promise<string | null>

/**
 * Build an API client.
 *
 * Pass `getToken` to attach `Authorization: Bearer <token>` on every request;
 * omit it for an unauthenticated client.
 *
 * A fresh Clerk JWT is fetched per request, so short expirations and silent
 * refreshes are handled automatically — you never need to store the token
 * yourself.
 */
export function createApiClient(getToken?: TokenGetter): Client<paths> {
  const client = createClient<paths>({ baseUrl: BASE_URL })

  if (getToken) {
    const authMiddleware: Middleware = {
      async onRequest({ request }) {
        const token = await getToken()
        if (token) request.headers.set("Authorization", `Bearer ${token}`)
        return request
      },
    }
    client.use(authMiddleware)
  }

  return client
}

/** Unauthenticated client for public endpoints. */
export const publicApi = createApiClient()
