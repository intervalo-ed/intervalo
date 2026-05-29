"""
Dump the FastAPI OpenAPI spec to backend/openapi.json.

Import-only (no server boot), so it's safe to run in CI or locally without a DB.
Run from the backend/ directory:

    .venv/bin/python scripts/dump_openapi.py
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

# Make backend/ importable so `from main import app` works regardless of cwd.
BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

from main import app  # noqa: E402


def main() -> None:
    schema = app.openapi()
    out_path = BACKEND_DIR / "openapi.json"
    out_path.write_text(json.dumps(schema, indent=2) + "\n")
    endpoints = sum(len(methods) for methods in schema.get("paths", {}).values())
    print(f"Wrote {out_path} ({endpoints} operations)")


if __name__ == "__main__":
    main()
