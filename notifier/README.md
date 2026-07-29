# Intervalo notifier

Tiny [Effect](https://effect.website) worker that sends the daily "you have
pendings" web-push, and separately triggers the lifecycle-email batch
(bounce/win-back). It never touches the database — it calls the FastAPI
backend's internal endpoints; pushes go out via
[`web-push`](https://github.com/web-push-libs/web-push), emails are sent
entirely backend-side via Resend (this worker just triggers the run).

## How it works

Two independent cron loops run concurrently:

**Push, every 15 minutes** (`Schedule.cron("*/15 * * * *")`):

1. `GET {API_BASE_URL}/internal/notifications/due` (header `X-Internal-Secret`)
   — the backend returns users whose chosen local time matches now, who haven't
   been notified today, and who have ≥1 pending topic (and claims them in the
   same transaction so we can't double-send).
2. For each subscription, send an encrypted push with payload `{ count }`.
3. Any subscription that returns `404`/`410` is reported to
   `POST /internal/push/prune` for deletion.

The notification message itself is rendered by `web/public/sw.js`.

**Emails, once an hour** (`Schedule.cron("0 * * * *")`):

1. `POST {API_BASE_URL}/internal/emails/run` (header `X-Internal-Secret`) —
   the backend resolves who's due for the "never finished a session" or
   "5 days inactive" email, sends via Resend, and marks each as sent
   (idempotent, safe to call again before the next hour). No VAPID/web-push
   involved here — it's a plain trigger call.

## Env

Copy `.env.example` → `.env`. VAPID keys come from
`npx web-push generate-vapid-keys`; the public key must also be set as
`NEXT_PUBLIC_VAPID_PUBLIC_KEY` in the web app.

## Scripts

- `npm run dev` — watch mode
- `npm start` — production (Railway)
- `npm run send-now` — one forced tick, for manual testing
- `npm run typecheck`

## Deploy (Railway)

New service, root directory `notifier/`, start command `npm start`. Set
`API_BASE_URL`, `INTERNAL_API_SECRET`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`,
`VAPID_SUBJECT`. Run a single instance.
