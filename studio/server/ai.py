"""
ai.py — Proxy a OpenRouter para proponer/editar ejercicios.

La API key vive en studio/server/.env (OPENROUTER_API_KEY) y nunca llega al
frontend. Devuelve una propuesta de ejercicio en JSON; NO la guarda. El humano
revisa y aprueba en la UI antes de escribir al archivo.
"""
from __future__ import annotations

import json
import os
from pathlib import Path

import httpx
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent / ".env")

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
DEFAULT_MODEL = os.getenv("OPENROUTER_MODEL", "anthropic/claude-sonnet-4.5")

EXERCISE_SCHEMA = """{
  "external_id": "string  (lo asigna el servidor, podés omitirlo)",
  "belt": "string",
  "topic": "string",
  "skill": "string  (código de 4 letras: CLSF/LEXI/FORM/GRAF/RESL/ESTR/DERI/INTG/APLI)",
  "subtype": "text" | "graph",
  "question": "string  (enunciado, LaTeX inline con $...$)",
  "options": ["opción A", "opción B", "opción C", "opción D"],
  "correct_index": 0 | 1 | 2 | 3,
  "has_math": true | false,
  "feedback_correct": "string  (se muestra al acertar)",
  "feedback_incorrect": "string  (se muestra al fallar)",
  "graph_fn": null | "expresión JS de x, ej: 3*x + 2, sin(x), pow(x,2)",
  "graph_view": null | [xmin, xmax, ymin, ymax],
  "explanation": "string  (explicación extendida, admite $$...$$ y **negrita**)"
}"""

SYSTEM_PROMPT = """Sos un diseñador de contenido educativo de matemática para una plataforma de \
repaso espaciado dirigida a estudiantes universitarios de Análisis Matemático I en Latinoamérica.

Tu tarea es generar o modificar UN ejercicio de opción múltiple. Devolvés EXCLUSIVAMENTE un \
objeto JSON válido que cumpla este esquema (sin texto adicional, sin markdown, sin ```):

{schema}

Reglas estrictas:
- Exactamente 4 opciones en "options".
- Exactamente una opción correcta; "correct_index" (0..3) apunta a esa opción.
- Todo en español.
- LaTeX matemático con $...$ inline. En "explanation" podés usar $$...$$ para fórmulas centradas \
y **negrita**.
- Si "subtype" es "graph", incluí "graph_fn" (expresión de x con sintaxis JS: usá sin, cos, tan, \
pow, log, exp, abs, sqrt, PI, E) y "graph_view" como [xmin, xmax, ymin, ymax]. Si es "text", ambos \
deben ser null.
- "feedback_correct" y "feedback_incorrect" siempre presentes y útiles (explicá por qué).
- Los distractores (opciones incorrectas) deben ser plausibles y representar errores conceptuales \
comunes, no opciones absurdas.
- Respetá el cinturón, tema y habilidad indicados.
"""


def _build_user_prompt(belt, topic, skill, prompt, subtype, mode, base, tooltip, existing):
    lines = [
        f"Cinturón: {belt}",
        f"Tema: {topic}",
        f"Habilidad: {skill}",
        f"Subtipo deseado: {subtype}",
        "",
        "Contexto teórico del tema (tooltip del catálogo):",
        tooltip or "(sin tooltip)",
    ]
    if existing:
        lines += [
            "",
            "Ejercicios YA existentes de este (cinturón, tema, habilidad) — no los repitas, "
            "mantené un estilo coherente y variá el enfoque:",
            json.dumps(existing, ensure_ascii=False, indent=2),
        ]
    if mode == "edit" and base:
        lines += [
            "",
            "Ejercicio base a MODIFICAR (aplicá los cambios pedidos manteniendo lo demás):",
            json.dumps(base, ensure_ascii=False, indent=2),
        ]
    lines += [
        "",
        f"Instrucción del autor: {prompt}",
        "",
        "Devolvé SOLO el objeto JSON del ejercicio resultante.",
    ]
    return "\n".join(lines)


def _extract_json(content: str) -> dict:
    content = content.strip()
    # Tolerar fences ```json ... ``` por si el modelo los agrega.
    if content.startswith("```"):
        content = content.strip("`")
        if content.lstrip().lower().startswith("json"):
            content = content.lstrip()[4:]
    start = content.find("{")
    end = content.rfind("}")
    if start == -1 or end == -1:
        raise ValueError(f"La respuesta del modelo no contiene JSON: {content[:200]}")
    return json.loads(content[start : end + 1])


async def generate_exercise(
    *,
    belt: str,
    topic: str,
    skill: str,
    prompt: str,
    subtype: str = "text",
    mode: str = "create",
    base: dict | None = None,
    tooltip: str = "",
    existing: list[dict] | None = None,
    model: str | None = None,
) -> dict:
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        raise RuntimeError(
            "Falta OPENROUTER_API_KEY. Copiá studio/server/.env.example a "
            "studio/server/.env y completá la key."
        )

    payload = {
        "model": model or DEFAULT_MODEL,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT.format(schema=EXERCISE_SCHEMA)},
            {
                "role": "user",
                "content": _build_user_prompt(
                    belt, topic, skill, prompt, subtype, mode, base, tooltip, existing or []
                ),
            },
        ],
        "temperature": 0.7,
        "response_format": {"type": "json_object"},
    }
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:5174",
        "X-Title": "Intervalo Studio",
    }

    async with httpx.AsyncClient(timeout=120) as client:
        resp = await client.post(OPENROUTER_URL, headers=headers, json=payload)
        if resp.status_code != 200:
            raise RuntimeError(f"OpenRouter respondió {resp.status_code}: {resp.text[:300]}")
        data = resp.json()

    content = data["choices"][0]["message"]["content"]
    exercise = _extract_json(content)

    # Forzar coherencia con la selección del autor.
    exercise["belt"] = belt
    exercise["topic"] = topic
    exercise.setdefault("skill", skill)
    if exercise.get("subtype") not in ("text", "graph"):
        exercise["subtype"] = subtype
    return exercise
