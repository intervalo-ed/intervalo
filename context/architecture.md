# Architecture

## Servicios

| Servicio | Stack | Rol |
|---|---|---|
| `backend` | FastAPI + SQLAlchemy + Alembic (Python), Postgres | API principal, dueño de toda la escritura a DB, lógica de sesión/algoritmo/notificaciones/emails. |
| `web` | Next.js (App Router, versión custom — ver advertencia abajo) | Frontend, consume la API vía cliente OpenAPI generado. |
| `notifier` | Node + Effect (`notifier/`) | Worker liviano, **nunca toca la DB directo**. Dos cron loops: push cada 15 min, emails de lifecycle cada 1h. |
| `BBDD` | Postgres (Railway) | Persistencia. |

Despliegue: Railway, un servicio por repo-root (`notifier/` como root directory propio). **Los nombres de servicio en Railway son mutables y pueden cambiar sin aviso** (renombrados manualmente desde el dashboard) — no asumir un nombre fijo, correr `railway service status --all` para confirmar antes de operar.

## Cómo se comunican

- `web` habla solo con `backend` (API pública, auth Clerk).
- `notifier` habla solo con `backend`, vía endpoints internos guardados con header `X-Internal-Secret` (`GET /internal/notifications/due`, `POST /internal/push/prune`, `POST /internal/emails/run`). El worker nunca abre conexión a la DB.
- Push: `notifier` llama a `/internal/notifications/due` (el backend selecciona y **claimea atómicamente** usuarios due, evitando doble envío), envía vía `web-push` (VAPID), reporta suscripciones muertas (404/410) a `/internal/push/prune`. El copy del mensaje lo arma `backend/notification_copy.py`, el service worker (`web/public/sw.js`) solo renderiza lo que llega.
- Emails de lifecycle: `notifier` solo dispara `/internal/emails/run` una vez por hora; todo el envío (vía Resend) pasa por `backend/lifecycle_emails.py`, idempotente.

## Pitfalls operativos conocidos

### Alembic: reordenar migraciones ya aplicadas es un no-op

`down_revision` en cada archivo de migración declara el padre en el **grafo de archivos**, pero la base de datos solo guarda una fila `alembic_version` (la revisión actual como string) — no revalida ni recorre la cadena completa de ancestros en cada deploy. Si dos ramas agregan migraciones en paralelo y una se mergea a producción primero, insertar una migración "detrás" de una que prod ya tiene aplicada hace que Alembic la dé por aplicada y **la salte silenciosamente**, aunque nunca corrió.

Consecuencia práctica: si sospechás una migración salteada, **no alcanza con mirar el grafo de archivos ni reordenar `down_revision`** — hay que conectarse directo a la DB de prod y comparar `alembic_version` contra `information_schema.columns`/`alembic.script.ScriptDirectory.from_config(cfg).get_heads()` (offline, sin DB) antes de decidir el fix. El fix correcto para una migración salteada es una migración **nueva, hacia adelante, idempotente** (chequear existencia de columna/tabla antes de crearla) — nunca reescribir la que ya se saltó.

Verificación offline de heads (sin tocar la DB): `alembic.script.ScriptDirectory.from_config(cfg).get_heads()` — usar antes de cualquier deploy que toque el orden de migraciones, para descartar heads múltiples o ciclos.

### Crash en cascada notifier → backend

Si `backend` está caído, `notifier`'s `tick.ts` recibe algo que no es el array esperado desde `/internal/notifications/due` y crashea (`TypeError: X.flatMap is not a function`). Railway agota sus reintentos automáticos y el servicio queda `CRASHED` — **hace falta un restart manual** (`railway restart -s "<nombre>" --yes`) después de que `backend` vuelva a estar sano; el auto-restart no se recupera solo.

Última verificación: 2026-08-01
