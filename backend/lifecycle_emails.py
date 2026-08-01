"""
lifecycle_emails.py — Emails automáticos de retención (Resend).

Dos disparadores, resueltos íntegramente en el backend (a diferencia del push,
el envío no necesita un worker separado — Resend se llama directo desde acá):

- "bounce": el usuario se registró pero nunca terminó una sesión. Se manda una
  sola vez (`bounce_email_sent_at`).
- "winback": el usuario terminó al menos una sesión pero no volvió en 5+ días.
  Se manda una vez por racha de inactividad — se re-arma solo si vuelve a
  terminar una sesión y cae inactivo de nuevo (`winback_email_sent_at` se
  compara contra el último `finished_at`, no solo contra "ya se mandó alguna
  vez").

Un worker externo (notifier/) pollea `/internal/emails/run` por hora; ver
`due_bounce_emails` / `due_winback_emails` + `send_bounce_email` /
`send_winback_email`.
"""

from __future__ import annotations

import hashlib
import hmac
import logging
import os
from datetime import datetime, timedelta

from sqlalchemy import func
from sqlalchemy.orm import Session as DBSession

from models import Session as SessionModel, User

BOUNCE_MIN_ACCOUNT_AGE = timedelta(hours=24)
WINBACK_INACTIVITY = timedelta(days=5)


# ── Apodo ────────────────────────────────────────────────────────────────────

def greeting_name(user: User) -> str:
    """`display_name` si parece un apodo real; si no, el primer nombre."""
    dn = (user.display_name or "").strip()
    if len(dn) >= 2 and not dn.isdigit() and "@" not in dn:
        return dn
    return (user.name or "").strip().split(" ")[0] or "che"


# ── Selección de destinatarios ───────────────────────────────────────────────

def due_bounce_emails(db: DBSession) -> list[User]:
    """Usuarios registrados hace 24h+ que nunca terminaron una sesión."""
    cutoff = datetime.utcnow() - BOUNCE_MIN_ACCOUNT_AGE
    finished_user_ids = (
        db.query(SessionModel.user_id)
        .filter(SessionModel.finished_at.isnot(None))
        .distinct()
    )
    return (
        db.query(User)
        .filter(
            User.email_unsubscribed.is_(False),
            User.bounce_email_sent_at.is_(None),
            User.created_at <= cutoff,
            User.id.notin_(finished_user_ids),
        )
        .all()
    )


def due_winback_emails(db: DBSession) -> list[tuple[User, datetime]]:
    """Usuarios con >=1 sesión terminada, inactivos 5+ días, sin mail ya
    mandado para esta racha de inactividad en particular. Devuelve pares
    (user, last_finished_at) — el caller necesita last_finished_at para
    setear el marcador de idempotencia."""
    cutoff = datetime.utcnow() - WINBACK_INACTIVITY
    last_finished = (
        db.query(
            SessionModel.user_id.label("user_id"),
            func.max(SessionModel.finished_at).label("last_finished_at"),
        )
        .filter(SessionModel.finished_at.isnot(None))
        .group_by(SessionModel.user_id)
        .subquery()
    )
    rows = (
        db.query(User, last_finished.c.last_finished_at)
        .join(last_finished, last_finished.c.user_id == User.id)
        .filter(
            User.email_unsubscribed.is_(False),
            last_finished.c.last_finished_at <= cutoff,
        )
        .all()
    )
    return [
        (user, last_finished_at)
        for user, last_finished_at in rows
        if user.winback_email_sent_at is None
        or user.winback_email_sent_at < last_finished_at
    ]


# ── Desuscripción (token sin login) ──────────────────────────────────────────

def _unsub_secret() -> str:
    secret = os.environ.get("EMAIL_UNSUB_SECRET")
    if not secret:
        raise RuntimeError("EMAIL_UNSUB_SECRET not configured")
    return secret


def unsubscribe_token(user_id: int) -> str:
    mac = hmac.new(_unsub_secret().encode(), str(user_id).encode(), hashlib.sha256)
    return f"{user_id}.{mac.hexdigest()}"


def verify_unsubscribe_token(token: str) -> int | None:
    try:
        user_id_str, mac_hex = token.split(".", 1)
        user_id = int(user_id_str)
    except (ValueError, AttributeError):
        return None
    expected = hmac.new(_unsub_secret().encode(), user_id_str.encode(), hashlib.sha256)
    if not hmac.compare_digest(mac_hex, expected.hexdigest()):
        return None
    return user_id


# ── Plantilla HTML ────────────────────────────────────────────────────────────

# Ver decisiones de diseño en el plan: card oscura fija (#131324/#f6f8fc, misma
# paleta que la app), sin adaptar a claro/oscuro de Gmail — el modo oscuro de
# la app de Gmail (iOS/Android) ignora meta color-scheme y [data-ogsc]/[data-ogsb]
# en la práctica, así que no vale la pena perseguirlo más allá de lo ya intentado.

_BELT_BAR = ["#FAFAFA", "#00297A", "#62007A", "#7A4300"]


