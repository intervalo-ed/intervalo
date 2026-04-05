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
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from session_store import create_session, record_answer, get_summary, get_session, get_user_progress_db
from database import SessionLocal, init_db
from auth import (
    get_google_oauth_url,
    authenticate_with_google,
    create_guest_user,
    verify_token,
    TokenPayload,
    UserResponse,
)
from models import User

app = FastAPI(title="Intervalo Backend")

# Initialize database on startup
init_db()


@app.on_event("startup")
def startup_event():
    """Create default course if it doesn't exist."""
    from models import Course

    db = SessionLocal()
    try:
        # Check if default course exists
        course = db.query(Course).filter(Course.slug == "analisis-1").first()
        if not course:
            default_course = Course(
                slug="analisis-1",
                name="Análisis Matemático I",
                description="Sistema de repaso adaptativo para Análisis Matemático I",
            )
            db.add(default_course)
            db.commit()
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
    """Get current authenticated user from JWT token."""
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header missing")

    # Extract token from "Bearer <token>"
    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise ValueError()
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid authorization header")

    # Verify token
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    # Get user from database
    user = db.query(User).filter(User.id == payload.user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return user


# ── Pydantic models ───────────────────────────────────────────────────────────

class StartSessionRequest(BaseModel):
    user_name: str


class AnswerRequest(BaseModel):
    session_id: str
    exercise_id: str
    answer_index: int
    response_time_s: float


# ── Endpoints ─────────────────────────────────────────────────────────────────

# ── Health check ──────────────────────────────────────────────────────────────

@app.get("/health")
def health_check():
    return {"status": "ok"}


# ── Authentication ────────────────────────────────────────────────────────────

class GuestRequest(BaseModel):
    name: str


@app.post("/auth/guest")
def auth_guest(body: GuestRequest, db: Session = Depends(get_db)):
    """Create anonymous guest user and return JWT."""
    result = create_guest_user(db, body.name)
    return {"access_token": result.access_token, "name": result.name}


@app.get("/auth/google")
def auth_google(link: int = None):
    """Redirect to Google OAuth consent screen. Pass link=<user_id> to merge with anonymous user."""
    from urllib.parse import urlencode
    url = get_google_oauth_url()
    if link:
        url += f"&state={link}"
    return RedirectResponse(url=url)


@app.get("/auth/google/callback")
async def auth_google_callback(
    code: str,
    state: str = None,
    db: Session = Depends(get_db)
):
    """Handle Google OAuth callback and redirect to frontend with token."""
    try:
        link_user_id = int(state) if state else None
        result = await authenticate_with_google(code, db, link_user_id=link_user_id)
        # Redirect to frontend with token in URL
        frontend_url = ALLOWED_ORIGINS[0] if ALLOWED_ORIGINS else "http://localhost:5173"
        return RedirectResponse(
            url=f"{frontend_url}?token={result.access_token}&name={result.name}",
            status_code=302
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Authentication failed: {str(e)}")


@app.get("/auth/me", response_model=UserResponse)
def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """Get current authenticated user info."""
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        name=current_user.display_name or current_user.name,
        google_id=current_user.google_id,
    )


# ── User enrollment ───────────────────────────────────────────────────────────

class EnrollmentRequest(BaseModel):
    university: str
    career: str
    name: str | None = None


@app.post("/user/enroll")
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


@app.get("/user/progress")
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

@app.post("/session/start")
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


@app.get("/session/{session_id}/summary")
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
