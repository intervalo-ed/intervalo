import os
import re
import sys
from pathlib import Path
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from dotenv import load_dotenv

# Load environment variables from .env file
env_path = Path(__file__).parent / ".env"
load_dotenv(env_path)

sys.path.insert(0, str(Path(__file__).parent.parent))

from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session

from session_store import get_user_progress_db
from database import SessionLocal
from auth import (
    UserResponse,
    get_or_create_user_from_clerk,
    verify_clerk_token,
)
from models import User, BeltInfo, Enrollment, Answer
from sqlalchemy import func
from schemas import (
    AnswerResponse,
    BeltEntry,
    DueNotification,
    EnrollmentResponse,
    HealthResponse,
    LeaderboardEntry,
    LeaderboardResponse,
    NotificationSettings,
    SessionStartResponse,
    SessionSummaryResponse,
    SimpleResponse,
    UserProgressResponse,
    UserStatusResponse,
)

app = FastAPI(title="Intervalo Backend")


@app.on_event("startup")
def startup_event():
    """
    Seed course content from backend/content/ on every startup.

    Idempotent upsert — safe to run on each deploy. Alembic handles schema;
    this only touches editable content (courses, belt_info, exercises).
    """
    from seed_content import seed_all

    db = SessionLocal()
    try:
        seed_all(db)
    finally:
        db.close()

ALLOWED_ORIGINS = os.environ.get("ALLOWED_ORIGINS", "http://localhost:5173").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Dependency functions ──────────────────────────────────────────────────────

def get_db():
    """Get database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(
    authorization: str = Header(None),
    db: Session = Depends(get_db)
) -> User:
    """
    Resolve the authenticated user from a Clerk session JWT.

    Clerk issues the token on the frontend; we verify the signature against
    Clerk's JWKS and JIT-provision a local `User` row on first sight.
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header missing")

    # Extract token from "Bearer <token>"
    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise ValueError()
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid authorization header")

    try:
        claims = verify_clerk_token(token)
    except RuntimeError as exc:
        # Missing CLERK_* env vars — server misconfiguration, not a client error.
        raise HTTPException(status_code=503, detail=str(exc))

    if not claims:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    try:
        return get_or_create_user_from_clerk(db, claims)
    except ValueError as exc:
        # e.g. Clerk token has no email and no secret key is configured
        raise HTTPException(status_code=401, detail=str(exc))


def require_internal_secret(x_internal_secret: str = Header(None)):
    """Guard for worker-facing endpoints — a shared secret, not Clerk."""
    expected = os.environ.get("INTERNAL_API_SECRET")
    if not expected:
        raise HTTPException(status_code=503, detail="INTERNAL_API_SECRET not configured")
    if x_internal_secret != expected:
        raise HTTPException(status_code=401, detail="Invalid internal secret")


# ── Pydantic models ───────────────────────────────────────────────────────────

class StartSessionRequest(BaseModel):
    user_name: str


class StartZenSessionRequest(BaseModel):
    user_name: str
    belt: str
    topics: list[str]
    count: int


class AnswerRequest(BaseModel):
    session_id: str
    exercise_id: str
    answer_index: int
    attempts: int
    response_time_s: float


class PushKeys(BaseModel):
    p256dh: str
    auth: str


class PushSubscribeRequest(BaseModel):
    endpoint: str
    keys: PushKeys


class PushUnsubscribeRequest(BaseModel):
    endpoint: str


class NotificationSettingsRequest(BaseModel):
    enabled: bool
    time: str | None = None
    timezone: str | None = None


class PrunePushRequest(BaseModel):
    subscription_ids: list[int]


# ── Endpoints ─────────────────────────────────────────────────────────────────

# ── Health check ──────────────────────────────────────────────────────────────

@app.get("/health", response_model=HealthResponse)
def health_check():
    return {"status": "ok"}


# ── Course info ───────────────────────────────────────────────────────────────

@app.get("/course/{course_id}/belts", response_model=dict[str, BeltEntry])
def get_belt_info(course_id: int, db: Session = Depends(get_db)):
    """Returns descriptive info (headline + description) for each belt in a course."""
    rows = db.query(BeltInfo).filter(BeltInfo.course_id == course_id).all()
    return {
        row.belt: {"headline": row.headline, "description": row.description}
        for row in rows
    }


# ── Authentication ────────────────────────────────────────────────────────────
#
# Sign-in / sign-up is handled by Clerk on the frontend. The backend only
# verifies the resulting session JWT (see `get_current_user` above) and
# surfaces the current user via `/auth/me`. No OAuth redirects live here
# anymore.

