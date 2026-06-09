# Intervalo notifier

Tiny [Effect](https://effect.website) worker that sends the daily "you have
pendings" web-push. It never touches the database — it calls the FastAPI
backend's internal endpoints and sends the pushes with
[`web-push`](https://github.com/web-push-libs/web-push).

## How it works

Every 15 minutes (`Schedule.cron("*/15 * * * *")`):

1. `GET {API_BASE_URL}/internal/notifications/due` (header `X-Internal-Secret`)
   — the backend returns users whose chosen local time matches now, who haven't
   been notified today, and who have ≥1 pending topic (and claims them in the
   same transaction so we can't double-send).
2. For each subscription, send an encrypted push with payload `{ count }`.
3. Any subscription that returns `404`/`410` is reported to
   `POST /internal/push/prune` for deletion.

The notification message itself is rendered by `web/public/sw.js`.

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
