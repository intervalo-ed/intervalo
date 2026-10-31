/**
 * Typed API client for the Intervalo backend.
 *
 * La lógica vive en `@intervalo/dx-core/api/client`; acá se fija la URL base de
 * la web y se mantiene la firma de siempre para los llamadores de la web.
 *
 * Auth is delegated to Clerk. Callers inject a `getToken` function, which
 * Clerk provides in both runtimes:
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

import type { Client } from "openapi-fetch"
import { createApiClient as crearCliente } from "@intervalo/dx-core/api/client"
import type { paths } from "@intervalo/dx-core/api/schema"

export {
  ApiError,
  AUTH_TOKEN_TIMEOUT_MS,
  DEFAULT_TIMEOUT_MS,
  isRetriable,
  unwrap,
} from "@intervalo/dx-core/api/client"

export const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

export function createApiClient(
  getToken?: () => string | null | Promise<string | null>,
  options?: { timeoutMs?: number },
): Client<paths> {
  return crearCliente({ baseUrl: BASE_URL, getToken, timeoutMs: options?.timeoutMs })
}
