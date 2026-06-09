import { Config, Console, Effect } from "effect"
import { HttpClient, HttpClientRequest } from "effect/unstable/http"
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

/** Send one push; resolves to a dead-subscription id (404/410) or null. */
const sendPush = (sub: PushSub, count: number): Effect.Effect<number | null> =>
  Effect.tryPromise({
    try: () =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify({ count }),
        { TTL: 86400 },
      ),
    catch: (error) => error,
  }).pipe(
    Effect.as<number | null>(null),
    Effect.catch((error) => {
      const status = (error as { statusCode?: number })?.statusCode
      const dead = status === 404 || status === 410
      return Console.warn(
        `push failed sub=${sub.id} status=${status ?? "?"}${dead ? " (pruning)" : ""}`,
      ).pipe(Effect.as<number | null>(dead ? sub.id : null))
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
    const dueRes = yield* client.execute(
      HttpClientRequest.get(url).pipe(
        HttpClientRequest.setHeader("X-Internal-Secret", config.secret),
      ),
    )
    const users = (yield* dueRes.json) as unknown as DueNotification[]

    const jobs = users.flatMap((u) =>
      u.subscriptions.map((sub) => ({ sub, count: u.pending_count })),
    )
    yield* Console.log(
      `tick: ${users.length} user(s) due, ${jobs.length} push(es) to send`,
    )
    if (jobs.length === 0) return

    const results = yield* Effect.forEach(
      jobs,
      (job) => sendPush(job.sub, job.count),
      { concurrency: 5 },
    )
    const deadIds = results.filter((id): id is number => id !== null)

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
