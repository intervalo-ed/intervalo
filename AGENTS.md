## Antes de dar por terminado un cambio

**Correr la suite:** `python backend/scripts/run_checks.py` (58 checks, ~4 min).
Un check nuevo se agrega a la lista de `CHECKS` en ese script — la lista es
explícita a propósito: `backend/scripts/diag/` tiene scripts que se conectan a la
base REAL y uno de ellos renombra gente, así que un glob no sirve.

Del lado del front (workspace de bun: `bun install` en la raíz): en `web/`,
`bunx tsc --noEmit`, `bun run build` y los checks que tocan código de la web
(`check:reclutas`, `check:restante`, …); en `packages/dx-core/`
—la lógica del juego, compartida con la app nativa—, `bun run typecheck` y los
checks de lógica pura (`check:xp`, `check:latex`, `check:teclado`, …); en
`mobile/` —la app de Expo—, `bun run typecheck` y `bunx expo-doctor` (este no
está en el CI). El CI corre todo lo demás en cada PR (`.github/workflows/ci.yml`).

**Si tocaste `models.py`**, `check_schema_migrations` es obligatorio: hay
precedente de una columna que existía en la base y no en el modelo.

**Si cambiaste una respuesta de la API**, regenerá el contrato o el front queda
tipando lo de antes — `check_openapi_sync` lo frena, y el arreglo es:

```bash
python backend/scripts/dump_openapi.py
cd web && bun run types:api:file
```