@app.get("/auth/me", response_model=UserResponse)
def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """Get current authenticated user info."""
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        name=current_user.display_name or current_user.name,
        username=current_user.username,
        display_name=current_user.display_name,
        clerk_user_id=current_user.clerk_user_id,
    )


class UpdateProfileRequest(BaseModel):
    username: str | None = None
    display_name: str | None = None


@app.patch("/user/profile", response_model=UserResponse)
def update_profile(
    body: UpdateProfileRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update the user's handle (username) and/or display name (apodo)."""
    from usernames import normalize_username, validate_username

    if body.username is not None:
        candidate = normalize_username(body.username)
        ok, reason = validate_username(candidate)
        if not ok:
            raise HTTPException(status_code=422, detail=reason)
        taken = (
            db.query(User.id)
            .filter(User.username == candidate, User.id != current_user.id)
            .first()
        )
        if taken:
            raise HTTPException(status_code=409, detail="Ese usuario ya está en uso.")
        current_user.username = candidate

    if body.display_name is not None:
        current_user.display_name = body.display_name.strip() or None

    db.commit()
    db.refresh(current_user)

    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        name=current_user.display_name or current_user.name,
        username=current_user.username,
        display_name=current_user.display_name,
        clerk_user_id=current_user.clerk_user_id,
    )


# ── User enrollment ───────────────────────────────────────────────────────────

class EnrollmentRequest(BaseModel):
    university: str
    career: str
    name: str | None = None


