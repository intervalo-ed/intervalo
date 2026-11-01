import { Console, Effect } from "effect"
import { HttpClient, HttpClientRequest } from "effect/unstable/http"
import type { PushSub, SendOutcome } from "./tick"

// Los avisos de la app nativa no van por web-push: el token de Expo se manda al
// servicio de Expo, que los reparte a APNs/FCM.
const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"
// El tope de mensajes por pedido que acepta Expo.
const TAMANO_DE_LOTE = 100

export interface ExpoJob {
  sub: PushSub
  title: string
  body: string
  notificationId: number
  url?: string
}

interface ExpoTicket {
  status?: "ok" | "error"
  id?: string
  message?: string
  details?: { error?: string }
}

interface ExpoRespuesta {
  data?: ExpoTicket[]
  errors?: { code?: string; message?: string }[]
}

/** Parte en lotes de a lo sumo `tamano`, respetando el orden. */
export const enLotes = <T>({
  items,
  tamano = TAMANO_DE_LOTE,
}: {
  items: readonly T[]
  tamano?: number
}): T[][] => {
  const lotes: T[][] = []
  for (let i = 0; i < items.length; i += tamano) {
    lotes.push(items.slice(i, i + tamano))
  }
  return lotes
}

/** Un ticket → el resultado a reportar. `DeviceNotRegistered` es el 404/410 de
 * Expo: la app se desinstaló o el token rotó, así que la suscripción se purga
 * por el mismo camino que las web muertas. El estado va corto a propósito:
 * `delivery_status` es String(20) y el backend recorta. */
export const resultadoDelTicket = ({
  job,
  ticket,
}: {
  job: ExpoJob
  ticket: ExpoTicket | undefined
}): SendOutcome => {
  if (ticket?.status === "ok") {
    return {
      deadSubscriptionId: null,
      notificationId: job.notificationId,
      status: "ok",
    }
  }
  const codigo = ticket?.details?.error
  const muerta = codigo === "DeviceNotRegistered"
  return {
    deadSubscriptionId: muerta ? job.sub.id : null,
    notificationId: job.notificationId,
    status: muerta ? "error_unregistered" : codigo ? `error_${codigo}` : "error",
  }
}

/** Todo el lote falló junto (red caída, 5xx, o un error del pedido entero):
 * cuenta como envío fallido para cada job, sin purgar nada. */
const loteFallido = ({
  lote,
  status,
}: {
  lote: readonly ExpoJob[]
  status: string
}): SendOutcome[] =>
  lote.map((job) => ({
    deadSubscriptionId: null,
    notificationId: job.notificationId,
    status,
  }))

/** Manda un lote y mapea cada ticket a su job (Expo los devuelve en el mismo
 * orden que los mensajes).
 *
 * Pendiente: los receipts (`/getReceipts`). Un ticket "ok" solo dice que Expo lo
 * aceptó; el DeviceNotRegistered que viene de APNs/FCM recién aparece en el
 * receipt, ~15 min después. Por ahora esos tokens se purgan cuando el próximo
 * envío los rebota en el ticket. */
const mandarLote = ({
  client,
  lote,
  app,
}: {
  client: HttpClient.HttpClient
  lote: readonly ExpoJob[]
  app?: string
}): Effect.Effect<SendOutcome[]> =>
  Effect.gen(function* () {
    const res = yield* client.execute(
      HttpClientRequest.post(EXPO_PUSH_URL).pipe(
        HttpClientRequest.setHeader("Accept", "application/json"),
        HttpClientRequest.bodyJsonUnsafe(
          lote.map((job) => ({
            to: job.sub.endpoint,
            title: job.title,
            body: job.body,
            sound: "default",
            ttl: 86400,
            // Lo mismo que el payload web: `app` vuelve en el beacon del tap.
            data: {
              id: job.notificationId,
              ...(job.url ? { url: job.url } : {}),
              ...(app ? { app } : {}),
            },
          })),
        ),
      ),
    )
    if (res.status < 200 || res.status >= 300) {
      yield* Console.warn(`expo push failed batch=${lote.length} status=${res.status}`)
      return loteFallido({ lote, status: `error_${res.status}` })
    }
    const respuesta = (yield* res.json) as unknown as ExpoRespuesta
    const tickets = respuesta.data
    if (!Array.isArray(tickets) || tickets.length !== lote.length) {
      const codigo = respuesta.errors?.[0]?.code
      yield* Console.warn(
        `expo push rejected batch=${lote.length} error=${codigo ?? "?"}`,
      )
      return loteFallido({ lote, status: codigo ? `error_${codigo}` : "error" })
    }
    const resultados = lote.map((job, i) =>
      resultadoDelTicket({ job, ticket: tickets[i] }),
    )
    for (const [i, r] of resultados.entries()) {
      if (r.status !== "ok") {
        yield* Console.warn(
          `expo push failed sub=${lote[i].sub.id} status=${r.status}${r.deadSubscriptionId !== null ? " (pruning)" : ""}`,
        )
      }
    }
    return resultados
  }).pipe(
    // Falla de transporte (o un body que no es JSON): el lote entero no salió.
    Effect.catch((error) =>
      Console.warn(`expo push transport failed batch=${lote.length}: ${error}`).pipe(
        Effect.as(loteFallido({ lote, status: "error" })),
      ),
    ),
  )

/** Manda los jobs de `kind === "expo"` en lotes de a 100 y devuelve un
 * resultado por job, con la misma forma que los de web-push. */
export const sendExpoPushes = (
  jobs: readonly ExpoJob[],
  { app }: { app?: string } = {},
): Effect.Effect<SendOutcome[], never, HttpClient.HttpClient> =>
  Effect.gen(function* () {
    if (jobs.length === 0) return []
    const client = yield* HttpClient.HttpClient
    const porLote = yield* Effect.forEach(
      enLotes({ items: jobs }),
      (lote) => mandarLote({ client, lote, app }),
      { concurrency: 2 },
    )
    return porLote.flat()
  })
