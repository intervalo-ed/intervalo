import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from session_store import create_session, record_answer, get_summary, get_session

app = FastAPI(title="Intervalo Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Pydantic models ───────────────────────────────────────────────────────────

class StartSessionRequest(BaseModel):
    user_name: str


class AnswerRequest(BaseModel):
    session_id: str
    exercise_id: str
    answer_index: int
    response_time_s: float


# ── Endpoints ─────────────────────────────────────────────────────────────────

@app.get("/health")
def health_check():
    return {"status": "ok"}


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
