/**
 * Typed API client for the Intervalo backend.
 *
 * Built on `openapi-fetch` + the generated `schema.ts`, so every request and
 * response is type-checked against the OpenAPI spec dumped from FastAPI.
 *
 * Usage:
 *   import { api } from "@/lib/api/client";
 *   const { data, error } = await api.POST("/auth/guest", { body: { name } });
 *
 * Auth: the `authMiddleware` reads a bearer token from `tokenStorage` (a thin
 * wrapper over `localStorage`) and attaches `Authorization: Bearer <token>` on
 * every outgoing request. After login, call `tokenStorage.set(token)`.
 */

import createClient, { type Middleware } from "openapi-fetch";
import type { paths } from "./schema";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const TOKEN_KEY = "intervalo:token";

// ── Token storage (SSR-safe) ─────────────────────────────────────────────────
// `window` is undefined during server rendering; guard every access so this
// module is importable from both client and server components.

export const tokenStorage = {
  get(): string | null {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(TOKEN_KEY);
  },
  set(token: string): void {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(TOKEN_KEY, token);
  },
  clear(): void {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(TOKEN_KEY);
  },
};

// ── Middleware ───────────────────────────────────────────────────────────────

const authMiddleware: Middleware = {
  onRequest({ request }) {
    const token = tokenStorage.get();
    if (token) request.headers.set("Authorization", `Bearer ${token}`);
    return request;
  },
};

// ── Client ───────────────────────────────────────────────────────────────────

export const api = createClient<paths>({ baseUrl: BASE_URL });
api.use(authMiddleware);
