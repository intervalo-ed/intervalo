# Content authoring — puente

La autoría de contenido editorial (los ejercicios en sí) **no vive acá** — vive en `backend/content/`, que ya tiene su propia documentación extensa y específica. Esta página es solo el puente: cómo se conecta ese contenido al producto.

## Fuente de verdad para autoría

No duplicar, referenciar:
- `backend/content/agent-context.md` — meta-doc para el agente que ayuda a configurar `topic-context.md` por tema, alimentando un generador de contenido (Gemini "Gem"); documenta fallas conocidas del generador y sus fixes.
- `backend/content/authoring-context.md` — reglas de formato/campo/escritura de ejercicios, numeradas (R1, R4, …), fuente de verdad citada por el resto de docs de contenido.
- `backend/content/exercise-structure.md` — anatomía legible de un ejercicio (schema JSON: `question`, `options`, `correct_index`, `feedback_correct`/`feedback_incorrect`, `explanation`, `graph_*`, etc.).
- `backend/content/gamification-context.md` — el "por qué" de esas reglas, en términos de Octalysis y Kahneman System 1/2.

Validación: `python content/validate_content.py --course <curso> --topic <belt/unit/topic>` (ERROR = falla dura, WARNING = juicio humano).

## Cómo se conecta al producto

- Contenido vive en `backend/content/<course_slug>/<belt>/<unit>/<topic>/<TIPO>.json`.
- La estructura de curso (belts/units/topics) vive en `backend/content/<course_slug>/course.json`, cargada por `algorithm/domain.py::load_belt_catalogs` (ver [domain-model.md](domain-model.md)).
- `backend/seed_content.py` es el seeder idempotente: recorre las carpetas, infiere `belt`/`topic`/`exercise_type`/`external_id` de la ruta (no de campos del JSON), y hace upsert en la tabla `exercises` por `(course_id, external_id)`. CLI: `--all` / `--course <slug>` / `--prune`.
- `Exercise.reviewed` (flag editorial) viaja desde el JSON de autoría y se usa en `feedback_survey.py` para priorizar qué ítem lleva la micro-encuesta post-ejercicio (ver [features-catalog.md](features-catalog.md)).

Última verificación: 2026-08-01
