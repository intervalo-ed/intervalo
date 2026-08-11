"""
push_store.py — Web Push subscriptions + daily-notification preferences.

The frontend stores a browser PushSubscription and a per-user notification
preference (enabled + time + timezone). A separate worker polls
`due_notifications` every 15 min and sends the actual pushes — this module
holds all the data access for both sides, plus the per-user context building
that feeds `notification_copy.choose_variant` (rotation across a pool of
notification categories instead of a single fixed message).
"""

from __future__ import annotations

import sys
from datetime import date, datetime, time, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from sqlalchemy import func
from sqlalchemy.orm import Session as DBSession

sys.path.insert(0, str(Path(__file__).parent.parent))

from algorithm import streak_info

import notification_copy
from models import (
    Answer,
    Enrollment,
    NotificationSend,
    PushSubscription,
    Session as SessionModel,
    UnitState,
    User,
)

COURSE_ID = 1  # Single-course app for now (matches the rest of the backend).

# Cuántos aportantes por universidad cuentan como "top contributor" esa semana.
TOP_CONTRIBUTOR_N = 3

# Marcas de podio: 10, 20, 30, 50 y después de a 100 (100, 200, 300, ...). Ver
# _next_podium_threshold.
_PODIUM_STEP_THRESHOLDS = [10, 20, 30, 50]

# Ventana del récord personal de ejercicios por día (ver _personal_best).
PERSONAL_BEST_WINDOW_DAYS = 180


# ── Subscriptions ──────────────────────────────────────────────────────────────

def upsert_subscription(
    db: DBSession, user_id: int, endpoint: str, p256dh: str, auth: str
) -> None:
    """Store (or refresh) a browser push subscription, keyed by (user, endpoint).

    Also deletes any OTHER subscriptions for this user. A new endpoint means the
    browser's previous PushManager subscription was invalidated (permiso de iOS
    desactivado/reactivado, reinstall de la PWA, etc.) — su registro a nivel OS
    ya no existe, así que la fila vieja queda huérfana: el notifier le sigue
    mandando pushes que no llegan a ningún lado (Apple no siempre devuelve
    404/410 para que el prune automático las limpie), y si por lo que sea sí
    llegan a un Service Worker desincronizado, el payload no decodea bien y cae
    en el fallback genérico de sw.js. Este flujo es de un solo dispositivo por
    usuario, así que no tiene sentido acumular endpoints muertos."""
    db.query(PushSubscription).filter(
        PushSubscription.user_id == user_id,
        PushSubscription.endpoint != endpoint,
    ).delete()

    existing = (
        db.query(PushSubscription)
        .filter(
            PushSubscription.user_id == user_id,
            PushSubscription.endpoint == endpoint,
        )
        .first()
    )
    if existing:
        existing.p256dh = p256dh
        existing.auth = auth
        existing.last_used_at = datetime.utcnow()
    else:
        db.add(
            PushSubscription(
                user_id=user_id,
                course_id=COURSE_ID,
                endpoint=endpoint,
                p256dh=p256dh,
                auth=auth,
                last_used_at=datetime.utcnow(),
            )
        )
    db.commit()


def user_id_for_endpoint(db: DBSession, endpoint: str) -> int | None:
    """Look up which user owns a subscription endpoint. Used by the
    unauthenticated /push/diagnostic report (the service worker has no Clerk
    session to identify the user with)."""
    sub = (
        db.query(PushSubscription)
        .filter(PushSubscription.endpoint == endpoint)
        .first()
    )
    return sub.user_id if sub else None


def mark_notification_opened(notification_id: int, endpoint: str | None, db: DBSession) -> None:
    """Marca un NotificationSend como abierto (click en la notificación, ver
    sw.js notificationclick). Valida que el endpoint reportado pertenezca al
    mismo usuario que recibió el envío, para que nadie pueda marcar aperturas
    ajenas solo adivinando ids. Idempotente: el primer click gana, uno
    posterior (doble click, refocus) no pisa el timestamp original."""
    send = db.query(NotificationSend).filter(NotificationSend.id == notification_id).first()
    if send is None or send.opened_at is not None:
        return
    owner_id = user_id_for_endpoint(db, endpoint) if endpoint else None
    if owner_id != send.user_id:
        return
    send.opened_at = datetime.utcnow()
    db.commit()


