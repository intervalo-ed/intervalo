import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from session_store import create_session, record_answer, get_summary, get_session
from database import SessionLocal, init_db
from auth import (
    get_google_oauth_url,
    authenticate_with_google,
    verify_token,
    TokenPayload,
    UserResponse,
)
from models import User

app = FastAPI(title="Intervalo Backend")

# Initialize database on startup
init_db()

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

@app.get("/auth/google")
def auth_google():
    """Redirect to Google OAuth consent screen."""
    return RedirectResponse(url=get_google_oauth_url())


@app.get("/auth/google/callback")
async def auth_google_callback(
    code: str,
    db: Session = Depends(get_db)
):
    """Handle Google OAuth callback."""
    try:
        result = await authenticate_with_google(code, db)
        return result
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
        name=current_user.name,
        google_id=current_user.google_id,
    )


# ── Session endpoints ─────────────────────────────────────────────────────────

@app.post("/session/start")
def start_session(body: StartSessionRequest):
    state = create_session(body.user_name)
    exercises = [
        {
            "id": ex.exercise_id,
            "question": ex.question,
            "options": ex.options,
            "correct_index": ex.correct_index,
            "has_math": ex.has_math,
            "skill": ex.item_key.skill.value,
            "graph_fn": ex.graph_fn,
            "graph_view": ex.graph_view,
            "feedback_correct": ex.feedback_correct,
            "feedback_incorrect": ex.feedback_incorrect,
        }
        for ex in state.exercises
    ]
    return {
        "session_id": state.session_id,
        "user_name": state.user_name,
        "total": len(exercises),
        "exercises": exercises,
    }


@app.post("/session/answer")
def submit_answer(body: AnswerRequest):
    try:
        result = record_answer(
            body.session_id,
            body.exercise_id,
            body.answer_index,
            body.response_time_s,
        )
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    return result


@app.get("/session/{session_id}/summary")
def session_summary(session_id: str):
    try:
        return get_summary(session_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