def _logo_html() -> str:
    cells = "".join(
        f'<td width="30" height="4" style="background:{c};line-height:4px;font-size:1px;">&nbsp;</td>'
        for c in _BELT_BAR
    )
    return f"""
<p class="tw" style="margin:0 0 5px;font-family:Georgia,'Times New Roman',serif;font-weight:700;font-size:24px;letter-spacing:-0.3px;color:#f6f8fc;">intervalo</p>
<table role="presentation" cellpadding="0" cellspacing="0" width="120" style="margin:0 auto 28px;"><tr>{cells}</tr></table>
"""


def render_email(*, greeting: str, question: str, cta_label: str, cta_url: str, unsubscribe_url: str) -> str:
    btn = (
        "display:inline-block;background:#5457e5;color:#f6f8fc;font-size:14px;"
        "font-weight:700;padding:12px 28px;border-radius:8px;text-decoration:none"
    )
    return f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="dark light">
<meta name="supported-color-schemes" content="dark light">
<style>
  body {{ margin:0; padding:0; }}
  .card {{ background:#131324 !important; }}
  .tw {{ color:#f6f8fc !important; }}
  [data-ogsc] .card {{ background:#131324 !important; }}
  [data-ogsc] .tw {{ color:#f6f8fc !important; }}
  [data-ogsb] .card {{ background:#131324 !important; }}
</style>
</head>
<body>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 16px;">
<table role="presentation" width="420" cellpadding="0" cellspacing="0" class="card" style="max-width:420px;background:#131324;border-radius:12px;">
<tr><td align="center" style="padding:32px 24px;">
{_logo_html()}
<p class="tw" style="font-size:15px;line-height:1.6;margin:0 0 8px;max-width:22rem;color:#f6f8fc;">{greeting}</p>
<p class="tw" style="font-size:15px;line-height:1.6;margin:0 0 20px;font-weight:700;color:#f6f8fc;">{question}</p>
<a href="{cta_url}" style="{btn}">{cta_label}</a>
<p class="tw" style="font-size:11px;color:#768899;margin:28px 0 0">Intervalo 2026. Desarrollado por y para estudiantes. <a class="tw" href="{unsubscribe_url}" style="color:#768899">Desuscribirse</a>.</p>
</td></tr>
</table>
</td></tr></table>
</body>
</html>"""


# ── Envío ─────────────────────────────────────────────────────────────────────

def _app_base_url() -> str:
    return os.environ.get("APP_BASE_URL", "https://www.intervalo.xyz")


def _api_base_url() -> str:
    return os.environ.get("API_BASE_URL", "https://api.intervalo.xyz")


def _send(to_email: str, subject: str, html: str) -> bool:
    """Best-effort send via Resend. Returns True on success, logs and swallows
    any failure so one bad address never blocks the rest of the batch."""
    api_key = os.environ.get("RESEND_API_KEY")
    if not api_key:
        logging.warning("RESEND_API_KEY not set — skipping lifecycle email")
        return False

    from_email = os.environ.get("LIFECYCLE_FROM_EMAIL", "Intervalo <hola@comms.intervalo.xyz>")

    try:
        import resend

        resend.api_key = api_key
        resend.Emails.send({"from": from_email, "to": to_email, "subject": subject, "html": html})
        return True
    except Exception:
        logging.exception("Failed to send lifecycle email via Resend to %s", to_email)
        return False


def send_bounce_email(db: DBSession, user: User) -> bool:
    name = greeting_name(user)
    html = render_email(
        greeting=f"Hola {name}, empezaste a explorar Intervalo pero todavía no terminaste tu primera sesión de repaso.",
        question="¿Arrancamos?",
        cta_label="Continuar",
        cta_url=_app_base_url(),
        unsubscribe_url=f"{_api_base_url()}/email/unsubscribe?token={unsubscribe_token(user.id)}",
    )
    sent = _send(user.email, f"¡Volvé {name}!", html)
    if sent:
        user.bounce_email_sent_at = datetime.utcnow()
        db.commit()
    return sent


def send_winback_email(db: DBSession, user: User) -> bool:
    name = greeting_name(user)
    html = render_email(
        greeting=f"Hola {name}, no te vemos hace algunos días. Nada urgente, pero tus repasos pendientes van a seguir ahí hasta que vuelvas.",
        question="¿Volvemos?",
        cta_label="Continuar",
        cta_url=_app_base_url(),
        unsubscribe_url=f"{_api_base_url()}/email/unsubscribe?token={unsubscribe_token(user.id)}",
    )
    sent = _send(user.email, f"¡Volvé {name}!", html)
    if sent:
        user.winback_email_sent_at = datetime.utcnow()
        db.commit()
    return sent


def run_lifecycle_emails(db: DBSession) -> dict:
    bounce_sent = 0
    for user in due_bounce_emails(db):
        if send_bounce_email(db, user):
            bounce_sent += 1

    winback_sent = 0
    for user, _last_finished_at in due_winback_emails(db):
        if send_winback_email(db, user):
            winback_sent += 1

    return {"bounce_sent": bounce_sent, "winback_sent": winback_sent}