def delete_subscription(db: DBSession, user_id: int, endpoint: str) -> None:
    db.query(PushSubscription).filter(
        PushSubscription.user_id == user_id,
        PushSubscription.endpoint == endpoint,
    ).delete()
    db.commit()


def delete_subscriptions_by_id(db: DBSession, subscription_ids: list[int]) -> int:
    """Prune dead subscriptions (worker reported 404/410). Returns rows removed."""
    if not subscription_ids:
        return 0
    deleted = (
        db.query(PushSubscription)
        .filter(PushSubscription.id.in_(subscription_ids))
        .delete(synchronize_session=False)
    )
    db.commit()
    return deleted


# ── Notification preferences ─────────────────────────────────────────────────────

def get_settings(user: User) -> dict:
    return {
        "enabled": user.notify_enabled,
        "time": user.notify_time,
        "timezone": user.notify_timezone,
    }


def save_settings(
    db: DBSession, user: User, enabled: bool, time: str | None, timezone: str | None
) -> dict:
    user.notify_enabled = enabled
    user.notify_time = time
    user.notify_timezone = timezone
    db.commit()
    return get_settings(user)


# ── Pending count ────────────────────────────────────────────────────────────────

def pending_topic_count(db: DBSession, user_id: int, today: date) -> int:
    """Number of distinct (belt, topic) groups with any unit due on/before `today`."""
    rows = (
        db.query(UnitState.belt, UnitState.topic)
        .filter(
            UnitState.user_id == user_id,
            UnitState.course_id == COURSE_ID,
            UnitState.next_due.isnot(None),
            UnitState.next_due <= today,
        )
        .distinct()
        .all()
    )
    return len(rows)


# ── Ranking / universidad — helpers de contexto para el copy ──────────────────

def _local_day_bounds_utc(day: date, tz: ZoneInfo) -> tuple[datetime, datetime]:
    """Medianoche a medianoche del `day` en `tz`, expresado en UTC naive (para
    comparar contra columnas DateTime que guardan datetime.utcnow()). Mismo
    patrón que session_store._user_day_start_utc — sin esto, comparar contra
    los límites del día calendario en UTC desplaza la ventana hasta 3hs
    (Argentina) respecto al día real del usuario, sobre todo cerca de la
    medianoche."""
    start_local = datetime.combine(day, time.min, tzinfo=tz)
    end_local = datetime.combine(day, time.max, tzinfo=tz)
    return (
        start_local.astimezone(ZoneInfo("UTC")).replace(tzinfo=None),
        end_local.astimezone(ZoneInfo("UTC")).replace(tzinfo=None),
    )


class _TickCache:
    """Memo por tick de `due_notifications` de los datos que NO dependen del
    usuario (o que se repiten para varios): el ranking de universidades y los
    ids de cada universidad. Sin esto, un tick con N usuarios de la misma
    universidad repetía los mismos escaneos completos de `users`/`enrollments`
    varias veces por usuario."""

    def __init__(self) -> None:
        self.university_user_ids: dict[str, list[int]] = {}
        self.university_totals: list[tuple[str, int]] | None = None


def _university_user_ids(
    db: DBSession, university: str, *, cache: _TickCache | None = None
) -> list[int]:
    if cache is not None and university in cache.university_user_ids:
        return cache.university_user_ids[university]
    user_ids = [
        e.user_id
        for e in db.query(Enrollment)
        .filter(Enrollment.course_id == COURSE_ID, Enrollment.university == university)
        .all()
    ]
    if cache is not None:
        cache.university_user_ids[university] = user_ids
    return user_ids


