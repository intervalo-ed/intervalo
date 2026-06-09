"""
push_store.py — Web Push subscriptions + daily-notification preferences.

The frontend stores a browser PushSubscription and a per-user notification
preference (enabled + time + timezone). A separate worker polls
`due_notifications` every 15 min and sends the actual pushes — this module
holds all the data access for both sides.
"""

from __future__ import annotations

from datetime import date, datetime
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from sqlalchemy.orm import Session as DBSession

from models import PushSubscription, UnitState, User

COURSE_ID = 1  # Single-course app for now (matches the rest of the backend).


# ── Subscriptions ──────────────────────────────────────────────────────────────

def upsert_subscription(
    db: DBSession, user_id: int, endpoint: str, p256dh: str, auth: str
) -> None:
    """Store (or refresh) a browser push subscription, keyed by (user, endpoint)."""
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
    """
    candidates = (
        db.query(User)
        .filter(User.notify_enabled.is_(True), User.notify_time.isnot(None))
        .all()
    )

    now_utc = datetime.now(tz=ZoneInfo("UTC"))
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

        # Claim this send for today (idempotency guard).
        user.notify_last_sent_on = local_today

        result.append(
            {
                "user_id": user.id,
                "pending_count": count,
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
