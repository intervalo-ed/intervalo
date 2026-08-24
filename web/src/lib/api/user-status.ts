import { createApiClient } from "./client"

/**
 * Presupuesto corto: esto corre en el render del servidor, así que cada
 * milisegundo que tarda es un milisegundo que la página no existe. Falla
 * abierto, así que cortar temprano es barato.
 */
const GATE_TIMEOUT_MS = 2_000

export type UserStatus = { enrolled: boolean; has_progress: boolean }

/**
 * Estado de inscripción para los gates de navegación del servidor.
 *
 * Devuelve `null` si el backend no contesta a tiempo o falla — los tres gates
 * dejan pasar en ese caso y el cliente vuelve a chequear. Antes cada gate
 * repetía el `fetch` nativo con la URL base escrita a mano y **sin timeout**:
 * con el backend arrancando, cada render de "/" y de /onboarding se quedaba
 * esperando indefinidamente.
 */
export async function fetchUserStatus(
  getToken: () => Promise<string | null>,
): Promise<UserStatus | null> {
  try {
    const api = createApiClient(getToken, { timeoutMs: GATE_TIMEOUT_MS })
    const { data } = await api.GET("/user/status", { cache: "no-store" })
    return data ?? null
  } catch (err) {
    console.error("[user-status] chequeo fallido:", err)
    return null
  }
}
