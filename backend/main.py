import json
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

from fastapi import FastAPI, HTTPException, Depends, Header, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session

import emoji_tree
from session_store import get_user_progress_db
from database import SessionLocal
from auth import (
    UserResponse,
    get_or_create_user_from_clerk,
    verify_clerk_token,
)
from models import User, BeltInfo, Enrollment, Answer, UnitState
from sqlalchemy import func
from schemas import (
    AnswerResponse,
    BeltEntry,
    DueNotification,
    EmojiStateResponse,
    EnrollmentResponse,
    FeedbackRequest,
    HealthResponse,
    LeaderboardEntry,
    LeaderboardMe,
    LeaderboardResponse,
    NotificationSettings,
    SessionStartResponse,
    SessionSummaryResponse,
    SimpleResponse,
    UniversityLeaderboardResponse,
    UniversityRankRow,
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


class TestSessionItem(BaseModel):
    belt: str
    topic: str
    exercise_type: str


class StartTestSessionRequest(BaseModel):
    items: list[TestSessionItem]


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
    """Returns descriptive info (headline + description) for each belt in a course.

    DEPRECATED: usar `GET /course/{course_id}/structure`, que devuelve la jerarquía
    completa (belts→units→topics→skills). Se mantiene por compatibilidad."""
    rows = db.query(BeltInfo).filter(BeltInfo.course_id == course_id).all()
    return {
        row.belt: {"headline": row.headline, "description": row.description}
        for row in rows
    }


@app.get("/course/{course_id}/structure")
def get_course_structure(course_id: int, db: Session = Depends(get_db)):
    """Estructura completa del curso desde course.json: la jerarquía
    curso → cinturón → unidades → temas → skills, más los exercise_types.

    Fuente única de estructura (config-driven); el frontend genera su catálogo a
    partir de este mismo archivo."""
    from models import Course
    from algorithm import load_course_structure

    course = db.query(Course).filter(Course.id == course_id).first()
    if course is None:
        raise HTTPException(status_code=404, detail="Curso no encontrado")
    try:
        return load_course_structure(course.slug)
    except FileNotFoundError:
        raise HTTPException(
            status_code=404,
            detail=f"course.json no encontrado para '{course.slug}'",
        )


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
    # Resultado del ejercicio de prueba del onboarding (white/definition/LEXI).
    # True = acertó al primer intento, False = falló alguna vez, None = sin dato.
    intro_item_correct: bool | None = None


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

    # Solo en una alta nueva: persistir el resultado del ejercicio de prueba del
    # onboarding sobre el ítem white/definition/LEXI (acierto → mañana, fuera de
    # la 1ª sesión; fallo → hoy, dentro). En re-enrollment no se toca el progreso.
    if not existing and body.intro_item_correct is not None:
        from session_store import seed_intro_item
        seed_intro_item(current_user.id, course_id, body.intro_item_correct, db)

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
    tz: str | None = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's current progress (topic states and level info).

    `tz` es la zona horaria IANA del navegador; si es válida, la persistimos en el
    usuario para que el "día" de la repetición espaciada use su zona, no la del
    servidor (UTC). El home llama a este endpoint en cada carga, así queda fresca.
    """
    if tz and tz != current_user.timezone:
        try:
            ZoneInfo(tz)
        except ZoneInfoNotFoundError:
            pass
        else:
            current_user.timezone = tz
            db.commit()
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

# Filas a cada lado del usuario en la ventana centrada (`around_me`).
AROUND_WINDOW = 30

# Orden de cinturones para calcular el máximo del usuario. Una fila UnitState
# existe sólo cuando el cinturón está desbloqueado, así que el cinturón con
# mayor rank entre las filas del usuario es su máximo (en cualquier curso).
BELT_RANK = {"white": 0, "blue": 1, "violet": 2, "brown": 3}


@app.get("/leaderboard", response_model=LeaderboardResponse)
def get_leaderboard(
    university: str | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    around_me: bool = Query(default=False),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Leaderboard ranked by total XP descending, paginado (offset/limit).

    El ranking, los totales y los datos del usuario actual se calculan sobre el
    set completo del scope (global o filtrado por universidad); solo `entries`
    devuelve la página pedida para el scroll infinito.

    Con `around_me=true` se ignoran `offset`/`limit` y se devuelve una ventana
    centrada en el usuario actual (`AROUND_WINDOW` filas a cada lado), para que
    el front cargue el ranking con el usuario en el medio y scrollee hacia ambos
    lados. Cada entry trae su `rank` absoluto, así el front conoce los bordes de
    la ventana y pide más arriba/abajo por offset.
    """
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

    # Ejercicios hechos por usuario, para poder filtrar el total por universidad.
    exercises_by_user = dict(
        db.query(Answer.user_id, func.count(Answer.id)).group_by(Answer.user_id).all()
    )

    # Máximo cinturón desbloqueado por usuario (en cualquier curso): el de mayor
    # rank entre las filas UnitState. Por defecto, blanco.
    max_belt_by_user: dict[int, str] = {}
    for uid, belt in db.query(UnitState.user_id, UnitState.belt).distinct().all():
        if BELT_RANK.get(belt, -1) > BELT_RANK.get(max_belt_by_user.get(uid, ""), -1):
            max_belt_by_user[uid] = belt

    def uni_of(user: User) -> str | None:
        e = enrollments.get(user.id)
        return e.university if e else None

    # Universidades presentes (set completo), para poblar el filtro.
    universities = sorted({u for user in users if (u := uni_of(user)) is not None})

    # Scope: todos o solo los de la universidad elegida. El orden ya viene por XP.
    scoped = (
        users if university is None
        else [user for user in users if uni_of(user) == university]
    )

    total_count = len(scoped)
    total_xp = sum(user.total_xp for user in scoped)
    total_exercises = sum(int(exercises_by_user.get(user.id, 0)) for user in scoped)

    # Usuario actual dentro del scope: rank (1-based) y XP para alcanzar al de
    # arriba.
    me = LeaderboardMe(total_xp=current_user.total_xp)
    for index, user in enumerate(scoped):
        if user.id == current_user.id:
            me.rank = index + 1
            if index > 0:
                me.xp_to_next = scoped[index - 1].total_xp - user.total_xp
            break

    # Ventana de la página. En modo `around_me` se centra en el usuario actual.
    if around_me:
        my_index = next(
            (i for i, user in enumerate(scoped) if user.id == current_user.id),
            None,
        )
        if my_index is None:
            page_offset = 0
            page_end = limit
        else:
            page_offset = max(0, my_index - AROUND_WINDOW)
            page_end = my_index + AROUND_WINDOW + 1
    else:
        page_offset = offset
        page_end = offset + limit

    page = scoped[page_offset:page_end]
    entries = [
        LeaderboardEntry(
            rank=page_offset + index + 1,
            user_id=user.id,
            name=user.username or user.display_name or user.name,
            username=user.username,
            total_xp=user.total_xp,
            exercises=int(exercises_by_user.get(user.id, 0)),
            is_current_user=user.id == current_user.id,
            career=enrollments[user.id].career if user.id in enrollments else None,
            university=uni_of(user),
            emoji=emoji_tree.emoji_for(user.emoji_worn),
            belt=max_belt_by_user.get(user.id, "white"),
        )
        for index, user in enumerate(page)
    ]
    return LeaderboardResponse(
        entries=entries,
        total_xp=total_xp,
        total_exercises=total_exercises,
        total_count=total_count,
        has_more=page_offset + len(page) < total_count,
        me=me,
        universities=universities,
    )


# Carreras conocidas; cualquier otro valor (o null) cae en "Otra".
CAREER_BUCKETS = ["E", "S", "T", "M", "Otra"]


@app.get("/leaderboard/universities", response_model=UniversityLeaderboardResponse)
def get_university_leaderboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Ranking de universidades: agrega estudiantes por universidad y carrera.

    A diferencia del leaderboard individual (paginado, ventana alrededor del
    usuario), acá se recorre el set completo una vez y se agregan los totales
    por universidad, así el front puede comparar universidades entre sí.
    """
    users = db.query(User).all()
    enrollments = {
        e.user_id: e
        for e in db.query(Enrollment).filter(Enrollment.course_id == 1).all()
    }

    def bucket(career: str | None) -> str:
        return career if career in CAREER_BUCKETS and career != "Otra" else "Otra"

    # Agregación por universidad + agregado global por carrera.
    by_uni: dict[str, dict] = {}
    career_totals = {c: 0 for c in CAREER_BUCKETS}
    total_students = 0
    for user in users:
        e = enrollments.get(user.id)
        uni = e.university if e else None
        if not uni:
            continue
        total_students += 1
        b = bucket(e.career if e else None)
        career_totals[b] += 1
        agg = by_uni.setdefault(
            uni,
            {"total_xp": 0, "students": 0, "careers": {c: 0 for c in CAREER_BUCKETS}},
        )
        agg["total_xp"] += user.total_xp
        agg["students"] += 1
        agg["careers"][b] += 1

    rows = [
        UniversityRankRow(
            university=uni,
            total_xp=agg["total_xp"],
            students=agg["students"],
            careers=agg["careers"],
        )
        for uni, agg in by_uni.items()
    ]
    # El ranking de universidades es por XP acumulado (estudiantes como
    # desempate secundario).
    rows.sort(key=lambda r: (r.total_xp, r.students), reverse=True)

    return UniversityLeaderboardResponse(
        rows=rows,
        total_students=total_students,
        total_universities=len(by_uni),
        career_totals=career_totals,
    )


# ── Emoji unlock tree (badges) ──────────────────────────────────────────────────

def _emoji_bucket(db: Session, user: User) -> str | None:
    """Bucket de carrera del usuario (E/S/T/M/Otra), de su enrollment (curso 1)."""
    e = (
        db.query(Enrollment)
        .filter(Enrollment.user_id == user.id, Enrollment.course_id == 1)
        .first()
    )
    return e.career if e else None


def _emoji_path(user: User) -> list[str]:
    """Camino desbloqueado del usuario (lista de ids), parseado del JSON-en-texto."""
    if not user.emoji_path:
        return []
    try:
        value = json.loads(user.emoji_path)
    except (json.JSONDecodeError, TypeError):
        return []
    return value if isinstance(value, list) else []


def _emoji_state(db: Session, user: User) -> EmojiStateResponse:
    return EmojiStateResponse(
        bucket=_emoji_bucket(db, user),
        total_xp=user.total_xp,
        path=_emoji_path(user),
        worn=user.emoji_worn,
    )


@app.get("/user/emoji-tree", response_model=EmojiStateResponse)
def get_emoji_state(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Estado del árbol de desbloqueo del usuario (bucket, XP, camino, vestido)."""
    return _emoji_state(db, current_user)


class EmojiUnlockRequest(BaseModel):
    node_id: str


@app.post("/user/emoji/unlock", response_model=EmojiStateResponse)
def unlock_emoji(
    body: EmojiUnlockRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Desbloquea el siguiente nodo del camino (irreversible, sin reset)."""
    bucket = _emoji_bucket(db, current_user)
    path = _emoji_path(current_user)
    ok, reason = emoji_tree.can_unlock(path, body.node_id, current_user.total_xp, bucket)
    if not ok:
        raise HTTPException(status_code=422, detail=reason)

    path.append(body.node_id)
    current_user.emoji_path = json.dumps(path)
    db.commit()
    db.refresh(current_user)
    return _emoji_state(db, current_user)


class EmojiWornRequest(BaseModel):
    node_id: str | None = None


@app.put("/user/emoji/worn", response_model=EmojiStateResponse)
def set_worn_emoji(
    body: EmojiWornRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Viste un emoji ya desbloqueado del camino. None = raíz del bucket (default)."""
    bucket = _emoji_bucket(db, current_user)
    path = _emoji_path(current_user)
    ok, reason = emoji_tree.can_wear(path, body.node_id, bucket)
    if not ok:
        raise HTTPException(status_code=422, detail=reason)

    current_user.emoji_worn = emoji_tree.normalize_worn(body.node_id, bucket)
    db.commit()
    db.refresh(current_user)
    return _emoji_state(db, current_user)


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


@app.post("/session/start-test")
def start_test_session(
    body: StartTestSessionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Start a QA/test session: ALL exercises in each selected item, no SR logic."""
    from session_store import create_test_session_db

    if not body.items:
        raise HTTPException(status_code=400, detail="Seleccioná al menos un item.")
    try:
        return create_test_session_db(
            user_id=current_user.id, course_id=1,
            items=[i.model_dump() for i in body.items], db=db,
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


# ── Feedback ──────────────────────────────────────────────────────────────────

def _send_feedback_email(categoria: str, user_id: int, mensaje: str) -> None:
    """Notify via Resend. Best-effort: logs and swallows any failure so the
    user's request never blocks on the email provider."""
    import logging

    api_key = os.environ.get("RESEND_API_KEY")
    if not api_key:
        logging.warning("RESEND_API_KEY not set — skipping feedback email")
        return

    to_email = os.environ.get("FEEDBACK_TO_EMAIL", "nvrancovich@gmail.com")
    from_email = os.environ.get("FEEDBACK_FROM_EMAIL", "onboarding@resend.dev")

    try:
        import resend

        resend.api_key = api_key
        resend.Emails.send({
            "from": from_email,
            "to": to_email,
            "subject": f"[{categoria}] Feedback de usuario {user_id}",
            "text": f"Categoría: {categoria}\nUsuario: {user_id}\n\n{mensaje}",
        })
    except Exception:
        logging.exception("Failed to send feedback email via Resend")


@app.post("/feedback", response_model=SimpleResponse)
def submit_feedback(
    body: FeedbackRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Save user feedback and notify via email. user_id comes from the token.

    The email is best-effort — if Resend fails we still return success so the
    user isn't blocked by a provider outage.
    """
    from models import Feedback

    mensaje = body.mensaje.strip()
    if not mensaje:
        raise HTTPException(status_code=422, detail="El mensaje no puede estar vacío.")

    entry = Feedback(
        user_id=current_user.id,
        categoria=body.categoria,
        mensaje=mensaje,
    )
    db.add(entry)
    db.commit()

    _send_feedback_email(body.categoria, current_user.id, mensaje)

    return {"success": True}
