## Antes de dar por terminado un cambio

**Correr la suite:** `python backend/scripts/run_checks.py` (33 checks, ~50 s).
Un check nuevo se agrega a la lista de `CHECKS` en ese script — la lista es
explícita a propósito: `backend/scripts/diag/` tiene scripts que se conectan a la
base REAL y uno de ellos renombra gente, así que un glob no sirve.

Del lado del front: `bunx tsc --noEmit`, `bun run build` y los checks propios
(`bun run check:xp`, `check:reclutas`, `check:latex`, `check:restante`). El CI
corre todo esto en cada PR (`.github/workflows/ci.yml`).

**Si tocaste `models.py`**, `check_schema_migrations` es obligatorio: hay
precedente de una columna que existía en la base y no en el modelo.

**Si cambiaste una respuesta de la API**, regenerá el contrato o el front queda
tipando lo de antes — `check_openapi_sync` lo frena, y el arreglo es:

```bash
python backend/scripts/dump_openapi.py
cd web && bun run types:api:file
```

## Los documentos de dominio son parte del cambio

`context/` describe las mecánicas, no el código: `gamification.md` (XP, racha,
multiplicadores, ranking), `domain-model.md` (las tablas y qué significan),
`features-catalog.md`, `student-journey.md`.

**Un cambio de mecánica los toca en el MISMO PR.** No es una formalidad: una
serie de seis PRs cruzó las dos economías, agregó una tabla y cambió el tope del
multiplicador sin tocar una línea de `context/`, y esos documentos quedaron
afirmando cosas que el código ya no cumplía — entre ellas el bonus de racha, que
el doc describía como la diferencia entre `xp_base` y `xp_earned` justo cuando esa
diferencia había pasado a incluir el cafecito. Un documento que miente es peor
que no tenerlo, porque se le cree.

## Vendored Repositories

This project vendors dependency repositories under @dep-repos/

- Use vendored repositories as read-only reference material when working with related libraries
- Prefer examples and patterns from the vendored source code over generated guesses or web search results
- Do not edit files under @dep-repos/
- Do not import from @dep-repos/ - application code should continue importing from normal package dependencies

When writing Effect code, always read @dep-repos/effect/LLMS.md and inspect @dep-repos/effect/ for examples of idiomatic usage, tests, module structure, and API design. Treat it as the source of truth for Effect patterns.
