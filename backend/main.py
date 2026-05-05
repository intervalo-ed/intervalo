import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env file
env_path = Path(__file__).parent / ".env"
load_dotenv(env_path)

sys.path.insert(0, str(Path(__file__).parent.parent))

from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session

from session_store import create_session, record_answer, get_summary, get_session, get_user_progress_db
from database import SessionLocal
from auth import (
    UserResponse,
    get_or_create_user_from_clerk,
    verify_clerk_token,
)
from models import User, BeltInfo
from schemas import (
    AnswerResponse,
    BeltEntry,
    EnrollmentResponse,
    HealthResponse,
    SessionStartResponse,
    SessionSummaryResponse,
    UserProgressResponse,
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


# ── Pydantic models ───────────────────────────────────────────────────────────

class StartSessionRequest(BaseModel):
    user_name: str


class StartZenSessionRequest(BaseModel):
    user_name: str
    belts: list[str]
    count: int


class AnswerRequest(BaseModel):
    session_id: str
    exercise_id: str
    answer_index: int
    response_time_s: float


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


@app.get("/user/progress", response_model=UserProgressResponse)
def get_user_progress(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's current progress (skill states and level info)."""
    try:
        course_id = 1  # Default course
        result = get_user_progress_db(current_user.id, course_id, db)
        # Debug: check first item
        skill_states = result.get('skill_states', {})
        if skill_states:
            first_item = list(skill_states.values())[0]
            print(f"DEBUG ENDPOINT: progress={first_item.get('progress')}, status={first_item.get('status')}")
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Session endpoints ─────────────────────────────────────────────────────────

@app.post("/session/start", response_model=SessionStartResponse)
def start_session(
    body: StartSessionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Start a new session linked to authenticated user in database."""
    from session_store import create_session_db

    # Default course_id to 1 for now (analyze-1)
    course_id = 1

    # Create session in database
    result = create_session_db(current_user.id, course_id, db)

    return result


@app.post("/session/start-zen")
def start_zen_session(
    body: StartZenSessionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Start a Zen session: random exercises from selected belts, no SM-2 logic."""
    from session_store import create_zen_session_db

    if not body.belts:
        raise HTTPException(status_code=400, detail="Seleccioná al menos un cinturón.")
    if body.count < 1:
        raise HTTPException(status_code=400, detail="El número de ejercicios debe ser al menos 1.")
    try:
        return create_zen_session_db(
            user_id=current_user.id, course_id=1,
            belts=body.belts, count=body.count, db=db,
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
