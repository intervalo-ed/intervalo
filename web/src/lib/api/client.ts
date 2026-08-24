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
 * For public endpoints (`/health`), llamá `createApiClient()` sin argumento.
 */

import createClient, { type Client, type Middleware } from "openapi-fetch"
import { TimeoutError, withTimeout } from "@/lib/async/with-timeout"
import type { paths } from "./schema"

export const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

/** Techo de una request completa. */
export const DEFAULT_TIMEOUT_MS = 10_000
/** Techo para que Clerk entregue el JWT. */
export const AUTH_TOKEN_TIMEOUT_MS = 5_000

/**
 * Error HTTP con el status a la vista.
 *
 * openapi-fetch devuelve el **body** del error, no un `Error`, así que quien
 * hacía `if (error) throw error` perdía el status y tiraba un objeto pelado
 * que ningún `catch` podía interpretar. Sin el status no se puede decidir si
 * conviene reintentar.
 */
export class ApiError extends Error {
  readonly status: number
  readonly body: unknown

  constructor(status: number, body: unknown) {
    const detail =
      body && typeof body === "object" && "detail" in body
        ? String((body as { detail: unknown }).detail)
        : undefined
    super(detail ?? `La API respondió ${status}`)
    this.name = "ApiError"
    this.status = status
    this.body = body
  }

  /** 5xx y los de congestión son transitorios; el resto no se arregla insistiendo. */
  get retriable(): boolean {
    return this.status >= 500 || [408, 425, 429].includes(this.status)
  }
}

/** Devuelve `data` o tira un `ApiError` con el status puesto. */
export function unwrap<T>(result: {
  data?: T
  error?: unknown
  response: Response
}): T {
  if (result.error !== undefined || result.data === undefined) {
    throw new ApiError(result.response.status, result.error)
  }
  return result.data
}

/** ¿Vale la pena reintentar? Timeouts, 5xx y caídas de red: sí. */
export function isRetriable(err: unknown): boolean {
  if (err instanceof TimeoutError) return true
  if (err instanceof ApiError) return err.retriable
  // fetch rechaza con TypeError cuando la red se cae o el DNS falla.
  return err instanceof TypeError
}

/**
 * `fetch` con tope de tiempo.
 *
 * AbortController manual y no `AbortSignal.any()`: eso último recién existe
 * desde iOS 17.4 y deja afuera iPhones que nuestro público sí usa.
 */
function createTimeoutFetch(ms: number): typeof globalThis.fetch {
  return async (input, init) => {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), ms)

    // Respetar un signal que venga de afuera sin pisarlo.
    const external = init?.signal
    if (external) {
      if (external.aborted) controller.abort()
      else external.addEventListener("abort", () => controller.abort(), { once: true })
    }

    try {
      return await globalThis.fetch(input, { ...init, signal: controller.signal })
    } catch (err) {
      if (controller.signal.aborted && !external?.aborted) {
        throw new TimeoutError("http", ms)
      }
      throw err
    } finally {
      clearTimeout(timer)
    }
  }
}

/**
 * Build an API client.
 *
 * Pass `getToken` — anything que resuelva a un token de sesión de Clerk (o
 * null si no hay sesión); coincide con la forma de `useAuth().getToken` y de
 * `auth().getToken` — para adjuntar `Authorization: Bearer <token>` en cada
 * request; omitilo para un cliente sin autenticar.
 *
 * A fresh Clerk JWT is fetched per request, so short expirations and silent
 * refreshes are handled automatically — you never need to store the token
 * yourself.
 *
 * Los dos topes de tiempo son necesarios y cubren cosas distintas. El de
 * transporte no alcanza: openapi-fetch corre los middlewares **antes** de
 * construir el Request, así que si Clerk se cuelga entregando el token nunca
 * llega a haber un fetch que abortar. Eso es exactamente lo que pasaba al
 * volver del round-trip de Google, y por qué recargar en otra pestaña lo
 * arreglaba.
 */
export function createApiClient(
  getToken?: () => string | null | Promise<string | null>,
  options?: { timeoutMs?: number },
): Client<paths> {
  const client = createClient<paths>({
    baseUrl: BASE_URL,
    fetch: createTimeoutFetch(options?.timeoutMs ?? DEFAULT_TIMEOUT_MS),
  })

  if (getToken) {
    const authMiddleware: Middleware = {
      async onRequest({ request }) {
        const token = await withTimeout(Promise.resolve(getToken()), {
          ms: AUTH_TOKEN_TIMEOUT_MS,
          label: "clerk_get_token",
        })
        if (token) request.headers.set("Authorization", `Bearer ${token}`)
        return request
      },
    }
    client.use(authMiddleware)
  }

  return client
}