def _current_rank(
    db: DBSession,
    user: User,
    *,
    university: str | None = None,
    cache: _TickCache | None = None,
) -> int:
    """Rank 1-based por total_xp desc, id asc — global si university es None, o
    acotado a esa universidad si se pasa. Mismo orden que GET /leaderboard.
    2 COUNT(*) en vez de traer/ordenar toda la tabla; solo se llama para
    candidatos ya filtrados por due_notifications."""
    q_higher = db.query(func.count(User.id)).filter(User.total_xp > user.total_xp)
    q_tied = db.query(func.count(User.id)).filter(
        User.total_xp == user.total_xp, User.id < user.id
    )
    if university is not None:
        user_ids = _university_user_ids(db, university, cache=cache)
        q_higher = q_higher.filter(User.id.in_(user_ids))
        q_tied = q_tied.filter(User.id.in_(user_ids))
    return q_higher.scalar() + q_tied.scalar() + 1


def _ranking_overtake_context(db: DBSession, user: User) -> dict:
    """{'overtaken': bool, 'overtaker_name': str | None} — ranking GLOBAL.
    notify_last_rank se refresca siempre (aunque gane otra categoría este tick),
    así el próximo chequeo compara contra un valor fresco."""
    current_rank = _current_rank(db, user)
    overtaken = user.notify_last_rank is not None and current_rank > user.notify_last_rank
    overtaker_name = None
    if overtaken and current_rank > 1:
        neighbor = (
            db.query(User)
            .filter(User.total_xp >= user.total_xp, User.id != user.id)
            .order_by(User.total_xp.asc(), User.id.desc())
            .first()
        )
        if neighbor:
            overtaker_name = neighbor.username
    user.notify_last_rank = current_rank
    return {"overtaken": overtaken, "overtaker_name": overtaker_name}