@app.post("/user/enroll", response_model=EnrollmentResponse)
def enroll_user(
    body: EnrollmentRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Enroll user in a course with onboarding data."""
    from models import Enrollment, Course

    # Default course_id to 1 for now (analisis-1)
    course_id = 1

    # Check if course exists
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=400, detail="Course not found")

    # Check if already enrolled
    existing = db.query(Enrollment).filter(
        Enrollment.user_id == current_user.id,
        Enrollment.course_id == course_id,
    ).first()

    if existing:
        # Update enrollment
        existing.university = body.university
        existing.career = body.career
    else:
        # Create new enrollment
        enrollment = Enrollment(
            user_id=current_user.id,
            course_id=course_id,
            university=body.university,
            career=body.career,
        )
        db.add(enrollment)

    # Save display name from tutorial
    if body.name:
        current_user.display_name = body.name

    db.commit()

    return {
        "success": True,
        "message": "Enrollment successful",
    }


@app.get("/user/status", response_model=UserStatusResponse)
def get_user_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Authoritative new-vs-returning check, read from the DB.

    A returning user has an enrollment and/or learning state, regardless of
    what their Clerk `onboarded` metadata says. The frontend uses this to
    decide whether to run onboarding or send the user straight to the dashboard.
    """
    from models import Enrollment, UnitState

    course_id = 1  # Default course

    enrolled = db.query(Enrollment.id).filter(
        Enrollment.user_id == current_user.id,
        Enrollment.course_id == course_id,
    ).first() is not None

    has_progress = db.query(UnitState.id).filter(
        UnitState.user_id == current_user.id,
        UnitState.course_id == course_id,
    ).first() is not None

    return UserStatusResponse(enrolled=enrolled, has_progress=has_progress)


@app.get("/user/progress", response_model=UserProgressResponse)
def get_user_progress(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's current progress (topic states and level info)."""
    try:
        course_id = 1  # Default course
        return get_user_progress_db(current_user.id, course_id, db)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Push notifications ──────────────────────────────────────────────────────────

@app.post("/push/subscribe", response_model=SimpleResponse)
def push_subscribe(
    body: PushSubscribeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Store a browser PushSubscription for the current user."""
    import push_store

    push_store.upsert_subscription(
        db, current_user.id, body.endpoint, body.keys.p256dh, body.keys.auth
    )
    return {"success": True}


@app.delete("/push/subscribe", response_model=SimpleResponse)
def push_unsubscribe(
    body: PushUnsubscribeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Remove a browser PushSubscription (called when the user unsubscribes)."""
    import push_store

    push_store.delete_subscription(db, current_user.id, body.endpoint)
    return {"success": True}


@app.get("/user/notification-settings", response_model=NotificationSettings)
def get_notification_settings(
    current_user: User = Depends(get_current_user),
):
    import push_store

    return push_store.get_settings(current_user)


_TIME_RE = re.compile(r"^([01]\d|2[0-3]):(00|15|30|45)$")


@app.put("/user/notification-settings", response_model=NotificationSettings)
def put_notification_settings(
    body: NotificationSettingsRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    import push_store

    if body.enabled:
        if not body.time or not _TIME_RE.match(body.time):
            raise HTTPException(status_code=400, detail="time must be HH:MM in 15-min steps")
        if not body.timezone:
            raise HTTPException(status_code=400, detail="timezone is required")
        try:
            ZoneInfo(body.timezone)
        except ZoneInfoNotFoundError:
            raise HTTPException(status_code=400, detail="invalid timezone")

    return push_store.save_settings(
        db, current_user, body.enabled, body.time, body.timezone
    )


@app.get(
    "/internal/notifications/due",
    response_model=list[DueNotification],
    dependencies=[Depends(require_internal_secret)],
)
def internal_due_notifications(
    force: bool = False,
    db: Session = Depends(get_db),
):
    """Worker-facing: users to notify right now (claims them in-transaction)."""
    import push_store

    return push_store.due_notifications(db, force=force)


@app.post(
    "/internal/push/prune",
    response_model=SimpleResponse,
    dependencies=[Depends(require_internal_secret)],
)
def internal_prune_push(
    body: PrunePushRequest,
    db: Session = Depends(get_db),
):
    """Worker-facing: drop subscriptions that returned 404/410."""
    import push_store

    push_store.delete_subscriptions_by_id(db, body.subscription_ids)
    return {"success": True}


# ── Leaderboard ───────────────────────────────────────────────────────────────

@app.get("/leaderboard", response_model=LeaderboardResponse)
def get_leaderboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Global leaderboard, ranked by total XP descending."""
    users = (
        db.query(User)
        .order_by(User.total_xp.desc(), User.id.asc())
        .all()
    )

    # Career + university come from the user's enrollment (course 1 for now).
    enrollments = {
        e.user_id: e
        for e in db.query(Enrollment).filter(Enrollment.course_id == 1).all()
    }

    total_xp_all = int(db.query(func.coalesce(func.sum(User.total_xp), 0)).scalar())
    total_exercises_all = int(db.query(func.count(Answer.id)).scalar())

    entries = [
        LeaderboardEntry(
            rank=index + 1,
            user_id=user.id,
            name=user.username or user.display_name or user.name,
            username=user.username,
            total_xp=user.total_xp,
            is_current_user=user.id == current_user.id,
            career=enrollments[user.id].career if user.id in enrollments else None,
            university=(
                enrollments[user.id].university if user.id in enrollments else None
            ),
        )
        for index, user in enumerate(users)
    ]
    return LeaderboardResponse(
        entries=entries,
        total_xp=total_xp_all,
        total_exercises=total_exercises_all,
    )


# ── Session endpoints ─────────────────────────────────────────────────────────

@app.post("/session/start", response_model=SessionStartResponse)
def start_session(
    body: StartSessionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Start a new session linked to authenticated user in database."""
    from session_store import create_session_db, DailySessionLimitError

    # Default course_id to 1 for now (analyze-1)
    course_id = 1

    try:
        result = create_session_db(current_user.id, course_id, db)
    except DailySessionLimitError as exc:
        raise HTTPException(status_code=409, detail=str(exc))

    return result


@app.post("/session/start-zen")
def start_zen_session(
    body: StartZenSessionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Start a Zen session: random exercises from selected topics of one unit, no SM-2 logic."""
    from session_store import create_zen_session_db

    if not body.topics:
        raise HTTPException(status_code=400, detail="Seleccioná al menos un tema.")
    if body.count < 1:
        raise HTTPException(status_code=400, detail="El número de ejercicios debe ser al menos 1.")
    try:
        return create_zen_session_db(
            user_id=current_user.id, course_id=1,
            belt=body.belt, topics=body.topics, count=body.count, db=db,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/session/answer")
def submit_answer(
    body: AnswerRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Submit answer for exercise - validates ownership and saves to DB."""
    from session_store import record_answer_db

    try:
        # Parse session_id as integer (it's stored as string in frontend but is DB ID)
        session_id_db = int(body.session_id)
        course_id = 1  # Default for now

        result = record_answer_db(
            session_id_db,
            current_user.id,
            course_id,
            body.exercise_id,
            body.answer_index,
            body.attempts,
            body.response_time_s,
            db,
        )
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid session_id format")

    return result


@app.get("/session/{session_id}/summary", response_model=SessionSummaryResponse)
def session_summary(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get session summary from database - validates ownership."""
    from session_store import get_summary_db

    try:
        session_id_db = int(session_id)
        return get_summary_db(session_id_db, current_user.id, db)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid session_id format")
