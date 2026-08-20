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
- "streak tier": el usuario alcanzó un hito del multiplicador de XP (3/9/18/
  30/45 días de racha). Se felicita A LA MAÑANA SIGUIENTE (ventana 8-12 hora
  local): el multiplicador se disfruta en la próxima sesión, así el mail
  felicita y a la vez ofrece algo para hacer ahora. Si a esa altura el usuario
  ya repasó hoy por su cuenta, el hito se marca como avisado SIN mandar nada —
  volvió solo, el mail no tiene trabajo que hacer.

Un worker externo (notifier/) pollea `/internal/emails/run` por hora; ver
`due_bounce_emails` / `due_winback_emails` + `send_bounce_email` /
`send_winback_email`.
"""

from __future__ import annotations

import base64
import hashlib
import hmac
import logging
import os
import sys
import uuid
from datetime import datetime, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from sqlalchemy import func, or_
from sqlalchemy.orm import Session as DBSession

# `algorithm` vive en la raíz del repo; mismo patrón que session_store para
# que el módulo también se pueda importar suelto (scripts, previews).
sys.path.insert(0, str(Path(__file__).parent.parent))

from algorithm import STREAK_TIERS
from models import Session as SessionModel, User

BOUNCE_MIN_ACCOUNT_AGE = timedelta(hours=24)
WINBACK_INACTIVITY = timedelta(days=5)

# Ventana local del mail de hito: entre las 8 y las 12. El worker corre cada
# hora en el minuto :00, así que en la práctica llega entre las 8 y las 9.
STREAK_EMAIL_HOUR_FROM = 8
STREAK_EMAIL_HOUR_TO = 12

# Misma política que session_store: la tz la reporta el navegador y puede venir
# rota; fallback Argentina, donde vive casi toda la base.
_DEFAULT_TZ = "America/Argentina/Buenos_Aires"


def _user_zone(user: User) -> ZoneInfo:
    try:
        return ZoneInfo(user.timezone or _DEFAULT_TZ)
    except ZoneInfoNotFoundError:
        return ZoneInfo(_DEFAULT_TZ)


def _reached_tier(streak_days: int) -> int:
    """El mayor umbral de STREAK_TIERS alcanzado por `streak_days`, 0 si
    ninguno. Derivar el hito de los días (en vez de usar `tier_reached`, que
    solo es True el día exacto) hace que el mail sobreviva a cualquier retraso
    del worker."""
    reached = 0
    for threshold, _mult in STREAK_TIERS:
        if threshold > 0 and streak_days >= threshold:
            reached = threshold
    return reached


def _tier_multiplier(threshold: int) -> float:
    return dict(STREAK_TIERS)[threshold]


def _next_tier(threshold: int) -> tuple[int, float] | None:
    """(umbral, multiplicador) del escalón siguiente, None en el máximo."""
    thresholds = [t for t, _ in STREAK_TIERS if t > 0]
    i = thresholds.index(threshold)
    if i + 1 >= len(thresholds):
        return None
    nxt = thresholds[i + 1]
    return nxt, _tier_multiplier(nxt)


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


def due_streak_tier_emails(db: DBSession) -> tuple[list[tuple[User, int]], list[tuple[User, int]]]:
    """Candidatos del mail de hito de multiplicador.

    Devuelve dos listas de pares (user, tier): `to_send` (mandar ahora) y
    `to_mark` (marcar como avisado sin mandar: el hito fue un día anterior y
    el usuario ya volvió hoy por su cuenta — la felicitación no tiene trabajo
    que hacer).

    El filtro SQL es grueso a propósito (tier exacto y hora local se resuelven
    en Python, son un puñado de filas): streak_days en zona de hitos y marcador
    por detrás de los días — como el tier nunca supera los días, si el marcador
    ya está en streak_days o más, no puede haber hito pendiente.
    """
    candidates = (
        db.query(User)
        .filter(
            User.email_unsubscribed.is_(False),
            User.streak_days >= 3,
            or_(
                User.streak_email_sent_tier.is_(None),
                User.streak_email_sent_tier < User.streak_days,
            ),
        )
        .all()
    )

    to_send: list[tuple[User, int]] = []
    to_mark: list[tuple[User, int]] = []
    for user in candidates:
        tier = _reached_tier(user.streak_days)
        if tier <= (user.streak_email_sent_tier or 0):
            continue
        # Sin fecha de racha no hay forma de saber si "hoy ya repasó"; no
        # debería pasar con streak_days > 0, pero ante datos raros, silencio.
        if user.streak_last_date is None:
            continue
        local_now = datetime.now(_user_zone(user))
        if user.streak_last_date >= local_now.date():
            # Repaso hoy. Si streak_days == tier el hito es de HOY y el mail va
            # recien manana: ni mandar ni marcar todavia. Si es mayor, el hito
            # fue un dia anterior y hoy volvio solo: marcar sin mandar.
            if user.streak_days > tier:
                to_mark.append((user, tier))
            continue
        # Recién a la mañana siguiente, en la ventana.
        if not (STREAK_EMAIL_HOUR_FROM <= local_now.hour < STREAK_EMAIL_HOUR_TO):
            continue
        to_send.append((user, tier))
    return to_send, to_mark


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

# Diseño "a lo Brilliant": cuerpo claro, sin card con fondo fijo. La app de
# Gmail (iOS/Android) en modo oscuro ignora meta color-scheme y
# [data-ogsc]/[data-ogsb] y fuerza su propia inversión de colores — una card
# oscura fija (#131324) se convertía en lavanda claro y quedaba rota. Diseñando
# claro (texto oscuro sobre fondo transparente) esa inversión juega a favor: en
# modo oscuro Gmail lo pasa a texto claro sobre fondo oscuro y sigue viéndose
# intencional.

# El logo va como imagen inline (CID) en vez de HTML: Gmail no invierte las
# imágenes, así que el wordmark con su fondo #131324 y bordes redondeados se ve
# idéntico en claro y en oscuro. Además la barra de cinturones queda calzada al
# ancho exacto de la palabra, que con tablas HTML había que hardcodear (y
# quedaba corta). Se genera con scripts/gen_email_logo.py.
LOGO_PATH = Path(__file__).resolve().parent / "assets" / "email-logo.png"
LOGO_CID = "intervalo-logo"
LOGO_W, LOGO_H = 163, 61  # tamaño CSS; el PNG está a 3x para retina


def _logo_html() -> str:
    return (
        f'<img src="cid:{LOGO_CID}" width="{LOGO_W}" height="{LOGO_H}" alt="intervalo" '
        f'style="display:block;margin:0 auto 32px;border:0;outline:none;text-decoration:none;">'
    )


def render_email(*, greeting: str, highlight: str, cta_label: str, cta_url: str, unsubscribe_url: str, preview: str | None = None) -> str:
    # La app usa DM Sans para el cuerpo; Gmail no carga webfonts, así que se
    # aproxima con un stack sans-serif web-safe (antes no se declaraba nada y
    # el cuerpo caía en Times).
    sans = "font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;"
    # Misma forma que el CTA de la app y de la landing: esquinas de 4px,
    # mayúsculas y tracking de 0.1em (1.3px sobre 13px). Antes era una píldora
    # de 8px en minúsculas, que no se parecía a ningún botón del producto. El
    # texto va en caja normal y las mayúsculas las pone el CSS: si un cliente
    # ignora text-transform, la etiqueta se sigue leyendo bien.
    btn = (
        f"display:inline-block;background:#5457e5;color:#ffffff;{sans}font-size:13px;"
        "font-weight:600;letter-spacing:1.3px;text-transform:uppercase;"
        "padding:15px 30px;border-radius:4px;text-decoration:none"
    )
    # Preheader: lo que Gmail y Apple Mail muestran como preview en la bandeja
    # y en la notificación. Sin esto el snippet se arma con TODO el texto del
    # mail en orden — botón, URL y pie incluidos. Va invisible al principio del
    # body, y el relleno de &nbsp;&zwnj; empuja lo que sigue fuera del recorte.
    # `preview` permite recortarlo (ej: el mail de hito deja la negrita solo
    # adentro del mail); por defecto es saludo + negrita.
    preview = preview if preview is not None else f"{greeting} {highlight}"
    preheader = (
        '<div style="display:none;font-size:1px;line-height:1px;max-height:0;'
        f'max-width:0;opacity:0;overflow:hidden;">{preview}{"&nbsp;&zwnj;" * 40}</div>'
    )
    return f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<style>
  body {{ margin:0; padding:0; }}
</style>
</head>
<body>
{preheader}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:48px 16px;">
<table role="presentation" width="420" cellpadding="0" cellspacing="0" style="max-width:420px;">
<tr><td align="center" style="padding:0 24px;">
{_logo_html()}
<p style="{sans}font-size:15px;line-height:1.6;margin:0 0 8px;max-width:22rem;color:#131324;">{greeting}</p>
<p style="{sans}font-size:15px;line-height:1.6;margin:0 0 24px;font-weight:700;color:#131324;">{highlight}</p>
<a href="{cta_url}" style="{btn}">{cta_label}</a>
<p style="{sans}font-size:11px;line-height:1.7;color:#768899;margin:32px 0 0">Intervalo 2026. Desarrollado por y para estudiantes.<br><a href="{_app_base_url()}/terminos" style="color:#768899">Términos y condiciones</a> &middot; <a href="{_app_base_url()}/privacidad" style="color:#768899">Política de privacidad</a> &middot; <a href="{unsubscribe_url}" style="color:#768899">Desuscribirse</a></p>
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


def _send(to_email: str, subject: str, html: str, unsubscribe_url: str, text: str | None = None) -> bool:
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
        payload = {
            "from": from_email,
            "to": to_email,
            "subject": subject,
            "html": html,
            # Sin esto Resend autogenera el texto plano convirtiendo el HTML
            # entero (botón, URL y pie incluidos), y es lo que Gmail muestra en
            # la notificación. La versión propia lleva solo el copy.
            **({"text": text} if text else {}),
            # Gmail y Yahoo ponen su propio botón de "Cancelar suscripción" arriba
            # de todo cuando existe este par de headers, y cuentan su ausencia como
            # señal negativa de reputación aunque el link esté en el pie. El POST
            # de un click lo maneja el mismo endpoint (ver main.py) — sin eso,
            # Gmail recibiría un 405 y descartaría el header.
            "headers": {
                "List-Unsubscribe": f"<{unsubscribe_url}>",
                "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
                # Los mails de ciclo de vida comparten asunto ("¡Volvé X!"):
                # sin esto Gmail los encadena en un hilo y recorta el contenido
                # repetido entre mensajes — el botón y el pie, idénticos de un
                # mail al otro, quedan escondidos detrás de los "···". Un id
                # único por envío le dice a Gmail que no son la misma
                # conversación.
                "X-Entity-Ref-ID": uuid.uuid4().hex,
            },
        }
        if LOGO_PATH.exists():
            payload["attachments"] = [
                {
                    "content": base64.b64encode(LOGO_PATH.read_bytes()).decode(),
                    "filename": "intervalo.png",
                    "content_type": "image/png",
                    "content_id": LOGO_CID,
                }
            ]
        resend.Emails.send(payload)
        return True
    except Exception:
        logging.exception("Failed to send lifecycle email via Resend to %s", to_email)
        return False


def send_bounce_email(db: DBSession, user: User) -> bool:
    name = greeting_name(user)
    unsubscribe_url = f"{_api_base_url()}/email/unsubscribe?token={unsubscribe_token(user.id)}"
    greeting = "Tu cuenta ya está lista y los ejercicios te esperan."
    highlight = "Solo falta tu primera sesión."
    html = render_email(
        greeting=greeting,
        highlight=highlight,
        cta_label="Volver",
        cta_url=_app_base_url(),
        unsubscribe_url=unsubscribe_url,
    )
    sent = _send(user.email, f"¡Todo listo {name}! 🏁", html, unsubscribe_url, text=f"{greeting} {highlight}")
    if sent:
        user.bounce_email_sent_at = datetime.utcnow()
        db.commit()
    return sent


def send_winback_email(db: DBSession, user: User) -> bool:
    name = greeting_name(user)
    unsubscribe_url = f"{_api_base_url()}/email/unsubscribe?token={unsubscribe_token(user.id)}"
    greeting = "Tus temas te extrañan y te están sacando puestos en el ranking."
    highlight = "Recuperalos hoy mismo."
    html = render_email(
        greeting=greeting,
        highlight=highlight,
        cta_label="Volver",
        cta_url=_app_base_url(),
        unsubscribe_url=unsubscribe_url,
    )
    sent = _send(user.email, f"¡Volvé {name}! 👀", html, unsubscribe_url, text=f"{greeting} {highlight}")
    if sent:
        user.winback_email_sent_at = datetime.utcnow()
        db.commit()
    return sent


def send_streak_tier_email(db: DBSession, user: User, tier: int) -> bool:
    name = greeting_name(user)
    mult = _tier_multiplier(tier)
    unsubscribe_url = f"{_api_base_url()}/email/unsubscribe?token={unsubscribe_token(user.id)}"

    if mult == 2.0:
        gain = "vale el doble de XP"
    else:
        gain = f"suma un {round((mult - 1) * 100)}% más de XP"
    nxt = _next_tier(tier)
    if nxt is None:
        highlight = "Es el multiplicador más alto que hay. Ahora se trata de no perderlo."
    else:
        nxt_days, nxt_mult = nxt
        highlight = f"El próximo escalón es ×{nxt_mult:.1f}, a los {nxt_days} días."

    html = render_email(
        greeting=f"Llegaste a {tier} días seguidos repasando: cada ejercicio que resolvés ahora {gain}.",
        highlight=highlight,
        # "Continuar" y no "Volver": este mail no le habla a alguien que se fue,
        # sino a alguien que viene bien y tiene que seguir.
        cta_label="Continuar",
        cta_url=_app_base_url(),
        unsubscribe_url=unsubscribe_url,
    )
    sent = _send(user.email, f"¡Llegaste a ×{mult:.1f}, {name}!", html, unsubscribe_url)
    if sent:
        user.streak_email_sent_tier = tier
        user.streak_email_sent_at = datetime.utcnow()
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

    streak_tier_sent = 0
    to_send, to_mark = due_streak_tier_emails(db)
    for user, tier in to_mark:
        user.streak_email_sent_tier = tier
    if to_mark:
        db.commit()
    for user, tier in to_send:
        if send_streak_tier_email(db, user, tier):
            streak_tier_sent += 1

    return {
        "bounce_sent": bounce_sent,
        "winback_sent": winback_sent,
        "streak_tier_sent": streak_tier_sent,
    }