def _next_podium_threshold(rank: int) -> int:
    """Próxima marca de podio a la que puede aspirar un usuario en la posición
    `rank`: 10, 20, 30, 50 y de ahí en más de a 100 (100, 200, 300, ...). Solo
    se llama con rank > 10 (ya estar en el top 10 excluye la categoría)."""
    for threshold in _PODIUM_STEP_THRESHOLDS:
        if threshold > rank:
            return threshold
    return ((rank // 100) + 1) * 100


def _podium_gap(
    db: DBSession,
    user: User,
    *,
    university: str | None = None,
    cache: _TickCache | None = None,
) -> tuple[int, int] | tuple[None, None]:
    """(xp_gap, threshold) hasta la próxima marca de podio, o (None, None) si
    ya está en el top 10, no hay suficientes usuarios en el scope, o el
    usuario está empatado en XP con quien ocupa esa posición (gap 0 — el
    rank no lo refleja por el desempate de id, pero "estás a 0 XP" no tiene
    sentido como copy)."""
    rank = _current_rank(db, user, university=university, cache=cache)
    if rank <= 10:
        return None, None
    threshold = _next_podium_threshold(rank)
    q = db.query(User.total_xp).order_by(User.total_xp.desc(), User.id.asc())
    if university is not None:
        q = q.filter(User.id.in_(_university_user_ids(db, university, cache=cache)))
    row = q.offset(threshold - 1).limit(1).first()
    if row is None:
        return None, None
    gap = row[0] - user.total_xp
    if gap <= 0:
        return None, None
    return gap, threshold


def university_weekly_xp(
    db: DBSession, university: str, since: datetime, *, cache: _TickCache | None = None
) -> int:
    """Suma de Answer.xp_earned para usuarios de esa universidad, respondidas
    desde `since`. Reusa el mismo mapeo Enrollment→university que
    GET /leaderboard/universities."""
    user_ids = _university_user_ids(db, university, cache=cache)
    if not user_ids:
        return 0
    return (
        db.query(func.sum(Answer.xp_earned))
        .filter(Answer.user_id.in_(user_ids), Answer.answered_at >= since)
        .scalar()
        or 0
    )


def _is_top_contributor(
    db: DBSession,
    user: User,
    university: str,
    since: datetime,
    *,
    cache: _TickCache | None = None,
) -> bool:
    user_ids = _university_user_ids(db, university, cache=cache)
    if not user_ids:
        return False
    rows = (
        db.query(Answer.user_id)
        .filter(Answer.user_id.in_(user_ids), Answer.answered_at >= since)
        .group_by(Answer.user_id)
        .order_by(func.sum(Answer.xp_earned).desc())
        .limit(TOP_CONTRIBUTOR_N)
        .all()
    )
    return user.id in {uid for (uid,) in rows}


def _university_totals(
    db: DBSession, *, cache: _TickCache | None = None
) -> list[tuple[str, int]]:
    """(university, total_xp) ordenado desc — misma agregación que
    GET /leaderboard/universities.

    El resultado no depende del usuario, pero lo consultan tanto el gap con la
    universidad de arriba como el de la de abajo, para cada usuario del tick: se
    calcula una sola vez por tick vía `cache`."""
    if cache is not None and cache.university_totals is not None:
        return cache.university_totals
    totals: dict[str, int] = {}
    rows = (
        db.query(Enrollment.university, func.sum(User.total_xp))
        .join(User, User.id == Enrollment.user_id)
        .filter(
            Enrollment.course_id == COURSE_ID,
            Enrollment.university.isnot(None),
            Enrollment.university != "",
        )
        .group_by(Enrollment.university)
        .all()
    )
    for uni, xp in rows:
        totals[uni] = int(xp or 0)
    ordered = sorted(totals.items(), key=lambda kv: kv[1], reverse=True)
    if cache is not None:
        cache.university_totals = ordered
    return ordered


def _rival_university_gap(
    db: DBSession, own_university: str, *, cache: _TickCache | None = None
) -> tuple[int, str] | tuple[None, None]:
    totals = _university_totals(db, cache=cache)
    idx = next((i for i, (uni, _) in enumerate(totals) if uni == own_university), None)
    if idx is None or idx == 0:
        return None, None  # no está en el ranking, o ya es la #1
    rival_uni, rival_xp = totals[idx - 1]
    own_xp = totals[idx][1]
    gap = rival_xp - own_xp
    if gap <= 0:
        return None, None  # empate en XP total — "a 0 XP de alcanzar" no aplica
    return gap, rival_uni


def _defender_university_gap(
    db: DBSession, own_university: str, *, cache: _TickCache | None = None
) -> tuple[int, str] | tuple[None, None]:
    """Simétrico a _rival_university_gap pero mirando hacia abajo: la
    universidad inmediatamente detrás en el ranking, que amenaza con
    sobrepasar a la propia (para el copy "defendé el lugar"), sin importar
    en qué puesto esté la propia."""
    totals = _university_totals(db, cache=cache)
    idx = next((i for i, (uni, _) in enumerate(totals) if uni == own_university), None)
    if idx is None or idx == len(totals) - 1:
        return None, None  # no está en el ranking, o ya es la última
    own_xp = totals[idx][1]
    defender_uni, defender_xp = totals[idx + 1]
    gap = own_xp - defender_xp
    if gap <= 0:
        return None, None  # empate en XP total
    return gap, defender_uni


def _social_active_today(
    db: DBSession,
    user: User,
    university: str,
    local_today: date,
    tz: ZoneInfo,
    *,
    cache: _TickCache | None = None,
) -> int:
    user_ids = [
        uid
        for uid in _university_user_ids(db, university, cache=cache)
        if uid != user.id
    ]
    if not user_ids:
        return 0
    day_start, _ = _local_day_bounds_utc(local_today, tz)
    count = (
        db.query(func.count(func.distinct(SessionModel.user_id)))
        .filter(
            SessionModel.user_id.in_(user_ids),
            SessionModel.finished_at.isnot(None),
            SessionModel.finished_at >= day_start,
        )
        .scalar()
    )
    return count or 0


def _exercises_on(db: DBSession, user_id: int, day: date, tz: ZoneInfo) -> int:
    day_start, day_end = _local_day_bounds_utc(day, tz)
    return (
        db.query(func.count(Answer.id))
        .filter(
            Answer.user_id == user_id,
            Answer.answered_at >= day_start,
            Answer.answered_at <= day_end,
        )
        .scalar()
        or 0
    )


def _days_inactive(db: DBSession, user_id: int, local_today: date, tz: ZoneInfo) -> int | None:
    last_finished = (
        db.query(func.max(SessionModel.finished_at))
        .filter(SessionModel.user_id == user_id, SessionModel.finished_at.isnot(None))
        .scalar()
    )
    if last_finished is None:
        return None
    last_local_date = last_finished.replace(tzinfo=ZoneInfo("UTC")).astimezone(tz).date()
    days = (local_today - last_local_date).days
    return days if days > 0 else None


def _personal_best(
    db: DBSession, user_id: int, tz: ZoneInfo, *, now: datetime | None = None
) -> int | None:
    """Récord de ejercicios resueltos en un mismo día calendario DEL USUARIO,
    dentro de los últimos `PERSONAL_BEST_WINDOW_DAYS` días.

    Agrupa en Python (no en SQL) porque el día local depende de la tz de cada
    usuario, no es un simple func.date() sobre el timestamp UTC guardado — cerca
    de la medianoche eso desplazaba respuestas al día calendario equivocado. Por
    eso mismo hay que traer las filas: la ventana las acota, así un usuario con
    años de historial no arrastra su tabla de respuestas entera en cada tick. El
    copy lo usa como marca a superar hoy, y una marca de hace dos años no sirve
    para eso."""
    since = (now or datetime.utcnow()) - timedelta(days=PERSONAL_BEST_WINDOW_DAYS)
    rows = (
        db.query(Answer.answered_at)
        .filter(Answer.user_id == user_id, Answer.answered_at >= since)
        .all()
    )
    if not rows:
        return None
    counts: dict[date, int] = {}
    for (answered_at,) in rows:
        local_date = answered_at.replace(tzinfo=ZoneInfo("UTC")).astimezone(tz).date()
        counts[local_date] = counts.get(local_date, 0) + 1
    return max(counts.values())


# ── Due-now resolution (worker-facing) ───────────────────────────────────────────

def _floor_to_15(minute: int) -> int:
    return (minute // 15) * 15


def due_notifications(db: DBSession, force: bool = False) -> list[dict]:
    """
    Return users who should be notified right now, and claim them.

    A user is due when their current local time (in `notify_timezone`) matches
    their chosen `notify_time` slot, they haven't been sent today, and they have
    at least one pending topic. `notify_last_sent_on` is set in the same commit
    (claim-on-read) so an overlapping/retried tick can't double-send.

    `force=True` (testing) bypasses the time/last-sent checks but still requires
    the user to be enabled and have pendings.

    The copy itself (title/body) is decided here too: a per-user context dict is
    built and `notification_copy.choose_variant` picks a category (weighted
    random, excluding the last-sent one) and a variant within it (see
    notification_copy.py for the full pool).

    Armar ese contexto NO es gratis: son ~15 consultas por usuario notificado,
    varias de ellas agregados sobre `answers`. Lo que no depende del usuario (el
    ranking de universidades, los ids por universidad) se calcula una sola vez
    por tick en `_TickCache`; el resto está acotado al usuario o a una ventana
    temporal.
    """
    candidates = (
        db.query(User)
        .filter(User.notify_enabled.is_(True), User.notify_time.isnot(None))
        .all()
    )

    now_utc = datetime.now(tz=ZoneInfo("UTC"))
    cache = _TickCache()
    result: list[dict] = []

    for user in candidates:
        tz_name = user.notify_timezone or "UTC"
        try:
            tz = ZoneInfo(tz_name)
        except ZoneInfoNotFoundError:
            continue

        local_now = now_utc.astimezone(tz)
        local_today = local_now.date()

        if not force:
            slot = f"{local_now.hour:02d}:{_floor_to_15(local_now.minute):02d}"
            if slot != user.notify_time:
                continue
            if user.notify_last_sent_on == local_today:
                continue

        count = pending_topic_count(db, user.id, local_today)
        if count == 0:
            continue

        subs = (
            db.query(PushSubscription)
            .filter(PushSubscription.user_id == user.id)
            .all()
        )
        if not subs:
            continue

        # ── Contexto para el copy (todas las variables del pool) ──────────
        ranking_ctx = _ranking_overtake_context(db, user)

        enrollment = (
            db.query(Enrollment)
            .filter(Enrollment.user_id == user.id, Enrollment.course_id == COURSE_ID)
            .first()
        )
        university = enrollment.university if enrollment and enrollment.university else None

        week_start_utc, _ = _local_day_bounds_utc(local_today - timedelta(days=7), tz)
        xp_this_week = None
        is_top_contributor = False
        social_count = None
        xp_gap_rival = None
        rival_university = None
        xp_gap_defend = None
        defender_university = None
        podium_gap_university = None
        podium_threshold_university = None
        if university is not None:
            xp_this_week = university_weekly_xp(
                db, university, week_start_utc, cache=cache
            )
            is_top_contributor = _is_top_contributor(
                db, user, university, week_start_utc, cache=cache
            )
            social_count = _social_active_today(
                db, user, university, local_today, tz, cache=cache
            )
            xp_gap_rival, rival_university = _rival_university_gap(
                db, university, cache=cache
            )
            xp_gap_defend, defender_university = _defender_university_gap(
                db, university, cache=cache
            )
            podium_gap_university, podium_threshold_university = _podium_gap(
                db, user, university=university, cache=cache
            )

        podium_gap_general, podium_threshold_general = _podium_gap(db, user, cache=cache)

        streak = streak_info(user.streak_days)
        days_to_next_tier = streak.days_to_next if not streak.is_max else None
        next_multiplier = streak.next_multiplier if not streak.is_max else None

        context = {
            "count": count,
            "exercises_yesterday": _exercises_on(
                db, user.id, local_today - timedelta(days=1), tz
            ),
            "days_to_next_tier": days_to_next_tier,
            "next_multiplier": next_multiplier,
            "university": university,
            "xp_this_week": xp_this_week,
            "is_top_contributor": is_top_contributor,
            "xp_gap_rival": xp_gap_rival,
            "rival_university": rival_university,
            "xp_gap_defend": xp_gap_defend,
            "defender_university": defender_university,
            "social_count": social_count,
            "overtaken": ranking_ctx["overtaken"],
            "overtaker_name": ranking_ctx["overtaker_name"],
            "podium_gap_general": podium_gap_general,
            "podium_threshold_general": podium_threshold_general,
            "podium_gap_university": podium_gap_university,
            "podium_threshold_university": podium_threshold_university,
            "days_inactive": _days_inactive(db, user.id, local_today, tz),
            "personal_best": _personal_best(db, user.id, tz),
        }
        category, variant = notification_copy.choose_variant(
            context=context,
            last_category=user.notify_last_category,
            last_variant_key=user.notify_last_variant_key,
        )
        title, body = notification_copy.render(category, variant, context)

        # Claim this send for today (idempotency guard) + rotación.
        user.notify_last_sent_on = local_today
        user.notify_last_category = category
        user.notify_last_variant_key = variant.key

        # Historial append-only (a diferencia de las columnas de arriba, que
        # solo guardan el último estado) para poder analizar después tasas de
        # apertura y efectividad por categoría/variante.
        send = NotificationSend(
            user_id=user.id,
            course_id=COURSE_ID,
            category=category,
            variant_key=variant.key,
            title=title,
            body=body,
        )
        db.add(send)
        db.flush()  # need send.id before building the response below

        result.append(
            {
                "user_id": user.id,
                "pending_count": count,
                "title": title,
                "body": body,
                "notification_id": send.id,
                "subscriptions": [
                    {
                        "id": s.id,
                        "endpoint": s.endpoint,
                        "p256dh": s.p256dh,
                        "auth": s.auth,
                    }
                    for s in subs
                ],
            }
        )

    db.commit()
    return result
