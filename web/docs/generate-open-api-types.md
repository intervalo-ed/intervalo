# From web/, with backend running on :8000 — fastest dev flow

bun run types:api

# From web/, offline (reads backend/openapi.json)

bun run types:api:file

# From backend/, to refresh openapi.json after editing endpoints

.venv/bin/python scripts/dump_openapi.py
