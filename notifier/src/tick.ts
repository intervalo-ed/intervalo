import { Config, Console, Effect } from "effect"
import {
  HttpClient,
  HttpClientRequest,
  HttpClientResponse,
} from "effect/unstable/http"
import webpush from "web-push"

export interface NotifierConfig {
  apiBaseUrl: string
  secret: string
  vapid: { publicKey: string; privateKey: string; subject: string }
}

interface PushSub {
  id: number
  endpoint: string
  p256dh: string
  auth: string
}

interface DueNotification {
  user_id: number
  pending_count: number
  title: string
  body: string
  notification_id: number
  subscriptions: PushSub[]
}

export const loadConfig: Effect.Effect<NotifierConfig, Error> = Effect.gen(
  function* () {
    return {
      apiBaseUrl: yield* Config.string("API_BASE_URL"),
      secret: yield* Config.string("INTERNAL_API_SECRET"),
      vapid: {
        publicKey: yield* Config.string("VAPID_PUBLIC_KEY"),
        privateKey: yield* Config.string("VAPID_PRIVATE_KEY"),
        subject: yield* Config.string("VAPID_SUBJECT"),
      },
    }
  },
).pipe(Effect.mapError((e) => new Error(`missing config: ${e}`)))

/** Configure web-push's VAPID details once, before sending. */
export function setupWebPush(config: NotifierConfig): void {
  webpush.setVapidDetails(
    config.vapid.subject,
    config.vapid.publicKey,
    config.vapid.privateKey,
  )
}

/** Resultado de un envío: la suscripción a purgar si murió (404/410), y el
 * estado a guardar en notification_sends. El backend crea esa fila al elegir el
 * copy, o sea antes de que se intente mandar, así que si el estado no vuelve
 * acá un envío que nunca salió queda igual que uno exitoso. */
interface SendOutcome {
  deadSubscriptionId: number | null
  notificationId: number
  status: string
}

/** Send one push; resolves with the outcome to report back. */
const sendPush = (
  sub: PushSub,
  payload: { title: string; body: string; notificationId: number },
): Effect.Effect<SendOutcome> =>
  Effect.tryPromise({
    try: () =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify({
          title: payload.title,
          body: payload.body,
          id: payload.notificationId,
        }),
        { TTL: 86400 },
      ),
    catch: (error) => error,
  }).pipe(
    Effect.as<SendOutcome>({
      deadSubscriptionId: null,
      notificationId: payload.notificationId,
      status: "ok",
    }),
    Effect.catch((error) => {
      const status = (error as { statusCode?: number })?.statusCode
      const dead = status === 404 || status === 410
      return Console.warn(
        `push failed sub=${sub.id} status=${status ?? "?"}${dead ? " (pruning)" : ""}`,
      ).pipe(
        Effect.as<SendOutcome>({
          deadSubscriptionId: dead ? sub.id : null,
          notificationId: payload.notificationId,
          status: status ? `error_${status}` : "error",
        }),
      )
    }),
  )

