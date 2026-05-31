"""
app.py — Server local del Content Studio (FastAPI).

Solo para uso local: bindea a 127.0.0.1:8077. Lee/escribe los JSON de
contenido del curso y hace de proxy a OpenRouter. NO forma parte del build de
producción.

Correr:
    cd studio/server
    pip install -r requirements.txt
    uvicorn app:app --reload --host 127.0.0.1 --port 8077
"""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import ai
import content_io as cio

app = FastAPI(title="Intervalo Content Studio", docs_url="/api/docs")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5174", "http://127.0.0.1:5174"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def _guard(fn):
    """Convierte ContentError en 400 con mensaje legible."""
    try:
        return fn()
    except cio.ContentError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ── Lectura ─────────────────────────────────────────────────────────────────

@app.get("/api/catalog")
def get_catalog(course: str = cio.DEFAULT_COURSE):
    return _guard(lambda: cio.read_catalog(course))


@app.get("/api/course")
def get_course(course: str = cio.DEFAULT_COURSE):
    return _guard(lambda: cio.read_course(course))


@app.get("/api/exercises")
def get_exercises(
    belt: str = Query(...),
    topic: str = Query(...),
    course: str = cio.DEFAULT_COURSE,
):
    return _guard(lambda: cio.read_exercises(belt, topic, course))


@app.get("/api/stats")
def get_stats(course: str = cio.DEFAULT_COURSE):
    return _guard(lambda: cio.compute_stats(course))


@app.get("/api/next-id")
def get_next_id(
    belt: str = Query(...),
    topic: str = Query(...),
    skill: str = Query(...),
    course: str = cio.DEFAULT_COURSE,
):
    return {"external_id": _guard(lambda: cio.next_external_id(belt, topic, skill, course))}


# ── Escritura ─────────────────────────────────────────────────────────────

class ExercisesBody(BaseModel):
    belt: str
    topic: str
    exercises: list[dict]
    course: str = cio.DEFAULT_COURSE


@app.put("/api/exercises")
def put_exercises(body: ExercisesBody):
    saved = _guard(
        lambda: cio.write_exercises(body.belt, body.topic, body.exercises, body.course)
    )
    return {"ok": True, "count": len(saved), "exercises": saved}


class TooltipBody(BaseModel):
    belt: str
    topic: str
    tooltip: str
    course: str = cio.DEFAULT_COURSE


@app.patch("/api/catalog/tooltip")
def patch_tooltip(body: TooltipBody):
    _guard(lambda: cio.update_tooltip(body.belt, body.topic, body.tooltip, body.course))
    return {"ok": True}


# ── IA ───────────────────────────────────────────────────────────────────────

class AIBody(BaseModel):
    belt: str
    topic: str
    skill: str
    prompt: str
    subtype: str = "text"
    mode: str = "create"  # "create" | "edit"
    base: dict | None = None
    model: str | None = None
    course: str = cio.DEFAULT_COURSE


@app.post("/api/ai/generate")
async def ai_generate(body: AIBody):
    # Contexto: tooltip del tema + ejercicios existentes de ese (belt,topic,skill).
    try:
        catalog = cio.read_catalog(body.course)
        tooltip = ""
        for b in catalog.get("belts", []):
            if b["key"] == body.belt:
                for t in b.get("topics", []):
                    if t["key"] == body.topic:
                        tooltip = t.get("tooltip", "")
        all_ex = cio.read_exercises(body.belt, body.topic, body.course)
        existing = [e for e in all_ex if e.get("skill") == body.skill]
    except cio.ContentError as e:
        raise HTTPException(status_code=400, detail=str(e))

    try:
        exercise = await ai.generate_exercise(
            belt=body.belt,
            topic=body.topic,
            skill=body.skill,
            prompt=body.prompt,
            subtype=body.subtype,
            mode=body.mode,
            base=body.base,
            tooltip=tooltip,
            existing=existing,
            model=body.model,
        )
    except (RuntimeError, ValueError) as e:
        raise HTTPException(status_code=502, detail=str(e))

    # Asignar external_id si no viene o si es creación.
    if body.mode == "create" or not exercise.get("external_id"):
        exercise["external_id"] = cio.next_external_id(
            body.belt, body.topic, exercise.get("skill", body.skill), body.course
        )
    return {"exercise": exercise}


# ── Re-seed local ──────────────────────────────────────────────────────────

@app.post("/api/seed")
def reseed(course: str = cio.DEFAULT_COURSE):
    script = cio.BACKEND_DIR / "seed_content.py"
    proc = subprocess.run(
        [sys.executable, str(script), "--course", course],
        cwd=str(cio.BACKEND_DIR),
        capture_output=True,
        text=True,
    )
    return {
        "ok": proc.returncode == 0,
        "stdout": proc.stdout,
        "stderr": proc.stderr,
    }


@app.get("/api/health")
def health():
    return {"ok": True, "content_root": str(cio.CONTENT_ROOT)}