/** One scheduler tick: fetch due users, send pushes, prune dead subscriptions. */
export const runTick = (
  config: NotifierConfig,
  options: { force?: boolean } = {},
): Effect.Effect<void, Error, HttpClient.HttpClient> =>
  Effect.gen(function* () {
    const client = yield* HttpClient.HttpClient

    const url = `${config.apiBaseUrl}/internal/notifications/due${
      options.force ? "?force=true" : ""
    }`
    const dueRes = yield* client
      .execute(
        HttpClientRequest.get(url).pipe(
          HttpClientRequest.setHeader("X-Internal-Secret", config.secret),
        ),
      )
      .pipe(Effect.flatMap(HttpClientResponse.filterStatusOk))
    const users = (yield* dueRes.json) as unknown as DueNotification[]

    const jobs = users.flatMap((u) =>
      u.subscriptions.map((sub) => ({
        sub,
        title: u.title,
        body: u.body,
        notificationId: u.notification_id,
      })),
    )
    yield* Console.log(
      `tick: ${users.length} user(s) due, ${jobs.length} push(es) to send`,
    )
    if (jobs.length === 0) return

    const results = yield* Effect.forEach(
      jobs,
      (job) =>
        sendPush(job.sub, {
          title: job.title,
          body: job.body,
          notificationId: job.notificationId,
        }),
      { concurrency: 5 },
    )
    // El reporte de entrega va antes del prune: si el tick se cae a la mitad,
    // preferimos haber guardado por qué falló antes que haber limpiado la
    // suscripción y perder el motivo.
    yield* client
      .execute(
        HttpClientRequest.post(`${config.apiBaseUrl}/internal/push/delivery`).pipe(
          HttpClientRequest.setHeader("X-Internal-Secret", config.secret),
          HttpClientRequest.bodyJsonUnsafe({
            results: results.map((r) => ({
              notification_id: r.notificationId,
              status: r.status,
            })),
          }),
        ),
      )
      .pipe(Effect.flatMap(HttpClientResponse.filterStatusOk))
    const okCount = results.filter((r) => r.status === "ok").length
    yield* Console.log(
      `delivery: ${okCount}/${results.length} ok`,
    )

    const deadIds = results
      .map((r) => r.deadSubscriptionId)
      .filter((id): id is number => id !== null)

    if (deadIds.length > 0) {
      yield* client.execute(
        HttpClientRequest.post(`${config.apiBaseUrl}/internal/push/prune`).pipe(
          HttpClientRequest.setHeader("X-Internal-Secret", config.secret),
          HttpClientRequest.bodyJsonUnsafe({ subscription_ids: deadIds }),
        ),
      )
      yield* Console.log(`pruned ${deadIds.length} dead subscription(s)`)
    }
  }).pipe(Effect.mapError((e) => (e instanceof Error ? e : new Error(String(e)))))

interface EmailRunResult {
  bounce_sent: number
  winback_sent: number
}

/** One scheduler tick for lifecycle emails: the backend resolves recipients
 * and sends via Resend itself, so this just triggers the batch. */
export const runEmailTick = (
  config: NotifierConfig,
): Effect.Effect<void, Error, HttpClient.HttpClient> =>
  Effect.gen(function* () {
    const client = yield* HttpClient.HttpClient

    const res = yield* client
      .execute(
        HttpClientRequest.post(`${config.apiBaseUrl}/internal/emails/run`).pipe(
          HttpClientRequest.setHeader("X-Internal-Secret", config.secret),
        ),
      )
      .pipe(Effect.flatMap(HttpClientResponse.filterStatusOk))
    const result = (yield* res.json) as unknown as EmailRunResult
    yield* Console.log(
      `email tick: ${result.bounce_sent} bounce, ${result.winback_sent} win-back sent`,
    )
  }).pipe(Effect.mapError((e) => (e instanceof Error ? e : new Error(String(e)))))

interface SweepAbandonedResult {
  marked: number
}

/** One scheduler tick to close out sessions the user never finished. Abandonment
 * can't be detected when it happens — nobody reports leaving — so it is swept by
 * elapsed time instead. See session_store.sweep_abandoned_sessions. */
export const runSweepTick = (
  config: NotifierConfig,
): Effect.Effect<void, Error, HttpClient.HttpClient> =>
  Effect.gen(function* () {
    const client = yield* HttpClient.HttpClient

    // filterStatusOk, no solo parsear: sin esto un 404 o un 401 devuelven un body
    // JSON válido pero con otra forma, y el tick loguea "undefined session(s)"
    // como si hubiera corrido bien. Pasó en el primer deploy, cuando el notifier
    // arrancó unos segundos antes que el backend.
    const res = yield* client
      .execute(
        HttpClientRequest.post(
          `${config.apiBaseUrl}/internal/sessions/sweep-abandoned`,
        ).pipe(HttpClientRequest.setHeader("X-Internal-Secret", config.secret)),
      )
      .pipe(Effect.flatMap(HttpClientResponse.filterStatusOk))
    const result = (yield* res.json) as unknown as SweepAbandonedResult
    yield* Console.log(`sweep tick: ${result.marked} session(s) marked abandoned`)
  }).pipe(Effect.mapError((e) => (e instanceof Error ? e : new Error(String(e)))))
